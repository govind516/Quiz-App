package com.example.quizapp.live;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.example.quizapp.common.exception.ConflictException;
import com.example.quizapp.common.exception.ResourceNotFoundException;
import com.example.quizapp.live.dto.AnswerMessage;
import com.example.quizapp.live.dto.CreateLiveRoomResponse;
import com.example.quizapp.live.dto.FinalResultsPayload;
import com.example.quizapp.live.dto.LiveQuestionPayload;
import com.example.quizapp.live.dto.LiveRoomInfo;
import com.example.quizapp.live.dto.PlayerInfo;
import com.example.quizapp.attempt.service.AnswerGrader;
import com.example.quizapp.quiz.Option;
import com.example.quizapp.quiz.Question;
import com.example.quizapp.quiz.QuestionStatus;
import com.example.quizapp.quiz.Quiz;
import com.example.quizapp.quiz.repository.QuizRepository;
import com.example.quizapp.user.User;

import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@SuppressWarnings("null")
public class LiveRoomService {

	private static final int QUESTION_SECONDS = 20;
	private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

	enum Status {
		LOBBY, ACTIVE, ENDED
	}

	static class Player {
		final UUID id = UUID.randomUUID();
		final String nickname;
		int score;
		Set<Integer> answeredIndexes = ConcurrentHashMap.newKeySet();

		Player(String nickname) {
			this.nickname = nickname;
		}
	}

	static class Room {
		final String code;
		final Quiz quiz;
		final User host;
		volatile Status status = Status.LOBBY;
		final Map<UUID, Player> players = new ConcurrentHashMap<>();
		List<Question> questions = List.of();
		volatile int currentIndex = -1;
		volatile long questionDeadline;
		ScheduledFuture<?> task;

		Room(String code, Quiz quiz, User host) {
			this.code = code;
			this.quiz = quiz;
			this.host = host;
		}
	}

	private final Map<String, Room> rooms = new ConcurrentHashMap<>();
	private final QuizRepository quizRepository;
	private final SimpMessagingTemplate messagingTemplate;
	private final TaskScheduler liveRoomScheduler;

	public LiveRoomService(QuizRepository quizRepository,
			SimpMessagingTemplate messagingTemplate,
			TaskScheduler liveRoomScheduler) {
		this.quizRepository = quizRepository;
		this.messagingTemplate = messagingTemplate;
		this.liveRoomScheduler = liveRoomScheduler;
	}

	@Transactional
	public CreateLiveRoomResponse create(User host, Long quizId, boolean joinAsPlayer) {
		Quiz quiz = quizRepository.findByIdAndIsPublishedTrue(quizId)
				.orElseThrow(() -> new ResourceNotFoundException("Published quiz", quizId));
		// Initialize lazy collections within transaction so the in-memory Room can be used after detachment (open-in-view=false)
		quiz.getQuestions().forEach(q -> q.getOptions().size());
		List<Question> approved = quiz.getQuestions().stream()
				.filter(q -> q.getStatus() == QuestionStatus.APPROVED)
				.toList();
		if (approved.size() < 1) {
			throw new ConflictException("This quiz has no active questions");
		}
		Room room = new Room(generateCode(), quiz, host);
		UUID creatorPlayerId = null;
		if (joinAsPlayer) {
			Player hostPlayer = new Player(host.getName().trim());
			room.players.put(hostPlayer.id, hostPlayer);
			creatorPlayerId = hostPlayer.id;
		}
		rooms.put(room.code, room);
		broadcastLobby(room);
		return new CreateLiveRoomResponse(toInfo(room), creatorPlayerId == null ? null : creatorPlayerId.toString());
	}

	@Transactional(readOnly = true)
	public LiveRoomInfo info(String code) {
		return toInfo(room(code));
	}

	public UUID join(String code, String nickname) {
		Room room = room(code);
		if (room.status != Status.LOBBY) {
			throw new ConflictException("This game has already started");
		}
		boolean taken = room.players.values().stream()
				.anyMatch(p -> p.nickname.equalsIgnoreCase(nickname.trim()));
		if (taken) {
			throw new ConflictException("Nickname already taken in this room");
		}
		Player player = new Player(nickname.trim());
		room.players.put(player.id, player);
		broadcastLobby(room);
		return player.id;
	}

	@Transactional
	public void start(Long userId, String code) {
		Room room = room(code);
		if (!room.host.getId().equals(userId)) {
			throw new AccessDeniedException("Only the host can start the game");
		}
		if (room.status != Status.LOBBY) {
			throw new ConflictException("Game already started or ended");
		}
		List<Question> questions = new ArrayList<>(room.quiz.getQuestions().stream()
				.filter(q -> q.getStatus() == QuestionStatus.APPROVED)
				.toList());
		java.util.Collections.shuffle(questions);
		room.questions = questions;
		room.currentIndex = 0;
		room.status = Status.ACTIVE;
		pushQuestion(room);
	}

	public void handleAnswer(String code, AnswerMessage message) {
		Room room = rooms.get(normalize(code));
		if (room == null || room.status != Status.ACTIVE) {
			return;
		}
		Player player = message.playerId() == null ? null : room.players.get(message.playerId());
		if (player == null || message.questionIndex() != room.currentIndex) {
			return;
		}
		if (!player.answeredIndexes.add(room.currentIndex)) {
			return;
		}
		Question current = room.questions.get(room.currentIndex);
		if (!current.getId().equals(message.questionId())) {
			return;
		}
		double remainingFraction = Math.max(0, Math.min(1,
				(room.questionDeadline - System.currentTimeMillis()) / (QUESTION_SECONDS * 1000.0)));
		Set<Long> selected = message.selectedOptionIds() == null
				? Set.of()
				: Set.copyOf(message.selectedOptionIds());
		if (AnswerGrader.isCorrect(current, selected)) {
			player.score += pointsFor(remainingFraction);
		}
		messagingTemplate.convertAndSend("/topic/room/" + room.code, questionPayload(room));
	}

	static int pointsFor(double remainingFraction) {
		return (int) Math.round(500 + 500 * Math.max(0, Math.min(1, remainingFraction)));
	}

	private void pushQuestion(Room room) {
		room.questionDeadline = System.currentTimeMillis() + QUESTION_SECONDS * 1000L;
		messagingTemplate.convertAndSend("/topic/room/" + room.code, questionPayload(room));
		if (room.task != null) {
			room.task.cancel(false);
		}
		room.task = liveRoomScheduler.schedule(() -> advance(room),
				Instant.ofEpochMilli(room.questionDeadline));
	}

	private void advance(Room room) {
		try {
			if (room.status != Status.ACTIVE) {
				return;
			}
			if (room.currentIndex >= room.questions.size() - 1) {
				finish(room);
				return;
			}
			room.currentIndex++;
			pushQuestion(room);
		} catch (Exception e) {
			log.error("Failed to advance live room {}", room.code, e);
		}
	}

	private void finish(Room room) {
		room.status = Status.ENDED;
		List<PlayerInfo> ranked = scoreboard(room);
		messagingTemplate.convertAndSend("/topic/room/" + room.code,
				new FinalResultsPayload(room.code, room.quiz.getTitle(), ranked));
		liveRoomScheduler.schedule(() -> rooms.remove(room.code), Instant.now().plusSeconds(600));
	}

	private LiveQuestionPayload questionPayload(Room room) {
		Question question = room.questions.get(room.currentIndex);
		Map<Long, List<Long>> optionOrder = new java.util.HashMap<>();
		List<Long> ids = question.getOptions().stream().map(Option::getId).toList();
		optionOrder.put(question.getId(), ids);
		var publicQuestion = new com.example.quizapp.quiz.dto.QuestionPublicDto(
				question.getId(),
				question.getQuestionText(),
				question.getType(),
				question.getPoints(),
				ids.stream().map(id -> {
					Option o = question.getOptions().stream()
							.filter(opt -> opt.getId().equals(id)).findFirst().orElseThrow();
					return new com.example.quizapp.quiz.dto.OptionPublicDto(o.getId(), o.getOptionText());
				}).toList());
		return new LiveQuestionPayload(
				room.currentIndex,
				room.questions.size(),
				publicQuestion,
				room.questionDeadline,
				scoreboard(room));
	}

	private List<PlayerInfo> scoreboard(Room room) {
		return room.players.values().stream()
				.sorted(Comparator.comparingInt((Player p) -> p.score).reversed())
				.map(p -> new PlayerInfo(p.id.toString(), p.nickname, p.score,
						p.answeredIndexes.contains(room.currentIndex)))
				.toList();
	}

	private void broadcastLobby(Room room) {
		messagingTemplate.convertAndSend("/topic/room/" + room.code, toInfo(room));
	}

	private LiveRoomInfo toInfo(Room room) {
		return new LiveRoomInfo(
				room.code,
				room.quiz.getTitle(),
				room.host.getName(),
				room.status.name(),
				scoreboard(room));
	}

	private Room room(String code) {
		Room room = rooms.get(normalize(code));
		if (room == null) {
			throw new ResourceNotFoundException("Live room", code);
		}
		return room;
	}

	private static String normalize(String code) {
		return code == null ? "" : code.trim().toUpperCase();
	}

	private String generateCode() {
		java.security.SecureRandom random = new java.security.SecureRandom();
		StringBuilder sb = new StringBuilder(6);
		do {
			sb.setLength(0);
			for (int i = 0; i < 6; i++) {
				sb.append(CODE_ALPHABET.charAt(random.nextInt(CODE_ALPHABET.length())));
			}
		} while (rooms.containsKey(sb.toString()));
		return sb.toString();
	}
}

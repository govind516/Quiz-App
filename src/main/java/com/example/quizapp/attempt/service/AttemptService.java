package com.example.quizapp.attempt.service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.quizapp.attempt.AttemptAnswer;
import com.example.quizapp.attempt.AttemptStatus;
import com.example.quizapp.attempt.QuizAttempt;
import com.example.quizapp.attempt.dto.AttemptResultDto;
import com.example.quizapp.attempt.dto.QuestionResultDto;
import com.example.quizapp.attempt.dto.StartAttemptRequest;
import com.example.quizapp.attempt.dto.StartAttemptResponse;
import com.example.quizapp.attempt.dto.SubmitAnswerDto;
import com.example.quizapp.attempt.dto.SubmitAttemptRequest;
import com.example.quizapp.attempt.repository.AttemptAnswerRepository;
import com.example.quizapp.attempt.repository.QuizAttemptRepository;
import com.example.quizapp.auth.CurrentUserProvider;
import com.example.quizapp.common.exception.BadRequestException;
import com.example.quizapp.common.exception.ConflictException;
import com.example.quizapp.common.exception.ResourceNotFoundException;
import com.example.quizapp.quiz.Option;
import com.example.quizapp.quiz.Question;
import com.example.quizapp.quiz.QuestionStatus;
import com.example.quizapp.quiz.Quiz;
import com.example.quizapp.quiz.repository.QuestionRepository;
import com.example.quizapp.quiz.repository.QuizRepository;
import com.example.quizapp.user.User;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AttemptService {

	private static final int SUBMIT_BUFFER_SECONDS = 30;

	private final QuizAttemptRepository attemptRepository;
	private final AttemptAnswerRepository answerRepository;
	private final QuizRepository quizRepository;
	private final QuestionRepository questionRepository;
	private final CurrentUserProvider currentUserProvider;
	private final ObjectMapper objectMapper;
	private final com.example.quizapp.leaderboard.LeaderboardService leaderboardService;

	@Transactional
	public StartAttemptResponse start(Long quizId, StartAttemptRequest request) {
		Quiz quiz = quizRepository.findByIdAndIsPublishedTrue(quizId)
				.orElseThrow(() -> new ResourceNotFoundException("Published quiz", quizId));
		List<Question> questions = quiz.getQuestions().stream()
				.filter(q -> q.getStatus() == QuestionStatus.APPROVED)
				.sorted(Comparator.comparing(Question::getId))
				.toList();
		if (questions.isEmpty()) {
			throw new ConflictException("This quiz has no active questions yet");
		}

		User user = currentUserProvider.get().orElse(null);
		String guestSessionId = null;
		if (user == null) {
			guestSessionId = requireGuestSessionId(request == null ? null : request.guestSessionId());
		}

		Instant startedAt = Instant.now();
		QuizAttempt attempt = attemptRepository.save(QuizAttempt.builder()
				.user(user)
				.guestSessionId(guestSessionId)
				.quiz(quiz)
				.startedAt(startedAt)
				.status(AttemptStatus.IN_PROGRESS)
				.score(0)
				.build());

		long seed = attempt.getId();
		Random random = new Random(seed);
		List<Question> orderedQuestions = new ArrayList<>(questions);
		Map<Long, List<Long>> optionOrderMap = new LinkedHashMap<>();
		for (Question question : orderedQuestions) {
			List<Option> options = question.getOptions().stream()
					.sorted(Comparator.comparing(Option::getId))
					.collect(java.util.stream.Collectors.toCollection(ArrayList::new));
			java.util.Collections.shuffle(options, random);
			optionOrderMap.put(question.getId(), options.stream().map(Option::getId).toList());
		}
		try {
			attempt.setQuestionOrder(objectMapper.writeValueAsString(
					orderedQuestions.stream().map(Question::getId).toList()));
			attempt.setOptionOrder(objectMapper.writeValueAsString(optionOrderMap));
		} catch (JsonProcessingException e) {
			throw new IllegalStateException("Failed to persist attempt order", e);
		}
		attemptRepository.save(attempt);

		List<com.example.quizapp.quiz.dto.QuestionPublicDto> publicQuestions = new ArrayList<>();
		for (Question question : orderedQuestions) {
			publicQuestions.add(toPublicQuestion(question, new LinkedHashSet<>(optionOrderMap.get(question.getId()))));
		}
		return new StartAttemptResponse(
				attempt.getId(),
				quiz.getId(),
				quiz.getTitle(),
				quiz.getTimeLimitSec(),
				startedAt,
				startedAt.plusSeconds(quiz.getTimeLimitSec()),
				publicQuestions);
	}

	@Transactional
	public AttemptResultDto submit(Long attemptId, SubmitAttemptRequest request) {
		QuizAttempt attempt = getOwnedAttempt(attemptId, request == null ? null : request.guestSessionId());
		if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
			throw new ConflictException("This attempt has already been submitted");
		}
		Quiz quiz = attempt.getQuiz();
		int timeLimitSec = quiz.getTimeLimitSec();

		Set<Long> seenQuestionIds = new HashSet<>();
		for (SubmitAnswerDto answer : request.answers()) {
			if (!seenQuestionIds.add(answer.questionId())) {
				throw new BadRequestException("Duplicate answers for question " + answer.questionId());
			}
		}
		Map<Long, Question> quizQuestions = quiz.getQuestions().stream()
				.filter(q -> q.getStatus() == QuestionStatus.APPROVED)
				.collect(HashMap::new, (m, q) -> m.put(q.getId(), q), HashMap::putAll);

		for (SubmitAnswerDto answer : request.answers()) {
			Question question = quizQuestions.get(answer.questionId());
			if (question == null) {
				throw new BadRequestException("Question " + answer.questionId() + " is not part of this quiz");
			}
			Set<Long> validOptionIds = question.getOptions().stream()
					.map(Option::getId)
					.collect(java.util.stream.Collectors.toSet());
			Set<Long> selected = safeSelected(answer);
			if (!validOptionIds.containsAll(selected)) {
				throw new BadRequestException(
						"Selected options for question " + answer.questionId() + " are invalid");
			}
		}

		Instant deadline = attempt.getStartedAt().plusSeconds(timeLimitSec + SUBMIT_BUFFER_SECONDS);
		boolean expired = Instant.now().isAfter(deadline);

		List<AttemptAnswer> rows = new ArrayList<>();
		for (SubmitAnswerDto answer : request.answers()) {
			Question question = quizQuestions.get(answer.questionId());
			Set<Long> selected = safeSelected(answer);
			boolean correct = AnswerGrader.isCorrect(question, selected);
			rows.add(AttemptAnswer.builder()
					.attempt(attempt)
					.question(question)
					.selectedOptionIds(selected)
					.isCorrect(correct)
					.build());
		}
		answerRepository.saveAll(rows);

		int earnedPoints = rows.stream()
				.filter(AttemptAnswer::isCorrect)
				.mapToInt(row -> quizQuestions.get(row.getQuestion().getId()).getPoints())
				.sum();

		attempt.setScore(earnedPoints);
		if (expired) {
			attempt.setStatus(AttemptStatus.EXPIRED);
			attempt.setCompletedAt(attempt.getStartedAt().plusSeconds(timeLimitSec));
		} else {
			attempt.setStatus(AttemptStatus.SUBMITTED);
			attempt.setCompletedAt(Instant.now());
		}
		attemptRepository.saveAndFlush(attempt);

		if (attempt.getUser() != null && attempt.getStatus() == AttemptStatus.SUBMITTED) {
			long totalPoints = quizQuestions.values().stream()
					.mapToLong(Question::getPoints)
					.sum();
			double percentage = totalPoints > 0 ? (earnedPoints * 100.0 / totalPoints) : 0.0;
			leaderboardService.recordSubmission(
					attempt.getUser().getId(),
					quiz.getId(),
					quiz.getCategory().getId(),
					earnedPoints,
					percentage);
		}
		return buildResult(attempt);
	}

	@Transactional(readOnly = true)
	public AttemptResultDto result(Long attemptId, String guestSessionId) {
		QuizAttempt attempt = getOwnedAttempt(attemptId, guestSessionId);
		if (attempt.getStatus() == AttemptStatus.IN_PROGRESS) {
			throw new ConflictException("This attempt has not been submitted yet");
		}
		return buildResult(attempt);
	}

	@Transactional(readOnly = true)
	public List<AttemptResultDto> historyForUser(Long userId) {
		return attemptRepository.findAllByUserIdOrderByStartedAtDesc(userId).stream()
				.filter(a -> a.getStatus() != AttemptStatus.IN_PROGRESS)
				.map(this::buildResult)
				.toList();
	}

	private QuizAttempt getOwnedAttempt(Long attemptId, String guestSessionId) {
		QuizAttempt attempt = attemptRepository.findById(attemptId)
				.orElseThrow(() -> new ResourceNotFoundException("Attempt", attemptId));
		var currentOpt = currentUserProvider.get();
		if (attempt.getUser() != null) {
			if (currentOpt.isEmpty() || !currentOpt.get().getId().equals(attempt.getUser().getId())) {
				throw new AccessDeniedException("You do not have access to this attempt");
			}
		} else {
			if (guestSessionId == null || guestSessionId.isBlank()
					|| !guestSessionId.equals(attempt.getGuestSessionId())) {
				throw new AccessDeniedException("Invalid guest session for this attempt");
			}
		}
		return attempt;
	}

	private AttemptResultDto buildResult(QuizAttempt attempt) {
		Quiz quiz = attempt.getQuiz();
		List<AttemptAnswer> answers = answerRepository.findAllByAttemptId(attempt.getId());
		Map<Long, AttemptAnswer> answersByQuestionId = new HashMap<>();
		for (AttemptAnswer answer : answers) {
			answersByQuestionId.put(answer.getQuestion().getId(), answer);
		}

		List<Long> orderedQuestionIds = parseQuestionOrder(attempt);
		List<Question> orderedQuestions;
		if (orderedQuestionIds.isEmpty()) {
			orderedQuestions = quiz.getQuestions().stream()
					.sorted(Comparator.comparing(Question::getId))
					.toList();
		} else {
			Map<Long, Question> byId = questionRepository.findAllByIdIn(orderedQuestionIds).stream()
					.collect(HashMap::new, (m, q) -> m.put(q.getId(), q), HashMap::putAll);
			orderedQuestions = orderedQuestionIds.stream()
					.map(byId::get)
					.filter(java.util.Objects::nonNull)
					.toList();
		}

		long totalPoints = 0;
		List<QuestionResultDto> questionResults = new ArrayList<>();
		for (Question question : orderedQuestions) {
			totalPoints += question.getPoints();
			AttemptAnswer answer = answersByQuestionId.get(question.getId());
			Set<Long> correctOptionIds = question.getOptions().stream()
					.filter(Option::isCorrect)
					.map(Option::getId)
					.collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
			Set<Long> selected = answer == null ? Set.of() : answer.getSelectedOptionIds();
			boolean correct = answer != null && answer.isCorrect();
			int awarded = correct ? question.getPoints() : 0;
			questionResults.add(new QuestionResultDto(
					question.getId(),
					question.getQuestionText(),
					question.getType(),
					question.getPoints(),
					awarded,
					correct,
					selected,
					correctOptionIds,
					question.getExplanation()));
		}

		double percentage = totalPoints > 0
				? Math.round(attempt.getScore() * 1000.0 / totalPoints) / 10.0
				: 0.0;
		return new AttemptResultDto(
				attempt.getId(),
				quiz.getId(),
				quiz.getTitle(),
				attempt.getStatus(),
				attempt.getScore(),
				totalPoints,
				percentage,
				attempt.getStartedAt(),
				attempt.getCompletedAt(),
				Duration.between(attempt.getStartedAt(), attempt.getCompletedAt()).getSeconds(),
				questionResults);
	}

	private List<Long> parseQuestionOrder(QuizAttempt attempt) {
		if (attempt.getQuestionOrder() == null || attempt.getQuestionOrder().isBlank()) {
			return List.of();
		}
		try {
			return objectMapper.readValue(attempt.getQuestionOrder(), new TypeReference<List<Long>>() {
			});
		} catch (JsonProcessingException e) {
			return List.of();
		}
	}

	private com.example.quizapp.quiz.dto.QuestionPublicDto toPublicQuestion(
			Question question, Set<Long> optionOrder) {
		List<com.example.quizapp.quiz.dto.OptionPublicDto> options = new ArrayList<>();
		for (Long optionId : optionOrder) {
			for (Option option : question.getOptions()) {
				if (option.getId().equals(optionId)) {
					options.add(new com.example.quizapp.quiz.dto.OptionPublicDto(option.getId(), option.getOptionText()));
					break;
				}
			}
		}
		return new com.example.quizapp.quiz.dto.QuestionPublicDto(
				question.getId(),
				question.getQuestionText(),
				question.getType(),
				question.getPoints(),
				options);
	}

	private Set<Long> safeSelected(SubmitAnswerDto answer) {
		if (answer.selectedOptionIds() == null || answer.selectedOptionIds().isEmpty()) {
			return Set.of();
		}
		return new LinkedHashSet<>(answer.selectedOptionIds());
	}

	private String requireGuestSessionId(String raw) {
		if (raw == null || raw.isBlank()) {
			throw new BadRequestException(
					"guestSessionId is required when starting a quiz without an account");
		}
		try {
			return java.util.UUID.fromString(raw).toString();
		} catch (IllegalArgumentException e) {
			throw new BadRequestException("guestSessionId must be a valid UUID");
		}
	}
}

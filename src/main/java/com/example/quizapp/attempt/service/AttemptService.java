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
import org.springframework.util.StringUtils;

import com.example.quizapp.attempt.AttemptAnswer;
import com.example.quizapp.attempt.AttemptStatus;
import com.example.quizapp.attempt.QuizAttempt;
import com.example.quizapp.attempt.dto.AttemptResultDto;
import com.example.quizapp.attempt.dto.CustomQuizRequest;
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
import com.example.quizapp.leaderboard.LeaderboardService;
import com.example.quizapp.quiz.Option;
import com.example.quizapp.quiz.Question;
import com.example.quizapp.quiz.QuestionStatus;
import com.example.quizapp.quiz.Quiz;
import com.example.quizapp.quiz.dto.OptionPublicDto;
import com.example.quizapp.quiz.dto.QuestionPublicDto;
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
	private final LeaderboardService leaderboardService;

	@Transactional
	public StartAttemptResponse start(Long quizId, StartAttemptRequest request) {
		Quiz quiz = quizRepository.findByIdAndIsPublishedTrue(quizId)
				.orElseThrow(() -> new ResourceNotFoundException("Published quiz", quizId));
		List<Question> questions = quiz.getQuestions().stream()
				.filter(q -> q.getStatus() == QuestionStatus.APPROVED)
				.sorted(Comparator.comparing(q -> q.getId()))
				.toList();
		if (questions.isEmpty()) {
			throw new ConflictException("This quiz has no active questions yet");
		}

		User user = currentUserProvider.get().orElse(null);
		String guestSessionId = null;
		if (user == null) {
			guestSessionId = requireGuestSessionId(request == null ? null : request.guestSessionId());
		}
		return createAttempt(quiz.getTitle(), quiz.getTimeLimitSec(), questions, user, guestSessionId, quiz);
	}

	@Transactional
	public StartAttemptResponse startCustom(CustomQuizRequest request) {
		User user = currentUserProvider.requireCurrentUser();
		List<Question> pool = questionRepository.searchApproved(
				StringUtils.hasText(request.categorySlug()) ? request.categorySlug() : null,
				request.difficulty(),
				StringUtils.hasText(request.tagSlug()) ? request.tagSlug() : null);
		if (pool.isEmpty()) {
			throw new ConflictException("No approved questions match these filters yet");
		}
		java.util.Collections.shuffle(pool);
		int count = Math.min(request.count(), pool.size());
		List<Question> picked = new ArrayList<>(pool.subList(0, count)).stream()
				.sorted(Comparator.comparing(q -> q.getId()))
				.toList();
		String title = "Custom: "
				+ (StringUtils.hasText(request.categorySlug()) ? request.categorySlug() : "Mixed")
				+ " · " + count + " Qs";
		return createAttempt(title, request.timeLimitSec(), picked, user, null, null);
	}

	private StartAttemptResponse createAttempt(String title, int timeLimitSec,
			List<Question> questions, User user, String guestSessionId, Quiz quiz) {
		Instant startedAt = Instant.now();
		QuizAttempt attempt = attemptRepository.save(QuizAttempt.builder()
				.user(user)
				.guestSessionId(guestSessionId)
				.quiz(quiz)
				.title(title)
				.timeLimitSec(timeLimitSec)
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
					.sorted(Comparator.comparing(o -> o.getId()))
					.collect(java.util.stream.Collectors.toCollection(ArrayList::new));
			java.util.Collections.shuffle(options, random);
			optionOrderMap.put(question.getId(), options.stream().map(o -> o.getId()).toList());
		}
		try {
			attempt.setQuestionOrder(objectMapper.writeValueAsString(
					orderedQuestions.stream().map(q -> q.getId()).toList()));
			attempt.setOptionOrder(objectMapper.writeValueAsString(optionOrderMap));
		} catch (JsonProcessingException e) {
			throw new IllegalStateException("Failed to persist attempt order", e);
		}
		attemptRepository.save(attempt);

		List<QuestionPublicDto> publicQuestions = new ArrayList<>();
		for (Question question : orderedQuestions) {
			publicQuestions.add(toPublicQuestion(question, optionOrderMap.get(question.getId())));
		}
		return new StartAttemptResponse(
				attempt.getId(),
				quiz == null ? null : quiz.getId(),
				title,
				timeLimitSec,
				startedAt,
				startedAt.plusSeconds(timeLimitSec),
				publicQuestions);
	}

	@Transactional
	public AttemptResultDto submit(Long attemptId, SubmitAttemptRequest request) {
		if (request == null) {
			throw new BadRequestException("Request body with answers is required");
		}
		QuizAttempt attempt = getOwnedAttempt(attemptId, request.guestSessionId());
		if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
			throw new ConflictException("This attempt has already been submitted");
		}
		int timeLimitSec = attempt.getTimeLimitSec();

		Set<Long> seenQuestionIds = new HashSet<>();
		for (SubmitAnswerDto answer : request.answers()) {
			if (!seenQuestionIds.add(answer.questionId())) {
				throw new BadRequestException("Duplicate answers for question " + answer.questionId());
			}
		}
		List<Long> orderedIds = parseQuestionOrder(attempt);
		Map<Long, Question> quizQuestions = questionRepository.findAllByIdInWithOptions(
						orderedIds.isEmpty() ? List.of(-1L) : orderedIds).stream()
				.filter(q -> q.getStatus() == QuestionStatus.APPROVED)
				.collect(HashMap::new, (m, q) -> m.put(q.getId(), q), (m2, extra) -> m2.putAll(extra));

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
				.filter(a -> a.isCorrect())
				.mapToInt(row -> quizQuestions.get(row.getQuestion().getId()).getPoints())
				.sum();

		long totalPoints = quizQuestions.values().stream()
				.mapToLong(Question::getPoints)
				.sum();

		attempt.setScore(earnedPoints);
		attempt.setTotalPoints((int) totalPoints);
		if (expired) {
			attempt.setStatus(AttemptStatus.EXPIRED);
			attempt.setCompletedAt(attempt.getStartedAt().plusSeconds(timeLimitSec));
		} else {
			attempt.setStatus(AttemptStatus.SUBMITTED);
			attempt.setCompletedAt(Instant.now());
		}
		attemptRepository.saveAndFlush(attempt);

		Quiz quiz = attempt.getQuiz();
		if (attempt.getUser() != null && attempt.getStatus() == AttemptStatus.SUBMITTED && quiz != null) {
			double percentage = totalPoints > 0 ? (earnedPoints * 100.0 / totalPoints) : 0.0;
			leaderboardService.recordSubmission(
					attempt.getUser().getId(),
					quiz.getId(),
					quiz.getCategory().getId(),
					earnedPoints,
					percentage);
		}
		return buildResultFromSubmit(attempt, rows, quizQuestions, orderedIds);
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
			String provided = canonicalGuestSessionId(guestSessionId);
			if (!provided.equals(attempt.getGuestSessionId())) {
				throw new AccessDeniedException("Invalid guest session for this attempt");
			}
		}
		return attempt;
	}

	private String canonicalGuestSessionId(String raw) {
		if (raw == null || raw.isBlank()) {
			return "";
		}
		try {
			return java.util.UUID.fromString(raw.trim()).toString();
		} catch (IllegalArgumentException e) {
			return "";
		}
	}

	private AttemptResultDto buildResultFromSubmit(QuizAttempt attempt, List<AttemptAnswer> rows,
			Map<Long, Question> quizQuestions, List<Long> orderedIds) {
		Quiz quiz = attempt.getQuiz();
		Map<Long, AttemptAnswer> answersByQuestionId = new HashMap<>();
		for (AttemptAnswer answer : rows) {
			answersByQuestionId.put(answer.getQuestion().getId(), answer);
		}
		List<Question> orderedQuestions;
		if (orderedIds.isEmpty()) {
			orderedQuestions = quiz == null ? List.of() : quiz.getQuestions().stream()
					.sorted(Comparator.comparing(q -> q.getId()))
					.toList();
		} else {
			orderedQuestions = orderedIds.stream()
					.map(id -> quizQuestions.get(id))
					.filter(java.util.Objects::nonNull)
					.toList();
		}
		long totalPoints = 0;
		List<QuestionResultDto> questionResults = new ArrayList<>();
		for (Question question : orderedQuestions) {
			totalPoints += question.getPoints();
			AttemptAnswer answer = answersByQuestionId.get(question.getId());
			Set<Long> correctOptionIds = question.getOptions().stream()
					.filter(o -> o.isCorrect())
					.map(o -> o.getId())
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
				quiz == null ? null : quiz.getId(),
				attempt.getTitle(),
				attempt.getStatus(),
				attempt.getScore(),
				totalPoints,
				percentage,
				attempt.getStartedAt(),
				attempt.getCompletedAt(),
				Duration.between(attempt.getStartedAt(), attempt.getCompletedAt()).getSeconds(),
				questionResults);
	}

	private AttemptResultDto buildResult(QuizAttempt attempt) {
		Quiz quiz = attempt.getQuiz();
		List<AttemptAnswer> answers = answerRepository.findAllByAttemptIdWithOptions(attempt.getId());
		Map<Long, AttemptAnswer> answersByQuestionId = new HashMap<>();
		for (AttemptAnswer answer : answers) {
			answersByQuestionId.put(answer.getQuestion().getId(), answer);
		}

		List<Long> orderedQuestionIds = parseQuestionOrder(attempt);
		List<Question> orderedQuestions;
		if (orderedQuestionIds.isEmpty()) {
			orderedQuestions = quiz == null ? List.of() : quiz.getQuestions().stream()
					.sorted(Comparator.comparing(q -> q.getId()))
					.toList();
		} else {
			Map<Long, Question> byId = questionRepository.findAllByIdInWithOptions(orderedQuestionIds).stream()
					.collect(HashMap::new, (m, q) -> m.put(q.getId(), q), (m2, extra) -> m2.putAll(extra));
			orderedQuestions = orderedQuestionIds.stream()
					.map(id -> byId.get(id))
					.filter(java.util.Objects::nonNull)
					.toList();
		}

		long totalPoints = 0;
		List<QuestionResultDto> questionResults = new ArrayList<>();
		for (Question question : orderedQuestions) {
			totalPoints += question.getPoints();
			AttemptAnswer answer = answersByQuestionId.get(question.getId());
			Set<Long> correctOptionIds = question.getOptions().stream()
					.filter(o -> o.isCorrect())
					.map(o -> o.getId())
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
				quiz == null ? null : quiz.getId(),
				attempt.getTitle(),
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

	private QuestionPublicDto toPublicQuestion(Question question, List<Long> optionOrder) {
		Map<Long, Option> byId = new HashMap<>();
		for (Option option : question.getOptions()) {
			byId.put(option.getId(), option);
		}
		List<OptionPublicDto> options = new ArrayList<>();
		for (Long optionId : optionOrder) {
			Option option = byId.get(optionId);
			if (option != null) {
				options.add(new OptionPublicDto(option.getId(), option.getOptionText()));
			}
		}
		return new QuestionPublicDto(
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

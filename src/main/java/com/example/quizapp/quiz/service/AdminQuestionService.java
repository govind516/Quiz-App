package com.example.quizapp.quiz.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.example.quizapp.common.exception.BadRequestException;
import com.example.quizapp.common.exception.ConflictException;
import com.example.quizapp.common.exception.ResourceNotFoundException;
import com.example.quizapp.quiz.Option;
import com.example.quizapp.quiz.Question;
import com.example.quizapp.quiz.QuestionStatus;
import com.example.quizapp.quiz.QuestionType;
import com.example.quizapp.quiz.Quiz;
import com.example.quizapp.quiz.dto.BulkUploadResultDto;
import com.example.quizapp.quiz.dto.GenerateQuestionsRequest;
import com.example.quizapp.quiz.dto.GeneratedQuestionsDto;
import com.example.quizapp.quiz.dto.OptionAdminDto;
import com.example.quizapp.quiz.dto.OptionRequest;
import com.example.quizapp.quiz.dto.QuestionAdminDto;
import com.example.quizapp.quiz.dto.QuestionUpsertRequest;
import com.example.quizapp.quiz.repository.CategoryRepository;
import com.example.quizapp.quiz.repository.QuestionRepository;
import com.example.quizapp.quiz.repository.QuizRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class AdminQuestionService {

	private final QuestionRepository questionRepository;
	private final QuizRepository quizRepository;
	private final CategoryRepository categoryRepository;
	private final QuizService quizService;
	private final CsvQuestionParser csvQuestionParser;
	private final GeminiClient geminiClient;
	private final QuestionBatchService questionBatchService;
	private final com.example.quizapp.settings.SettingsService settingsService;

	@Transactional(readOnly = true)
	public List<QuestionAdminDto> listByQuiz(Long quizId) {
		var quiz = quizRepository.findById(quizId)
				.orElseThrow(() -> new ResourceNotFoundException("Quiz", quizId));
		return quiz.getQuestions().stream().map(this::toAdminDto).toList();
	}

	@Transactional
	public QuestionAdminDto create(Long quizId, QuestionUpsertRequest request) {
		return quizService.addQuestion(quizId, request);
	}

	@Transactional
	public QuestionAdminDto update(Long id, QuestionUpsertRequest request) {
		Question question = questionRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Question", id));
		if (request.questionText() != null && !request.questionText().isBlank()) {
			question.setQuestionText(request.questionText());
		}
		if (request.type() != null) {
			question.setType(request.type());
		}
		if (request.points() != null && request.points() >= 1) {
			question.setPoints(request.points());
		}
		if (request.explanation() != null) {
			question.setExplanation(request.explanation());
		}
		if (request.status() != null) {
			question.setStatus(request.status());
		}
		if (request.options() != null) {
			validateOptions(question.getType(), request.options());
			question.getOptions().clear();
			for (OptionRequest or : request.options()) {
				question.getOptions().add(Option.builder()
						.question(question)
						.optionText(or.optionText())
						.isCorrect(or.isCorrect())
						.build());
			}
		}
		return toAdminDto(questionRepository.save(question));
	}

	@Transactional
	public void delete(Long id) {
		if (!questionRepository.existsById(id)) {
			throw new ResourceNotFoundException("Question", id);
		}
		questionRepository.deleteById(id);
	}

	@Transactional
	public QuestionAdminDto approve(Long id) {
		Question question = questionRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Question", id));
		question.setStatus(QuestionStatus.APPROVED);
		Question saved = questionRepository.save(question);
		autoPublishIfNeeded(saved.getQuiz());
		return toAdminDto(saved);
	}

	private void autoPublishIfNeeded(Quiz quiz) {
		if (quiz != null && !quiz.isPublished()) {
			quiz.setPublished(true);
			quizRepository.save(quiz);
		}
	}

	@Transactional
	public QuestionAdminDto reject(Long id) {
		Question question = questionRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Question", id));
		question.setStatus(QuestionStatus.REJECTED);
		return toAdminDto(questionRepository.save(question));
	}

	@Transactional(readOnly = true)
	public List<QuestionAdminDto> listPending() {
		return questionRepository.findAllByStatus(QuestionStatus.PENDING_REVIEW).stream()
				.map(this::toAdminDto)
				.toList();
	}

	@Transactional
	public BulkUploadResultDto bulkImport(Long quizId, MultipartFile file) {
		Quiz quiz = quizRepository.findById(quizId)
				.orElseThrow(() -> new ResourceNotFoundException("Quiz", quizId));
		if (file == null || file.isEmpty()) {
			throw new BadRequestException("Please upload a non-empty CSV file");
		}
		List<CsvQuestionParser.RowResult> rows;
		try {
			rows = csvQuestionParser.parse(file.getInputStream());
		} catch (java.io.IOException e) {
			throw new BadRequestException("Could not read the uploaded file");
		}
		if (rows.isEmpty()) {
			throw new BadRequestException("No data rows found in the CSV");
		}

		int imported = 0;
		List<BulkUploadResultDto.FailedRow> failures = new ArrayList<>();
		for (CsvQuestionParser.RowResult row : rows) {
			if (row.error() != null) {
				failures.add(new BulkUploadResultDto.FailedRow(row.lineNumber(), row.error()));
				continue;
			}
			CsvQuestionParser.ParsedQuestion parsed = row.question();
			Question question = Question.builder()
					.quiz(quiz)
					.questionText(parsed.questionText())
					.type(parsed.type())
					.points(parsed.points())
					.explanation(parsed.explanation())
					.status(QuestionStatus.APPROVED)
					.build();
			for (CsvQuestionParser.CsvOption opt : parsed.options()) {
				question.getOptions().add(Option.builder()
						.question(question)
						.optionText(opt.text())
						.isCorrect(opt.correct())
						.build());
			}
			questionRepository.save(question);
			imported++;
		}
		return new BulkUploadResultDto(imported, failures);
	}

	@Transactional
	public GeneratedQuestionsDto generate(Long quizId, GenerateQuestionsRequest request) {
		long totalStart = System.nanoTime();
		long t;
		if (!settingsService.isAiGenerationEnabled()) {
			throw new ConflictException("AI generation is disabled in admin settings");
		}
		t = System.nanoTime();
		Quiz quiz;
		if (request.categoryId() != null) {
			var category = categoryRepository.findById(request.categoryId())
					.orElseThrow(() -> new ResourceNotFoundException("Category", request.categoryId()));
			var existing = quizRepository.findFirstByCategoryIdOrderByIdAsc(category.getId());
			if (existing.isPresent()) {
				quiz = existing.get();
			} else {
				var difficulty = request.difficulty() != null
						? mapToQuizDifficulty(request.difficulty())
						: com.example.quizapp.quiz.Difficulty.BEGINNER;
				quiz = Quiz.builder()
						.title(category.getName())
						.description("Auto-created for " + category.getName() + " — AI generated questions")
						.category(category)
						.difficulty(difficulty)
						.timeLimitSec(600)
						.isPublished(false)
						.build();
				quiz = quizRepository.save(quiz);
			}
		} else {
			if (quizId == null) {
				throw new BadRequestException("categoryId is required for AI generation");
			}
			quiz = quizRepository.findById(quizId)
					.orElseThrow(() -> new ResourceNotFoundException("Quiz", quizId));
		}
		long lookupMs = (System.nanoTime() - t) / 1_000_000;

		t = System.nanoTime();
		String prompt = buildPrompt(request);
		long promptMs = (System.nanoTime() - t) / 1_000_000;

		t = System.nanoTime();
		String raw = geminiClient.generateJson(prompt);
		long geminiMs = (System.nanoTime() - t) / 1_000_000;

		t = System.nanoTime();
		List<GeminiResponseParser.AiQuestion> aiQuestions = GeminiResponseParser.parse(raw);
		long parseMs = (System.nanoTime() - t) / 1_000_000;

		t = System.nanoTime();
		List<Question> batch = new ArrayList<>();
		int discarded = 0;
		for (GeminiResponseParser.AiQuestion ai : aiQuestions) {
			if (batch.size() >= request.count()) {
				break;
			}
			if (!isValidAiQuestion(ai, request.questionType())) {
				discarded++;
				continue;
			}
			Question question = Question.builder()
					.quiz(quiz)
					.questionText(ai.questionText())
					.type(ai.type() == null ? request.questionType() : ai.type())
					.points(ai.points() == null || ai.points() < 1 ? 1 : Math.min(ai.points(), 100))
					.explanation(ai.explanation())
					.status(QuestionStatus.PENDING_REVIEW)
					.build();
			for (GeminiResponseParser.AiOption opt : ai.options()) {
				question.getOptions().add(Option.builder()
						.question(question)
						.optionText(opt.text())
						.isCorrect(opt.isCorrect())
						.build());
			}
			batch.add(question);
		}
		if (!batch.isEmpty()) {
			questionBatchService.batchInsert(batch);
		}
		List<QuestionAdminDto> created = batch.stream().map(this::toAdminDto).toList();
		long dbMs = (System.nanoTime() - t) / 1_000_000;
		long totalMs = (System.nanoTime() - totalStart) / 1_000_000;
		log.info("generate timings quizId={} count={} lookup={}ms prompt={}ms geminiHttp={}ms parse={}ms dbWrite={}ms totalService={}ms (geminiCalls=1 batchSize={} rawLen={})",
				quizId, request.count(), lookupMs, promptMs, geminiMs, parseMs, dbMs, totalMs, aiQuestions.size(), raw.length());
		return new GeneratedQuestionsDto(created.size(), discarded, created);
	}

	private boolean isValidAiQuestion(GeminiResponseParser.AiQuestion ai, QuestionType fallbackType) {
		QuestionType type = ai.type() == null ? fallbackType : ai.type();
		if (!StringUtils.hasText(ai.questionText()) || ai.options() == null || ai.options().size() < 2) {
			return false;
		}
		long correct = ai.options().stream().filter(o -> o.isCorrect()).count();
		if (correct == 0) {
			return false;
		}
		if ((type == QuestionType.MCQ || type == QuestionType.TRUE_FALSE) && correct > 1) {
			return false;
		}
		return type != QuestionType.TRUE_FALSE || ai.options().size() == 2;
	}

	private String buildPrompt(GenerateQuestionsRequest request) {
		String difficulty = request.difficulty() == null
				? "intermediate"
				: request.difficulty().name().toLowerCase();
		String typeRule = switch (request.questionType()) {
			case MCQ -> "\"type\":\"MCQ\" with exactly 4 options and exactly one option having \"isCorrect\":true";
			case TRUE_FALSE -> "\"type\":\"TRUE_FALSE\" with exactly two options (\"True\" and \"False\") and exactly one correct";
			case MULTI_SELECT -> "\"type\":\"MULTI_SELECT\" with 4-5 options where one or more options have \"isCorrect\":true";
		};
		return """
				You are an expert IT exam author. Create exactly %d %s-level quiz questions about "%s" for IT students and professionals.
				Each question must follow this rule: %s.
				Every question must include a short explanation of the correct answer(s).
				Vary the questions; avoid duplicates or trivial variations.
				Return STRICT VALID JSON ONLY - a bare JSON array, no markdown fences, no commentary:
				[{"questionText":"...","type":"MCQ","points":1,"explanation":"...","options":[{"text":"...","isCorrect":false}]}]
				""".formatted(request.count(), difficulty, request.topic(), typeRule);
	}

	private com.example.quizapp.quiz.Difficulty mapToQuizDifficulty(com.example.quizapp.quiz.Difficulty d) {
		return d;
	}

	private void validateOptions(QuestionType type, List<OptionRequest> options) {
		if (options.size() < 2) {
			throw new BadRequestException("A question needs at least two options");
		}
		long correct = options.stream().filter(o -> o.isCorrect()).count();
		if (correct == 0) {
			throw new BadRequestException("At least one option must be marked correct");
		}
		if ((type == QuestionType.MCQ || type == QuestionType.TRUE_FALSE) && correct > 1) {
			throw new BadRequestException(type + " allows exactly one correct option");
		}
	}

	private QuestionAdminDto toAdminDto(Question question) {
		List<OptionAdminDto> options = new ArrayList<>();
		for (Option o : question.getOptions()) {
			options.add(new OptionAdminDto(o.getId(), o.getOptionText(), o.isCorrect()));
		}
		return new QuestionAdminDto(
				question.getId(),
				question.getQuiz().getId(),
				question.getQuestionText(),
				question.getType(),
				question.getPoints(),
				question.getExplanation(),
				question.getStatus(),
				options);
	}
}

package com.example.quizapp.quiz.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.example.quizapp.auth.CurrentUserProvider;
import com.example.quizapp.common.exception.BadRequestException;
import com.example.quizapp.common.exception.ResourceNotFoundException;
import com.example.quizapp.quiz.Category;
import com.example.quizapp.quiz.Difficulty;
import com.example.quizapp.quiz.Option;
import com.example.quizapp.quiz.QuestionStatus;
import com.example.quizapp.quiz.QuestionType;
import com.example.quizapp.quiz.Quiz;
import com.example.quizapp.quiz.Tag;
import com.example.quizapp.quiz.dto.OptionRequest;
import com.example.quizapp.quiz.dto.QuestionAdminDto;
import com.example.quizapp.quiz.dto.OptionAdminDto;
import com.example.quizapp.quiz.dto.QuizCreateRequest;
import com.example.quizapp.quiz.dto.QuizDto;
import com.example.quizapp.quiz.dto.QuizUpdateRequest;
import com.example.quizapp.quiz.repository.CategoryRepository;
import com.example.quizapp.quiz.repository.QuestionRepository;
import com.example.quizapp.quiz.repository.QuizRepository;
import com.example.quizapp.quiz.repository.TagRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class QuizService {

	private final QuizRepository quizRepository;
	private final CategoryRepository categoryRepository;
	private final TagRepository tagRepository;
	private final QuestionRepository questionRepository;
	private final CurrentUserProvider currentUserProvider;

	@Transactional(readOnly = true)
	public List<QuizDto> browse(String categorySlug, Difficulty difficulty, String tagSlug) {
		return quizRepository
				.searchPublished(
						StringUtils.hasText(categorySlug) ? categorySlug : null,
						difficulty,
						StringUtils.hasText(tagSlug) ? tagSlug : null)
				.stream()
				.map(this::toDto)
				.toList();
	}

	@Transactional(readOnly = true)
	public List<QuizDto> listAllForAdmin() {
		return quizRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id"))
				.stream()
				.map(this::toDto)
				.toList();
	}

	@Transactional(readOnly = true)
	public QuizDto getDetail(Long id) {
		Quiz quiz = quizRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Quiz", id));
		if (!quiz.isPublished() && !currentUserProvider.isAdmin()) {
			throw new ResourceNotFoundException("Quiz", id);
		}
		return toDto(quiz);
	}

	@Transactional
	public QuizDto create(QuizCreateRequest request) {
		Category category = categoryRepository.findById(request.categoryId())
				.orElseThrow(() -> new ResourceNotFoundException("Category", request.categoryId()));
		Quiz quiz = Quiz.builder()
				.title(request.title().trim())
				.description(request.description())
				.category(category)
				.difficulty(request.difficulty())
				.timeLimitSec(request.timeLimitSec())
				.isPublished(request.isPublished())
				.createdBy(currentUserProvider.get().orElse(null))
				.tags(new LinkedHashSet<>())
				.build();
		resolveTags(request.tags()).forEach(tag -> quiz.getTags().add(tag));
		for (var qr : safeList(request.questions())) {
			quiz.getQuestions().add(buildQuestion(qr));
		}
		return toDto(quizRepository.save(quiz));
	}

	@Transactional
	public QuizDto update(Long id, QuizUpdateRequest request) {
		Quiz quiz = quizRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Quiz", id));
		if (StringUtils.hasText(request.title())) {
			quiz.setTitle(request.title().trim());
		}
		if (request.description() != null) {
			quiz.setDescription(request.description());
		}
		if (request.categoryId() != null) {
			Category category = categoryRepository.findById(request.categoryId())
					.orElseThrow(() -> new ResourceNotFoundException("Category", request.categoryId()));
			quiz.setCategory(category);
		}
		if (request.difficulty() != null) {
			quiz.setDifficulty(request.difficulty());
		}
		if (request.timeLimitSec() != null) {
			quiz.setTimeLimitSec(request.timeLimitSec());
		}
		if (request.isPublished() != null) {
			quiz.setPublished(request.isPublished());
		}
		if (request.tags() != null) {
			Set<Tag> tags = resolveTags(request.tags());
			quiz.getTags().clear();
			quiz.getTags().addAll(tags);
		}
		return toDto(quizRepository.save(quiz));
	}

	@Transactional
	public QuestionAdminDto addQuestion(Long quizId,
			com.example.quizapp.quiz.dto.QuestionUpsertRequest request) {
		Quiz quiz = quizRepository.findById(quizId)
				.orElseThrow(() -> new ResourceNotFoundException("Quiz", quizId));
		var question = buildQuestion(toQuestionRequest(request));
		question.setQuiz(quiz);
		quiz.getQuestions().add(question);
		quizRepository.save(quiz);
		return toAdminDto(question);
	}

	private com.example.quizapp.quiz.dto.QuestionRequest toQuestionRequest(
			com.example.quizapp.quiz.dto.QuestionUpsertRequest r) {
		return new com.example.quizapp.quiz.dto.QuestionRequest(
				r.questionText(), r.type(), r.points(), r.explanation(), r.options());
	}

	private com.example.quizapp.quiz.Question buildQuestion(com.example.quizapp.quiz.dto.QuestionRequest qr) {
		validateOptions(qr.type(), qr.options());
		var question = com.example.quizapp.quiz.Question.builder()
				.questionText(qr.questionText())
				.type(qr.type())
				.points(qr.points() == null || qr.points() < 1 ? 1 : qr.points())
				.explanation(qr.explanation())
				.status(QuestionStatus.APPROVED)
				.build();
		for (OptionRequest or : qr.options()) {
			question.getOptions().add(com.example.quizapp.quiz.Option.builder()
					.question(question)
					.optionText(or.optionText())
					.isCorrect(or.isCorrect())
					.build());
		}
		return question;
	}

	private void validateOptions(QuestionType type, List<OptionRequest> options) {
		long correctCount = options.stream().filter(OptionRequest::isCorrect).count();
		if (correctCount == 0) {
			throw new BadRequestException("At least one option must be marked correct");
		}
		if ((type == QuestionType.MCQ || type == QuestionType.TRUE_FALSE) && correctCount > 1) {
			throw new BadRequestException(type + " allows exactly one correct option");
		}
		if (type == QuestionType.TRUE_FALSE && options.size() != 2) {
			throw new BadRequestException("TRUE_FALSE questions must have exactly two options");
		}
	}

	private java.util.Set<Tag> resolveTags(List<String> slugs) {
		java.util.Set<Tag> tags = new LinkedHashSet<>();
		for (String slug : safeList(slugs)) {
			String normalized = slugify(slug);
			Tag tag = tagRepository.findBySlug(normalized).orElseGet(() -> tagRepository.save(Tag.builder()
					.name(slug.trim())
					.slug(normalized)
					.build()));
			tags.add(tag);
		}
		return tags;
	}

	private QuizDto toDto(Quiz quiz) {
		return new QuizDto(
				quiz.getId(),
				quiz.getTitle(),
				quiz.getDescription(),
				quiz.getCategory().getId(),
				quiz.getCategory().getName(),
				quiz.getCategory().getSlug(),
				quiz.getDifficulty(),
				quiz.getTimeLimitSec(),
				quiz.isPublished(),
				(int) questionRepository.countByQuizIdAndStatus(quiz.getId(), QuestionStatus.APPROVED),
				quiz.getTags().stream().map(Tag::getSlug).collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new)),
				quiz.getCreatedBy() == null ? null : quiz.getCreatedBy().getName(),
				quiz.getCreatedAt());
	}

	private QuestionAdminDto toAdminDto(com.example.quizapp.quiz.Question question) {
		return new QuestionAdminDto(
				question.getId(),
				question.getQuiz().getId(),
				question.getQuestionText(),
				question.getType(),
				question.getPoints(),
				question.getExplanation(),
				question.getStatus(),
				question.getOptions().stream()
						.map(o -> new OptionAdminDto(o.getId(), o.getOptionText(), o.isCorrect()))
						.toList());
	}

	static <T> List<T> safeList(List<T> list) {
		return list == null ? List.of() : list;
	}

	static String slugify(String input) {
		return input.trim().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
	}
}

package com.example.quizapp.quiz.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.quizapp.common.exception.BadRequestException;
import com.example.quizapp.common.exception.ResourceNotFoundException;
import com.example.quizapp.quiz.Option;
import com.example.quizapp.quiz.Question;
import com.example.quizapp.quiz.QuestionStatus;
import com.example.quizapp.quiz.QuestionType;
import com.example.quizapp.quiz.dto.OptionAdminDto;
import com.example.quizapp.quiz.dto.OptionRequest;
import com.example.quizapp.quiz.dto.QuestionAdminDto;
import com.example.quizapp.quiz.dto.QuestionUpsertRequest;
import com.example.quizapp.quiz.repository.QuestionRepository;
import com.example.quizapp.quiz.repository.QuizRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminQuestionService {

	private final QuestionRepository questionRepository;
	private final QuizRepository quizRepository;
	private final QuizService quizService;

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
		return toAdminDto(questionRepository.save(question));
	}

	private void validateOptions(QuestionType type, List<OptionRequest> options) {
		if (options.size() < 2) {
			throw new BadRequestException("A question needs at least two options");
		}
		long correct = options.stream().filter(OptionRequest::isCorrect).count();
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

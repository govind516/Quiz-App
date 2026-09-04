package com.example.quizapp.attempt.service;

import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Component;

import com.example.quizapp.attempt.QuizAttempt;
import com.example.quizapp.quiz.QuestionStatus;
import com.example.quizapp.quiz.repository.QuestionRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Resolves the total points available for an attempt.
 *
 * Prefers the total_points snapshot captured at submit time. Falls back to
 * deriving from current data: the linked quiz's approved questions, or — for
 * custom quizzes without a linked quiz — the attempt's stored question order.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AttemptPointsResolver {

	private final QuestionRepository questionRepository;
	private final ObjectMapper objectMapper;

	public int resolveTotalPoints(QuizAttempt attempt) {
		if (attempt.getTotalPoints() != null) {
			return attempt.getTotalPoints();
		}
		int derived = deriveTotalPoints(attempt);
		log.debug("Derived total points {} for attempt {} without snapshot", derived, attempt.getId());
		return derived;
	}

	public List<Long> parseQuestionOrder(QuizAttempt attempt) {
		if (attempt.getQuestionOrder() == null || attempt.getQuestionOrder().isBlank()) {
			return List.of();
		}
		try {
			return objectMapper.readValue(attempt.getQuestionOrder(), new TypeReference<List<Long>>() {
			});
		} catch (Exception e) {
			return List.of();
		}
	}

	private int deriveTotalPoints(QuizAttempt attempt) {
		if (attempt.getQuiz() != null) {
			return (int) questionRepository.sumPointsByQuizId(attempt.getQuiz().getId());
		}
		List<Long> questionIds = parseQuestionOrder(attempt);
		if (questionIds.isEmpty()) {
			return 0;
		}
		return (int) questionRepository.findAllByIdIn(questionIds).stream()
				.filter(q -> q != null && q.getStatus() == QuestionStatus.APPROVED)
				.mapToLong(q -> Objects.requireNonNull(q).getPoints())
				.sum();
	}
}

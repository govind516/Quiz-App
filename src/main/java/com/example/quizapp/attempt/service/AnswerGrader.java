package com.example.quizapp.attempt.service;

import java.util.Set;
import java.util.stream.Collectors;

import com.example.quizapp.quiz.Question;

public final class AnswerGrader {

	private AnswerGrader() {
	}

	public static boolean isCorrect(Question question, Set<Long> selectedOptionIds) {
		Set<Long> correctIds = question.getOptions().stream()
				.filter(o -> o.isCorrect())
				.map(o -> o.getId())
				.collect(Collectors.toSet());
		if (correctIds.isEmpty() || selectedOptionIds == null || selectedOptionIds.isEmpty()) {
			return false;
		}
		return selectedOptionIds.equals(correctIds);
	}
}

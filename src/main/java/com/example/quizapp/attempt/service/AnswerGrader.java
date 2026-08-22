package com.example.quizapp.attempt.service;

import java.util.Set;
import java.util.stream.Collectors;

import com.example.quizapp.quiz.Option;
import com.example.quizapp.quiz.Question;

public final class AnswerGrader {

	private AnswerGrader() {
	}

	public static boolean isCorrect(Question question, Set<Long> selectedOptionIds) {
		Set<Long> correctIds = question.getOptions().stream()
				.filter(Option::isCorrect)
				.map(Option::getId)
				.collect(Collectors.toSet());
		if (correctIds.isEmpty() || selectedOptionIds == null || selectedOptionIds.isEmpty()) {
			return false;
		}
		return selectedOptionIds.equals(correctIds);
	}
}

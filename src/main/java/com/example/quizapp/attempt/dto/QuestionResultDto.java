package com.example.quizapp.attempt.dto;

import java.util.Set;

import com.example.quizapp.quiz.QuestionType;

public record QuestionResultDto(
		Long questionId,
		String questionText,
		QuestionType type,
		int points,
		int awardedPoints,
		boolean correct,
		Set<Long> selectedOptionIds,
		Set<Long> correctOptionIds,
		String explanation) {
}

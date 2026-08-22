package com.example.quizapp.quiz.dto;

import java.util.List;

import com.example.quizapp.quiz.QuestionType;

public record QuestionPublicDto(
		Long questionId,
		String questionText,
		QuestionType type,
		int points,
		List<OptionPublicDto> options) {
}

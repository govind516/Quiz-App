package com.example.quizapp.quiz.dto;

import java.util.List;

import com.example.quizapp.quiz.QuestionStatus;
import com.example.quizapp.quiz.QuestionType;

public record QuestionAdminDto(
		Long questionId,
		Long quizId,
		String questionText,
		QuestionType type,
		int points,
		String explanation,
		QuestionStatus status,
		List<OptionAdminDto> options) {
}

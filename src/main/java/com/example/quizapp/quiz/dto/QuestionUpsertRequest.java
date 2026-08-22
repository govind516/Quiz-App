package com.example.quizapp.quiz.dto;

import java.util.List;

import com.example.quizapp.quiz.QuestionStatus;
import com.example.quizapp.quiz.QuestionType;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record QuestionUpsertRequest(
		@NotBlank String questionText,
		@NotNull QuestionType type,
		@Min(1) @Max(100) Integer points,
		@Size(max = 2000) String explanation,
		QuestionStatus status,
		@Valid List<OptionRequest> options) {
}

package com.example.quizapp.quiz.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record QuizCreateRequest(
		@NotBlank @Size(max = 200) String title,
		@Size(max = 1000) String description,
		@NotNull Long categoryId,
		@NotNull com.example.quizapp.quiz.Difficulty difficulty,
		@NotNull @Min(10) @Max(7200) int timeLimitSec,
		boolean isPublished,
		@Size(max = 20) List<@NotBlank String> tags,
		@Valid List<QuestionRequest> questions) {
}

package com.example.quizapp.quiz.dto;

import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record QuizUpdateRequest(
		@Size(max = 200) String title,
		@Size(max = 1000) String description,
		Long categoryId,
		@Size(max = 200) String topic,
		com.example.quizapp.quiz.Difficulty difficulty,
		@Min(10) @Max(7200) Integer timeLimitSec,
		Boolean isPublished,
		@Size(max = 20) List<@jakarta.validation.constraints.NotBlank String> tags) {
}

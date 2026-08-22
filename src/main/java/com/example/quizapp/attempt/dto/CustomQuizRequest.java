package com.example.quizapp.attempt.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CustomQuizRequest(
		String categorySlug,
		com.example.quizapp.quiz.Difficulty difficulty,
		String tagSlug,
		@NotNull @Min(1) @Max(30) Integer count,
		@NotNull @Min(30) @Max(3600) Integer timeLimitSec) {
}

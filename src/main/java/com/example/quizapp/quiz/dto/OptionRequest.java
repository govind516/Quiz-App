package com.example.quizapp.quiz.dto;

import jakarta.validation.constraints.NotBlank;

public record OptionRequest(
		@NotBlank String optionText,
		boolean isCorrect) {
}

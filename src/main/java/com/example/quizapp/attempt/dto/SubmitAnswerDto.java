package com.example.quizapp.attempt.dto;

import java.util.Set;

import jakarta.validation.constraints.NotNull;

public record SubmitAnswerDto(
		@NotNull Long questionId,
		Set<Long> selectedOptionIds) {
}

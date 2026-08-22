package com.example.quizapp.attempt.dto;

import java.time.Instant;
import java.util.List;

import com.example.quizapp.attempt.AttemptStatus;

public record AttemptResultDto(
		Long attemptId,
		Long quizId,
		String quizTitle,
		AttemptStatus status,
		int score,
		long totalPoints,
		double percentage,
		Instant startedAt,
		Instant completedAt,
		long durationSeconds,
		List<QuestionResultDto> questions) {
}

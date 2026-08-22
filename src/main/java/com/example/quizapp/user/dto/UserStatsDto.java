package com.example.quizapp.user.dto;

import java.time.Instant;

public record UserStatsDto(
		long totalAttempts,
		long completedAttempts,
		double averagePercentage,
		double bestPercentage,
		int totalPointsEarned) {
}

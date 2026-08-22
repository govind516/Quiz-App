package com.example.quizapp.user.dto;

public record UserStatsDto(
		long totalAttempts,
		long completedAttempts,
		double averagePercentage,
		double bestPercentage,
		int totalPointsEarned,
		int currentStreak,
		int bestStreak) {
}

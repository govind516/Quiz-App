package com.example.quizapp.leaderboard;

public record LeaderboardEntryDto(
		int rank,
		Long userId,
		String name,
		double score,
		String initials,
		String country,
		int streak) {
}

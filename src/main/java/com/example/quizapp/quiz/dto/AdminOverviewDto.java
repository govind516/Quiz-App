package com.example.quizapp.quiz.dto;

public record AdminOverviewDto(
		long totalUsers,
		long newUsersThisWeek,
		long attemptsToday,
		double avgScorePct30d,
		int categoryCount) {
}

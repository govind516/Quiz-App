package com.example.quizapp.quiz.dto;

import java.util.List;

public record AdminAnalyticsDto(
		List<DayPoint> daily,
		List<TopCategory> topCategories,
		long today) {

	public record DayPoint(String date, long count) {
	}

	public record TopCategory(String name, long count) {
	}
}

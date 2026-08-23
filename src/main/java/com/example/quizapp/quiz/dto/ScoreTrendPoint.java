package com.example.quizapp.quiz.dto;

public record ScoreTrendPoint(
		String date,
		double avgPct,
		long attempts) {
}

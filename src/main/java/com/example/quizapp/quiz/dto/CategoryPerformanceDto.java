package com.example.quizapp.quiz.dto;

public record CategoryPerformanceDto(
		String name,
		long attempts,
		long completed,
		double avgScorePct) {
}

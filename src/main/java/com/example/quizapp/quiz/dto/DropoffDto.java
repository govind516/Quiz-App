package com.example.quizapp.quiz.dto;

public record DropoffDto(
		long started,
		long completed,
		long abandoned,
		double dropOffPct) {
}

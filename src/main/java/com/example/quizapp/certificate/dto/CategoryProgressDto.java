package com.example.quizapp.certificate.dto;

public record CategoryProgressDto(
		Long categoryId,
		String categoryName,
		int totalQuizzes,
		int completedQuizzes,
		boolean eligible) {
}

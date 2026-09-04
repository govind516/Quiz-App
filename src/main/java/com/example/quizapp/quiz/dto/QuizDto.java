package com.example.quizapp.quiz.dto;

import java.time.Instant;
import java.util.Set;

import com.example.quizapp.quiz.Difficulty;

public record QuizDto(
		Long id,
		String title,
		String description,
		Long categoryId,
		String categoryName,
		String categorySlug,
		String topic,
		Difficulty difficulty,
		int timeLimitSec,
		boolean isPublished,
		int questionCount,
		Set<String> tags,
		String createdBy,
		Instant createdAt) {
}

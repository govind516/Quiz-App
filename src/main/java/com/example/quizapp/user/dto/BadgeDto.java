package com.example.quizapp.user.dto;

public record BadgeDto(
		String code,
		String name,
		String description,
		boolean earned) {
}

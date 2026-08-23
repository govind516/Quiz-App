package com.example.quizapp.user.dto;

import java.time.Instant;

public record AdminUserDto(
		Long id,
		String name,
		String email,
		String role,
		Instant createdAt,
		long completedAttempts,
		boolean banned) {
}

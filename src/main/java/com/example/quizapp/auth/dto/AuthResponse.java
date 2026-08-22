package com.example.quizapp.auth.dto;

public record AuthResponse(
		String accessToken,
		String refreshToken,
		String tokenType,
		long expiresInMs,
		UserResponse user) {
}

package com.example.quizapp.common.exception;

import java.time.Instant;
import java.util.Map;

public record ErrorResponse(
		int status,
		String message,
		Map<String, String> fieldErrors,
		Instant timestamp) {

	public static ErrorResponse of(int status, String message) {
		return new ErrorResponse(status, message, Map.of(), Instant.now());
	}

	public static ErrorResponse withFieldErrors(int status, String message, Map<String, String> fieldErrors) {
		return new ErrorResponse(status, message, fieldErrors, Instant.now());
	}
}

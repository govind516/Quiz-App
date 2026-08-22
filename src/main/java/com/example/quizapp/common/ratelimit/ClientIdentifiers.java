package com.example.quizapp.common.ratelimit;

import jakarta.servlet.http.HttpServletRequest;

public final class ClientIdentifiers {

	private ClientIdentifiers() {
	}

	public static String clientIp(HttpServletRequest request) {
		String forwarded = request.getHeader("X-Forwarded-For");
		if (forwarded != null && !forwarded.isBlank()) {
			return forwarded.split(",")[0].trim();
		}
		String realIp = request.getHeader("X-Real-IP");
		if (realIp != null && !realIp.isBlank()) {
			return realIp.trim();
		}
		return request.getRemoteAddr();
	}

	public static String identity(Long userId, String guestSessionId, HttpServletRequest request) {
		if (userId != null) {
			return "u:" + userId;
		}
		if (guestSessionId != null && !guestSessionId.isBlank()) {
			return "g:" + guestSessionId;
		}
		return "ip:" + clientIp(request);
	}
}

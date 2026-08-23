package com.example.quizapp.user.dto;

import java.util.List;

public record AdminUsersResponse(
		List<AdminUserDto> items,
		long total,
		int page,
		int size) {
}

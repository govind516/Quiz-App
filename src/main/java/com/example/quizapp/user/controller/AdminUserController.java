package com.example.quizapp.user.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.quizapp.user.AdminUserService;
import com.example.quizapp.user.dto.AdminUserDto;
import com.example.quizapp.user.dto.AdminUsersResponse;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Users")
public class AdminUserController {

	private final AdminUserService adminUserService;

	public record BanRequest(@NotNull Boolean banned) {
	}

	@GetMapping
	public ResponseEntity<AdminUsersResponse> list(
			@RequestParam(required = false) String query,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		return ResponseEntity.ok(adminUserService.page(query, page, size));
	}

	@PatchMapping("/{id}/ban")
	public ResponseEntity<AdminUserDto> setBanned(
			@PathVariable Long id,
			@Valid @RequestBody BanRequest request) {
		return ResponseEntity.ok(adminUserService.setBanned(id, request.banned()));
	}

	@DeleteMapping("/{id}/progress")
	public ResponseEntity<Map<String, String>> deleteProgress(@PathVariable Long id) {
		return ResponseEntity.ok(Map.of("message", adminUserService.deleteProgress(id)));
	}
}

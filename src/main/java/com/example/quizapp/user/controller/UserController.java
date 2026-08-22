package com.example.quizapp.user.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.quizapp.attempt.dto.AttemptResultDto;
import com.example.quizapp.auth.CurrentUserProvider;
import com.example.quizapp.user.UserService;
import com.example.quizapp.user.dto.BadgeDto;
import com.example.quizapp.user.dto.UserStatsDto;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
@Tag(name = "Users")
public class UserController {

	private final UserService userService;
	private final CurrentUserProvider currentUserProvider;

	@GetMapping("/history")
	public ResponseEntity<List<AttemptResultDto>> history() {
		return ResponseEntity.ok(userService.history(currentUserProvider.requireCurrentUser().getId()));
	}

	@GetMapping("/stats")
	public ResponseEntity<UserStatsDto> stats() {
		return ResponseEntity.ok(userService.stats(currentUserProvider.requireCurrentUser().getId()));
	}

	@GetMapping("/badges")
	public ResponseEntity<List<BadgeDto>> badges() {
		return ResponseEntity.ok(userService.badges(currentUserProvider.requireCurrentUser().getId()));
	}
}

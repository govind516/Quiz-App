package com.example.quizapp.leaderboard.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.quizapp.common.exception.BadRequestException;
import com.example.quizapp.leaderboard.LeaderboardEntryDto;
import com.example.quizapp.leaderboard.LeaderboardService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
@Tag(name = "Leaderboard")
public class LeaderboardController {

	private final LeaderboardService leaderboardService;

	@GetMapping("/global")
	public ResponseEntity<List<LeaderboardEntryDto>> global(
			@RequestParam(defaultValue = "10") int limit) {
		return ResponseEntity.ok(leaderboardService.topGlobal(clamp(limit)));
	}

	@GetMapping("/quiz/{quizId}")
	public ResponseEntity<List<LeaderboardEntryDto>> quiz(
			@PathVariable Long quizId,
			@RequestParam(defaultValue = "10") int limit) {
		return ResponseEntity.ok(leaderboardService.topQuiz(quizId, clamp(limit)));
	}

	@GetMapping("/category/{categoryId}")
	public ResponseEntity<List<LeaderboardEntryDto>> category(
			@PathVariable Long categoryId,
			@RequestParam(defaultValue = "10") int limit) {
		return ResponseEntity.ok(leaderboardService.topCategory(categoryId, clamp(limit)));
	}

	private static int clamp(int limit) {
		if (limit < 1 || limit > 100) {
			throw new BadRequestException("limit must be between 1 and 100");
		}
		return limit;
	}
}

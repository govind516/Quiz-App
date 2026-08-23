package com.example.quizapp.quiz.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.quizapp.quiz.dto.AdminAnalyticsDto;
import com.example.quizapp.quiz.dto.AdminOverviewDto;
import com.example.quizapp.quiz.dto.CategoryPerformanceDto;
import com.example.quizapp.quiz.dto.DropoffDto;
import com.example.quizapp.quiz.dto.ScoreTrendPoint;
import com.example.quizapp.quiz.dto.QuizDto;
import com.example.quizapp.quiz.service.AdminAnalyticsService;
import com.example.quizapp.quiz.service.AnalyticsService;
import com.example.quizapp.quiz.service.QuizService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin")
public class AdminQuizController {

	private final QuizService quizService;
	private final AnalyticsService analyticsService;
	private final AdminAnalyticsService adminAnalyticsService;

	@GetMapping("/api/admin/quizzes")
	public ResponseEntity<List<QuizDto>> listAll() {
		return ResponseEntity.ok(quizService.listAllForAdmin());
	}

	@GetMapping("/api/admin/analytics/overview")
	public ResponseEntity<AdminOverviewDto> overview() {
		return ResponseEntity.ok(adminAnalyticsService.overview());
	}

	@GetMapping("/api/admin/analytics/scores")
	public ResponseEntity<List<ScoreTrendPoint>> scores(
			@RequestParam(defaultValue = "14") int days) {
		return ResponseEntity.ok(adminAnalyticsService.scoreTrend(Math.max(1, Math.min(90, days))));
	}

	@GetMapping("/api/admin/analytics/dropoff")
	public ResponseEntity<DropoffDto> dropoff() {
		return ResponseEntity.ok(adminAnalyticsService.dropoff());
	}

	@GetMapping("/api/admin/analytics/categories")
	public ResponseEntity<List<CategoryPerformanceDto>> categoryPerformance() {
		return ResponseEntity.ok(adminAnalyticsService.categoryPerformance());
	}

	@GetMapping("/api/admin/analytics/attempts")
	public ResponseEntity<AdminAnalyticsDto> attempts(
			@RequestParam(defaultValue = "7") int days) {
		int clamped = Math.max(1, Math.min(30, days));
		return ResponseEntity.ok(analyticsService.attemptsOverview(clamped));
	}
}


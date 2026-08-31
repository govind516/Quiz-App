package com.example.quizapp.quiz.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.quizapp.attempt.AttemptStatus;
import com.example.quizapp.attempt.repository.QuizAttemptRepository;
import com.example.quizapp.quiz.dto.AdminOverviewDto;
import com.example.quizapp.quiz.dto.CategoryPerformanceDto;
import com.example.quizapp.quiz.dto.DropoffDto;
import com.example.quizapp.quiz.dto.ScoreTrendPoint;
import com.example.quizapp.quiz.repository.CategoryRepository;
import com.example.quizapp.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminAnalyticsService {

	private final QuizAttemptRepository attemptRepository;
	private final UserRepository userRepository;
	private final CategoryRepository categoryRepository;

	@Transactional(readOnly = true)
	public AdminOverviewDto overview() {
		long totalUsers = userRepository.count();
		long newUsersThisWeek =
				userRepository.countByCreatedAtAfter(Instant.now().minus(7, ChronoUnit.DAYS));
		long attemptsToday = attemptsToday();
		double avgScorePct30d = averageScorePct(30);
		int categoryCount = (int) categoryRepository.count();
		return new AdminOverviewDto(totalUsers, newUsersThisWeek, attemptsToday,
				round1(avgScorePct30d), categoryCount);
	}

	@Transactional(readOnly = true)
	public List<ScoreTrendPoint> scoreTrend(int days) {
		return attemptRepository.scoreTrend(days).stream()
				.map(row -> new ScoreTrendPoint(row.getDay(),
						row.getAvgPct() == null ? 0 : round1(row.getAvgPct()),
						row.getCnt()))
				.toList();
	}

	@Transactional(readOnly = true)
	public DropoffDto dropoff() {
		long started = attemptRepository.count();
		long submitted = attemptRepository.countByStatus(AttemptStatus.SUBMITTED);
		long expired = attemptRepository.countByStatus(AttemptStatus.EXPIRED);
		long completed = submitted + expired;
		long abandoned = attemptRepository.countByStatus(AttemptStatus.IN_PROGRESS);
		double pct = started == 0 ? 0 : Math.round(abandoned * 1000.0 / started) / 10.0;
		return new DropoffDto(started, completed, abandoned, pct);
	}

	@Transactional(readOnly = true)
	public List<CategoryPerformanceDto> categoryPerformance() {
		return categoryRepository.performance().stream()
				.map(row -> new CategoryPerformanceDto(
						row.getName(),
						row.getAttempts(),
						row.getCompleted(),
						row.getAvgPct() == null ? 0 : round1(row.getAvgPct())))
				.toList();
	}

	private long attemptsToday() {
		var series = attemptRepository.countDailyCompletions(1);
		return series.isEmpty() ? 0 : series.get(series.size() - 1).getCnt();
	}

	private double averageScorePct(int days) {
		var rows = attemptRepository.scoreTrend(days);
		if (rows.isEmpty()) {
			return 0;
		}
		double weighted = 0;
		long totalAttempts = 0;
		for (var row : rows) {
			if (row.getAvgPct() == null || row.getCnt() == null) {
				continue;
			}
			weighted += row.getAvgPct() * row.getCnt();
			totalAttempts += row.getCnt();
		}
		return totalAttempts == 0 ? 0 : weighted / totalAttempts;
	}

	private double round1(double value) {
		return Math.round(value * 10.0) / 10.0;
	}
}

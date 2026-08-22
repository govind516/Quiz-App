package com.example.quizapp.quiz.service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.quizapp.attempt.repository.QuizAttemptRepository;
import com.example.quizapp.quiz.dto.AdminAnalyticsDto;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

	private static final DateTimeFormatter DAY_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE;

	private final QuizAttemptRepository attemptRepository;

	@Transactional(readOnly = true)
	public AdminAnalyticsDto attemptsOverview(int days) {
		Map<String, Long> byDay = new HashMap<>();
		for (var row : attemptRepository.countDailyCompletions(days)) {
			byDay.put(row.getDay(), row.getCnt());
		}

		LocalDate today = LocalDate.now(ZoneOffset.UTC);
		List<AdminAnalyticsDto.DayPoint> series = new ArrayList<>();
		for (int i = days - 1; i >= 0; i--) {
			String date = today.minusDays(i).format(DAY_FORMAT);
			series.add(new AdminAnalyticsDto.DayPoint(date, byDay.getOrDefault(date, 0L)));
		}
		long todayCount = series.isEmpty() ? 0 : series.get(series.size() - 1).count();

		List<AdminAnalyticsDto.TopCategory> topCategories = attemptRepository.topCategories(days)
				.stream()
				.map(row -> new AdminAnalyticsDto.TopCategory(row.getName(), row.getCnt()))
				.toList();

		return new AdminAnalyticsDto(series, topCategories, todayCount);
	}
}

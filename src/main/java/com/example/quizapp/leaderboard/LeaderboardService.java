package com.example.quizapp.leaderboard;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.lang.NonNull;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.example.quizapp.attempt.repository.QuizAttemptRepository;
import com.example.quizapp.attempt.repository.projection.WeeklyScore;
import com.example.quizapp.user.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@SuppressWarnings("null")
public class LeaderboardService {

	@NonNull
	private static final String PREFIX = "quizapp:lb:";

	private final StringRedisTemplate redisTemplate;
	private final UserRepository userRepository;
	private final QuizAttemptRepository attemptRepository;
	private final boolean configured;

	public LeaderboardService(
			StringRedisTemplate redisTemplate,
			UserRepository userRepository,
			QuizAttemptRepository attemptRepository,
			@Value("${REDIS_URI:}") String redisUri) {
		this.redisTemplate = redisTemplate;
		this.userRepository = userRepository;
		this.attemptRepository = attemptRepository;
		this.configured = StringUtils.hasText(redisUri);
	}

	public boolean isConfigured() {
		return configured;
	}

	@Async
	public void recordSubmission(Long userId, Long quizId, Long categoryId,
			int pointsEarned, double percentage) {
		if (!configured) {
			return;
		}
		String member = String.valueOf(userId);
		try {
			String quizKey = PREFIX + "quiz:" + quizId;
			Double existing = redisTemplate.opsForZSet().score(quizKey, member);
			if (existing == null || percentage > existing) {
				redisTemplate.opsForZSet().add(quizKey, member, percentage);
			}
			redisTemplate.opsForZSet().incrementScore(PREFIX + "global", member, pointsEarned);
			redisTemplate.opsForZSet().incrementScore(PREFIX + "category:" + categoryId, member, pointsEarned);
		} catch (Exception e) {
			log.warn("Leaderboard update skipped (Redis unavailable): {}", e.getMessage());
		}
	}

	public List<LeaderboardEntryDto> topGlobal(int limit) {
		return top("global", limit);
	}

	public List<LeaderboardEntryDto> topQuiz(Long quizId, int limit) {
		return top("quiz:" + quizId, limit);
	}

	public List<LeaderboardEntryDto> topCategory(Long categoryId, int limit) {
		return top("category:" + categoryId, limit);
	}

	/**
	 * Last-7-days board, computed from submitted attempts in the database
	 * (not Redis) so it reflects a real time window rather than all-time totals.
	 */
	public List<LeaderboardEntryDto> topWeekly(int limit) {
		List<WeeklyScore> rows = attemptRepository.topWeeklyScores(7);
		List<LeaderboardEntryDto> entries = new ArrayList<>();
		int rank = 1;
		for (WeeklyScore row : rows) {
			if (entries.size() >= Math.max(0, limit)) {
				break;
			}
			Number points = row.getPoints();
			double score = points == null ? 0.0 : round1(points.doubleValue());
			String name = row.getName() == null ? "Anonymous" : row.getName();
			String initials = computeInitials(name);
			entries.add(new LeaderboardEntryDto(rank++, row.getUserId(),
					name, score, initials, "Unknown", 0));
		}
		return entries;
	}

	private List<LeaderboardEntryDto> top(String key, int limit) {
		if (!configured) {
			return List.of();
		}
		try {
			Set<ZSetOperations.TypedTuple<String>> tuples = redisTemplate.opsForZSet()
					.reverseRangeWithScores(PREFIX + key, 0L, Math.max(0, limit - 1));
			if (tuples == null || tuples.isEmpty()) {
				return List.of();
			}
			Map<Long, String> names = new HashMap<>();
			Map<Long, String> countries = new HashMap<>();
			Map<Long, Integer> streaks = new HashMap<>();
			List<Long> userIds = tuples.stream()
					.map(t -> Long.parseLong(java.util.Objects.requireNonNull(t.getValue())))
					.toList();
			userRepository.findAllByIdIn(userIds)
				.forEach(u -> {
					names.put(u.getId(), u.getName());
					countries.put(u.getId(), u.getCountry() != null ? u.getCountry() : "Unknown");
					streaks.put(u.getId(), u.getStreak());
				});

			int rank = 1;
			List<LeaderboardEntryDto> entries = new ArrayList<>();
			for (ZSetOperations.TypedTuple<String> tuple : tuples) {
				Long userId = Long.parseLong(tuple.getValue());
				Double rawScore = tuple.getScore();
				double score = rawScore == null ? 0.0 : round1(rawScore);
				Integer streak = streaks.get(userId);
			String name = names.getOrDefault(userId, "Anonymous");
			String initials = computeInitials(name);
			entries.add(new LeaderboardEntryDto(rank++, userId, name, score,
					initials, countries.getOrDefault(userId, "Unknown"),
					streak != null ? streak : 0));
			}
			return entries;
		} catch (Exception e) {
			log.warn("Leaderboard read skipped (Redis unavailable): {}", e.getMessage());
			return List.of();
		}
	}

	private double round1(double value) {
		return Math.round(value * 10.0) / 10.0;
	}

	private String computeInitials(String name) {
		if (name == null || name.isBlank()) {
			return "??";
		}
		String[] parts = name.trim().split("\\s+");
		if (parts.length >= 2) {
			return (parts[0].charAt(0) + "" + parts[1].charAt(0)).toUpperCase();
		}
		return name.substring(0, Math.min(2, name.length())).toUpperCase();
	}
}

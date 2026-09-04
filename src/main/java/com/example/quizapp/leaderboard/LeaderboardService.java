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
	private final boolean configured;

	public LeaderboardService(
			StringRedisTemplate redisTemplate,
			UserRepository userRepository,
			@Value("${REDIS_URI:}") String redisUri) {
		this.redisTemplate = redisTemplate;
		this.userRepository = userRepository;
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
			List<Long> userIds = tuples.stream()
					.map(t -> Long.parseLong(java.util.Objects.requireNonNull(t.getValue())))
					.toList();
			userRepository.findAllByIdIn(userIds)
					.forEach(u -> names.put(u.getId(), u.getName()));

			int rank = 1;
			List<LeaderboardEntryDto> entries = new ArrayList<>();
			for (ZSetOperations.TypedTuple<String> tuple : tuples) {
				Long userId = Long.parseLong(tuple.getValue());
				Double rawScore = tuple.getScore();
				double score = rawScore == null ? 0.0 : round1(rawScore);
				entries.add(new LeaderboardEntryDto(rank++, userId,
						names.getOrDefault(userId, "Anonymous"), score));
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
}

package com.example.quizapp.common.ratelimit;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class RateLimitService {

	private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

	private final int submitLimit;
	private final int startLimit;
	private final int authLimit;
	private final Duration window;

	public RateLimitService(int submitLimit, int startLimit, int authLimit, long windowSeconds) {
		this.submitLimit = submitLimit;
		this.startLimit = startLimit;
		this.authLimit = authLimit;
		this.window = Duration.ofSeconds(Math.max(1, windowSeconds));
	}

	public void checkSubmit(String identity) {
		consume("submit:" + identity, submitLimit);
	}

	public void checkStart(String identity) {
		consume("start:" + identity, startLimit);
	}

	public void checkAuth(String identity) {
		consume("auth:" + identity, authLimit);
	}

	private void consume(String key, int limit) {
		boolean allowed = bucket(key, limit).tryConsume(1);
		if (!allowed) {
			log.info("Rate limit hit for {}", key);
			throw new TooManyRequestsException(
					"Too many requests. Please wait a moment and try again.");
		}
	}

	Bucket bucket(String key, int limit) {
		return buckets.computeIfAbsent(key,
				k -> Bucket.builder()
						.addLimit(Bandwidth.builder()
								.capacity(limit)
								.refillGreedy(limit, window)
								.build())
						.build());
	}
}

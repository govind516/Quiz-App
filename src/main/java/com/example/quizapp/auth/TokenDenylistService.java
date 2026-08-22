package com.example.quizapp.auth;

import java.time.Duration;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenDenylistService {

	private static final String KEY_PREFIX = "quizapp:jti:";

	private final StringRedisTemplate redisTemplate;

	public void revoke(String jti, Duration ttl) {
		if (jti == null || jti.isBlank()) {
			return;
		}
		try {
			redisTemplate.opsForValue().set(KEY_PREFIX + jti, "1", ttl);
		} catch (Exception e) {
			log.warn("Token denylist write skipped (Redis unavailable): {}", e.getMessage());
		}
	}

	public boolean isRevoked(String jti) {
		if (jti == null || jti.isBlank()) {
			return false;
		}
		try {
			return Boolean.TRUE.equals(redisTemplate.hasKey(KEY_PREFIX + jti));
		} catch (Exception e) {
			log.warn("Token denylist check failed open (Redis unavailable): {}", e.getMessage());
			return false;
		}
	}
}

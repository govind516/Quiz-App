package com.example.quizapp.common.ratelimit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RateLimitConfig {

	@Bean
	public RateLimitService rateLimitService(
			@Value("${app.ratelimit.submit-limit}") int submitLimit,
			@Value("${app.ratelimit.start-limit}") int startLimit,
			@Value("${app.ratelimit.auth-limit}") int authLimit,
			@Value("${app.ratelimit.window-seconds}") long windowSeconds) {
		return new RateLimitService(submitLimit, startLimit, authLimit, windowSeconds);
	}
}

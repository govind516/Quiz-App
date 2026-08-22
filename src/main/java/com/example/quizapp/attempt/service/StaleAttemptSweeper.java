package com.example.quizapp.attempt.service;

import java.time.Instant;
import java.util.List;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.quizapp.attempt.AttemptStatus;
import com.example.quizapp.attempt.QuizAttempt;
import com.example.quizapp.attempt.repository.QuizAttemptRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@ConditionalOnProperty(name = "app.sweeper.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class StaleAttemptSweeper {

	static final int MAX_TIME_LIMIT_SEC = 3600;
	private static final int SWEEP_SLACK_SEC = 300;

	private final QuizAttemptRepository attemptRepository;

	@Scheduled(cron = "${app.sweeper.cron:0 23 * * * *}")
	@Transactional
	public void expireStaleAttempts() {
		try {
			Instant cutoff = Instant.now().minusSeconds(MAX_TIME_LIMIT_SEC + SUBMIT_BUFFER_SECONDS + SWEEP_SLACK_SEC);
			List<QuizAttempt> stale = attemptRepository
					.findAllByStatusAndStartedAtBefore(AttemptStatus.IN_PROGRESS, cutoff);
			for (QuizAttempt attempt : stale) {
				attempt.setStatus(AttemptStatus.EXPIRED);
				attempt.setCompletedAt(
						attempt.getStartedAt().plusSeconds(attempt.getTimeLimitSec()));
			}
			if (!stale.isEmpty()) {
				attemptRepository.saveAll(stale);
				log.info("Expired {} abandoned in-progress attempt(s)", stale.size());
			}
		} catch (Exception e) {
			log.error("Stale-attempt sweep failed", e);
		}
	}

	private static final int SUBMIT_BUFFER_SECONDS = 30;
}

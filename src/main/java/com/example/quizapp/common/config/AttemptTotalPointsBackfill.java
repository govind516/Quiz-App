package com.example.quizapp.common.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.quizapp.attempt.AttemptStatus;
import com.example.quizapp.attempt.QuizAttempt;
import com.example.quizapp.attempt.repository.QuizAttemptRepository;
import com.example.quizapp.attempt.service.AttemptPointsResolver;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * One-time-per-boot backfill: submitted attempts created before the
 * total_points snapshot column existed get their totals derived from
 * stored data. No-op once every row has a snapshot.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AttemptTotalPointsBackfill implements ApplicationRunner {

	private final QuizAttemptRepository attemptRepository;
	private final AttemptPointsResolver attemptPointsResolver;

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		var missing = attemptRepository.findAllByStatusAndTotalPointsIsNull(AttemptStatus.SUBMITTED);
		if (missing.isEmpty()) {
			return;
		}
		for (QuizAttempt attempt : missing) {
			attempt.setTotalPoints(attemptPointsResolver.resolveTotalPoints(attempt));
		}
		attemptRepository.saveAll(missing);
		log.info("Backfilled total_points on {} submitted attempt(s)", missing.size());
	}
}

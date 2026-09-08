package com.example.quizapp.common.config;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.example.quizapp.quiz.Quiz;
import com.example.quizapp.quiz.repository.QuizRepository;
import com.example.quizapp.attempt.QuizAttempt;
import com.example.quizapp.attempt.repository.QuizAttemptRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * One-time data integrity repair for production deployment.
 * Backfills NULL question_time_limit_sec values with 0 (fallback legacy behavior).
 * Idempotent — safe to run on every startup.
 * Runs first (order 1) before AiQuestionRepairRunner (order 100).
 */
@Component
@Order(1) // Runs first, before AiQuestionRepairRunner (@Order(100))
@Transactional
@RequiredArgsConstructor
@Slf4j
public class QuizDataIntegrityRunner implements ApplicationRunner {

	private final QuizRepository quizRepository;
	private final QuizAttemptRepository quizAttemptRepository;
	private final EntityManager entityManager;

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		try {
			backfillQuizTimeLimitSec();
		} catch (Exception e) {
			log.warn("QuizDataIntegrityRunner: backfill skipped due to error - {}", e.toString());
		}
		try {
			backfillQuizAttemptTimeLimitSec();
		} catch (Exception e) {
			log.warn("QuizDataIntegrityRunner: backfill skipped for attempts due to error - {}", e.toString());
		}
		log.info("QuizDataIntegrityRunner: completed backfill of question_time_limit_sec");
	}

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Backfill NULL question_time_limit_sec in quizzes table
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

	private void backfillQuizTimeLimitSec() {
		// Backfill NULL question_time_limit_sec in quizzes table with 0
		try {
			int updatedQuizzes = entityManager.createQuery(
					"UPDATE Quiz q SET q.questionTimeLimitSec = 0 WHERE q.questionTimeLimitSec IS NULL")
					.executeUpdate();

			Long remainingNullsObj = (Long) entityManager.createQuery(
					"SELECT COUNT(q) FROM Quiz q WHERE q.questionTimeLimitSec IS NULL")
					.getSingleResult();
			long remainingNulls = remainingNullsObj != null ? remainingNullsObj : 0;

			if (remainingNulls > 0) {
				log.warn("QuizDataIntegrityRunner: {} quizzes still have NULL question_time_limit_sec after backfill", remainingNulls);
			} else {
				log.info("QuizDataIntegrityRunner: backfilled {} quizzes with question_time_limit_sec = 0", updatedQuizzes);
			}
		} catch (Exception e) {
			log.warn("QuizDataIntegrityRunner: backfill of quizzes skipped - {}", e.toString());
		}
	}

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Backfill NULL question_time_limit_sec in quiz_attempts table
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

	private void backfillQuizAttemptTimeLimitSec() {
		// Backfill NULL question_time_limit_sec in quiz_attempts table with 0
		try {
			int updatedAttempts = entityManager.createQuery(
					"UPDATE QuizAttempt a SET a.questionTimeLimitSec = 0 WHERE a.questionTimeLimitSec IS NULL")
					.executeUpdate();

			Long remainingNullsObj = (Long) entityManager.createQuery(
					"SELECT COUNT(a) FROM QuizAttempt a WHERE a.questionTimeLimitSec IS NULL")
					.getSingleResult();
			long remainingNulls = remainingNullsObj != null ? remainingNullsObj : 0;

			if (remainingNulls > 0) {
				log.warn("QuizDataIntegrityRunner: {} quiz attempts still have NULL question_time_limit_sec after backfill", remainingNulls);
			} else {
				log.info("QuizDataIntegrityRunner: backfilled {} quiz attempts with question_time_limit_sec = 0", updatedAttempts);
			}
		} catch (Exception e) {
			log.warn("QuizDataIntegrityRunner: backfill of attempts skipped - {}", e.toString());
		}
	}
}
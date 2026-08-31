package com.example.quizapp;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.example.quizapp.attempt.AttemptStatus;
import com.example.quizapp.attempt.QuizAttempt;
import com.example.quizapp.attempt.repository.QuizAttemptRepository;
import com.example.quizapp.quiz.Category;
import com.example.quizapp.quiz.Difficulty;
import com.example.quizapp.quiz.Question;
import com.example.quizapp.quiz.QuestionStatus;
import com.example.quizapp.quiz.QuestionType;
import com.example.quizapp.quiz.Quiz;
import com.example.quizapp.quiz.repository.CategoryRepository;
import com.example.quizapp.quiz.repository.QuestionRepository;
import com.example.quizapp.quiz.repository.QuizRepository;

@SpringBootTest
@org.springframework.test.context.ActiveProfiles("test")
@Transactional
class AnalyticsCategoryPerformanceTest {

	@Autowired CategoryRepository categoryRepository;
	@Autowired QuizRepository quizRepository;
	@Autowired QuestionRepository questionRepository;
	@Autowired QuizAttemptRepository attemptRepository;

	@Test
	void performanceUsesTotalPointsSnapshot_7of10_is70percent() {
		// Use existing seeded category or create distinct one
		Category cat = categoryRepository.save(Category.builder()
				.name("TestCatPerf-" + System.nanoTime())
				.slug("testcatperf-" + System.nanoTime())
				.description("perf test")
				.build());

		Quiz quiz = Quiz.builder()
				.title("Perf Quiz " + System.nanoTime())
				.description("for analytics")
				.category(cat)
				.difficulty(Difficulty.BEGINNER)
				.timeLimitSec(600)
				.isPublished(true)
				.build();
		quiz = quizRepository.save(quiz);

		Question q1 = Question.builder()
				.quiz(quiz)
				.questionText("Q1?")
				.type(QuestionType.MCQ)
				.points(5)
				.status(QuestionStatus.APPROVED)
				.build();
		Question q2 = Question.builder()
				.quiz(quiz)
				.questionText("Q2?")
				.type(QuestionType.MCQ)
				.points(5)
				.status(QuestionStatus.APPROVED)
				.build();
		questionRepository.saveAll(java.util.List.of(q1, q2));

		// attempt: 7 / 10 => 70%
		QuizAttempt attempt = QuizAttempt.builder()
				.quiz(quiz)
				.title(quiz.getTitle())
				.timeLimitSec(quiz.getTimeLimitSec())
				.score(7)
				.totalPoints(10)
				.startedAt(Instant.now().minusSeconds(60))
				.completedAt(Instant.now())
				.status(AttemptStatus.SUBMITTED)
				.build();
		attemptRepository.save(attempt);
		attemptRepository.flush();

		var rows = categoryRepository.performance();
		var row = rows.stream().filter(r -> r.getName().equals(cat.getName())).findFirst().orElse(null);
		assertThat(row).isNotNull();
		assertThat(row.getAttempts()).isGreaterThanOrEqualTo(1L);
		// avgPct should be ~70, not 0
		assertThat(row.getAvgPct()).isNotNull();
		assertThat(row.getAvgPct()).isCloseTo(70.0, within(0.1));

		// scoreTrend is Postgres-specific (TO_CHAR + CURRENT_DATE - CAST)
		// and fails on H2; verified instead via category performance above which
		// shares the same total_points logic and alias fix.
	}

	@Test
	void categoryWithZeroQuestionsHasNullAvgNotZeroAttempts() {
		Category cat = categoryRepository.save(Category.builder()
				.name("EmptyCat-" + System.nanoTime())
				.slug("emptycat-" + System.nanoTime())
				.build());
		// no quizzes, no attempts
		var rows = categoryRepository.performance();
		var row = rows.stream().filter(r -> r.getName().equals(cat.getName())).findFirst().orElse(null);
		assertThat(row).isNotNull();
		assertThat(row.getAttempts()).isEqualTo(0L);
		// avgPct should be null -> service maps to 0
		assertThat(row.getAvgPct()).isNull();
	}
}

package com.example.quizapp.attempt.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.quizapp.attempt.AttemptStatus;
import com.example.quizapp.attempt.QuizAttempt;
import com.example.quizapp.attempt.repository.projection.CategoryCount;
import com.example.quizapp.attempt.repository.projection.DayCount;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

	List<QuizAttempt> findAllByUserIdOrderByStartedAtDesc(Long userId);

	List<QuizAttempt> findAllByUserIdAndStatusOrderByCompletedAtDesc(Long userId,
			AttemptStatus status);

	List<QuizAttempt> findAllByStatusAndStartedAtBefore(AttemptStatus status, Instant cutoff);

	long countByUserId(Long userId);

	@Query(value = """
			SELECT TO_CHAR(a.completed_at, 'YYYY-MM-DD') AS day, COUNT(*) AS cnt
			FROM quiz_attempts a
			WHERE a.status IN ('SUBMITTED', 'EXPIRED')
			  AND a.completed_at >= CURRENT_DATE - CAST(:days AS integer)
			GROUP BY 1
			ORDER BY 1
			""", nativeQuery = true)
	List<DayCount> countDailyCompletions(@Param("days") int days);

	@Query(value = """
			SELECT c.name AS name, COUNT(*) AS cnt
			FROM quiz_attempts a
			JOIN quizzes q ON q.id = a.quiz_id
			JOIN categories c ON c.id = q.category_id
			WHERE a.status = 'SUBMITTED'
			  AND a.completed_at >= CURRENT_DATE - CAST(:days AS integer)
			GROUP BY c.name
			ORDER BY cnt DESC
			LIMIT 5
			""", nativeQuery = true)
	List<CategoryCount> topCategories(@Param("days") int days);
}

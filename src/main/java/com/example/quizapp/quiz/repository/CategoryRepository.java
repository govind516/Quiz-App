package com.example.quizapp.quiz.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.quizapp.quiz.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> {

	Optional<Category> findBySlug(String slug);

	Optional<Category> findByNameIgnoreCase(String name);

	boolean existsBySlug(String slug);

	@org.springframework.data.jpa.repository.Query(value = """
			SELECT c.id AS id, c.name AS name, c.slug AS slug,
			       COUNT(DISTINCT q.id) AS quizzes,
			       COUNT(DISTINCT qs.id) AS questions
			FROM categories c
			LEFT JOIN quizzes q ON q.category_id = c.id
			LEFT JOIN questions qs ON qs.quiz_id = q.id AND qs.status = 'APPROVED'
			GROUP BY c.id, c.name, c.slug
			ORDER BY c.name
			""", nativeQuery = true)
	java.util.List<com.example.quizapp.quiz.dto.CategoryAdminRow> findAllWithCounts();

	@org.springframework.data.jpa.repository.Query(value = """
			SELECT c.name AS name,
			       COUNT(a.id) AS attempts,
			       SUM(CASE WHEN a.status IN ('SUBMITTED', 'EXPIRED') THEN 1 ELSE 0 END) AS completed,
			       AVG(CASE WHEN a.status = 'SUBMITTED' THEN a.score * 100.0 / NULLIF(COALESCE(a.total_points, t.tp), 0) END) AS avgPct
			FROM categories c
			LEFT JOIN quizzes q ON q.category_id = c.id
			LEFT JOIN quiz_attempts a ON a.quiz_id = q.id
			LEFT JOIN (
			    SELECT quiz_id, SUM(points) AS tp
			    FROM questions
			    WHERE status = 'APPROVED'
			    GROUP BY quiz_id
			) t ON t.quiz_id = q.id
			GROUP BY c.name
			ORDER BY attempts DESC
			""", nativeQuery = true)
	java.util.List<com.example.quizapp.attempt.repository.projection.CategoryPerfRow> performance();
}

package com.example.quizapp.quiz.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.quizapp.quiz.Difficulty;
import com.example.quizapp.quiz.Quiz;

public interface QuizRepository extends JpaRepository<Quiz, Long> {

	Optional<Quiz> findByIdAndIsPublishedTrue(Long id);

	List<Quiz> findAllByIsPublishedTrue();

	@Query("""
			SELECT DISTINCT q FROM Quiz q
			WHERE q.isPublished = true
			  AND (:categorySlug IS NULL OR q.category.slug = :categorySlug)
			  AND (:difficulty IS NULL OR q.difficulty = :difficulty)
			  AND (:tagSlug IS NULL OR EXISTS (SELECT t FROM q.tags t WHERE t.slug = :tagSlug))
			ORDER BY q.createdAt DESC
			""")
	List<Quiz> searchPublished(@Param("categorySlug") String categorySlug,
			@Param("difficulty") Difficulty difficulty,
			@Param("tagSlug") String tagSlug);
}

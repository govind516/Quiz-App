package com.example.quizapp.quiz.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.quizapp.quiz.Difficulty;
import com.example.quizapp.quiz.Quiz;

public interface QuizRepository extends JpaRepository<Quiz, Long> {

	Optional<Quiz> findByIdAndIsPublishedTrue(Long id);

	List<Quiz> findAllByIsPublishedTrue();

	// Eagerly load to-one/to-many associations used by QuizService.toDto so
	// listing 30 quizzes costs a couple of queries instead of ~100 sequential
	// roundtrips (was ~28s against the remote pooler).
	@EntityGraph(attributePaths = { "category", "createdBy", "tags" })
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

	@EntityGraph(attributePaths = { "category", "createdBy", "tags" })
	@Query("SELECT DISTINCT q FROM Quiz q")
	List<Quiz> findAllWithDetails(Sort sort);


	boolean existsByCategoryId(Long categoryId);

	long countByCategoryId(Long categoryId);

	java.util.List<Quiz> findByCategoryIdOrderByIdAsc(Long categoryId);

	java.util.Optional<Quiz> findFirstByCategoryIdOrderByIdAsc(Long categoryId);

	java.util.Optional<Quiz> findFirstByCategoryIdAndTopicAndDifficulty(Long categoryId, String topic, Difficulty difficulty);
}

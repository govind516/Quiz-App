package com.example.quizapp.quiz.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.quizapp.quiz.Difficulty;
import com.example.quizapp.quiz.Question;
import com.example.quizapp.quiz.QuestionStatus;

public interface QuestionRepository extends JpaRepository<Question, Long> {

	List<Question> findAllByIdIn(List<Long> ids);

	List<Question> findAllByStatus(QuestionStatus status);

	long countByQuizIdAndStatus(Long quizId, QuestionStatus status);

	@Query("SELECT COALESCE(SUM(q.points), 0) FROM Question q WHERE q.quiz.id = :quizId AND q.status = 'APPROVED'")
	long sumPointsByQuizId(@Param("quizId") Long quizId);

	@Query("""
			SELECT DISTINCT q FROM Question q
			WHERE q.status = 'APPROVED'
			  AND q.quiz.isPublished = true
			  AND (:categorySlug IS NULL OR q.quiz.category.slug = :categorySlug)
			  AND (:difficulty IS NULL OR q.quiz.difficulty = :difficulty)
			  AND (:tagSlug IS NULL OR EXISTS (SELECT t FROM q.quiz.tags t WHERE t.slug = :tagSlug))
			""")
	List<Question> searchApproved(@Param("categorySlug") String categorySlug,
			@Param("difficulty") Difficulty difficulty,
			@Param("tagSlug") String tagSlug);
}

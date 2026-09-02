package com.example.quizapp.attempt.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.quizapp.attempt.AttemptAnswer;

public interface AttemptAnswerRepository extends JpaRepository<AttemptAnswer, Long> {

	List<AttemptAnswer> findAllByAttemptId(Long attemptId);

	@Query("SELECT DISTINCT a FROM AttemptAnswer a LEFT JOIN FETCH a.selectedOptionIds WHERE a.attempt.id = :attemptId")
	List<AttemptAnswer> findAllByAttemptIdWithOptions(@Param("attemptId") Long attemptId);

	Optional<AttemptAnswer> findByAttemptIdAndQuestionId(Long attemptId, Long questionId);

	@Modifying
	@Query("""
			DELETE FROM AttemptAnswer a
			WHERE a.attempt IN (SELECT at FROM QuizAttempt at WHERE at.user.id = :userId)
			""")
	int deleteAllForUser(@Param("userId") Long userId);
}

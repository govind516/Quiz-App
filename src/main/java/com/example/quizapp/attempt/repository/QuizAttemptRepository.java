package com.example.quizapp.attempt.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.quizapp.attempt.QuizAttempt;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

	List<QuizAttempt> findAllByUserIdOrderByStartedAtDesc(Long userId);

	List<QuizAttempt> findAllByUserIdAndStatusOrderByCompletedAtDesc(Long userId,
			com.example.quizapp.attempt.AttemptStatus status);

	long countByUserId(Long userId);
}

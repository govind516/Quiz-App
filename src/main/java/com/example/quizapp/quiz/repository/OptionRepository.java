package com.example.quizapp.quiz.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.quizapp.quiz.Option;

public interface OptionRepository extends JpaRepository<Option, Long> {

	List<Option> findByQuestionIdAndIsCorrectTrue(Long questionId);
}

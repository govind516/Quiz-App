package com.example.quizapp.quiz.dto;

public interface CategoryAdminRow {
	Long getId();

	String getName();

	String getSlug();

	long getQuizzes();

	long getQuestions();
}

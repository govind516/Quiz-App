package com.example.quizapp.attempt.repository.projection;

public interface CategoryPerfRow {
	String getName();

	Long getAttempts();

	Long getCompleted();

	Double getAvgPct();
}

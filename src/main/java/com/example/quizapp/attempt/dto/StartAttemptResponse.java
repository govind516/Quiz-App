package com.example.quizapp.attempt.dto;

import java.time.Instant;
import java.util.List;

import com.example.quizapp.quiz.dto.QuestionPublicDto;

public record StartAttemptResponse(
		Long attemptId,
		Long quizId,
		String quizTitle,
		int timeLimitSec,
		int perQuestionTimeSec,
		Instant startedAt,
		Instant expiresAt,
		List<QuestionPublicDto> questions) {
}

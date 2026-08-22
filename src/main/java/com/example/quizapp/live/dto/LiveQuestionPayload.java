package com.example.quizapp.live.dto;

import java.util.List;

import com.example.quizapp.quiz.dto.QuestionPublicDto;

public record LiveQuestionPayload(
		int index,
		int total,
		QuestionPublicDto question,
		long endsAtEpochMs,
		List<PlayerInfo> scoreboard) {
}

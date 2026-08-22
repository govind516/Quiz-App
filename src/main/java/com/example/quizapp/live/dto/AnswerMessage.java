package com.example.quizapp.live.dto;

import java.util.List;
import java.util.UUID;

public record AnswerMessage(
		UUID playerId,
		int questionIndex,
		Long questionId,
		List<Long> selectedOptionIds) {
}

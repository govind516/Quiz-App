package com.example.quizapp.live.dto;

import java.util.List;

public record FinalResultsPayload(
		String code,
		String quizTitle,
		List<PlayerInfo> entries) {
}

package com.example.quizapp.live.dto;

import java.util.List;

public record PlayerInfo(
		String playerId,
		String nickname,
		int score,
		boolean answeredCurrent) {
}

package com.example.quizapp.live.dto;


public record PlayerInfo(
		String playerId,
		String nickname,
		int score,
		boolean answeredCurrent) {
}

package com.example.quizapp.live.dto;

import java.util.List;

public record LiveRoomInfo(
		String code,
		String quizTitle,
		String hostName,
		String status,
		List<PlayerInfo> players,
		// Present only when status is ACTIVE, so reconnecting clients can
		// resync to the running question without waiting for the next broadcast.
		LiveQuestionPayload currentQuestion) {
}

package com.example.quizapp.live.dto;

import java.util.List;

public record LiveRoomInfo(
		String code,
		String quizTitle,
		String hostName,
		String status,
		List<PlayerInfo> players) {
}

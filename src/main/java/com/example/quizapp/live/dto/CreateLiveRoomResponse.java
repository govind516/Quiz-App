package com.example.quizapp.live.dto;

public record CreateLiveRoomResponse(
		LiveRoomInfo room,
		String creatorPlayerId) {
}

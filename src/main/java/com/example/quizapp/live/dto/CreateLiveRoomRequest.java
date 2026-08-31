package com.example.quizapp.live.dto;

import jakarta.validation.constraints.NotNull;

public record CreateLiveRoomRequest(
		@NotNull Long quizId,
		Boolean joinAsPlayer) {
}

package com.example.quizapp.live.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record JoinLiveRoomRequest(
		@NotBlank @Size(max = 30) String nickname) {
}

package com.example.quizapp.live.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record JoinLiveRoomRequest(
		@NotBlank @Size(max = 30)
		@Pattern(regexp = "^[\\p{L}\\p{N}][\\p{L}\\p{N} _.'-]*$", message = "Only letters, digits, spaces and _ . ' - are allowed")
		String nickname) {
}

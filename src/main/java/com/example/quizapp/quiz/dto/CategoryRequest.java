package com.example.quizapp.quiz.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
		@NotBlank @Size(max = 100) String name,
		@Size(max = 100) String slug,
		@Size(max = 500) String description) {
}

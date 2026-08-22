package com.example.quizapp.quiz.dto;


import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GenerateQuestionsRequest(
		@NotBlank @Size(max = 200) String topic,
		@NotNull @Min(1) @Max(20) Integer count,
		@NotNull com.example.quizapp.quiz.QuestionType questionType,
		com.example.quizapp.quiz.Difficulty difficulty) {
}

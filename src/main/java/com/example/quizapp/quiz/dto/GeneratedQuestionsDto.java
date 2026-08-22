package com.example.quizapp.quiz.dto;

import java.util.List;

import com.example.quizapp.quiz.dto.QuestionAdminDto;

public record GeneratedQuestionsDto(int created, int discarded, List<QuestionAdminDto> questions) {
}

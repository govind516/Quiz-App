package com.example.quizapp.quiz.dto;

import java.util.List;


public record GeneratedQuestionsDto(int created, int discarded, List<QuestionAdminDto> questions) {
}

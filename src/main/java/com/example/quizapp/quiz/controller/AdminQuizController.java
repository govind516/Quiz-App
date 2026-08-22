package com.example.quizapp.quiz.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.quizapp.quiz.dto.QuizDto;
import com.example.quizapp.quiz.service.QuizService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin")
public class AdminQuizController {

	private final QuizService quizService;

	@GetMapping("/api/admin/quizzes")
	public ResponseEntity<List<QuizDto>> listAll() {
		return ResponseEntity.ok(quizService.listAllForAdmin());
	}
}

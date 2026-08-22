package com.example.quizapp.quiz.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.quizapp.quiz.dto.QuestionAdminDto;
import com.example.quizapp.quiz.dto.QuestionUpsertRequest;
import com.example.quizapp.quiz.service.AdminQuestionService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin")
public class AdminQuestionController {

	private final AdminQuestionService adminQuestionService;

	@GetMapping("/quizzes/{quizId}/questions")
	public ResponseEntity<List<QuestionAdminDto>> listByQuiz(@PathVariable Long quizId) {
		return ResponseEntity.ok(adminQuestionService.listByQuiz(quizId));
	}

	@PostMapping("/questions")
	public ResponseEntity<QuestionAdminDto> create(
			@RequestParam("quizId") Long quizId,
			@Valid @RequestBody QuestionUpsertRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(adminQuestionService.create(quizId, request));
	}

	@PutMapping("/questions/{id}")
	public ResponseEntity<QuestionAdminDto> update(@PathVariable Long id,
			@Valid @RequestBody QuestionUpsertRequest request) {
		return ResponseEntity.ok(adminQuestionService.update(id, request));
	}

	@PostMapping("/questions/{id}/approve")
	public ResponseEntity<QuestionAdminDto> approve(@PathVariable Long id) {
		return ResponseEntity.ok(adminQuestionService.approve(id));
	}

	@DeleteMapping("/questions/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		adminQuestionService.delete(id);
		return ResponseEntity.noContent().build();
	}
}

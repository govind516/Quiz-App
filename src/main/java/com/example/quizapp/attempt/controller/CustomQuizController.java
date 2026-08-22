package com.example.quizapp.attempt.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.quizapp.attempt.dto.CustomQuizRequest;
import com.example.quizapp.attempt.dto.StartAttemptResponse;
import com.example.quizapp.attempt.service.AttemptService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/custom-quizzes")
@RequiredArgsConstructor
@Tag(name = "Custom Quizzes")
public class CustomQuizController {

	private final AttemptService attemptService;

	@PostMapping
	public ResponseEntity<StartAttemptResponse> create(@Valid @RequestBody CustomQuizRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(attemptService.startCustom(request));
	}
}

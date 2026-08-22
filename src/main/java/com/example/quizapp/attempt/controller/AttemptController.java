package com.example.quizapp.attempt.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.quizapp.attempt.dto.AttemptResultDto;
import com.example.quizapp.attempt.dto.SubmitAttemptRequest;
import com.example.quizapp.attempt.service.AttemptService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@Tag(name = "Attempts")
public class AttemptController {

	private final AttemptService attemptService;

	@PostMapping("/api/attempts/{id}/submit")
	public ResponseEntity<AttemptResultDto> submit(
			@PathVariable Long id,
			@Valid @RequestBody SubmitAttemptRequest request) {
		return ResponseEntity.ok(attemptService.submit(id, request));
	}

	@GetMapping("/api/attempts/{id}/result")
	public ResponseEntity<AttemptResultDto> result(
			@PathVariable Long id,
			@RequestParam(value = "guestSessionId", required = false) String guestSessionId) {
		return ResponseEntity.ok(attemptService.result(id, guestSessionId));
	}
}

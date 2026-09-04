package com.example.quizapp.attempt.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.quizapp.attempt.dto.AttemptResultDto;
import com.example.quizapp.attempt.dto.SubmitAttemptRequest;
import com.example.quizapp.attempt.service.AttemptService;
import com.example.quizapp.auth.CurrentUserProvider;
import com.example.quizapp.common.ratelimit.ClientIdentifiers;
import com.example.quizapp.common.ratelimit.RateLimitService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@Tag(name = "Attempts")
public class AttemptController {

	private final AttemptService attemptService;
	private final CurrentUserProvider currentUserProvider;
	private final RateLimitService rateLimitService;

	@PostMapping("/api/attempts/{id}/submit")
	public ResponseEntity<AttemptResultDto> submit(
			@PathVariable Long id,
			@Valid @RequestBody SubmitAttemptRequest request,
			HttpServletRequest httpRequest) {
		Long userId = currentUserProvider.get().isPresent() ? currentUserProvider.get().get().getId() : null;
		rateLimitService.checkSubmit(ClientIdentifiers.identity(userId, httpRequest));
		return ResponseEntity.ok(attemptService.submit(id, request));
	}

	@GetMapping("/api/attempts/{id}/result")
	public ResponseEntity<AttemptResultDto> result(
			@PathVariable Long id,
			@RequestParam(value = "guestSessionId", required = false) String guestSessionId) {
		return ResponseEntity.ok(attemptService.result(id, guestSessionId));
	}
}

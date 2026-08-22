package com.example.quizapp.quiz.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.quizapp.attempt.dto.StartAttemptRequest;
import com.example.quizapp.attempt.dto.StartAttemptResponse;
import com.example.quizapp.attempt.service.AttemptService;
import com.example.quizapp.auth.CurrentUserProvider;
import com.example.quizapp.common.ratelimit.ClientIdentifiers;
import com.example.quizapp.common.ratelimit.RateLimitService;
import com.example.quizapp.quiz.Difficulty;
import com.example.quizapp.quiz.dto.QuizCreateRequest;
import com.example.quizapp.quiz.dto.QuizDto;
import com.example.quizapp.quiz.dto.QuizUpdateRequest;
import com.example.quizapp.quiz.service.QuizService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
@Tag(name = "Quizzes")
public class QuizController {

	private final QuizService quizService;
	private final AttemptService attemptService;
	private final CurrentUserProvider currentUserProvider;
	private final RateLimitService rateLimitService;

	@GetMapping
	public ResponseEntity<List<QuizDto>> browse(
			@RequestParam(required = false) String category,
			@RequestParam(required = false) Difficulty difficulty,
			@RequestParam(required = false) String tag) {
		return ResponseEntity.ok(quizService.browse(category, difficulty, tag));
	}

	@GetMapping("/{id}")
	public ResponseEntity<QuizDto> detail(@PathVariable Long id) {
		return ResponseEntity.ok(quizService.getDetail(id));
	}

	@PostMapping
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<QuizDto> create(@Valid @RequestBody QuizCreateRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(quizService.create(request));
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<QuizDto> update(@PathVariable Long id, @Valid @RequestBody QuizUpdateRequest request) {
		return ResponseEntity.ok(quizService.update(id, request));
	}

	@PostMapping("/{id}/start")
	public ResponseEntity<StartAttemptResponse> start(
			@PathVariable Long id,
			@RequestBody(required = false) StartAttemptRequest request,
			HttpServletRequest httpRequest) {
		rateLimitService.checkStart(ClientIdentifiers.identity(
				currentUserProvider.get().map(com.example.quizapp.user.User::getId).orElse(null),
				request == null ? null : request.guestSessionId(),
				httpRequest));
		return ResponseEntity.status(HttpStatus.CREATED).body(attemptService.start(id, request));
	}
}

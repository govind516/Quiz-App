package com.example.quizapp.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.quizapp.auth.dto.AuthResponse;
import com.example.quizapp.auth.dto.LoginRequest;
import com.example.quizapp.auth.dto.RefreshTokenRequest;
import com.example.quizapp.auth.dto.RegisterRequest;
import com.example.quizapp.common.ratelimit.ClientIdentifiers;
import com.example.quizapp.common.ratelimit.RateLimitService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth")
public class AuthController {

	private final AuthService authService;
	private final RateLimitService rateLimitService;

	@PostMapping("/register")
	public ResponseEntity<AuthResponse> register(
			@Valid @RequestBody RegisterRequest request,
			HttpServletRequest httpRequest) {
		rateLimitService.checkAuth(ClientIdentifiers.clientIp(httpRequest));
		return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
	}

	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(
			@Valid @RequestBody LoginRequest request,
			HttpServletRequest httpRequest) {
		rateLimitService.checkAuth(ClientIdentifiers.clientIp(httpRequest));
		return ResponseEntity.ok(authService.login(request));
	}

	@PostMapping("/refresh")
	public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
		return ResponseEntity.ok(authService.refresh(request));
	}
}

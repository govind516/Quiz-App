package com.example.quizapp.auth;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.example.quizapp.auth.AppUserDetailsService.AppUserPrincipal;
import com.example.quizapp.auth.dto.AuthResponse;
import com.example.quizapp.auth.dto.LoginRequest;
import com.example.quizapp.auth.dto.RefreshTokenRequest;
import com.example.quizapp.auth.dto.RegisterRequest;
import com.example.quizapp.auth.dto.UserResponse;
import com.example.quizapp.common.exception.ConflictException;
import com.example.quizapp.user.Role;
import com.example.quizapp.user.User;
import com.example.quizapp.user.UserRepository;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

	private final UserRepository userRepository;
	private final JwtService jwtService;
	private final AuthenticationManager authenticationManager;
	private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

	public AuthResponse register(RegisterRequest request) {
		String email = request.email().trim();
		if (userRepository.existsByEmailIgnoreCase(email)) {
			throw new ConflictException("Email is already registered");
		}
		User user = User.builder()
				.name(request.name().trim())
				.email(email.toLowerCase())
				.passwordHash(passwordEncoder.encode(request.password()))
				.role(Role.USER)
				.build();
		user = userRepository.save(user);
		return buildAuthResponse(user);
	}

	public AuthResponse login(LoginRequest request) {
		Authentication authentication = authenticationManager.authenticate(
				new UsernamePasswordAuthenticationToken(request.email(), request.password()));
		AppUserPrincipal principal = (AppUserPrincipal) authentication.getPrincipal();
		return buildAuthResponse(principal.getUser());
	}

	public AuthResponse refresh(RefreshTokenRequest request) {
		Claims claims = jwtService.parse(request.refreshToken());
		jwtService.validateRefreshToken(claims);
		User user = userRepository.findByEmailIgnoreCase(claims.getSubject())
				.orElseThrow(() -> new ConflictException("Account no longer exists"));
		return buildAuthResponse(user);
	}

	private AuthResponse buildAuthResponse(User user) {
		return new AuthResponse(
				jwtService.generateAccessToken(user),
				jwtService.generateRefreshToken(user),
				"Bearer",
				jwtService.getAccessExpirationMs(),
				toUserResponse(user));
	}

	private UserResponse toUserResponse(User user) {
		return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole().name());
	}
}

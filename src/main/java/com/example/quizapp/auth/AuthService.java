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
	private final TokenDenylistService tokenDenylistService;
	private final com.example.quizapp.settings.SettingsService settingsService;

	public AuthResponse register(RegisterRequest request) {
		if (!settingsService.isRegistrationEnabled()) {
			throw new ConflictException("Registration is currently disabled");
		}
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
		if (principal.getUser().isBanned()) {
			throw new org.springframework.security.authentication.LockedException("Account suspended");
		}
		return buildAuthResponse(principal.getUser());
	}

	public AuthResponse refresh(RefreshTokenRequest request) {
		Claims claims = jwtService.parse(request.refreshToken());
		jwtService.validateRefreshToken(claims);
		String jti = claims.getId();
		if (jti != null && tokenDenylistService.isRevoked(jti)) {
			throw new io.jsonwebtoken.JwtException("Refresh token has been revoked");
		}
		User user = userRepository.findByEmailIgnoreCase(claims.getSubject())
				.orElseThrow(() -> new ConflictException("Account no longer exists"));
		if (user.isBanned()) {
			throw new org.springframework.security.access.AccessDeniedException("Account suspended");
		}
		AuthResponse response = buildAuthResponse(user);
		if (jti != null) {
			long remainingMs = Math.max(1000, claims.getExpiration().getTime() - System.currentTimeMillis());
			tokenDenylistService.revoke(jti, java.time.Duration.ofMillis(remainingMs));
		}
		return response;
	}

	public void logout(String rawRefreshToken) {
		if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
			return;
		}
		try {
			Claims claims = jwtService.parse(rawRefreshToken);
			jwtService.validateRefreshToken(claims);
			String jti = claims.getId();
			if (jti != null) {
				long remainingMs = Math.max(1000, claims.getExpiration().getTime() - System.currentTimeMillis());
				tokenDenylistService.revoke(jti, java.time.Duration.ofMillis(remainingMs));
			}
		} catch (io.jsonwebtoken.JwtException | IllegalArgumentException ignored) {
			// unknown/expired token — nothing to revoke; logout stays idempotent
		}
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

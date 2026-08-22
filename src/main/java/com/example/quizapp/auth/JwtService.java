package com.example.quizapp.auth;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.quizapp.user.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

	public static final String CLAIM_UID = "uid";
	public static final String CLAIM_ROLE = "role";
	public static final String CLAIM_TYPE = "type";
	public static final String TYPE_ACCESS = "access";
	public static final String TYPE_REFRESH = "refresh";

	private final SecretKey signingKey;
	private final long accessExpirationMs;
	private final long refreshExpirationMs;

	public JwtService(
			@Value("${app.jwt.secret}") String secret,
			@Value("${app.jwt.access-expiration-ms}") long accessExpirationMs,
			@Value("${app.jwt.refresh-expiration-ms}") long refreshExpirationMs) {
		this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
		this.accessExpirationMs = accessExpirationMs;
		this.refreshExpirationMs = refreshExpirationMs;
	}

	public String generateAccessToken(User user) {
		return buildToken(user, TYPE_ACCESS, accessExpirationMs, null);
	}

	public String generateRefreshToken(User user) {
		return buildToken(user, TYPE_REFRESH, refreshExpirationMs,
				java.util.UUID.randomUUID().toString());
	}

	public Claims parse(String token) {
		return Jwts.parser()
				.verifyWith(signingKey)
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}

	public void validateRefreshToken(Claims claims) {
		if (!TYPE_REFRESH.equals(claims.get(CLAIM_TYPE, String.class))) {
			throw new JwtException("Not a refresh token");
		}
	}

	public long getAccessExpirationMs() {
		return accessExpirationMs;
	}

	private String buildToken(User user, String type, long ttlMs, String jti) {
		Date now = new Date();
		var builder = Jwts.builder()
				.subject(user.getEmail())
				.claim(CLAIM_UID, user.getId())
				.claim(CLAIM_ROLE, "ROLE_" + user.getRole().name())
				.claim(CLAIM_TYPE, type)
				.issuedAt(now)
				.expiration(new Date(now.getTime() + ttlMs));
		if (jti != null) {
			builder.id(jti);
		}
		return builder.signWith(signingKey).compact();
	}
}

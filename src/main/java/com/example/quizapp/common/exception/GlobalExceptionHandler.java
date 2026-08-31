package com.example.quizapp.common.exception;

import java.util.HashMap;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import lombok.extern.slf4j.Slf4j;

import com.example.quizapp.common.ratelimit.TooManyRequestsException;

import io.jsonwebtoken.JwtException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(TooManyRequestsException.class)
	public ResponseEntity<ErrorResponse> handleTooManyRequests(TooManyRequestsException ex) {
		return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
				.body(ErrorResponse.of(429, ex.getMessage()));
	}

	@ExceptionHandler(ResourceNotFoundException.class)
	public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ErrorResponse.of(404, ex.getMessage()));
	}

	@ExceptionHandler(BadRequestException.class)
	public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException ex) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ErrorResponse.of(400, ex.getMessage()));
	}

	@ExceptionHandler(ConflictException.class)
	public ResponseEntity<ErrorResponse> handleConflict(ConflictException ex) {
		return ResponseEntity.status(HttpStatus.CONFLICT).body(ErrorResponse.of(409, ex.getMessage()));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
		Map<String, String> errors = new HashMap<>();
		for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
			errors.putIfAbsent(fe.getField(), fe.getDefaultMessage());
		}
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(ErrorResponse.withFieldErrors(400, "Validation failed", errors));
	}

	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(ErrorResponse.of(400, "Invalid value for parameter: " + ex.getName()));
	}

	@ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
	public ResponseEntity<ErrorResponse> handleUnreadableBody(org.springframework.http.converter.HttpMessageNotReadableException ex) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(ErrorResponse.of(400, "Malformed request body"));
	}

	@ExceptionHandler({ JwtException.class, io.jsonwebtoken.security.SecurityException.class })
	public ResponseEntity<ErrorResponse> handleJwt(JwtException ex) {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ErrorResponse.of(401, "Invalid or expired token"));
	}

	@ExceptionHandler(BadCredentialsException.class)
	public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex) {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ErrorResponse.of(401, "Invalid email or password"));
	}

	@ExceptionHandler(LockedException.class)
	public ResponseEntity<ErrorResponse> handleLocked(LockedException ex) {
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ErrorResponse.of(403, "Account suspended"));
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ErrorResponse.of(403, ex.getMessage()));
	}

	@ExceptionHandler(ObjectOptimisticLockingFailureException.class)
	public ResponseEntity<ErrorResponse> handleOptimisticLock(ObjectOptimisticLockingFailureException ex) {
		return ResponseEntity.status(HttpStatus.CONFLICT).body(ErrorResponse.of(409, "Concurrent update detected"));
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex) {
		return ResponseEntity.status(HttpStatus.CONFLICT)
				.body(ErrorResponse.of(409, "Operation violates data integrity (record may be referenced elsewhere)"));
	}

	@ExceptionHandler(NoResourceFoundException.class)
	public ResponseEntity<ErrorResponse> handleNoResource(NoResourceFoundException ex) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ErrorResponse.of(404, "Resource not found"));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
		log.error("Unhandled exception", ex);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(ErrorResponse.of(500, "An unexpected error occurred"));
	}
}

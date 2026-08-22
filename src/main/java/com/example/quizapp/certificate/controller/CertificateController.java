package com.example.quizapp.certificate.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.quizapp.auth.CurrentUserProvider;
import com.example.quizapp.certificate.CertificateService;
import com.example.quizapp.certificate.dto.CertificateDto;
import com.example.quizapp.certificate.dto.CategoryProgressDto;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
@Tag(name = "Certificates")
public class CertificateController {

	private final CertificateService certificateService;
	private final CurrentUserProvider currentUserProvider;

	@GetMapping("/categories")
	public ResponseEntity<List<CategoryProgressDto>> categories() {
		return ResponseEntity.ok(
				certificateService.eligibility(currentUserProvider.requireCurrentUser().getId()));
	}

	@PostMapping("/claim/{categoryId}")
	public ResponseEntity<CertificateDto> claim(@PathVariable Long categoryId) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(certificateService.claim(currentUserProvider.requireCurrentUser().getId(), categoryId));
	}

	@GetMapping("/mine")
	public ResponseEntity<List<CertificateDto>> mine() {
		return ResponseEntity.ok(
				certificateService.myCertificates(currentUserProvider.requireCurrentUser().getId()));
	}

	@GetMapping("/{code}")
	public ResponseEntity<CertificateDto> verify(@PathVariable String code) {
		return ResponseEntity.ok(certificateService.verify(code));
	}
}

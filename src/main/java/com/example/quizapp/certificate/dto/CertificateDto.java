package com.example.quizapp.certificate.dto;

import java.time.Instant;

public record CertificateDto(
		String code,
		String userName,
		Long categoryId,
		String categoryName,
		Instant issuedAt) {
}

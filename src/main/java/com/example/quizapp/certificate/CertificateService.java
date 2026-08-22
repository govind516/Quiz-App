package com.example.quizapp.certificate;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.quizapp.attempt.AttemptStatus;
import com.example.quizapp.attempt.QuizAttempt;
import com.example.quizapp.attempt.repository.QuizAttemptRepository;
import com.example.quizapp.certificate.dto.CertificateDto;
import com.example.quizapp.certificate.dto.CategoryProgressDto;
import com.example.quizapp.certificate.repository.CertificateRepository;
import com.example.quizapp.common.exception.BadRequestException;
import com.example.quizapp.common.exception.ResourceNotFoundException;
import com.example.quizapp.quiz.Quiz;
import com.example.quizapp.quiz.repository.QuestionRepository;
import com.example.quizapp.quiz.repository.QuizRepository;
import com.example.quizapp.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CertificateService {

	private static final double PASS_PERCENTAGE = 60.0;
	private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

	private final CertificateRepository certificateRepository;
	private final QuizRepository quizRepository;
	private final QuizAttemptRepository attemptRepository;
	private final QuestionRepository questionRepository;
	private final UserRepository userRepository;

	@Transactional(readOnly = true)
	public List<CategoryProgressDto> eligibility(Long userId) {
		Map<Long, Double> bestPctByQuiz = bestPercentageByQuiz(userId);
		Map<Long, List<Quiz>> byCategory = new TreeMap<>();
		for (Quiz quiz : quizRepository.findAllByIsPublishedTrue()) {
			byCategory.computeIfAbsent(quiz.getCategory().getId(), k -> new java.util.ArrayList<>())
					.add(quiz);
		}
		return byCategory.entrySet().stream()
				.map(entry -> {
					List<Quiz> quizzes = entry.getValue();
					int completed = (int) quizzes.stream()
							.filter(q -> bestPctByQuiz.getOrDefault(q.getId(), 0.0) >= PASS_PERCENTAGE)
							.count();
					return new CategoryProgressDto(
							entry.getKey(),
							quizzes.get(0).getCategory().getName(),
							quizzes.size(),
							completed,
							completed == quizzes.size());
				})
				.toList();
	}

	@Transactional
	public CertificateDto claim(Long userId, Long categoryId) {
		certificateRepository.findByUserIdAndCategoryId(userId, categoryId)
				.ifPresent(existing -> {
					throw new BadRequestException("Certificate already claimed");
				});
		List<CategoryProgressDto> progress = eligibility(userId).stream()
				.filter(p -> p.categoryId().equals(categoryId))
				.toList();
		if (progress.isEmpty()) {
			throw new ResourceNotFoundException("Category", categoryId);
		}
		CategoryProgressDto category = progress.get(0);
		if (!category.eligible()) {
			throw new BadRequestException(
					"Complete all " + category.totalQuizzes() + " quizzes in this category with 60%+ to earn the certificate ("
							+ category.completedQuizzes() + "/" + category.totalQuizzes() + " done)");
		}
		var user = userRepository.findById(userId)
				.orElseThrow(() -> new ResourceNotFoundException("User", userId));
		Certificate certificate = certificateRepository.save(Certificate.builder()
				.code(generateCode())
				.user(user)
				.categoryId(categoryId)
				.categoryName(category.categoryName())
				.issuedAt(Instant.now())
				.build());
		return toDto(certificate);
	}

	@Transactional(readOnly = true)
	public CertificateDto verify(String code) {
		return certificateRepository.findByCode(code.trim().toUpperCase())
				.map(this::toDto)
				.orElseThrow(() -> new ResourceNotFoundException("Certificate", code));
	}

	@Transactional(readOnly = true)
	public List<CertificateDto> myCertificates(Long userId) {
		return certificateRepository.findAllByUserIdOrderByIssuedAtDesc(userId).stream()
				.map(this::toDto)
				.toList();
	}

	private Map<Long, Double> bestPercentageByQuiz(Long userId) {
		Map<Long, Double> best = new HashMap<>();
		for (QuizAttempt attempt : attemptRepository
				.findAllByUserIdAndStatusOrderByCompletedAtDesc(userId, AttemptStatus.SUBMITTED)) {
			long totalPoints = questionRepository.sumPointsByQuizId(attempt.getQuiz().getId());
			double pct = totalPoints > 0 ? Math.min(attempt.getScore() * 100.0 / totalPoints, 100.0) : 0;
			best.merge(attempt.getQuiz().getId(), pct, Math::max);
		}
		return best;
	}

	private String generateCode() {
		SecureRandom random = new SecureRandom();
		StringBuilder sb = new StringBuilder(8);
		for (int i = 0; i < 8; i++) {
			sb.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
		}
		String code = sb.toString();
		while (certificateRepository.findByCode(code).isPresent()) {
			sb.setCharAt(random.nextInt(8), ALPHABET.charAt(random.nextInt(ALPHABET.length())));
			code = sb.toString();
		}
		return code;
	}

	private CertificateDto toDto(Certificate certificate) {
		return new CertificateDto(
				certificate.getCode(),
				certificate.getUser().getName(),
				certificate.getCategoryId(),
				certificate.getCategoryName(),
				certificate.getIssuedAt());
	}
}

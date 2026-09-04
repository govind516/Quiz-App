package com.example.quizapp.user;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.example.quizapp.attempt.AttemptStatus;
import com.example.quizapp.attempt.repository.AttemptAnswerRepository;
import com.example.quizapp.attempt.repository.QuizAttemptRepository;
import com.example.quizapp.common.exception.ResourceNotFoundException;
import com.example.quizapp.user.dto.AdminUserDto;
import com.example.quizapp.user.dto.AdminUsersResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class AdminUserService {

	private final UserRepository userRepository;
	private final QuizAttemptRepository attemptRepository;
	private final AttemptAnswerRepository answerRepository;

	@Transactional(readOnly = true)
	public AdminUsersResponse page(String query, int page, int size) {
		int safePage = Math.max(0, page);
		int safeSize = Math.min(Math.max(1, size), 50);
		Pageable pageable = PageRequest.of(safePage, safeSize);

		Page<User> result;
		if (StringUtils.hasText(query)) {
			String q = query.trim();
			result = userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(q, q, pageable);
		} else {
			result = userRepository.findAll(pageable);
		}

		List<AdminUserDto> items = result.getContent().stream().map(this::toDto).toList();
		return new AdminUsersResponse(items, result.getTotalElements(), safePage, safeSize);
	}

	@Transactional
	public AdminUserDto setBanned(Long id, boolean banned) {
		User user = userRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("User", id));
		user.setBanned(banned);
		userRepository.save(user);
		return toDto(user);
	}

	@Transactional
	public String deleteProgress(Long id) {
		userRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("User", id));
		int answers = answerRepository.deleteAllForUser(id);
		int attempts = attemptRepository.deleteByUserId(id);
		return "Deleted " + attempts + " attempt(s) and " + answers + " answer(s)";
	}

	private AdminUserDto toDto(User user) {
		long completed = attemptRepository.countByUserIdAndStatus(user.getId(), AttemptStatus.SUBMITTED);
		return new AdminUserDto(
				user.getId(),
				user.getName(),
				user.getEmail(),
				user.getRole().name(),
				user.getCreatedAt(),
				completed,
				user.isBanned());
	}
}

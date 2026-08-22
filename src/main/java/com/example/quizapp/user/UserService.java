package com.example.quizapp.user;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.quizapp.attempt.AttemptStatus;
import com.example.quizapp.attempt.QuizAttempt;
import com.example.quizapp.attempt.dto.AttemptResultDto;
import com.example.quizapp.attempt.repository.QuizAttemptRepository;
import com.example.quizapp.common.exception.ResourceNotFoundException;
import com.example.quizapp.quiz.repository.QuestionRepository;
import com.example.quizapp.user.dto.UserStatsDto;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

	private final UserRepository userRepository;
	private final QuizAttemptRepository attemptRepository;
	private final QuestionRepository questionRepository;

	@Transactional(readOnly = true)
	public List<AttemptResultDto> history(Long userId) {
		requireUser(userId);
		return attemptRepository.findAllByUserIdAndStatusOrderByCompletedAtDesc(userId, AttemptStatus.SUBMITTED)
				.stream()
				.map(this::toHistoryItem)
				.toList();
	}

	@Transactional(readOnly = true)
	public UserStatsDto stats(Long userId) {
		requireUser(userId);
		List<QuizAttempt> completed = attemptRepository
				.findAllByUserIdAndStatusOrderByCompletedAtDesc(userId, AttemptStatus.SUBMITTED);
		long totalAttempts = attemptRepository.countByUserId(userId);

		double best = 0;
		double sum = 0;
		int pointsEarned = 0;
		for (QuizAttempt attempt : completed) {
			long totalPoints = questionRepository.sumPointsByQuizId(attempt.getQuiz().getId());
			double percentage = totalPoints > 0 ? (attempt.getScore() * 100.0 / totalPoints) : 0;
			sum += Math.min(percentage, 100.0);
			best = Math.max(best, Math.min(percentage, 100.0));
			pointsEarned += attempt.getScore();
		}
		double average = completed.isEmpty() ? 0 : Math.round((sum / completed.size()) * 10.0) / 10.0;
		return new UserStatsDto(totalAttempts, completed.size(), average, best, pointsEarned);
	}

	private AttemptResultDto toHistoryItem(QuizAttempt attempt) {
		long totalPoints = questionRepository.sumPointsByQuizId(attempt.getQuiz().getId());
		double percentage = totalPoints > 0
				? Math.round(attempt.getScore() * 1000.0 / totalPoints) / 10.0
				: 0.0;
		return new AttemptResultDto(
				attempt.getId(),
				attempt.getQuiz().getId(),
				attempt.getQuiz().getTitle(),
				attempt.getStatus(),
				attempt.getScore(),
				totalPoints,
				percentage,
				attempt.getStartedAt(),
				attempt.getCompletedAt(),
				0L,
				List.of());
	}

	private void requireUser(Long userId) {
		if (!userRepository.existsById(userId)) {
			throw new ResourceNotFoundException("User", userId);
		}
	}
}

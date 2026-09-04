package com.example.quizapp.user;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.quizapp.attempt.AttemptStatus;
import com.example.quizapp.attempt.QuizAttempt;
import com.example.quizapp.attempt.dto.AttemptResultDto;
import com.example.quizapp.attempt.repository.QuizAttemptRepository;
import com.example.quizapp.attempt.service.AttemptPointsResolver;
import com.example.quizapp.common.exception.ResourceNotFoundException;
import com.example.quizapp.user.dto.BadgeDto;
import com.example.quizapp.user.dto.UserStatsDto;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class UserService {

	private final UserRepository userRepository;
	private final QuizAttemptRepository attemptRepository;
	private final AttemptPointsResolver attemptPointsResolver;

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
		Set<LocalDate> activeDays = new TreeSet<>();
		for (QuizAttempt attempt : completed) {
			long totalPoints = attemptPointsResolver.resolveTotalPoints(attempt);
			double percentage = totalPoints > 0 ? Math.min(attempt.getScore() * 100.0 / totalPoints, 100.0) : 0;
			sum += percentage;
			best = Math.max(best, percentage);
			pointsEarned += attempt.getScore();
			if (attempt.getCompletedAt() != null) {
				activeDays.add(attempt.getCompletedAt().atZone(ZoneId.systemDefault()).toLocalDate());
			}
		}
		double average = completed.isEmpty() ? 0 : Math.round((sum / completed.size()) * 10.0) / 10.0;

		int currentStreak = currentStreak(activeDays);
		int bestStreak = bestStreak(activeDays);
		return new UserStatsDto(totalAttempts, completed.size(), average, best, pointsEarned,
				currentStreak, bestStreak);
	}

	@Transactional(readOnly = true)
	public List<BadgeDto> badges(Long userId) {
		UserStatsDto s = stats(userId);
		List<AttemptResultDto> history = history(userId);
		boolean perfect = history.stream().anyMatch(h -> h.totalPoints() > 0 && h.percentage() >= 100.0);
		int bestStreak = Math.max(s.currentStreak(), s.bestStreak());
		return List.of(
				new BadgeDto("FIRST_STEPS", "First Steps", "Complete your first quiz",
						s.completedAttempts() >= 1),
				new BadgeDto("QUIZ_MACHINE", "Quiz Machine", "Complete 10 quizzes",
						s.completedAttempts() >= 10),
				new BadgeDto("PERFECT_SCORE", "Perfect Score", "Score 100% on any quiz",
						perfect),
				new BadgeDto("CONSISTENT", "Consistent", "Reach a 3-day answering streak",
						bestStreak >= 3),
				new BadgeDto("ON_FIRE", "On Fire", "Reach a 7-day answering streak",
						bestStreak >= 7),
				new BadgeDto("SHARP_SHOOTER", "Sharp Shooter", "Average 75%+ across 5+ quizzes",
						s.completedAttempts() >= 5 && s.averagePercentage() >= 75));
	}

	private int currentStreak(Set<LocalDate> activeDays) {
		if (activeDays.isEmpty()) {
			return 0;
		}
		LocalDate day = LocalDate.now();
		if (!activeDays.contains(day)) {
			day = day.minusDays(1);
		}
		int streak = 0;
		while (activeDays.contains(day)) {
			streak++;
			day = day.minusDays(1);
		}
		return streak;
	}

	private int bestStreak(Set<LocalDate> activeDays) {
		int best = 0;
		int run = 0;
		LocalDate previous = null;
		for (LocalDate day : activeDays.stream().sorted().collect(Collectors.toList())) {
			run = (previous != null && day.equals(previous.plusDays(1))) ? run + 1 : 1;
			best = Math.max(best, run);
			previous = day;
		}
		return best;
	}

	private AttemptResultDto toHistoryItem(QuizAttempt attempt) {
		long totalPoints = attemptPointsResolver.resolveTotalPoints(attempt);
		double percentage = totalPoints > 0
				? Math.round(attempt.getScore() * 1000.0 / totalPoints) / 10.0
				: 0.0;
		Long quizId = attempt.getQuiz() == null ? null : attempt.getQuiz().getId();
		return new AttemptResultDto(
				attempt.getId(),
				quizId,
				attempt.getTitle(),
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

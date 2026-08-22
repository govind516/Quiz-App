package com.example.quizapp.attempt;

import java.time.Instant;

import com.example.quizapp.quiz.Quiz;
import com.example.quizapp.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "quiz_attempts", indexes = {
		@Index(name = "idx_attempt_user", columnList = "user_id"),
		@Index(name = "idx_attempt_quiz", columnList = "quiz_id")
})
public class QuizAttempt {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id")
	private User user;

	@Column(name = "guest_session_id", length = 36)
	private String guestSessionId;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "quiz_id", nullable = false)
	private Quiz quiz;

	@Column(nullable = false)
	@Builder.Default
	private int score = 0;

	@Column(name = "started_at", nullable = false)
	private Instant startedAt;

	@Column(name = "completed_at")
	private Instant completedAt;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private AttemptStatus status;

	@Column(name = "question_order", columnDefinition = "text")
	private String questionOrder;

	@Column(name = "option_order", columnDefinition = "text")
	private String optionOrder;

	@Version
	private Long version;
}

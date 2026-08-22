package com.example.quizapp.user;

import java.time.Instant;

import com.example.quizapp.quiz.Quiz;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
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
@Table(name = "bookmarks", uniqueConstraints = @UniqueConstraint(
		name = "uq_user_quiz", columnNames = { "user_id", "quiz_id" }))
public class Bookmark {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	private User user;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	private Quiz quiz;

	@Column(name = "created_at")
	private Instant createdAt;
}

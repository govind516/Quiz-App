package com.example.quizapp.attempt;

import java.util.LinkedHashSet;
import java.util.Set;

import com.example.quizapp.quiz.Question;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
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
@Table(name = "attempt_answers", uniqueConstraints = @UniqueConstraint(
		name = "uq_attempt_question", columnNames = { "attempt_id", "question_id" }))
public class AttemptAnswer {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "attempt_id", nullable = false)
	private QuizAttempt attempt;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "question_id", nullable = false)
	private Question question;

	@ElementCollection(fetch = FetchType.EAGER)
	@CollectionTable(name = "attempt_answer_selected_options",
			joinColumns = @JoinColumn(name = "attempt_answer_id"))
	@Column(name = "selected_option_id")
	@Builder.Default
	private Set<Long> selectedOptionIds = new LinkedHashSet<>();

	@Column(name = "is_correct", nullable = false)
	private boolean isCorrect;
}

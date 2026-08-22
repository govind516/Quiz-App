package com.example.quizapp.attempt.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.example.quizapp.quiz.Option;
import com.example.quizapp.quiz.Question;
import com.example.quizapp.quiz.QuestionType;

class AnswerGraderTest {

	private Question question(QuestionType type, Option... options) {
		Question q = Question.builder().questionText("q").type(type).points(1).build();
		for (Option o : options) {
			o.setQuestion(q);
			q.getOptions().add(o);
		}
		return q;
	}

	private Option option(Long id, String text, boolean correct) {
		Option o = Option.builder().optionText(text).isCorrect(correct).build();
		o.setId(id);
		return o;
	}

	@Test
	@DisplayName("MCQ: single correct option must match exactly")
	void mcqExactMatch() {
		Question q = question(QuestionType.MCQ,
				option(1L, "a", false), option(2L, "b", true), option(3L, "c", false));

		assertThat(AnswerGrader.isCorrect(q, Set.of(2L))).isTrue();
		assertThat(AnswerGrader.isCorrect(q, Set.of(1L))).isFalse();
		assertThat(AnswerGrader.isCorrect(q, Set.of(1L, 2L))).isFalse();
	}

	@Test
	@DisplayName("MULTI_SELECT: full set must match, partial selection is wrong")
	void multiSelectRequiresExactSet() {
		Question q = question(QuestionType.MULTI_SELECT,
				option(1L, "a", true), option(2L, "b", false), option(3L, "c", true));

		assertThat(AnswerGrader.isCorrect(q, Set.of(3L, 1L))).isTrue();
		assertThat(AnswerGrader.isCorrect(q, Set.of(1L))).isFalse();
		assertThat(AnswerGrader.isCorrect(q, Set.of(1L, 2L, 3L))).isFalse();
		assertThat(AnswerGrader.isCorrect(q, Set.of(1L, 4L))).isFalse();
	}

	@Test
	@DisplayName("Empty or null selections never score")
	void emptySelectionsNeverScore() {
		Question q = question(QuestionType.MCQ,
				option(1L, "a", true), option(2L, "b", false));

		assertThat(AnswerGrader.isCorrect(q, Set.of())).isFalse();
		assertThat(AnswerGrader.isCorrect(q, null)).isFalse();
	}

	@Test
	@DisplayName("Questions without correct options can never be graded correct")
	void noCorrectOptionNeverScores() {
		Question q = question(QuestionType.MCQ,
				option(1L, "a", false), option(2L, "b", false));

		assertThat(AnswerGrader.isCorrect(q, Set.of(1L))).isFalse();
	}

	@Test
	@DisplayName("Ordering of selected ids is irrelevant")
	void orderIrrelevant() {
		List<Long> a = new ArrayList<>(List.of(1L, 3L));
		List<Long> b = new ArrayList<>(List.of(3L, 1L));
		Question q = question(QuestionType.MULTI_SELECT,
				option(1L, "a", true), option(2L, "b", false), option(3L, "c", true));

		assertThat(a.containsAll(b) && b.containsAll(a)).isTrue();
		assertThat(AnswerGrader.isCorrect(q, Set.copyOf(a)))
				.isEqualTo(AnswerGrader.isCorrect(q, Set.copyOf(b)));
	}
}

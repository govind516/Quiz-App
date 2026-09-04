package com.example.quizapp.quiz.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.example.quizapp.quiz.Option;
import com.example.quizapp.quiz.Question;

import lombok.RequiredArgsConstructor;

/**
 * Batched JDBC inserts for questions + options.
 * Replaces per-question questionRepository.save() (1 Question + 4 Options = 5 inserts × N)
 * with exactly 2 round trips: 1 for all questions (RETURNING id), 1 for all options.
 * Mirrors AttemptAnswerBatchService pattern proven on submit fix.
 */
@Service
@RequiredArgsConstructor
public class QuestionBatchService {

	private final JdbcTemplate jdbcTemplate;

	/**
	 * Inserts questions and their options in 1-2 round trips, assigns generated ids
	 * back to entities so caller can map to DTOs without re-query.
	 * Must be called inside @Transactional.
	 */
	public void batchInsert(List<Question> questions) {
		if (questions.isEmpty()) {
			return;
		}
		// 1) Parent: single multi-value INSERT ... RETURNING id (includes difficulty for validation)
		StringBuilder sql = new StringBuilder(
				"INSERT INTO questions (quiz_id, difficulty, question_text, type, explanation, points, status) VALUES ");
		List<Object> params = new ArrayList<>(questions.size() * 7);
		for (int i = 0; i < questions.size(); i++) {
			if (i > 0) sql.append(", ");
			sql.append("(?, ?, ?, ?, ?, ?, ?)");
			Question q = questions.get(i);
			params.add(q.getQuiz().getId());
			params.add(q.getDifficulty() != null ? q.getDifficulty().name() : null);
			params.add(q.getQuestionText());
			params.add(q.getType().name());
			params.add(q.getExplanation());
			params.add(q.getPoints());
			params.add(q.getStatus().name());
		}
		sql.append(" RETURNING id");
		List<Long> ids = jdbcTemplate.query(sql.toString(), params.toArray(),
				(rs, rowNum) -> rs.getLong(1));
		if (ids.size() != questions.size()) {
			throw new IllegalStateException("Question batch returned " + ids.size() + " ids, expected " + questions.size());
		}
		for (int i = 0; i < questions.size(); i++) {
			questions.get(i).setId(ids.get(i));
		}

		// 2) Child: single multi-value INSERT for all options across questions
		List<Option> allOptions = new ArrayList<>();
		for (Question q : questions) {
			allOptions.addAll(q.getOptions());
		}
		if (allOptions.isEmpty()) {
			return;
		}
		StringBuilder childSql = new StringBuilder(
				"INSERT INTO options (question_id, option_text, is_correct) VALUES ");
		List<Object> childParams = new ArrayList<>(allOptions.size() * 3);
		for (int i = 0; i < allOptions.size(); i++) {
			if (i > 0) childSql.append(", ");
			childSql.append("(?, ?, ?)");
			Option o = allOptions.get(i);
			// question_id is now set on Question; Option.question points to it
			childParams.add(o.getQuestion().getId());
			childParams.add(o.getOptionText());
			childParams.add(o.isCorrect());
		}
		childSql.append(" RETURNING id");
		List<Long> optIds = jdbcTemplate.query(childSql.toString(), childParams.toArray(),
				(rs, rowNum) -> rs.getLong(1));
		if (optIds.size() != allOptions.size()) {
			throw new IllegalStateException("Option batch returned " + optIds.size() + " ids, expected " + allOptions.size());
		}
		for (int i = 0; i < allOptions.size(); i++) {
			allOptions.get(i).setId(optIds.get(i));
		}
	}
}

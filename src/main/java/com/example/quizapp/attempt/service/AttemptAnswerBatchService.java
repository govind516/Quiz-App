package com.example.quizapp.attempt.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.example.quizapp.attempt.AttemptAnswer;

import lombok.RequiredArgsConstructor;

/**
 * Batched raw JDBC inserts for attempt_answers + attempt_answer_selected_options.
 * Replaces Hibernate's per-entity @ElementCollection inserts (5-10 round trips)
 * with exactly 1-2 round trips total: 1 for all parent rows (RETURNING id),
 * 1 for all child rows across answers (if any). Bypasses IDENTITY batch limitation.
 */
@Service
@RequiredArgsConstructor
public class AttemptAnswerBatchService {

	private final JdbcTemplate jdbcTemplate;

	/**
	 * Inserts rows in 1-2 round trips. Assigns generated ids back to entities
	 * so caller can reuse them for buildResult without re-query.
	 * Must be called inside the same @Transactional as the caller to participate in TX.
	 */
	public void batchInsert(List<AttemptAnswer> rows) {
		if (rows.isEmpty()) {
			return;
		}
		// 1) Parent rows: single multi-value INSERT ... RETURNING id
		StringBuilder sql = new StringBuilder(
				"INSERT INTO attempt_answers (attempt_id, question_id, is_correct) VALUES ");
		List<Object> params = new ArrayList<>(rows.size() * 3);
		for (int i = 0; i < rows.size(); i++) {
			if (i > 0) sql.append(", ");
			sql.append("(?, ?, ?)");
			params.add(rows.get(i).getAttempt().getId());
			params.add(rows.get(i).getQuestion().getId());
			params.add(rows.get(i).isCorrect());
		}
		sql.append(" RETURNING id");
		List<Long> ids = jdbcTemplate.query(sql.toString(), params.toArray(),
				(rs, rowNum) -> rs.getLong(1));
		if (ids.size() != rows.size()) {
			throw new IllegalStateException("Batch insert returned " + ids.size() + " ids, expected " + rows.size());
		}
		for (int i = 0; i < rows.size(); i++) {
			rows.get(i).setId(ids.get(i));
		}

		// 2) Child rows: single multi-value insert for all selected_option_ids across answers
		List<Object> childParams = new ArrayList<>();
		StringBuilder childSql = new StringBuilder(
				"INSERT INTO attempt_answer_selected_options (attempt_answer_id, selected_option_id) VALUES ");
		int childCount = 0;
		for (AttemptAnswer ans : rows) {
			for (Long optId : ans.getSelectedOptionIds()) {
				if (childCount > 0) childSql.append(", ");
				childSql.append("(?, ?)");
				childParams.add(ans.getId());
				childParams.add(optId);
				childCount++;
			}
		}
		if (childCount > 0) {
			jdbcTemplate.update(childSql.toString(), childParams.toArray());
		}
	}
}

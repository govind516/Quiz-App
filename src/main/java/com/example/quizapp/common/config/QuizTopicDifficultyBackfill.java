package com.example.quizapp.common.config;

import java.util.List;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.quizapp.quiz.Quiz;
import com.example.quizapp.quiz.repository.QuizRepository;
import com.example.quizapp.quiz.repository.QuestionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class QuizTopicDifficultyBackfill {

	private final QuizRepository quizRepository;
	private final QuestionRepository questionRepository;

	@EventListener(ApplicationReadyEvent.class)
	@Transactional
	public void backfill() {
		List<Quiz> quizzes = quizRepository.findAll();
		int quizFallbackCount = 0;
		int questionBackfilled = 0;

		for (Quiz quiz : quizzes) {
			if (quiz.getTopic() == null || quiz.getTopic().isBlank()) {
				String fallbackTopic = deriveFallbackTopic(quiz);
				quiz.setTopic(fallbackTopic);
				if ("General".equals(fallbackTopic)) {
					quizFallbackCount++;
				}
				quizRepository.save(quiz);
			}
		}

		// Backfill Question.difficulty from quiz.difficulty where null
		// Use native query via QuestionRepository if needed, but loop for simplicity
		// Fetch all questions where difficulty is null
		// Since no direct query, use findAll and filter (small dataset)
		var allQuestions = questionRepository.findAll();
		for (var q : allQuestions) {
			if (q.getDifficulty() == null && q.getQuiz() != null && q.getQuiz().getDifficulty() != null) {
				q.setDifficulty(q.getQuiz().getDifficulty());
				questionRepository.save(q);
				questionBackfilled++;
			}
		}

		if (quizFallbackCount > 0 || questionBackfilled > 0) {
			log.info("Backfill complete: {} quizzes set to fallback topic 'General', {} questions backfilled with difficulty from quiz",
					quizFallbackCount, questionBackfilled);
		} else {
			log.info("Backfill complete: no fallback needed, {} questions already had difficulty", questionBackfilled);
		}
	}

	private String deriveFallbackTopic(Quiz quiz) {
		String title = quiz.getTitle();
		String categoryName = quiz.getCategory() != null ? quiz.getCategory().getName() : null;
		// If title is like "Category: Topic — Difficulty" try to extract topic
		if (title != null && title.contains(":")) {
			String afterColon = title.substring(title.indexOf(":") + 1).trim();
			// Remove trailing " — DIFFICULTY" if present
			int dashIdx = afterColon.lastIndexOf(" — ");
			if (dashIdx > 0) {
				afterColon = afterColon.substring(0, dashIdx).trim();
			}
			if (!afterColon.isBlank() && !afterColon.equalsIgnoreCase(categoryName)) {
				return afterColon.length() > 200 ? afterColon.substring(0, 200) : afterColon;
			}
		}
		// If title equals category name or auto-created description, not recoverable
		if (title != null && categoryName != null && title.equals(categoryName)) {
			return "General";
		}
		if (title != null && title.startsWith("Auto-created")) {
			return "General";
		}
		// Fallback to title if distinct, else General
		if (title != null && !title.isBlank() && !title.equals(categoryName)) {
			return title.length() > 200 ? title.substring(0, 200) : title;
		}
		return "General";
	}
}

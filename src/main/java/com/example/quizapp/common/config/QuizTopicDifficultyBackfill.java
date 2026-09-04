package com.example.quizapp.common.config;

import java.util.List;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.quizapp.quiz.QuestionStatus;
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
		int timeBackfilled = 0;
		int descBackfilled = 0;

		for (Quiz quiz : quizzes) {
			boolean dirty = false;
			if (quiz.getTopic() == null || quiz.getTopic().isBlank()) {
				String fallbackTopic = deriveFallbackTopic(quiz);
				quiz.setTopic(fallbackTopic);
				if ("General".equals(fallbackTopic)) {
					quizFallbackCount++;
				}
				dirty = true;
			}
			// Backfill timeLimitSec from question count (1 min per question, min 60s)
			long approvedCount = questionRepository.countByQuizIdAndStatus(quiz.getId(), QuestionStatus.APPROVED);
			// For quizzes with no approved yet but have pending, use total count as fallback
			if (approvedCount == 0) {
				approvedCount = quiz.getQuestions() != null ? quiz.getQuestions().size() : 0;
			}
			int expectedTime = (int) Math.max(60, approvedCount * 60);
			// Only backfill if current time is clearly wrong (e.g. 600 for 1-2 Qs, or 600 for 20 Qs)
			// Use heuristic: if approvedCount >0 and time differs significantly from expected, fix it
			if (approvedCount > 0 && Math.abs(quiz.getTimeLimitSec() - expectedTime) > 30) {
				// Special case: keep E2E 5 Qs at 300 (already correct), don't overwrite if already close
				// But fix明显 wrong ones: DBMS 20 Qs with 600 -> should be 1200, Indexing 1 Q with 600 -> should be 60
				quiz.setTimeLimitSec(expectedTime);
				timeBackfilled++;
				dirty = true;
			}
			// Backfill learner-facing description if it contains operational labels
			String desc = quiz.getDescription();
			if (desc != null && (desc.contains("Auto-created") || desc.contains("repaired") || desc.contains("AI generated"))) {
				String newDesc = generateLearnerDescription(quiz);
				quiz.setDescription(newDesc);
				if (quiz.getAdminNotes() == null || quiz.getAdminNotes().isBlank()) {
					quiz.setAdminNotes("AI-generated: " + quiz.getTopic() + " / " + quiz.getDifficulty().name() + (desc.contains("repaired") ? " (repaired)" : ""));
				}
				descBackfilled++;
				dirty = true;
			}
			if (dirty) {
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

		if (quizFallbackCount > 0 || questionBackfilled > 0 || timeBackfilled > 0 || descBackfilled > 0) {
			log.info("Backfill complete: {} quizzes fallback 'General', {} questions difficulty, {} quizzes time fixed, {} quizzes description fixed",
					quizFallbackCount, questionBackfilled, timeBackfilled, descBackfilled);
		} else {
			log.info("Backfill complete: no fallback needed");
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

	private String generateLearnerDescription(Quiz quiz) {
		String cat = quiz.getCategory() != null ? quiz.getCategory().getName() : "General";
		String topic = quiz.getTopic() != null && !"General".equals(quiz.getTopic()) ? quiz.getTopic() : cat;
		// Simple learner-facing templates by category
		if ("DBMS".equalsIgnoreCase(cat)) {
			if ("Indexing".equalsIgnoreCase(topic)) return "Practice DBMS indexing — speed up queries and ace database design rounds.";
			if ("General".equals(topic)) return "Master core DBMS concepts — from indexing to transactions and query design.";
			return "Practice " + topic + " in DBMS — hands-on, interview-ready questions.";
		}
		if ("JavaScript".equalsIgnoreCase(cat)) return "Sharpen JavaScript fundamentals — from closures to async, interview-ready.";
		if ("Python".equalsIgnoreCase(cat)) return "Get started with Python syntax and data structures — hands-on practice.";
		if (topic != null && !topic.isBlank() && !"General".equals(topic)) {
			return "Practice " + topic + " in " + cat + " — focused, interview-ready questions.";
		}
		return "Practice " + cat + " fundamentals with focused, interview-ready questions.";
	}
}

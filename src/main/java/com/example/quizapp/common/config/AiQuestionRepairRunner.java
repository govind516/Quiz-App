package com.example.quizapp.common.config;

import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.quizapp.quiz.Category;
import com.example.quizapp.quiz.Difficulty;
import com.example.quizapp.quiz.Question;
import com.example.quizapp.quiz.QuestionStatus;
import com.example.quizapp.quiz.Quiz;
import com.example.quizapp.quiz.repository.CategoryRepository;
import com.example.quizapp.quiz.repository.QuestionRepository;
import com.example.quizapp.quiz.repository.QuizRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * One-time repair for Issue 3: 5 DBMS AI questions were incorrectly attached to
 * the "HTTP Basics E2E" quiz instead of DBMS. Moves PENDING_REVIEW questions
 * containing DBMS keywords to the DBMS category's quiz (creating one if needed).
 * Idempotent — safe to run on every startup.
 */
@Component
@Order(100)
@RequiredArgsConstructor
@Slf4j
public class AiQuestionRepairRunner implements ApplicationRunner {

	private final CategoryRepository categoryRepository;
	private final QuizRepository quizRepository;
	private final QuestionRepository questionRepository;

	private static final List<String> DBMS_MARKERS = List.of(
			"ansi sql", "isolation level", "phantom read", "b+ tree", "b+tree",
			"predicate pushdown", "aries", "repeatable read", "serializable");

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		var httpQuizOpt = quizRepository.findAll().stream()
				.filter(q -> q.getTitle() != null && q.getTitle().equalsIgnoreCase("HTTP Basics E2E"))
				.findFirst();
		if (httpQuizOpt.isEmpty()) {
			return;
		}
		Quiz httpQuiz = httpQuizOpt.get();

		var dbmsCatOpt = categoryRepository.findBySlug("dbms");
		if (dbmsCatOpt.isEmpty()) {
			// try case-insensitive name lookup
			dbmsCatOpt = categoryRepository.findByNameIgnoreCase("DBMS");
		}
		if (dbmsCatOpt.isEmpty()) {
			log.info("AI repair: DBMS category not found, skipping");
			return;
		}
		Category dbmsCat = dbmsCatOpt.get();

		// Ensure a target quiz exists for DBMS (reuse first, don't create per topic)
		Quiz targetQuiz = quizRepository.findFirstByCategoryIdOrderByIdAsc(dbmsCat.getId()).orElseGet(() -> {
			Quiz q = Quiz.builder()
					.title(dbmsCat.getName())
					.description("Auto-created for " + dbmsCat.getName() + " — repaired AI questions")
					.category(dbmsCat)
					.difficulty(Difficulty.ADVANCED)
					.timeLimitSec(600)
					.isPublished(false)
					.build();
			return quizRepository.save(q);
		});

		if (targetQuiz.getId().equals(httpQuiz.getId())) {
			return;
		}

		List<Question> candidates = questionRepository.findAll().stream()
				.filter(q -> q.getQuiz() != null && q.getQuiz().getId().equals(httpQuiz.getId()))
				.filter(q -> q.getStatus() == QuestionStatus.PENDING_REVIEW)
				.filter(this::looksLikeDbms)
				.toList();

		if (candidates.isEmpty()) {
			return;
		}

		for (Question q : candidates) {
			q.setQuiz(targetQuiz);
		}
		questionRepository.saveAll(candidates);
		log.info("AI repair: moved {} mis-filed DBMS question(s) from quiz #{} (HTTP Basics E2E) to quiz #{} ({} / DBMS)",
				candidates.size(), httpQuiz.getId(), targetQuiz.getId(), targetQuiz.getTitle());
	}

	private boolean looksLikeDbms(Question q) {
		if (q.getQuestionText() == null) return false;
		String lower = q.getQuestionText().toLowerCase();
		for (String m : DBMS_MARKERS) {
			if (lower.contains(m)) return true;
		}
		// also check options text for dbms markers
		if (q.getOptions() != null) {
			for (var opt : q.getOptions()) {
				if (opt.getOptionText() != null) {
					String ol = opt.getOptionText().toLowerCase();
					for (String m : DBMS_MARKERS) {
						if (ol.contains(m)) return true;
					}
				}
			}
		}
		return false;
	}
}

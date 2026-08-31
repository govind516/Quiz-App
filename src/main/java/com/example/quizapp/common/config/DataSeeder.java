package com.example.quizapp.common.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.quizapp.quiz.Category;
import com.example.quizapp.quiz.Difficulty;
import com.example.quizapp.quiz.Option;
import com.example.quizapp.quiz.Question;
import com.example.quizapp.quiz.QuestionType;
import com.example.quizapp.quiz.Quiz;
import com.example.quizapp.quiz.repository.CategoryRepository;
import com.example.quizapp.quiz.repository.QuizRepository;
import com.example.quizapp.user.Role;
import com.example.quizapp.user.User;
import com.example.quizapp.user.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements ApplicationRunner {

	private final CategoryRepository categoryRepository;
	private final QuizRepository quizRepository;
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	@Value("${app.admin.email}")
	private String adminEmail;

	@Value("${app.admin.password}")
	private String adminPassword;

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		String normalizedAdminEmail = adminEmail == null ? null : adminEmail.trim().toLowerCase();
		if (normalizedAdminEmail != null && userRepository.findByEmailIgnoreCase(normalizedAdminEmail).isEmpty()) {
			userRepository.save(User.builder()
					.name("Platform Admin")
					.email(normalizedAdminEmail)
					.passwordHash(passwordEncoder.encode(adminPassword))
					.role(Role.ADMIN)
					.build());
			log.info("Seeded admin user {}", normalizedAdminEmail);
		}

		if (categoryRepository.count() == 0) {
			List.of(
					category("JavaScript", "javascript", "The language of the web"),
					category("Python", "python", "General-purpose scripting and backend language"),
					category("Networking", "networking", "TCP/IP, DNS, HTTP and beyond"),
					category("DBMS", "dbms", "Databases, SQL and transactions"),
					category("Operating Systems", "operating-systems", "Processes, memory, scheduling"),
					category("DSA", "dsa", "Data structures and algorithms"),
					category("Cloud & AWS", "cloud-aws", "Cloud computing fundamentals and AWS"),
					category("Cybersecurity", "cybersecurity", "Security principles and practices"),
					category("System Design", "system-design", "Scalable architecture patterns"))
					.forEach(categoryRepository::save);
			log.info("Seeded default categories");
		}

		if (quizRepository.count() == 0) {
			Category js = categoryRepository.findBySlug("javascript").orElseThrow();
			Category py = categoryRepository.findBySlug("python").orElseThrow();

			Quiz jsQuiz = quiz(js, "JavaScript Fundamentals", "Core JavaScript concepts every developer should know",
					Difficulty.BEGINNER, 600);
			jsQuiz.getQuestions().add(question(jsQuiz, "Which keyword declares a block-scoped variable in JavaScript?",
					QuestionType.MCQ, "var is function-scoped; let and const are block-scoped",
					option("var", false), option("let", true), option("function", false), option("hoist", false)));
			jsQuiz.getQuestions().add(question(jsQuiz, "What does `typeof null` return?",
					QuestionType.MCQ, "A long-standing quirk of JavaScript: typeof null === \"object\"",
					option("\"object\"", true), option("\"null\"", false), option("\"undefined\"", false), option("\"boolean\"", false)));
			jsQuiz.getQuestions().add(question(jsQuiz, "Which method creates a new array with elements that pass a test?",
					QuestionType.MCQ, "filter() returns a new array with only the elements that satisfy the predicate",
					option("map()", false), option("forEach()", false), option("filter()", true), option("reduce()", false)));
			jsQuiz.getQuestions().add(question(jsQuiz, "`==` compares values with type coercion while `===` compares value and type.",
					QuestionType.TRUE_FALSE, "== performs type coercion before comparing; === requires both value and type to match",
					option("True", true), option("False", false)));
			jsQuiz.getQuestions().add(question(jsQuiz, "An arrow function has its own `this` binding.",
					QuestionType.TRUE_FALSE, "Arrow functions inherit `this` from the enclosing lexical scope",
					option("True", false), option("False", true)));
			quizRepository.save(jsQuiz);

			Quiz pyQuiz = quiz(py, "Python Basics", "Get started with Python syntax and data structures",
					Difficulty.BEGINNER, 480);
			pyQuiz.getQuestions().add(question(pyQuiz, "Which built-in type stores key-value pairs?",
					QuestionType.MCQ, "dict maps keys to values",
					option("list", false), option("tuple", false), option("dict", true), option("set", false)));
			pyQuiz.getQuestions().add(question(pyQuiz, "How do you start a single-line comment in Python?",
					QuestionType.MCQ, "The # character starts a single-line comment",
					option("//", false), option("#", true), option("--", false), option("/*", false)));
			pyQuiz.getQuestions().add(question(pyQuiz, "Python lists are immutable.",
					QuestionType.TRUE_FALSE, "Lists are mutable; tuples are immutable",
					option("True", false), option("False", true)));
			pyQuiz.getQuestions().add(question(pyQuiz, "What is the output of: len([1, 2, 3])?",
					QuestionType.MCQ, "len() counts the elements of the list",
					option("2", false), option("3", true), option("4", false), option("TypeError", false)));
			quizRepository.save(pyQuiz);

			log.info("Seeded demo quizzes");
		}
	}

	private Category category(String name, String slug, String description) {
		return Category.builder().name(name).slug(slug).description(description).build();
	}

	private Quiz quiz(Category category, String title, String description, Difficulty difficulty, int timeLimitSec) {
		return Quiz.builder()
				.title(title)
				.description(description)
				.category(category)
				.difficulty(difficulty)
				.timeLimitSec(timeLimitSec)
				.isPublished(true)
				.build();
	}

	private Question question(Quiz quiz, String text, QuestionType type,
			String explanation, Option... options) {
		Question question = Question.builder()
				.quiz(quiz)
				.questionText(text)
				.type(type)
				.explanation(explanation)
				.points(1)
				.build();
		for (Option option : options) {
			option.setQuestion(question);
			question.getOptions().add(option);
		}
		return question;
	}

	private Option option(String text, boolean correct) {
		return Option.builder().optionText(text.trim()).isCorrect(correct).build();
	}
}

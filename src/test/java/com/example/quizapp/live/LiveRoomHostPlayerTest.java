package com.example.quizapp.live;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

import com.example.quizapp.live.dto.AnswerMessage;
import com.example.quizapp.live.dto.CreateLiveRoomResponse;
import com.example.quizapp.quiz.Option;
import com.example.quizapp.quiz.Question;
import com.example.quizapp.quiz.QuestionStatus;
import com.example.quizapp.quiz.QuestionType;
import com.example.quizapp.quiz.Quiz;
import com.example.quizapp.quiz.repository.QuizRepository;
import com.example.quizapp.user.Role;
import com.example.quizapp.user.User;

class LiveRoomHostPlayerTest {

	private static final long QUIZ_ID = 1L;
	private static final long QUESTION_ID = 99L;
	private static final long CORRECT_OPTION_ID = 42L;

	private final User host = hostUser();

	private QuizRepository quizRepository;
	private LiveRoomService service;

	@BeforeEach
	void setUp() {
		quizRepository = mock(QuizRepository.class);
		ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
		scheduler.initialize();

		when(quizRepository.findByIdAndIsPublishedTrue(QUIZ_ID))
				.thenReturn(Optional.of(quizWithOneApprovedQuestion()));

		SimpMessagingTemplate messaging = new SimpMessagingTemplate(
				(org.springframework.messaging.MessageChannel) (message, timeout) -> true);

		service = new LiveRoomService(quizRepository, messaging, scheduler);
	}

	@Test
	@DisplayName("Host-only creation leaves creator out of the player list")
	void hostOnlyCreatorIsNotPlayer() {
		CreateLiveRoomResponse res = service.create(host, QUIZ_ID, false);

		assertThat(res.creatorPlayerId()).isNull();
		assertThat(res.room().players()).isEmpty();
	}

	@Test
	@DisplayName("Join-as-player registers creator and lets them score points")
	void hostAsPlayerCanAnswer() {
		CreateLiveRoomResponse res = service.create(host, QUIZ_ID, true);
		String code = res.room().code();

		assertThat(res.creatorPlayerId()).isNotNull();
		assertThat(res.room().players()).hasSize(1);
		assertThat(res.room().players().get(0).nickname()).isEqualTo("Govind");

		service.start(host.getId(), code);
		UUID playerId = UUID.fromString(res.creatorPlayerId());

		service.handleAnswer(code, new AnswerMessage(playerId, 0,
				QUESTION_ID, List.of(CORRECT_OPTION_ID)));

		var scoreboard = service.info(code).players();
		assertThat(scoreboard).hasSize(1);
		assertThat(scoreboard.get(0).playerId()).isEqualTo(playerId.toString());
		assertThat(scoreboard.get(0).score()).isBetween(500, 1000);
		assertThat(scoreboard.get(0).answeredCurrent()).isTrue();
	}

	private static User hostUser() {
		User user = User.builder().name("Govind").email("govind@example.com")
				.passwordHash("x").role(Role.USER).build();
		user.setId(7L);
		return user;
	}

	private static Quiz quizWithOneApprovedQuestion() {
		Option correct = option(CORRECT_OPTION_ID, "let", true);
		Option wrong = option(43L, "var", false);

		Question question = Question.builder()
				.questionText("Block-scoped declaration?")
				.type(QuestionType.MCQ)
				.points(1)
				.status(QuestionStatus.APPROVED)
				.build();
		question.setId(QUESTION_ID);
		question.setOptions(new ArrayList<>(List.of(correct, wrong)));
		correct.setQuestion(question);
		wrong.setQuestion(question);

		Quiz quiz = Quiz.builder().title("JS").isPublished(true).build();
		quiz.setQuestions(new ArrayList<>(List.of(question)));
		question.setQuiz(quiz);
		return quiz;
	}

	private static Option option(long id, String text, boolean correct) {
		Option o = new Option();
		o.setId(id);
		o.setOptionText(text);
		o.setCorrect(correct);
		return o;
	}
}

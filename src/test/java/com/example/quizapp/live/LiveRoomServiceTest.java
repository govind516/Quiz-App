package com.example.quizapp.live;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.security.access.AccessDeniedException;

import com.example.quizapp.common.exception.ConflictException;
import com.example.quizapp.common.exception.ResourceNotFoundException;
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

@ExtendWith(MockitoExtension.class)
class LiveRoomServiceTest {

	private static final long QUIZ_ID = 10L;
	private static final long QUESTION_ID = 100L;
	private static final long CORRECT_OPTION_ID = 1001L;
	private static final long WRONG_OPTION_ID = 1002L;

	@Mock
	private QuizRepository quizRepository;

	private LiveRoomService service;
	private User host;

	@BeforeEach
	void setUp() {
		ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
		scheduler.initialize();
		SimpMessagingTemplate messaging = new SimpMessagingTemplate(
				(org.springframework.messaging.MessageChannel) (message, timeout) -> true);
		service = new LiveRoomService(quizRepository, messaging, scheduler);

		host = User.builder().name("Host").email("host@test.dev")
				.passwordHash("x").role(Role.USER).build();
		host.setId(7L);

		org.mockito.Mockito.lenient()
				.when(quizRepository.findByIdAndIsPublishedTrue(QUIZ_ID))
				.thenReturn(Optional.of(quizWithOneApprovedQuestion()));
	}

	@Test
	@DisplayName("create returns lobby room with generated code")
	void createReturnsLobby() {
		CreateLiveRoomResponse res = service.create(host, QUIZ_ID, false);

		assertThat(res.room().code()).hasSize(6);
		assertThat(res.room().status()).isEqualTo("LOBBY");
		assertThat(res.creatorPlayerId()).isNull();
		assertThat(service.info(res.room().code()).code()).isEqualTo(res.room().code());
	}

	@Test
	@DisplayName("create fails when quiz is missing or has no approved questions")
	void createFailsWithoutQuizOrQuestions() {
		when(quizRepository.findByIdAndIsPublishedTrue(404L)).thenReturn(Optional.empty());
		assertThatThrownBy(() -> service.create(host, 404L, false))
				.isInstanceOf(ResourceNotFoundException.class);

		Quiz empty = Quiz.builder().title("Empty").isPublished(true).build();
		empty.setQuestions(new ArrayList<>());
		when(quizRepository.findByIdAndIsPublishedTrue(405L)).thenReturn(Optional.of(empty));
		assertThatThrownBy(() -> service.create(host, 405L, false))
				.isInstanceOf(ConflictException.class)
				.hasMessageContaining("no active questions");
	}

	@Test
	@DisplayName("join registers player; duplicate nicknames rejected")
	void joinAndDuplicateNickname() {
		String code = service.create(host, QUIZ_ID, false).room().code();

		UUID alice = service.join(code, "Alice");
		assertThat(alice).isNotNull();
		assertThat(service.info(code).players()).hasSize(1);

		assertThatThrownBy(() -> service.join(code, "alice"))
				.isInstanceOf(ConflictException.class)
				.hasMessageContaining("Nickname already taken");
	}

	@Test
	@DisplayName("join fails for unknown room and after game started")
	void joinFailsAfterStart() {
		assertThatThrownBy(() -> service.join("ZZZZZZ", "Bob"))
				.isInstanceOf(ResourceNotFoundException.class);

		String code = service.create(host, QUIZ_ID, false).room().code();
		service.join(code, "Bob");
		service.start(host.getId(), code);

		assertThatThrownBy(() -> service.join(code, "Late"))
				.isInstanceOf(ConflictException.class)
				.hasMessageContaining("already started");
	}

	@Test
	@DisplayName("start transitions LOBBY to ACTIVE; only host may start, once")
	void startTransitionsAndGuards() {
		String code = service.create(host, QUIZ_ID, false).room().code();

		assertThatThrownBy(() -> service.start(999L, code))
				.isInstanceOf(AccessDeniedException.class);

		service.start(host.getId(), code);
		assertThat(service.info(code).status()).isEqualTo("ACTIVE");

		assertThatThrownBy(() -> service.start(host.getId(), code))
				.isInstanceOf(ConflictException.class)
				.hasMessageContaining("already started");
	}

	@Test
	@DisplayName("correct answer scores speed bonus; wrong answer scores zero")
	void answerScoringPath() {
		String code = service.create(host, QUIZ_ID, false).room().code();
		UUID player = service.join(code, "Cara");
		service.start(host.getId(), code);

		service.handleAnswer(code, new AnswerMessage(player, 0, QUESTION_ID, List.of(CORRECT_OPTION_ID)));

		var board = service.info(code).players();
		assertThat(board).hasSize(1);
		assertThat(board.get(0).score()).isBetween(500, 1000);
		assertThat(board.get(0).answeredCurrent()).isTrue();
	}

	@Test
	@DisplayName("wrong answer leaves score at zero")
	void wrongAnswerScoresZero() {
		String code = service.create(host, QUIZ_ID, false).room().code();
		UUID p1 = service.join(code, "Eve");
		UUID p2 = service.join(code, "Frank");
		service.start(host.getId(), code);

		service.handleAnswer(code, new AnswerMessage(p1, 0, QUESTION_ID, List.of(WRONG_OPTION_ID)));
		service.handleAnswer(code, new AnswerMessage(p2, 0, QUESTION_ID, List.of(CORRECT_OPTION_ID)));

		var board = service.info(code).players();
		assertThat(board.stream().filter(p -> p.playerId().equals(p1.toString())).findFirst().orElseThrow().score())
				.isEqualTo(0);
		assertThat(board.stream().filter(p -> p.playerId().equals(p2.toString())).findFirst().orElseThrow().score())
				.isBetween(500, 1000);
	}

	@Test
	@DisplayName("duplicate and stale answers are ignored")
	void duplicateAndStaleAnswersIgnored() {
		String code = service.create(host, QUIZ_ID, false).room().code();
		UUID player = service.join(code, "Grace");
		service.start(host.getId(), code);

		service.handleAnswer(code, new AnswerMessage(player, 0, QUESTION_ID, List.of(CORRECT_OPTION_ID)));
		int afterFirst = service.info(code).players().get(0).score();

		// duplicate for same question index: no double score
		service.handleAnswer(code, new AnswerMessage(player, 0, QUESTION_ID, List.of(CORRECT_OPTION_ID)));
		assertThat(service.info(code).players().get(0).score()).isEqualTo(afterFirst);

		// stale index + unknown player: ignored without error
		service.handleAnswer(code, new AnswerMessage(player, 9, QUESTION_ID, List.of(CORRECT_OPTION_ID)));
		service.handleAnswer(code, new AnswerMessage(UUID.randomUUID(), 0, QUESTION_ID, List.of(CORRECT_OPTION_ID)));
		assertThat(service.info(code).players().get(0).score()).isEqualTo(afterFirst);
	}

	private static Quiz quizWithOneApprovedQuestion() {
		Option correct = option(CORRECT_OPTION_ID, "let", true);
		Option wrong = option(WRONG_OPTION_ID, "var", false);

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

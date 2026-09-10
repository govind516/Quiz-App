package com.example.quizapp.quiz.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import com.example.quizapp.common.exception.BadRequestException;
import com.example.quizapp.common.exception.ResourceNotFoundException;
import com.example.quizapp.quiz.Option;
import com.example.quizapp.quiz.Question;
import com.example.quizapp.quiz.QuestionStatus;
import com.example.quizapp.quiz.QuestionType;
import com.example.quizapp.quiz.Quiz;
import com.example.quizapp.quiz.dto.BulkUploadResultDto;
import com.example.quizapp.quiz.dto.QuestionAdminDto;
import com.example.quizapp.quiz.repository.CategoryRepository;
import com.example.quizapp.quiz.repository.QuestionRepository;
import com.example.quizapp.quiz.repository.QuizRepository;

@ExtendWith(MockitoExtension.class)
class AdminQuestionServiceTest {

	private static final long QUIZ_ID = 55L;

	@Mock
	private QuestionRepository questionRepository;
	@Mock
	private QuizRepository quizRepository;
	@Mock
	private CategoryRepository categoryRepository;
	@Mock
	private QuizService quizService;
	@Mock
	private GeminiClient geminiClient;
	@Mock
	private QuestionBatchService questionBatchService;
	@Mock
	private com.example.quizapp.settings.SettingsService settingsService;

	private AdminQuestionService service;
	private Quiz quiz;

	@BeforeEach
	void setUp() {
		service = new AdminQuestionService(
				questionRepository, quizRepository, categoryRepository,
				quizService, new CsvQuestionParser(), geminiClient,
				questionBatchService, settingsService);
		quiz = Quiz.builder().title("Java").isPublished(false).build();
		quiz.setId(QUIZ_ID);
		quiz.setQuestions(new ArrayList<>());
	}

	@Test
	@DisplayName("bulkImport saves valid rows and reports failure rows")
	void bulkImportMixedRows() {
		when(quizRepository.findById(QUIZ_ID)).thenReturn(Optional.of(quiz));
		when(questionRepository.save(any(Question.class)))
				.thenAnswer(inv -> inv.getArgument(0));

		String csv = """
				question_text,type,points,explanation,option_1,option_2,option_3,option_4,correct_options
				What is JVM?,MCQ,1,JVM means Java Virtual Machine,Just-in-time,Java Virtual Machine,Java Module,Java Muddle,2
				Bad index,MCQ,1,,a,b,c,d,9
				No correct,MCQ,1,,a,b,c,d,
				""";
		var file = new MockMultipartFile("file", "q.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

		BulkUploadResultDto result = service.bulkImport(QUIZ_ID, file);

		assertThat(result.imported()).isEqualTo(1);
		assertThat(result.failures()).hasSize(2);
		assertThat(result.failures().get(0).error()).contains("out of range");
		assertThat(result.failures().get(1).error()).contains("correct_options is empty");
		verify(questionRepository).save(any(Question.class));

		ArgumentCaptor<Question> captor = ArgumentCaptor.forClass(Question.class);
		verify(questionRepository).save(captor.capture());
		assertThat(captor.getValue().getStatus()).isEqualTo(QuestionStatus.APPROVED);
		assertThat(captor.getValue().getQuestionText()).isEqualTo("What is JVM?");
	}

	@Test
	@DisplayName("bulkImport rejects empty file and unknown quiz")
	void bulkImportRejectsEmptyAndUnknownQuiz() {
		when(quizRepository.findById(404L)).thenReturn(Optional.empty());
		var file = new MockMultipartFile("file", "q.csv", "text/csv", "a,b".getBytes(StandardCharsets.UTF_8));
		assertThatThrownBy(() -> service.bulkImport(404L, file))
				.isInstanceOf(ResourceNotFoundException.class);

		when(quizRepository.findById(QUIZ_ID)).thenReturn(Optional.of(quiz));
		var empty = new MockMultipartFile("file", "empty.csv", "text/csv", new byte[0]);
		assertThatThrownBy(() -> service.bulkImport(QUIZ_ID, empty))
				.isInstanceOf(BadRequestException.class)
				.hasMessageContaining("non-empty");
		verify(questionRepository, never()).save(any());
	}

	@Test
	@DisplayName("approve transitions to APPROVED and auto-publishes draft quiz")
	void approvePublishesDraftQuiz() {
		Question q = pendingQuestion(7L);
		when(questionRepository.findById(7L)).thenReturn(Optional.of(q));
		when(questionRepository.save(q)).thenReturn(q);

		QuestionAdminDto dto = service.approve(7L);

		assertThat(dto.status()).isEqualTo(QuestionStatus.APPROVED);
		assertThat(quiz.isPublished()).isTrue();
		verify(quizRepository).save(quiz);
	}

	@Test
	@DisplayName("reject transitions to REJECTED without publishing")
	void rejectLeavesQuizUnpublished() {
		Question q = pendingQuestion(8L);
		when(questionRepository.findById(8L)).thenReturn(Optional.of(q));
		when(questionRepository.save(q)).thenReturn(q);

		QuestionAdminDto dto = service.reject(8L);

		assertThat(dto.status()).isEqualTo(QuestionStatus.REJECTED);
		assertThat(quiz.isPublished()).isFalse();
		verify(quizRepository, never()).save(any());
	}

	@Test
	@DisplayName("approve/reject on missing question throws not-found")
	void approveRejectMissing() {
		when(questionRepository.findById(999L)).thenReturn(Optional.empty());
		assertThatThrownBy(() -> service.approve(999L))
				.isInstanceOf(ResourceNotFoundException.class);
		assertThatThrownBy(() -> service.reject(999L))
				.isInstanceOf(ResourceNotFoundException.class);
	}

	@Test
	@DisplayName("listPending returns only pending-review questions")
	void listPending() {
		Question q = pendingQuestion(9L);
		when(questionRepository.findAllByStatus(QuestionStatus.PENDING_REVIEW))
				.thenReturn(List.of(q));

		List<QuestionAdminDto> pending = service.listPending();

		assertThat(pending).hasSize(1);
		assertThat(pending.get(0).questionId()).isEqualTo(9L);
		assertThat(pending.get(0).status()).isEqualTo(QuestionStatus.PENDING_REVIEW);
	}

	private Question pendingQuestion(long id) {
		Question q = Question.builder()
				.quiz(quiz)
				.questionText("What is Spring?")
				.type(QuestionType.MCQ)
				.points(1)
				.status(QuestionStatus.PENDING_REVIEW)
				.build();
		q.setId(id);
		Option a = Option.builder().question(q).optionText("Framework").isCorrect(true).build();
		a.setId(1L);
		Option b = Option.builder().question(q).optionText("Season").isCorrect(false).build();
		b.setId(2L);
		q.setOptions(new ArrayList<>(List.of(a, b)));
		return q;
	}
}

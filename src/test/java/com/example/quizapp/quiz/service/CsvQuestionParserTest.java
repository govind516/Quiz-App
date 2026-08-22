package com.example.quizapp.quiz.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.example.quizapp.quiz.QuestionType;

class CsvQuestionParserTest {

	private final CsvQuestionParser parser = new CsvQuestionParser();

	private List<CsvQuestionParser.RowResult> parse(String csv) {
		return parser.parse(new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)));
	}

	@Test
	@DisplayName("Parses valid MCQ rows including quoted commas")
	void parsesValidMcq() {
		List<CsvQuestionParser.RowResult> results = parse("""
				question_text,type,points,explanation,option_1,option_2,option_3,option_4,correct_options
				"What is a JVM, exactly?",MCQ,1,JVM means Java Virtual Machine,Just-in-time,Java Virtual Machine,Java Version Manager,Java Module,2
				""");

		assertThat(results).hasSize(1);
		CsvQuestionParser.RowResult row = results.get(0);
		assertThat(row.error()).isNull();
		assertThat(row.question().questionText()).isEqualTo("What is a JVM, exactly?");
		assertThat(row.question().type()).isEqualTo(QuestionType.MCQ);
		assertThat(row.question().points()).isEqualTo(1);
		assertThat(row.question().options()).hasSize(4);
		assertThat(row.question().options().get(1).correct()).isTrue();
	}

	@Test
	@DisplayName("Supports MULTI_SELECT with multiple correct indices and defaults for blank type/points")
	void supportsMultiSelectAndDefaults() {
		List<CsvQuestionParser.RowResult> results = parse("""
				question_text,type,points,explanation,option_1,option_2,option_3,option_4,correct_options
				Pick prime numbers,MULTI_SELECT,2,,2,3,4,5,1|2|4
				HTTP is stateless.,TRUE_FALSE,,,True,False,,,1
				""");

		assertThat(results).allSatisfy(r -> assertThat(r.error()).isNull());
		assertThat(results.get(0).question().options().stream()
				.filter(o -> o.correct()).count()).isEqualTo(3);
		CsvQuestionParser.ParsedQuestion tf = results.get(1).question();
		assertThat(tf.type()).isEqualTo(QuestionType.TRUE_FALSE);
		assertThat(tf.points()).isEqualTo(1);
		assertThat(tf.options()).hasSize(2);
	}

	@Test
	@DisplayName("Collects per-row validation errors without failing the whole file")
	void collectsRowErrors() {
		List<CsvQuestionParser.RowResult> results = parse("""
				question_text,type,points,explanation,option_1,option_2,option_3,option_4,correct_options
				Bad index,MCQ,1,,a,b,c,d,9
				No correct,MCQ,1,,a,b,c,d,
				Wrong type,MCQX,1,,a,b,c,d,1
				Two correct on MCQ,MCQ,1,,a,b,c,d,1|2
				Too few options,MCQ,1,,only one,,,,1
				Empty question,,1,,a,b,,1
				""");

		assertThat(results).hasSize(6);
		for (int i = 0; i < 5; i++) {
			int idx = i;
			assertThat(results.get(idx).error()).as("row %d", idx + 1).isNotNull();
		}
		assertThat(results.get(0).error()).contains("out of range");
		assertThat(results.get(1).error()).contains("correct_options is empty");
		assertThat(results.get(2).error()).contains("Unknown type");
		assertThat(results.get(3).error()).contains("exactly one correct");
		assertThat(results.get(4).error()).contains("At least two non-empty options");
	}

	@Test
	@DisplayName("Rejects files missing required headers")
	void rejectsMissingHeaders() {
		org.assertj.core.api.Assertions
				.assertThatThrownBy(() -> parse("foo,bar\n1,2\n"))
				.isInstanceOf(com.example.quizapp.common.exception.BadRequestException.class)
				.hasMessageContaining("header");
	}
}

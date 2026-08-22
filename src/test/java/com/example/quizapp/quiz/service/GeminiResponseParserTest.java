package com.example.quizapp.quiz.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.example.quizapp.common.exception.BadRequestException;
import com.example.quizapp.quiz.QuestionType;

class GeminiResponseParserTest {

	@Test
	@DisplayName("Parses a plain JSON array")
	void parsesPlainArray() {
		String json = """
				[{"questionText":"What does JVM stand for?","type":"MCQ","points":2,
				  "explanation":"Java Virtual Machine",
				  "options":[{"text":"Java Virtual Machine","isCorrect":true},{"text":"Just Very Modular","isCorrect":false}]}]
				""";

		List<GeminiResponseParser.AiQuestion> questions = GeminiResponseParser.parse(json);

		assertThat(questions).hasSize(1);
		assertThat(questions.get(0).questionText()).isEqualTo("What does JVM stand for?");
		assertThat(questions.get(0).type()).isEqualTo(QuestionType.MCQ);
		assertThat(questions.get(0).points()).isEqualTo(2);
		assertThat(questions.get(0).options().get(0).isCorrect()).isTrue();
	}

	@Test
	@DisplayName("Strips markdown code fences before parsing")
	void stripsCodeFences() {
		String fenced = "```json\n"
				+ "[{\"questionText\":\"TCP operates at which layer?\",\"type\":\"MCQ\",\"points\":1,"
				+ "\"explanation\":\"Transport layer\","
				+ "\"options\":[{\"text\":\"Transport\",\"isCorrect\":true},{\"text\":\"Network\",\"isCorrect\":false}]}]\n"
				+ "```";

		List<GeminiResponseParser.AiQuestion> questions = GeminiResponseParser.parse(fenced);

		assertThat(questions).hasSize(1);
		assertThat(GeminiResponseParser.stripCodeFences("```\n[1,2]\n```")).isEqualTo("[1,2]");
	}

	@Test
	@DisplayName("Accepts a wrapper object with a questions array and tolerates unknown types")
	void acceptsWrapperAndUnknownTypes() {
		String wrapped = "{\"questions\":[" +
				"{\"questionText\":\"Pick evens\",\"type\":\"MULTI_SELECT\",\"points\":1,\"explanation\":\"e\","
				+ "\"options\":[{\"text\":\"2\",\"isCorrect\":true},{\"text\":\"3\",\"isCorrect\":false},{\"text\":\"4\",\"isCorrect\":true}]}," +
				"{\"questionText\":\"Odd type\",\"type\":\"ESSAY\",\"points\":1,\"explanation\":\"x\","
				+ "\"options\":[{\"text\":\"a\",\"isCorrect\":true},{\"text\":\"b\",\"isCorrect\":false}]}" +
				"]}";

		List<GeminiResponseParser.AiQuestion> questions = GeminiResponseParser.parse(wrapped);

		assertThat(questions).hasSize(2);
		assertThat(questions.get(0).options()).hasSize(3);
		assertThat(questions.get(1).type()).isNull();
	}

	@Test
	@DisplayName("Throws BadRequestException on garbage output")
	void throwsOnGarbage() {
		assertThatThrownBy(() -> GeminiResponseParser.parse("Sorry, I cannot help with that."))
				.isInstanceOf(BadRequestException.class)
				.hasMessageContaining("JSON");
	}

	@Test
	@DisplayName("Skips entries missing questionText")
	void skipsMalformedEntries() {
		String json = "[{\"points\":1,\"options\":[]},{\"questionText\":\"Valid?\",\"type\":\"TRUE_FALSE\",\"points\":1,"
				+ "\"options\":[{\"text\":\"True\",\"isCorrect\":true},{\"text\":\"False\",\"isCorrect\":false}]}]";

		List<GeminiResponseParser.AiQuestion> questions = GeminiResponseParser.parse(json);

		assertThat(questions).hasSize(1);
		assertThat(questions.get(0).questionText()).isEqualTo("Valid?");
	}
}

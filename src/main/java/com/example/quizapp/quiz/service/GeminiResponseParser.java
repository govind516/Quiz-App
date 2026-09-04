package com.example.quizapp.quiz.service;

import java.util.ArrayList;
import java.util.List;

import com.example.quizapp.common.exception.BadRequestException;
import com.example.quizapp.quiz.QuestionType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

public final class GeminiResponseParser {

	public record AiOption(String text, boolean isCorrect) {
	}

	public record AiQuestion(
			String questionText,
			QuestionType type,
			Integer points,
			String explanation,
			List<AiOption> options) {
	}

	public record AiGenerateResult(String description, List<AiQuestion> questions) {
	}

	private static final ObjectMapper MAPPER = new ObjectMapper();

	private GeminiResponseParser() {
	}

	public static List<AiQuestion> parse(String raw) {
		return parseWithDescription(raw).questions();
	}

	public static AiGenerateResult parseWithDescription(String raw) {
		String cleaned = stripCodeFences(raw == null ? "" : raw.trim());
		JsonNode root;
		try {
			root = MAPPER.readTree(cleaned);
		} catch (Exception e) {
			int start = cleaned.indexOf('[');
			int end = cleaned.lastIndexOf(']');
			if (start < 0 || end <= start) {
				throw new BadRequestException("AI response did not contain valid JSON");
			}
			try {
				root = MAPPER.readTree(cleaned.substring(start, end + 1));
			} catch (Exception e2) {
				throw new BadRequestException("AI response did not contain a JSON array");
			}
		}

		String description = null;
		if (root.isObject() && root.has("description") && root.get("description").isTextual()) {
			description = root.get("description").asText().trim();
			if (description.length() > 200) description = description.substring(0, 200);
		}
		JsonNode arrayNode = root.isArray() ? root : root.path("questions");
		if (!arrayNode.isArray() || arrayNode.isEmpty()) {
			throw new BadRequestException("AI response did not contain any questions");
		}

		List<AiQuestion> questions = new ArrayList<>();
		for (JsonNode node : arrayNode) {
			List<AiOption> options = new ArrayList<>();
			JsonNode optionNodes = node.path("options");
			if (optionNodes.isArray()) {
				for (JsonNode opt : optionNodes) {
					String text = opt.hasNonNull("text") ? opt.get("text").asText()
							: opt.hasNonNull("optionText") ? opt.get("optionText").asText() : null;
					boolean correct = opt.path("isCorrect").asBoolean(opt.path("correct").asBoolean(false));
					if (text != null && !text.isBlank()) {
						options.add(new AiOption(text.trim(), correct));
					}
				}
			}
			if (node.path("questionText").isMissingNode()) {
				continue;
			}
			questions.add(new AiQuestion(
					node.path("questionText").asText().trim(),
					parseType(node.path("type").asText(null)),
					node.hasNonNull("points") && node.get("points").isInt() ? node.get("points").asInt() : null,
					node.hasNonNull("explanation") ? node.get("explanation").asText() : null,
					options));
		}
		return new AiGenerateResult(description, questions);
	}

	private static QuestionType parseType(String raw) {
		if (raw == null || raw.isBlank()) {
			return null;
		}
		try {
			return QuestionType.valueOf(raw.trim().toUpperCase());
		} catch (IllegalArgumentException e) {
			return null;
		}
	}

	static String stripCodeFences(String input) {
		String trimmed = input.trim();
		if (trimmed.startsWith("```")) {
			int firstNewline = trimmed.indexOf('\n');
			if (firstNewline > 0) {
				trimmed = trimmed.substring(firstNewline + 1);
			}
			if (trimmed.endsWith("```")) {
				trimmed = trimmed.substring(0, trimmed.length() - 3);
			}
		}
		return trimmed.trim();
	}
}

package com.example.quizapp.quiz.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.example.quizapp.common.exception.BadRequestException;
import com.example.quizapp.quiz.QuestionType;

@Component
public class CsvQuestionParser {

	public record CsvOption(String text, boolean correct) {
	}

	public record ParsedQuestion(
			String questionText,
			QuestionType type,
			int points,
			String explanation,
			List<CsvOption> options) {
	}

	public record RowResult(long lineNumber, ParsedQuestion question, String error) {

		static RowResult ok(long line, ParsedQuestion q) {
			return new RowResult(line, q, null);
		}

		static RowResult fail(long line, String error) {
			return new RowResult(line, null, error);
		}
	}

	public List<RowResult> parse(InputStream inputStream) {
		CSVFormat format = CSVFormat.DEFAULT.builder()
				.setHeader()
				.setSkipHeaderRecord(true)
				.setTrim(true)
				.setIgnoreEmptyLines(true)
				.build();

		try (Reader reader = new InputStreamReader(inputStream, StandardCharsets.UTF_8);
				CSVParser parser = format.parse(reader)) {

			List<String> headerNames = parser.getHeaderNames();
			if (headerNames == null
					|| !headerNames.contains("question_text")
					|| !headerNames.contains("correct_options")) {
				throw new BadRequestException(
						"CSV must have a header row containing at least 'question_text' and 'correct_options'");
			}
			List<Integer> optionColumnIndexes = optionColumnIndexes(headerNames);
			if (optionColumnIndexes.isEmpty()) {
				throw new BadRequestException(
						"CSV must contain at least one option column (option_1, option_2, ...)");
			}

			List<RowResult> results = new ArrayList<>();
			for (CSVRecord record : parser) {
				results.add(parseRow(record.getRecordNumber(), record, headerNames, optionColumnIndexes));
			}
			return results;
		} catch (IOException e) {
			throw new BadRequestException("Could not read the uploaded CSV file");
		} catch (IllegalArgumentException e) {
			throw new BadRequestException("Malformed CSV: " + e.getMessage());
		}
	}

	private List<Integer> optionColumnIndexes(List<String> headers) {
		List<Integer> indexes = new ArrayList<>();
		for (int i = 0; i < headers.size(); i++) {
			if (headers.get(i).toLowerCase().matches("option_\\d+")) {
				indexes.add(i);
			}
		}
		indexes.sort((a, b) -> Integer.compare(suffixNumber(headers.get(a)), suffixNumber(headers.get(b))));
		return indexes;
	}

	private int suffixNumber(String header) {
		return Integer.parseInt(header.toLowerCase().replaceAll("option_", ""));
	}

	private RowResult parseRow(long lineNumber, CSVRecord record,
			List<String> headers, List<Integer> optionIndexes) {
		try {
			String questionText = value(record, headers, "question_text");
			if (!StringUtils.hasText(questionText)) {
				return RowResult.fail(lineNumber, "question_text is empty");
			}

			QuestionType type = QuestionType.MCQ;
			String rawType = value(record, headers, "type");
			if (StringUtils.hasText(rawType)) {
				try {
					type = QuestionType.valueOf(rawType.trim().toUpperCase());
				} catch (IllegalArgumentException e) {
					return RowResult.fail(lineNumber, "Unknown type '" + rawType + "' (use MCQ, MULTI_SELECT or TRUE_FALSE)");
				}
			}

			int points = 1;
			String rawPoints = value(record, headers, "points");
			if (StringUtils.hasText(rawPoints)) {
				try {
					points = Integer.parseInt(rawPoints.trim());
				} catch (NumberFormatException e) {
					return RowResult.fail(lineNumber, "points must be a positive integer");
				}
				if (points < 1 || points > 100) {
					return RowResult.fail(lineNumber, "points must be between 1 and 100");
				}
			}

			List<CsvOption> options = new ArrayList<>();
			for (int index : optionIndexes) {
				String text = record.size() > index ? record.get(index) : "";
				if (StringUtils.hasText(text)) {
					options.add(new CsvOption(text.trim(), false));
				}
			}
			if (options.size() < 2) {
				return RowResult.fail(lineNumber, "At least two non-empty options are required");
			}

			Set<Integer> correctIndices = new LinkedHashSet<>();
			String rawCorrect = value(record, headers, "correct_options");
			if (!StringUtils.hasText(rawCorrect)) {
				return RowResult.fail(lineNumber, "correct_options is empty");
			}
			for (String part : rawCorrect.split("\\|")) {
				try {
					correctIndices.add(Integer.parseInt(part.trim()));
				} catch (NumberFormatException e) {
					return RowResult.fail(lineNumber, "correct_options must be 1-based indices joined by '|', got '" + rawCorrect + "'");
				}
			}
			for (int idx : correctIndices) {
				if (idx < 1 || idx > options.size()) {
					return RowResult.fail(lineNumber,
							"Correct index " + idx + " is out of range (1-" + options.size() + ")");
				}
			}
			for (int idx : correctIndices) {
				options.set(idx - 1, new CsvOption(options.get(idx - 1).text(), true));
			}

			long correctCount = options.stream().filter(CsvOption::correct).count();
			if ((type == QuestionType.MCQ || type == QuestionType.TRUE_FALSE) && correctCount > 1) {
				return RowResult.fail(lineNumber, type + " allows exactly one correct option");
			}
			if (type == QuestionType.TRUE_FALSE && options.size() != 2) {
				return RowResult.fail(lineNumber, "TRUE_FALSE questions must have exactly two options");
			}

			String explanation = value(record, headers, "explanation");
			return RowResult.ok(lineNumber, new ParsedQuestion(questionText, type, points, explanation, options));
		} catch (Exception e) {
			return RowResult.fail(lineNumber, e.getMessage());
		}
	}

	private String value(CSVRecord record, List<String> headers, String name) {
		int index = headers.indexOf(name);
		return index >= 0 && record.size() > index ? record.get(index) : null;
	}
}

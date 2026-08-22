package com.example.quizapp.quiz.dto;

import java.util.List;

public record BulkUploadResultDto(int imported, List<FailedRow> failures) {

	public record FailedRow(long lineNumber, String error) {
	}
}

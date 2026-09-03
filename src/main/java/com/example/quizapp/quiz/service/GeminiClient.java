package com.example.quizapp.quiz.service;

import java.util.List;
import java.util.Map;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;

import com.example.quizapp.common.exception.BadRequestException;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class GeminiClient {

	private final org.springframework.web.client.RestClient restClient;
	private final String apiKey;
	private final String model;

	public GeminiClient(
			@Value("${app.gemini.api-key}") String apiKey,
			@Value("${app.gemini.model}") String model,
			@Value("${app.gemini.base-url}") String baseUrl) {
		this.apiKey = apiKey;
		this.model = model;
		SimpleClientHttpRequestFactory rf = new SimpleClientHttpRequestFactory();
		rf.setConnectTimeout(Duration.ofSeconds(5));
		rf.setReadTimeout(Duration.ofSeconds(45));
		this.restClient = org.springframework.web.client.RestClient.builder()
				.requestFactory(rf)
				.baseUrl(baseUrl)
				.build();
	}

	public boolean isConfigured() {
		return apiKey != null && !apiKey.isBlank();
	}

	public String generateJson(String prompt) {
		if (!isConfigured()) {
			throw new BadRequestException("GEMINI_API_KEY is not configured");
		}
		Map<String, Object> body = Map.of(
				"contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
				"generationConfig", Map.of("temperature", 0.7, "responseMimeType", "application/json"));

		for (int attempt = 1; attempt <= 2; attempt++) {
			try {
				long httpStart = System.nanoTime();
				GeminiResponse response = restClient.post()
						.uri("/models/{model}:generateContent?key={key}", model, apiKey)
						.contentType(MediaType.APPLICATION_JSON)
						.body(body)
						.retrieve()
						.body(GeminiResponse.class);
				long httpMs = (System.nanoTime() - httpStart) / 1_000_000;
				log.info("gemini outbound HTTP call attempt={} model={} httpMs={}ms", attempt, model, httpMs);

				if (response == null || response.candidates() == null || response.candidates().isEmpty()) {
					throw new BadRequestException("Gemini returned no candidates");
				}
				List<Part> parts = response.candidates().get(0).content().parts();
				if (parts == null || parts.isEmpty() || parts.get(0).text() == null
						|| parts.get(0).text().isBlank()) {
					throw new BadRequestException("Gemini returned an empty response");
				}
				return parts.get(0).text();
			} catch (RestClientResponseException e) {
				int status = e.getStatusCode().value();
				if ((status == 429 || status >= 500) && attempt < 2) {
					log.warn("Gemini call failed with {} (attempt {}), retrying", status, attempt);
					sleep(800);
					continue;
				}
				throw new BadRequestException(
						"Gemini API error (HTTP " + status + "). Check GEMINI_API_KEY/model and try again.");
			} catch (ResourceAccessException e) {
				if (attempt < 2) {
					log.warn("Gemini call timed out (attempt {}), retrying", attempt);
					sleep(800);
					continue;
				}
				throw new BadRequestException("Question generation timed out, please try again");
			} catch (org.springframework.web.client.RestClientException e) {
				if (isTimeout(e)) {
					if (attempt < 2) {
						log.warn("Gemini call timed out (attempt {}), retrying", attempt);
						sleep(800);
						continue;
					}
					throw new BadRequestException("Question generation timed out, please try again");
				}
				throw e;
			}
		}
		throw new BadRequestException("Gemini API unavailable");
	}

	private boolean isTimeout(Throwable e) {
		Throwable t = e;
		while (t != null) {
			if (t instanceof java.net.SocketTimeoutException) return true;
			String msg = t.getMessage();
			if (msg != null && msg.toLowerCase().contains("read timed out")) return true;
			t = t.getCause();
		}
		return false;
	}

	private void sleep(long millis) {
		try {
			Thread.sleep(millis);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
		}
	}

	private record GeminiResponse(List<Candidate> candidates) {
	}

	private record Candidate(Content content) {
	}

	private record Content(List<Part> parts) {
	}

	private record Part(String text) {
	}
}

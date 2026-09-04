package com.example.quizapp;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.example.quizapp.quiz.Option;
import com.example.quizapp.user.Role;
import com.example.quizapp.user.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@SuppressWarnings("null")
class QuizFlowIntegrationTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private com.example.quizapp.quiz.repository.OptionRepository optionRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	private String email = "user-" + UUID.randomUUID() + "@test.dev";

	@Test
	@DisplayName("Guest can browse, take and complete a quiz; registered users get tokens")
	void fullGuestAndAuthFlow() throws Exception {
		MvcResult listResult = mockMvc.perform(get("/api/quizzes"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").exists())
				.andReturn();
		JsonNode quizzes = objectMapper.readTree(listResult.getResponse().getContentAsString());
		long quizId = quizzes.get(0).get("id").asLong();

		String guestSessionId = UUID.randomUUID().toString();
		MvcResult startResult = mockMvc.perform(post("/api/quizzes/" + quizId + "/start")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"guestSessionId\": \"" + guestSessionId + "\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.attemptId").exists())
				.andExpect(jsonPath("$.questions[0].questionText").exists())
				.andExpect(jsonPath("$.questions[0].options[0].optionId").exists())
				.andExpect(jsonPath("$.questions[0].options[0].isCorrect").doesNotExist())
				.andExpect(jsonPath("$.questions[0].correctOptionIds").doesNotExist())
				.andReturn();
		JsonNode started = objectMapper.readTree(startResult.getResponse().getContentAsString());
		long attemptId = started.get("attemptId").asLong();

		JsonNode questionNodes = started.get("questions");
		StringBuilder answers = new StringBuilder("[");
		for (int i = 0; i < questionNodes.size(); i++) {
			long questionId = questionNodes.get(i).get("questionId").asLong();
			List<Option> correctOptions = optionRepository.findByQuestionIdAndIsCorrectTrue(questionId);
			Long correctOptionId = correctOptions.get(0).getId();
			if (i > 0) {
				answers.append(",");
			}
			answers.append("{\"questionId\": ").append(questionId)
					.append(", \"selectedOptionIds\": [").append(correctOptionId).append("]}");
		}
		answers.append("]");

		String submitBody = "{\"guestSessionId\": \"" + guestSessionId + "\", \"answers\": " + answers + "}";
		mockMvc.perform(post("/api/attempts/" + attemptId + "/submit")
				.contentType(MediaType.APPLICATION_JSON)
				.content(submitBody))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("SUBMITTED"))
				.andExpect(jsonPath("$.score").value(questionNodes.size()))
				.andExpect(jsonPath("$.percentage").value(100.0))
				.andExpect(jsonPath("$.questions[0].explanation").exists());

		mockMvc.perform(post("/api/attempts/" + attemptId + "/submit")
				.contentType(MediaType.APPLICATION_JSON)
				.content(submitBody))
				.andExpect(status().isConflict());

		String otherGuest = UUID.randomUUID().toString();
		mockMvc.perform(get("/api/attempts/" + attemptId + "/result?guestSessionId=" + otherGuest))
				.andExpect(status().isForbidden());

		String registerBody = "{\"name\": \"Test User\", \"email\": \"" + email + "\", \"password\": \"password123\"}";
		mockMvc.perform(post("/api/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content(registerBody))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.accessToken").isNotEmpty())
				.andExpect(jsonPath("$.refreshToken").isNotEmpty());

		String loginBody = "{\"email\": \"" + email + "\", \"password\": \"password123\"}";
		MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(loginBody))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken").isNotEmpty())
				.andReturn();
		String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
				.path("accessToken").asText();

		mockMvc.perform(get("/api/users/me/stats").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalAttempts").value(0));

		mockMvc.perform(get("/api/users/me/history").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$").isEmpty());

		mockMvc.perform(post("/api/categories")
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\": \"Hacker Category\"}"))
				.andExpect(status().isForbidden());

		var adminOpt = userRepository.findByEmailIgnoreCase("admin@test.dev");
		org.assertj.core.api.Assertions.assertThat(adminOpt).isPresent();
		org.assertj.core.api.Assertions.assertThat(
				passwordEncoder.matches("admin123", adminOpt.get().getPasswordHash())).isTrue();
		org.assertj.core.api.Assertions.assertThat(adminOpt.get().getRole()).isEqualTo(Role.ADMIN);
	}
}

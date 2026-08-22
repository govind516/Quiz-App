package com.example.quizapp;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BookmarkIntegrationTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Test
	@DisplayName("Registered user can bookmark, list and remove quizzes")
	void bookmarkFlow() throws Exception {
		String email = "bookmarker-" + UUID.randomUUID() + "@test.dev";
		mockMvc.perform(post("/api/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\": \"Book Marker\", \"email\": \"" + email
						+ "\", \"password\": \"password123\"}"))
				.andExpect(status().isCreated());

		MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\": \"" + email + "\", \"password\": \"password123\"}"))
				.andExpect(status().isOk())
				.andReturn();
		String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
				.path("accessToken").asText();
		String auth = "Bearer " + token;

		MvcResult listResult = mockMvc.perform(get("/api/quizzes"))
				.andExpect(status().isOk())
				.andReturn();
		long quizId = objectMapper.readTree(listResult.getResponse().getContentAsString())
				.get(0).get("id").asLong();

		mockMvc.perform(get("/api/bookmarks").header("Authorization", auth))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(0));

		mockMvc.perform(post("/api/bookmarks/" + quizId).header("Authorization", auth))
				.andExpect(status().isNoContent());

		mockMvc.perform(post("/api/bookmarks/" + quizId).header("Authorization", auth))
				.andExpect(status().isConflict());

		mockMvc.perform(get("/api/bookmarks").header("Authorization", auth))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].id").value(quizId));

		mockMvc.perform(get("/api/leaderboard/global"))
				.andExpect(status().isOk());

		mockMvc.perform(delete("/api/bookmarks/" + quizId).header("Authorization", auth))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/bookmarks").header("Authorization", auth))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(0));

		mockMvc.perform(get("/api/bookmarks"))
				.andExpect(status().isForbidden());
	}
}

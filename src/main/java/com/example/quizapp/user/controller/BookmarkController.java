package com.example.quizapp.user.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.quizapp.auth.CurrentUserProvider;
import com.example.quizapp.quiz.dto.QuizDto;
import com.example.quizapp.user.BookmarkService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
@Tag(name = "Bookmarks")
public class BookmarkController {

	private final BookmarkService bookmarkService;
	private final CurrentUserProvider currentUserProvider;

	@GetMapping
	public ResponseEntity<List<QuizDto>> list() {
		return ResponseEntity.ok(bookmarkService.list(currentUserProvider.requireCurrentUser().getId()));
	}

	@PostMapping("/{quizId}")
	public ResponseEntity<Void> add(@PathVariable Long quizId) {
		bookmarkService.add(currentUserProvider.requireCurrentUser().getId(), quizId);
		return ResponseEntity.noContent().build();
	}

	@DeleteMapping("/{quizId}")
	public ResponseEntity<Void> remove(@PathVariable Long quizId) {
		bookmarkService.remove(currentUserProvider.requireCurrentUser().getId(), quizId);
		return ResponseEntity.noContent().build();
	}
}

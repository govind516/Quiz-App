package com.example.quizapp.quiz.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.quizapp.common.exception.ResourceNotFoundException;
import com.example.quizapp.quiz.dto.CategoryAdminRow;
import com.example.quizapp.quiz.dto.CategoryDto;
import com.example.quizapp.quiz.repository.CategoryRepository;
import com.example.quizapp.quiz.repository.QuizRepository;
import com.example.quizapp.common.exception.ConflictException;
import com.example.quizapp.quiz.Category;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Categories")
public class AdminCategoryController {

	public record RenameRequest(@NotBlank String name, String description) {
	}

	private final CategoryRepository categoryRepository;
	private final QuizRepository quizRepository;

	public record CategoryAdminDto(Long id, String name, String slug, String description,
			long quizzes, long questions) {
	}

	@GetMapping
	public ResponseEntity<List<CategoryAdminDto>> list() {
		List<CategoryAdminDto> items = categoryRepository.findAllWithCounts().stream()
				.map(row -> new CategoryAdminDto(row.getId(), row.getName(), row.getSlug(),
						null, row.getQuizzes(), row.getQuestions()))
				.toList();
		return ResponseEntity.ok(items);
	}

	@PutMapping("/{id}")
	public ResponseEntity<CategoryAdminDto> rename(@PathVariable Long id,
			@Valid @RequestBody RenameRequest request) {
		Category category = categoryRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Category", id));
		category.setName(request.name().trim());
		if (request.description() != null) {
			category.setDescription(request.description());
		}
		Category saved = categoryRepository.save(category);
		long quizzes = quizRepository.countByCategoryId(id);
		return ResponseEntity.ok(new CategoryAdminDto(saved.getId(), saved.getName(),
				saved.getSlug(), saved.getDescription(), quizzes, 0));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		if (quizRepository.existsByCategoryId(id)) {
			throw new ConflictException(
					"Category still has quizzes — move or delete them first");
		}
		categoryRepository.deleteById(id);
		return ResponseEntity.noContent().build();
	}
}

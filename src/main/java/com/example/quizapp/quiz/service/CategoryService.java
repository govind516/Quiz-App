package com.example.quizapp.quiz.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.example.quizapp.common.exception.ConflictException;
import com.example.quizapp.quiz.Category;
import com.example.quizapp.quiz.dto.CategoryDto;
import com.example.quizapp.quiz.dto.CategoryRequest;
import com.example.quizapp.quiz.repository.CategoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class CategoryService {

	private final CategoryRepository categoryRepository;

	@Transactional(readOnly = true)
	public List<CategoryDto> list() {
		return categoryRepository.findAll().stream()
				.map(c -> new CategoryDto(c.getId(), c.getName(), c.getSlug(), c.getDescription()))
				.toList();
	}

	@Transactional
	public CategoryDto create(CategoryRequest request) {
		String slug = StringUtils.hasText(request.slug()) ? QuizService.slugify(request.slug())
				: QuizService.slugify(request.name());
		if (categoryRepository.existsBySlug(slug)) {
			throw new ConflictException("Category slug already exists: " + slug);
		}
		categoryRepository.findByNameIgnoreCase(request.name().trim()).ifPresent(c -> {
			throw new ConflictException("Category name already exists");
		});
		Category category = categoryRepository.save(Category.builder()
				.name(request.name().trim())
				.slug(slug)
				.description(request.description())
				.build());
		return new CategoryDto(category.getId(), category.getName(), category.getSlug(), category.getDescription());
	}
}

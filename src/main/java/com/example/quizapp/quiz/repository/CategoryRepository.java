package com.example.quizapp.quiz.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.quizapp.quiz.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> {

	Optional<Category> findBySlug(String slug);

	Optional<Category> findByNameIgnoreCase(String name);

	boolean existsBySlug(String slug);
}

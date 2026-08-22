package com.example.quizapp.quiz.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.quizapp.quiz.Tag;

public interface TagRepository extends JpaRepository<Tag, Long> {

	Optional<Tag> findBySlug(String slug);
}

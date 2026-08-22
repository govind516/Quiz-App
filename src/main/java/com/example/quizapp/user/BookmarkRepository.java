package com.example.quizapp.user;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {

	List<Bookmark> findAllByUserIdOrderByCreatedAtDesc(Long userId);

	boolean existsByUserIdAndQuizId(Long userId, Long quizId);

	Optional<Bookmark> findByUserIdAndQuizId(Long userId, Long quizId);

	@Modifying
	void deleteByUserIdAndQuizId(Long userId, Long quizId);
}

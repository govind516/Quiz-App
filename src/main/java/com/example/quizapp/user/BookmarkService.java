package com.example.quizapp.user;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.quizapp.common.exception.ConflictException;
import com.example.quizapp.common.exception.ResourceNotFoundException;
import com.example.quizapp.quiz.Quiz;
import com.example.quizapp.quiz.dto.QuizDto;
import com.example.quizapp.quiz.repository.QuizRepository;
import com.example.quizapp.quiz.service.QuizService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookmarkService {

	private final BookmarkRepository bookmarkRepository;
	private final QuizRepository quizRepository;
	private final QuizService quizService;

	@Transactional(readOnly = true)
	public List<QuizDto> list(Long userId) {
		return bookmarkRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
				.map(bookmark -> quizService.toDto(bookmark.getQuiz()))
				.toList();
	}

	@Transactional
	public void add(Long userId, Long quizId) {
		if (bookmarkRepository.existsByUserIdAndQuizId(userId, quizId)) {
			throw new ConflictException("Quiz is already bookmarked");
		}
		Quiz quiz = quizRepository.findById(quizId)
				.orElseThrow(() -> new ResourceNotFoundException("Quiz", quizId));
		bookmarkRepository.save(Bookmark.builder()
				.user(User.builder().id(userId).build())
				.quiz(quiz)
				.build());
	}

	@Transactional
	public void remove(Long userId, Long quizId) {
		if (!bookmarkRepository.existsByUserIdAndQuizId(userId, quizId)) {
			throw new ResourceNotFoundException("Bookmark", quizId);
		}
		bookmarkRepository.deleteByUserIdAndQuizId(userId, quizId);
	}
}

package com.example.quizapp.user;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByEmailIgnoreCase(String email);

	boolean existsByEmailIgnoreCase(String email);

	long countByCreatedAtAfter(Instant cutoff);

	boolean existsByBannedTrue();

	java.util.List<User> findAllByIdIn(java.util.Collection<Long> ids);

	Page<User> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
			String name, String email, Pageable pageable);
}

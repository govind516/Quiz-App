package com.example.quizapp.certificate.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.quizapp.certificate.Certificate;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {

	Optional<Certificate> findByCode(String code);

	List<Certificate> findAllByUserIdOrderByIssuedAtDesc(Long userId);

	boolean existsByUserIdAndCategoryId(Long userId, Long categoryId);

	Optional<Certificate> findByUserIdAndCategoryId(Long userId, Long categoryId);
}

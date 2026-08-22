package com.example.quizapp.certificate;

import java.time.Instant;

import com.example.quizapp.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "certificates", uniqueConstraints = @UniqueConstraint(name = "uq_cert_code", columnNames = "code"))
public class Certificate {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 12)
	private String code;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	private User user;

	@Column(name = "category_id", nullable = false)
	private Long categoryId;

	@Column(name = "category_name", nullable = false, length = 100)
	private String categoryName;

	@Column(name = "issued_at")
	private Instant issuedAt;
}

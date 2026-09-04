package com.example.quizapp.auth;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import com.example.quizapp.auth.AppUserDetailsService.AppUserPrincipal;
import com.example.quizapp.user.User;
import com.example.quizapp.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
@SuppressWarnings("null")
public class CurrentUserProvider {

	private final UserRepository userRepository;

	public boolean isAdmin() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		return authentication != null
				&& authentication.getAuthorities().stream()
						.anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
	}

	public User requireCurrentUser() {
		return get().orElseThrow(() ->
				new org.springframework.security.access.AccessDeniedException("Authentication required"));
	}

	public java.util.Optional<User> get() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || !authentication.isAuthenticated()) {
			return java.util.Optional.empty();
		}
		Object principal = authentication.getPrincipal();
		if (principal instanceof AppUserPrincipal appPrincipal) {
			return userRepository.findById(appPrincipal.getId());
		}
		if (principal instanceof UserDetails userDetails) {
			return userRepository.findByEmailIgnoreCase(userDetails.getUsername());
		}
		return java.util.Optional.empty();
	}
}

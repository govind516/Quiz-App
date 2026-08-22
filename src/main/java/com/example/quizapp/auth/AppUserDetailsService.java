package com.example.quizapp.auth;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.quizapp.user.User;
import com.example.quizapp.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AppUserDetailsService implements UserDetailsService {

	private final UserRepository userRepository;

	@Override
	public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
		User user = userRepository.findByEmailIgnoreCase(email)
				.orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
		return new AppUserPrincipal(user);
	}

	@lombok.Getter
	public static class AppUserPrincipal implements UserDetails {

		private final User user;

		public AppUserPrincipal(User user) {
			this.user = user;
		}

		public Long getId() {
			return user.getId();
		}

		@Override
		public String getUsername() {
			return user.getEmail();
		}

		@Override
		public String getPassword() {
			return user.getPasswordHash();
		}

		@Override
		public java.util.Collection<? extends org.springframework.security.core.GrantedAuthority> getAuthorities() {
			return java.util.List.of(
					new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
		}

		@Override
		public boolean isAccountNonExpired() {
			return true;
		}

		@Override
		public boolean isAccountNonLocked() {
			return true;
		}

		@Override
		public boolean isCredentialsNonExpired() {
			return true;
		}

		@Override
		public boolean isEnabled() {
			return true;
		}
	}
}

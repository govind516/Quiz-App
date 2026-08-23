package com.example.quizapp.settings.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.quizapp.settings.SettingsService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Settings")
public class AdminSettingsController {

	public record SettingsView(boolean aiGenerationEnabled, boolean registrationEnabled) {
	}

	public record SettingsUpdate(Boolean aiGenerationEnabled, Boolean registrationEnabled) {
	}

	private final SettingsService settingsService;

	@GetMapping
	public ResponseEntity<SettingsView> get() {
		return ResponseEntity.ok(new SettingsView(
				settingsService.isAiGenerationEnabled(),
				settingsService.isRegistrationEnabled()));
	}

	@PutMapping
	public ResponseEntity<SettingsView> update(@RequestBody SettingsUpdate update) {
		if (update.aiGenerationEnabled() != null) {
			settingsService.set(SettingsService.KEY_AI_GENERATION,
					update.aiGenerationEnabled().toString());
		}
		if (update.registrationEnabled() != null) {
			settingsService.set(SettingsService.KEY_REGISTRATION,
					update.registrationEnabled().toString());
		}
		return get();
	}
}

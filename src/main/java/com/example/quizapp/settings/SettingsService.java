package com.example.quizapp.settings;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.quizapp.common.exception.BadRequestException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class SettingsService {

	public static final String KEY_AI_GENERATION = "ai_generation_enabled";
	public static final String KEY_REGISTRATION = "registration_enabled";

	private final PlatformSettingRepository settingRepository;

	@Transactional(readOnly = true)
	public boolean isAiGenerationEnabled() {
		return isEnabled(KEY_AI_GENERATION);
	}

	@Transactional(readOnly = true)
	public boolean isRegistrationEnabled() {
		return isEnabled(KEY_REGISTRATION);
	}

	private boolean isEnabled(String key) {
		return settingRepository.findById(key)
				.map(s -> !"false".equalsIgnoreCase(s.getValue()))
				.orElse(true);
	}

	@Transactional
	public void set(String key, String value) {
		if (!"true".equalsIgnoreCase(value) && !"false".equalsIgnoreCase(value)) {
			throw new BadRequestException("Setting value must be true or false");
		}
		PlatformSetting setting = settingRepository.findById(key)
				.orElseGet(() -> PlatformSetting.builder().key(key).build());
		setting.setValue(value.toLowerCase());
		settingRepository.save(setting);
	}
}

package com.example.quizapp.live;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class LiveRoomPointsTest {

	@Test
	@DisplayName("Speed bonus scales between 500 and 1000 points")
	void speedBonusRange() {
		assertThat(LiveRoomService.pointsFor(1.0)).isEqualTo(1000);
		assertThat(LiveRoomService.pointsFor(0.0)).isEqualTo(500);
		assertThat(LiveRoomService.pointsFor(0.5)).isEqualTo(750);
	}

	@Test
	@DisplayName("Out-of-range fractions are clamped")
	void clampsFractions() {
		assertThat(LiveRoomService.pointsFor(-5.0)).isEqualTo(500);
		assertThat(LiveRoomService.pointsFor(9.9)).isEqualTo(1000);
	}
}

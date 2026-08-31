package com.example.quizapp.live.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.quizapp.auth.CurrentUserProvider;
import com.example.quizapp.common.ratelimit.ClientIdentifiers;
import com.example.quizapp.common.ratelimit.RateLimitService;
import com.example.quizapp.live.LiveRoomService;
import com.example.quizapp.live.dto.CreateLiveRoomRequest;
import com.example.quizapp.live.dto.CreateLiveRoomResponse;
import com.example.quizapp.live.dto.JoinLiveRoomRequest;
import com.example.quizapp.live.dto.LiveRoomInfo;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/live-rooms")
@RequiredArgsConstructor
@Tag(name = "Live Rooms")
public class LiveRoomController {

	private final LiveRoomService liveRoomService;
	private final CurrentUserProvider currentUserProvider;
	private final RateLimitService rateLimitService;

	public record JoinResponse(String playerId, String nickname) {
	}

	@PostMapping
	public ResponseEntity<CreateLiveRoomResponse> create(@Valid @RequestBody CreateLiveRoomRequest request) {
		boolean joinAsPlayer = Boolean.TRUE.equals(request.joinAsPlayer());
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(liveRoomService.create(currentUserProvider.requireCurrentUser(), request.quizId(), joinAsPlayer));
	}

	@GetMapping("/{code}")
	public ResponseEntity<LiveRoomInfo> info(@PathVariable String code) {
		return ResponseEntity.ok(liveRoomService.info(code));
	}

	@PostMapping("/{code}/join")
	public ResponseEntity<JoinResponse> join(
			@PathVariable String code,
			@Valid @RequestBody JoinLiveRoomRequest request,
			HttpServletRequest httpRequest) {
		rateLimitService.checkStart(ClientIdentifiers.clientIp(httpRequest));
		UUID playerId = liveRoomService.join(code, request.nickname());
		return ResponseEntity.ok(new JoinResponse(playerId.toString(), request.nickname().trim()));
	}

	@PostMapping("/{code}/start")
	public ResponseEntity<Void> start(@PathVariable String code) {
		liveRoomService.start(currentUserProvider.requireCurrentUser().getId(), code);
		return ResponseEntity.noContent().build();
	}
}

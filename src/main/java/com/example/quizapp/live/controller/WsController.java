package com.example.quizapp.live.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import com.example.quizapp.live.LiveRoomService;
import com.example.quizapp.live.dto.AnswerMessage;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class WsController {

	private final LiveRoomService liveRoomService;

	@MessageMapping("/room/{code}/answer")
	public void answer(@DestinationVariable String code, AnswerMessage message) {
		liveRoomService.handleAnswer(code, message);
	}
}

"use client";

import { Client, type IMessage } from "@stomp/stompjs";
import { API_BASE_URL } from "./config";
import type {
	FinalResultsPayload,
	LiveQuestionPayload,
	LiveRoomInfo,
} from "./types";

export type LiveMessage =
	| { kind: "lobby"; info: LiveRoomInfo }
	| { kind: "question"; payload: LiveQuestionPayload }
	| { kind: "final"; results: FinalResultsPayload };

export function parseLiveMessage(body: string): LiveMessage | null {
	const data = JSON.parse(body);
	if ("entries" in data) return { kind: "final", results: data as FinalResultsPayload };
	if ("question" in data) return { kind: "question", payload: data as LiveQuestionPayload };
	if ("status" in data) return { kind: "lobby", info: data as LiveRoomInfo };
	return null;
}

export function createLiveClient(
	code: string,
	onMessage: (message: LiveMessage) => void
): Client {
	const wsUrl = API_BASE_URL.replace(/^http/, "ws") + "/ws";
	const client = new Client({
		brokerURL: wsUrl,
		reconnectDelay: 3000,
		onConnect: () => {
			client.subscribe(`/topic/room/${code}`, (message: IMessage) => {
				const parsed = parseLiveMessage(message.body);
				if (parsed) onMessage(parsed);
			});
		},
	});
	client.activate();
	return client;
}

export function sendLiveAnswer(
	client: Client,
	code: string,
	payload: {
		playerId: string;
		questionIndex: number;
		questionId: number;
		selectedOptionIds: number[];
	}
): void {
	if (client.connected) {
		client.publish({
			destination: `/app/room/${code}/answer`,
			body: JSON.stringify(payload),
		});
	}
}

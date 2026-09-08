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

export type LiveConnectionState = "connecting" | "connected" | "reconnecting";

export function createLiveClient(
	code: string,
	onMessage: (message: LiveMessage) => void,
	onState?: (state: LiveConnectionState) => void
): Client {
	const wsUrl = API_BASE_URL.replace(/^http/, "ws") + "/ws";
	const client = new Client({
		brokerURL: wsUrl,
		reconnectDelay: 3000,
		onConnect: () => {
			onState?.("connected");
			client.subscribe(`/topic/room/${code}`, (message: IMessage) => {
				const parsed = parseLiveMessage(message.body);
				if (parsed) onMessage(parsed);
			});
		},
		onStompError: () => onState?.("reconnecting"),
		onWebSocketClose: () => onState?.("reconnecting"),
	});
	onState?.("connecting");
	client.activate();
	return client;
}

export function disconnectLiveClient(client: Client | null) {
	try {
		client?.deactivate();
	} catch {
		// already closed — nothing to do
	}
}

// Player identity persisted per room so refreshes and rebroadcasts
// rejoin silently instead of forcing a new nickname every visit.
const playerKey = (code: string) => `hexquiz-live-player:${code.toUpperCase()}`;
const hostKey = (code: string) => `hexquiz-live-host:${code.toUpperCase()}`;

export function loadLiveIdentity(code: string): { playerId: string | null; isHost: boolean } {
	try {
		return {
			playerId: sessionStorage.getItem(playerKey(code)),
			isHost: sessionStorage.getItem(hostKey(code)) === "1",
		};
	} catch {
		return { playerId: null, isHost: false };
	}
}

export function saveLiveIdentity(code: string, playerId: string, isHost: boolean) {
	try {
		sessionStorage.setItem(playerKey(code), playerId);
		sessionStorage.setItem(hostKey(code), isHost ? "1" : "0");
	} catch {
		// private mode — rejoin will just ask for a nickname again
	}
}

export function clearLiveHost(code: string) {
	try {
		sessionStorage.removeItem(hostKey(code));
	} catch {}
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

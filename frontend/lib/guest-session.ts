"use client";

import { GUEST_SESSION_KEY } from "./config";

export function getGuestSessionId(): string {
	if (typeof window === "undefined") {
		throw new Error("guest session is browser-only");
	}
	let id = window.localStorage.getItem(GUEST_SESSION_KEY);
	if (!id) {
		id = crypto.randomUUID();
		window.localStorage.setItem(GUEST_SESSION_KEY, id);
	}
	return id;
}

export type StartPayload = import("./types").StartAttemptResponse;

const attemptKey = (attemptId: number | string) =>
	`quiz.attempt.${attemptId}`;

export function saveStartPayload(payload: StartPayload): void {
	sessionStorage.setItem(attemptKey(payload.attemptId), JSON.stringify(payload));
}

export function loadStartPayload(attemptId: number | string): StartPayload | null {
	if (typeof window === "undefined") return null;
	const raw = sessionStorage.getItem(attemptKey(attemptId));
	if (!raw) return null;
	try {
		return JSON.parse(raw) as StartPayload;
	} catch {
		return null;
	}
}

let cachedRead: { key: string; value: StartPayload | null } | null = null;

export function readStartPayloadCached(attemptId: number | string): StartPayload | null {
	if (!cachedRead || cachedRead.key !== attemptId) {
		cachedRead = { key: String(attemptId), value: loadStartPayload(attemptId) };
	}
	return cachedRead.value;
}

export function clearStartPayload(attemptId: number | string): void {
	sessionStorage.removeItem(attemptKey(attemptId));
}

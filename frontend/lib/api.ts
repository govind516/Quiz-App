"use client";

import { API_BASE_URL } from "./config";
import { useAuthStore } from "./auth-store";

export class ApiError extends Error {
	status: number;
	fieldErrors: Record<string, string>;

	constructor(message: string, status: number, fieldErrors: Record<string, string> = {}) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.fieldErrors = fieldErrors;
	}
}

interface ApiOptions {
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	body?: unknown;
	auth?: boolean;
	retry?: boolean;
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
	const { refreshToken } = useAuthStore.getState();
	if (!refreshToken) return false;
	try {
		const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ refreshToken }),
		});
		if (!res.ok) {
			useAuthStore.getState().logout();
			return false;
		}
		const auth = await res.json();
		useAuthStore.getState().setAuth(auth);
		return true;
	} catch {
		return false;
	}
}

function scheduleRefresh(): Promise<boolean> {
	if (!refreshInFlight) {
		refreshInFlight = refreshTokens().finally(() => {
			refreshInFlight = null;
		});
	}
	return refreshInFlight;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
	const { method = "GET", body, auth = true, retry = true } = options;

	const headers: Record<string, string> = {};
	const isFormBody = body instanceof FormData;
	if (body !== undefined && !isFormBody) {
		headers["Content-Type"] = "application/json";
	}
	const { accessToken } = useAuthStore.getState();
	if (auth && accessToken) {
		headers["Authorization"] = `Bearer ${accessToken}`;
	}

	const res = await fetch(`${API_BASE_URL}${path}`, {
		method,
		headers,
		body:
			body === undefined
				? undefined
				: isFormBody
					? (body as FormData)
					: JSON.stringify(body),
		cache: "no-store",
	});

	if (res.status === 401 && auth && retry && useAuthStore.getState().refreshToken) {
		const refreshed = await scheduleRefresh();
		if (refreshed) {
			return api<T>(path, { ...options, retry: false });
		}
	}

	if (!res.ok) {
		let message = `Request failed with status ${res.status}`;
		let fieldErrors: Record<string, string> = {};
		try {
			const data = await res.json();
			if (typeof data?.message === "string") message = data.message;
			if (data?.fieldErrors && typeof data.fieldErrors === "object") {
				fieldErrors = data.fieldErrors;
			}
		} catch {
			// non-JSON error body
		}
		throw new ApiError(message, res.status, fieldErrors);
	}

	if (res.status === 204) {
		return undefined as T;
	}
	return res.json() as Promise<T>;
}

export function publicApi<T>(path: string, options: Omit<ApiOptions, "auth"> = {}): Promise<T> {
	return api<T>(path, { ...options, auth: false });
}

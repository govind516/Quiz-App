"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse, UserDto } from "./types";

interface AuthState {
	user: UserDto | null;
	accessToken: string | null;
	refreshToken: string | null;
	setAuth: (auth: AuthResponse) => void;
	logout: () => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			user: null,
			accessToken: null,
			refreshToken: null,
			setAuth: (auth) =>
				set({
					user: auth.user,
					accessToken: auth.accessToken,
					refreshToken: auth.refreshToken,
				}),
			logout: () =>
				set({ user: null, accessToken: null, refreshToken: null }),
		}),
		{ name: "quiz.auth" }
	)
);

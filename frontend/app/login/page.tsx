"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { publicApi, ApiError } from "@/lib/api";
import type { AuthResponse } from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";

export default function LoginPage() {
	const router = useRouter();
	const setAuth = useAuthStore((s) => s.setAuth);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setPending(true);
		try {
			const auth = await publicApi<AuthResponse>("/api/auth/login", {
				method: "POST",
				body: { email, password },
			});
			setAuth(auth);
			router.push("/");
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Login failed.");
		} finally {
			setPending(false);
		}
	}

	return (
		<div className="mx-auto max-w-sm">
			<h1 className="text-2xl font-bold tracking-tight text-slate-900">
				Log in
			</h1>
			<p className="mt-1 text-sm text-slate-500">
				Welcome back — your progress awaits.
			</p>

			<form onSubmit={handleSubmit} className="mt-6 space-y-4">
				<div>
					<label htmlFor="email" className="block text-sm font-medium text-slate-700">
						Email
					</label>
					<input
						id="email"
						type="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
					/>
				</div>
				<div>
					<label htmlFor="password" className="block text-sm font-medium text-slate-700">
						Password
					</label>
					<input
						id="password"
						type="password"
						required
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
					/>
				</div>

				{error && (
					<div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
						{error}
					</div>
				)}

				<button
					disabled={pending}
					className="w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
				>
					{pending ? "Logging in…" : "Log in"}
				</button>
			</form>

			<p className="mt-4 text-center text-sm text-slate-500">
				No account?{" "}
				<Link href="/register" className="font-medium text-indigo-600 hover:underline">
					Sign up free
				</Link>
			</p>
		</div>
	);
}

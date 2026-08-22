"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, publicApi } from "@/lib/api";
import type { AuthResponse } from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";

export default function RegisterPage() {
	const router = useRouter();
	const setAuth = useAuthStore((s) => s.setAuth);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [pending, setPending] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setFieldErrors({});
		setPending(true);
		try {
			const auth = await publicApi<AuthResponse>("/api/auth/register", {
				method: "POST",
				body: { name, email, password },
			});
			setAuth(auth);
			router.push("/");
		} catch (err) {
			if (err instanceof ApiError) {
				setError(err.message);
				setFieldErrors(err.fieldErrors);
			} else {
				setError("Registration failed.");
			}
		} finally {
			setPending(false);
		}
	}

	function fieldError(field: string): string | undefined {
		return fieldErrors[field];
	}

	return (
		<div className="mx-auto max-w-sm">
			<h1 className="text-2xl font-bold tracking-tight text-slate-900">
				Create your account
			</h1>
			<p className="mt-1 text-sm text-slate-500">
				Save your scores, track progress and climb the leaderboards.
			</p>

			<form onSubmit={handleSubmit} className="mt-6 space-y-4">
				<div>
					<label htmlFor="name" className="block text-sm font-medium text-slate-700">
						Name
					</label>
					<input
						id="name"
						required
						minLength={2}
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
					/>
					{fieldError("name") && (
						<p className="mt-1 text-xs text-rose-500">{fieldError("name")}</p>
					)}
				</div>
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
					{fieldError("email") && (
						<p className="mt-1 text-xs text-rose-500">{fieldError("email")}</p>
					)}
				</div>
				<div>
					<label htmlFor="password" className="block text-sm font-medium text-slate-700">
						Password
					</label>
					<input
						id="password"
						type="password"
						required
						minLength={8}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
					/>
					{fieldError("password") ? (
						<p className="mt-1 text-xs text-rose-500">{fieldError("password")}</p>
					) : (
						<p className="mt-1 text-xs text-slate-400">At least 8 characters.</p>
					)}
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
					{pending ? "Creating account…" : "Sign up"}
				</button>
			</form>

			<p className="mt-4 text-center text-sm text-slate-500">
				Already registered?{" "}
				<Link href="/login" className="font-medium text-indigo-600 hover:underline">
					Log in
				</Link>
			</p>
		</div>
	);
}

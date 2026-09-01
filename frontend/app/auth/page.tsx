"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ApiError, publicApi } from "@/lib/api";
import type { AuthResponse } from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";
import { IconArrowRight, IconHexLogo } from "@/components/icons";
import { Button } from "@/components/ui";

type Mode = "login" | "signup";

function AuthInner() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const setAuth = useAuthStore((s) => s.setAuth);

	const paramMode: Mode =
		searchParams.get("mode") === "signup" ? "signup" : "login";
	const [override, setOverride] = useState<Mode | null>(null);
	const mode: Mode = override ?? paramMode;
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
			const body =
				mode === "login"
					? { email, password }
					: { name, email, password };
			const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
			const auth = await publicApi<AuthResponse>(path, {
				method: "POST",
				body,
			});
			setAuth(auth);
			router.push("/me");
		} catch (err) {
			if (err instanceof ApiError) {
				setError(err.message);
				setFieldErrors(err.fieldErrors);
			} else {
				setError(mode === "login" ? "Login failed." : "Registration failed.");
			}
		} finally {
			setPending(false);
		}
	}

	function fieldError(field: string): string | undefined {
		return fieldErrors[field];
	}

	return (
		<div className="auth-wrap -mx-5 sm:-mx-10">
			<div className="auth-side">
				<div className="brand">
					<IconHexLogo size={26} />
					HexQuiz
				</div>
				<div>
					<svg width="100%" height="180" viewBox="0 0 380 180">
						<line x1="40" y1="40" x2="150" y2="90" stroke="rgba(123,92,255,.3)" strokeWidth="1.5" />
						<line x1="150" y1="90" x2="280" y2="50" stroke="rgba(53,232,180,.25)" strokeWidth="1.5" />
						<line x1="150" y1="90" x2="120" y2="160" stroke="rgba(123,92,255,.2)" strokeWidth="1.5" />
						<line x1="280" y1="50" x2="330" y2="140" stroke="rgba(123,92,255,.2)" strokeWidth="1.5" />
						<circle className="node" cx="40" cy="40" r="4" fill="#7B5CFF" />
						<circle className="node" cx="150" cy="90" r="4" fill="#35E8B4" />
						<circle className="node" cx="280" cy="50" r="4" fill="#7B5CFF" />
						<circle className="node" cx="120" cy="160" r="4" fill="#FFB84D" />
						<circle className="node" cx="330" cy="140" r="4" fill="#7B5CFF" />
					</svg>
					<h2>
						Practice makes
						<br />
						senior engineers.
					</h2>
					<p className="text-mutedc max-w-[360px] mt-4">
						Track streaks, climb the leaderboard and never lose your progress
						across sessions.
					</p>
				</div>
				<div className="faintc mono text-xs">© HexQuiz — built for people who ship.</div>
			</div>

			<div className="auth-form-col">
				<div className="auth-box">
					<div className="auth-tabs">
						<button
							type="button"
							className={`auth-tab ${mode === "login" ? "active" : ""}`}
							onClick={() => setOverride("login")}
						>
							Log in
						</button>
						<button
							type="button"
							className={`auth-tab ${mode === "signup" ? "active" : ""}`}
							onClick={() => setOverride("signup")}
						>
							Sign up
						</button>
					</div>

					<form onSubmit={handleSubmit}>
						{mode === "signup" && (
							<div className="field">
								<label htmlFor="su-name" style={{ fontFamily: "var(--font-apple), sans-serif", fontSize: 13, fontWeight: 500, color: "var(--color-mutedc)" }}>Name</label>
								<input
									id="su-name"
									className="input"
									required
									minLength={2}
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Ada Lovelace"
									style={{ height: 44, fontFamily: "var(--font-apple), sans-serif" }}
								/>
								{fieldError("name") && (
									<span style={{ fontFamily: "var(--font-apple), sans-serif", fontSize: 13, color: "var(--color-dangerc)" }}>{fieldError("name")}</span>
								)}
							</div>
						)}
						<div className="field">
						<label htmlFor="auth-email" style={{ fontFamily: "var(--font-apple), sans-serif", fontSize: 13, fontWeight: 500, color: "var(--color-mutedc)" }}>Email</label>
						<input
							id="auth-email"
								className="input"
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@company.com"
								style={{ height: 44, fontFamily: "var(--font-apple), sans-serif" }}
							/>
							{fieldError("email") && (
								<span style={{ fontFamily: "var(--font-apple), sans-serif", fontSize: 13, color: "var(--color-dangerc)" }}>{fieldError("email")}</span>
							)}
						</div>
						<div className="field">
						<label htmlFor="auth-password" style={{ fontFamily: "var(--font-apple), sans-serif", fontSize: 13, fontWeight: 500, color: "var(--color-mutedc)" }}>Password</label>
						<input
							id="auth-password"
							type="password"
								required
								minLength={8}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••••"
								style={{ height: 44, fontFamily: "var(--font-apple), sans-serif" }}
							/>
							{fieldError("password") ? (
								<span style={{ fontFamily: "var(--font-apple), sans-serif", fontSize: 13, color: "var(--color-dangerc)" }}>{fieldError("password")}</span>
							) : (
								mode === "signup" && (
									<span className="text-xs" style={{ fontFamily: "var(--font-apple), sans-serif", color: "var(--color-faintc)" }}>At least 8 characters.</span>
								)
							)}
						</div>

						{error && (
							<div className="rounded-lg border px-3 py-2 text-sm mb-4" style={{ borderColor: "rgba(248,113,113,0.4)", background: "var(--color-dangerdim)", color: "var(--color-dangerc)", fontFamily: "var(--font-apple), sans-serif", fontSize: 13 }}>
								{error}
							</div>
						)}

						<Button block disabled={pending} loading={pending} style={{ height: 44, borderRadius: 999, fontFamily: "var(--font-apple), sans-serif" }}>
							{pending
								? mode === "login"
									? "Logging in…"
									: "Creating account…"
								: mode === "login"
									? "Continue"
									: "Create account"}
						</Button>
					</form>

					<div className="divider" style={{ fontFamily: "var(--font-apple), sans-serif" }}>or</div>
					<Link href="/browse" className="btn btn-ghost btn-block" style={{ fontFamily: "var(--font-apple), sans-serif" }}>
						Continue as guest <IconArrowRight size={14} />
					</Link>
					<div className="auth-terms">
						Guest scores aren&apos;t saved — sign up to keep your progress.
					</div>
				</div>
			</div>
		</div>
	);
}

export default function AuthPage() {
	return (
		<Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-surface2 mt-10" />}>
			<AuthInner />
		</Suspense>
	);
}

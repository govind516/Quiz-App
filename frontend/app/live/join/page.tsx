"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { publicApi } from "@/lib/api";

export default function JoinLiveRoomPage() {
	const router = useRouter();
	const [code, setCode] = useState("");
	const [nickname, setNickname] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function handleJoin(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setPending(true);
		try {
			const res = await publicApi<{ playerId: string; nickname: string }>(
				`/api/live-rooms/${code.trim().toUpperCase()}/join`,
				{ method: "POST", body: { nickname: nickname.trim() } }
			);
			sessionStorage.setItem(
				`live.player.${code.trim().toUpperCase()}`,
				JSON.stringify(res)
			);
			router.push(`/live/room/${code.trim().toUpperCase()}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not join the room.");
			setPending(false);
		}
	}

	return (
		<div className="mx-auto max-w-sm">
			<h1 className="text-3xl font-bold tracking-tight text-slate-900">
				Join a live game
			</h1>
			<p className="mt-1 text-slate-500">No account needed — just a nickname.</p>

			<form
				onSubmit={handleJoin}
				className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
			>
				<div>
					<label htmlFor="code" className="block text-sm font-medium text-slate-700">
						Room code
					</label>
					<input
						id="code"
						required
						value={code}
						onChange={(e) => setCode(e.target.value.toUpperCase())}
						placeholder="ABC123"
						maxLength={6}
						className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-center font-mono text-xl tracking-[0.3em] focus:border-indigo-500 focus:outline-none"
					/>
				</div>
				<div>
					<label htmlFor="nick" className="block text-sm font-medium text-slate-700">
						Nickname
					</label>
					<input
						id="nick"
						required
						value={nickname}
						onChange={(e) => setNickname(e.target.value)}
						placeholder="QuizWhiz"
						maxLength={30}
						className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
					/>
				</div>

				{error && (
					<div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
						{error}
					</div>
				)}

				<button
					disabled={pending}
					className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
				>
					{pending ? "Joining…" : "Join game"}
				</button>
			</form>
		</div>
	);
}

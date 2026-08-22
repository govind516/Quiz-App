"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { publicApi } from "@/lib/api";
import { Button, Eyebrow } from "@/components/ui";

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
		<div className="mx-auto max-w-sm py-10">
			<Eyebrow>Live arena</Eyebrow>
			<h1 className="text-[32px] mt-2 mb-1">Join a game.</h1>
			<p className="text-mutedc text-sm">No account needed — just a nickname.</p>

			<form onSubmit={handleJoin} className="card mt-6">
				<div className="field">
					<label>Room code</label>
					<input
						className="input text-center mono !text-xl !tracking-[0.3em] uppercase"
						required
						value={code}
						onChange={(e) => setCode(e.target.value.toUpperCase())}
						placeholder="ABC123"
						maxLength={6}
					/>
				</div>
				<div className="field">
					<label>Nickname</label>
					<input
						className="input"
						required
						value={nickname}
						onChange={(e) => setNickname(e.target.value)}
						placeholder="QuizWhiz"
						maxLength={30}
					/>
				</div>

				{error && (
					<div className="rounded-lg border border-dangerc/40 bg-dangerdim px-3 py-2 text-sm text-dangerc mb-4">
						{error}
					</div>
				)}

				<Button block type="submit" disabled={pending}>
					{pending ? "Joining…" : "Join game"}
				</Button>
			</form>
		</div>
	);
}

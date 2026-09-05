"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { publicApi } from "@/lib/api";
import { Button, Eyebrow } from "@/components/ui";
import Aurora from "@/components/Aurora";

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
		<main className="form-page-shell">
			<Aurora variant="soft" />
			<div className="form-page-inner !max-w-[430px]">
				<Eyebrow>Live arena</Eyebrow>
				<h1>Join a game.</h1>
				<p>No account needed. Just a nickname and the room code.</p>

			<form onSubmit={handleJoin} className="card mt-8 rounded-[22px] p-8">
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

				<Button block type="submit" disabled={pending} className="!min-h-[48px]">
					{pending ? "Joining…" : "Join game"}
				</Button>
			</form>
			</div>
		</main>
	);
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { LiveRoomInfo, QuizDto } from "@/lib/types";
import { Button, Eyebrow } from "@/components/ui";
import Aurora from "@/components/Aurora";

export default function CreateLiveRoomPage() {
	const router = useRouter();
	const [quizId, setQuizId] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	const quizzesQuery = useQuery({
		queryKey: ["quizzes", "", "", ""],
		queryFn: () => api<QuizDto[]>("/api/quizzes", { auth: false }),
	});

	async function handleCreate() {
		if (!quizId) return;
		setError(null);
		setPending(true);
		try {
			const room = await api<LiveRoomInfo>("/api/live-rooms", {
				method: "POST",
				body: { quizId },
			});
			sessionStorage.setItem(`live.host.${room.code}`, "1");
			router.push(`/live/room/${room.code}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not create the room.");
			setPending(false);
		}
	}

	return (
		<main className="form-page-shell">
			<Aurora variant="soft" />
			<div className="form-page-inner">
				<Eyebrow>Live arena</Eyebrow>
				<h1>Host a live game.</h1>
				<p>
					Create a room, share the code and race friends in real time.
				</p>

			<div className="card mt-8 rounded-[22px] p-8">
				<div className="field">
					<label>Quiz to play</label>
					<select
						className="input"
						value={quizId ?? ""}
						onChange={(e) => setQuizId(Number(e.target.value))}
					>
						<option value="" disabled>
							Choose a quiz…
						</option>
						{(quizzesQuery.data ?? [])
							.filter((q) => q.questionCount > 0)
							.map((q) => (
								<option key={q.id} value={q.id}>
									{q.title} ({q.questionCount} Qs)
								</option>
							))}
					</select>
				</div>

				{error && (
					<div className="rounded-lg border border-dangerc/40 bg-dangerdim px-3 py-2 text-sm text-dangerc mb-4">
						{error}
					</div>
				)}

				<Button block disabled={!quizId || pending} onClick={handleCreate} className="!min-h-[48px]">
					{pending ? "Creating…" : "Create room"}
				</Button>

				<button
					onClick={() => router.push("/live/join")}
					className="btn btn-outline btn-block mt-3"
				>
					Have a code? Join a room →
				</button>
			</div>
			</div>
		</main>
	);
}

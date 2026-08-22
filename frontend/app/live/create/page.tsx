"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { LiveRoomInfo, QuizDto } from "@/lib/types";

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
		<div className="mx-auto max-w-lg">
			<h1 className="text-3xl font-bold tracking-tight text-slate-900">
				Host a live game
			</h1>
			<p className="mt-1 text-slate-500">
				Create a room, share the code and race friends in real time.
			</p>

			<div className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
				<div>
					<label htmlFor="quiz" className="block text-sm font-medium text-slate-700">
						Quiz to play
					</label>
					<select
						id="quiz"
						value={quizId ?? ""}
						onChange={(e) => setQuizId(Number(e.target.value))}
						className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
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
					<div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
						{error}
					</div>
				)}

				<button
					disabled={!quizId || pending}
					onClick={handleCreate}
					className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
				>
					{pending ? "Creating…" : "Create room"}
				</button>

				<button
					onClick={() => router.push("/live/join")}
					className="w-full rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
				>
					Have a code? Join a room →
				</button>
			</div>
		</div>
	);
}

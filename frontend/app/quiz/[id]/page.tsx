"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { QuizDto, StartAttemptResponse } from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";
import { getGuestSessionId, saveStartPayload } from "@/lib/guest-session";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { BookmarkButton } from "@/components/bookmark-button";

export default function QuizDetailPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const user = useAuthStore((s) => s.user);

	const quizQuery = useQuery({
		queryKey: ["quiz", id],
		queryFn: () => api<QuizDto>(`/api/quizzes/${id}`, { auth: false }),
	});

	const startMutation = useMutation({
		mutationFn: () =>
			user
				? api<StartAttemptResponse>(`/api/quizzes/${id}/start`, {
						method: "POST",
						body: {},
					})
				: api<StartAttemptResponse>(`/api/quizzes/${id}/start`, {
						method: "POST",
						body: { guestSessionId: getGuestSessionId() },
						auth: false,
					}),
		onSuccess: (payload) => {
			saveStartPayload(payload);
			router.push(`/take/${payload.attemptId}`);
		},
	});

	if (quizQuery.isPending) {
		return <div className="h-64 animate-pulse rounded-xl bg-surface2 mt-10" />;
	}

	if (quizQuery.isError || !quizQuery.data) {
		return (
			<div className="max-w-2xl mx-auto card p-8 text-center mt-10">
				<h2 className="text-lg font-semibold text-ink">Quiz not found</h2>
				<p className="mt-2 text-sm text-mutedc">
					This quiz may be unpublished or removed.
				</p>
			</div>
		);
	}

	const quiz = quizQuery.data;

	return (
		<div className="mx-auto max-w-2xl py-10">
			<div className="card !p-8">
				<div className="mb-3 flex items-center gap-2">
					<DifficultyBadge level={quiz.difficulty} />
					<span className="badge badge-violet">{quiz.categoryName}</span>
					{quiz.tags.map((t) => (
						<span key={t} className="badge">
							#{t}
						</span>
					))}
					<div className="ml-auto">
						<BookmarkButton quizId={quiz.id} />
					</div>
				</div>

				<h1 className="text-[32px] leading-tight">{quiz.title}</h1>
				{quiz.description && (
					<p className="mt-3 text-mutedc">{quiz.description}</p>
				)}

				<div className="grid grid-cols-3 gap-3 mt-7 text-sm">
					<div className="rounded-lg bg-surface2 border border-line p-3">
						<div className="text-faintc text-xs">Questions</div>
						<div className="mono text-lg font-semibold text-ink mt-0.5">
							{quiz.questionCount}
						</div>
					</div>
					<div className="rounded-lg bg-surface2 border border-line p-3">
						<div className="text-faintc text-xs">Time limit</div>
						<div className="mono text-lg font-semibold text-ink mt-0.5">
							{Math.round(quiz.timeLimitSec / 60)} min
						</div>
					</div>
					<div className="rounded-lg bg-surface2 border border-line p-3">
						<div className="text-faintc text-xs">Mode</div>
						<div className="mono text-lg font-semibold text-ink mt-0.5">
							{user ? "Saved" : "Guest"}
						</div>
					</div>
				</div>

				<p className="mt-4 text-xs text-faintc">
					{user
						? `You are logged in as ${user.name} — your score will be saved to your history.`
						: "You will play as a guest. Sign up after the quiz to save your score."}
				</p>

				{startMutation.isError && (
					<div className="mt-4 rounded-lg border border-dangerc/40 bg-dangerdim px-3 py-2 text-sm text-dangerc">
						Could not start the quiz. Please try again.
					</div>
				)}

				<button
					disabled={quiz.questionCount === 0 || startMutation.isPending}
					onClick={() => startMutation.mutate()}
					className="btn btn-primary btn-block mt-6"
				>
					{startMutation.isPending
						? "Starting…"
						: quiz.questionCount === 0
							? "No questions available yet"
							: "Start quiz"}
				</button>
			</div>
		</div>
	);
}

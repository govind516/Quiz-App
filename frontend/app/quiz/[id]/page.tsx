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
		return <div className="h-64 animate-pulse rounded-xl bg-slate-100" />;
	}

	if (quizQuery.isError || !quizQuery.data) {
		return (
			<div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
				This quiz could not be found.
			</div>
		);
	}

	const quiz = quizQuery.data;

	return (
		<div className="mx-auto max-w-2xl">
			<div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
				<div className="mb-3 flex items-center gap-2">
					<DifficultyBadge level={quiz.difficulty} />
					<span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
						{quiz.categoryName}
					</span>
					<div className="ml-auto">
						<BookmarkButton quizId={quiz.id} />
					</div>
				</div>
				<h1 className="text-3xl font-bold tracking-tight text-slate-900">
					{quiz.title}
				</h1>
				<p className="mt-3 text-slate-600">{quiz.description ?? ""}</p>

				<div className="mt-6 grid grid-cols-2 gap-4 text-sm">
					<div className="rounded-lg bg-slate-50 p-3">
						<div className="text-slate-400">Questions</div>
						<div className="text-lg font-semibold text-slate-800">
							{quiz.questionCount}
						</div>
					</div>
					<div className="rounded-lg bg-slate-50 p-3">
						<div className="text-slate-400">Time limit</div>
						<div className="text-lg font-semibold text-slate-800">
							{Math.round(quiz.timeLimitSec / 60)} min
						</div>
					</div>
				</div>

				<p className="mt-4 text-xs text-slate-500">
					{user
						? `You are logged in as ${user.name} — your score will be saved to your history.`
						: "You will play as a guest. Sign up after the quiz to save your score."}
				</p>

				{startMutation.isError && (
					<div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
						Could not start the quiz. Please try again.
					</div>
				)}

				<button
					disabled={quiz.questionCount === 0 || startMutation.isPending}
					onClick={() => startMutation.mutate()}
					className="mt-6 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{startMutation.isPending
						? "Starting…"
						: quiz.questionCount === 0
							? "No questions available"
							: "Start quiz"}
				</button>
			</div>
		</div>
	);
}

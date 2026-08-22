"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AttemptResultDto, QuizDto, UserStatsDto } from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";

export default function MyProgressPage() {
	const router = useRouter();
	const user = useAuthStore((s) => s.user);

	const hydrated = useAuthStore.persist?.hasHydrated?.() ?? false;

	useEffect(() => {
		if (hydrated && !user) {
			router.replace("/login");
		}
	}, [hydrated, user, router]);

	const statsQuery = useQuery({
		queryKey: ["me", "stats"],
		queryFn: () => api<UserStatsDto>("/api/users/me/stats"),
		enabled: Boolean(user),
	});

	const historyQuery = useQuery({
		queryKey: ["me", "history"],
		queryFn: () => api<AttemptResultDto[]>("/api/users/me/history"),
		enabled: Boolean(user),
	});

	const bookmarksQuery = useQuery({
		queryKey: ["bookmarks"],
		queryFn: () => api<QuizDto[]>("/api/bookmarks"),
		enabled: Boolean(user),
	});

	if (!user || statsQuery.isPending || historyQuery.isPending) {
		return <div className="h-64 animate-pulse rounded-xl bg-slate-100" />;
	}

	const stats = statsQuery.data;
	const history = historyQuery.data ?? [];

	return (
		<div>
			<h1 className="text-3xl font-bold tracking-tight text-slate-900">
				My progress
			</h1>
			<p className="mt-1 text-slate-500">Keep it up, {user.name}!</p>

			{stats && (
				<div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
					<StatCard label="Quizzes played" value={stats.totalAttempts} />
					<StatCard label="Completed" value={stats.completedAttempts} />
					<StatCard label="Average score" value={`${stats.averagePercentage}%`} />
					<StatCard label="Best score" value={`${stats.bestPercentage}%`} />
				</div>
			)}

			<h2 className="mb-4 mt-10 text-lg font-bold text-slate-900">
				Saved quizzes
			</h2>
			{(bookmarksQuery.data?.length ?? 0) === 0 ? (
				<div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
					No saved quizzes yet — tap the ♡ on any quiz to bookmark it.
				</div>
			) : (
				<ul className="space-y-2">
					{(bookmarksQuery.data ?? []).map((quiz) => (
						<li key={quiz.id}>
							<Link
								href={`/quiz/${quiz.id}`}
								className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300"
							>
								<span className="font-medium text-slate-800">{quiz.title}</span>
								<span className="text-xs text-slate-400">
									{quiz.categoryName} · {Math.round(quiz.timeLimitSec / 60)} min
								</span>
							</Link>
						</li>
					))}
				</ul>
			)}

			<h2 className="mb-4 mt-10 text-lg font-bold text-slate-900">
				Quiz history
			</h2>

			{history.length === 0 ? (
				<div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
					No completed quizzes yet.{" "}
					<Link href="/" className="font-medium text-indigo-600 hover:underline">
						Take your first quiz
					</Link>
				</div>
			) : (
				<ul className="space-y-3">
					{history.map((item) => (
						<li key={item.attemptId}>
							<Link
								href={`/result/${item.attemptId}`}
								className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow"
							>
								<div>
									<p className="font-semibold text-slate-800">{item.quizTitle}</p>
									<p className="text-xs text-slate-400">
										{item.completedAt
											? new Date(item.completedAt).toLocaleString()
											: ""}
									</p>
								</div>
								<div className="flex items-center gap-3">
									<span
										className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
											item.percentage >= 60
												? "bg-emerald-50 text-emerald-600"
												: "bg-rose-50 text-rose-500"
										}`}
									>
										{Math.round(item.percentage)}%
									</span>
									<span className="text-sm text-slate-500">
										{item.score}/{item.totalPoints} pts
									</span>
								</div>
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function StatCard({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
			<div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
		</div>
	);
}

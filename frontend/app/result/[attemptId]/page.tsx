"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api, publicApi } from "@/lib/api";
import type { AttemptResultDto, QuestionPublicDto } from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";
import {
	getGuestSessionId,
	loadStartPayload,
} from "@/lib/guest-session";

export default function ResultPage() {
	const { attemptId } = useParams<{ attemptId: string }>();
	const user = useAuthStore((s) => s.user);

	const resultQuery = useQuery({
		queryKey: ["result", attemptId],
		queryFn: () =>
			user
				? api<AttemptResultDto>(`/api/attempts/${attemptId}/result`)
				: publicApi<AttemptResultDto>(
						`/api/attempts/${attemptId}/result?guestSessionId=${getGuestSessionId()}`
					),
		retry: false,
	});

	if (resultQuery.isPending) {
		return <div className="h-64 animate-pulse rounded-xl bg-slate-100" />;
	}

	if (resultQuery.isError || !resultQuery.data) {
		return (
			<div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center">
				<h1 className="text-lg font-semibold text-slate-900">
					Could not load this result
				</h1>
				<p className="mt-2 text-sm text-slate-500">
					The attempt may belong to another session or is still in progress.
				</p>
				<Link
					href="/"
					className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
				>
					Browse quizzes
				</Link>
			</div>
		);
	}

	const result = resultQuery.data;
	const payloadQuestions = new Map<number, QuestionPublicDto>(
		loadStartPayload(attemptId)?.questions.map((q) => [q.questionId, q]) ?? []
	);

	function optionText(questionId: number, optionId: number): string {
		return (
			payloadQuestions
				.get(questionId)
				?.options.find((o) => o.optionId === optionId)?.optionText ??
			`Option #${optionId}`
		);
	}

	const passed = result.percentage >= 60;

	return (
		<div className="mx-auto max-w-3xl">
			{!user && (
				<div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
					<div>
						<p className="font-semibold text-amber-800">
							This score isn&apos;t saved yet.
						</p>
						<p className="text-sm text-amber-700">
							Create a free account to keep your history and appear on
							leaderboards.
						</p>
					</div>
					<Link
						href="/register"
						className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
					>
						Sign up to save your score
					</Link>
				</div>
			)}

			<div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
				<h1 className="text-xl font-semibold text-slate-900">
					{result.quizTitle}
				</h1>

				<div
					className={`mx-auto mt-6 flex h-32 w-32 flex-col items-center justify-center rounded-full border-8 ${
						passed ? "border-emerald-500" : "border-rose-400"
					}`}
				>
					<span className="text-3xl font-bold text-slate-900">
						{Math.round(result.percentage)}%
					</span>
					<span className="text-xs text-slate-400">score</span>
				</div>

				<div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
					<span>
						Status:{" "}
						<span
							className={`font-semibold ${
								result.status === "EXPIRED" ? "text-rose-500" : "text-emerald-600"
							}`}
						>
							{result.status === "EXPIRED" ? "Time expired" : "Submitted"}
						</span>
					</span>
					<span>
						Score:{" "}
						<strong className="text-slate-800">
							{result.score}/{result.totalPoints}
						</strong>{" "}
						points
					</span>
					{result.durationSeconds > 0 && (
						<span>
							Time:{" "}
							<strong className="text-slate-800">
								{Math.floor(result.durationSeconds / 60)}m{" "}
								{result.durationSeconds % 60}s
							</strong>
						</span>
					)}
				</div>
			</div>

			<h2 className="mb-4 mt-10 text-lg font-bold text-slate-900">
				Review ({result.questions.filter((q) => q.correct).length}/
				{result.questions.length} correct)
			</h2>

			<div className="space-y-4">
				{result.questions.map((question, index) => {
					return (
						<div
							key={question.questionId}
							className={`rounded-2xl border bg-white p-6 shadow-sm ${
								question.correct ? "border-emerald-200" : "border-rose-200"
							}`}
						>
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className="text-xs font-medium text-slate-400">
										Question {index + 1} · {question.points} pt
										{question.points === 1 ? "" : "s"}
									</p>
									<h3 className="mt-1 font-semibold text-slate-900">
										{question.questionText}
									</h3>
								</div>
								<span
									className={`flex-none rounded-full px-3 py-1 text-xs font-semibold ${
										question.correct
											? "bg-emerald-50 text-emerald-600"
											: "bg-rose-50 text-rose-500"
									}`}
								>
									{question.correct
										? `+${question.awardedPoints}`
										: "+0"}
								</span>
							</div>

							<div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
								<div className="rounded-lg bg-slate-50 p-3">
									<p className="text-xs font-medium uppercase tracking-wide text-slate-400">
										Your answer
									</p>
									<ul className="mt-1 space-y-0.5 text-slate-700">
										{question.selectedOptionIds.length === 0 && (
											<li className="italic text-slate-400">Not answered</li>
										)}
										{question.selectedOptionIds.map((id) => (
											<li key={id}>
												{optionText(question.questionId, id)}
											</li>
										))}
									</ul>
								</div>
								<div className="rounded-lg bg-emerald-50 p-3">
									<p className="text-xs font-medium uppercase tracking-wide text-emerald-500/70">
										Correct answer
									</p>
									<ul className="mt-1 space-y-0.5 text-emerald-800">
										{question.correctOptionIds.map((id) => (
											<li key={id}>
												{optionText(question.questionId, id)}
											</li>
										))}
									</ul>
								</div>
							</div>

							{question.explanation && (
								<div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 text-sm text-slate-600">
									<span className="font-semibold text-indigo-700">
										Explanation:{" "}
									</span>
									{question.explanation}
								</div>
							)}
						</div>
					);
				})}
			</div>

			<div className="mt-10 mb-4 flex justify-center gap-3">
				<Link
					href="/"
					className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
				>
					Take another quiz
				</Link>
				{user && (
					<Link
						href="/me"
						className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
					>
						View my progress
					</Link>
				)}
			</div>
		</div>
	);
}

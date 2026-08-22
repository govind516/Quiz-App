"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { api } from "@/lib/api";
import type { AttemptResultDto, StartAttemptResponse } from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";
import {
	getGuestSessionId,
	readStartPayloadCached,
} from "@/lib/guest-session";

type AnswerMap = Record<number, number[]>;

const emptySubscribe = () => () => {};

function formatClock(totalSeconds: number): string {
	const m = Math.floor(totalSeconds / 60);
	const s = totalSeconds % 60;
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TakeQuizPage() {
	const { attemptId } = useParams<{ attemptId: string }>();
	const router = useRouter();
	const user = useAuthStore((s) => s.user);

	const payload = useSyncExternalStore(
		emptySubscribe,
		() => readStartPayloadCached(attemptId),
		(): StartAttemptResponse | null => null
	);

	const [current, setCurrent] = useState(0);
	const [answers, setAnswers] = useState<AnswerMap>({});
	const [remainingSec, setRemainingSec] = useState<number | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const submittedRef = useRef(false);
	const answersRef = useRef<AnswerMap>({});
	useEffect(() => {
		answersRef.current = answers;
	}, [answers]);

	useEffect(() => {
		if (!payload) return;
		const tick = () => {
			const remaining = Math.max(
				0,
				Math.floor((new Date(payload.expiresAt).getTime() - Date.now()) / 1000)
			);
			setRemainingSec(remaining);
		};
		tick();
		const interval = setInterval(tick, 1000);
		return () => clearInterval(interval);
	}, [payload]);

	const submit = useCallback(
		async (onDone: () => void, onError: (message: string) => void) => {
			if (!payload || submittedRef.current) return;
			submittedRef.current = true;
			setSubmitting(true);
			try {
				const selectedAnswers = Object.entries(answersRef.current)
					.filter(([, optionIds]) => optionIds.length > 0)
					.map(([questionId, optionIds]) => ({
						questionId: Number(questionId),
						selectedOptionIds: optionIds,
					}));

				await api<AttemptResultDto>(`/api/attempts/${attemptId}/submit`, {
					method: "POST",
					auth: Boolean(user),
					body: {
						guestSessionId: user ? undefined : getGuestSessionId(),
						answers: selectedAnswers,
					},
				});
				onDone();
			} catch (error) {
				submittedRef.current = false;
				setSubmitError(
					error instanceof Error ? error.message : "Failed to submit your quiz."
				);
				onError("");
			} finally {
				setSubmitting(false);
			}
		},
		[attemptId, payload, user]
	);

	useEffect(() => {
		if (remainingSec === 0 && payload && !submittedRef.current) {
			submit(() => router.replace(`/result/${attemptId}`), () => {});
		}
	}, [remainingSec, payload, submit, attemptId, router]);

	if (!payload) {
		return (
			<div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center">
				<h1 className="text-lg font-semibold text-slate-900">
					Quiz session not found
				</h1>
				<p className="mt-2 text-sm text-slate-500">
					This quiz session has expired or was opened in a new tab. Start the
					quiz again to play.
				</p>
				<Link
					href={`/quiz/${attemptId}`}
					className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
				>
					Go back
				</Link>
			</div>
		);
	}

	const questions = payload.questions;
	const question = questions[current];
	const selected = answers[question.questionId] ?? [];
	const answeredCount = Object.values(answers).filter(
		(ids) => ids.length > 0
	).length;

	function chooseOption(optionId: number) {
		setAnswers((prev) => ({
			...prev,
			[question.questionId]:
				question.type === "MULTI_SELECT"
					? prev[question.questionId]?.includes(optionId)
						? prev[question.questionId].filter((id) => id !== optionId)
						: [...(prev[question.questionId] ?? []), optionId]
					: [optionId],
		}));
	}

	const lowTime = (remainingSec ?? 0) <= 30;

	return (
		<div className="mx-auto max-w-2xl">
			<div className="mb-6 flex items-center justify-between gap-4">
				<div>
					<h1 className="text-xl font-bold tracking-tight text-slate-900">
						{payload.quizTitle}
					</h1>
					<p className="text-sm text-slate-500">
						{answeredCount}/{questions.length} answered
					</p>
				</div>
				{remainingSec !== null && (
					<div
						className={`rounded-xl px-4 py-2 font-mono text-lg font-semibold tabular-nums ${
							lowTime
								? "bg-rose-50 text-rose-600"
								: "bg-slate-100 text-slate-700"
						}`}
					>
						{formatClock(remainingSec)}
					</div>
				)}
			</div>

			<div className="mb-6 h-1.5 overflow-hidden rounded-full bg-slate-100">
				<div
					className="h-full rounded-full bg-indigo-600 transition-all"
					style={{
						width: `${questions.length ? ((current + 1) / questions.length) * 100 : 0}%`,
					}}
				/>
			</div>

			<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="mb-4 flex items-center justify-between text-xs">
					<span className="font-medium text-slate-400">
						Question {current + 1} of {questions.length}
					</span>
					<span className="flex items-center gap-2">
						<span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-500">
							{question.type === "MULTI_SELECT"
								? "Select all that apply"
								: question.type === "TRUE_FALSE"
									? "True or False"
									: "Single answer"}
						</span>
						<span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-600">
							{question.points} pt{question.points === 1 ? "" : "s"}
						</span>
					</span>
				</div>

				<h2 className="text-lg font-semibold leading-relaxed text-slate-900">
					{question.questionText}
				</h2>

				<div className="mt-5 space-y-3">
					{question.options.map((option) => {
						const isSelected = selected.includes(option.optionId);
						return (
							<button
								key={option.optionId}
								onClick={() => chooseOption(option.optionId)}
								className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
									isSelected
										? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
										: "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
								}`}
							>
								<span
									className={`flex h-5 w-5 flex-none items-center justify-center border-2 ${
										question.type === "MULTI_SELECT"
											? "rounded-md"
											: "rounded-full"
									} ${isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300"}`}
								>
									{isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
								</span>
								<span className="text-sm text-slate-800">{option.optionText}</span>
							</button>
						);
					})}
				</div>

				{submitError && (
					<div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
						{submitError}
					</div>
				)}

				<div className="mt-6 flex items-center justify-between">
					<button
						disabled={current === 0}
						onClick={() => setCurrent((i) => Math.max(0, i - 1))}
						className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
					>
						← Previous
					</button>

					{current < questions.length - 1 ? (
						<button
							onClick={() => setCurrent((i) => Math.min(questions.length - 1, i + 1))}
							className="rounded-lg bg-slate-800 px-5 py-2 text-sm font-medium text-white hover:bg-slate-900"
						>
							Next →
						</button>
					) : null}
				</div>
			</div>

			<div className="mt-4 flex items-center justify-between">
				<div className="flex gap-1.5">
					{questions.map((q, i) => {
						const isAnswered = (answers[q.questionId] ?? []).length > 0;
						const isCurrent = i === current;
						return (
							<button
								key={q.questionId}
								onClick={() => setCurrent(i)}
								aria-label={`Go to question ${i + 1}`}
								className={`h-2.5 w-2.5 rounded-full transition ${
									isCurrent
										? "scale-125 bg-indigo-600"
										: isAnswered
											? "bg-indigo-300"
											: "bg-slate-300 hover:bg-slate-400"
								}`}
							/>
						);
					})}
				</div>

				<button
					disabled={submitting}
					onClick={() =>
						submit(() => router.replace(`/result/${attemptId}`), () => {})
					}
					className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{submitting ? "Submitting…" : "Submit quiz"}
				</button>
			</div>
		</div>
	);
}

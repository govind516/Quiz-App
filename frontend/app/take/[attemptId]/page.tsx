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
const TIMER_CIRC = 150.8;

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
				Math.floor(
					(new Date(payload.expiresAt).getTime() - Date.now()) / 1000
				)
			);
			setRemainingSec(remaining);
		};
		tick();
		const interval = setInterval(tick, 500);
		return () => clearInterval(interval);
	}, [payload]);

	const submit = useCallback(async () => {
		if (!payload || submittedRef.current || submitting) return;
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
			router.replace(`/result/${attemptId}`);
		} catch (error) {
			submittedRef.current = false;
			setSubmitError(
				error instanceof Error ? error.message : "Failed to submit your quiz."
			);
		} finally {
			setSubmitting(false);
		}
	}, [attemptId, payload, user, router, submitting]);

	useEffect(() => {
		if (remainingSec === 0 && payload && !submittedRef.current) {
			void submit();
		}
	}, [remainingSec, payload, submit]);

	if (!payload) {
		return (
			<div className="quiz-shell">
				<div className="card p-10 text-center">
					<h2 className="text-lg font-semibold text-ink">Quiz session not found</h2>
					<p className="mt-2 text-sm text-mutedc">
						This quiz session expired or was opened in a new tab. Start again to play.
					</p>
					<Link href="/browse" className="btn btn-primary mt-5 inline-flex">
						Browse quizzes
					</Link>
				</div>
			</div>
		);
	}

	const questions = payload.questions;
	const question = questions[current];
	const selected = answers[question.questionId] ?? [];
	const answeredCount = Object.values(answers).filter((ids) => ids.length > 0).length;
	const totalSec = payload.timeLimitSec;
	const fraction =
		remainingSec === null ? 1 : Math.max(0, Math.min(1, remainingSec / totalSec));
	const lowTime = (remainingSec ?? 9999) <= 30;

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

	const marks = ["A", "B", "C", "D", "E", "F"];

	return (
		<div className="quiz-shell">
			<div className="flex items-center justify-between mb-6 flex-wrap gap-4">
				<div className="flex items-center gap-3.5">
					<Link href="/browse" className="text-faintc hover:text-ink transition">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
							<path d="M15 18l-6-6 6-6" />
						</svg>
					</Link>
					<span className="badge badge-violet">{payload.quizTitle}</span>
					<span className="badge hidden sm:inline-flex">
						{answeredCount}/{questions.length} answered
					</span>
				</div>
				<div className="flex items-center gap-4">
					{remainingSec !== null && (
						<>
							<span
								className={`mono text-[13px] ${lowTime ? "text-amberc" : "text-mutedc"}`}
							>
								{formatClock(remainingSec)}
							</span>
							<div className="timer-wrap">
								<svg className="timer-ring" viewBox="0 0 54 54">
									<circle className="timer-ring-bg" cx="27" cy="27" r="24" />
									<circle
										className="timer-ring-fg"
										cx="27"
										cy="27"
										r="24"
										style={{
											strokeDashoffset: TIMER_CIRC * (1 - fraction),
											stroke: lowTime ? "#FFB84D" : "#7B5CFF",
										}}
									/>
								</svg>
								<div className="timer-value" style={{ color: lowTime ? "#FFB84D" : undefined }}>
									{remainingSec >= 60
										? `${Math.ceil(remainingSec / 60)}m`
										: `${remainingSec}s`}
								</div>
							</div>
						</>
					)}
				</div>
			</div>

			<div className="progress-track">
				{questions.map((q, i) => (
					<div
						key={q.questionId}
						className={`progress-seg ${
							i === current ? "current" : (answers[q.questionId] ?? []).length > 0 ? "done" : ""
						}`}
					/>
				))}
			</div>

			<div className="q-card">
				<div className="flex flex-wrap items-center gap-2 mb-4">
					<span className="badge badge-violet">
						{question.type === "MULTI_SELECT"
							? "Select all that apply"
							: question.type === "TRUE_FALSE"
								? "True or False"
								: "Single answer"}
					</span>
					<span className="badge">{question.points} pt</span>
					<span className="mono text-xs text-faintc ml-auto">
						Question {current + 1} / {questions.length}
					</span>
				</div>
				<h3>{question.questionText}</h3>
			</div>

			<div className="options">
				{question.options.map((option, i) => {
					const isSelected = selected.includes(option.optionId);
					return (
						<button
							key={option.optionId}
							onClick={() => chooseOption(option.optionId)}
							className={`option ${isSelected ? "selected" : ""}`}
						>
							<div className="opt-mark">{marks[i]}</div>
							{option.optionText}
						</button>
					);
				})}
			</div>

			{submitError && (
				<div className="mt-4 rounded-lg border border-dangerc/40 bg-dangerdim px-3 py-2 text-sm text-dangerc">
					{submitError}
				</div>
			)}

			<div className="quiz-foot mt-6 justify-between">
				<button
					disabled={current === 0}
					onClick={() => setCurrent((i) => Math.max(0, i - 1))}
					className="btn btn-outline"
				>
					← Previous
				</button>

				<div className="flex gap-2.5 items-center">
					{current < questions.length - 1 ? (
						<button
							onClick={() => setCurrent((i) => i + 1)}
							className="btn btn-outline"
						>
							Next →
						</button>
					) : null}
					<button
						disabled={submitting}
						onClick={() => void submit()}
						className="btn btn-primary"
					>
						{submitting ? "Submitting…" : "Finish & submit"}
					</button>
				</div>
			</div>
		</div>
	);
}

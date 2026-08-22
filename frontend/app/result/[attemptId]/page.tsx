"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, publicApi } from "@/lib/api";
import type { AttemptResultDto, QuestionPublicDto } from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";
import {
	getGuestSessionId,
	loadStartPayload,
} from "@/lib/guest-session";
import { Eyebrow } from "@/components/ui";
import { IconCheck, IconX } from "@/components/icons";

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

	const ringRef = useRef<SVGCircleElement>(null);
	const pctRef = useRef<HTMLDivElement>(null);
	const bigRef = useRef<HTMLDivElement>(null);

	const result = resultQuery.data;

	useEffect(() => {
		if (!result) return;
		const passed = result.percentage >= 60;
		const stroke = passed ? "#35E8B4" : "#FF6B6B";
		const target = Math.min(100, Math.round(result.percentage));

		const timer = setTimeout(() => {
			if (ringRef.current) {
				ringRef.current.style.strokeDashoffset = String(
					502 * (1 - target / 100)
				);
				ringRef.current.style.stroke = stroke;
			}
		}, 150);

		let raf = 0;
		let startTime: number | null = null;
		const step = (ts: number) => {
			if (startTime === null) startTime = ts;
			const progress = Math.min((ts - startTime) / 1200, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			const val = Math.round(eased * target);
			if (bigRef.current)
				bigRef.current.textContent = `${val}%`;
			if (pctRef.current)
				pctRef.current.textContent = `${result.score}/${result.totalPoints} points`;
			if (progress < 1) raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
		return () => {
			clearTimeout(timer);
			cancelAnimationFrame(raf);
		};
	}, [result]);

	if (resultQuery.isPending) {
		return <div className="h-64 animate-pulse rounded-xl bg-surface2 mt-10" />;
	}

	if (resultQuery.isError || !result) {
		return (
			<div className="mx-auto max-w-lg card p-10 text-center mt-10">
				<h2 className="text-lg font-semibold text-ink">
					Could not load this result
				</h2>
				<p className="mt-2 text-sm text-mutedc">
					The attempt may belong to another session or is still in progress.
				</p>
				<Link href="/browse" className="btn btn-primary mt-5 inline-flex">
					Browse quizzes
				</Link>
			</div>
		);
	}

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

	const correctCount = result.questions.filter((q) => q.correct).length;
	const passed = result.percentage >= 60;

	return (
		<div className="quiz-shell">
			<div className="text-center pt-4">
				<Eyebrow>Quiz complete</Eyebrow>
				<h2 className="text-[28px] mt-3">{result.quizTitle}</h2>
				<p className="text-mutedc text-sm mb-2">Here&apos;s how you did.</p>

				{result.status === "EXPIRED" && (
					<div className="inline-block badge badge-danger mt-2">
						Time expired — auto-submitted
					</div>
				)}

				<div className="score-ring-wrap">
					<svg className="score-ring" viewBox="0 0 180 180">
						<circle className="score-ring-bg" cx="90" cy="90" r="80" />
						<circle ref={ringRef} className="score-ring-fg" cx="90" cy="90" r="80" />
					</svg>
					<div className="score-ring-label">
						<div ref={bigRef} className="big mono">
							0%
						</div>
						<div ref={pctRef} className="text-xs text-faintc mt-1"></div>
					</div>
				</div>

				<div className="breakdown">
					{result.questions.map((q, i) => (
						<div key={q.questionId} className={`bd-dot ${q.correct ? "ok" : "bad"}`}>
							{i + 1}
						</div>
					))}
				</div>

				<p className="mono text-sm text-mutedc mb-8">
					{correctCount}/{result.questions.length} correct ·{" "}
					{Math.floor(result.durationSeconds / 60)}m {result.durationSeconds % 60}s
				</p>

				<div className="flex gap-3 justify-center flex-wrap">
					<Link href="/browse" className="btn btn-outline">
						Try another quiz
					</Link>
					{user ? (
						<Link href="/me" className="btn btn-primary">
							View my progress
						</Link>
					) : (
						<Link href="/auth?mode=signup" className="btn btn-primary">
							Save this score — sign up
						</Link>
					)}
				</div>
			</div>

			<div className="mt-14">
				<Eyebrow>Review</Eyebrow>
				<h3 className="text-xl mt-2 mb-5">
					{passed ? "Solid work." : "Learn from these."}
				</h3>

				<div className="space-y-4">
					{result.questions.map((question, index) => (
						<div
							key={question.questionId}
							className={`card !p-6 ${
								question.correct ? "!border-mint/40" : "!border-dangerc/40"
							}`}
						>
							<div className="flex items-start justify-between gap-3">
								<div>
									<div className="flex flex-wrap items-center gap-2 mb-2">
										<span className={`badge ${question.correct ? "badge-mint" : "badge-danger"}`}>
											Q{index + 1}
										</span>
										<span className="badge">{question.points} pt</span>
									</div>
									<h4 className="font-semibold text-ink leading-relaxed">
										{question.questionText}
									</h4>
								</div>
								<span className={`opt-mark !w-7 !h-7 ${question.correct ? "!bg-mint !border-mint !text-[#08130F]" : "!bg-dangerc !border-dangerc !text-[#1A0808]"}`}>
									{question.correct ? <IconCheck size={13} /> : <IconX size={13} />}
								</span>
							</div>

							<div className="grid gap-2 text-sm sm:grid-cols-2 mt-4">
								<div className="rounded-lg bg-surface2 p-3 border border-line">
									<p className="text-[11px] uppercase tracking-wide text-faintc mb-1">
										Your answer
									</p>
									<ul className="space-y-0.5 text-mutedc">
										{question.selectedOptionIds.length === 0 && (
											<li className="italic">Not answered</li>
										)}
										{question.selectedOptionIds.map((id) => (
											<li
												key={id}
												className={
													question.correctOptionIds.includes(id) ? "text-mint" : "text-dangerc"
												}
											>
												{optionText(question.questionId, id)}
											</li>
										))}
									</ul>
								</div>
								<div className="rounded-lg bg-mintdim/60 p-3 border border-mint/20">
									<p className="text-[11px] uppercase tracking-wide text-mint/70 mb-1">
										Correct answer
									</p>
									<ul className="space-y-0.5 text-mint">
										{question.correctOptionIds.map((id) => (
											<li key={id}>{optionText(question.questionId, id)}</li>
										))}
									</ul>
								</div>
							</div>

							{question.explanation && (
								<div className="explain-inner mt-4 !border-l-violet">
									<span className="text-violet font-semibold">Explanation: </span>
									{question.explanation}
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

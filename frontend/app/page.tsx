"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CategoryDto, QuizDto } from "@/lib/types";
import { IconArrowRight, IconHexLogo, IconQuestion, IconTag } from "@/components/icons";

function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const el = ref.current;
		if (!el || value <= 0) return;
		let raf = 0;
		let startTime: number | null = null;
		const duration = 1200;
		const step = (ts: number) => {
			if (startTime === null) startTime = ts;
			const progress = Math.min((ts - startTime) / duration, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			el.textContent =
				Math.floor(eased * value).toLocaleString() + suffix;
			if (progress < 1) raf = requestAnimationFrame(step);
			else el.textContent = value.toLocaleString() + suffix;
		};
		raf = requestAnimationFrame(step);
		return () => cancelAnimationFrame(raf);
	}, [value, suffix]);
	return (
		<div className="num" ref={ref}>
			0
		</div>
	);
}

function Constellation() {
	return (
		<div className="relative hidden lg:block h-[420px]">
			<svg className="constellation w-full h-full" viewBox="0 0 480 420">
				<line x1="60" y1="80" x2="220" y2="150" stroke="rgba(123,92,255,.25)" strokeWidth="1.5" />
				<line x1="220" y1="150" x2="380" y2="90" stroke="rgba(123,92,255,.25)" strokeWidth="1.5" />
				<line x1="220" y1="150" x2="160" y2="300" stroke="rgba(53,232,180,.2)" strokeWidth="1.5" />
				<line x1="160" y1="300" x2="340" y2="330" stroke="rgba(123,92,255,.2)" strokeWidth="1.5" />
				<line x1="380" y1="90" x2="340" y2="330" stroke="rgba(123,92,255,.15)" strokeWidth="1.5" />
				<circle className="node" cx="60" cy="80" r="4" fill="#7B5CFF" />
				<circle className="node" cx="220" cy="150" r="4" fill="#35E8B4" />
				<circle className="node" cx="380" cy="90" r="4" fill="#7B5CFF" />
				<circle className="node" cx="160" cy="300" r="4" fill="#FFB84D" />
				<circle className="node" cx="340" cy="330" r="4" fill="#7B5CFF" />
				<polygon
					points="220,120 245,135 245,165 220,180 195,165 195,135"
					fill="none"
					stroke="#7B5CFF"
					strokeWidth="1.5"
					opacity=".5"
				/>
			</svg>
			<div className="float-card">
				<div className="flex items-center justify-between mb-2">
					<span className="badge badge-violet">JavaScript</span>
					<span className="text-faintc"><IconQuestion size={14} /></span>
				</div>
				<div className="text-[13px] font-semibold text-ink mb-1">
					typeof NaN === ?
				</div>
				<div className="code-line">→ &apos;number&apos;</div>
			</div>
		</div>
	);
}

export default function LandingPage() {
	const categoriesQuery = useQuery({
		queryKey: ["categories"],
		queryFn: () => api<CategoryDto[]>("/api/categories", { auth: false }),
	});
	const quizzesQuery = useQuery({
		queryKey: ["quizzes", "", "", ""],
		queryFn: () => api<QuizDto[]>("/api/quizzes", { auth: false }),
	});

	const categories = categoriesQuery.data ?? [];
	const quizzes = quizzesQuery.data ?? [];
	const totalQuestions = quizzes.reduce((sum, q) => sum + q.questionCount, 0);

	function trackCount(slug: string): string {
		const n = quizzes.filter((q) => q.categorySlug === slug).length;
		return `${n} quiz${n === 1 ? "" : "zes"}`;
	}

	return (
		<div>
			<div className="hero">
				<div>
					<span className="eyebrow">
						<IconHexLogo size={14} />
						IT TOPICS · NO SIGNUP REQUIRED
					</span>
					<h1>
						Prove your
						<br />
						<span className="accent">stack.</span>
					</h1>
					<p className="lead">
						Sharpen JavaScript, Python, networking, SQL and system design with
						quizzes built for interview prep — not trivia night.
					</p>
					<div className="hero-ctas">
						<Link href="/browse" className="btn btn-primary">
							Start a quiz — guest mode <IconArrowRight size={14} />
						</Link>
						<Link href="/leaderboard" className="btn btn-ghost">
							See the leaderboard
						</Link>
					</div>
					<div className="hero-stats">
						<div className="hero-stat">
							<CountUp value={categories.length} />
							<div className="lbl">categories</div>
						</div>
						<div className="hero-stat">
							<CountUp value={totalQuestions} />
							<div className="lbl">questions</div>
						</div>
						<div className="hero-stat">
							<CountUp value={quizzes.length} />
							<div className="lbl">live quizzes</div>
						</div>
					</div>
				</div>
				<Constellation />
			</div>

			<div className="section-head">
				<div>
					<span className="eyebrow">Pick a track</span>
					<h2>Practice what you&apos;ll actually be asked.</h2>
				</div>
			</div>
			<div className="tracks !pb-16">
				{categoriesQuery.isPending
					? Array.from({ length: 8 }).map((_, i) => (
							<div key={i} className="h-[76px] rounded-xl bg-surface2 animate-pulse" />
						))
					: categories.map((c) => (
							<Link key={c.id} href={`/browse?category=${c.slug}`} className="chip">
								<div className="hex">
									<IconTag size={18} />
								</div>
								<div>
									<div className="ct-name">{c.name}</div>
									<div className="ct-sub">{trackCount(c.slug)}</div>
								</div>
							</Link>
						))}
			</div>

			{quizzes.length > 0 && (
				<>
					<div className="section-head !mb-6">
						<div>
							<span className="eyebrow">Fresh questions</span>
							<h2>Live right now.</h2>
						</div>
						<Link href="/browse" className="btn btn-outline btn-sm">
							Browse all
						</Link>
					</div>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-20 -mt-8">
						{quizzes.slice(0, 3).map((quiz, i) => (
							<Link
								key={quiz.id}
								href={`/quiz/${quiz.id}`}
								className="card card-hover fade-up"
								style={{ animationDelay: `${i * 0.08}s` }}
							>
								<div className="mb-3 flex items-center gap-2">
									<span className="badge badge-violet">{quiz.categoryName}</span>
									<span className="badge">{quiz.difficulty.charAt(0) + quiz.difficulty.slice(1).toLowerCase()}</span>
								</div>
								<h3 className="text-lg font-semibold text-ink">{quiz.title}</h3>
								<p className="mt-1 text-sm text-mutedc line-clamp-2 min-h-10">
									{quiz.description ?? "Test your knowledge."}
								</p>
								<div className="mt-4 text-xs text-faintc mono">
									{quiz.questionCount} questions · {Math.round(quiz.timeLimitSec / 60)} min
								</div>
							</Link>
						))}
					</div>
				</>
			)}
		</div>
	);
}

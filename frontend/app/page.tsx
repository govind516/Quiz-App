"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CategoryDto, QuizDto, UserStatsDto } from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";
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
  const demos = [
    { cat: "JavaScript", q: "typeof NaN === ?", a: "→ 'number'" },
    { cat: "Python", q: "len([1,2,3]) == ?", a: "→ 3" },
    { cat: "SQL", q: "SELECT * WHERE id = ?", a: "→ indexed lookup" },
  ];
  const idx = useRef(0);
  const [demo, setDemo] = useState(demos[0]);
  useEffect(() => {
    const id = setInterval(() => {
      idx.current = (idx.current + 1) % demos.length;
      setDemo(demos[idx.current]);
    }, 3200);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="relative hidden lg:block h-[420px]">
      <svg className="constellation w-full h-full" viewBox="0 0 480 420">
        <line x1="60" y1="80" x2="220" y2="150" stroke="rgba(106,92,245,.2)" strokeWidth="1.5" />
        <line x1="220" y1="150" x2="380" y2="90" stroke="rgba(106,92,245,.2)" strokeWidth="1.5" />
        <line x1="220" y1="150" x2="160" y2="300" stroke="rgba(199,240,101,.18)" strokeWidth="1.5" />
        <line x1="160" y1="300" x2="340" y2="330" stroke="rgba(106,92,245,.15)" strokeWidth="1.5" />
        <line x1="380" y1="90" x2="340" y2="330" stroke="rgba(106,92,245,.12)" strokeWidth="1.5" />
        <circle className="node" cx="60" cy="80" r="4" fill="#6a5cf5" />
        <circle className="node" cx="220" cy="150" r="4" fill="#c7f065" />
        <circle className="node" cx="380" cy="90" r="4" fill="#6a5cf5" />
        <circle className="node" cx="160" cy="300" r="4" fill="#e8a94d" />
        <circle className="node" cx="340" cy="330" r="4" fill="#6a5cf5" />
        <polygon points="220,120 245,135 245,165 220,180 195,165 195,135" fill="none" stroke="#6a5cf5" strokeWidth="1.5" opacity=".45" />
      </svg>
      <div className="float-card">
        <div className="flex items-center justify-between mb-2">
          <span className="badge badge-violet" style={{ fontFamily: "var(--font-apple), sans-serif" }}>{demo.cat}</span>
          <span className="text-faintc"><IconQuestion size={14} /></span>
        </div>
        <div className="text-[13px] font-semibold text-ink mb-1" style={{ fontFamily: "var(--font-space), sans-serif" }}>{demo.q}</div>
        <div className="code-line">{demo.a}</div>
        <div className="mt-3 flex gap-1.5 border-t border-line pt-3">
          <span className="mono text-[10px] text-faintc">[A] [B] [C] [D]</span>
        </div>
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

	const emptySubscribe = () => () => {};
	const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
	const user = useAuthStore((s) => s.user);
	const statsQuery = useQuery({
		queryKey: ["me", "stats"],
		queryFn: () => api<UserStatsDto>("/api/users/me/stats"),
		enabled: Boolean(user),
	});

	function trackCount(slug: string): string {
		const n = quizzes.filter((q) => q.categorySlug === slug).length;
		return `${n} quiz${n === 1 ? "" : "zes"}`;
	}

	const firstName = user?.name.split(" ")[0] ?? "";
	const stats = statsQuery.data;
	const recommended = quizzes[0];

	return (
		<div>
			<div className="hero">
				<div>
					{mounted && user ? (
						<>
							<span className="eyebrow">Welcome back</span>
							<h1>Welcome back, <br /><span className="accent">{firstName}.</span></h1>
							<p className="lead">You&apos;re on a {stats?.currentStreak ?? 0}-day streak — keep shipping.</p>
							<div className="hero-ctas">
								<Link href={recommended ? `/quiz/${recommended.id}` : "/browse"} className="btn btn-primary btn-cta" style={{ borderRadius: 999 }}>
									{recommended ? `Start: ${recommended.title.slice(0, 28)}` : "Start a quiz"} <IconArrowRight size={14} />
								</Link>
								<Link href="/leaderboard" className="btn btn-ghost" style={{ height: 44, borderRadius: 999 }}>
									See the leaderboard
								</Link>
							</div>
							<div className="hero-stats">
								<div className="hero-stat">
									<div className="num" style={{ fontFamily: "var(--font-mono), monospace" }}>{stats ? `${stats.currentStreak}d` : "—"}</div>
									<div className="lbl" style={{ fontFamily: "var(--font-apple), sans-serif" }}>streak</div>
								</div>
								<div className="hero-stat">
									<div className="num" style={{ fontFamily: "var(--font-mono), monospace" }}>{stats ? stats.completedAttempts : "—"}</div>
									<div className="lbl" style={{ fontFamily: "var(--font-apple), sans-serif" }}>completed</div>
								</div>
								<div className="hero-stat">
									<div className="num" style={{ fontFamily: "var(--font-mono), monospace" }}>{stats ? `${Math.round(stats.averagePercentage)}%` : "—"}</div>
									<div className="lbl" style={{ fontFamily: "var(--font-apple), sans-serif" }}>average</div>
								</div>
							</div>
						</>
					) : (
						<>
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
								<Link href="/browse" className="btn btn-primary btn-cta" style={{ borderRadius: 999 }}>
									Start a quiz — guest mode <IconArrowRight size={14} />
								</Link>
								<Link href="/leaderboard" className="btn btn-ghost" style={{ height: 44, borderRadius: 999 }}>
									See the leaderboard
								</Link>
							</div>
							<div className="hero-stats">
								<div className="hero-stat">
									<CountUp value={categories.length} />
									<div className="lbl" style={{ fontFamily: "var(--font-apple), sans-serif" }}>categories</div>
								</div>
								<div className="hero-stat">
									<CountUp value={totalQuestions} />
									<div className="lbl" style={{ fontFamily: "var(--font-apple), sans-serif" }}>questions</div>
								</div>
								<div className="hero-stat">
									<CountUp value={quizzes.length} />
									<div className="lbl" style={{ fontFamily: "var(--font-apple), sans-serif" }}>live quizzes</div>
								</div>
							</div>
						</>
					)}
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
					: categories.map((c, i) => (
							<Link key={c.id} href={`/browse?category=${c.slug}`} className="chip fade-up" style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}>
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
					<div className="section-head mb-8">
						<div>
							<span className="eyebrow">Fresh questions</span>
							<h2>Live right now.</h2>
						</div>
						<Link href="/browse" className="btn btn-outline btn-sm">
							Browse all
						</Link>
					</div>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-20">
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
								<h3 className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-space), sans-serif" }}>{quiz.title.replace(/\s—\s(BEGINNER|INTERMEDIATE|ADVANCED)\s*$/i, "")}</h3>
								<p className="mt-1 text-sm line-clamp-2 min-h-10" style={{ color: "#b8b6c4", fontFamily: "var(--font-jakarta), sans-serif" }}>
									{quiz.description ?? "Test your knowledge."}
								</p>
								<div className="mt-4 text-xs mono" style={{ color: "var(--color-tertiary)" }}>
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

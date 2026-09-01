"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
	AttemptResultDto,
	BadgeDto,
	CategoryProgressDto,
	CertificateDto,
	QuizDto,
	UserStatsDto,
} from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";
import { Button, CountUp, Eyebrow } from "@/components/ui";
import { IconCheck, IconLock } from "@/components/icons";

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function nextMilestone(stats: UserStatsDto | undefined): {
	title: string;
	sub: string;
	cur: number;
	target: number;
} | null {
	if (!stats) return null;
	const completed = stats.completedAttempts;
	const streak = Math.max(stats.currentStreak, stats.bestStreak);
	if (completed < 1)
		return { title: "First Steps", sub: "Complete your first quiz", cur: 0, target: 1 };
	if (streak < 3)
		return { title: "Consistent", sub: "Reach a 3-day answering streak", cur: streak, target: 3 };
	if (streak < 7)
		return { title: "On Fire", sub: "Reach a 7-day answering streak", cur: streak, target: 7 };
	if (completed < 10)
		return { title: "Quiz Machine", sub: "Complete 10 quizzes", cur: completed, target: 10 };
	if (!(completed >= 5 && stats.averagePercentage >= 75))
		return {
			title: "Sharp Shooter",
			sub: "Average 75%+ across 5+ quizzes",
			cur: Math.min(Math.round((stats.averagePercentage / 75) * completed), 5),
			target: 5,
		};
	return null;
}

function fireParticles(el: HTMLElement) {
	const colors = ["#7B5CFF", "#35E8B4", "#FFB84D"];
	const rect = el.getBoundingClientRect();
	for (let i = 0; i < 14; i++) {
		const p = document.createElement("div");
		p.className = "particle";
		const angle = Math.random() * Math.PI * 2;
		const dist = 40 + Math.random() * 50;
		p.style.setProperty("--px", `${Math.cos(angle) * dist}px`);
		p.style.setProperty("--py", `${Math.sin(angle) * dist}px`);
		p.style.background = colors[i % colors.length];
		p.style.left = `${rect.left + rect.width / 2}px`;
		p.style.top = `${rect.top + rect.height / 2}px`;
		document.body.appendChild(p);
		setTimeout(() => p.remove(), 850);
	}
}

export default function MyProgressPage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const user = useAuthStore((s) => s.user);
	const hydrated = useAuthStore.persist?.hasHydrated?.() ?? false;

	useEffect(() => {
		if (hydrated && !user) {
			router.replace("/auth");
		}
	}, [hydrated, user, router]);

	const enabled = Boolean(user);

	const statsQuery = useQuery({
		queryKey: ["me", "stats"],
		queryFn: () => api<UserStatsDto>("/api/users/me/stats"),
		enabled,
	});
	const historyQuery = useQuery({
		queryKey: ["me", "history"],
		queryFn: () => api<AttemptResultDto[]>("/api/users/me/history"),
		enabled,
	});
	const bookmarksQuery = useQuery({
		queryKey: ["bookmarks"],
		queryFn: () => api<QuizDto[]>("/api/bookmarks"),
		enabled,
	});
	const badgesQuery = useQuery({
		queryKey: ["me", "badges"],
		queryFn: () => api<BadgeDto[]>("/api/users/me/badges"),
		enabled,
	});
	const certProgressQuery = useQuery({
		queryKey: ["me", "certificates", "progress"],
		queryFn: () => api<CategoryProgressDto[]>("/api/certificates/categories"),
		enabled,
	});
	const myCertsQuery = useQuery({
		queryKey: ["me", "certificates"],
		queryFn: () => api<CertificateDto[]>("/api/certificates/mine"),
		enabled,
	});

	const claimMutation = useMutation({
		mutationFn: (categoryId: number) =>
			api<CertificateDto>(`/api/certificates/claim/${categoryId}`, {
				method: "POST",
			}),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["me", "certificates"] });
			void queryClient.invalidateQueries({
				queryKey: ["me", "certificates", "progress"],
			});
		},
	});

	const stats = statsQuery.data;
	const milestone = useMemo(() => nextMilestone(stats), [stats]);

	const barRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const el = barRef.current;
		if (!el || !milestone) return;
		el.style.width = "0%";
		const timer = setTimeout(() => {
			if (barRef.current) {
				barRef.current.style.width = `${Math.min(
					100,
					(milestone.cur / milestone.target) * 100
				)}%`;
			}
		}, 200);
		return () => clearTimeout(timer);
	}, [milestone]);

	if (!hydrated || !user || statsQuery.isPending || historyQuery.isPending) {
		return <div className="h-64 animate-pulse rounded-xl bg-surface2 mt-10" />;
	}

	const history = historyQuery.data ?? [];

	function lockedCaption(badge: BadgeDto): string {
		if (!stats) return badge.description;
		const streak = Math.max(stats.currentStreak, stats.bestStreak);
		switch (badge.code) {
			case "CONSISTENT":
				return `${Math.max(0, 3 - streak)} day${3 - streak === 1 ? "" : "s"} to go`;
			case "ON_FIRE":
				return `${Math.max(0, 7 - streak)} days to go`;
			case "QUIZ_MACHINE":
				return `${Math.max(0, 10 - stats.completedAttempts)} more quiz${10 - stats.completedAttempts === 1 ? "" : "zes"}`;
			case "FIRST_STEPS":
				return "Complete your first quiz";
			case "PERFECT_SCORE":
				return "Score 100% on any quiz";
			default:
				return badge.description;
		}
	}

	const activeDates = new Set(
		history
			.filter((h) => h.completedAt)
			.map((h) => new Date(h.completedAt as string).toDateString())
	);
	const week = Array.from({ length: 7 }, (_, i) => {
		const d = new Date();
		d.setDate(d.getDate() - (6 - i));
		return d;
	});
	const todayIdx = 6;

	return (
		<div className="py-10">
			<Eyebrow>Your progress</Eyebrow>
			<h1 className="text-[34px] mt-2">Hey, {user.name.split(" ")[0]}.</h1>

			{stats && (
				<>
					<div className="flex items-center gap-6 mt-8 mb-10">
						<div className="hex" style={{ background: "var(--color-amberdim)", color: "var(--color-amberc)", width: 52, height: 46 }}>
							<svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
								<path d="M12 3c-1.5 2.5-4 4.2-4 7.5a4 4 0 008 0C16 7.2 13.5 5.5 12 3z" />
								<path d="M9.5 13.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5" />
							</svg>
						</div>
						<div>
							<div className="streak-num">
								<CountUp value={stats.currentStreak} />-day streak
							</div>
							<div className="streak-longest">
								Longest streak: {stats.bestStreak} day
								{stats.bestStreak === 1 ? "" : "s"} · Don&apos;t break the chain.
							</div>
						</div>
						<div className="hidden sm:flex gap-8 ml-auto">
							<div className="hero-stat">
								<div className="num">{stats.completedAttempts}</div>
								<div className="lbl">quizzes passed</div>
							</div>
							<div className="hero-stat">
								<div className="num">{Math.round(stats.averagePercentage)}%</div>
								<div className="lbl">average score</div>
							</div>
							<div className="hero-stat">
								<div className="num">{stats.totalPointsEarned}</div>
								<div className="lbl">points earned</div>
							</div>
						</div>
					</div>

					<div className="week-strip flex-wrap !gap-4 sm:!gap-6">
						{week.map((day, i) => {
							const done = activeDates.has(day.toDateString());
							const isToday = i === todayIdx;
							return (
								<div key={i} className="day-cell">
									<div
										className={`hex day-hex ${done ? "done" : ""} ${isToday && !done ? "today" : ""}`}
									>
										{done ? (
											<IconCheck size={14} />
										) : isToday ? (
											<span className="mono text-[11px]">Now</span>
										) : null}
									</div>
								<div className="day-lbl">{DAY_LABELS[day.getDay()]}</div>
								</div>
							);
						})}
					</div>
				</>
			)}

			<Eyebrow>Milestones</Eyebrow>
			<div className="badges-row mt-3">
				{(badgesQuery.data ?? []).map((badge) => (
					<div
						key={badge.code}
						className={`milestone ${badge.earned ? "unlocked cursor-pointer" : "locked"}`}
						onClick={(e) => {
							if (badge.earned) fireParticles(e.currentTarget);
							else {
								const el = e.currentTarget;
								el.classList.remove("shake");
								void el.offsetWidth;
								el.classList.add("shake");
							}
						}}
					>
						<div className="hex">
							{badge.earned ? <IconCheck size={20} /> : <IconLock size={20} />}
						</div>
						<div className="m-title">{badge.name}</div>
						<div className="m-desc">
							{badge.earned ? badge.description : lockedCaption(badge)}
						</div>
					</div>
				))}
			</div>

			{milestone && (
				<div className="card flex items-center justify-between gap-6 flex-wrap mb-12">
					<div>
						<div className="font-semibold text-sm text-ink mb-1">
							Next milestone: {milestone.title}
						</div>
						<div className="text-xs text-faintc">{milestone.sub}</div>
					</div>
					<div className="mv-bar-track">
						<div ref={barRef} className="mv-bar-fill" />
					</div>
					<div className="mono text-[13px]">
						{Math.min(milestone.cur, milestone.target)}/{milestone.target}
					</div>
				</div>
			)}

			<Eyebrow>Certificates</Eyebrow>
			{(myCertsQuery.data ?? []).length > 0 && (
				<ul className="mt-4 mb-4 space-y-2">
					{(myCertsQuery.data ?? []).map((cert) => (
						<li key={cert.code}>
							<Link
								href={`/certificate/${cert.code}`}
								className="flex items-center justify-between rounded-xl border border-violet/30 bg-violetdim p-4 transition hover:border-violet"
							>
								<span className="font-semibold text-ink">
									🎓 {cert.categoryName} series
								</span>
								<span className="mono text-xs text-faintc">{cert.code}</span>
							</Link>
						</li>
					))}
				</ul>
			)}
			<ul className="space-y-2 mb-14">
				{(certProgressQuery.data ?? []).map((progress) => (
					<li
						key={progress.categoryId}
						className="card flex items-center justify-between gap-4 flex-wrap"
					>
						<div>
							<p className="font-medium text-ink text-sm">{progress.categoryName}</p>
							<div className="mv-bar-track mt-2 !max-w-none w-44">
								{(() => {
									const pct = progress.totalQuizzes ? (progress.completedQuizzes / progress.totalQuizzes) * 100 : 0;
									const bg = pct >= 70 ? "var(--color-mint)" : pct >= 50 ? "var(--color-amberc)" : "var(--color-dangerc)";
									return (
										<div
											className="mv-bar-fill"
											style={{ width: `${pct}%`, background: bg }}
										/>
									);
								})()}
							</div>
							<p className="mt-1.5 mono text-[11px] text-faintc">
								{progress.completedQuizzes}/{progress.totalQuizzes} quizzes at 60%+
							</p>
						</div>
						{progress.eligible ? (
							<Button
								size="sm"
								disabled={claimMutation.isPending}
								onClick={() => claimMutation.mutate(progress.categoryId)}
							>
								Claim 🎓
							</Button>
						) : (
							<span className="badge">In progress</span>
						)}
					</li>
				))}
			</ul>

			<Eyebrow>Saved quizzes</Eyebrow>
			{(bookmarksQuery.data?.length ?? 0) === 0 ? (
				<div className="card mt-4 mb-14 p-6 text-center text-sm text-mutedc">
					No saved quizzes yet — tap the ♡ on any quiz to bookmark it.
				</div>
			) : (
				<ul className="mt-4 space-y-2 mb-14">
					{(bookmarksQuery.data ?? []).map((quiz) => (
						<li key={quiz.id}>
							<Link
								href={`/quiz/${quiz.id}`}
								className="card card-hover flex items-center justify-between gap-4"
							>
								<span className="font-medium text-ink text-sm">{quiz.title}</span>
								<span className="mono text-xs text-faintc">
									{quiz.categoryName} · {Math.round(quiz.timeLimitSec / 60)} min
								</span>
							</Link>
						</li>
					))}
				</ul>
			)}

			<Eyebrow>Quiz history</Eyebrow>
			{history.length === 0 ? (
				<div className="card mt-4 p-10 text-center text-sm text-mutedc">
					No completed quizzes yet.{" "}
					<Link href="/browse" className="text-violet hover:underline">
						Take your first quiz
					</Link>
				</div>
			) : (
				<ul className="mt-4 space-y-3">
					{history.map((item) => (
						<li key={item.attemptId}>
							<Link
								href={`/result/${item.attemptId}`}
								className="lb-row !grid-cols-[1fr_auto] items-center !py-4 rounded-xl border border-line bg-surface hover:bg-surface2 transition"
							>
								<div>
									<div className="handle font-semibold text-ink text-sm">
										{item.quizTitle}
									</div>
									<div className="cat text-xs text-faintc">
										{item.completedAt
											? new Date(item.completedAt).toLocaleString()
											: ""}
									</div>
								</div>
								<div className="flex items-center gap-3">
									<span
										className={`badge ${
											item.percentage >= 60 ? "badge-mint" : "badge-danger"
										}`}
									>
										{Math.round(item.percentage)}%
									</span>
									<span className="row-score">
										{item.score}/{item.totalPoints}
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

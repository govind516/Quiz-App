"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
	CategoryDto,
	LeaderboardEntryDto,
} from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";
import { Eyebrow, initials } from "@/components/ui";
import { IconTrophy } from "@/components/icons";
import { Select } from "@/components/select";

interface RankedEntry {
	entry: LeaderboardEntryDto;
	displayRank: number;
	shared: boolean;
}

function withSharedRanks(entries: LeaderboardEntryDto[]): RankedEntry[] {
	let prevScore: number | null = null;
	let prevRank = 0;
	return entries.map((entry, i) => {
		const shared = prevScore !== null && entry.score === prevScore;
		const displayRank = shared ? prevRank : i + 1;
		prevScore = entry.score;
		prevRank = displayRank;
		return { entry, displayRank, shared };
	});
}

function PodCard({ slot }: { slot: RankedEntry | null }) {
	if (!slot) {
		return (
			<div className="pod-card !border-dashed flex flex-col items-center justify-center min-h-[170px]" style={{ borderColor: "var(--color-line)" }}>
				<div className="pod-avatar !bg-transparent" style={{ color: "var(--color-faintc)", fontFamily: "var(--font-apple), sans-serif" }}>?</div>
				<div className="pod-handle" style={{ color: "var(--color-faintc)", fontFamily: "var(--font-apple), sans-serif" }}>Your name here</div>
				<div className="pod-score" style={{ color: "var(--color-faintc)" }}>— pts</div>
			</div>
		);
	}
	const isFirst = slot.displayRank === 1;
	const isSecond = slot.displayRank === 2;
	const isThird = slot.displayRank === 3;
	const tierStyle: React.CSSProperties = isSecond
		? { borderColor: "rgba(255, 255, 255, 0.11)" }
		: isThird
		? { borderColor: "rgba(255, 255, 255, 0.06)" }
		: isFirst
		? { borderColor: "var(--color-violet)" }
		: {};
	const avatarTierStyle: React.CSSProperties = isSecond
		? { borderColor: "rgba(255, 255, 255, 0.11)" }
		: isThird
		? { borderColor: "rgba(255, 255, 255, 0.06)" }
		: isFirst
		? { borderColor: "var(--color-violet)" }
		: {};
	return (
		<div className={`pod-card ${isFirst ? "rank1" : ""}`} style={tierStyle}>
			{isFirst && (
				<div className="mb-1.5 flex justify-center" style={{ color: "var(--color-amber)" }}>
					<IconTrophy size={20} />
				</div>
			)}
			<div className="pod-rank-badge" style={{ fontFamily: "var(--font-mono), monospace" }}>
				#{slot.displayRank}
				{slot.shared ? " (tie)" : ""}
			</div>
			<div className="pod-avatar" style={{ fontFamily: "var(--font-apple), sans-serif", ...avatarTierStyle }}>{initials(slot.entry.name)}</div>
			<div className="pod-handle" style={{ fontFamily: "var(--font-apple), sans-serif" }}>{slot.entry.name}</div>
			<div className="pod-score" style={{ fontFamily: "var(--font-mono), monospace", color: "var(--color-violet)" }}>{slot.entry.score.toLocaleString()} pts</div>
		</div>
	);
}

export default function LeaderboardPage() {
	const user = useAuthStore((s) => s.user);
	const [board, setBoard] = useState<"global" | "category">("global");
	const [categorySlug, setCategorySlug] = useState("");

	const categoriesQuery = useQuery({
		queryKey: ["categories"],
		queryFn: () => api<CategoryDto[]>("/api/categories", { auth: false }),
	});

	const selectedCategory = (categoriesQuery.data ?? []).find(
		(c) => c.slug === categorySlug
	);

	const entriesQuery = useQuery({
		queryKey: ["leaderboard", board, categorySlug],
		queryFn: () => {
			if (board === "category" && selectedCategory) {
				return api<LeaderboardEntryDto[]>(
					`/api/leaderboard/category/${selectedCategory.id}?limit=25`,
					{ auth: false }
				);
			}
			return api<LeaderboardEntryDto[]>("/api/leaderboard/global?limit=25", {
				auth: false,
			});
		},
		enabled: board === "global" || Boolean(selectedCategory),
	});

	const ranked = withSharedRanks(entriesQuery.data ?? []);
	const podiumSlots: Array<RankedEntry | null> = [
		ranked[1] ?? null,
		ranked[0] ?? null,
		ranked[2] ?? null,
	];
	const youSlot = user
		? ranked.find((r) => r.entry.userId === user.id)
		: undefined;
	const restRaw = ranked.filter(
		(r) => !podiumSlots.some((s) => s?.entry.userId === r.entry.userId)
	);
	// Fix BUG 2: rest ranks must be sequential starting at #4, not repeating podium #3 on ties
	const rest = restRaw.map((r, i) => ({ ...r, displayRank: 4 + i }));
	const youInPodium = podiumSlots.some(
		(s) => s?.entry.userId === user?.id
	);

	return (
		<div className="py-10 max-w-6xl mx-auto px-8 max-[1280px]:px-6 max-[640px]:px-4">
			<Eyebrow>Rankings</Eyebrow>
			<h1 className="text-[30px] mt-2 mb-6" style={{ fontFamily: "var(--font-space), sans-serif", fontWeight: 700, letterSpacing: "-0.02em" }}>Leaderboard</h1>

			<div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
<div className="lb-tabs w-full sm:w-auto flex items-center gap-2">
				<button
					className={`lb-tab ${board === "global" ? "active" : ""}`}
					onClick={() => setBoard("global")}
				>
					Global
				</button>
				<button
					className={`lb-tab ${board === "category" ? "active" : ""}`}
					onClick={() => setBoard("category")}
				>
					By category
				</button>
				{board === "category" && (
					<Select
						value={categorySlug}
						onChange={(e) => setCategorySlug(e.target.value)}
						className="sm:w-48 h-8 flex-shrink-0"
					>
						<option value="">Choose category…</option>
						{(categoriesQuery.data ?? []).map((c) => (
							<option key={c.id} value={c.slug}>
								{c.name}
							</option>
						))}
					</Select>
				)}
			</div>
			</div>

			{entriesQuery.isPending ? (
				<div className="space-y-4">
					<div className="grid grid-cols-[1fr_1.15fr_1fr] gap-4">
						{[0, 1, 2].map((i) => (
							<div key={i} className="card h-40 animate-pulse" />
						))}
					</div>
					<div className="card h-64 animate-pulse" />
				</div>
			) : ranked.length === 0 ? (
				<div className="card p-10 text-center text-sm text-mutedc">
					{board === "category" && !categorySlug ? (
						"Pick a category to see its leaderboard."
					) : (
						<>
							No ranked scores here yet.
							<span className="block mt-2 text-xs text-faintc">
								Complete quizzes while logged in to appear on the board
								(leaderboards require REDIS_URI in production).
							</span>
						</>
					)}
				</div>
			) : (
				<>
					<div className="podium">
						<div className="fade-up" style={{ animationDelay: "0ms" }}><PodCard slot={podiumSlots[0]} /></div>
						<div className="fade-up" style={{ animationDelay: "50ms" }}><PodCard slot={podiumSlots[1]} /></div>
						<div className="fade-up" style={{ animationDelay: "100ms" }}><PodCard slot={podiumSlots[2]} /></div>
					</div>

					{rest.length > 0 && (
						<div className="lb-list">
							{rest.map(({ entry, displayRank }, i) => (
								<div
									key={entry.userId}
									className={`lb-row row-animate ${entry.userId === user?.id ? "you" : ""}`}
									style={{ animationDelay: `${0.05 * (i + 1)}s` }}
								>
									<div className="lb-rank" style={{ fontFamily: "var(--font-mono), monospace" }}>#{displayRank}</div>
									<div className="row-avatar" style={{ fontFamily: "var(--font-apple), sans-serif" }}>{initials(entry.name)}</div>
									<div className="row-name">
										<div className="handle flex items-center gap-2" style={{ fontFamily: "var(--font-apple), sans-serif" }}>
											{entry.name}
											{entry.userId === user?.id && (
												<span className="badge badge-violet" style={{ fontFamily: "var(--font-apple), sans-serif" }}>you</span>
											)}
										</div>
									</div>
									<div className="row-score text-right" style={{ fontFamily: "var(--font-mono), monospace", color: "var(--color-violet)" }}>
										{entry.score.toLocaleString()}
									</div>
								</div>
							))}
						</div>
					)}

					{youSlot && !youInPodium && (
						<div className="you-row mt-6">
							<div className="flex items-center gap-3.5">
								<div
									className="row-avatar"
									style={{ border: "1.5px solid var(--color-violet)" }}
								>
									{initials(youSlot.entry.name)}
								</div>
								<div>
									<div className="handle font-semibold text-[13.5px] text-ink">
										You · #{youSlot.displayRank}
									</div>
									<div className="text-xs text-faintc mono">
										{youSlot.entry.score.toLocaleString()} pts
									</div>
								</div>
							</div>
							<span className="badge badge-violet">Keep climbing 🚀</span>
						</div>
					)}

					<p className="mt-6 mono text-[11px] text-faintc leading-relaxed">
						Scores are cumulative points across completed quizzes · quiz boards
						track best percentage · equal scores share the same rank
					</p>
				</>
			)}
		</div>
	);
}

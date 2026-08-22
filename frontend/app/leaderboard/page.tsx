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

function PodCard({
	entry,
	rank,
}: {
	entry?: LeaderboardEntryDto;
	rank: number;
}) {
	if (!entry) return <div />;
	const isFirst = rank === 1;
	return (
		<div className={`pod-card ${isFirst ? "rank1" : ""}`}>
			{isFirst && (
				<div className="text-amberc mb-1.5 flex justify-center">
					<IconTrophy size={20} />
				</div>
			)}
			<div className="pod-rank-badge">#{rank}</div>
			<div className="pod-avatar">{initials(entry.name)}</div>
			<div className="pod-handle">{entry.name}</div>
			<div className="pod-score">{entry.score.toLocaleString()} pts</div>
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

	const entries = entriesQuery.data ?? [];
	const podium = [entries[1], entries[0], entries[2]].filter(Boolean);
	const rest = entries.slice(3);

	return (
		<div className="py-10 max-w-3xl mx-auto">
			<Eyebrow>Rankings</Eyebrow>
			<h1 className="text-[30px] mt-2 mb-6">Leaderboard</h1>

			<div className="lb-tabs">
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
					<select
						value={categorySlug}
						onChange={(e) => setCategorySlug(e.target.value)}
						className="input !w-auto !py-2"
					>
						<option value="">Choose category…</option>
						{(categoriesQuery.data ?? []).map((c) => (
							<option key={c.id} value={c.slug}>
								{c.name}
							</option>
						))}
					</select>
				)}
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
			) : entries.length === 0 ? (
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
					{entries.length >= 1 && (
						<div className="podium">
							<PodCard entry={podium[0]} rank={2} />
							<PodCard entry={podium[1]} rank={1} />
							<PodCard entry={podium[2]} rank={3} />
						</div>
					)}

					<div className="lb-list">
						{rest.map((entry) => {
							const isYou = user && entry.userId === user.id;
							return (
								<div
									key={entry.userId}
									className={`lb-row ${isYou ? "!bg-violetdim" : ""}`}
								>
									<div className="lb-rank">#{entry.rank}</div>
									<div className="row-avatar">{initials(entry.name)}</div>
									<div className="row-name">
										<div className="handle flex items-center gap-2">
											{entry.name}
											{isYou && <span className="badge badge-violet">you</span>}
										</div>
									</div>
									<div className="row-score text-right mono text-mint">
										{entry.score.toLocaleString()}
									</div>
								</div>
							);
						})}
					</div>
				</>
			)}

			<p className="mt-8 mono text-xs text-faintc">
				Scores are points earned across completed quizzes · quiz boards track best percentage
			</p>
		</div>
	);
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { CategoryDto, LeaderboardEntryDto } from "@/lib/types";

type Board = "global" | "category";

function medal(rank: number): string {
	if (rank === 1) return "🥇";
	if (rank === 2) return "🥈";
	if (rank === 3) return "🥉";
	return String(rank);
}

export default function LeaderboardPage() {
	const [board, setBoard] = useState<Board>("global");
	const [categorySlug, setCategorySlug] = useState("");

	const categoriesQuery = useQuery({
		queryKey: ["categories"],
		queryFn: () => api<CategoryDto[]>("/api/categories", { auth: false }),
	});

	function boardKey(): string {
		return board === "category" && categorySlug
			? `category:${categorySlug}`
			: "global";
	}

	const entriesQuery = useQuery({
		queryKey: ["leaderboard", boardKey()],
		queryFn: () => {
			if (board === "category" && categorySlug) {
				const cat = (categoriesQuery.data ?? []).find(
					(c) => c.slug === categorySlug
				);
				return api<LeaderboardEntryDto[]>(
					`/api/leaderboard/category/${cat?.id ?? 0}?limit=25`,
					{ auth: false }
				);
			}
			return api<LeaderboardEntryDto[]>("/api/leaderboard/global?limit=25", {
				auth: false,
			});
		},
		enabled: board === "global" || Boolean(categorySlug),
	});

	const scoreLabel =
		board === "global" || board === "category" ? "points earned" : "%";

	return (
		<div className="mx-auto max-w-2xl">
			<h1 className="text-3xl font-bold tracking-tight text-slate-900">
				Leaderboards
			</h1>
			<p className="mt-1 text-slate-500">
				Registered users only — guests play for fun, players compete for glory.
			</p>

			<div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl bg-slate-100 p-1">
				<button
					onClick={() => setBoard("global")}
					className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
						board === "global"
							? "bg-white text-slate-900 shadow"
							: "text-slate-500 hover:text-slate-800"
					}`}
				>
					Global
				</button>
				<button
					onClick={() => setBoard("category")}
					className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
						board === "category"
							? "bg-white text-slate-900 shadow"
							: "text-slate-500 hover:text-slate-800"
					}`}
				>
					Category
				</button>
				{board === "category" && (
					<select
						value={categorySlug}
						onChange={(e) => setCategorySlug(e.target.value)}
						className="ml-auto rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
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
				<div className="mt-6 h-64 animate-pulse rounded-xl bg-slate-100" />
			) : (entriesQuery.data?.length ?? 0) === 0 ? (
				<div className="mt-6 rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
					{board === "category" && !categorySlug ? (
						"Pick a category to see its leaderboard."
					) : (
						<>
							No ranked scores here yet. Complete quizzes while logged in to
							appear on the board.{" "}
							<span className="text-xs text-slate-400 block mt-1">
								(Leaderboards require Redis — set REDIS_URI in production.)
							</span>
						</>
					)}
				</div>
			) : (
				<div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
								<th className="px-5 py-3">Rank</th>
								<th className="px-5 py-3">Player</th>
								<th className="px-5 py-3 text-right">{scoreLabel}</th>
							</tr>
						</thead>
						<tbody>
							{(entriesQuery.data ?? []).map((entry) => (
								<tr
									key={entry.userId}
									className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
								>
									<td className="px-5 py-3 font-semibold text-slate-700">
										{medal(entry.rank)}
									</td>
									<td className="px-5 py-3 font-medium text-slate-800">
										{entry.name}
									</td>
									<td className="px-5 py-3 text-right font-mono tabular-nums text-indigo-600">
										{entry.score}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

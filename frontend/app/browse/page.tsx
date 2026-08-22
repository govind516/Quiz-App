"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CategoryDto, Difficulty, QuizDto } from "@/lib/types";
import { QuizCard } from "@/components/quiz-card";

const DIFFICULTIES: Difficulty[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

function BrowseInner() {
	const searchParams = useSearchParams();
	const [category, setCategory] = useState(searchParams.get("category") ?? "");
	const [difficulty, setDifficulty] = useState("");
	const [tag, setTag] = useState("");

	const categoriesQuery = useQuery({
		queryKey: ["categories"],
		queryFn: () => api<CategoryDto[]>("/api/categories", { auth: false }),
	});

	const quizzesQuery = useQuery({
		queryKey: ["quizzes", category, difficulty, tag],
		queryFn: () => {
			const params = new URLSearchParams();
			if (category) params.set("category", category);
			if (difficulty) params.set("difficulty", difficulty);
			if (tag)
				params.set("tag", tag.trim().toLowerCase().replace(/\s+/g, "-"));
			const qs = params.toString();
			return api<QuizDto[]>(`/api/quizzes${qs ? `?${qs}` : ""}`, { auth: false });
		},
	});

	return (
		<div className="py-10">
			<div className="mb-8">
				<span className="eyebrow">Practice</span>
				<h1 className="text-[34px] mt-2">Pick your quiz.</h1>
				<p className="text-mutedc mt-1 text-sm">
					Filter by track and difficulty — no account required to play.
				</p>
			</div>

			<div className="mb-6 flex flex-wrap items-center gap-3">
				<select
					value={category}
					onChange={(e) => setCategory(e.target.value)}
					className="input !w-auto"
				>
					<option value="">All categories</option>
					{(categoriesQuery.data ?? []).map((c) => (
						<option key={c.id} value={c.slug}>
							{c.name}
						</option>
					))}
				</select>
				<select
					value={difficulty}
					onChange={(e) => setDifficulty(e.target.value)}
					className="input !w-auto"
				>
					<option value="">All difficulties</option>
					{DIFFICULTIES.map((d) => (
						<option key={d} value={d}>
							{d.charAt(0) + d.slice(1).toLowerCase()}
						</option>
					))}
				</select>
				<input
					value={tag}
					onChange={(e) => setTag(e.target.value)}
					placeholder="Filter by tag…"
					className="input !w-44"
				/>
				{(category || difficulty || tag) && (
					<button
						onClick={() => {
							setCategory("");
							setDifficulty("");
							setTag("");
						}}
						className="mono text-xs text-faintc underline hover:text-mutedc"
					>
						Clear
					</button>
				)}
			</div>

			{quizzesQuery.isPending ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{[0, 1, 2].map((i) => (
						<div key={i} className="card h-44 animate-pulse" />
					))}
				</div>
			) : quizzesQuery.isError ? (
				<div className="rounded-xl border border-dangerc/40 bg-dangerdim p-4 text-sm text-dangerc">
					Failed to load quizzes. Is the backend running?
				</div>
			) : (quizzesQuery.data?.length ?? 0) === 0 ? (
				<div className="card p-10 text-center text-sm text-mutedc">
					No quizzes match these filters yet.
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{quizzesQuery.data!.map((quiz) => (
						<QuizCard key={quiz.id} quiz={quiz} />
					))}
				</div>
			)}
		</div>
	);
}

export default function BrowsePage() {
	return (
		<Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-surface2 mt-10" />}>
			<BrowseInner />
		</Suspense>
	);
}

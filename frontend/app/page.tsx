"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { CategoryDto, Difficulty, QuizDto } from "@/lib/types";
import { QuizCard } from "@/components/quiz-card";

const DIFFICULTIES: Difficulty[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

export default function BrowsePage() {
	const [category, setCategory] = useState("");
	const [difficulty, setDifficulty] = useState("");

	const categoriesQuery = useQuery({
		queryKey: ["categories"],
		queryFn: () => api<CategoryDto[]>("/api/categories", { auth: false }),
	});

	const quizzesQuery = useQuery({
		queryKey: ["quizzes", category, difficulty],
		queryFn: () => {
			const params = new URLSearchParams();
			if (category) params.set("category", category);
			if (difficulty) params.set("difficulty", difficulty);
			const qs = params.toString();
			return api<QuizDto[]>(`/api/quizzes${qs ? `?${qs}` : ""}`, { auth: false });
		},
	});

	return (
		<div>
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight text-slate-900">
					Browse quizzes
				</h1>
				<p className="mt-1 text-slate-500">
					Pick a topic and test your knowledge — no account required to play.
				</p>
			</div>

			<div className="mb-6 flex flex-wrap items-center gap-3">
				<select
					value={category}
					onChange={(e) => setCategory(e.target.value)}
					className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
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
					className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm capitalize text-slate-700 focus:border-indigo-500 focus:outline-none"
				>
					<option value="">All difficulties</option>
					{DIFFICULTIES.map((d) => (
						<option key={d} value={d} className="capitalize">
							{d.charAt(0) + d.slice(1).toLowerCase()}
						</option>
					))}
				</select>
			</div>

			{quizzesQuery.isPending ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{[0, 1, 2].map((i) => (
						<div key={i} className="h-48 animate-pulse rounded-xl bg-slate-100" />
					))}
				</div>
			) : quizzesQuery.isError ? (
				<div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
					Failed to load quizzes. Is the backend running?
				</div>
			) : (quizzesQuery.data?.length ?? 0) === 0 ? (
				<div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
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

"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { QuizDto } from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";

export function BookmarkButton({ quizId }: { quizId: number }) {
	const user = useAuthStore((s) => s.user);
	const queryClient = useQueryClient();

	const bookmarksQuery = useQuery({
		queryKey: ["bookmarks"],
		queryFn: () => api<QuizDto[]>("/api/bookmarks"),
		enabled: Boolean(user),
	});

	const mutation = useMutation({
		mutationFn: (remove: boolean) =>
			api(`/api/bookmarks/${quizId}`, {
				method: remove ? "DELETE" : "POST",
			}),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["bookmarks"] }),
	});

	if (!user) {
		return (
			<Link
				href="/login"
				title="Log in to save quizzes"
				className="rounded-lg px-2 py-1.5 text-slate-300 transition hover:bg-slate-50 hover:text-rose-400"
			>
				♡
			</Link>
		);
	}

	const bookmarked = (bookmarksQuery.data ?? []).some((q) => q.id === quizId);

	return (
		<button
			disabled={mutation.isPending}
			title={bookmarked ? "Remove bookmark" : "Save this quiz"}
			onClick={() => mutation.mutate(bookmarked)}
			className={`rounded-lg px-2 py-1.5 transition hover:bg-rose-50 disabled:opacity-50 ${
				bookmarked ? "text-rose-500" : "text-slate-300 hover:text-rose-400"
			}`}
		>
			{bookmarked ? "♥" : "♡"}
		</button>
	);
}

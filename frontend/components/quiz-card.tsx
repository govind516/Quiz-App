"use client";

import Link from "next/link";
import type { QuizDto } from "@/lib/types";
import { DifficultyBadge } from "./difficulty-badge";
import { BookmarkButton } from "./bookmark-button";

export function QuizCard({ quiz }: { quiz: QuizDto }) {
	return (
		<div className="card card-hover flex flex-col justify-between !p-5">
			<div>
				<div className="mb-2 flex flex-wrap items-center gap-2">
					<DifficultyBadge level={quiz.difficulty} />
					<span className="badge badge-violet">{quiz.categoryName}</span>
					{quiz.tags.length > 0 && (
						<span className="badge">#{quiz.tags[quiz.tags.length - 1]}</span>
					)}
				</div>
				<h3 className="text-lg font-semibold text-ink">{quiz.title}</h3>
				<p className="mt-1 line-clamp-2 min-h-10 text-sm text-mutedc">
					{quiz.description ?? "Test your knowledge."}
				</p>
			</div>
			<div className="mt-4 flex items-center justify-between">
				<div className="mono text-xs text-faintc">
					{quiz.questionCount} Qs · {Math.round(quiz.timeLimitSec / 60)} min
				</div>
				<div className="flex items-center gap-1">
					<BookmarkButton quizId={quiz.id} />
					<Link href={`/quiz/${quiz.id}`} className="btn btn-primary btn-sm">
						Start
					</Link>
				</div>
			</div>
		</div>
	);
}

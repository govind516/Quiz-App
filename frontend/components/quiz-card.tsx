import Link from "next/link";
import type { QuizDto } from "@/lib/types";
import { DifficultyBadge } from "./difficulty-badge";
import { BookmarkButton } from "./bookmark-button";

export function QuizCard({ quiz }: { quiz: QuizDto }) {
	return (
		<div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
			<div>
				<div className="mb-2 flex items-center gap-2">
					<DifficultyBadge level={quiz.difficulty} />
					<span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
						{quiz.categoryName}
					</span>
					{quiz.tags.length > 0 && (
						<span className="truncate rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
							#{quiz.tags[quiz.tags.length - 1]}
						</span>
					)}
				</div>
				<h3 className="text-lg font-semibold text-slate-900">{quiz.title}</h3>
				<p className="mt-1 line-clamp-2 min-h-10 text-sm text-slate-500">
					{quiz.description ?? "Test your knowledge."}
				</p>
			</div>
			<div className="mt-4 flex items-center justify-between">
				<div className="text-xs text-slate-500">
					{quiz.questionCount} questions · {Math.round(quiz.timeLimitSec / 60)} min
				</div>
				<div className="flex items-center gap-1">
					<BookmarkButton quizId={quiz.id} />
					<Link
						href={`/quiz/${quiz.id}`}
						className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
					>
						Start
					</Link>
				</div>
			</div>
		</div>
	);
}

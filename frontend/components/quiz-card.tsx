"use client";

import Link from "next/link";
import type { QuizDto } from "@/lib/types";
import { DifficultyBadge } from "./difficulty-badge";
import { BookmarkButton } from "./bookmark-button";

export function QuizCard({ quiz }: { quiz: QuizDto }) {
  return (
    <div className="card card-hover flex h-full flex-col justify-between !p-5 group">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <DifficultyBadge level={quiz.difficulty} />
          <span className="badge" style={{ fontFamily: "var(--font-apple), sans-serif", fontSize: 11, fontWeight: 600, borderRadius: 5 }}>
            {quiz.categoryName}
          </span>
        </div>
        <h3
          style={{
            fontFamily: "var(--font-space), sans-serif",
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            lineHeight: 1.35,
          }}
          className="text-ink"
        >
          {quiz.title}
        </h3>
        <p
          className="mt-1 line-clamp-2 min-h-10"
          style={{
            fontFamily: "var(--font-jakarta), sans-serif",
            fontSize: 13.5,
            color: "var(--color-mutedc)",
            lineHeight: 1.6,
          }}
        >
          {quiz.description ?? "Test your knowledge."}
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div
          className="mono"
          style={{ fontSize: 12, color: "var(--color-faintc)" }}
        >
          {quiz.questionCount} Qs · {Math.round(quiz.timeLimitSec / 60)} min
        </div>
        <div className="flex items-center gap-2">
          <BookmarkButton quizId={quiz.id} />
          <Link
            href={`/quiz/${quiz.id}`}
            className="btn btn-primary btn-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ borderRadius: 999 }}
          >
            Start
          </Link>
        </div>
      </div>
    </div>
  );
}

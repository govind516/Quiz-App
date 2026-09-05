"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { QuizDto, StartAttemptResponse } from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { BookmarkButton } from "@/components/bookmark-button";
import { Button } from "@/components/ui";
import { IconHexLogo, IconArrowRight, IconQuestion, IconTag } from "@/components/icons";
import { FadeUp, RevealHeading } from "@/components/Reveal";
import { saveStartPayload } from "@/lib/guest-session";

export default function QuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const quizQuery = useQuery({
    queryKey: ["quiz", id],
    queryFn: () => api<QuizDto>(`/api/quizzes/${id}`, { auth: false }),
  });

  const startMutation = useMutation({
    mutationFn: () =>
      api<StartAttemptResponse>(
        `/api/attempts/${id}/start`,
        { method: "POST", auth: Boolean(user) }
      ),
    onSuccess: (payload) => {
      saveStartPayload(payload);
      router.push(`/take/${payload.attemptId}`);
    },
  });

  if (quizQuery.isPending) {
    return (
      <div className="mx-auto max-w-2xl card p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface2 rounded w-1/4"></div>
          <div className="h-4 bg-surface2 rounded w-1/2"></div>
          <div className="h-4 bg-surface2 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  const quiz = quizQuery.data;
  if (!quiz) return null;

  return (
    <div className="mx-auto max-w-2xl py-10">
      <div className="card !p-8">
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          <DifficultyBadge level={quiz.difficulty} />
          <span className="badge badge-violet" style={{ fontFamily: "var(--font-apple), sans-serif" }}>{quiz.categoryName}</span>
          {quiz.tags.map((t) => (
            <span key={t} className="badge" style={{ fontFamily: "var(--font-apple), sans-serif", fontSize: 11, background: "var(--color-surface2)" }}>
              #{t}
            </span>
          ))}
          <div className="ml-auto">
            <BookmarkButton quizId={quiz.id} />
          </div>
        </div>

        <h1 className="text-[32px] leading-tight font-display font-bold tracking-[-0.8px]" style={{ fontFamily: "var(--font-space), sans-serif" }}>
          {quiz.title.replace(/\s—\s(BEGINNER|INTERMEDIATE|ADVANCED)\s*$/i, "")}
        </h1>
        {quiz.description && (
          <p className="mt-3" style={{ fontFamily: "var(--font-jakarta), sans-serif", lineHeight: 1.75, color: "var(--color-mutedc)" }}>
            {quiz.description}
          </p>
        )}

        <div className="grid grid-cols-3 gap-3 mt-7 text-sm">
          <div className="rounded-lg border p-3" style={{ background: "var(--color-surface2)", borderColor: "var(--color-line)" }}>
            <div className="text-xs" style={{ fontFamily: "var(--font-apple), sans-serif", color: "var(--color-faintc)" }}>Questions</div>
            <div className="mono text-lg font-semibold mt-0.5" style={{ color: "var(--color-ink)" }}>
              {Math.round(quiz.questionCount)}
            </div>
          </div>
          <div className="rounded-lg border p-3" style={{ background: "var(--color-surface2)", borderColor: "var(--color-line)" }}>
            <div className="text-xs" style={{ fontFamily: "var(--font-apple), sans-serif", color: "var(--color-faintc)" }}>Time limit</div>
            <div className="mono text-lg font-semibold mt-0.5" style={{ color: "var(--color-ink)" }}>
              {Math.round(quiz.timeLimitSec / 60)} min
            </div>
          </div>
          <div className="rounded-lg border p-3" style={{ background: "var(--color-surface2)", borderColor: "var(--color-line)" }}>
            <div className="text-xs" style={{ fontFamily: "var(--font-apple), sans-serif", color: "var(--color-faintc)" }}>Mode</div>
            <div className="mono text-lg font-semibold mt-0.5" style={{ color: "var(--color-ink)" }}>
              {user ? "Saved" : "Guest"}
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs" style={{ fontFamily: "var(--font-apple), sans-serif", color: "var(--color-mutedc)" }}>
          {user
            ? `You are logged in as ${user.name} — your score will be saved to your history.`
            : "You will play as a guest. Sign up after the quiz to save your score."}
        </p>

        {quiz.questionCount === 0 && (
          <p className="mt-4 text-center text-sm" style={{ color: "var(--color-mutedc)", fontFamily: "var(--font-apple), sans-serif" }}>
            This quiz has no questions yet.
          </p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button
            disabled={quiz.questionCount === 0}
            onClick={() => void startMutation.mutate(undefined)}
            className="btn btn-primary btn-block mt-6"
            style={{ borderRadius: 999, fontFamily: "var(--font-apple), sans-serif" }}
          >
            {startMutation.isPending ? "Starting…" : "Start quiz"}
          </Button>
        </div>
      </div>
    </div>
  );
}

const emptySubscribe = () => () => {};
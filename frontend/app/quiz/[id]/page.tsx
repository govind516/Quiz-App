"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { QuizDto, StartAttemptResponse } from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";
import { getGuestSessionId, saveStartPayload } from "@/lib/guest-session";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { BookmarkButton } from "@/components/bookmark-button";

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
      user
        ? api<StartAttemptResponse>(`/api/quizzes/${id}/start`, {
            method: "POST",
            body: {},
          })
        : api<StartAttemptResponse>(`/api/quizzes/${id}/start`, {
            method: "POST",
            body: { guestSessionId: getGuestSessionId() },
            auth: false,
          }),
    onSuccess: (payload) => {
      saveStartPayload(payload);
      router.push(`/take/${payload.attemptId}`);
    },
  });

  if (quizQuery.isPending) {
    return <div className="h-64 skeleton rounded-xl mt-10" />;
  }

  if (quizQuery.isError || !quizQuery.data) {
    return (
      <div className="max-w-2xl mx-auto card p-8 text-center mt-10">
        <h2 className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-space), sans-serif" }}>Quiz not found</h2>
        <p className="mt-2 text-sm" style={{ fontFamily: "var(--font-jakarta), sans-serif", color: "var(--color-mutedc)" }}>
          This quiz may be unpublished or removed.
        </p>
      </div>
    );
  }

  const quiz = quizQuery.data;

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

        <h1
          className="text-[32px] leading-tight"
          style={{ fontFamily: "var(--font-space), sans-serif", fontWeight: 700, letterSpacing: "-0.8px" }}
        >
          {quiz.title}
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
              {quiz.questionCount}
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

        <p className="mt-4 text-xs" style={{ fontFamily: "var(--font-apple), sans-serif", color: "var(--color-faintc)" }}>
          {user
            ? `You are logged in as ${user.name} — your score will be saved to your history.`
            : "You will play as a guest. Sign up after the quiz to save your score."}
        </p>

        {startMutation.isError && (
          <div className="mt-4 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(248,113,113,0.4)", background: "var(--color-dangerdim)", color: "var(--color-dangerc)", fontFamily: "var(--font-apple), sans-serif" }}>
            Could not start the quiz. Please try again.
          </div>
        )}

        <button
          disabled={quiz.questionCount === 0 || startMutation.isPending}
          onClick={() => startMutation.mutate()}
          className="btn btn-primary btn-block mt-6"
          style={{ height: 44, borderRadius: 999, fontFamily: "var(--font-apple), sans-serif", fontWeight: 600 }}
        >
          {startMutation.isPending
            ? "Starting…"
            : quiz.questionCount === 0
              ? "No questions available yet"
              : "Start quiz"}
        </button>
      </div>
    </div>
  );
}

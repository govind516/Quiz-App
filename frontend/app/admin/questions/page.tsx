"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, X, Trash2, Check } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eyebrow, FadeUp } from "@/components/Reveal";
import { AdminError, AdminLoading } from "@/components/admin-state";
import { api } from "@/lib/api";
import type { QuestionAdminDto, QuizDto } from "@/lib/types";

// Pill labels shown in the UI mapped to backend difficulty levels.
const LEVELS = [
  { label: "Fundamentals", level: "Beginner" },
  { label: "Intermediate", level: "Intermediate" },
  { label: "Advanced", level: "Advanced" },
] as const;

const cap = (s: string) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : s);

export default function QuestionBank() {
  const queryClient = useQueryClient();
  // Two-level selector: topic dropdown (10 names) + difficulty pills.
  // Together they resolve to exactly one of the 30 quizzes.
  const [topic, setTopic] = useState<string | null>(null);
  const [level, setLevel] = useState<string>("Beginner");

  // Live quiz list for the selectors.
  const quizzesQuery = useQuery({
    queryKey: ["admin", "quizzes-list"],
    queryFn: () => api<QuizDto[]>("/api/admin/quizzes"),
    retry: false,
  });
  const adminQuizzes = (quizzesQuery.data ?? []).map((q) => ({
    id: q.id,
    title: q.title,
    cat: q.categoryName,
    level: cap(q.difficulty),
  }));
  const quizTopics = Array.from(new Set(adminQuizzes.map((q) => q.cat)));
  // Only offer difficulty pills that actually exist for the chosen topic.
  const topicLevels = LEVELS.filter((l) =>
    adminQuizzes.some((q) => q.cat === topic && q.level === l.level)
  );

  useEffect(() => {
    if (topic === null && quizTopics.length > 0) {
      setTopic(quizTopics[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizTopics.length]);

  // Keep the level valid when switching topics (e.g. a topic missing a level).
  useEffect(() => {
    if (topic !== null && topicLevels.length > 0 && !topicLevels.some((l) => l.level === level)) {
      setLevel(topicLevels[0].level);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  const quizId = adminQuizzes.find((q) => q.cat === topic && q.level === level)?.id ?? null;

  // Live questions for the selected quiz. keepPreviousData avoids flashing
  // the skeleton on every topic/level switch — the old list stays until the
  // new one arrives.
  const questionsQuery = useQuery({
    queryKey: ["admin", "questions", quizId],
    queryFn: () => api<QuestionAdminDto[]>(`/api/admin/quizzes/${quizId}/questions`),
    enabled: quizId !== null,
    retry: false,
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api(`/api/admin/questions/${id}`, { method: "DELETE" }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "questions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "pending"] });
    },
  });

  const questionBank = (questionsQuery.data ?? []).map((q) => ({
    id: String(q.questionId),
    rawId: q.questionId,
    status: q.status === "APPROVED" ? "approved" : q.status === "PENDING_REVIEW" ? "pending" : "rejected",
    type: q.type,
    points: q.points,
    prompt: q.questionText,
    choices: q.options.map((o) => ({ text: o.optionText, correct: o.isCorrect })),
  }));

  const loading = quizzesQuery.isPending || (quizId !== null && questionsQuery.isPending);
  const error = quizzesQuery.error ?? questionsQuery.error;
  const refetchAll = () => {
    quizzesQuery.refetch();
    questionsQuery.refetch();
  };
  const selectedTitle = adminQuizzes.find((q) => q.id === quizId)?.title;

  return (
    <div data-testid="admin-questionbank">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <FadeUp>
            <Eyebrow>Admin</Eyebrow>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 className="mt-4 font-display text-[48px] md:text-[64px] leading-[0.95] text-white">Question bank</h1>
          </FadeUp>
          <FadeUp delay={0.2} className="mt-2 text-[color:var(--ink-2)]">
            {!loading && !error ? `${questionBank.length} question(s)` : " "}
          </FadeUp>
        </div>

        <FadeUp delay={0.1} className="w-full md:w-auto md:min-w-[380px]">
          <label className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-[color:var(--mute)]">
            Working on
          </label>
          <div className="relative mt-2">
            <select
              value={topic ?? ""}
              onChange={(e) => setTopic(e.target.value)}
              data-testid="qb-topic-select"
              className="appearance-none w-full pl-4 pr-10 py-3.5 rounded-xl glass text-[14px] text-white outline-none border-[color:var(--violet)]/40 cursor-pointer"
            >
              {quizTopics.map((t) => (
                <option key={t} value={t} className="bg-[#0D0D12]">
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--mute)] pointer-events-none" />
          </div>
          <div className="mt-3 inline-flex items-center rounded-full glass p-1 relative" data-testid="qb-level-pills">
            {topicLevels.map((l) => (
              <button
                key={l.level}
                type="button"
                onClick={() => setLevel(l.level)}
                data-testid={`qb-level-${l.label.toLowerCase()}`}
                className="relative px-5 py-2 text-[13px] transition-colors"
              >
                {level === l.level && (
                  <motion.span
                    layoutId="qb-level-pill"
                    className="absolute inset-0 rounded-full bg-white"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className={`relative ${level === l.level ? "text-[#0A0A0F]" : "text-[color:var(--ink-2)]"}`}>
                  {l.label}
                </span>
              </button>
            ))}
          </div>
          {selectedTitle && (
            <div className="mt-2 font-mono text-[11px] text-[color:var(--mute)]" data-testid="qb-selected-quiz">
              {selectedTitle}
            </div>
          )}
        </FadeUp>
      </div>

      {error ? (
        <AdminError error={error} retry={refetchAll} />
      ) : loading ? (
        <AdminLoading rows={3} />
      ) : (
      <div className="mt-8 space-y-4">
        {questionBank.length === 0 && (
          <div className="rounded-2xl glass p-10 text-center text-[13.5px] text-[color:var(--mute)]">
            No questions in this quiz yet.
          </div>
        )}
        {questionBank.map((q: any, i: number) => (
          <FadeUp key={q.id} delay={i * 0.06}>
            <div className="rounded-2xl glass glass-hover p-6 relative" data-testid={`qb-item-${q.id}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono text-[color:var(--mint)] bg-[color:var(--mint)]/10 border border-[color:var(--mint)]/25">
                    {q.status}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono border border-white/10 text-[color:var(--ink-2)]">
                    {q.type}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono border border-white/10 text-[color:var(--ink-2)]">
                    {q.points} pt
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="w-8 h-8 rounded-full grid place-items-center border border-white/10 text-[color:var(--ink-2)] hover:text-white hover:bg-white/[0.06] transition-colors"
                    data-testid={`qb-close-${q.id}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(q.rawId)}
                    disabled={deleteMutation.isPending}
                    className="w-8 h-8 rounded-full grid place-items-center border border-white/10 text-[color:var(--coral)] hover:bg-[color:var(--coral)]/10 transition-colors disabled:opacity-40"
                    data-testid={`qb-delete-${q.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-4 text-[16px] text-white leading-relaxed">{q.prompt}</div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                {q.choices.map((c: any, ci: number) => (
                  <div
                    key={ci}
                    className={`px-3.5 py-2.5 rounded-lg text-[13.5px] border truncate flex items-center gap-2 ${c.correct ? "text-[color:var(--mint)] bg-[color:var(--mint)]/[0.08] border-[color:var(--mint)]/25" : "text-[color:var(--ink-2)] border-white/10 bg-white/[0.02]"}`}
                  >
                    {c.correct && <Check className="w-3.5 h-3.5 shrink-0" />}
                    <span className="truncate">{c.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
      )}
    </div>
  );
}

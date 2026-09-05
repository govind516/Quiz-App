"use client";

import React, { useState } from "react";
import { ChevronDown, X, Trash2, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Eyebrow, FadeUp } from "@/components/Reveal";
import { adminQuizzes as mockAdminQuizzes, questionBank as mockQuestionBank } from "@/lib/mock";
import { api } from "@/lib/api";
import type { QuestionAdminDto } from "@/lib/types";

export default function QuestionBank() {
  const [quiz, setQuiz] = useState(mockAdminQuizzes[1].title);

  // TODO: backend wiring — fetch questions for selected quiz; fallback to mock
  const questionsQuery = useQuery({
    queryKey: ["admin", "questions", quiz],
    queryFn: () => api<QuestionAdminDto[]>("/api/admin/questions?quizId=1"),
    retry: false,
  });

  // Keep visual exact: use mock if API unavailable or returns empty
  const questionBank = questionsQuery.data
    ? questionsQuery.data.map((q) => ({
        id: String(q.questionId),
        status: q.status === "APPROVED" ? "approved" : q.status === "PENDING_REVIEW" ? "pending" : "rejected",
        type: q.type,
        points: q.points,
        prompt: q.questionText,
        choices: q.options.map((o) => ({ text: o.optionText, correct: o.isCorrect })),
      }))
    : mockQuestionBank;

  // also try to fetch quizzes for dropdown
  const quizzesQuery = useQuery({
    queryKey: ["admin", "quizzes-list"],
    queryFn: () => api<any[]>("/api/admin/quizzes"),
    retry: false,
  });
  const adminQuizzes = quizzesQuery.data
    ? quizzesQuery.data.map((q: any) => ({ id: String(q.id), title: q.title }))
    : mockAdminQuizzes;

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
            {questionBank.length} question(s)
          </FadeUp>
        </div>

        <FadeUp delay={0.1} className="w-full md:w-auto md:min-w-[380px]">
          <label className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-[color:var(--mute)]">
            Working on
          </label>
          <div className="relative mt-2">
            <select
              value={quiz}
              onChange={(e) => setQuiz(e.target.value)}
              data-testid="qb-quiz-select"
              className="appearance-none w-full pl-4 pr-10 py-3.5 rounded-xl glass text-[14px] text-white outline-none border-[color:var(--violet)]/40 cursor-pointer"
            >
              {adminQuizzes.map((q: any) => (
                <option key={q.id} className="bg-[#0D0D12]">
                  {q.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--mute)] pointer-events-none" />
          </div>
        </FadeUp>
      </div>

      <div className="mt-8 space-y-4">
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
                    className="w-8 h-8 rounded-full grid place-items-center border border-white/10 text-[color:var(--coral)] hover:bg-[color:var(--coral)]/10 transition-colors"
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
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Check, X, Sparkles } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eyebrow, FadeUp } from "@/components/Reveal";
import { reviewQueue as mockReviewQueue } from "@/lib/mock";
import { api } from "@/lib/api";
import type { QuestionAdminDto } from "@/lib/types";

export default function ReviewQueue() {
  const [items, setItems] = useState(mockReviewQueue);
  const queryClient = useQueryClient();

  // TODO: backend wiring — fetch pending questions; fallback to mock
  const pendingQuery = useQuery({
    queryKey: ["admin", "pending"],
    queryFn: () => api<QuestionAdminDto[]>("/api/admin/questions/pending"),
    retry: false,
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => api(`/api/admin/questions/${id}/approve`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "pending"] }),
  });
  const rejectMutation = useMutation({
    mutationFn: (id: number) => api(`/api/admin/questions/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "pending"] }),
  });

  const displayItems: any[] = pendingQuery.data
    ? pendingQuery.data.map((q) => ({
        id: String(q.questionId),
        rawId: q.questionId,
        cat: "—",
        difficulty: "—",
        prompt: q.questionText,
        choices: q.options.map((o) => ({ text: o.optionText, correct: o.isCorrect })),
        generatedBy: "Gemini Flash 6.0",
        submittedAt: "now",
      }))
    : items;

  const decide = (id: string, approve: boolean) => {
    // optimistic local fallback
    setItems((it) => it.filter((x) => x.id !== id));
    const found = displayItems.find((x) => x.id === id);
    if (found?.rawId) {
      if (approve) approveMutation.mutate(found.rawId);
      else rejectMutation.mutate(found.rawId);
    }
  };

  const count = displayItems.length;

  return (
    <div data-testid="admin-review">
      <FadeUp>
        <Eyebrow>Admin</Eyebrow>
      </FadeUp>
      <FadeUp delay={0.1}>
        <h1 className="mt-4 font-display text-[48px] md:text-[64px] leading-[0.95] text-white">Review queue</h1>
      </FadeUp>
      <FadeUp delay={0.2} className="mt-2 text-[color:var(--ink-2)]">
        {count} pending · drafted by Gemini Flash 6.0
      </FadeUp>

      <div className="mt-8 space-y-4">
        {count === 0 && (
          <FadeUp className="rounded-2xl glass p-10 text-center">
            <div className="mx-auto w-12 h-12 rounded-full grid place-items-center bg-[color:var(--mint)]/10 border border-[color:var(--mint)]/25">
              <Check className="w-5 h-5 text-[color:var(--mint)]" />
            </div>
            <div className="mt-4 font-display text-[24px] text-white">Inbox zero.</div>
            <div className="mt-1 text-[color:var(--ink-2)]">All AI drafts have been triaged.</div>
          </FadeUp>
        )}
        {displayItems.map((q: any, i: number) => (
          <FadeUp key={q.id} delay={i * 0.06}>
            <div className="rounded-2xl glass p-6" data-testid={`rv-item-${q.id}`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono text-[color:var(--gold)] bg-[color:var(--gold)]/10 border border-[color:var(--gold)]/25">
                    PENDING_REVIEW
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono border border-white/10 text-[color:var(--ink-2)]">
                    {q.cat}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono border border-white/10 text-[color:var(--ink-2)]">
                    {q.difficulty}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono border border-[color:var(--violet)]/25 text-[color:var(--violet-2)] bg-[color:var(--violet)]/10">
                    <Sparkles className="w-3 h-3" />
                    {q.generatedBy}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-[color:var(--mute)]">{q.submittedAt}</div>
              </div>
              <div className="mt-4 font-display text-[20px] text-white leading-snug">{q.prompt}</div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                {q.choices.map((c: any, ci: number) => (
                  <div
                    key={ci}
                    className={`px-3.5 py-2.5 rounded-lg text-[13.5px] border flex items-center gap-2 ${c.correct ? "text-[color:var(--mint)] bg-[color:var(--mint)]/[0.08] border-[color:var(--mint)]/25" : "text-[color:var(--ink-2)] border-white/10 bg-white/[0.02]"}`}
                  >
                    {c.correct && <Check className="w-3.5 h-3.5 shrink-0" />}
                    {c.text}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={() => decide(q.id, true)}
                  data-testid={`rv-approve-${q.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[color:var(--mint)]/15 hover:bg-[color:var(--mint)]/25 border border-[color:var(--mint)]/30 text-[color:var(--mint)] text-[13px] transition-colors"
                >
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button
                  onClick={() => decide(q.id, false)}
                  data-testid={`rv-reject-${q.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[color:var(--coral)]/10 hover:bg-[color:var(--coral)]/20 border border-[color:var(--coral)]/30 text-[color:var(--coral)] text-[13px] transition-colors"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
                <button
                  data-testid={`rv-edit-${q.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass glass-hover text-[13px] text-white"
                >
                  Edit
                </button>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </div>
  );
}

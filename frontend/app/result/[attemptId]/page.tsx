"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, publicApi } from "@/lib/api";
import type { AttemptResultDto, QuizDto, QuestionPublicDto } from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";
import { getGuestSessionId, loadStartPayload } from "@/lib/guest-session";
import { CountUp, Eyebrow } from "@/components/ui";
import { IconCheck, IconX } from "@/components/icons";

export default function ResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const user = useAuthStore((s) => s.user);

  const resultQuery = useQuery({
    queryKey: ["result", attemptId],
    queryFn: () =>
      user
        ? api<AttemptResultDto>(`/api/attempts/${attemptId}/result`)
        : publicApi<AttemptResultDto>(`/api/attempts/${attemptId}/result?guestSessionId=${getGuestSessionId()}`),
    retry: false,
  });

  const ringRef = useRef<SVGCircleElement>(null);
  const pctRef = useRef<HTMLDivElement>(null);
  const bigRef = useRef<HTMLDivElement>(null);

  const result = resultQuery.data;

  // Fallback: if sessionStorage cleared, fetch quiz to resolve option text
  const fallbackQuizQuery = useQuery({
    queryKey: ["quiz-fallback", result?.quizId],
    queryFn: () => api<QuizDto>(`/api/quizzes/${result!.quizId}`, { auth: false }),
    enabled: Boolean(result?.quizId) && !loadStartPayload(attemptId),
  });

  // Build fallback map from quiz fetch if needed
  const fallbackQuestions = (() => {
    if (!result) return new Map<number, QuestionPublicDto>();
    const cached = loadStartPayload(attemptId);
    if (cached) return new Map<number, QuestionPublicDto>(cached.questions.map((q) => [q.questionId, q]));
    // No cached payload and no fallback quiz yet -> empty
    return new Map<number, QuestionPublicDto>();
  })();

  useEffect(() => {
    if (!result) return;
    const passed = result.percentage >= 60;
    const stroke = passed ? "#34d399" : "#f87171";
    const target = Math.min(100, Math.round(result.percentage));
    const timer = setTimeout(() => {
      if (ringRef.current) {
        ringRef.current.style.strokeDashoffset = String(502 * (1 - target / 100));
        ringRef.current.style.stroke = stroke;
        ringRef.current.classList.add(passed ? "pass" : "fail");
      }
    }, 150);
    let raf = 0;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (startTime === null) startTime = ts;
      const progress = Math.min((ts - startTime) / 1200, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(eased * target);
      if (bigRef.current) bigRef.current.textContent = `${val}%`;
      if (pctRef.current) pctRef.current.textContent = `${result.score}/${result.totalPoints} points`;
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [result]);

  if (resultQuery.isPending) {
    return <div className="h-64 skeleton rounded-xl mt-10" />;
  }

  if (resultQuery.isError || !result) {
    return (
      <div className="mx-auto max-w-lg card p-10 text-center mt-10">
        <h2 className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-space), sans-serif" }}>
          Could not load this result
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--color-mutedc)", fontFamily: "var(--font-jakarta), sans-serif" }}>
          The attempt may belong to another session or is still in progress.
        </p>
        <Link href="/browse" className="btn btn-primary mt-5 inline-flex" style={{ borderRadius: 999 }}>
          Browse quizzes
        </Link>
      </div>
    );
  }

  function optionText(questionId: number, optionId: number): string {
    const fromCache = fallbackQuestions.get(questionId)?.options.find((o) => o.optionId === optionId)?.optionText;
    if (fromCache) return fromCache;
    return `Option #${optionId}`;
  }

  const correctCount = result.questions.filter((q) => q.correct).length;
  const passed = result.percentage >= 60;
  const headline = passed && result.percentage >= 90 ? "Excellent." : passed ? "Good effort." : "Let's work on that.";

  return (
    <div className="quiz-shell">
      <div className="text-center pt-4">
        <Eyebrow>Quiz complete</Eyebrow>
        <h2 className="text-[28px] mt-3" style={{ fontFamily: "var(--font-space), sans-serif", fontWeight: 700, letterSpacing: "-0.02em" }}>{result.quizTitle}</h2>
        <p className="text-sm mb-2" style={{ color: "var(--color-mutedc)", fontFamily: "var(--font-jakarta), sans-serif" }}>Here&apos;s how you did.</p>

        {result.status === "EXPIRED" && (
          <div className="inline-block badge badge-danger mt-2">Time expired — auto-submitted</div>
        )}

        <div className="score-ring-wrap">
          <svg className="score-ring" viewBox="0 0 180 180">
            <circle className="score-ring-bg" cx="90" cy="90" r="80" />
            <circle ref={ringRef} className="score-ring-fg" cx="90" cy="90" r="80" />
          </svg>
          <div className="score-ring-label">
            <div ref={bigRef} className="big mono">0%</div>
            <div ref={pctRef} className="text-xs mt-1" style={{ color: "var(--color-faintc)", fontFamily: "var(--font-apple), sans-serif" }}></div>
          </div>
        </div>

        <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-space), sans-serif", color: passed ? "var(--color-mint)" : "var(--color-dangerc)" }}>{headline}</p>

        <div className="breakdown">
          {result.questions.map((q, i) => (
            <div key={q.questionId} className={`bd-dot ${q.correct ? "ok" : "bad"}`}>
              {i + 1}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-8">
          <div className="card !p-4 text-center">
            <div className="mono text-2xl font-bold" style={{ color: "var(--color-mint)" }}>{correctCount}</div>
            <div className="text-xs mt-1" style={{ fontFamily: "var(--font-apple), sans-serif", color: "var(--color-mutedc)" }}>Correct</div>
          </div>
          <div className="card !p-4 text-center">
            <div className="mono text-2xl font-bold" style={{ color: "var(--color-dangerc)" }}>{result.questions.length - correctCount}</div>
            <div className="text-xs mt-1" style={{ fontFamily: "var(--font-apple), sans-serif", color: "var(--color-mutedc)" }}>Incorrect</div>
          </div>
          <div className="card !p-4 text-center">
            <div className="mono text-2xl font-bold" style={{ color: "var(--color-ink)" }}>{Math.floor(result.durationSeconds / 60)}m {result.durationSeconds % 60}s</div>
            <div className="text-xs mt-1" style={{ fontFamily: "var(--font-apple), sans-serif", color: "var(--color-mutedc)" }}>Time</div>
          </div>
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/browse" className="btn btn-ghost" style={{ fontFamily: "var(--font-apple), sans-serif", borderRadius: 999 }}>
            Try another quiz
          </Link>
          {user ? (
            <Link href="/me" className="btn btn-primary" style={{ borderRadius: 999, fontFamily: "var(--font-apple), sans-serif" }}>
              View my progress
            </Link>
          ) : (
            <Link href="/auth?mode=signup" className="btn btn-primary" style={{ borderRadius: 999, fontFamily: "var(--font-apple), sans-serif" }}>
              Save this score — sign up
            </Link>
          )}
        </div>
        <p className="mt-4 text-sm" style={{ color: "var(--color-mutedc)", fontFamily: "var(--font-apple), sans-serif" }}>{headline} {passed ? "Keep the momentum going." : "Review the breakdown and try again — you've got this."}</p>
      </div>

      <div className="mt-14">
        <Eyebrow>Review</Eyebrow>
        <h3 className="text-xl mt-2 mb-5" style={{ fontFamily: "var(--font-space), sans-serif", fontWeight: 600 }}>
          {passed ? "Solid work." : "Learn from these."}
        </h3>

        <div className="space-y-4">
          {result.questions.map((question, index) => (
            <ReviewRow key={question.questionId} question={question} index={index} optionText={optionText} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ question, index, optionText }: { question: import("@/lib/types").QuestionResultDto; index: number; optionText: (qid: number, oid: number) => string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`card !p-6 ${question.correct ? "!border-mint/30" : "!border-dangerc/30"}`}>
      <div className="flex items-start justify-between gap-3 collapsible-trigger" onClick={() => setOpen((v) => !v)}>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`badge ${question.correct ? "badge-mint" : "badge-danger"}`} style={{ fontFamily: "var(--font-apple), sans-serif" }}>
              Q{index + 1}
            </span>
            <span className="badge" style={{ fontFamily: "var(--font-apple), sans-serif" }}>{question.points} pt</span>
            <span className="ml-auto mono text-xs" style={{ color: "var(--color-faintc)" }}>{open ? "−" : "+"}</span>
          </div>
          <h4 className="font-semibold leading-relaxed" style={{ color: "var(--color-ink)", fontFamily: "var(--font-space), sans-serif" }}>
            {question.questionText}
          </h4>
        </div>
        <span className={`opt-mark !w-7 !h-7 ${question.correct ? "!bg-mint !border-mint !text-[#08130F]" : "!bg-dangerc !border-dangerc !text-[#1A0808]"}`}>
          {question.correct ? <IconCheck size={13} /> : <IconX size={13} />}
        </span>
      </div>

      <div
        className="collapsible"
        style={{ maxHeight: open ? 1000 : 0, opacity: open ? 1 : 0, marginTop: open ? 16 : 0 }}
      >
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-lg p-3 border" style={{ background: "var(--color-surface2)", borderColor: "var(--color-line)" }}>
            <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: "var(--color-faintc)", fontFamily: "var(--font-apple), sans-serif" }}>
              Your answer
            </p>
            <ul className="space-y-0.5" style={{ color: "var(--color-mutedc)", fontFamily: "var(--font-jakarta), sans-serif" }}>
              {question.selectedOptionIds.length === 0 && <li className="italic">Not answered</li>}
              {question.selectedOptionIds.map((id) => (
                <li key={id} style={{ color: question.correctOptionIds.includes(id) ? "var(--color-mint)" : "var(--color-dangerc)" }}>
                  {optionText(question.questionId, id)}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg p-3 border" style={{ background: "var(--color-mintdim)", borderColor: "rgba(52,211,153,0.2)" }}>
            <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: "rgba(52,211,153,0.7)", fontFamily: "var(--font-apple), sans-serif" }}>
              Correct answer
            </p>
            <ul className="space-y-0.5" style={{ color: "var(--color-mint)", fontFamily: "var(--font-jakarta), sans-serif" }}>
              {question.correctOptionIds.map((id) => (
                <li key={id}>{optionText(question.questionId, id)}</li>
              ))}
            </ul>
          </div>
        </div>
        {question.explanation && (
          <div className="explain-inner mt-4" style={{ borderLeftColor: "var(--color-violet)" }}>
            <span style={{ color: "var(--color-violet)", fontWeight: 600, fontFamily: "var(--font-apple), sans-serif" }}>Explanation: </span>
            <span style={{ fontFamily: "var(--font-jakarta), sans-serif" }}>{question.explanation}</span>
          </div>
        )}
      </div>
    </div>
  );
}

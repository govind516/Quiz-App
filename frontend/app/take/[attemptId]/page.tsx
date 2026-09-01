"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AttemptResultDto, QuizDto, StartAttemptResponse } from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";
import { getGuestSessionId, readStartPayloadCached } from "@/lib/guest-session";
import { DifficultyBadge } from "@/components/difficulty-badge";

type AnswerMap = Record<number, number[]>;

const emptySubscribe = () => () => {};
const TIMER_CIRC = 150.8;

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TakeQuizPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const payload = useSyncExternalStore(
    emptySubscribe,
    () => readStartPayloadCached(attemptId),
    (): StartAttemptResponse | null => null
  );

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [shakeIdx, setShakeIdx] = useState<number | null>(null);

  const submittedRef = useRef(false);
  const answersRef = useRef<AnswerMap>({});
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const metaQuery = useQuery({
    queryKey: ["quiz", payload?.quizId],
    queryFn: () => api<QuizDto>(`/api/quizzes/${payload!.quizId}`, { auth: false }),
    enabled: Boolean(payload?.quizId),
  });

  useEffect(() => {
    if (!payload) return;
    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(payload.expiresAt).getTime() - Date.now()) / 1000));
      setRemainingSec(remaining);
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [payload]);

  // Keyboard shortcuts: A-F select, Enter next, Esc exit
  useEffect(() => {
    if (!payload) return;
    function handler(e: KeyboardEvent) {
      if ((e.key >= "a" && e.key <= "f") || (e.key >= "A" && e.key <= "F")) {
        const idx = e.key.toLowerCase().charCodeAt(0) - 97;
        const q = payload!.questions[current];
        const opt = q?.options[idx];
        if (opt) { e.preventDefault(); chooseOption(opt.optionId); }
      } else if (e.key === "Enter") {
        if (current < payload!.questions.length - 1) setCurrent((i) => i + 1);
      } else if (e.key === "Escape") {
        router.push("/browse");
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [payload, current, router]);

  const submit = useCallback(async () => {
    if (!payload || submittedRef.current || submitting) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const selectedAnswers = Object.entries(answersRef.current)
        .filter(([, optionIds]) => optionIds.length > 0)
        .map(([questionId, optionIds]) => ({ questionId: Number(questionId), selectedOptionIds: optionIds }));
      await api<AttemptResultDto>(`/api/attempts/${attemptId}/submit`, {
        method: "POST",
        auth: Boolean(user),
        body: { guestSessionId: user ? undefined : getGuestSessionId(), answers: selectedAnswers },
      });
      router.replace(`/result/${attemptId}`);
    } catch (error) {
      submittedRef.current = false;
      setSubmitError(error instanceof Error ? error.message : "Failed to submit your quiz.");
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, payload, user, router, submitting]);

  useEffect(() => {
    if (remainingSec === 0 && payload && !submittedRef.current) void submit();
  }, [remainingSec, payload, submit]);

  if (!payload) {
    return (
      <div className="quiz-shell">
        <div className="card p-10 text-center">
          <h2 className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-space), sans-serif" }}>Quiz session not found</h2>
          <p className="mt-2 text-sm" style={{ fontFamily: "var(--font-jakarta), sans-serif", color: "var(--color-mutedc)" }}>
            This quiz session expired or was opened in a new tab. Start again to play.
          </p>
          <Link href="/browse" className="btn btn-primary mt-5 inline-flex" style={{ borderRadius: 999 }}>Browse quizzes</Link>
        </div>
      </div>
    );
  }

  const questions = payload.questions;
  const question = questions[current];
  const selected = answers[question.questionId] ?? [];
  const answeredCount = Object.values(answers).filter((ids) => ids.length > 0).length;
  const totalSec = payload.timeLimitSec;
  const fraction = remainingSec === null ? 1 : Math.max(0, Math.min(1, remainingSec / totalSec));
  const lowTime = (remainingSec ?? 9999) <= 30;
  const criticalTime = (remainingSec ?? 9999) <= 10;
  const percentDone = Math.round(((current + 1) / questions.length) * 100);

  function chooseOption(optionId: number) {
    // shake on deselect-multi? just apply shake if already selected MULTI
    if (question.type === "MULTI_SELECT" && selected.includes(optionId)) {
      // allow toggle without shake
    }
    setAnswers((prev) => ({
      ...prev,
      [question.questionId]:
        question.type === "MULTI_SELECT"
          ? prev[question.questionId]?.includes(optionId)
            ? prev[question.questionId].filter((id) => id !== optionId)
            : [...(prev[question.questionId] ?? []), optionId]
          : [optionId],
    }));
  }

  const marks = ["A", "B", "C", "D", "E", "F"];

  const timerColor = criticalTime ? "var(--color-dangerc)" : lowTime ? "var(--color-amberc)" : "var(--color-mint)";
  const timerClass = criticalTime ? "timer-ring-fg critical" : lowTime ? "timer-ring-fg warning" : "timer-ring-fg";

  return (
    <div className="quiz-shell">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div className="flex items-center gap-3.5">
          <Link href="/browse" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface2 transition" style={{ color: "var(--color-faintc)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <span className="badge badge-violet" style={{ fontFamily: "var(--font-apple), sans-serif" }}>{payload.quizTitle}</span>
          {metaQuery.data && (
            <>
              <DifficultyBadge level={metaQuery.data.difficulty} />
              <span className="badge hidden sm:inline-flex" style={{ fontFamily: "var(--font-apple), sans-serif" }}>{metaQuery.data.categoryName}</span>
            </>
          )}
          <span className="badge hidden sm:inline-flex" style={{ fontFamily: "var(--font-apple), sans-serif" }}>
            {answeredCount}/{questions.length} answered
          </span>
        </div>
        <div className="flex items-center gap-3">
          {remainingSec !== null && (
            <>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: timerColor }}>
                {formatClock(remainingSec)}
              </span>
              <div className="timer-wrap">
                <svg className="timer-ring" viewBox="0 0 54 54">
                  <circle className="timer-ring-bg" cx="27" cy="27" r="24" />
                  <circle
                    className={timerClass}
                    cx="27" cy="27" r="24"
                    style={{ strokeDashoffset: TIMER_CIRC * (1 - fraction), stroke: timerColor }}
                  />
                </svg>
                <div className="timer-value" style={{ color: timerColor, fontFamily: "var(--font-mono), monospace", fontSize: 13, fontWeight: 600 }}>
                  {remainingSec >= 60 ? `${Math.ceil(remainingSec / 60)}m` : `${remainingSec}s`}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="quiz-progress-bar">
        <div className="quiz-progress-fill" style={{ width: `${percentDone}%` }} />
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="question-dots">
          {questions.map((q, i) => (
            <button
              key={q.questionId}
              onClick={() => setCurrent(i)}
              className={`q-dot ${i === current ? "current" : (answers[q.questionId] ?? []).length > 0 ? "answered" : ""}`}
              aria-label={`Go to question ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <span className="mono text-xs" style={{ color: "var(--color-faintc)", fontFamily: "var(--font-mono), monospace" }}>
          Q {current + 1} / {questions.length}
        </span>
      </div>

      <div className="q-card">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="badge badge-violet" style={{ fontFamily: "var(--font-apple), sans-serif" }}>
            {question.type === "MULTI_SELECT" ? "Select all that apply" : question.type === "TRUE_FALSE" ? "True or False" : "Single answer"}
          </span>
          <span className="badge" style={{ fontFamily: "var(--font-apple), sans-serif" }}>{question.points} pt</span>
        </div>
        <h3>{question.questionText}</h3>
      </div>

      <div className="options">
        {question.options.map((option, i) => {
          const isSelected = selected.includes(option.optionId);
          const showCheck = question.type === "MULTI_SELECT" && isSelected;
          return (
            <button
              key={option.optionId}
              onClick={() => chooseOption(option.optionId)}
              className={`option ${isSelected ? "selected" : ""} ${shakeIdx === i ? "shake" : ""}`}
            >
              <div className="opt-mark">{showCheck ? "✓" : marks[i]}</div>
              {option.optionText}
            </button>
          );
        })}
      </div>

      <div className="keyboard-hints">
        <span><kbd>A</kbd> Select</span>
        <span><kbd>Enter</kbd> Next</span>
        <span><kbd>Esc</kbd> Exit</span>
      </div>

      {submitError && (
        <div className="mt-4 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(248,113,113,0.4)", background: "var(--color-dangerdim)", color: "var(--color-dangerc)", fontFamily: "var(--font-apple), sans-serif" }}>
          {submitError}
        </div>
      )}

      <div className="quiz-foot mt-6 justify-between">
        <button
          disabled={current === 0}
          onClick={() => setCurrent((i) => Math.max(0, i - 1))}
          className="btn btn-ghost"
          style={{ fontFamily: "var(--font-apple), sans-serif" }}
        >
          ← Previous
        </button>
        <div className="flex gap-2.5 items-center">
          {current < questions.length - 1 ? (
            <button onClick={() => setCurrent((i) => i + 1)} className="btn btn-ghost" style={{ fontFamily: "var(--font-apple), sans-serif" }}>
              Next →
            </button>
          ) : null}
          <button
            disabled={submitting}
            onClick={() => void submit()}
            className="btn btn-primary"
            style={{ borderRadius: 999, fontFamily: "var(--font-apple), sans-serif" }}
          >
            {submitting ? "Submitting…" : "Finish & submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

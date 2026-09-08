"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Timer } from "lucide-react";
import { Wordmark } from "@/components/HexLogo";
import { CodeText } from "@/components/CodeText";
import { playQuiz } from "@/lib/mock";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { getGuestSessionId, saveStartPayload } from "@/lib/guest-session";
import { setCachedResult } from "@/lib/result-cache";
import type { AttemptResultDto, QuizDto, StartAttemptResponse, SubmitAnswerDto } from "@/lib/types";

export const dynamic = "force-dynamic";

function TimerRing({ remainingSec, totalSec }: { remainingSec: number; totalSec: number }) {
  const dash = 2 * Math.PI * 22;
  const safeTotal = Number.isFinite(totalSec) && totalSec > 0 ? totalSec : 1;
  const safeRemaining = Number.isFinite(remainingSec) ? Math.min(Math.max(remainingSec, 0), safeTotal) : safeTotal;
  const pct = safeRemaining / safeTotal;
  return (
    <div className="relative w-14 h-14">
      <svg viewBox="0 0 50 50" className="w-14 h-14 -rotate-90">
        <circle cx="25" cy="25" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
        <circle cx="25" cy="25" r="22" fill="none" stroke="url(#tg)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={String(dash * (1 - pct))} />
        <defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#A78BFA" /><stop offset="1" stopColor="#7FE7CE" /></linearGradient></defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center font-mono text-[11px] text-white">{Math.floor(safeRemaining / 60)}m</div>
    </div>
  );
}

const cap = (s: string) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : s);

export default function QuizPlay() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const isCustom = id === "custom";
  const numericId = /^\d+$/.test(id ?? "");

  // Stable guest session (backend requires a UUID for guest attempts).
  const [gsid, setGsid] = useState<string | null>(null);
  useEffect(() => {
    try { setGsid(getGuestSessionId()); } catch { setGsid(null); }
  }, []);

  // --- Legacy paths (unchanged): /build custom quiz via sessionStorage, mock q* quizzes ---
  const [baseQuiz] = useState<any>(() => {
    if (isCustom && typeof window !== "undefined") {
      try {
        const stored = JSON.parse(sessionStorage.getItem("custom-quiz") || "null");
        if (stored?.questions?.length) return stored;
      } catch { /* fall through to default */ }
    }
    return playQuiz;
  });
  const [notice] = useState(() => {
    if (!isCustom || typeof window === "undefined") return "";
    const n = sessionStorage.getItem("custom-quiz-notice") || "";
    sessionStorage.removeItem("custom-quiz-notice");
    return n;
  });

  // --- Live backend attempt (numeric quiz ids): detail for meta, start for questions ---
  const detailQ = useQuery({
    queryKey: ["quiz", id],
    queryFn: () => api<QuizDto>(`/api/quizzes/${id}`, { auth: false }),
    enabled: numericId,
    retry: false,
    staleTime: Infinity,
  });
  // POST once per (quiz, identity): staleTime Infinity + stable key dedupes StrictMode remounts.
  const startQ = useQuery({
    queryKey: ["attempt-start", id, user?.id ?? "guest"],
    queryFn: () =>
      api<StartAttemptResponse>(`/api/quizzes/${id}/start`, {
        method: "POST",
        auth: Boolean(user),
        body: user ? {} : { guestSessionId: gsid },
      }),
    enabled: numericId && (Boolean(user) || gsid !== null),
    retry: false,
    staleTime: Infinity,
  });

  const liveQuiz = useMemo(() => {
    const s = startQ.data;
    if (!s) return null;
    const d = detailQ.data;
    return {
      id: `live-${s.attemptId}`,
      attemptId: s.attemptId as number,
      title: s.quizTitle,
      level: d ? cap(d.difficulty) : "",
      cat: d?.categoryName ?? "",
      totalMinutes: Math.max(1, Math.round(s.timeLimitSec / 60)),
      expiresAt: s.expiresAt as string | undefined,
      perQuestionTimeSec: s.perQuestionTimeSec,
      questions: s.questions.map((q) => ({
        id: q.questionId,
        prompt: q.questionText,
        options: q.options.map((o) => o.optionText),
        optIds: q.options.map((o) => o.optionId),
      })),
    };
  }, [startQ.data, detailQ.data]);

  // Cache the start payload so /results can map option ids back to text.
  const savedRef = useRef<number | null>(null);
  useEffect(() => {
    const s = startQ.data;
    if (s && savedRef.current !== s.attemptId) {
      savedRef.current = s.attemptId;
      try { saveStartPayload(s); } catch {}
    }
  }, [startQ.data]);

  // Live quiz wins when the backend answers; otherwise legacy base (mock/custom).
  // A failed start (backend down / quiz gone) falls back to the mock demo.
  const quiz: any = liveQuiz ?? baseQuiz;
const total = quiz.questions.length;
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Per-question timer: seconds per question for live room sync.
  // When perQuestionTimeSec > 0 (from backend), each question gets this many seconds.
  // When 0/missing, fall back to total time divided by question count.
  const rawPerQ = liveQuiz?.perQuestionTimeSec;
  const perQuestionTimeSec = Number.isFinite(rawPerQ) && (rawPerQ as number) > 0
    ? Math.max(1, Math.floor(rawPerQ as number))
    : Math.max(1, Math.floor((quiz.totalMinutes * 60) / Math.max(1, quiz.questions.length)));

  // Current question's remaining time (countdown, in whole seconds).
  const [qSeconds, setQSeconds] = useState(perQuestionTimeSec);

  // Reset quiz state exactly once when a new live attempt starts.
  // NOTE: this must NOT depend on idx/total — otherwise every question
  // navigation would wipe the user's selected answers (data-loss bug).
  const attemptId = liveQuiz?.attemptId ?? null;
  useEffect(() => {
    if (attemptId == null) return;
    setIdx(0);
    setAnswers({});
    setQSeconds(perQuestionTimeSec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  // Reset the per-question countdown whenever the question changes
  // or the backend-provided per-question budget arrives.
  useEffect(() => {
    setQSeconds(perQuestionTimeSec);
  }, [idx, perQuestionTimeSec]);

  // Single 1s ticker. Cleans up on question change/unmount/submit.
  const timerDone = qSeconds <= 0;
  useEffect(() => {
    if (submitting) return;
    if (timerDone) return;
    const id = setInterval(() => {
      setQSeconds((s: number) => (Number.isFinite(s) && s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [idx, perQuestionTimeSec, submitting, timerDone]);

  // Auto-advance question when per-question timer reaches 0.
  useEffect(() => {
    if (qSeconds <= 0 && idx < total - 1) {
      const nextId = setTimeout(() => setIdx(idx + 1), 500);
      return () => clearTimeout(nextId);
    }
  }, [qSeconds, idx, total]);

  const cur: any = quiz.questions[idx];
  const answered = Object.keys(answers).length;
  const safeQSeconds = Number.isFinite(qSeconds) && qSeconds >= 0 ? Math.floor(qSeconds) : 0;
  const mm = Math.floor(safeQSeconds / 60), ss = safeQSeconds % 60;

  const submit = async () => {
    setSubmitError(null);
    // Live path: grade server-side, then show the attempt result.
    if (quiz.attemptId) {
      const payloadAnswers: SubmitAnswerDto[] = quiz.questions
        .filter((q: any) => answers[q.id] !== undefined)
        .map((q: any) => ({ questionId: q.id, selectedOptionIds: [q.optIds[answers[q.id]]] }));
      setSubmitting(true);
      try {
        const res = await api<AttemptResultDto>(`/api/attempts/${quiz.attemptId}/submit`, {
          method: "POST",
          auth: Boolean(user),
          body: user ? { answers: payloadAnswers } : { guestSessionId: gsid, answers: payloadAnswers },
        });
        setCachedResult(String(quiz.attemptId), res);
        router.push(`/results/${quiz.attemptId}`);
      } catch (e: any) {
        setSubmitError(e?.message || "Submit failed — try again");
      } finally {
        setSubmitting(false);
      }
      return;
    }
    // Legacy client-side grading (custom builds + mock demo).
    const correct = quiz.questions.filter((q: any) => answers[q.id] === q.answer).length;
    try {
      sessionStorage.setItem(`result-${id || quiz.id}`, JSON.stringify({ correct, total, answers, quiz }));
    } catch {}
    router.push(`/results/${id || quiz.id}`);
  };

  const chooseKey = (k: string) => {
    if (!cur) return;
    const map: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
    const v = map[k.toLowerCase()];
    if (v !== undefined && v < cur.options.length) setAnswers((a) => ({ ...a, [cur.id]: v }));
  };

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (['a','b','c','d','A','B','C','D'].includes(e.key)) chooseKey(e.key);
      if (e.key === 'Escape') router.push('/practice');
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, total, cur]);

  const progressPct = useMemo(() => ((idx + 1) / total) * 100, [idx, total]);

  // Numeric id still starting the attempt: loading shell (same visual language).
  if (numericId && !liveQuiz && !startQ.isError) {
    return (
      <main className="relative min-h-screen bg-[color:var(--bg)]" data-testid="play-main">
        <div className="sticky top-0 z-40 backdrop-blur-md bg-[color:var(--bg)]/70 border-b border-white/[0.05]">
          <div className="mx-auto max-w-[1100px] px-6 md:px-10 h-16 flex items-center justify-between">
            <Link href="/practice"><Wordmark size={22} /></Link>
          </div>
        </div>
        <div className="mx-auto max-w-[1100px] px-6 md:px-10 pt-10 pb-16 animate-pulse">
          <div className="h-8 w-64 rounded-full bg-white/[0.06]" />
          <div className="mt-6 rounded-3xl glass p-8 md:p-10">
            <div className="h-9 w-3/4 rounded-xl bg-white/[0.06]" />
            <div className="mt-4 h-9 w-1/2 rounded-xl bg-white/[0.04]" />
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="mt-3 h-[76px] rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[color:var(--bg)]" data-testid="play-main">
      <div className="sticky top-0 z-40 backdrop-blur-md bg-[color:var(--bg)]/70 border-b border-white/[0.05]">
        <div className="mx-auto max-w-[1100px] px-6 md:px-10 h-16 flex items-center justify-between">
          <Link href="/practice"><Wordmark size={22} /></Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-6 md:px-10 pt-10 pb-16">
        {notice && (
          <div className="mb-6 rounded-xl border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/[0.06] px-4 py-3 text-[13px] text-[color:var(--gold)]" data-testid="quiz-shortfall-notice">
            {notice}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={()=>router.back()} className="w-9 h-9 rounded-full glass grid place-items-center hover:bg-white/[0.06] transition-colors" data-testid="play-back">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-[color:var(--violet)]/15 text-[color:var(--violet-2)] border border-[color:var(--violet)]/25">{quiz.title}</span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono text-[color:var(--mint)] border border-[color:var(--mint)]/30">{quiz.level}</span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono border border-white/10 text-[color:var(--ink-2)]">{quiz.cat}</span>
            <span className="hidden md:inline-flex ml-2 font-mono text-[11px] text-[color:var(--mute)]">{answered}/{total} answered</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="font-mono text-[16px] text-white tabular-nums flex items-center gap-2"><Timer className="w-4 h-4 text-[color:var(--violet-2)]" />{String(mm).padStart(2,'0')}:{String(ss).padStart(2,'0')}</div>
            <TimerRing remainingSec={qSeconds} totalSec={perQuestionTimeSec} />
          </div>
        </div>

        <div className="mt-4 h-[3px] w-full bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div className="h-full" style={{ background: 'linear-gradient(90deg,#A78BFA,#7FE7CE)' }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} />
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {quiz.questions.map((_: any, i: number) => (
              <button key={i} onClick={()=>setIdx(i)} data-testid={`qnav-${i+1}`} className={`min-w-[36px] h-9 px-2 rounded-lg text-[12.5px] font-mono transition-colors border ${i === idx ? 'bg-[color:var(--violet)] text-white border-transparent' : answers[quiz.questions[i].id] !== undefined ? 'bg-white/[0.08] text-white border-white/10' : 'bg-transparent text-[color:var(--ink-2)] border-white/10 hover:border-white/25'}`}>{i+1}</button>
            ))}
          </div>
          <div className="font-mono text-[12px] text-[color:var(--mute)]">Q {idx+1} / {total}</div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={cur.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }} className="mt-6 rounded-3xl glass p-8 md:p-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-[color:var(--violet)]/15 text-[color:var(--violet-2)] border border-[color:var(--violet)]/25">Single answer</span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono border border-white/10 text-[color:var(--ink-2)]">1 pt</span>
            </div>
            <div className="mt-6 font-display text-[32px] md:text-[38px] leading-[1.15] text-white"><CodeText text={cur.prompt} /></div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-5 grid grid-cols-1 gap-3">
          {cur.options.map((opt: string, i: number) => {
            const selected = answers[cur.id] === i;
            const letter = ['A','B','C','D'][i];
            return (
              <button key={i} onClick={()=>setAnswers((a) => ({ ...a, [cur.id]: i }))} data-testid={`option-${letter}`}
                className={`group text-left px-5 py-4 rounded-2xl border transition-all flex items-center gap-4 ${selected ? 'border-[color:var(--violet)]/60 bg-[color:var(--violet)]/[0.08]' : 'border-white/[0.06] hover:border-white/20 bg-white/[0.02]'}`}>
                <div className={`w-9 h-9 rounded-lg grid place-items-center font-mono text-[13px] shrink-0 transition-colors ${selected ? 'bg-[color:var(--violet)] text-white' : 'bg-white/[0.06] text-[color:var(--ink-2)]'}`}>{letter}</div>
                <div className="text-[16px] text-white"><CodeText text={opt} /></div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center gap-3 font-mono text-[11.5px] text-[color:var(--mute)]">
          <span className="px-2 py-0.5 rounded border border-white/10 text-white/70">A</span><span>Select</span>
          <span className="ml-2 px-2 py-0.5 rounded border border-white/10 text-white/70">Enter</span><span>Next</span>
          <span className="ml-2 px-2 py-0.5 rounded border border-white/10 text-white/70">Esc</span><span>Exit</span>
        </div>

        {submitError && (
          <p className="mt-6 text-[13px] text-red-400" role="alert" data-testid="play-submit-error">{submitError}</p>
        )}

        <div className="mt-10 flex items-center justify-between">
          <button onClick={()=>setIdx((i)=>Math.max(0, i-1))} disabled={idx===0} data-testid="play-prev" className="px-4 py-2.5 rounded-full glass glass-hover text-[13.5px] text-white disabled:opacity-40 disabled:cursor-not-allowed">← Previous</button>
          <div className="flex items-center gap-3">
            {idx < total - 1 ? (
              <button onClick={()=>setIdx((i)=>Math.min(total-1, i+1))} data-testid="play-next" className="px-4 py-2.5 rounded-full glass glass-hover text-[13.5px] text-white">Next →</button>
            ) : null}
            {idx >= total - 1 ? (
              <button onClick={submit} disabled={submitting} data-testid="play-submit" className="px-5 py-2.5 rounded-full bg-[color:var(--violet)] hover:bg-[color:var(--violet-2)] text-white text-[13.5px] font-medium transition-colors disabled:opacity-60">{submitting ? "Submitting…" : "Finish & submit"}</button>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

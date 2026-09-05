"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Sparkles, Share2, RotateCw } from "lucide-react";
import Aurora from "@/components/Aurora";
import { Wordmark } from "@/components/HexLogo";
import { Eyebrow, FadeUp } from "@/components/Reveal";
import { playQuiz } from "@/lib/mock";

export const dynamic = "force-dynamic";

export default function QuizResults() {
  const { id } = useParams<{ id: string }>();
  const stored: any = useMemo(() => {
    try {
      if (typeof window === "undefined") return null;
      return JSON.parse(sessionStorage.getItem(`result-${id}`) || 'null');
    } catch { return null; }
  }, [id]);
  const quiz: any = stored?.quiz || playQuiz;
  const total = quiz.questions.length;
  const correct = stored?.correct ?? 0;
  const answers: Record<number, number> = stored?.answers || {};
  const pct = Math.round((correct / total) * 100);

  const band = pct >= 80 ? { c: '#7FE7CE', l: 'You shipped it.' } : pct >= 60 ? { c: '#F5C775', l: 'Solid rep.' } : { c: '#FF9E7A', l: 'Reload the drills.' };

  return (
    <main className="relative min-h-screen bg-[color:var(--bg)]" data-testid="results-main">
      <div className="sticky top-0 z-40 backdrop-blur-md bg-[color:var(--bg)]/70 border-b border-white/[0.05]">
        <div className="mx-auto max-w-[1100px] px-6 md:px-10 h-16 flex items-center justify-between">
          <Link href="/"><Wordmark size={22} /></Link>
          <Link href="/practice" className="text-[13.5px] text-[color:var(--ink-2)] hover:text-white transition-colors">Back to practice →</Link>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <Aurora variant="soft" />
        <div className="relative mx-auto max-w-[1100px] px-6 md:px-10 pt-16 pb-10">
          <FadeUp><Eyebrow>Result · {quiz.title}</Eyebrow></FadeUp>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            <div className="md:col-span-7">
              <FadeUp delay={0.1}>
                <h1 className="font-display text-[64px] md:text-[88px] leading-[0.92] text-white">
                  <span style={{ color: band.c }}>{pct}%</span> — <span className="italic text-[color:var(--ink-2)]">{band.l}</span>
                </h1>
              </FadeUp>
              <FadeUp delay={0.2} className="mt-6 text-[16px] text-[color:var(--ink-2)] max-w-[560px]">You answered <span className="text-white font-medium">{correct}</span> of {total} correct. See the breakdown below and re-run the weak spots.</FadeUp>
              <FadeUp delay={0.3} className="mt-8 flex flex-wrap items-center gap-3">
                <Link href={`/play/${id}`} className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[color:var(--violet)] hover:bg-[color:var(--violet-2)] text-white text-[13.5px] font-medium transition-colors" data-testid="results-retry"><RotateCw className="w-4 h-4" /> Try again</Link>
                <Link href="/practice" className="inline-flex items-center gap-2 px-5 py-3 rounded-full glass glass-hover text-[13.5px] text-white" data-testid="results-more">Explore more quizzes</Link>
                <button className="inline-flex items-center gap-2 px-5 py-3 rounded-full glass glass-hover text-[13.5px] text-white" data-testid="results-share"><Share2 className="w-4 h-4" /> Share result</button>
              </FadeUp>
            </div>

            <div className="md:col-span-5">
              <div className="rounded-3xl glass p-8">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full grid place-items-center" style={{ background: `radial-gradient(circle, ${band.c}55, transparent 70%)` }}><Sparkles className="w-5 h-5" style={{ color: band.c }} /></div>
                  <div>
                    <div className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-[color:var(--mute)]">Score</div>
                    <div className="font-display text-[26px] text-white">{correct} / {total}</div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[{ n: total, l: 'questions' },{ n: correct, l: 'correct' },{ n: total - correct, l: 'to review' }].map((s,i)=>(
                    <div key={i} className="rounded-xl border border-white/[0.06] p-3">
                      <div className="font-display text-[24px] text-white leading-none">{s.n}</div>
                      <div className="mt-1 font-mono text-[10px] tracking-[0.16em] uppercase text-[color:var(--mute)]">{s.l}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.1, ease: [0.16,1,0.3,1] }} className="h-full" style={{ background: band.c }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-6 md:px-10 pb-24">
        <div className="mt-4 rounded-3xl glass overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
            <div className="font-display text-[22px] text-white">Question breakdown</div>
            <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-[color:var(--mute)]">answered · your pick · correct</div>
          </div>
          {quiz.questions.map((q: any, i: number) => {
            const picked: number | undefined = answers[q.id];
            const right = picked === q.answer;
            return (
              <div key={q.id} className="px-6 py-5 border-b border-white/[0.04] last:border-b-0 grid grid-cols-12 gap-4 items-start">
                <div className="col-span-1 font-mono text-[13px] text-[color:var(--mute)]">#{i+1}</div>
                <div className="col-span-8">
                  <div className="text-[15.5px] text-white">{q.prompt}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[11.5px] text-[color:var(--ink-2)]">
                    <span className="px-2 py-0.5 rounded border border-white/10">picked: <span className="text-white">{picked !== undefined ? q.options[picked] : '—'}</span></span>
                    <span className="px-2 py-0.5 rounded border border-[color:var(--mint)]/30 text-[color:var(--mint)]">correct: {q.options[q.answer]}</span>
                  </div>
                </div>
                <div className="col-span-3 flex justify-end">
                  {picked === undefined ? (
                    <span className="text-[color:var(--mute)] text-[13px]">skipped</span>
                  ) : right ? (
                    <span className="inline-flex items-center gap-1.5 text-[color:var(--mint)] text-[13px]"><CheckCircle2 className="w-4 h-4" /> correct</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[color:var(--coral)] text-[13px]"><XCircle className="w-4 h-4" /> wrong</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

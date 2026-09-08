"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Sparkles } from "lucide-react";
import Aurora from "@/components/Aurora";
import { Eyebrow, FadeUp, RevealHeading } from "@/components/Reveal";
import { categories, questionPool, buildableCategories } from "@/lib/mock";

const COUNTS = [5, 8, 10, 15];
const TIME_PER_Q = [20, 30, 45, 60];
const DIFFICULTIES = ['Mixed', 'Beginner', 'Intermediate', 'Advanced'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function BuildQuiz() {
  const router = useRouter();
  const [categorySlug, setCategorySlug] = useState('mixed');
  const [count, setCount] = useState(8);
  const [secondsPerQ, setSecondsPerQ] = useState(30);
  const [difficulty, setDifficulty] = useState('Mixed');
  const [error, setError] = useState('');

  const categoryLabel = categorySlug === 'mixed'
    ? 'Mixed'
    : categories.find((c) => c.slug === categorySlug)?.name || categorySlug;

  const buildPool = () => {
    const pools = categorySlug === 'mixed'
      ? buildableCategories.flatMap((slug) => questionPool[slug])
      : (questionPool[categorySlug] || []);
    return difficulty === 'Mixed' ? pools : pools.filter((q) => q.difficulty === difficulty);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const pool = buildPool();
    if (pool.length === 0) {
      setError('No questions match that combination yet — try Mixed difficulty or a different track.');
      return;
    }
    const picked = shuffle(pool).slice(0, Math.min(count, pool.length));
    const shortfall = count - picked.length;

    const quiz = {
      id: 'custom',
      title: `${categoryLabel} · ${difficulty}`,
      level: difficulty === 'Mixed' ? 'Mixed' : difficulty,
      cat: categoryLabel,
      totalMinutes: Math.ceil((picked.length * secondsPerQ) / 60),
      questions: picked.map((q, i) => ({ id: i + 1, prompt: q.prompt, options: q.options, answer: q.answer })),
    };

    try {
      sessionStorage.setItem('custom-quiz', JSON.stringify(quiz));
      if (shortfall > 0) {
        sessionStorage.setItem('custom-quiz-notice', `Only ${picked.length} question(s) were available for this combination — showing all of them instead of ${count}.`);
      } else {
        sessionStorage.removeItem('custom-quiz-notice');
      }
    } catch {}
    router.push('/play/custom');
  };

  return (
      <main className="relative pt-36 pb-24" data-testid="build-main">
        <Aurora variant="soft" />
        <div className="relative mx-auto max-w-[900px] px-6 md:px-10" style={{ maxWidth: 900 }}>
          <FadeUp><Eyebrow>Build</Eyebrow></FadeUp>
          <RevealHeading delay={0.1} lines={['Build your <span class="italic text-[color:var(--ink-2)]">own</span> quiz.']} className="mt-6 font-display text-[52px] md:text-[72px] leading-[0.95] text-white" />
        <FadeUp delay={0.3} className="mt-6 max-w-[560px] text-[16px] text-[color:var(--ink-2)]">
          Pick a track, a difficulty mix, and how many questions you want — we&apos;ll put together a quiz on the spot from the question bank.
        </FadeUp>

        <FadeUp delay={0.4} className="mt-10">
          <form onSubmit={submit} className="rounded-2xl glass p-8 space-y-6">
            <div>
              <label className="block text-[13.5px] text-white mb-2">Track</label>
              <div className="relative">
                <select value={categorySlug} onChange={(e)=>setCategorySlug(e.target.value)} data-testid="build-category"
                  className="appearance-none w-full pl-4 pr-10 py-3.5 rounded-xl glass text-[14px] text-white outline-none cursor-pointer">
                  <option value="mixed" className="bg-[#0D0D12]">Mixed — sample across all tracks</option>
                  {categories.filter(c => buildableCategories.includes(c.slug)).map((c) => (
                    <option key={c.slug} value={c.slug} className="bg-[#0D0D12]">{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--mute)] pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[13.5px] text-white mb-2">Questions</label>
                <div className="relative">
                  <select value={count} onChange={(e)=>setCount(Number(e.target.value))} data-testid="build-count" className="appearance-none w-full pl-4 pr-10 py-3.5 rounded-xl glass text-[14px] text-white outline-none cursor-pointer">
                    {COUNTS.map((n) => <option key={n} value={n} className="bg-[#0D0D12]">{n}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--mute)] pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[13.5px] text-white mb-2">Time / question</label>
                <div className="relative">
                  <select value={secondsPerQ} onChange={(e)=>setSecondsPerQ(Number(e.target.value))} data-testid="build-time" className="appearance-none w-full pl-4 pr-10 py-3.5 rounded-xl glass text-[14px] text-white outline-none cursor-pointer">
                    {TIME_PER_Q.map((s) => <option key={s} value={s} className="bg-[#0D0D12]">{s}s</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--mute)] pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[13.5px] text-white mb-2">Difficulty</label>
                <div className="relative">
                  <select value={difficulty} onChange={(e)=>setDifficulty(e.target.value)} data-testid="build-difficulty" className="appearance-none w-full pl-4 pr-10 py-3.5 rounded-xl glass text-[14px] text-white outline-none cursor-pointer">
                    {DIFFICULTIES.map((d) => <option key={d} value={d} className="bg-[#0D0D12]">{d}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--mute)] pointer-events-none" />
                </div>
              </div>
            </div>

            {error && <p className="text-[13px] text-[color:var(--coral)]" data-testid="build-error">{error}</p>}

            <button type="submit" data-testid="build-generate-btn"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[color:var(--violet)]/90 hover:bg-[color:var(--violet-2)] text-white text-[14px] font-medium transition-all">
              <Sparkles className="w-4 h-4" /> Build my quiz
            </button>
          </form>
        </FadeUp>
      </div>
      </main>
  );
}

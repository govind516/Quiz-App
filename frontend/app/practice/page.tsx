"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Heart, ChevronDown, ArrowUpRight } from "lucide-react";
import Aurora from "@/components/Aurora";
import { Eyebrow, FadeUp, RevealHeading } from "@/components/Reveal";
import { quizzes, categories } from "@/lib/mock";

const levels = ["All levels", "Beginner", "Intermediate", "Advanced"];

function Chip({ active, children, onClick, testId }: { active: boolean; children: React.ReactNode; onClick: () => void; testId?: string }) {
  return (
    <button onClick={onClick} data-testid={testId}
      className={`px-3.5 py-1.5 rounded-full text-[12.5px] transition-all border ${active ? 'bg-white text-[#0A0A0F] border-white' : 'text-[color:var(--ink-2)] border-white/10 hover:text-white hover:border-white/25'}`}>
      {children}
    </button>
  );
}

export default function Practice() {
  const [cat, setCat] = useState("All");
  const [level, setLevel] = useState("All levels");
  const [q, setQ] = useState("");
  const [favs, setFavs] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => quizzes.filter((it) => {
    if (cat !== "All" && it.cat !== cat) return false;
    if (level !== "All levels" && it.level !== level) return false;
    if (q && !(`${it.title} ${it.desc}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }), [cat, level, q]);

  const cats = ["All", ...categories.map((c) => c.name)];

  return (
    <main className="relative pt-36 pb-24" data-testid="practice-main">
      <Aurora variant="soft" />
      <div className="relative mx-auto max-w-[1400px] px-6 md:px-10">
        <FadeUp><Eyebrow>Practice</Eyebrow></FadeUp>
        <RevealHeading delay={0.1} lines={['Pick your <span class="italic text-[color:var(--ink-2)]">quiz</span>.']} className="mt-6 font-display text-[64px] md:text-[92px] leading-[0.92] text-white" />
        <FadeUp delay={0.35} className="mt-6 max-w-[560px] text-[16px] text-[color:var(--ink-2)]">Filter by track and difficulty. No account required to play — sign in only if you want the streaks.</FadeUp>

        <FadeUp delay={0.5} className="mt-12 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-[380px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--mute)]" />
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search quizzes…" data-testid="practice-search"
              className="w-full pl-11 pr-4 py-3 rounded-full glass text-[13.5px] outline-none placeholder:text-[color:var(--mute)] focus:border-[color:var(--violet)]/40 transition-colors" />
          </div>
          <div className="relative">
            <select value={level} onChange={(e)=>setLevel(e.target.value)} data-testid="practice-level"
              className="appearance-none pl-4 pr-10 py-3 rounded-full glass text-[13.5px] text-white outline-none cursor-pointer">
              {levels.map((l) => <option key={l} className="bg-[#0D0D12]">{l}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--mute)] pointer-events-none" />
          </div>
        </FadeUp>

        <FadeUp delay={0.6} className="mt-6 flex flex-wrap items-center gap-2">
          {cats.map((c) => <Chip key={c} active={cat === c} onClick={()=>setCat(c)} testId={`chip-${c}`}>{c}</Chip>)}
        </FadeUp>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((it, i) => (
              <motion.div key={it.id} layout initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12, scale: 0.98 }} transition={{ duration: 0.55, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }} className="group relative rounded-2xl glass glass-hover p-6 h-full" data-testid={`quiz-card-${it.id}`}>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-[color:var(--violet)]/15 text-[color:var(--violet-2)] border border-[color:var(--violet)]/25">{it.cat}</span>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono border ${it.level === 'Advanced' ? 'text-[color:var(--coral)] border-[color:var(--coral)]/30' : it.level === 'Intermediate' ? 'text-[color:var(--gold)] border-[color:var(--gold)]/30' : 'text-[color:var(--mint)] border-[color:var(--mint)]/30'}`}>{it.level}</span>
                </div>
                <div className="mt-5 font-display text-[26px] leading-tight text-white">{it.title}</div>
                <div className="mt-2 text-[14px] text-[color:var(--ink-2)] leading-relaxed line-clamp-2">{it.desc}</div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="font-mono text-[11.5px] text-[color:var(--mute)]">{it.q} Qs · {it.min} min</span>
                  <div className="flex items-center gap-2">
                    <button aria-label="favourite" onClick={()=>setFavs((f)=>({ ...f, [it.id]: !f[it.id] }))} data-testid={`fav-${it.id}`} className="w-8 h-8 rounded-full grid place-items-center hover:bg-white/[0.06] transition-colors">
                      <Heart className={`w-4 h-4 transition-all ${favs[it.id] ? 'fill-[color:var(--coral)] text-[color:var(--coral)]' : 'text-white/40'}`} />
                    </button>
                    <Link href={`/play/${it.id}`} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[12.5px] text-white border border-white/10 transition-colors" data-testid={`start-${it.id}`}>
                      Start <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <FadeUp className="mt-16 text-center">
            <div className="font-display text-[28px] text-white">Nothing matches yet.</div>
            <div className="mt-2 text-[color:var(--ink-2)]">Loosen a filter or search for something else.</div>
          </FadeUp>
        )}
      </div>
    </main>
  );
}

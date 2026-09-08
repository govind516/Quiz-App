"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Heart, ChevronDown, ChevronLeft, ArrowUpRight } from "lucide-react";
import Aurora from "@/components/Aurora";
import { Eyebrow, FadeUp, RevealHeading } from "@/components/Reveal";
import { Hex } from "@/components/Hex";
import { useLiveQuizzes, type CardQuiz } from "@/lib/live-quizzes";
import { categories as categoryMeta } from "@/lib/mock";

const levels = ["All levels", "Beginner", "Intermediate", "Advanced"];
const LEVEL_ORDER = ["Beginner", "Intermediate", "Advanced"];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

function Chip({ active, children, onClick, testId }: { active: boolean; children: React.ReactNode; onClick: () => void; testId?: string }) {
  return (
    <button onClick={onClick} data-testid={testId}
      className={`px-3.5 py-1.5 rounded-full text-[12.5px] transition-all border ${active ? 'bg-white text-[#0A0A0F] border-white' : 'text-[color:var(--ink-2)] border-white/10 hover:text-white hover:border-white/25'}`}>
      {children}
    </button>
  );
}

function TopicCard({ name, quizzes, onSelect, index }: { name: string; quizzes: CardQuiz[]; onSelect: () => void; index: number }) {
  const meta = categoryMeta.find((c) => c.name === name);
  const color = meta?.color ?? "#A78BFA";
  const hint = meta?.hint ?? "";
  const presentLevels = LEVEL_ORDER.filter((l) => quizzes.some((q) => q.level === l));
  const totalQ = quizzes.reduce((s, q) => s + q.q, 0);
  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      onClick={onSelect}
      data-testid={`topic-card-${slugify(name)}`}
      className="group block relative rounded-2xl glass glass-hover p-6 h-[180px] overflow-hidden text-left w-full cursor-pointer"
    >
      <div className="absolute -right-8 -top-8 opacity-20 group-hover:opacity-45 transition-opacity duration-500"><Hex size={130} color={color} /></div>
      <div className="relative flex flex-col h-full justify-between">
        <div className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)]"><span className="h-1 w-1 rounded-full" style={{ background: color }} />track</div>
        <div>
          <div className="font-display text-[28px] leading-tight text-white">{name}</div>
          <div className="mt-1 text-[13px] text-[color:var(--ink-2)]">{hint || `${totalQ} questions`}</div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] text-[color:var(--mute)] truncate">{presentLevels.join(" · ") || `${quizzes.length} quizzes`}</span>
          <ArrowUpRight className="w-4 h-4 shrink-0 text-white/40 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>
      </div>
    </motion.button>
  );
}

function QuizCard({ it, fav, onFav }: { it: CardQuiz; fav: boolean; onFav: () => void }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12, scale: 0.98 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }} className="group relative rounded-2xl glass glass-hover p-6 h-full" data-testid={`quiz-card-${it.id}`}>
      <div className="flex items-center gap-2">
        <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-[color:var(--violet)]/15 text-[color:var(--violet-2)] border border-[color:var(--violet)]/25">{it.cat}</span>
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono border ${it.level === 'Advanced' ? 'text-[color:var(--coral)] border-[color:var(--coral)]/30' : it.level === 'Intermediate' ? 'text-[color:var(--gold)] border-[color:var(--gold)]/30' : 'text-[color:var(--mint)] border-[color:var(--mint)]/30'}`}>{it.level}</span>
      </div>
      <div className="mt-5 font-display text-[26px] leading-tight text-white">{it.title}</div>
      <div className="mt-2 text-[14px] text-[color:var(--ink-2)] leading-relaxed line-clamp-2">{it.desc}</div>
      <div className="mt-6 flex items-center justify-between">
        <span className="font-mono text-[11.5px] text-[color:var(--mute)]">{it.q} Qs · {it.min} min</span>
        <div className="flex items-center gap-2">
          <button aria-label="favourite" onClick={onFav} data-testid={`fav-${it.id}`} className="w-8 h-8 rounded-full grid place-items-center hover:bg-white/[0.06] transition-colors">
            <Heart className={`w-4 h-4 transition-all ${fav ? 'fill-[color:var(--coral)] text-[color:var(--coral)]' : 'text-white/40'}`} />
          </button>
          <Link href={`/play/${it.id}`} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[12.5px] text-white border border-white/10 transition-colors" data-testid={`start-${it.id}`}>
            Start <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function Practice() {
  const [cat, setCat] = useState("All");
  const [level, setLevel] = useState("All levels");
  const [q, setQ] = useState("");
  const [favs, setFavs] = useState<Record<string, boolean>>({});

  // Live backend quizzes (30 fresh), mock fallback when backend is down.
  const { quizzes, isPending } = useLiveQuizzes();

  const filtered = useMemo(() => quizzes.filter((it) => {
    if (cat !== "All" && it.cat !== cat) return false;
    if (level !== "All levels" && it.level !== level) return false;
    if (q && !(`${it.title} ${it.desc}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }), [quizzes, cat, level, q]);

  const cats = useMemo(() => ["All", ...Array.from(new Set(quizzes.map((c) => c.cat)))], [quizzes]);

  // Deep-link support: /practice?cat=<slug> (e.g. from the home page tracks)
  // preselects the matching category filter so users don't pick it twice.
  const catParamApplied = useRef(false);
  useEffect(() => {
    if (catParamApplied.current || typeof window === "undefined") return;
    if (cats.length <= 1) return; // quizzes not loaded yet
    let slug: string | null = null;
    try {
      slug = new URLSearchParams(window.location.search).get("cat");
    } catch { slug = null; }
    if (!slug) return;
    const match = cats.find((c) => c !== "All" && slugify(c) === slugify(slug));
    if (match) {
      catParamApplied.current = true;
      setCat(match);
    }
  }, [cats]);

  // Default view (no search, no filters): 10 topic cards instead of a 30-card wall.
  // Searching or filtering drops into the flat quiz-card list.
  const showTopics = !isPending && !q && cat === "All" && level === "All levels";
  const topics = useMemo(
    () => Array.from(new Set(quizzes.map((c) => c.cat))).map((name) => ({
      name,
      quizzes: quizzes.filter((t) => t.cat === name),
    })),
    [quizzes]
  );

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

        {isPending ? (
          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl glass p-6 h-[180px] animate-pulse">
                <div className="h-5 w-24 rounded-full bg-white/[0.06]" />
                <div className="mt-5 h-7 w-3/4 rounded-lg bg-white/[0.06]" />
                <div className="mt-2 h-4 w-full rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
        ) : showTopics ? (
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="topic-grid">
            {topics.map((t, i) => (
              <TopicCard key={t.name} name={t.name} quizzes={t.quizzes} index={i} onSelect={() => setCat(t.name)} />
            ))}
          </div>
        ) : (
        <>
          {cat !== "All" && !q && (
            <div className="mt-10 flex items-center gap-4">
              <button onClick={() => { setCat("All"); setLevel("All levels"); }} data-testid="back-to-tracks" className="inline-flex items-center gap-1.5 text-[13.5px] text-[color:var(--ink-2)] hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" /> All tracks
              </button>
              <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[color:var(--mute)]">{cat} · {filtered.length} {filtered.length === 1 ? "level" : "levels"}</span>
            </div>
          )}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filtered.map((it) => (
                <QuizCard key={it.id} it={it} fav={!!favs[it.id]} onFav={() => setFavs((f) => ({ ...f, [it.id]: !f[it.id] }))} />
              ))}
            </AnimatePresence>
          </div>
        </>
        )}

        {!isPending && !showTopics && filtered.length === 0 && (
          <FadeUp className="mt-16 text-center">
            <div className="font-display text-[28px] text-white">Nothing matches yet.</div>
            <div className="mt-2 text-[color:var(--ink-2)]">Loosen a filter or search for something else.</div>
          </FadeUp>
        )}
      </div>
    </main>
  );
}

"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Zap, ChevronDown } from "lucide-react";
import Aurora from "@/components/Aurora";
import { Eyebrow, FadeUp, RevealHeading } from "@/components/Reveal";
import { leaders, categories } from "@/lib/mock";

// Avatar sizes still scale down per rank for the podium look, but the card
// height is no longer a hardcoded pixel value. The previous version fixed
// each rank's card to a specific px height (280/220/190) independent of the
// content inside it — content sized correctly for rank 1 didn't actually fit
// inside rank 2 and 3's shorter cards, so the avatar circle got sliced by
// `overflow-hidden`. Letting height be intrinsic (content + padding, with a
// min-height only as a floor) means it can never be shorter than what's
// actually inside it, so this class of clipping bug can't recur even if
// avatar size, padding, or font sizes change later.
const AVATAR_SIZE: Record<number, number> = { 1: 112, 2: 84, 3: 72 };
const MIN_HEIGHT: Record<number, string> = { 1: "min-h-[260px]", 2: "min-h-[210px]", 3: "min-h-[190px]" };

function PodiumCard({ p, rank }: { p: (typeof leaders)[0] & { pts: number }; rank: 1 | 2 | 3 }) {
  const colors: Record<number, string> = { 1: "#F5C775", 2: "#C5C5D0", 3: "#D89B7B" };
  const orders: Record<number, string> = { 1: "md:order-2", 2: "md:order-1", 3: "md:order-3" };
  const size = AVATAR_SIZE[rank];
  return (
    <FadeUp delay={rank === 1 ? 0.1 : rank === 2 ? 0.2 : 0.3} className={`${orders[rank]} w-full`}>
      <div className={`relative rounded-3xl glass overflow-visible ${MIN_HEIGHT[rank]}`} style={{ borderColor: `${colors[rank]}30`, background: `linear-gradient(180deg, ${colors[rank]}10, transparent 80%)` }}>
        <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden rounded-3xl">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl" style={{ background: `${colors[rank]}40` }} />
        </div>
        <div className="relative flex flex-col items-center justify-end py-8 px-6">
          {rank === 1 && (
            <motion.div initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="absolute top-6">
              <Crown className="w-6 h-6" style={{ color: colors[1] }} />
            </motion.div>
          )}
          <div className="font-mono text-[11px] tracking-[0.22em] uppercase mb-3" style={{ color: colors[rank] }}>#{rank}</div>
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 + rank * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative shrink-0 rounded-full grid place-items-center font-display text-white mb-3"
            style={{
              width: size, height: size,
              fontSize: Math.round(size * 0.25),
              background: `radial-gradient(circle at 30% 30%, ${colors[rank]}55, rgba(255,255,255,0.04))`,
              border: `1.5px solid ${colors[rank]}70`,
            } as React.CSSProperties}
          >
            {p.initials}
          </motion.div>
          <div className="text-[16px] md:text-[18px] text-white">{p.name}</div>
          <div className="mt-1 font-display text-[24px]" style={{ color: colors[rank] }}>{p.pts.toLocaleString()}<span className="font-mono text-[11px] text-[color:var(--mute)] ml-1">pts</span></div>
        </div>
      </div>
    </FadeUp>
  );
}

export default function Leaderboard() {
  const [tab, setTab] = useState("Global");
  const [category, setCategory] = useState(categories[0].slug);

  // Each tab now actually drives a different sort/metric instead of just
  // toggling a visual pill with no effect on the data below it:
  //  - Global: all-time total points (leaders' natural order)
  //  - By category: points earned within the selected topic track
  //  - Weekly: points earned in the last 7 days
  const sorted = useMemo(() => {
    if (tab === "By category") {
      return [...leaders].sort((a, b) => (b.categoryPts[category] || 0) - (a.categoryPts[category] || 0));
    }
    if (tab === "Weekly") {
      return [...leaders].sort((a, b) => b.weeklyPts - a.weeklyPts);
    }
    return [...leaders].sort((a, b) => b.pts - a.pts);
  }, [tab, category]);

  const metricFor = (p: typeof leaders[0]) => {
    if (tab === "By category") return p.categoryPts[category] || 0;
    if (tab === "Weekly") return p.weeklyPts;
    return p.pts;
  };

  const podiumData = sorted.slice(0, 3).map((p, i) => ({ ...p, pts: metricFor(p), rank: i + 1 }));
  const rest = sorted.slice(3).map((p, i) => ({ ...p, pts: metricFor(p), rank: i + 4 }));
  const [top1, top2, top3] = podiumData as [typeof podiumData[0], typeof podiumData[1], typeof podiumData[2]];

  return (
    <main className="relative pt-36 pb-24" data-testid="leaderboard-main">
      <Aurora />
      <div className="relative mx-auto max-w-[1400px] px-6 md:px-10">
        <FadeUp><Eyebrow>Rankings</Eyebrow></FadeUp>
        <RevealHeading delay={0.1} lines={['<span class="italic text-[color:var(--ink-2)]">Leader</span>board.']} className="mt-6 font-display text-[64px] md:text-[92px] leading-[0.92] text-white" />

        <FadeUp delay={0.35} className="mt-10 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-full glass p-1 relative">
            {["Global", "By category", "Weekly"].map((t) => (
              <button key={t} onClick={() => setTab(t)} data-testid={`lb-tab-${t}`} className="relative px-5 py-2 text-[13px] transition-colors">
                {tab === t && (<motion.span layoutId="tab-bg" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 380, damping: 30 }} />)}
                <span className={`relative ${tab === t ? "text-[#0A0A0F]" : "text-[color:var(--ink-2)]"}`}>{t}</span>
              </button>
            ))}
          </div>

          {tab === "By category" && (
            <div className="relative">
              <select value={category} onChange={(e) => setCategory(e.target.value)} data-testid="lb-category-select"
                className="appearance-none pl-4 pr-10 py-2.5 rounded-full glass text-[13px] text-white outline-none cursor-pointer">
                {categories.map((c) => <option key={c.slug} value={c.slug} className="bg-[#0D0D12]">{c.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--mute)] pointer-events-none" />
            </div>
          )}

          {tab === "Weekly" && (
            <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-[color:var(--mute)]">last 7 days</span>
          )}
        </FadeUp>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 items-end" key={`${tab}-${category}`}>
          <PodiumCard p={top2} rank={2} />
          <PodiumCard p={top1} rank={1} />
          <PodiumCard p={top3} rank={3} />
        </div>

        <FadeUp delay={0.4} className="mt-14 rounded-3xl glass overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.06] font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)]">
            <div className="col-span-1">Rank</div><div className="col-span-6">Player</div><div className="col-span-2 text-right">Streak</div><div className="col-span-3 text-right">Points</div>
          </div>
          {rest.map((p, i) => (
            <motion.div key={p.name} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ delay: i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="grid grid-cols-12 gap-4 items-center px-6 py-5 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors">
              <div className="col-span-1 font-mono text-[13px] text-[color:var(--mute)]">#{p.rank}</div>
              <div className="col-span-6 flex items-center gap-3">
                <div className="shrink-0 w-9 h-9 rounded-full grid place-items-center font-mono text-[11px] text-white/85 border border-white/10" style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.25), rgba(127,231,206,0.18))" }}>{p.initials}</div>
                <div><div className="text-[14.5px] text-white">{p.name}</div><div className="font-mono text-[11px] text-[color:var(--mute)]">{p.country}</div></div>
              </div>
              <div className="col-span-2 text-right font-mono text-[12.5px] text-[color:var(--gold)]"><Zap className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />{p.streak}</div>
              <div className="col-span-3 text-right font-display text-[20px] text-white">{p.pts.toLocaleString()}<span className="font-mono text-[11px] text-[color:var(--mute)] ml-1">pts</span></div>
            </motion.div>
          ))}
        </FadeUp>

        <FadeUp delay={0.3} className="mt-10 font-mono text-[11px] tracking-[0.14em] uppercase text-[color:var(--mute)] text-center">
          {tab === "By category" ? `Points earned in ${categories.find((c) => c.slug === category)?.name} · best percentage wins on ties` : tab === "Weekly" ? "Points earned in the last 7 days · best percentage wins on ties" : "Cumulative points across completed quizzes · best percentage wins on ties"}
        </FadeUp>
      </div>
    </main>
  );
}

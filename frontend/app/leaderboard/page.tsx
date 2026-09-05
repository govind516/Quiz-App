"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Zap } from "lucide-react";
import Aurora from "@/components/Aurora";
import { Eyebrow, FadeUp, RevealHeading } from "@/components/Reveal";
import { leaders } from "@/lib/mock";

function PodiumCard({ p, rank }: { p: typeof leaders[0]; rank: 1 | 2 | 3 }) {
  const heights = { 1: "h-[280px]", 2: "h-[220px]", 3: "h-[190px]" };
  const colors = { 1: "#F5C775", 2: "#C5C5D0", 3: "#D89B7B" };
  const orders = { 1: "md:order-2", 2: "md:order-1", 3: "md:order-3" };
  const scale = { 1: 1, 2: 0.94, 3: 0.9 };
  return (
    <FadeUp delay={rank === 1 ? 0.1 : rank === 2 ? 0.2 : 0.3} className={`${orders[rank]} w-full`}>
      <div className={`relative rounded-3xl glass overflow-hidden ${heights[rank]}`} style={{ borderColor: `${colors[rank]}30`, background: `linear-gradient(180deg, ${colors[rank]}10, transparent 80%)` }}>
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl" style={{ background: `${colors[rank]}40` }} />
        </div>
        <div className="relative h-full flex flex-col items-center justify-end p-6 md:p-8">
          {rank === 1 && (
            <motion.div initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="absolute top-6">
              <Crown className="w-6 h-6" style={{ color: colors[1] }} />
            </motion.div>
          )}
          <div className="font-mono text-[11px] tracking-[0.22em] uppercase mb-4" style={{ color: colors[rank] }}>#{rank}</div>
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: scale[rank], opacity: 1 }} transition={{ delay: 0.3 + rank * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="relative shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-full grid place-items-center font-display text-[28px] text-white mb-4" style={{ background: `radial-gradient(circle at 30% 30%, ${colors[rank]}55, rgba(255,255,255,0.04))`, border: `1.5px solid ${colors[rank]}70` }}>
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
  const [top1, top2, top3, ...rest] = leaders;

  return (
    <main className="relative pt-36 pb-24" data-testid="leaderboard-main">
      <Aurora />
      <div className="relative mx-auto max-w-[1400px] px-6 md:px-10">
        <FadeUp><Eyebrow>Rankings</Eyebrow></FadeUp>
        <RevealHeading delay={0.1} lines={['<span class="italic text-[color:var(--ink-2)]">Leader</span>board.']} className="mt-6 font-display text-[64px] md:text-[92px] leading-[0.92] text-white" />

        <FadeUp delay={0.35} className="mt-10 inline-flex items-center rounded-full glass p-1 relative">
          {["Global", "By category", "Weekly"].map((t) => (
            <button key={t} onClick={() => setTab(t)} data-testid={`lb-tab-${t}`} className="relative px-5 py-2 text-[13px] transition-colors">
              {tab === t && (<motion.span layoutId="tab-bg" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 380, damping: 30 }} />)}
              <span className={`relative ${tab === t ? "text-[#0A0A0F]" : "text-[color:var(--ink-2)]"}`}>{t}</span>
            </button>
          ))}
        </FadeUp>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <PodiumCard p={top2} rank={2} />
          <PodiumCard p={top1} rank={1} />
          <PodiumCard p={top3} rank={3} />
        </div>

        <FadeUp delay={0.4} className="mt-14 rounded-3xl glass overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.06] font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)]">
            <div className="col-span-1">Rank</div><div className="col-span-6">Player</div><div className="col-span-2 text-right">Streak</div><div className="col-span-3 text-right">Points</div>
          </div>
          {rest.map((p, i) => (
            <motion.div key={p.rank} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ delay: i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="grid grid-cols-12 gap-4 items-center px-6 py-5 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors">
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

        <FadeUp delay={0.3} className="mt-10 font-mono text-[11px] tracking-[0.14em] uppercase text-[color:var(--mute)] text-center">Cumulative points across completed quizzes · best percentage wins on ties</FadeUp>
      </div>
    </main>
  );
}

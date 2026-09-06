"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Eyebrow, FadeUp } from "@/components/Reveal";
import { AdminError, AdminLoading } from "@/components/admin-state";
import { api } from "@/lib/api";
import type {
  AdminAnalyticsDto,
  CategoryPerformanceItem,
  DropoffStats,
  OverviewStats,
  QuestionAdminDto,
  QuizDto,
  ScoreTrendPoint,
} from "@/lib/types";

function StatCard({ label, value, sub, accent, delay = 0 }: any) {
  return (
    <FadeUp delay={delay}>
      <div
        className="rounded-2xl glass glass-hover p-5 h-full"
        data-testid={`admin-stat-${label.split(" ")[0].toLowerCase()}`}
      >
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)]">
          {label}
        </div>
        <div className="mt-3 font-display text-[46px] leading-none" style={{ color: accent || "#F4F1EB" }}>
          {value}
        </div>
        <div className="mt-3 text-[12.5px] text-[color:var(--ink-2)]">{sub}</div>
      </div>
    </FadeUp>
  );
}

function AreaChart({
  data,
  height = 220,
  stroke = "#A78BFA",
  fill = "rgba(167,139,250,0.22)",
}: {
  data: { day?: string; date?: string; val?: number; avgPct?: number }[];
  height?: number;
  stroke?: string;
  fill?: string;
}) {
  // normalize: backend ScoreTrendPoint uses {date, avgPct} while mock uses {day,val}
  const normalized = data.map((d: any) => ({
    day: d.day ?? (d.date ? new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }).toUpperCase() : ""),
    val: d.val ?? d.avgPct ?? d.count ?? 0,
  }));
  const max = Math.max(...normalized.map((d) => d.val), 1);
  const w = 100,
    h = height;
  const step = w / (normalized.length - 1 || 1);
  const points = normalized.map((d, i) => `${i * step},${h - (d.val / max) * (h - 30) - 10}`).join(" ");
  const area = `0,${h} ${points} ${w},${h}`;
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-[220px]">
        <defs>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fill} stopOpacity="0.9" />
            <stop offset="100%" stopColor={fill} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={area} fill="url(#ag)" stroke="none" />
        <polyline
          points={points}
          fill="none"
          stroke={stroke}
          strokeWidth="0.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {normalized.map((d, i) => (
          <circle key={i} cx={i * step} cy={h - (d.val / max) * (h - 30) - 10} r="0.9" fill={stroke} />
        ))}
      </svg>
      <div className="mt-1 grid" style={{ gridTemplateColumns: `repeat(${normalized.length}, 1fr)` }}>
        {normalized.map((d) => (
          <div
            key={d.day + Math.random()}
            className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-[color:var(--mute)] text-center"
          >
            {d.day}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  // Live backend data throughout — no mock fallbacks in the admin console.
  const overviewQ = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => api<OverviewStats>("/api/admin/analytics/overview"),
    retry: false,
  });
  const attemptsQ = useQuery({
    queryKey: ["admin", "attemptsWeek"],
    queryFn: () => api<AdminAnalyticsDto>("/api/admin/analytics/attempts?days=7"),
    retry: false,
  });
  const scoresQ = useQuery({
    queryKey: ["admin", "scores"],
    queryFn: () => api<ScoreTrendPoint[]>("/api/admin/analytics/scores?days=30"),
    retry: false,
  });
  const dropoffQ = useQuery({
    queryKey: ["admin", "dropoff"],
    queryFn: () => api<DropoffStats>("/api/admin/analytics/dropoff"),
    retry: false,
  });
  const quizzesQ = useQuery({
    queryKey: ["admin", "quizzes"],
    queryFn: () => api<QuizDto[]>("/api/admin/quizzes"),
    retry: false,
  });
  const categoriesQ = useQuery({
    queryKey: ["admin", "analytics-categories"],
    queryFn: () => api<CategoryPerformanceItem[]>("/api/admin/analytics/categories"),
    retry: false,
  });
  const pendingQ = useQuery({
    queryKey: ["admin", "pending-count"],
    queryFn: () => api<QuestionAdminDto[]>("/api/admin/questions/pending"),
    retry: false,
  });

  const queries = [overviewQ, attemptsQ, scoresQ, dropoffQ, quizzesQ, categoriesQ, pendingQ];
  const firstError = queries.find((q) => q.isError)?.error;
  const loading = queries.some((q) => q.isPending);

  const stats = {
    totalLearners: overviewQ.data?.totalUsers ?? 0,
    attemptsToday: overviewQ.data?.attemptsToday ?? 0,
    avgScore: Math.round(overviewQ.data?.avgScorePct30d ?? 0),
    pendingAI: pendingQ.data?.length ?? 0,
  };

  const attemptsWeek = (attemptsQ.data?.daily ?? []).map((d) => ({
    day: new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    val: d.count,
  }));

  const avgScoreTrend = (scoresQ.data ?? []).map((d) => ({
    day: new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    val: Math.round(d.avgPct),
  }));

  const quizCompletion = {
    started: dropoffQ.data?.started ?? 0,
    finished: dropoffQ.data?.completed ?? 0,
    abandoned: dropoffQ.data?.abandoned ?? 0,
  };

  const topCategoriesWeek = (categoriesQ.data ?? [])
    .slice(0, 4)
    .map((c) => ({ name: c.name, count: c.attempts }));

  const adminQuizzes = (quizzesQ.data ?? []).map((q) => ({
    id: String(q.id),
    title: q.title,
    cat: q.categoryName,
    status: q.isPublished ? "live" : "draft",
    questions: q.questionCount,
  }));

  const refetchAll = () => queries.forEach((q) => q.refetch());

  return (
    <div>
      <FadeUp>
        <Eyebrow>Admin</Eyebrow>
      </FadeUp>
      <FadeUp delay={0.1}>
        <h1 className="mt-4 font-display text-[48px] md:text-[64px] leading-[0.95] text-white">Dashboard</h1>
      </FadeUp>

      {firstError ? (
        <AdminError error={firstError} retry={refetchAll} />
      ) : loading ? (
        <AdminLoading rows={4} />
      ) : (
      <>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total learners" value={stats.totalLearners} sub="no sign-ups this week" delay={0.05} />
        <StatCard label="Attempts finished today" value={stats.attemptsToday} sub="across 10 categories" delay={0.1} />
        <StatCard label="Avg score" value={`${stats.avgScore}%`} sub="last 30 days" delay={0.15} />
        <StatCard
          label="Pending AI questions"
          value={stats.pendingAI}
          sub={
            <Link href="/admin/review" className="text-[color:var(--gold)] hover:text-white transition-colors">
              review queue →
            </Link>
          }
          accent="#F5C775"
          delay={0.2}
        />
      </div>

      <FadeUp delay={0.15} className="mt-6">
        <div className="rounded-2xl glass p-6">
          <div className="font-display text-[22px] text-white">Attempts — last 7 days</div>
          <div className="mt-4">
            <AreaChart data={attemptsWeek} stroke="#A78BFA" fill="rgba(167,139,250,0.35)" />
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={0.2} className="mt-6">
        <div className="rounded-2xl glass p-6">
          <div className="font-display text-[22px] text-white">Average score trend — last 30 days (%)</div>
          <div className="mt-4">
            <AreaChart data={avgScoreTrend} stroke="#7FE7CE" fill="rgba(127,231,206,0.28)" />
          </div>
        </div>
      </FadeUp>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FadeUp delay={0.1}>
          <div className="rounded-2xl glass p-6 h-full">
            <div className="font-display text-[22px] text-white">Quiz completion</div>
            <div className="mt-5 space-y-3">
              {[
                { k: "Started", v: quizCompletion.started, c: "#B8B5C0" },
                { k: "Finished", v: quizCompletion.finished, c: "#7FE7CE" },
                { k: "Abandoned mid-quiz", v: quizCompletion.abandoned, c: "#FF6B9B" },
              ].map((r) => (
                <div key={r.k} className="flex items-center justify-between">
                  <span className="text-[14px]" style={{ color: r.c }}>
                    {r.k}
                  </span>
                  <span className="font-display text-[20px] text-white">{r.v}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${(quizCompletion.finished / quizCompletion.started) * 100 || 0}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="h-full"
                style={{ background: "#A78BFA" }}
              />
            </div>
            <div className="mt-2 font-mono text-[10.5px] tracking-[0.14em] uppercase text-[color:var(--mute)]">
              {Math.round((quizCompletion.abandoned / Math.max(1, quizCompletion.started)) * 100)}% of quizzes are
              abandoned before submission
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div className="rounded-2xl glass p-6 h-full">
            <div className="font-display text-[22px] text-white">Top categories this week</div>
            <div className="mt-5 space-y-3.5">
              {topCategoriesWeek.map((c, i) => (
                <div key={c.name} className="flex items-center gap-4">
                  <div className="font-mono text-[12px] w-4 text-[color:var(--mute)]">{i + 1}</div>
                  <div className="flex-1 text-[14px] text-white">{c.name}</div>
                  <div className="font-display text-[18px] text-white">{c.count}</div>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      </div>

      <FadeUp delay={0.15} className="mt-6">
        <div className="rounded-2xl glass overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
            <div className="font-display text-[22px] text-white">All quizzes</div>
            <Link href="/admin/questions" className="text-[13px] text-[color:var(--ink-2)] hover:text-white transition-colors">
              Manage →
            </Link>
          </div>
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/[0.05] font-mono text-[10.5px] tracking-[0.16em] uppercase text-[color:var(--mute)]">
            <div className="col-span-6">Title</div>
            <div className="col-span-3">Category</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Qs</div>
          </div>
          {adminQuizzes.length === 0 && (
            <div className="px-6 py-8 text-center text-[13.5px] text-[color:var(--mute)]">
              No quizzes yet — create one to get started.
            </div>
          )}
          {adminQuizzes.map((q: any) => (
            <div
              key={q.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors"
            >
              <div className="col-span-6 text-[14px] text-white">{q.title}</div>
              <div className="col-span-3 text-[13px] text-[color:var(--ink-2)]">{q.cat}</div>
              <div className="col-span-2">
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono ${q.status === "live" ? "text-[color:var(--mint)] bg-[color:var(--mint)]/10 border border-[color:var(--mint)]/25" : "text-[color:var(--gold)] bg-[color:var(--gold)]/10 border border-[color:var(--gold)]/25"}`}
                >
                  {q.status}
                </span>
              </div>
              <div className="col-span-1 text-right font-display text-[16px] text-white">{q.questions}</div>
            </div>
          ))}
        </div>
      </FadeUp>
      </>
      )}
    </div>
  );
}

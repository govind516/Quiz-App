"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Eyebrow, FadeUp } from "@/components/Reveal";
import { attemptsWeek as mockAttemptsWeek, avgScoreTrend as mockAvgScoreTrend, topCategoriesWeek as mockTopCategoriesWeek, adminStats as mockAdminStats } from "@/lib/mock";
import { api } from "@/lib/api";
import type { ScoreTrendPoint, DropoffStats } from "@/lib/types";

export default function Analytics() {
  // TODO: backend wiring — try real analytics endpoints; fallback to mock
  const attemptsQ = useQuery({
    queryKey: ["admin", "analytics-attempts"],
    queryFn: () => api<{ date: string; count: number }[]>("/api/admin/analytics/attempts?days=7"),
    retry: false,
  });
  const scoresQ = useQuery({
    queryKey: ["admin", "analytics-scores"],
    queryFn: () => api<ScoreTrendPoint[]>("/api/admin/analytics/scores?days=30"),
    retry: false,
  });
  const dropoffQ = useQuery({
    queryKey: ["admin", "dropoff-analytics"],
    queryFn: () => api<DropoffStats>("/api/admin/analytics/dropoff"),
    retry: false,
  });
  const categoriesQ = useQuery({
    queryKey: ["admin", "analytics-categories"],
    queryFn: () => api<Array<{ name: string; attempts: number }>>("/api/admin/analytics/categories"),
    retry: false,
  });

  const attemptsWeek = attemptsQ.data
    ? attemptsQ.data.map((d) => ({ day: new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(), val: d.count }))
    : mockAttemptsWeek;

  const avgScoreTrend = scoresQ.data
    ? scoresQ.data.map((d) => ({ day: new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(), val: Math.round(d.avgPct) }))
    : mockAvgScoreTrend;

  const topCategoriesWeek = categoriesQ.data
    ? categoriesQ.data.map((c) => ({ name: c.name, count: c.attempts })).slice(0, 4)
    : mockTopCategoriesWeek;

  const adminStats = dropoffQ.data ? { avgScore: Math.round(scoresQ.data?.[scoresQ.data.length - 1]?.avgPct ?? mockAdminStats.avgScore) } : mockAdminStats;

  const attemptsTotal = attemptsWeek.reduce((s: number, d: any) => s + d.val, 0);

  return (
    <div data-testid="admin-analytics">
      <FadeUp>
        <Eyebrow>Admin</Eyebrow>
      </FadeUp>
      <FadeUp delay={0.1}>
        <h1 className="mt-4 font-display text-[48px] md:text-[64px] leading-[0.95] text-white">Analytics</h1>
      </FadeUp>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { l: "Attempts (7d)", n: attemptsTotal, c: "#A78BFA" },
          { l: "Avg score (30d)", n: `${adminStats.avgScore}%`, c: "#7FE7CE" },
          { l: "Top track", n: topCategoriesWeek[0]?.name || "—", c: "#F5C775" },
        ].map((s, i) => (
          <FadeUp key={i} delay={i * 0.08}>
            <div className="rounded-2xl glass p-6">
              <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)]">{s.l}</div>
              <div className="mt-3 font-display text-[40px] leading-none" style={{ color: s.c }}>
                {s.n}
              </div>
            </div>
          </FadeUp>
        ))}
      </div>

      <FadeUp delay={0.2} className="mt-6 rounded-2xl glass p-6">
        <div className="font-display text-[22px] text-white">Score distribution (last 30 days)</div>
        <div className="mt-6 grid grid-cols-10 items-end gap-2 h-[220px]">
          {avgScoreTrend.concat(attemptsWeek.slice(0, 5) as any).map((d: any, i: number) => (
            <div
              key={i}
              className="rounded-md"
              style={{
                height: `${Math.max(6, d.val || 0)}%`,
                background: "linear-gradient(180deg, rgba(167,139,250,0.9), rgba(167,139,250,0.15))",
              }}
            />
          ))}
        </div>
      </FadeUp>
    </div>
  );
}

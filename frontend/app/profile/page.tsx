"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Award, Lock, RotateCw } from "lucide-react";
import Aurora from "@/components/Aurora";
import { Eyebrow, FadeUp, RevealHeading } from "@/components/Reveal";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useAuthStore } from "@/lib/auth-store";
import type { AttemptResultDto, BadgeDto, UserStatsDto } from "@/lib/types";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Stat({ label, value, testId }: { label: string; value: React.ReactNode; testId: string }) {
  return (
    <div className="rounded-2xl glass glass-hover p-5 h-full" data-testid={testId}>
      <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)]">{label}</div>
      <div className="mt-3 font-display text-[40px] leading-none text-white">{value}</div>
    </div>
  );
}

function Loading() {
  return (
    <div className="mt-10 space-y-4 animate-pulse" data-testid="profile-loading">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl glass p-6">
          <div className="h-6 w-48 rounded-lg bg-white/[0.06]" />
          <div className="mt-3 h-4 w-full rounded bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

export default function Profile() {
  const backendUser = useAuthStore((s) => s.user);
  const { user: demoUser } = useAuth();
  const hasBackendSession = Boolean(backendUser);

  const statsQ = useQuery({
    queryKey: ["me", "stats"],
    queryFn: () => api<UserStatsDto>("/api/users/me/stats"),
    enabled: hasBackendSession,
    retry: false,
    staleTime: 30_000,
  });
  const historyQ = useQuery({
    queryKey: ["me", "history"],
    queryFn: () => api<AttemptResultDto[]>("/api/users/me/history"),
    enabled: hasBackendSession,
    retry: false,
    staleTime: 30_000,
  });
  const badgesQ = useQuery({
    queryKey: ["me", "badges"],
    queryFn: () => api<BadgeDto[]>("/api/users/me/badges"),
    enabled: hasBackendSession,
    retry: false,
    staleTime: 30_000,
  });

  const identity = backendUser
    ? { name: backendUser.name, email: backendUser.email, role: backendUser.role }
    : demoUser
      ? { name: demoUser.name, email: demoUser.email ?? "guest session", role: demoUser.isAdmin ? "ADMIN" : "GUEST" }
      : null;

  const loading = hasBackendSession && (statsQ.isPending || historyQ.isPending || badgesQ.isPending);
  const loadError = statsQ.error ?? historyQ.error ?? badgesQ.error;
  const refetchAll = () => {
    statsQ.refetch();
    historyQ.refetch();
    badgesQ.refetch();
  };

  const stats = statsQ.data;
  const history = historyQ.data ?? [];
  const badges = badgesQ.data ?? [];

  return (
    <main className="relative pt-36 pb-24" data-testid="profile-main">
      <Aurora variant="soft" />
      <div className="relative mx-auto max-w-[1100px] px-6 md:px-10">
        <FadeUp><Eyebrow>Profile</Eyebrow></FadeUp>
        <RevealHeading
          delay={0.1}
          lines={identity ? [`Hey, <span class="italic text-[color:var(--ink-2)]">${identity.name.split(" ")[0]}.</span>`] : ['Your <span class="italic text-[color:var(--ink-2)]">space.</span>']}
          className="mt-6 font-display text-[52px] md:text-[72px] leading-[0.95] text-white"
        />

        {!identity ? (
          <FadeUp delay={0.2} className="mt-10 rounded-2xl glass p-8 text-center">
            <div className="font-display text-[24px] text-white">You&apos;re browsing as a guest.</div>
            <p className="mt-2 text-[14px] text-[color:var(--ink-2)]">Log in to track streaks, history and badges.</p>
            <Link href="/login" className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[color:var(--ink)] text-[#0A0A0F] text-[14px] font-medium hover:bg-white transition-colors">
              Log in <ArrowUpRight className="w-4 h-4" />
            </Link>
          </FadeUp>
        ) : (
          <>
            <FadeUp delay={0.2} className="mt-10">
              <div className="rounded-2xl glass p-6 flex items-center gap-5 flex-wrap" data-testid="profile-identity">
                <div
                  className="w-14 h-14 rounded-full grid place-items-center font-display text-[20px] text-white border border-white/10 shrink-0"
                  style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.4), rgba(127,231,206,0.3))" }}
                >
                  {initialsOf(identity.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[18px] text-white truncate">{identity.name}</div>
                  <div className="font-mono text-[12px] text-[color:var(--mute)] truncate">{identity.email}</div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono border ${identity.role === "ADMIN" ? "text-[color:var(--violet-2)] bg-[color:var(--violet)]/10 border-[color:var(--violet)]/25" : "text-[color:var(--ink-2)] bg-white/[0.04] border-white/10"}`}
                >
                  {identity.role === "ADMIN" ? "Admin" : identity.role === "GUEST" ? "Guest" : "Player"}
                </span>
              </div>
            </FadeUp>

            {!hasBackendSession ? (
              <FadeUp delay={0.25} className="mt-6 rounded-2xl border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/[0.06] p-6" data-testid="profile-demo-notice">
                <div className="font-display text-[20px] text-white">Stats live behind a backend session.</div>
                <p className="mt-2 text-[14px] text-[color:var(--ink-2)]">
                  You&apos;re in with a demo session, which carries no backend token. Log in again with email + password to unlock your stats, history and badges.
                </p>
                <Link href="/login" className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[color:var(--violet)] hover:bg-[color:var(--violet-2)] text-white text-[13.5px] font-medium transition-colors">
                  Log in properly <ArrowUpRight className="w-4 h-4" />
                </Link>
              </FadeUp>
            ) : loadError ? (
              <div className="mt-6 rounded-2xl border border-[color:var(--coral)]/30 bg-[color:var(--coral)]/[0.06] p-6" role="alert" data-testid="profile-error">
                <div className="text-[14px] text-[color:var(--coral)]">Couldn&apos;t load your profile data.</div>
                <button onClick={refetchAll} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full glass glass-hover text-[13px] text-white">
                  <RotateCw className="w-3.5 h-3.5" /> Retry
                </button>
              </div>
            ) : loading ? (
              <Loading />
            ) : (
              <>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <FadeUp delay={0.05}><Stat label="Completed" value={stats?.completedAttempts ?? 0} testId="profile-stat-completed" /></FadeUp>
                  <FadeUp delay={0.1}><Stat label="Avg score" value={`${Math.round(stats?.averagePercentage ?? 0)}%`} testId="profile-stat-avg" /></FadeUp>
                  <FadeUp delay={0.15}><Stat label="Best score" value={`${Math.round(stats?.bestPercentage ?? 0)}%`} testId="profile-stat-best" /></FadeUp>
                  <FadeUp delay={0.2}><Stat label="Points" value={(stats?.totalPointsEarned ?? 0).toLocaleString()} testId="profile-stat-points" /></FadeUp>
                  <FadeUp delay={0.25}><Stat label="Streak" value={`${stats?.currentStreak ?? 0}d`} testId="profile-stat-streak" /></FadeUp>
                  <FadeUp delay={0.3}><Stat label="Best streak" value={`${stats?.bestStreak ?? 0}d`} testId="profile-stat-best-streak" /></FadeUp>
                </div>

                <FadeUp delay={0.1} className="mt-10">
                  <h2 className="font-display text-[28px] text-white">Quiz history</h2>
                </FadeUp>
                <FadeUp delay={0.15} className="mt-4 rounded-3xl glass overflow-hidden" data-testid="profile-history">
                  <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.06] font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)]">
                    <div className="col-span-6">Quiz</div>
                    <div className="col-span-2 text-right">Score</div>
                    <div className="col-span-2 text-right">Result</div>
                    <div className="col-span-2 text-right">Date</div>
                  </div>
                  {history.length === 0 && (
                    <div className="px-6 py-10 text-center text-[13.5px] text-[color:var(--mute)]">
                      No attempts yet — <Link href="/practice" className="text-white hover:underline">go play one</Link>.
                    </div>
                  )}
                  {history.map((h) => (
                    <div key={h.attemptId} className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors" data-testid={`profile-history-${h.attemptId}`}>
                      <div className="col-span-6">
                        <Link href={`/play/${h.quizId}`} className="text-[14.5px] text-white hover:text-[color:var(--violet-2)] transition-colors">{h.quizTitle}</Link>
                        <div className="font-mono text-[11px] text-[color:var(--mute)]">{h.status.toLowerCase()}</div>
                      </div>
                      <div className="col-span-2 text-right font-display text-[18px] text-white">{h.score}<span className="font-mono text-[11px] text-[color:var(--mute)]">/{h.totalPoints}</span></div>
                      <div className={`col-span-2 text-right font-mono text-[12.5px] ${Math.round(h.percentage) >= 60 ? "text-[color:var(--mint)]" : "text-[color:var(--coral)]"}`}>{Math.round(h.percentage)}%</div>
                      <div className="col-span-2 text-right font-mono text-[12px] text-[color:var(--mute)]">
                        {h.completedAt ? new Date(h.completedAt).toLocaleDateString() : "—"}
                      </div>
                    </div>
                  ))}
                </FadeUp>

                <FadeUp delay={0.1} className="mt-10">
                  <h2 className="font-display text-[28px] text-white">Badges</h2>
                </FadeUp>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="profile-badges">
                  {badges.length === 0 && (
                    <div className="rounded-2xl glass p-6 text-[13.5px] text-[color:var(--mute)] sm:col-span-2 lg:col-span-3">
                      No badges defined yet — they&apos;ll appear here as you play.
                    </div>
                  )}
                  {badges.map((b, i) => (
                    <FadeUp key={b.code} delay={i * 0.05}>
                      <div className={`rounded-2xl glass p-6 h-full ${b.earned ? "" : "opacity-60"}`} data-testid={`profile-badge-${b.code}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full grid place-items-center border ${b.earned ? "bg-[color:var(--gold)]/15 border-[color:var(--gold)]/30 text-[color:var(--gold)]" : "bg-white/[0.04] border-white/10 text-[color:var(--mute)]"}`}>
                            {b.earned ? <Award className="w-4.5 h-4.5" /> : <Lock className="w-4 h-4" />}
                          </div>
                          <div className="font-display text-[18px] text-white">{b.name}</div>
                        </div>
                        <div className="mt-3 text-[13.5px] text-[color:var(--ink-2)] leading-relaxed">{b.description}</div>
                        <div className={`mt-3 font-mono text-[10.5px] tracking-[0.18em] uppercase ${b.earned ? "text-[color:var(--mint)]" : "text-[color:var(--mute)]"}`}>
                          {b.earned ? "earned" : "locked"}
                        </div>
                      </div>
                    </FadeUp>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

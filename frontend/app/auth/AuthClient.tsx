"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { publicApi } from "@/lib/api";
import type { AuthResponse } from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";
import { IconArrowRight, IconHexLogo } from "@/components/icons";
import { Button, Eyebrow } from "@/components/ui";
import { FadeUp } from "@/components/Reveal";

type Mode = "login" | "signup";

function EyeIcon({ show }: { show: boolean }) {
  if (show) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 0 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72 6.72L1.72 1.72" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function AuthClient() {
  const nav = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Mode>("login");
  const [showPw, setShowPw] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string | undefined;

    try {
      const res = await publicApi<AuthResponse>(
        `/auth/${tab}`,
        {
          method: "POST",
          body: { email, password, name },
        },
      );
      useAuthStore.getState().setAuth(res);
      nav.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Auth failed";
      alert(msg);
    }
  };

  const paramMode: Mode = searchParams.get("mode") === "signup" ? "signup" : "login";

  return (
    <main className="relative min-h-screen grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
      <div className="relative hidden lg:block overflow-hidden">
        <div className="relative h-full flex flex-col p-10">
          <Link href="/"><IconHexLogo size={28} /></Link>

          <div className="flex-1 flex items-center">
            <div className="max-w-[520px]">
              <FadeUp><Eyebrow>Practice makes senior</Eyebrow></FadeUp>
              <FadeUp delay={0.1}>
                <h1 className="mt-6 font-display text-[64px] leading-[0.92] text-white">
                  The rep <span className="italic text-[color:var(--ink-2)]">before</span> the room.
                </h1>
              </FadeUp>
              <FadeUp delay={0.25}>
                <p className="mt-6 text-[16px] leading-relaxed text-[color:var(--ink-2)]">
                  Track streaks, climb the leaderboard, and never lose your progress across sessions. Guests can play; only sign in if you want it to count.
                </p>
              </FadeUp>

              <FadeUp delay={0.4} className="mt-12 grid grid-cols-3 gap-4 max-w-[440px]">
                {[
                  { n: "42d", l: "best streak" },
                  { n: "128", l: "questions" },
                  { n: "3.1k", l: "engineers" },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="font-display text-[36px] leading-none text-white">{s.n}</div>
                    <div className="mt-1 font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)]">{s.l}</div>
                  </div>
                ))}
              </FadeUp>
            </div>
          </div>

          <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-[color:var(--mute)]">
            © 2025 HexQuiz — built for people who ship
          </div>
        </div>
      </div>

      <div className="relative flex flex-col justify-center p-8 md:p-16 bg-[color:var(--bg-2)]">
        <Link href="/" className="lg:hidden mb-10"><IconHexLogo size={26} /></Link>

        <FadeUp>
          <div className="inline-flex items-center rounded-full glass p-1 relative mb-8">
            {[{k:"login", l:"Log in"}, {k:"signup", l:"Sign up"}].map((t) => (
              <button key={t.k} onClick={()=>setTab(t.k as Mode)} className="relative px-6 py-2 text-[13.5px] transition-colors">
                {tab === t.k && (
                  <span className="absolute inset-0 rounded-full bg-white" />
                )}
                <span className={`relative ${tab === t.k ? "text-[#0A0A0F]" : "text-[color:var(--ink-2)]"}`}>{t.l}</span>
              </button>
            ))}
          </div>
        </FadeUp>

        <div className="max-w-[420px] w-full">
          <FadeUp delay={0.1}>
            <h2 className="font-display text-[44px] leading-[0.95] text-white">
              {tab === "login" ? "Welcome back." : "Make it count."}
            </h2>
            <p className="mt-3 text-[14.5px] text-[color:var(--ink-2)]">
              {tab === "login" ? "Pick up your streak where you left off." : "Create an account to save streaks and rankings."}
            </p>
          </FadeUp>

          <form onSubmit={submit} className="mt-8 space-y-5">
            {tab === "signup" && (
              <div>
                <label className="block font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)] mb-2">Full name</label>
                <input type="text" name="name" placeholder="Ada Lovelace" required
                  className="w-full px-4 py-3.5 rounded-xl glass text-[14px] outline-none placeholder:text-[color:var(--mute)] focus:border-[color:var(--violet)]/50 transition-colors" />
              </div>
            )}
            <div>
              <label className="block font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)] mb-2">Email</label>
              <input type="email" name="email" placeholder="you@company.com" required
                className="w-full px-4 py-3.5 rounded-xl glass text-[14px] outline-none placeholder:text-[color:var(--mute)] focus:border-[color:var(--violet)]/50 transition-colors" />
            </div>
            <div>
              <label className="block font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)] mb-2">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} name="password" placeholder="••••••••••" required
                  className="w-full px-4 py-3.5 pr-11 rounded-xl glass text-[14px] outline-none placeholder:text-[color:var(--mute)] focus:border-[color:var(--violet)]/50 transition-colors" />
                <button type="button" onClick={()=>setShowPw((v)=>!v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-[color:var(--mute)] hover:text-white transition-colors">
                  <EyeIcon show={showPw} />
                </button>
              </div>
            </div>

            <button type="submit"
              className="group w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[color:var(--violet)] hover:bg-[color:var(--violet-2)] text-white text-[14px] font-medium transition-all">
              {tab === "login" ? "Continue" : "Create account"}
              <IconArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]" /></div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-[color:var(--bg-2)] font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)]">or</span>
              </div>
            </div>

            <Link href="/" className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl glass glass-hover text-[14px] text-white">
              Continue as guest <IconArrowRight className="w-4 h-4" />
            </Link>

            <p className="text-center text-[12.5px] text-[color:var(--mute)]">
              Guest scores aren't saved — sign up to keep your progress.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUpRight, Eye, EyeOff } from "lucide-react";
import Aurora from "@/components/Aurora";
import { Wordmark } from "@/components/HexLogo";
import { Eyebrow, FadeUp } from "@/components/Reveal";
import { publicApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useAuth } from "@/lib/auth-context";
import type { AuthResponse } from "@/lib/types";

export default function Login() {
  const router = useRouter();
  const { login: demoLogin, loginAsGuest, setSession } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reason, setReason] = useState<string | null>(null);
  const [from, setFrom] = useState<string | null>(null);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setReason(sp.get("reason"));
    setFrom(sp.get("from"));
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Enter an email to continue.");
      return;
    }
    // Empty password -> demo login path (offline preview behavior).
    // Demo-only: an account matching the seeded admin email gets isAdmin.
    if (!password) {
      const { isAdmin } = demoLogin(email);
      router.push(isAdmin ? "/admin" : (from && from !== "/login" ? from : "/"));
      return;
    }
    if (tab === "signup" && !name.trim()) {
      setError("Enter your name.");
      return;
    }
    setLoading(true);
    // NOTE: backend exposes only /register (no /signup endpoint).
    const tryPaths =
      tab === "login" ? ["/api/auth/login"] : ["/api/auth/register"];
    const body =
      tab === "login" ? { email, password } : { name, email, password };
    let lastErr: unknown = null;
    for (const path of tryPaths) {
      try {
        const res = await publicApi<AuthResponse>(path, {
          method: "POST",
          body,
        });
        useAuthStore.getState().setAuth(res);
        // Sync into AuthContext state (Nav + ProtectedRoute read from here).
        // NOTE: a raw localStorage write is NOT enough — context state would
        // stay null and /admin would bounce straight back to /login.
        const isAdmin = String(res.user.role).toUpperCase() === "ADMIN";
        setSession({ email: res.user.email, name: res.user.name, isAdmin });
        router.push(isAdmin ? "/admin" : (from && from !== "/login" ? from : "/"));
        return;
      } catch (err: unknown) {
        lastErr = err;
        const status = err instanceof Error && "status" in err ? (err as { status: number }).status : undefined;
        if (status !== undefined && status !== 404) break;
        if (tab === "login") break;
      }
    }
    const status =
      lastErr !== null && typeof lastErr === "object" && "status" in lastErr
        ? (lastErr as { status: number }).status
        : undefined;
    const msg = lastErr instanceof Error ? lastErr.message : "";
    const isNetworkError =
      msg.toLowerCase().includes("failed to fetch") ||
      msg.toLowerCase().includes("network") ||
      msg.toLowerCase().includes("fetch");
    if (status === 401 || status === 400 || status === 409 || status === 422 || status === 429) {
      setError(msg || "Authentication failed");
      setLoading(false);
      return;
    }
    if (isNetworkError || status === 404 || status === undefined) {
      // preview fallback — use demo login
      const { isAdmin } = demoLogin(email);
      router.push(isAdmin ? "/admin" : (from && from !== "/login" ? from : "/"));
      return;
    }
    setError(msg || "Authentication failed");
    setLoading(false);
  };

  const handleGuest = () => {
    loginAsGuest();
    router.push("/");
  };

  return (
    <main className="relative min-h-screen grid grid-cols-1 lg:grid-cols-2 overflow-hidden" data-testid="login-main">
      <div className="relative hidden lg:block overflow-hidden">
        <Aurora />
        <div className="relative h-full flex flex-col p-10">
          <Link href="/"><Wordmark size={28} /></Link>
          <div className="flex-1 flex items-center">
            <div className="max-w-[520px]">
              <FadeUp><Eyebrow>Practice makes senior</Eyebrow></FadeUp>
              <FadeUp delay={0.1}><h1 className="mt-6 font-display text-[64px] leading-[0.92] text-white">The rep <span className="italic text-[color:var(--ink-2)]">before</span> the room.</h1></FadeUp>
              <FadeUp delay={0.25}><p className="mt-6 text-[16px] leading-relaxed text-[color:var(--ink-2)]">Track streaks, climb the leaderboard, and never lose your progress across sessions. Guests can play; only sign in if you want it to count.</p></FadeUp>
              <FadeUp delay={0.4} className="mt-12 grid grid-cols-3 gap-4 max-w-[440px]">
                {[{ n: '42d', l: 'best streak' },{ n: '128', l: 'questions' },{ n: '3.1k', l: 'engineers' }].map((s, i) => (
                  <div key={i}><div className="font-display text-[36px] leading-none text-white">{s.n}</div><div className="mt-1 font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)]">{s.l}</div></div>
                ))}
              </FadeUp>
            </div>
          </div>
          <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-[color:var(--mute)]">© 2025 HexQuiz — built for people who ship</div>
        </div>
      </div>

      <div className="relative flex flex-col justify-center p-8 md:p-16 bg-[color:var(--bg-2)]">
        <Link href="/" className="lg:hidden mb-10"><Wordmark size={26} /></Link>

        {reason === "admin-required" && (
          <div className="mb-6 rounded-xl border border-[color:var(--coral)]/30 bg-[color:var(--coral)]/[0.06] px-4 py-3 text-[13px] text-[color:var(--coral)]" data-testid="admin-required-notice">
            That page is for admins only. Log in with an admin account to continue.
          </div>
        )}

        <FadeUp>
          <div className="inline-flex items-center rounded-full glass p-1 relative mb-8">
            {[{k:'login', l:'Log in'}, {k:'signup', l:'Sign up'}].map((t) => (
              <button key={t.k} onClick={()=>setTab(t.k as "login" | "signup")} data-testid={`auth-tab-${t.k}`} className="relative px-6 py-2 text-[13.5px] transition-colors">
                {tab === t.k && (<motion.span layoutId="auth-pill" className="absolute inset-0 rounded-full bg-white" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />)}
                <span className={`relative ${tab === t.k ? 'text-[#0A0A0F]' : 'text-[color:var(--ink-2)]'}`}>{t.l}</span>
              </button>
            ))}
          </div>
        </FadeUp>

        <div className="max-w-[420px] w-full">
          <FadeUp delay={0.1}>
            <h2 className="font-display text-[44px] leading-[0.95] text-white">{tab === 'login' ? 'Welcome back.' : 'Make it count.'}</h2>
            <p className="mt-3 text-[14.5px] text-[color:var(--ink-2)]">{tab === 'login' ? 'Pick up your streak where you left off.' : 'Create an account to save streaks and rankings.'}</p>
          </FadeUp>

          <AnimatePresence mode="wait">
            <motion.form key={tab} onSubmit={submit} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="mt-8 space-y-5">
              {tab === 'signup' && (
                <div>
                  <label className="block font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)] mb-2">Full name</label>
                  <input type="text" placeholder="Ada Lovelace" data-testid="signup-name" value={name} onChange={(e)=>setName(e.target.value)} className="w-full px-4 py-3.5 rounded-xl glass text-[14px] outline-none placeholder:text-[color:var(--mute)] focus:border-[color:var(--violet)]/50 transition-colors" />
                </div>
              )}
              <div>
                <label className="block font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)] mb-2">Email</label>
                <input type="email" placeholder="you@company.com" data-testid="auth-email" value={email} onChange={(e)=>{ setEmail(e.target.value); setError(null); }} className="w-full px-4 py-3.5 rounded-xl glass text-[14px] outline-none placeholder:text-[color:var(--mute)] focus:border-[color:var(--violet)]/50 transition-colors" />
                <p className="mt-2 text-[11.5px] text-[color:var(--mute)]">Admin? Sign in with your backend admin account (<span className="font-mono text-[color:var(--ink-2)]">ADMIN_EMAIL</span> + <span className="font-mono text-[color:var(--ink-2)]">ADMIN_PASSWORD</span>). Backend offline? Leave password empty for demo login.</p>
              </div>
              <div>
                <label className="block font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)] mb-2">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} placeholder="••••••••••" data-testid="auth-password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full px-4 py-3.5 pr-11 rounded-xl glass text-[14px] outline-none placeholder:text-[color:var(--mute)] focus:border-[color:var(--violet)]/50 transition-colors" />
                  <button type="button" onClick={()=>setShowPw((v)=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-[color:var(--mute)] hover:text-white transition-colors">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>

              {error && <p className="text-[13px] text-red-400" role="alert" data-testid="auth-error">{error}</p>}

              <button type="submit" data-testid="auth-submit" disabled={loading} className="group w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[color:var(--violet)] hover:bg-[color:var(--violet-2)] text-white text-[14px] font-medium transition-all disabled:opacity-60">
                {tab === 'login' ? 'Continue' : 'Create account'}<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]" /></div>
                <div className="relative flex justify-center"><span className="px-3 bg-[color:var(--bg-2)] font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)]">or</span></div>
              </div>

              <button type="button" onClick={handleGuest} className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl glass glass-hover text-[14px] text-white" data-testid="continue-guest">Continue as guest <ArrowUpRight className="w-4 h-4" /></button>
              <p className="text-center text-[12.5px] text-[color:var(--mute)]">Guest scores aren&apos;t saved — sign up to keep your progress.</p>
            </motion.form>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

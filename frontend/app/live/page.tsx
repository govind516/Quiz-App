"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import Aurora from "@/components/Aurora";
import { Eyebrow, FadeUp, RevealHeading } from "@/components/Reveal";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLiveQuizzes } from "@/lib/live-quizzes";
import { saveLiveIdentity } from "@/lib/live";
import type { LiveRoomInfo } from "@/lib/types";

function friendlyJoinError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 404) return "No live room with that code — it may have expired or the code is wrong.";
    if (e.status === 409) return "That game already started — ask the host for a fresh room.";
  }
  return e instanceof Error ? e.message : "Couldn't join that room — try again.";
}

export default function LiveRoom() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { quizzes } = useLiveQuizzes();
  const [name, setName] = useState(user?.name === "Guest" ? "" : (user?.name ?? ""));
  const [joinCode, setJoinCode] = useState("");
  const [quizId, setQuizId] = useState<string>("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickedQuizId = quizId || quizzes[0]?.id || "";

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickedQuizId || busy) return;
    setError(null);
    setBusy("create");
    try {
      const res = await api<{ room: LiveRoomInfo; creatorPlayerId: string | null }>(
        "/api/live-rooms",
        { method: "POST", body: { quizId: Number(pickedQuizId), joinAsPlayer: true } }
      );
      if (res.creatorPlayerId) saveLiveIdentity(res.room.code, res.creatorPlayerId, true);
      router.push(`/live/${res.room.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the room — try again.");
    } finally {
      setBusy(null);
    }
  };

  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!name.trim() || !code || busy) return;
    setError(null);
    setBusy("join");
    try {
      const res = await api<{ playerId: string; nickname: string }>(
        `/api/live-rooms/${code}/join`,
        { method: "POST", auth: false, body: { nickname: name.trim() } }
      );
      saveLiveIdentity(code, res.playerId, false);
      router.push(`/live/${code}`);
    } catch (err) {
      setError(friendlyJoinError(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="relative pt-36 pb-24" data-testid="live-entry">
      <Aurora variant="soft" />
      <div className="relative mx-auto max-w-[720px] px-6 md:px-10">
        <FadeUp><Eyebrow>Live</Eyebrow></FadeUp>
        <RevealHeading delay={0.1} lines={['Play <span class="italic text-[color:var(--ink-2)]">live</span>, together.']} className="mt-6 font-display text-[52px] md:text-[72px] leading-[0.95] text-white" />
        <FadeUp delay={0.25} className="mt-6 max-w-[560px] text-[15.5px] text-[color:var(--ink-2)]">
          Create a room and share the code, or join one someone else started. Everyone answers the same question at the same time — fastest correct answers score more.
        </FadeUp>

        {error && (
          <p className="mt-6 rounded-xl border border-[color:var(--coral)]/30 bg-[color:var(--coral)]/[0.06] px-4 py-3 text-[13px] text-[color:var(--coral)]" role="alert">
            {error}
          </p>
        )}

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
          <FadeUp delay={0.3}>
            <form onSubmit={createRoom} className="rounded-2xl glass p-6 h-full flex flex-col">
              <div className="font-display text-[20px] text-white">Create a room</div>
              <p className="mt-1 text-[13px] text-[color:var(--ink-2)]">You&apos;ll be the host and control when it starts.</p>
              {isAuthenticated ? (
                <>
                  <label className="mt-4 font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)]">Quiz</label>
                  <div className="relative mt-2">
                    <select
                      value={pickedQuizId}
                      onChange={(e) => setQuizId(e.target.value)}
                      data-testid="live-quiz-select"
                      className="appearance-none w-full pl-4 pr-10 py-3 rounded-xl glass text-[14px] text-white outline-none cursor-pointer"
                    >
                      {quizzes.map((q) => (
                        <option key={q.id} value={q.id} className="bg-[#0D0D12]">
                          {q.title} · {q.cat} · {q.level}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--mute)] pointer-events-none" />
                  </div>
                  <button type="submit" disabled={busy !== null} data-testid="live-create-btn" className="mt-4 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[color:var(--violet)] hover:bg-[color:var(--violet-2)] text-white text-[13.5px] font-medium transition-colors disabled:opacity-60">
                    {busy === "create" ? "Creating…" : "Create room"}
                  </button>
                </>
              ) : (
                <Link href="/login?from=/live" data-testid="live-login-to-host" className="mt-4 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[color:var(--violet)] hover:bg-[color:var(--violet-2)] text-white text-[13.5px] font-medium transition-colors">
                  Log in to host a room
                </Link>
              )}
              {!isAuthenticated && (
                <p className="mt-3 text-[12px] text-[color:var(--mute)]">Guests can join rooms — only hosting needs an account.</p>
              )}
            </form>
          </FadeUp>

          <FadeUp delay={0.35}>
            <form onSubmit={joinRoom} className="rounded-2xl glass p-6 h-full flex flex-col">
              <div className="font-display text-[20px] text-white">Join a room</div>
              <p className="mt-1 text-[13px] text-[color:var(--ink-2)]">Enter the code the host shared with you.</p>
              <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your display name" data-testid="live-join-name"
                className="mt-4 w-full px-4 py-3 rounded-xl glass text-[14px] outline-none placeholder:text-[color:var(--mute)] focus:border-[color:var(--violet)]/50 transition-colors" />
              <input value={joinCode} onChange={(e)=>setJoinCode(e.target.value.toUpperCase())} placeholder="ROOM CODE" data-testid="live-join-code"
                className="mt-2 w-full px-4 py-3 rounded-xl glass text-[14px] font-mono tracking-[0.2em] outline-none placeholder:text-[color:var(--mute)] focus:border-[color:var(--violet)]/50 transition-colors" />
              <button type="submit" disabled={busy !== null} data-testid="live-join-btn" className="mt-4 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl glass glass-hover text-white text-[13.5px] font-medium transition-colors disabled:opacity-60">
                {busy === "join" ? "Joining…" : "Join room"}
              </button>
            </form>
          </FadeUp>
        </div>
      </div>
    </main>
  );
}

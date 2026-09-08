"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, Play, Copy, Check, Crown, LogOut } from "lucide-react";
import type { Client } from "@stomp/stompjs";
import Aurora from "@/components/Aurora";
import { Eyebrow, FadeUp } from "@/components/Reveal";
import { CodeText } from "@/components/CodeText";
import { api, ApiError } from "@/lib/api";
import {
  createLiveClient,
  disconnectLiveClient,
  loadLiveIdentity,
  saveLiveIdentity,
  sendLiveAnswer,
  type LiveConnectionState,
  type LiveMessage,
} from "@/lib/live";
import type { FinalResultsPayload, LiveQuestionPayload, LiveRoomInfo } from "@/lib/types";

type Phase = "loading" | "notfound" | "gate" | "live";

export default function LiveCodeRoom() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const codeParam = (code as string ?? "").toUpperCase();

  const [phase, setPhase] = useState<Phase>("loading");
  const [room, setRoom] = useState<LiveRoomInfo | null>(null);
  const [question, setQuestion] = useState<LiveQuestionPayload | null>(null);
  const [final, setFinal] = useState<FinalResultsPayload | null>(null);
  const [qSeconds, setQSeconds] = useState(0);
  const [qTotal, setQTotal] = useState(1);
  const [answeredIdx, setAnsweredIdx] = useState<number | null>(null);
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [nickname, setNickname] = useState("");
  const [retryCode, setRetryCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [conn, setConn] = useState<LiveConnectionState>("connecting");
  const [copied, setCopied] = useState(false);

  const clientRef = useRef<Client | null>(null);
  const questionRef = useRef<LiveQuestionPayload | null>(null);
  const connectsRef = useRef(0);
  const [identity, setIdentity] = useState(() =>
    codeParam ? loadLiveIdentity(codeParam) : { playerId: null as string | null, isHost: false }
  );

  const applyQuestion = useCallback((payload: LiveQuestionPayload) => {
    const prev = questionRef.current;
    questionRef.current = payload;
    setQuestion(payload);
    if (!prev || prev.index !== payload.index) {
      // New question: fresh countdown + fresh answer state. Same-index
      // rebroadcasts (scoreboard updates after each answer) keep both.
      // The deadline is snapshotted once and ticked monotonically, so a
      // skewed device clock can't desync the countdown afterwards.
      const remain = Math.max(0, Math.round((payload.endsAtEpochMs - Date.now()) / 1000));
      setQTotal(Math.max(1, Number.isFinite(remain) ? remain : 1));
      setQSeconds(Math.max(0, Number.isFinite(remain) ? remain : 0));
      setAnsweredIdx(null);
      setPickedIdx(null);
    }
  }, []);

  const resync = useCallback(async () => {
    try {
      const info = await api<LiveRoomInfo>(`/api/live-rooms/${codeParam}`, { auth: false });
      setRoom(info);
      if (info.status === "ACTIVE" && info.currentQuestion) {
        applyQuestion(info.currentQuestion);
      }
      // ENDED without a final broadcast is handled by the roster fallback below.
    } catch {
      // stay on the last known state; next broadcast resyncs us
    }
  }, [codeParam, applyQuestion]);

  const handleMessage = useCallback((message: LiveMessage) => {
    if (message.kind === "lobby") {
      setRoom(message.info);
      if (message.info.status === "ACTIVE" && !questionRef.current) {
        // Joined mid-game via lobby broadcast: pull the running question.
        void resync();
      }
    } else if (message.kind === "question") {
      setRoom((r) => (r ? { ...r, status: "ACTIVE" } : r));
      applyQuestion(message.payload);
    } else if (message.kind === "final") {
      setFinal(message.results);
      setQuestion(null);
    }
  }, [applyQuestion, resync]);

  const connect = useCallback(() => {
    disconnectLiveClient(clientRef.current);
    const client = createLiveClient(
      codeParam,
      handleMessage,
      (state) => {
        setConn(state);
        if (state === "connected") {
          // First connect is covered by the mount fetch; later ones
          // (auto-reconnects) need an explicit resync.
          if (connectsRef.current > 0) void resync();
          connectsRef.current += 1;
        }
      }
    );
    clientRef.current = client;
  }, [codeParam, handleMessage, resync]);

  // Mount: resolve the room, then either gate on nickname or connect.
  useEffect(() => {
    if (!codeParam) {
      setPhase("notfound");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const info = await api<LiveRoomInfo>(`/api/live-rooms/${codeParam}`, { auth: false });
        if (cancelled) return;
        setRoom(info);
        if (info.status === "ENDED") {
          setPhase("live");
          return;
        }
        const ident = loadLiveIdentity(codeParam);
        setIdentity(ident);
        if (ident.playerId) {
          setPhase("live");
          if (info.status === "ACTIVE" && info.currentQuestion) {
            applyQuestion(info.currentQuestion);
          }
          connect();
        } else {
          setPhase("gate");
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) setPhase("notfound");
        else {
          setError(e instanceof Error ? e.message : "Couldn't load that room.");
          setPhase("notfound");
        }
      }
    })();
    return () => {
      cancelled = true;
      disconnectLiveClient(clientRef.current);
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeParam]);

  // 1s countdown ticker.
  const timerDone = qSeconds <= 0;
  useEffect(() => {
    if (timerDone || !question || final) return;
    const id = setInterval(() => {
      setQSeconds((s) => (Number.isFinite(s) && s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [question, final, timerDone]);

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setError(null);
    try {
      const res = await api<{ playerId: string; nickname: string }>(
        `/api/live-rooms/${codeParam}/join`,
        { method: "POST", auth: false, body: { nickname: nickname.trim() } }
      );
      saveLiveIdentity(codeParam, res.playerId, false);
      setIdentity({ playerId: res.playerId, isHost: false });
      setPhase("live");
      await resync();
      connect();
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setPhase("notfound");
      else if (e instanceof ApiError && e.status === 409)
        setError("That game already started — ask the host for a fresh room.");
      else setError(e instanceof Error ? e.message : "Couldn't join — try again.");
    }
  };

  const startGame = async () => {
    setError(null);
    try {
      await api(`/api/live-rooms/${codeParam}/start`, { method: "POST" });
      // The opening question arrives as a broadcast right after.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start — are you the host?");
    }
  };

  const answer = (optionIdx: number) => {
    const q = questionRef.current;
    const client = clientRef.current;
    if (!q || !client || !identity.playerId) return;
    if (answeredIdx !== null || qSeconds <= 0) return; // one shot per question
    const optId = q.question.options[optionIdx]?.optionId;
    if (optId === undefined) return;
    setPickedIdx(optionIdx);
    setAnsweredIdx(optionIdx);
    sendLiveAnswer(client, codeParam, {
      playerId: identity.playerId,
      questionIndex: q.index,
      questionId: q.question.questionId,
      selectedOptionIds: [optId],
    });
  };

  const copyCode = () => {
    if (!codeParam) return;
    navigator.clipboard?.writeText(codeParam);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const leaveRoom = () => {
    disconnectLiveClient(clientRef.current);
    clientRef.current = null;
    router.push("/live");
  };

  const tryCode = (e: React.FormEvent) => {
    e.preventDefault();
    const c = retryCode.trim().toUpperCase();
    if (c) router.push(`/live/${c}`);
  };

  if (phase === "loading") {
    return (
      <main className="relative pt-36 pb-24" data-testid="live-loading">
        <div className="mx-auto max-w-[600px] px-6 animate-pulse">
          <div className="h-12 w-48 rounded-2xl bg-white/[0.06]" />
          <div className="mt-6 h-5 w-full rounded-lg bg-white/[0.04]" />
        </div>
      </main>
    );
  }

  if (phase === "notfound") {
    return (
      <main className="relative pt-36 pb-24" data-testid="live-not-found">
        <div className="mx-auto max-w-[600px] px-6 text-center">
          <div className="font-display text-[28px] text-white">Room {codeParam} not found.</div>
          <p className="mt-2 text-[14px] text-[color:var(--ink-2)]">
            {error ?? "It may have expired (rooms close 10 minutes after the game), or the code is wrong."}
          </p>
          <form onSubmit={tryCode} className="mt-6 flex items-center gap-2 max-w-[380px] mx-auto">
            <input
              value={retryCode}
              onChange={(e) => setRetryCode(e.target.value.toUpperCase())}
              placeholder="ROOM CODE"
              data-testid="live-retry-code"
              className="flex-1 px-4 py-3 rounded-xl glass text-[14px] font-mono tracking-[0.2em] outline-none placeholder:text-[color:var(--mute)]"
            />
            <button type="submit" className="px-4 py-3 rounded-xl glass glass-hover text-[13.5px] text-white">Try</button>
          </form>
          <button onClick={leaveRoom} className="mt-4 px-5 py-2.5 rounded-full glass glass-hover text-[13.5px] text-white">Back to Live</button>
        </div>
      </main>
    );
  }

  if (phase === "gate") {
    return (
      <main className="relative pt-36 pb-24" data-testid="live-gate">
        <Aurora variant="soft" />
        <div className="relative mx-auto max-w-[480px] px-6">
          <FadeUp><Eyebrow>Join room {codeParam}</Eyebrow></FadeUp>
          <FadeUp delay={0.1}><h1 className="mt-4 font-display text-[40px] leading-[0.95] text-white">{room?.quizTitle ?? "Live quiz"}</h1></FadeUp>
          <FadeUp delay={0.15}><p className="mt-3 text-[14px] text-[color:var(--ink-2)]">Hosted by {room?.hostName ?? "—"} · {room?.players.length ?? 0} in the lobby</p></FadeUp>
          {error && (
            <p className="mt-4 rounded-xl border border-[color:var(--coral)]/30 bg-[color:var(--coral)]/[0.06] px-4 py-3 text-[13px] text-[color:var(--coral)]" role="alert">{error}</p>
          )}
          <form onSubmit={join} className="mt-6 rounded-2xl glass p-6">
            <label className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)]">Your display name</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. PhonePlayer"
              data-testid="live-nickname"
              maxLength={30}
              className="mt-2 w-full px-4 py-3 rounded-xl glass text-[14px] outline-none placeholder:text-[color:var(--mute)] focus:border-[color:var(--violet)]/50 transition-colors"
            />
            <button type="submit" data-testid="live-join-submit" className="mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[color:var(--violet)] hover:bg-[color:var(--violet-2)] text-white text-[13.5px] font-medium transition-colors">
              Join room
            </button>
          </form>
          <button onClick={leaveRoom} className="mt-4 px-5 py-2.5 rounded-full glass glass-hover text-[13.5px] text-white">Back to Live</button>
        </div>
      </main>
    );
  }

  // --- live phases ---
  const roster = question?.scoreboard ?? room?.players ?? [];
  const meAnswered = roster.find((p) => identity.playerId && p.playerId === identity.playerId)?.answeredCurrent ?? answeredIdx !== null;

  if (final) {
    return (
      <main className="relative pt-36 pb-24" data-testid="live-finished">
        <div className="mx-auto max-w-[720px] px-6 md:px-10">
          <FadeUp><Eyebrow>Final standings</Eyebrow></FadeUp>
          <FadeUp delay={0.1}><h1 className="mt-4 font-display text-[44px] leading-[0.95] text-white">Room {codeParam} — results</h1></FadeUp>
          <FadeUp delay={0.2} className="mt-8 rounded-2xl glass overflow-hidden">
            {final.entries.map((p, i) => (
              <div key={p.playerId} className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04] last:border-b-0">
                <div className="font-mono text-[13px] text-[color:var(--mute)] w-6">#{i + 1}</div>
                <div className="text-[14.5px] text-white flex-1">{p.nickname}{p.playerId === identity.playerId && <span className="text-[color:var(--mute)]"> (you)</span>}</div>
                <div className="font-display text-[20px] text-white">{p.score}<span className="font-mono text-[11px] text-[color:var(--mute)] ml-1">pts</span></div>
              </div>
            ))}
          </FadeUp>
          <button onClick={leaveRoom} className="mt-6 px-5 py-2.5 rounded-full glass glass-hover text-[13.5px] text-white">Back to Live</button>
        </div>
      </main>
    );
  }

  // Ended but the final broadcast was missed (e.g. reconnected late):
  // the roster still carries final scores.
  if (room?.status === "ENDED" && !question) {
    const standings = [...roster].sort((a, b) => b.score - a.score);
    return (
      <main className="relative pt-36 pb-24" data-testid="live-finished">
        <div className="mx-auto max-w-[720px] px-6 md:px-10">
          <FadeUp><Eyebrow>Final standings</Eyebrow></FadeUp>
          <FadeUp delay={0.1}><h1 className="mt-4 font-display text-[44px] leading-[0.95] text-white">Room {codeParam} — results</h1></FadeUp>
          <p className="mt-3 text-[13.5px] text-[color:var(--ink-2)]">You reconnected after the game ended — showing final scores.</p>
          <FadeUp delay={0.2} className="mt-8 rounded-2xl glass overflow-hidden">
            {standings.map((p, i) => (
              <div key={p.playerId} className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04] last:border-b-0">
                <div className="font-mono text-[13px] text-[color:var(--mute)] w-6">#{i + 1}</div>
                <div className="text-[14.5px] text-white flex-1">{p.nickname}{p.playerId === identity.playerId && <span className="text-[color:var(--mute)]"> (you)</span>}</div>
                <div className="font-display text-[20px] text-white">{p.score}<span className="font-mono text-[11px] text-[color:var(--mute)] ml-1">pts</span></div>
              </div>
            ))}
          </FadeUp>
          <button onClick={leaveRoom} className="mt-6 px-5 py-2.5 rounded-full glass glass-hover text-[13.5px] text-white">Back to Live</button>
        </div>
      </main>
    );
  }

  if (!room || room.status === "LOBBY") {
    return (
      <main className="relative pt-36 pb-24" data-testid="live-lobby">
        <Aurora variant="soft" />
        <div className="relative mx-auto max-w-[720px] px-6 md:px-10">
          <FadeUp><Eyebrow>Room lobby</Eyebrow></FadeUp>
          <FadeUp delay={0.1} className="mt-4 flex items-center gap-3">
            <h1 className="font-display text-[48px] md:text-[64px] leading-[0.95] text-white">{codeParam}</h1>
            <button onClick={copyCode} data-testid="live-copy-code" className="w-10 h-10 rounded-full glass glass-hover grid place-items-center text-white">
              {copied ? <Check className="w-4 h-4 text-[color:var(--mint)]" /> : <Copy className="w-4 h-4" />}
            </button>
          </FadeUp>
          <FadeUp delay={0.15} className="mt-2 text-[14px] text-[color:var(--ink-2)]">
            {room?.quizTitle ?? "Live quiz"} · hosted by {room?.hostName ?? "—"}
            {conn !== "connected" && <span className="ml-2 font-mono text-[11px] text-[color:var(--gold)]">reconnecting…</span>}
          </FadeUp>
          {error && (
            <p className="mt-4 rounded-xl border border-[color:var(--coral)]/30 bg-[color:var(--coral)]/[0.06] px-4 py-3 text-[13px] text-[color:var(--coral)]" role="alert">{error}</p>
          )}
          <FadeUp delay={0.3} className="mt-8 rounded-2xl glass overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.05] flex items-center gap-2 text-[13px] text-[color:var(--ink-2)]">
              <Users className="w-4 h-4" /> {(room?.players.length ?? 0)} joined
            </div>
            {(room?.players ?? []).map((p) => (
              <div key={p.playerId} className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.04] last:border-b-0">
                <div className="w-9 h-9 rounded-full grid place-items-center font-mono text-[11px] text-white/85 border border-white/10" style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(127,231,206,0.18))' }}>{p.nickname.slice(0, 2).toUpperCase()}</div>
                <div className="text-[14px] text-white flex-1">{p.nickname}{p.playerId === identity.playerId && <span className="text-[color:var(--mute)]"> (you)</span>}</div>
                {p.nickname === room?.hostName && <Crown className="w-4 h-4 text-[color:var(--gold)]" />}
              </div>
            ))}
          </FadeUp>

          <div className="mt-6 flex items-center gap-3">
            {identity.isHost ? (
              <button onClick={startGame} data-testid="live-start-btn" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[color:var(--violet)] hover:bg-[color:var(--violet-2)] text-white text-[13.5px] font-medium transition-colors">
                <Play className="w-4 h-4" /> Start quiz for everyone
              </button>
            ) : (
              <div className="text-[13.5px] text-[color:var(--ink-2)]">Waiting for the host to start…</div>
            )}
            <button onClick={leaveRoom} className="inline-flex items-center gap-2 px-4 py-3 rounded-full glass glass-hover text-[13px] text-white"><LogOut className="w-4 h-4" /> Leave</button>
          </div>
        </div>
      </main>
    );
  }

  const q = question;
  const standings = [...roster].sort((a, b) => b.score - a.score);
  const mm = String(Math.floor(Math.max(0, qSeconds) / 60)).padStart(2, "0");
  const ss = String(Math.max(0, qSeconds) % 60).padStart(2, "0");
  return (
    <main className="relative pt-36 pb-24" data-testid="live-playing">
      <div className="mx-auto max-w-[1000px] px-6 md:px-10 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8">
        <div>
          <div className="flex items-center justify-between">
            <div className="font-mono text-[12px] text-[color:var(--mute)]">Question {q ? q.index + 1 : "—"} / {q?.total ?? "—"}</div>
            <div className="font-mono text-[14px] text-white tabular-nums" data-testid="live-countdown">{mm}:{ss}</div>
          </div>
          {conn !== "connected" && <div className="mt-1 font-mono text-[11px] text-[color:var(--gold)]">reconnecting…</div>}
          <div className="mt-3 h-[3px] w-full bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full transition-all duration-1000" style={{ width: `${q ? Math.max(0, Math.min(100, (Math.max(0, qSeconds) / qTotal) * 100)) : 0}%`, background: 'linear-gradient(90deg,#A78BFA,#7FE7CE)' }} />
          </div>
          <div className="mt-3 rounded-3xl glass p-8">
            <div className="font-display text-[28px] leading-[1.2] text-white">
              {q ? <CodeText text={q.question.questionText} /> : "Waiting for the next question…"}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3">
            {(q?.question.options ?? []).map((opt, i) => {
              const locked = answeredIdx !== null || qSeconds <= 0;
              const selected = pickedIdx === i;
              return (
                <button
                  key={opt.optionId}
                  onClick={() => answer(i)}
                  disabled={locked}
                  data-testid={`live-option-${i}`}
                  className={`text-left px-5 py-4 rounded-2xl border transition-all flex items-center gap-4 disabled:cursor-default ${selected ? 'border-[color:var(--violet)]/60 bg-[color:var(--violet)]/[0.08]' : 'border-white/[0.06] hover:border-white/20 bg-white/[0.02]'}`}
                >
                  <div className={`w-9 h-9 rounded-lg grid place-items-center font-mono text-[13px] shrink-0 ${selected ? 'bg-[color:var(--violet)] text-white' : 'bg-white/[0.06] text-[color:var(--ink-2)]'}`}>{['A', 'B', 'C', 'D'][i] ?? i + 1}</div>
                  <div className="text-[15.5px] text-white"><CodeText text={opt.optionText} /></div>
                </button>
              );
            })}
          </div>
          {meAnswered && (
            <div className="mt-3 font-mono text-[12px] text-[color:var(--mint)]">Locked in — waiting for everyone…</div>
          )}
        </div>
        <div>
          <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)] mb-3">Live standings</div>
          <div className="rounded-2xl glass overflow-hidden">
            {standings.map((p) => (
              <div key={p.playerId} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-b-0">
                <div className="text-[13px] text-white flex-1 truncate">{p.nickname}{p.playerId === identity.playerId && <span className="text-[color:var(--mute)]"> (you)</span>}</div>
                {p.answeredCurrent && <div className="w-1.5 h-1.5 rounded-full bg-[color:var(--mint)]" title="answered" />}
                <div className="font-mono text-[12.5px] text-[color:var(--violet-2)]">{p.score}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

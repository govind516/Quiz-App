"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Play, Copy, Check, Crown, LogOut } from "lucide-react";
import Aurora from "@/components/Aurora";
import { Eyebrow, FadeUp, RevealHeading } from "@/components/Reveal";
import { playQuiz } from "@/lib/mock";

// --- IMPORTANT LIMITATION ---
// There is no real-time backend (no WebSocket server, no shared database) in
// this frontend-only project, so a genuinely cross-device "room" isn't
// possible here. This implementation simulates a live room using
// localStorage + the browser's `storage` event, which only broadcasts
// between multiple TABS of the SAME browser on the SAME machine — it's a
// functional demo of the room/lobby/live-standings flow, not a production
// multiplayer backend. A real version needs a server (e.g. Spring Boot +
// WebSocket/STOMP) to sync players across different devices.
const ROOM_PREFIX = 'hexquiz-room:';
const ROUND = playQuiz.questions.slice(0, 5);

function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function loadRoom(code: string) {
  try { return JSON.parse(localStorage.getItem(ROOM_PREFIX + code) || 'null'); } catch { return null; }
}
function saveRoom(room: any) {
  localStorage.setItem(ROOM_PREFIX + room.code, JSON.stringify(room));
}

export default function LiveRoom() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [playerId] = useState(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('hexquiz-player-id') || (() => {
      const id = Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem('hexquiz-player-id', id);
      return id;
    })();
  });
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [room, setRoom] = useState<any>(null);
  const [qIdx, setQIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  // hydrate from URL if /live/[code] — but this file is /live, so roomCode is set via navigation
  // We store roomCode in state after create/join, and also support ?code= param via search

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('code');
    if (c) {
      const r = loadRoom(c);
      if (r) { setRoomCode(c); setRoom(r); }
    }
  }, []);

  useEffect(() => {
    if (!roomCode) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === ROOM_PREFIX + roomCode) setRoom(loadRoom(roomCode));
    };
    window.addEventListener('storage', onStorage);
    const poll = setInterval(() => setRoom(loadRoom(roomCode)), 1000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(poll); };
  }, [roomCode]);

  const me = room?.players?.find((p: any) => p.id === playerId);
  const isHost = room?.hostId === playerId;

  const createRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const code = makeCode();
    const newRoom = {
      code,
      hostId: playerId,
      status: 'lobby',
      players: [{ id: playerId, name: name.trim(), score: 0, answered: 0 }],
      createdAt: Date.now(),
    };
    saveRoom(newRoom);
    setRoomCode(code);
    setRoom(newRoom);
    router.push(`/live/${code}`);
  };

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!name.trim() || !code) return;
    const existing = loadRoom(code);
    if (!existing) { alert('No room found with that code (remember: rooms only work across tabs in this same browser).'); return; }
    if (!existing.players.some((p: any) => p.id === playerId)) {
      existing.players.push({ id: playerId, name: name.trim(), score: 0, answered: 0 });
      saveRoom(existing);
    }
    router.push(`/live/${code}`);
  };

  const startGame = () => {
    if (!room) return;
    const next = { ...room, status: 'playing' };
    saveRoom(next);
    setRoom(next);
  };

  const answer = useCallback((optionIdx: number) => {
    if (!room || !me) return;
    const correct = ROUND[qIdx].answer === optionIdx;
    const players = room.players.map((p: any) => p.id === playerId
      ? { ...p, score: p.score + (correct ? 1 : 0), answered: p.answered + 1 }
      : p);
    const next = { ...room, players };
    saveRoom(next);
    setRoom(next);
    if (qIdx < ROUND.length - 1) {
      setQIdx((i) => i + 1);
    } else {
      const finished = { ...next, status: 'finished' };
      saveRoom(finished);
      setRoom(finished);
    }
  }, [room, me, qIdx, playerId]);

  const copyCode = () => {
    if (!room) return;
    navigator.clipboard?.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const leaveRoom = () => { router.push('/live'); setRoom(null); setRoomCode(null); };

  // --- if in a room, render room states ---
  if (room) {
    if (room.status === 'lobby') {
      return (
        <main className="relative pt-36 pb-24" data-testid="live-lobby">
          <Aurora variant="soft" />
          <div className="relative mx-auto max-w-[720px] px-6 md:px-10">
            <FadeUp><Eyebrow>Room lobby</Eyebrow></FadeUp>
            <FadeUp delay={0.1} className="mt-4 flex items-center gap-3">
              <h1 className="font-display text-[48px] md:text-[64px] leading-[0.95] text-white">{room.code}</h1>
              <button onClick={copyCode} data-testid="live-copy-code" className="w-10 h-10 rounded-full glass glass-hover grid place-items-center text-white">
                {copied ? <Check className="w-4 h-4 text-[color:var(--mint)]" /> : <Copy className="w-4 h-4" />}
              </button>
            </FadeUp>
            <FadeUp delay={0.2} className="mt-2 text-[14px] text-[color:var(--ink-2)]">Share this code — anyone with it (in this browser, on another tab) can join.</FadeUp>

            <FadeUp delay={0.3} className="mt-8 rounded-2xl glass overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.05] flex items-center gap-2 text-[13px] text-[color:var(--ink-2)]">
                <Users className="w-4 h-4" /> {room.players.length} joined
              </div>
              {room.players.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.04] last:border-b-0">
                  <div className="w-9 h-9 rounded-full grid place-items-center font-mono text-[11px] text-white/85 border border-white/10" style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(127,231,206,0.18))' }}>
                    {p.name.slice(0,2).toUpperCase()}
                  </div>
                  <div className="text-[14px] text-white flex-1">{p.name}{p.id === playerId && <span className="text-[color:var(--mute)]"> (you)</span>}</div>
                  {p.id === room.hostId && <Crown className="w-4 h-4 text-[color:var(--gold)]" />}
                </div>
              ))}
            </FadeUp>

            <div className="mt-6 flex items-center gap-3">
              {isHost ? (
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

    if (room.status === 'finished') {
      const standings = [...room.players].sort((a: any, b: any) => b.score - a.score);
      return (
        <main className="relative pt-36 pb-24" data-testid="live-finished">
          <div className="mx-auto max-w-[720px] px-6 md:px-10">
            <FadeUp><Eyebrow>Final standings</Eyebrow></FadeUp>
            <FadeUp delay={0.1}><h1 className="mt-4 font-display text-[44px] leading-[0.95] text-white">Room {room.code} — results</h1></FadeUp>
            <FadeUp delay={0.2} className="mt-8 rounded-2xl glass overflow-hidden">
              {standings.map((p: any, i: number) => (
                <div key={p.id} className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04] last:border-b-0">
                  <div className="font-mono text-[13px] text-[color:var(--mute)] w-6">#{i+1}</div>
                  <div className="text-[14.5px] text-white flex-1">{p.name}{p.id === playerId && <span className="text-[color:var(--mute)]"> (you)</span>}</div>
                  <div className="font-display text-[20px] text-white">{p.score}<span className="font-mono text-[11px] text-[color:var(--mute)] ml-1">/ {ROUND.length}</span></div>
                </div>
              ))}
            </FadeUp>
            <button onClick={leaveRoom} className="mt-6 px-5 py-2.5 rounded-full glass glass-hover text-[13.5px] text-white">Back to Live</button>
          </div>
        </main>
      );
    }

    const q = ROUND[qIdx];
    const standings = [...room.players].sort((a: any, b: any) => b.score - a.score);
    return (
      <main className="relative pt-36 pb-24" data-testid="live-playing">
        <div className="mx-auto max-w-[1000px] px-6 md:px-10 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8">
          <div>
            <div className="font-mono text-[12px] text-[color:var(--mute)]">Question {qIdx + 1} / {ROUND.length}</div>
            <div className="mt-3 rounded-3xl glass p-8">
              <div className="font-display text-[28px] leading-[1.2] text-white">{q.prompt}</div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3">
              {q.options.map((opt: string, i: number) => (
                <button key={i} onClick={()=>answer(i)} data-testid={`live-option-${i}`}
                  className="text-left px-5 py-4 rounded-2xl border border-white/[0.06] hover:border-white/20 bg-white/[0.02] transition-all flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg grid place-items-center font-mono text-[13px] bg-white/[0.06] text-[color:var(--ink-2)] shrink-0">{['A','B','C','D'][i]}</div>
                  <div className="text-[15.5px] text-white">{opt}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)] mb-3">Live standings</div>
            <div className="rounded-2xl glass overflow-hidden">
              {standings.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-b-0">
                  <div className="text-[13px] text-white flex-1 truncate">{p.name}{p.id === playerId && <span className="text-[color:var(--mute)]"> (you)</span>}</div>
                  <div className="font-mono text-[12.5px] text-[color:var(--violet-2)]">{p.score}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // --- Entry screen: no room yet ---
  return (
    <main className="relative pt-36 pb-24" data-testid="live-entry">
      <Aurora variant="soft" />
      <div className="relative mx-auto max-w-[720px] px-6 md:px-10">
        <FadeUp><Eyebrow>Live</Eyebrow></FadeUp>
        <RevealHeading delay={0.1} lines={['Play <span class="italic text-[color:var(--ink-2)]">live</span>, together.']} className="mt-6 font-display text-[52px] md:text-[72px] leading-[0.95] text-white" />
        <FadeUp delay={0.25} className="mt-6 max-w-[560px] text-[15.5px] text-[color:var(--ink-2)]">
          Create a room and share the code, or join one someone else started. <span className="text-[color:var(--gold)]">Demo note:</span> this syncs across tabs in this browser only — a production version needs a real-time backend.
        </FadeUp>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
          <FadeUp delay={0.3}>
            <form onSubmit={createRoom} className="rounded-2xl glass p-6 h-full flex flex-col">
              <div className="font-display text-[20px] text-white">Create a room</div>
              <p className="mt-1 text-[13px] text-[color:var(--ink-2)]">You&apos;ll be the host and control when it starts.</p>
              <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your display name" data-testid="live-create-name"
                className="mt-4 w-full px-4 py-3 rounded-xl glass text-[14px] outline-none placeholder:text-[color:var(--mute)] focus:border-[color:var(--violet)]/50 transition-colors" />
              <button type="submit" data-testid="live-create-btn" className="mt-4 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[color:var(--violet)] hover:bg-[color:var(--violet-2)] text-white text-[13.5px] font-medium transition-colors">
                Create room
              </button>
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
              <button type="submit" data-testid="live-join-btn" className="mt-4 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl glass glass-hover text-white text-[13.5px] font-medium transition-colors">
                Join room
              </button>
            </form>
          </FadeUp>
        </div>
      </div>
    </main>
  );
}

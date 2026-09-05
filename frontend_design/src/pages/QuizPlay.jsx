import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Timer } from 'lucide-react';
import { Wordmark } from '@/components/HexLogo';
import { playQuiz } from '@/mock';

function TimerRing({ mins, secs, total }) {
  const pct = ((mins * 60 + secs) / (total * 60));
  const dash = 2 * Math.PI * 22;
  return (
    <div className="relative w-14 h-14">
      <svg viewBox="0 0 50 50" className="w-14 h-14 -rotate-90">
        <circle cx="25" cy="25" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
        <circle cx="25" cy="25" r="22" fill="none" stroke="url(#tg)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={dash * (1 - pct)} />
        <defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#A78BFA" /><stop offset="1" stopColor="#7FE7CE" /></linearGradient></defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center font-mono text-[11px] text-white">{mins}m</div>
    </div>
  );
}

export default function QuizPlay() {
  const nav = useNavigate();
  const { id } = useParams();
  const quiz = playQuiz;
  const total = quiz.questions.length;
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [seconds, setSeconds] = useState(quiz.totalMinutes * 60);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const cur = quiz.questions[idx];
  const answered = Object.keys(answers).length;
  const mm = Math.floor(seconds / 60), ss = seconds % 60;

  const submit = () => {
    const correct = quiz.questions.filter((q) => answers[q.id] === q.answer).length;
    sessionStorage.setItem(`result-${id || quiz.id}`, JSON.stringify({ correct, total, answers, quiz }));
    nav(`/results/${id || quiz.id}`);
  };

  const chooseKey = (k) => {
    if (!cur) return;
    const map = { a: 0, b: 1, c: 2, d: 3 };
    const v = map[k.toLowerCase()];
    if (v !== undefined && v < cur.options.length) setAnswers((a) => ({ ...a, [cur.id]: v }));
  };

  useEffect(() => {
    const on = (e) => {
      if (['a','b','c','d','A','B','C','D'].includes(e.key)) chooseKey(e.key);
      if (e.key === 'Enter' && idx < total - 1) setIdx(idx + 1);
      if (e.key === 'Escape') nav('/practice');
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [idx, total, cur]);

  const progressPct = useMemo(() => ((idx + 1) / total) * 100, [idx, total]);

  return (
    <main className="relative min-h-screen bg-[color:var(--bg)]" data-testid="play-main">
      <div className="sticky top-0 z-40 backdrop-blur-md bg-[color:var(--bg)]/70 border-b border-white/[0.05]">
        <div className="mx-auto max-w-[1100px] px-6 md:px-10 h-16 flex items-center justify-between">
          <Link to="/practice"><Wordmark size={22} /></Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-6 md:px-10 pt-10 pb-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={()=>nav(-1)} className="w-9 h-9 rounded-full glass grid place-items-center hover:bg-white/[0.06] transition-colors" data-testid="play-back">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-[color:var(--violet)]/15 text-[color:var(--violet-2)] border border-[color:var(--violet)]/25">{quiz.title}</span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono text-[color:var(--mint)] border border-[color:var(--mint)]/30">{quiz.level}</span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono border border-white/10 text-[color:var(--ink-2)]">{quiz.cat}</span>
            <span className="hidden md:inline-flex ml-2 font-mono text-[11px] text-[color:var(--mute)]">{answered}/{total} answered</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="font-mono text-[16px] text-white tabular-nums flex items-center gap-2"><Timer className="w-4 h-4 text-[color:var(--violet-2)]" />{String(mm).padStart(2,'0')}:{String(ss).padStart(2,'0')}</div>
            <TimerRing mins={mm} secs={ss} total={quiz.totalMinutes} />
          </div>
        </div>

        <div className="mt-4 h-[3px] w-full bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div className="h-full" style={{ background: 'linear-gradient(90deg,#A78BFA,#7FE7CE)' }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} />
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {quiz.questions.map((_, i) => (
              <button key={i} onClick={()=>setIdx(i)} data-testid={`qnav-${i+1}`} className={`min-w-[36px] h-9 px-2 rounded-lg text-[12.5px] font-mono transition-colors border ${i === idx ? 'bg-[color:var(--violet)] text-white border-transparent' : answers[quiz.questions[i].id] !== undefined ? 'bg-white/[0.08] text-white border-white/10' : 'bg-transparent text-[color:var(--ink-2)] border-white/10 hover:border-white/25'}`}>{i+1}</button>
            ))}
          </div>
          <div className="font-mono text-[12px] text-[color:var(--mute)]">Q {idx+1} / {total}</div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={cur.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }} className="mt-6 rounded-3xl glass p-8 md:p-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-[color:var(--violet)]/15 text-[color:var(--violet-2)] border border-[color:var(--violet)]/25">Single answer</span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono border border-white/10 text-[color:var(--ink-2)]">1 pt</span>
            </div>
            <div className="mt-6 font-display text-[32px] md:text-[38px] leading-[1.15] text-white">{cur.prompt}</div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-5 grid grid-cols-1 gap-3">
          {cur.options.map((opt, i) => {
            const selected = answers[cur.id] === i;
            const letter = ['A','B','C','D'][i];
            return (
              <button key={i} onClick={()=>setAnswers((a) => ({ ...a, [cur.id]: i }))} data-testid={`option-${letter}`}
                className={`group text-left px-5 py-4 rounded-2xl border transition-all flex items-center gap-4 ${selected ? 'border-[color:var(--violet)]/60 bg-[color:var(--violet)]/[0.08]' : 'border-white/[0.06] hover:border-white/20 bg-white/[0.02]'}`}>
                <div className={`w-9 h-9 rounded-lg grid place-items-center font-mono text-[13px] shrink-0 transition-colors ${selected ? 'bg-[color:var(--violet)] text-white' : 'bg-white/[0.06] text-[color:var(--ink-2)]'}`}>{letter}</div>
                <div className="text-[16px] text-white">{opt}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center gap-3 font-mono text-[11.5px] text-[color:var(--mute)]">
          <span className="px-2 py-0.5 rounded border border-white/10 text-white/70">A</span><span>Select</span>
          <span className="ml-2 px-2 py-0.5 rounded border border-white/10 text-white/70">Enter</span><span>Next</span>
          <span className="ml-2 px-2 py-0.5 rounded border border-white/10 text-white/70">Esc</span><span>Exit</span>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <button onClick={()=>setIdx((i)=>Math.max(0, i-1))} disabled={idx===0} data-testid="play-prev" className="px-4 py-2.5 rounded-full glass glass-hover text-[13.5px] text-white disabled:opacity-40 disabled:cursor-not-allowed">← Previous</button>
          <div className="flex items-center gap-3">
            {idx < total - 1 ? (
              <button onClick={()=>setIdx((i)=>Math.min(total-1, i+1))} data-testid="play-next" className="px-4 py-2.5 rounded-full glass glass-hover text-[13.5px] text-white">Next →</button>
            ) : null}
            <button onClick={submit} data-testid="play-submit" className="px-5 py-2.5 rounded-full bg-[color:var(--violet)] hover:bg-[color:var(--violet-2)] text-white text-[13.5px] font-medium transition-colors">Finish &amp; submit</button>
          </div>
        </div>
      </div>
    </main>
  );
}

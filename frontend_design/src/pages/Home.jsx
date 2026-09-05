import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { ArrowUpRight, ArrowRight, Zap, ChevronRight } from 'lucide-react';
import Aurora from '@/components/Aurora';
import { Eyebrow, RevealHeading, FadeUp } from '@/components/Reveal';
import { Hex } from '@/components/Hex';
import { categories, quizzes, codeSnippets, leaders, stats, testimonials } from '@/mock';

function CodeConstellation() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % codeSnippets.length), 2600);
    return () => clearInterval(t);
  }, []);
  const s = codeSnippets[idx];
  return (
    <div className="relative w-full h-[520px]">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 520" fill="none">
        <motion.path d="M 90 380 L 260 220 L 470 140 L 540 300 L 380 460 L 90 380"
          stroke="url(#lg)" strokeWidth="1" strokeDasharray="4 6"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.55 }}
          transition={{ duration: 2.4, ease: 'easeInOut' }} />
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A78BFA" /><stop offset="100%" stopColor="#7FE7CE" />
          </linearGradient>
        </defs>
      </svg>
      {[{x:90,y:380,c:'#A78BFA',d:0.3},{x:260,y:220,c:'#7FE7CE',d:0.6},{x:470,y:140,c:'#F5C775',d:0.9},{x:540,y:300,c:'#A78BFA',d:1.2},{x:380,y:460,c:'#FF9E7A',d:1.5}].map((p, i) => (
        <motion.span key={i} className="absolute rounded-full"
          style={{ left: p.x, top: p.y, width: 10, height: 10, background: p.c, boxShadow: `0 0 20px ${p.c}` }}
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: p.d, duration: 0.6, ease: 'easeOut' }} />
      ))}
      <motion.div className="absolute" style={{ left: 250, top: 210 }}
        animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
        <Hex size={72} color="#A78BFA" />
      </motion.div>
      <motion.div drag dragElastic={0.08} dragConstraints={{ left: -20, right: 20, top: -20, bottom: 20 }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="absolute right-2 top-6 w-[340px] glass rounded-2xl p-5 cursor-grab active:cursor-grabbing shadow-[0_30px_80px_-30px_rgba(139,124,246,0.5)]">
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[color:var(--violet)]/15 text-[11px] font-mono text-[color:var(--violet-2)] border border-[color:var(--violet)]/25">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--violet-2)]" />{s.lang}
          </span>
          <div className="flex gap-1"><span className="h-2 w-2 rounded-full bg-white/10" /><span className="h-2 w-2 rounded-full bg-white/10" /><span className="h-2 w-2 rounded-full bg-white/10" /></div>
        </div>
        <motion.div key={s.q} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="font-mono text-[15px] text-white leading-relaxed">{s.q}</motion.div>
        <motion.div key={s.a + s.q} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-3 font-mono text-[13.5px] text-[color:var(--mint)]"><span className="text-[color:var(--mute)]">→ </span>{s.a}</motion.div>
        <div className="mt-5 flex items-center gap-2 font-mono text-[11px] text-[color:var(--mute)]">
          <span className="px-1.5 py-0.5 rounded border border-white/10">A</span>
          <span className="px-1.5 py-0.5 rounded border border-white/10">B</span>
          <span className="px-1.5 py-0.5 rounded border border-white/10 bg-white/[0.06]">C</span>
          <span className="px-1.5 py-0.5 rounded border border-white/10">D</span>
          <span className="ml-auto">6s</span>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.9 }} className="absolute left-0 bottom-8 w-[240px] glass rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[color:var(--mute)]">Streak</div>
          <Zap className="w-3.5 h-3.5 text-[color:var(--gold)]" />
        </div>
        <div className="mt-2 font-display text-[36px] leading-none text-white">42<span className="text-[color:var(--mute)] text-[18px] ml-1">days</span></div>
        <div className="mt-3 flex gap-1">
          {Array.from({ length: 14 }).map((_, i) => (<span key={i} className="h-6 w-2 rounded-sm" style={{ background: `rgba(167,139,250,${0.15 + (i/14)*0.75})` }} />))}
        </div>
      </motion.div>
    </div>
  );
}

function Stat({ n, l, delay=0 }) {
  return (
    <FadeUp delay={delay} className="flex items-baseline gap-3">
      <span className="font-display text-[44px] md:text-[54px] leading-none text-white">{n}</span>
      <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[color:var(--mute)] max-w-[90px]">{l}</span>
    </FadeUp>
  );
}

function CategoryCard({ c, i }) {
  return (
    <FadeUp delay={i * 0.05}>
      <Link to="/practice" className="group block relative rounded-2xl glass glass-hover p-6 h-[180px] overflow-hidden" data-testid={`category-card-${c.slug}`}>
        <div className="absolute -right-8 -top-8 opacity-20 group-hover:opacity-45 transition-opacity duration-500"><Hex size={130} color={c.color} /></div>
        <div className="relative flex flex-col h-full justify-between">
          <div className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)]"><span className="h-1 w-1 rounded-full" style={{ background: c.color }} />track</div>
          <div>
            <div className="font-display text-[28px] leading-tight text-white">{c.name}</div>
            <div className="mt-1 text-[13px] text-[color:var(--ink-2)]">{c.hint}</div>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-[color:var(--mute)]">{c.count} quizzes</span>
            <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </div>
      </Link>
    </FadeUp>
  );
}

function LiveTicker() {
  const items = [
    { name: 'Kaia',  did: 'DBMS: Indexing', score: '11/12' },
    { name: 'Govind',did: 'Async JavaScript', score: '13/14' },
    { name: 'Yuki',  did: 'System Design: Feeds', score: '7/8' },
    { name: 'Nadia', did: 'Playwright in Practice', score: '14/15' },
    { name: 'Ramesh',did: 'Python Fluency', score: '15/16' },
    { name: 'Milo',  did: 'AWS: IAM Deep Dive', score: '10/12' },
  ];
  return (
    <div className="relative overflow-hidden border-y border-white/[0.06] py-4 bg-black/40">
      <div className="flex marquee-track w-[200%] gap-12">
        {[...items, ...items, ...items].map((it, i) => (
          <div key={i} className="flex items-center gap-3 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--mint)]" />
            <span className="font-mono text-[12px] text-[color:var(--ink-2)]">{it.name}</span>
            <span className="font-mono text-[12px] text-[color:var(--mute)]">→</span>
            <span className="text-[13px] text-white">{it.did}</span>
            <span className="font-mono text-[12px] text-[color:var(--violet-2)]">{it.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.2]);
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 }), sy = useSpring(my, { stiffness: 60, damping: 20 });

  return (
    <main className="relative" data-testid="home-main">
      <section ref={heroRef} className="relative pt-40 pb-24 md:pt-48 md:pb-32 overflow-hidden" onMouseMove={(e) => { mx.set(e.clientX); my.set(e.clientY); }}>
        <Aurora />
        <motion.div className="spotlight" style={{ left: sx, top: sy, opacity: 0.6 }} />
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative mx-auto max-w-[1400px] px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-6">
              <FadeUp><Eyebrow>Interview-grade · no signup required</Eyebrow></FadeUp>
              <RevealHeading delay={0.15} lines={['Prove your','<span class="text-[color:var(--violet-2)]">stack</span><span class="text-white">,</span>','not your trivia.']} className="mt-6 font-display text-[64px] md:text-[92px] leading-[0.92] text-white" />
              <FadeUp delay={0.6} className="mt-8 max-w-[520px] text-[17px] leading-relaxed text-[color:var(--ink-2)]">
                Sharpen JavaScript, Python, networking, SQL and system design with quizzes built by engineers for the questions you'll actually be asked.
              </FadeUp>
              <FadeUp delay={0.75} className="mt-10 flex flex-wrap items-center gap-3">
                <Link to="/practice" className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[color:var(--ink)] text-[#0A0A0F] text-[14px] font-medium hover:bg-white transition-all hover:shadow-[0_15px_40px_-10px_rgba(255,255,255,0.25)]" data-testid="hero-start-btn">
                  Start a quiz — guest mode <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link to="/leaderboard" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full glass glass-hover text-[14px] text-white" data-testid="hero-leaderboard-btn">See the leaderboard</Link>
              </FadeUp>
              <FadeUp delay={0.9} className="mt-14 grid grid-cols-3 gap-6 max-w-[520px]">
                <Stat n={stats.categories} l="topic tracks" delay={0} />
                <Stat n={stats.questions} l="crafted questions" delay={0.1} />
                <Stat n={stats.live} l="live right now" delay={0.2} />
              </FadeUp>
            </div>
            <div className="lg:col-span-6 relative"><CodeConstellation /></div>
          </div>
        </motion.div>
      </section>

      <LiveTicker />

      <section className="relative py-28">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <div className="flex items-end justify-between mb-14">
            <div>
              <FadeUp><Eyebrow>Pick a track</Eyebrow></FadeUp>
              <FadeUp delay={0.1}>
                <h2 className="mt-5 font-display text-[44px] md:text-[64px] leading-[0.95] text-white max-w-[760px]">Practice what you'll <span className="italic text-[color:var(--ink-2)]">actually</span> be asked.</h2>
              </FadeUp>
            </div>
            <FadeUp delay={0.2} className="hidden md:block">
              <Link to="/practice" className="inline-flex items-center gap-1.5 text-[13.5px] text-[color:var(--ink-2)] hover:text-white transition-colors">Browse all <ChevronRight className="w-4 h-4" /></Link>
            </FadeUp>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((c, i) => <CategoryCard key={c.slug} c={c} i={i} />)}
          </div>
        </div>
      </section>

      <section className="relative py-20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <div className="flex items-end justify-between mb-12">
            <div>
              <FadeUp><Eyebrow>Fresh questions</Eyebrow></FadeUp>
              <FadeUp delay={0.1}><h2 className="mt-4 font-display text-[40px] md:text-[52px] leading-[0.95] text-white">Live right now.</h2></FadeUp>
            </div>
            <FadeUp delay={0.15}>
              <Link to="/practice" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass glass-hover text-[13px] text-white">Browse all <ChevronRight className="w-4 h-4" /></Link>
            </FadeUp>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quizzes.slice(0, 3).map((q, i) => (
              <FadeUp key={q.id} delay={i * 0.08}>
                <Link to={`/play/${q.id}`} className="group relative rounded-2xl glass glass-hover p-6 h-full block" data-testid={`live-quiz-${q.id}`}>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-[color:var(--violet)]/15 text-[color:var(--violet-2)] border border-[color:var(--violet)]/25">{q.cat}</span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono border border-white/10 text-[color:var(--ink-2)]">{q.level}</span>
                  </div>
                  <div className="mt-5 font-display text-[26px] leading-tight text-white">{q.title}</div>
                  <div className="mt-2 text-[14px] text-[color:var(--ink-2)] leading-relaxed">{q.desc}</div>
                  <div className="mt-6 flex items-center justify-between font-mono text-[11.5px] text-[color:var(--mute)]">
                    <span>{q.q} questions · {q.min} min</span>
                    <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <FadeUp><Eyebrow>This week</Eyebrow></FadeUp>
              <FadeUp delay={0.1}><h2 className="mt-4 font-display text-[40px] md:text-[52px] leading-[0.95] text-white">Who's <span className="italic text-[color:var(--ink-2)]">shipping</span>.</h2></FadeUp>
              <FadeUp delay={0.2} className="mt-6 text-[15px] text-[color:var(--ink-2)] leading-relaxed max-w-md">Every completed quiz earns points — top of the podium changes daily. No pay-to-win, no lucky guessing.</FadeUp>
              <FadeUp delay={0.3} className="mt-8"><Link to="/leaderboard" className="inline-flex items-center gap-2 px-5 py-3 rounded-full glass glass-hover text-[13.5px] text-white">Full leaderboard <ArrowUpRight className="w-4 h-4" /></Link></FadeUp>
            </div>
            <div className="lg:col-span-8">
              <div className="rounded-3xl glass overflow-hidden">
                {leaders.slice(0, 5).map((l, i) => (
                  <FadeUp key={l.rank} delay={i * 0.05}>
                    <div className={`flex items-center gap-5 px-6 py-5 ${i !== 0 ? 'border-t border-white/[0.05]' : ''}`}>
                      <div className="font-mono text-[13px] w-8 text-[color:var(--mute)]">#{l.rank}</div>
                      <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-display text-[14px] text-white" style={{ background: `linear-gradient(135deg, rgba(167,139,250,0.4), rgba(127,231,206,0.3))`, border: '1px solid rgba(255,255,255,0.1)' }}>{l.initials}</div>
                      <div className="flex-1">
                        <div className="text-[15px] text-white">{l.name}</div>
                        <div className="font-mono text-[11px] text-[color:var(--mute)]">{l.country} · {l.streak}-day streak</div>
                      </div>
                      <div className="font-display text-[22px] text-white">{l.pts.toLocaleString()}<span className="font-mono text-[11px] text-[color:var(--mute)] ml-1">pts</span></div>
                    </div>
                  </FadeUp>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <FadeUp><Eyebrow>Field notes</Eyebrow></FadeUp>
          <FadeUp delay={0.1}><h2 className="mt-4 font-display text-[40px] md:text-[56px] leading-[0.95] text-white max-w-[720px]">Loved by engineers <span className="italic text-[color:var(--ink-2)]">who ship</span>.</h2></FadeUp>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <FadeUp key={t.name} delay={i * 0.08}>
                <div className="rounded-2xl glass p-7 h-full">
                  <div className="font-display text-[20px] leading-[1.35] text-white">"{t.quote}"</div>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center font-mono text-[11px] text-white/80">{t.name.split(' ').map(n=>n[0]).join('')}</div>
                    <div>
                      <div className="text-[13.5px] text-white">{t.name}</div>
                      <div className="font-mono text-[11px] text-[color:var(--mute)]">{t.role}</div>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-28">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <div className="relative rounded-[32px] overflow-hidden glass p-10 md:p-16">
            <Aurora variant="soft" />
            <div className="relative flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
              <div>
                <Eyebrow>Free forever · no card</Eyebrow>
                <h2 className="mt-5 font-display text-[48px] md:text-[76px] leading-[0.92] text-white max-w-[720px]">Rep the questions. <span className="italic text-[color:var(--ink-2)]">Own the room.</span></h2>
              </div>
              <Link to="/login" className="group inline-flex items-center gap-2 px-7 py-4 rounded-full bg-[color:var(--ink)] text-[#0A0A0F] text-[14px] font-medium hover:bg-white transition-all">Create your account <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

import React from 'react';
import { Eyebrow, FadeUp } from '@/components/Reveal';
import { attemptsWeek, avgScoreTrend, topCategoriesWeek, adminStats } from '@/mock';

export default function Analytics() {
  return (
    <div data-testid="admin-analytics">
      <FadeUp><Eyebrow>Admin</Eyebrow></FadeUp>
      <FadeUp delay={0.1}><h1 className="mt-4 font-display text-[48px] md:text-[64px] leading-[0.95] text-white">Analytics</h1></FadeUp>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { l: 'Attempts (7d)', n: attemptsWeek.reduce((s,d)=>s+d.val,0), c: '#A78BFA' },
          { l: 'Avg score (30d)', n: `${adminStats.avgScore}%`, c: '#7FE7CE' },
          { l: 'Top track', n: topCategoriesWeek[0]?.name || '—', c: '#F5C775' },
        ].map((s, i) => (
          <FadeUp key={i} delay={i * 0.08}>
            <div className="rounded-2xl glass p-6">
              <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)]">{s.l}</div>
              <div className="mt-3 font-display text-[40px] leading-none" style={{ color: s.c }}>{s.n}</div>
            </div>
          </FadeUp>
        ))}
      </div>

      <FadeUp delay={0.2} className="mt-6 rounded-2xl glass p-6">
        <div className="font-display text-[22px] text-white">Score distribution (last 30 days)</div>
        <div className="mt-6 grid grid-cols-10 items-end gap-2 h-[220px]">
          {avgScoreTrend.concat(attemptsWeek.slice(0,5)).map((d, i) => (
            <div key={i} className="rounded-md" style={{ height: `${Math.max(6, (d.val || 0))}%`, background: 'linear-gradient(180deg, rgba(167,139,250,0.9), rgba(167,139,250,0.15))' }} />
          ))}
        </div>
      </FadeUp>
    </div>
  );
}

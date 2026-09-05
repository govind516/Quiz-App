"use client";
import React from "react";
import Link from "next/link";
import { Wordmark } from "@/components/HexLogo";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] mt-24" data-testid="site-footer">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <Wordmark size={30} />
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[color:var(--ink-2)]">
              Interview-grade quizzes for the topics that actually get asked. No trivia. No filler. Just the rep.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-[color:var(--mute)]">v2.4</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-[color:var(--mute)]">shipped from Berlin</span>
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-[color:var(--mute)] mb-4">Product</div>
            <ul className="space-y-2.5 text-[14px] text-[color:var(--ink-2)]">
              <li><Link href="/practice" className="hover:text-white transition-colors">Practice</Link></li>
              <li><Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Sign up</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-[color:var(--mute)] mb-4">Tracks</div>
            <ul className="space-y-2.5 text-[14px] text-[color:var(--ink-2)]">
              <li>JavaScript</li><li>Python</li><li>DBMS</li><li>System Design</li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-[color:var(--mute)] mb-4">Ship notes</div>
            <p className="text-[14px] text-[color:var(--ink-2)] leading-relaxed">A weekly dispatch with new questions, teardown of one interview problem, and the occasional bad joke.</p>
            <form onSubmit={(e) => e.preventDefault()} className="mt-4 flex items-center rounded-full glass overflow-hidden">
              <input type="email" placeholder="you@company.com" className="flex-1 bg-transparent px-4 py-2.5 text-[13.5px] outline-none placeholder:text-[color:var(--mute)]" />
              <button className="px-4 py-2.5 text-[13px] bg-[color:var(--ink)] text-[#0A0A0F] hover:bg-white transition-colors">Subscribe</button>
            </form>
          </div>
        </div>
        <div className="mt-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-8 border-t border-white/[0.05]">
          <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-[color:var(--mute)]">© 2025 HexQuiz — built for people who ship</div>
          <div className="flex items-center gap-4 font-mono text-[11px] tracking-[0.14em] uppercase text-[color:var(--mute)]">
            <span>Privacy</span><span>Terms</span><span>Contact</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

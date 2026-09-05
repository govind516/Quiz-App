"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Wordmark } from "@/components/HexLogo";
import { ArrowUpRight } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const links = [
  { to: "/practice", label: "Practice" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/admin", label: "Build" },
  { to: "/admin/review", label: "Live" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { user } = useAuthStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "py-3" : "py-5"}`}
      data-testid="site-nav"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className={`flex items-center justify-between rounded-full px-4 md:px-6 py-2.5 transition-all duration-500 ${scrolled ? "glass shadow-[0_10px_40px_-20px_rgba(139,124,246,0.35)]" : "bg-transparent border border-transparent"}`}>
          <Link href="/" className="flex items-center" data-testid="nav-logo-link">
            <Wordmark size={26} />
          </Link>

          <nav className="hidden md:flex items-center gap-1 relative">
            {links.map((l) => {
              const active = l.to === "/admin" ? pathname === "/admin" : pathname === l.to;
              return (
                <Link key={l.to} href={l.to} className="relative px-5 py-2 text-[13.5px] text-[color:var(--ink-2)] hover:text-white transition-colors" data-testid={`nav-link-${l.label.toLowerCase()}`}>
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-white/[0.06] border border-white/10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative">{l.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {user && user.role === "ADMIN" && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono text-[color:var(--violet-2)] border border-[color:var(--violet)]/25 bg-[color:var(--violet)]/10">
                Admin
              </span>
            )}
            {!user ? (
              <>
                <Link href="/login" className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13.5px] text-[color:var(--ink-2)] hover:text-white hover:bg-white/[0.04] transition-colors" data-testid="nav-login-link">
                  Log in
                </Link>
                <Link href="/login" className="group inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13.5px] font-medium bg-[color:var(--ink)] text-[#0A0A0F] hover:bg-white transition-colors" data-testid="nav-start-btn">
                  Start free
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </>
            ) : (
              <Link href="/me" className="w-8 h-8 rounded-full grid place-items-center font-mono text-xs text-white border border-white/10" style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.25), rgba(127,231,206,0.18))" }}>
                {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { API_BASE_URL } from "@/lib/config";
import { IconHexLogo } from "./icons";

const emptySubscribe = () => () => {};

function useActiveIndicator(activeRef: React.RefObject<HTMLAnchorElement | null>, containerRef: React.RefObject<HTMLDivElement | null>) {
  const [style, setStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  useEffect(() => {
    function update() {
      const active = activeRef.current;
      const container = containerRef.current;
      if (!active || !container) {
        setStyle((s) => ({ ...s, opacity: 0 }));
        return;
      }
      const cRect = container.getBoundingClientRect();
      const aRect = active.getBoundingClientRect();
      setStyle({ left: aRect.left - cRect.left, width: aRect.width, opacity: 1 });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [activeRef, containerRef]);

  return style;
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const navContainerRef = useRef<HTMLDivElement>(null);
  const activeLinkRef = useRef<HTMLAnchorElement>(null);

  const indicatorStyle = useActiveIndicator(activeLinkRef as React.RefObject<HTMLAnchorElement | null>, navContainerRef as React.RefObject<HTMLDivElement | null>);

  useEffect(() => {
    if (!navContainerRef.current) return;
    const active = navContainerRef.current.querySelector<HTMLAnchorElement>('a[data-active="true"]');
    if (active) {
      (activeLinkRef as React.MutableRefObject<HTMLAnchorElement | null>).current = active;
      const cRect = navContainerRef.current.getBoundingClientRect();
      const aRect = active.getBoundingClientRect();
      const left = aRect.left - cRect.left;
      const width = aRect.width;
      // trigger update via forced re-render — we rely on pathname change to re-run effect above
    }
  });

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

function avatarInitials(name: string): string {
  return name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function AvatarDropdown({ user, logout, router }: { user: { name: string }; logout: () => void; router: ReturnType<typeof useRouter> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  async function handleLogout() {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {}
    }
    logout();
    setOpen(false);
    router.push("/");
  }
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition hover:brightness-110"
        style={{ background: "var(--color-surface2)", borderColor: "var(--color-line)", color: "var(--color-ink)", fontFamily: "var(--font-apple), sans-serif" }}
        aria-label="User menu"
      >
        {avatarInitials(user.name)}
      </button>
      {open && (
        <div className="card !p-1.5 pop absolute right-0 top-[44px] z-50 min-w-[160px]" style={{ boxShadow: "var(--shadow-raised)" }}>
          <Link href="/me" onClick={() => setOpen(false)} className="flex w-full items-center rounded-lg px-3 py-2 text-sm hover:bg-surface2 transition" style={{ fontFamily: "var(--font-apple), sans-serif", color: "var(--color-ink)" }}>
            Progress
          </Link>
          <button onClick={handleLogout} className="flex w-full items-center rounded-lg px-3 py-2 text-sm hover:bg-surface2 transition text-left" style={{ fontFamily: "var(--font-apple), sans-serif", color: "var(--color-mutedc)" }}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

  const navLinks = [
    { href: "/browse", label: "Practice" },
    { href: "/leaderboard", label: "Leaderboard" },
    ...(mounted && user ? [{ href: "/build", label: "Build" }, { href: "/live/create", label: "Live" }] : []),
  ];

  const mobileLinks = navLinks;

  return (
    <header
      className="sticky top-0 z-30 border-b"
      style={{
        borderColor: "var(--color-line)",
        background: "var(--color-bg) / 0.75",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-10">
        <nav className="site-nav flex-wrap gap-y-2">
          <Link href="/" className="brand">
            <IconHexLogo size={24} />
            HexQuiz
          </Link>
          <div
            ref={navContainerRef}
            className="nav-links hidden md:flex relative"
            style={{ fontFamily: "var(--font-apple), sans-serif" }}
          >
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  data-active={active ? "true" : undefined}
                  ref={active ? activeLinkRef : undefined}
                  className={active ? "active" : undefined}
                  style={{
                    fontSize: 14,
                    fontWeight: active ? 600 : 500,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
            <div
              className="nav-indicator hidden md:block"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
                opacity: indicatorStyle.opacity,
                bottom: -2,
              }}
            />
          </div>
          <nav className="flex items-center gap-2 relative" style={{ fontFamily: "var(--font-apple), sans-serif" }}>
            {mounted && user ? (
              <>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="badge badge-violet hidden sm:inline-flex"
                    style={{ fontFamily: "var(--font-apple), sans-serif" }}
                  >
                    Admin
                  </Link>
                )}
                <AvatarDropdown user={user} logout={logout} router={router} />
              </>
            ) : mounted ? (
              <>
                <Link href="/auth" className="btn btn-ghost btn-sm" style={{ fontFamily: "var(--font-apple), sans-serif" }}>
                  Log in
                </Link>
                <Link href="/auth?mode=signup" className="btn btn-primary btn-sm" style={{ borderRadius: 999, fontFamily: "var(--font-apple), sans-serif" }}>
                  Start free
                </Link>
              </>
            ) : (
              <div className="h-[34px] w-[150px]" />
            )}
          </nav>
        </nav>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 md:hidden">
          {mobileLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="badge whitespace-nowrap shrink-0 hover:border-violet hover:text-violet"
              style={{ fontFamily: "var(--font-apple), sans-serif" }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}

"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { usersList } from "@/lib/mock";

type AuthUser = { email: string | null; name: string; isAdmin: boolean; guest?: boolean };

const STORAGE_KEY = "hexquiz-auth";

function readStored(): AuthUser | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

type Ctx = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hydrated: boolean;
  login: (email: string) => { isAdmin: boolean };
  /** Set the session directly (e.g. after a real backend login). Persists via the effect below. */
  setSession: (u: AuthUser) => void;
  loginAsGuest: () => void;
  logout: () => void;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUser(readStored());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user, hydrated]);

  const login = (email: string) => {
    const normalized = (email || "").trim().toLowerCase();
    const match = usersList.find((u) => u.email.toLowerCase() === normalized);
    const isAdmin = match?.role === "Admin";
    const name = match?.name || "Guest player";
    const next: AuthUser = { email: normalized, name, isAdmin: !!isAdmin };
    setUser(next);
    // also sync to Zustand backend auth for API calls (best-effort)
    try {
      const raw = localStorage.getItem("quiz.auth");
      void raw;
    } catch {}
    return { isAdmin: !!isAdmin };
  };

  const loginAsGuest = () => setUser({ email: null, name: "Guest", isAdmin: false, guest: true });
  const logout = () => setUser(null);

  const value: Ctx = {
    user,
    isAuthenticated: !!user,
    isAdmin: !!user?.isAdmin,
    hydrated,
    login,
    setSession: (u: AuthUser) => setUser(u),
    loginAsGuest,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usersList } from '@/mock';

const AuthContext = createContext(null);

const STORAGE_KEY = 'hexquiz-auth';

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStored());

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  // Demo-only auth: matches the email against the seeded admin account in mock data.
  // There is no real backend/password check here — see README note in BuildQuiz/LiveRoom.
  const login = (email) => {
    const normalized = (email || '').trim().toLowerCase();
    const match = usersList.find((u) => u.email.toLowerCase() === normalized);
    const isAdmin = match?.role === 'Admin';
    const name = match?.name || 'Guest player';
    setUser({ email: normalized, name, isAdmin });
    return { isAdmin };
  };

  const loginAsGuest = () => setUser({ email: null, name: 'Guest', isAdmin: false, guest: true });

  const logout = () => setUser(null);

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: !!user?.isAdmin,
    login,
    loginAsGuest,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

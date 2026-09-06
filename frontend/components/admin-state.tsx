"use client";

import React from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { ApiError } from "@/lib/api";

export function AdminLoading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="mt-8 space-y-4" data-testid="admin-loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl glass p-6 animate-pulse">
          <div className="h-5 w-40 rounded-full bg-white/[0.06]" />
          <div className="mt-4 h-7 w-3/4 rounded-lg bg-white/[0.06]" />
          <div className="mt-2 h-4 w-full rounded bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

function isAuthError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

export function AdminError({ error, retry }: { error: unknown; retry?: () => void }) {
  const auth = isAuthError(error);
  const message =
    error instanceof Error && error.message
      ? error.message
      : "Request failed";
  return (
    <div
      className="mt-8 rounded-2xl border border-[color:var(--coral)]/30 bg-[color:var(--coral)]/[0.06] p-6"
      data-testid="admin-error"
      role="alert"
    >
      <div className="flex items-center gap-2 text-[color:var(--coral)]">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-[14px] font-medium">Couldn&apos;t load admin data</span>
      </div>
      <p className="mt-2 text-[13px] text-[color:var(--ink-2)]">
        {auth
          ? "The admin API rejected this session. Log in again with the backend admin account (email + ADMIN_PASSWORD) — demo/guest sessions carry no backend token."
          : message}
      </p>
      {retry && (
        <button
          onClick={retry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full glass glass-hover text-[13px] text-white"
        >
          <RotateCw className="w-3.5 h-3.5" /> Retry
        </button>
      )}
    </div>
  );
}

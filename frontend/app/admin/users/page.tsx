"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Eyebrow, FadeUp } from "@/components/Reveal";
import { AdminError, AdminLoading } from "@/components/admin-state";
import { api } from "@/lib/api";
import type { AdminUsersResponse } from "@/lib/types";

export default function Users() {
  // Live users from the database — no mock fallback in the admin console.
  const usersQuery = useQuery({
    queryKey: ["admin", "users-list"],
    queryFn: () => api<AdminUsersResponse>("/api/admin/users?page=0&size=20"),
    retry: false,
  });

  const usersList = (usersQuery.data?.items ?? []).map((u) => ({
    name: u.name,
    email: u.email,
    role: u.role === "ADMIN" ? "Admin" : "Player",
    joined: new Date(u.createdAt).toLocaleDateString(),
    attempts: u.completedAttempts,
  }));

  return (
    <div data-testid="admin-users">
      <FadeUp>
        <Eyebrow>Admin</Eyebrow>
      </FadeUp>
      <FadeUp delay={0.1}>
        <h1 className="mt-4 font-display text-[48px] md:text-[64px] leading-[0.95] text-white">Users</h1>
      </FadeUp>
      <FadeUp delay={0.2} className="mt-2 text-[color:var(--ink-2)]">
        {!usersQuery.isPending && !usersQuery.isError
          ? `${usersQuery.data?.total ?? usersList.length} accounts`
          : " "}
      </FadeUp>

      {usersQuery.isError ? (
        <AdminError error={usersQuery.error} retry={() => usersQuery.refetch()} />
      ) : usersQuery.isPending ? (
        <AdminLoading rows={4} />
      ) : (
      <FadeUp delay={0.25} className="mt-8 rounded-3xl glass overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.05] font-mono text-[10.5px] tracking-[0.16em] uppercase text-[color:var(--mute)]">
          <div className="col-span-4">User</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-1">Role</div>
          <div className="col-span-2">Joined</div>
          <div className="col-span-2 text-right">Attempts</div>
        </div>
        {usersList.length === 0 && (
          <div className="px-6 py-10 text-center text-[13.5px] text-[color:var(--mute)]">
            No accounts yet.
          </div>
        )}
        {usersList.map((u: any, i: number) => (
          <div
            key={u.email}
            className={`grid grid-cols-12 gap-4 items-center px-6 py-4 ${i !== usersList.length - 1 ? "border-b border-white/[0.04]" : ""} hover:bg-white/[0.02] transition-colors`}
          >
            <div className="col-span-4 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full grid place-items-center font-mono text-[11px] text-white/85 border border-white/10"
                style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.25), rgba(127,231,206,0.18))" }}
              >
                {u.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="text-[14px] text-white">{u.name}</div>
            </div>
            <div className="col-span-3 font-mono text-[12.5px] text-[color:var(--ink-2)] truncate">{u.email}</div>
            <div className="col-span-1">
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-mono ${u.role === "Admin" ? "text-[color:var(--violet-2)] bg-[color:var(--violet)]/10 border border-[color:var(--violet)]/25" : "text-[color:var(--ink-2)] bg-white/[0.04] border border-white/10"}`}
              >
                {u.role}
              </span>
            </div>
            <div className="col-span-2 font-mono text-[12px] text-[color:var(--mute)]">{u.joined}</div>
            <div className="col-span-2 text-right text-[14px] text-white">{u.attempts}</div>
          </div>
        ))}
      </FadeUp>
      )}
    </div>
  );
}

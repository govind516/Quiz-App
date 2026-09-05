"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eyebrow, FadeUp } from "@/components/Reveal";
import { api } from "@/lib/api";
import type { PlatformSettings } from "@/lib/types";

function Toggle({ on, onChange, testId }: { on: boolean; onChange: (v: boolean) => void; testId: string }) {
  return (
    <button
      onClick={() => onChange(!on)}
      data-testid={testId}
      className={`w-11 h-6 rounded-full relative transition-colors ${on ? "bg-[color:var(--violet)]" : "bg-white/[0.08] border border-white/10"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

export default function Settings() {
  const queryClient = useQueryClient();
  const [aiReview, setAiReview] = useState(true);
  const [publicLb, setPublicLb] = useState(true);
  const [emails, setEmails] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("HexQuiz — Prod");
  const [supportEmail, setSupportEmail] = useState("team@hexquiz.dev");

  // TODO: backend wiring — fetch/save PlatformSettings; fallback keeps local state
  const settingsQuery = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api<PlatformSettings>("/api/admin/settings"),
    retry: false,
  });
  const updateMutation = useMutation({
    mutationFn: (update: Partial<PlatformSettings>) => api<PlatformSettings>("/api/admin/settings", { method: "PUT", body: update }),
    onSuccess: (data) => queryClient.setQueryData(["admin", "settings"], data),
  });

  // sync from API when available
  React.useEffect(() => {
    if (settingsQuery.data) {
      setAiReview(settingsQuery.data.aiGenerationEnabled ?? true);
    }
  }, [settingsQuery.data]);

  const handleToggle = (key: string, value: boolean) => {
    if (key === "ai") {
      setAiReview(value);
      updateMutation.mutate({ aiGenerationEnabled: value } as any, { onError: () => setAiReview(!value) });
    } else if (key === "lb") {
      setPublicLb(value);
      // TODO: wire public leaderboard setting when backend adds it
    } else if (key === "email") {
      setEmails(value);
      // TODO: wire email setting when backend adds it
    }
  };

  return (
    <div data-testid="admin-settings">
      <FadeUp>
        <Eyebrow>Admin</Eyebrow>
      </FadeUp>
      <FadeUp delay={0.1}>
        <h1 className="mt-4 font-display text-[48px] md:text-[64px] leading-[0.95] text-white">Settings</h1>
      </FadeUp>

      <FadeUp delay={0.2} className="mt-8 rounded-2xl glass p-6">
        <div className="font-display text-[22px] text-white">Workspace</div>
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-[13.5px] text-white mb-2">Workspace name</label>
            <input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass text-[14px] outline-none focus:border-[color:var(--violet)]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13.5px] text-white mb-2">Support email</label>
            <input
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass text-[14px] outline-none focus:border-[color:var(--violet)]/50 transition-colors"
            />
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={0.25} className="mt-6 rounded-2xl glass p-6">
        <div className="font-display text-[22px] text-white">Content policy</div>
        <div className="mt-5 divide-y divide-white/[0.05]">
          {[
            { l: "AI drafts go to review queue", s: "Recommended · avoids surprises going live", k: aiReview, on: (v: boolean) => handleToggle("ai", v), id: "set-ai" },
            { l: "Public leaderboard", s: "Anyone can see the top 100", k: publicLb, on: (v: boolean) => handleToggle("lb", v), id: "set-lb" },
            { l: "Weekly recap emails", s: "Send a Monday digest to every player", k: emails, on: (v: boolean) => handleToggle("email", v), id: "set-email" },
          ].map((r) => (
            <div key={r.id} className="flex items-center justify-between py-4">
              <div>
                <div className="text-[14px] text-white">{r.l}</div>
                <div className="text-[12.5px] text-[color:var(--ink-2)]">{r.s}</div>
              </div>
              <Toggle on={r.k} onChange={r.on} testId={r.id} />
            </div>
          ))}
        </div>
      </FadeUp>

      <FadeUp delay={0.3} className="mt-6 rounded-2xl glass p-6">
        <div className="font-display text-[22px] text-white">Danger zone</div>
        <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="text-[13.5px] text-[color:var(--ink-2)]">Wipe all draft questions from the review queue. Approved questions are safe.</div>
          <button
            className="px-4 py-2.5 rounded-full text-[13px] text-[color:var(--coral)] border border-[color:var(--coral)]/30 hover:bg-[color:var(--coral)]/10 transition-colors"
            data-testid="danger-clear"
            onClick={() => {
              // TODO: wire DELETE /api/admin/questions?status=PENDING_REVIEW
              if (confirm("Clear all drafts?")) {
                // placeholder
              }
            }}
          >
            Clear drafts
          </button>
        </div>
      </FadeUp>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { QuizDto } from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";

export function BookmarkButton({ quizId }: { quizId: number }) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [anim, setAnim] = useState(false);

  const bookmarksQuery = useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => api<QuizDto[]>("/api/bookmarks"),
    enabled: Boolean(user),
  });

  const mutation = useMutation({
    mutationFn: (remove: boolean) =>
      api(`/api/bookmarks/${quizId}`, {
        method: remove ? "DELETE" : "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      setAnim(true);
      setTimeout(() => setAnim(false), 320);
    },
  });

  if (!user) {
    return (
      <Link
        href="/auth"
        title="Log in to save quizzes"
        className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-violetdim hover:text-violet"
        style={{ flexShrink: 0, color: "var(--color-tertiary)", opacity: 0.9 }}
      >
        <span style={{ fontSize: 16, lineHeight: 1 }}>♡</span>
      </Link>
    );
  }

  const bookmarked = (bookmarksQuery.data ?? []).some((q) => q.id === quizId);

  return (
    <button
      disabled={mutation.isPending}
      title={bookmarked ? "Remove bookmark" : "Save this quiz"}
      onClick={() => mutation.mutate(bookmarked)}
      className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-violetdim disabled:opacity-50"
      style={{
        flexShrink: 0,
        color: bookmarked ? "var(--color-violet)" : "var(--color-tertiary)",
        opacity: bookmarked ? 1 : 0.85,
        transform: anim ? "scale(1.25)" : "scale(1)",
        transition:
          "transform var(--dur-snap) var(--ease-spring), color var(--dur-fast) var(--ease-apple), opacity var(--dur-fast) var(--ease-apple), background var(--dur-fast) var(--ease-apple)",
      }}
      onMouseEnter={(e) => {
        if (!bookmarked) (e.currentTarget as HTMLButtonElement).style.color = "var(--color-violet)";
      }}
      onMouseLeave={(e) => {
        if (!bookmarked) (e.currentTarget as HTMLButtonElement).style.color = "var(--color-tertiary)";
      }}
    >
      <span style={{ fontSize: 16, lineHeight: 1 }}>{bookmarked ? "♥" : "♡"}</span>
    </button>
  );
}

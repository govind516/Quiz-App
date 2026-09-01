"use client";

import type { Difficulty } from "@/lib/types";
import { Badge } from "./ui";

const tones: Record<Difficulty, "mint" | "amber" | "violet"> = {
  BEGINNER: "mint",
  INTERMEDIATE: "amber",
  ADVANCED: "violet",
};

const labels: Record<Difficulty, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export function DifficultyBadge({ level }: { level: Difficulty }) {
  return (
    <span
      className={`badge badge-${tones[level]}`}
      style={{
        fontFamily: "var(--font-apple), sans-serif",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.01em",
        borderRadius: 5,
      }}
    >
      {labels[level]}
    </span>
  );
}

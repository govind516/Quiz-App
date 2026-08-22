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
	return <Badge tone={tones[level]}>{labels[level]}</Badge>;
}

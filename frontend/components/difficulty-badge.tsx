import type { Difficulty } from "@/lib/types";

const styles: Record<Difficulty, string> = {
	BEGINNER: "bg-emerald-50 text-emerald-600",
	INTERMEDIATE: "bg-amber-50 text-amber-600",
	ADVANCED: "bg-rose-50 text-rose-600",
};

const labels: Record<Difficulty, string> = {
	BEGINNER: "Beginner",
	INTERMEDIATE: "Intermediate",
	ADVANCED: "Advanced",
};

export function DifficultyBadge({ level }: { level: Difficulty }) {
	return (
		<span
			className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[level]}`}
		>
			{labels[level]}
		</span>
	);
}

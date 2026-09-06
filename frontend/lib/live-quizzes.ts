"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { QuizDto } from "@/lib/types";
import { quizzes as mockQuizzes } from "@/lib/mock";

export type CardQuiz = {
  id: string;
  title: string;
  cat: string;
  level: string;
  q: number;
  min: number;
  desc: string;
};

const cap = (s: string) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : s);

export function toCardQuiz(q: QuizDto): CardQuiz {
  return {
    id: String(q.id),
    title: q.title,
    cat: q.categoryName,
    level: cap(q.difficulty),
    q: q.questionCount,
    min: Math.max(1, Math.round(q.timeLimitSec / 60)),
    desc: q.description ?? "",
  };
}

/**
 * Live quiz list from the backend, falling back to mock data when the
 * backend is unreachable (offline demo preview). `isLive` tells callers
 * which source is backing the cards.
 */
export function useLiveQuizzes() {
  const query = useQuery({
    queryKey: ["quizzes"],
    queryFn: () => api<QuizDto[]>("/api/quizzes", { auth: false }),
    retry: false,
    staleTime: 30_000,
  });
  const quizzes: CardQuiz[] = query.data
    ? query.data.map(toCardQuiz)
    : (mockQuizzes as unknown as CardQuiz[]);
  return {
    quizzes,
    isPending: query.isPending && !query.data,
    isLive: !!query.data,
  };
}

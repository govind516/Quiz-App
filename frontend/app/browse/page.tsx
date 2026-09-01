"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CategoryDto, Difficulty, QuizDto } from "@/lib/types";
import { QuizCard } from "@/components/quiz-card";

const DIFFICULTIES: Difficulty[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

function BrowseInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") ?? "";
  const [category, setCategory] = useState(initialCategory);
  const [difficulty, setDifficulty] = useState("");
  const [tag, setTag] = useState("");

  useEffect(() => {
    const urlCat = searchParams.get("category") ?? "";
    if (urlCat !== category) setCategory(urlCat);
  }, [searchParams]);

  function updateCategory(slug: string) {
    setCategory(slug);
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("category", slug);
    else params.delete("category");
    const qs = params.toString();
    router.push(`/browse${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<CategoryDto[]>("/api/categories", { auth: false }),
  });

  const quizzesQuery = useQuery({
    queryKey: ["quizzes", category, difficulty, tag],
    queryFn: () => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (difficulty) params.set("difficulty", difficulty);
      if (tag) params.set("tag", tag.trim().toLowerCase().replace(/\s+/g, "-"));
      const qs = params.toString();
      return api<QuizDto[]>(`/api/quizzes${qs ? `?${qs}` : ""}`, { auth: false });
    },
  });

  return (
    <div className="py-10">
      <div className="mb-8">
        <span className="eyebrow">Practice</span>
        <h1
          className="text-[34px] mt-2"
          style={{ fontFamily: "var(--font-space), sans-serif", letterSpacing: "-0.8px", fontWeight: 700 }}
        >
          Pick your quiz.
        </h1>
        <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-jakarta), sans-serif", color: "var(--color-mutedc)" }}>
          Filter by track and difficulty — no account required to play.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={category}
          onChange={(e) => updateCategory(e.target.value)}
          className="input !w-auto"
          style={{ fontFamily: "var(--font-apple), sans-serif", height: 40, borderRadius: "var(--radius-sm)" }}
        >
          <option value="">All categories</option>
          {(categoriesQuery.data ?? []).map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="input !w-auto"
          style={{ fontFamily: "var(--font-apple), sans-serif", height: 40, borderRadius: "var(--radius-sm)" }}
        >
          <option value="">All difficulties</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d.charAt(0) + d.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        <input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="Filter by tag…"
          className="input !w-44"
          style={{ fontFamily: "var(--font-apple), sans-serif", height: 40, borderRadius: "var(--radius-sm)" }}
        />
        {(category || difficulty || tag) && (
          <button
            onClick={() => {
              setCategory("");
              setDifficulty("");
              setTag("");
              router.push("/browse", { scroll: false });
            }}
            className="mono text-xs underline hover:text-mutedc"
            style={{ color: "var(--color-faintc)", fontFamily: "var(--font-apple), sans-serif" }}
          >
            Clear
          </button>
        )}
      </div>

      {quizzesQuery.isPending ? (
        <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-44 skeleton" />
          ))}
        </div>
      ) : quizzesQuery.isError ? (
        <div className="rounded-xl border p-4 text-sm" style={{ borderColor: "rgba(248,113,113,0.4)", background: "var(--color-dangerdim)", color: "var(--color-dangerc)", fontFamily: "var(--font-apple), sans-serif" }}>
          Failed to load quizzes. Is the backend running?
        </div>
      ) : (quizzesQuery.data?.length ?? 0) === 0 ? (
        <div className="card p-10 text-center text-sm" style={{ color: "var(--color-mutedc)", fontFamily: "var(--font-apple), sans-serif" }}>
          No quizzes match these filters yet.
        </div>
      ) : (
        <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzesQuery.data!.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="h-64 skeleton rounded-xl mt-10" />}>
      <BrowseInner />
    </Suspense>
  );
}

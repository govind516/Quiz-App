"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CategoryDto, Difficulty, QuizDto } from "@/lib/types";
import { QuizCard } from "@/components/quiz-card";
import { Aurora } from "@/components/Aurora";
import { Eyebrow, FadeUp } from "@/components/Reveal";
import { IconSearch } from "@/components/icons";

const DIFFICULTIES: Difficulty[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

export default function BrowseClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [tag, setTag] = useState("");
  const [query, setQuery] = useState("");

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

  const filteredQuizzes = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const quizzes = quizzesQuery.data ?? [];
    if (!needle) return quizzes;
    return quizzes.filter((quiz) => {
      return [
        quiz.title,
        quiz.description ?? "",
        quiz.categoryName,
        quiz.difficulty,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [query, quizzesQuery.data]);

  function updateCategory(slug: string) {
    setCategory(slug);
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("category", slug);
    else params.delete("category");
    const qs = params.toString();
    router.push(`/browse${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  function clearFilters() {
    setCategory("");
    setDifficulty("");
    setTag("");
    setQuery("");
    router.push("/browse", { scroll: false });
  }

  return (
    <div className="relative overflow-hidden">
      <section className="browse-hero">
        <Aurora variant="soft" />
        <div className="relative mx-auto max-w-[1400px] px-6 md:px-10">
          <FadeUp>
            <Eyebrow>Practice</Eyebrow>
          </FadeUp>
          <FadeUp delay={0.08}>
            <h1>Pick your <span>quiz.</span></h1>
          </FadeUp>
          <FadeUp delay={0.14}>
            <p>Filter by track and difficulty. No account required to play, sign in only if you want the streaks.</p>
          </FadeUp>

          <div className="filter-panel">
            <div className="search-box">
              <IconSearch size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search quizzes..."
              />
            </div>
            <select
              className="input filter-select"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as Difficulty | "")}
            >
              <option value="">All levels</option>
              {DIFFICULTIES.map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0) + level.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            <input
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              placeholder="Tag"
              className="input filter-tag"
            />
          </div>

          <div className="category-pills">
            <button type="button" className={!category ? "active" : ""} onClick={() => updateCategory("")}>All</button>
            {(categoriesQuery.data ?? []).map((cat) => (
              <button
                type="button"
                key={cat.id}
                className={category === cat.slug ? "active" : ""}
                onClick={() => updateCategory(cat.slug)}
              >
                {cat.name}
              </button>
            ))}
            {(category || difficulty || tag || query) && (
              <button type="button" onClick={clearFilters}>Clear</button>
            )}
          </div>
        </div>
      </section>

      <section className="content-band pt-0">
        {quizzesQuery.isPending ? (
          <div className="quiz-grid">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="skeleton h-52 rounded-[18px]" />
            ))}
          </div>
        ) : quizzesQuery.isError ? (
          <div className="card text-sm text-[color:var(--coral)]">
            Failed to load quizzes. Is the backend running?
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="card p-10 text-center text-sm text-[color:var(--ink-2)]">
            No quizzes match these filters yet.
          </div>
        ) : (
          <div className="quiz-grid">
            {filteredQuizzes.map((quiz, index) => (
              <FadeUp key={quiz.id} delay={Math.min(index * 0.04, 0.28)}>
                <QuizCard quiz={quiz} />
              </FadeUp>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
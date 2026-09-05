"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Eyebrow, FadeUp } from "@/components/Reveal";
import { Hex } from "@/components/Hex";
import { categories as mockCategories } from "@/lib/mock";
import { api } from "@/lib/api";
import type { AdminCategory } from "@/lib/types";
import { ArrowUpRight } from "lucide-react";

export default function Categories() {
  // TODO: backend wiring — fetch real categories; fallback to mock for pixel-perfect replica
  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => api<AdminCategory[]>("/api/admin/categories"),
    retry: false,
  });

  const categories = categoriesQuery.data
    ? categoriesQuery.data.map((c) => ({
        slug: c.slug,
        name: c.name,
        count: c.quizzes,
        color: "#A78BFA",
        hint: c.description ?? "",
      }))
    : mockCategories;

  return (
    <div data-testid="admin-categories">
      <FadeUp>
        <Eyebrow>Admin</Eyebrow>
      </FadeUp>
      <FadeUp delay={0.1}>
        <h1 className="mt-4 font-display text-[48px] md:text-[64px] leading-[0.95] text-white">Categories</h1>
      </FadeUp>
      <FadeUp delay={0.2} className="mt-2 text-[color:var(--ink-2)]">
        {categories.length} tracks
      </FadeUp>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map((c: any, i: number) => (
          <FadeUp key={c.slug} delay={i * 0.04}>
            <div className="group relative rounded-2xl glass glass-hover p-6 h-[150px] overflow-hidden">
              <div className="absolute -right-6 -top-6 opacity-30 group-hover:opacity-50 transition-opacity">
                <Hex size={110} color={c.color} />
              </div>
              <div className="relative flex flex-col h-full justify-between">
                <div className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.18em] uppercase text-[color:var(--mute)]">
                  <span className="h-1 w-1 rounded-full" style={{ background: c.color }} />
                  track
                </div>
                <div>
                  <div className="font-display text-[24px] leading-tight text-white">{c.name}</div>
                  <div className="mt-1 text-[13px] text-[color:var(--ink-2)]">{c.hint}</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[color:var(--mute)]">{c.count} quizzes</span>
                  <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </div>
  );
}

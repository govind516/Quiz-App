import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Home from "./page";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({ api: vi.fn() }));

const mockApi = vi.mocked(api);

function renderHome() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <Home />
    </QueryClientProvider>
  );
}

describe("Home live wiring", () => {
  beforeEach(() => {
    mockApi.mockReset();
    mockApi.mockImplementation(async (path: string) => {
      if (path.startsWith("/api/quizzes")) {
        return [
          {
            id: 2,
            title: "Python Basics",
            description: "",
            categoryId: 2,
            categoryName: "Python",
            categorySlug: "python",
            topic: "Python Basics",
            difficulty: "BEGINNER",
            timeLimitSec: 240,
            isPublished: true,
            questionCount: 4,
            tags: [],
          },
          {
            id: 3,
            title: "Python Fluency",
            description: "",
            categoryId: 2,
            categoryName: "Python",
            categorySlug: "python",
            topic: "Python Fluency",
            difficulty: "INTERMEDIATE",
            timeLimitSec: 300,
            isPublished: true,
            questionCount: 6,
            tags: [],
          },
        ];
      }
      if (path.startsWith("/api/leaderboard/weekly")) {
        return [
          {
            rank: 1,
            userId: 2,
            name: "Live Check",
            score: 5,
            initials: "LC",
            country: "Unknown",
            streak: 1,
          },
        ];
      }
      throw new Error(`unexpected api path ${path}`);
    });
  });

  it("derives hero stats from live quizzes, not mock constants", async () => {
    renderHome();
    expect(await screen.findAllByText("Live Check")).not.toHaveLength(0);
    // 1 distinct track, 4 + 6 questions, 2 live quizzes.
    expect(screen.getByText("topic tracks").previousElementSibling).toHaveTextContent("1");
    expect(screen.getByText("crafted questions").previousElementSibling).toHaveTextContent("10");
    expect(screen.getByText("live quizzes").previousElementSibling).toHaveTextContent("2");
  });

  it("renders the live weekly board instead of mock leaders", async () => {
    renderHome();
    expect(await screen.findAllByText("Live Check")).not.toHaveLength(0);
    expect(screen.queryByText("Kaia Moreno")).not.toBeInTheDocument();
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import QuizPlay from "./page";

const push = vi.fn();
const back = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back }),
  useParams: () => ({ id: "demo" }),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

function renderPlay() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <QuizPlay />
    </QueryClientProvider>
  );
}

describe("QuizPlay (mock demo quiz)", () => {
  beforeEach(() => {
    push.mockClear();
    back.mockClear();
    window.localStorage.setItem("quiz.guestSessionId", "00000000-0000-4000-8000-000000000000");
    window.sessionStorage.clear();
  });

  it("renders the first question", async () => {
    renderPlay();
    // CodeText nests spans, so the prompt text matches several nodes.
    expect(await screen.findAllByText(/key-value pairs/)).not.toHaveLength(0);
    expect(screen.getByTestId("play-main")).toBeInTheDocument();
  });

  it("selecting an answer updates the answered counter", async () => {
    renderPlay();
    await screen.findAllByText(/key-value pairs/);
    expect(screen.getByText("0/14 answered")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("option-B"));
    expect(screen.getByText("1/14 answered")).toBeInTheDocument();
  });

  it("submit on the last question navigates to results", async () => {
    const { unmount } = renderPlay();
    await screen.findAllByText(/key-value pairs/);

    // Jump to the last question (Q14: "Which is NOT truthy?", answer index 1).
    fireEvent.click(screen.getByTestId("qnav-14"));
    expect(await screen.findAllByText(/NOT truthy/)).not.toHaveLength(0);

    fireEvent.click(screen.getByTestId("option-B"));
    fireEvent.click(screen.getByTestId("play-submit"));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/results/demo"));
    const stored = JSON.parse(window.sessionStorage.getItem("result-demo") ?? "null");
    expect(stored).toMatchObject({ correct: 1, total: 14 });
    unmount();
  });
});

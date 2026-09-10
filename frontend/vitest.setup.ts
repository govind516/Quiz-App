import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Without `globals: true`, Testing Library cannot auto-register cleanup,
// so mounted trees would leak across tests in the same file.
afterEach(() => {
  cleanup();
});

// jsdom has no IntersectionObserver (framer-motion reveal animations need it).
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

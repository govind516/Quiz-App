"use client";

import type { AttemptResultDto } from "./types";

const memCache = new Map<string, AttemptResultDto>();

function key(id: string) {
  return `quiz.result.${id}`;
}

export function setCachedResult(attemptId: string, data: AttemptResultDto) {
  memCache.set(attemptId, data);
  try {
    sessionStorage.setItem(key(attemptId), JSON.stringify(data));
  } catch {
    // storage may be unavailable in SSR
  }
}

export function getCachedResult(attemptId: string): AttemptResultDto | null {
  if (memCache.has(attemptId)) return memCache.get(attemptId)!;
  try {
    const raw = sessionStorage.getItem(key(attemptId));
    if (raw) {
      const parsed = JSON.parse(raw) as AttemptResultDto;
      memCache.set(attemptId, parsed);
      return parsed;
    }
  } catch {}
  return null;
}

export function clearCachedResult(attemptId: string) {
  memCache.delete(attemptId);
  try {
    sessionStorage.removeItem(key(attemptId));
  } catch {}
}

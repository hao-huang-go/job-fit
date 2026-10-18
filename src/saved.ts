import type { Answers } from "./holland";

// Answers in progress, and the submitted profile's id, kept on this device so a return visit
// continues the quiz or opens straight on the results.
const KEY = "job-fit.state.v1";

export interface Saved {
  answers: Answers;
  id: string | null;
}

export function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { answers: {}, id: null, ...(JSON.parse(raw) as Partial<Saved>) };
  } catch {
    // unreadable or blocked: start fresh
  }
  return { answers: {}, id: null };
}

export function storeSaved(saved: Saved): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    // storage blocked: progress lasts for this visit only
  }
}

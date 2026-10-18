// Derived readings of a Holland profile, following standard interpretation in the vocational-interest
// literature: differentiation (Holland 1997), consistency on the RIASEC hexagon, and Prediger's (1982)
// People/Things and Data/Ideas work-task dimensions.
import { QUESTIONS, TYPES, type Answers, type HollandType, type Scores } from "./holland";
import { JOBS, type Job } from "./jobs";

export type Level = "high" | "medium" | "low";

// Gap between the strongest and weakest interest. A large gap means a clear direction; a small one means
// interests are spread evenly (broad, or not yet settled).
export function differentiation(scores: Scores): { gap: number; level: Level } {
  const values = TYPES.map((t) => scores[t]);
  const gap = Math.max(...values) - Math.min(...values);
  return { gap, level: gap >= 50 ? "high" : gap >= 25 ? "medium" : "low" };
}

// Steps between two types around the R-I-A-S-E-C hexagon: 1 adjacent, 2 alternate, 3 opposite.
export function hexDistance(a: HollandType, b: HollandType): 1 | 2 | 3 {
  const d = Math.abs(TYPES.indexOf(a) - TYPES.indexOf(b));
  return Math.min(d, 6 - d) as 1 | 2 | 3;
}

export function consistency(code: string): { distance: 1 | 2 | 3; level: Level } {
  const distance = hexDistance(code[0] as HollandType, code[1] as HollandType);
  return { distance, level: distance === 1 ? "high" : distance === 2 ? "medium" : "low" };
}

// Prediger's dimensions, each scaled to -1..1: x > 0 leans to data (facts, records, procedures),
// x < 0 to ideas (theories, insight, self-expression); y > 0 leans to people, y < 0 to things.
export function workTasks(scores: Scores): { x: number; y: number } {
  const { R, I, A, S, E, C } = scores;
  return {
    x: (E + C - I - A) / 200,
    y: (2 * S + A + E - 2 * R - I - C) / 400,
  };
}

export interface JobMatch {
  job: Job;
  match: number; // 0-100
}

// A job fits as much as the person likes its two defining interests, the first weighted more.
export function jobMatches(scores: Scores): JobMatch[] {
  return JOBS.filter((j) => j.code)
    .map((job) => {
      const [a, b] = job.code as unknown as [HollandType, HollandType];
      return { job, match: Math.round(scores[a] * 0.6 + scores[b] * 0.4) };
    })
    .sort((x, y) => y.match - x.match);
}

export interface Evidence {
  liked: { text: string; type: HollandType }[];
  disliked: { text: string; type: HollandType }[];
}

// At most this many liked activities per type, so the evidence covers each of the top types.
const PER_TYPE = 2;

// The activities behind the result: the highest-rated ones (strongest types first) and the lowest-rated.
export function evidence(answers: Answers, scores: Scores, limit = 5): Evidence {
  const answered = QUESTIONS.filter((q) => answers[q.id] !== undefined);
  const rank = [...TYPES].sort((a, b) => scores[b] - scores[a]);
  const perType: Partial<Record<HollandType, number>> = {};
  const liked = answered
    .filter((q) => answers[q.id] >= 4)
    .sort((a, b) => answers[b.id] - answers[a.id] || rank.indexOf(a.type) - rank.indexOf(b.type))
    .filter((q) => (perType[q.type] = (perType[q.type] ?? 0) + 1) <= PER_TYPE)
    .slice(0, limit);
  const disliked = answered
    .filter((q) => answers[q.id] <= 2)
    .sort((a, b) => answers[a.id] - answers[b.id])
    .slice(0, 3);
  return {
    liked: liked.map((q) => ({ text: q.text, type: q.type })),
    disliked: disliked.map((q) => ({ text: q.text, type: q.type })),
  };
}

export const lowestType = (scores: Scores): HollandType =>
  [...TYPES].sort((a, b) => scores[a] - scores[b])[0];

import { deviceId } from "./device";
import type { HollandType, Scores } from "./holland";
import { visitSource } from "./source";

export class ApiError extends Error {
  readonly code: string;
  readonly body: Record<string, unknown>;

  constructor(code: string, body: Record<string, unknown>) {
    super(code);
    this.code = code;
    this.body = body;
  }
}

async function json<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(typeof body.error === "string" ? body.error : "server", body);
  return body as T;
}

export type Group = "main" | "pair" | "mbti";

export interface JobStat {
  job: string; // a job id, or "custom:<text>"
  custom: string | null;
  n: number;
  avg: number;
  happy: number;
  reasons: { text: string; satisfaction: number }[];
}

export interface FitStats {
  total: number;
  sizes: Partial<Record<Group, number>>;
  jobs: Partial<Record<Group, JobStat[]>>;
  typeShare: Partial<Record<HollandType, number>>;
}

export interface JobEntry {
  jobId: string | null;
  custom: string | null;
  status: "current" | "past";
  years: string;
  income: string | null;
  satisfaction: number;
  reason: string | null;
}

export interface Submission {
  code: string;
  scores: Scores;
  mbti: string | null;
  country: string;
  age: string;
  jobs: JobEntry[];
}

export async function submitProfile(input: Submission): Promise<{ id: string; stats: FitStats }> {
  return json(
    await fetch("/api/profile", {
      method: "POST",
      headers: { "content-type": "application/json", "x-device-id": deviceId() },
      body: JSON.stringify({ ...input, source: visitSource() }),
    }),
  );
}

export interface SavedProfile {
  id: string;
  profile: { code: string; r: number; i: number; a: number; s: number; e: number; c: number; mbti: string | null };
  stats: FitStats;
}

export async function fetchProfile(id: string): Promise<SavedProfile> {
  return json(await fetch(`/api/profile?id=${encodeURIComponent(id)}`));
}

export async function fetchPeople(): Promise<number | null> {
  try {
    const res = await fetch("/api/participants");
    if (!res.ok) return null;
    const body = (await res.json()) as { people?: unknown };
    return typeof body.people === "number" ? body.people : null;
  } catch {
    return null;
  }
}

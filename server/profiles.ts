import type { SupabaseClient } from "@supabase/supabase-js";
import { isHollandCode, TYPES, type HollandType } from "../src/holland.js";
import { JOB_IDS } from "../src/jobs.js";
import { InputError } from "./request.js";

export const COUNTRIES = ["cn", "au", "us", "ca", "uk", "sg", "nz", "hk", "tw", "my", "jp", "eu", "other"] as const;
export const AGE_BANDS = ["<22", "22-25", "26-30", "31-35", "36-40", "41-50", "50+"] as const;
const YEARS = ["<1", "1-3", "3-5", "5-10", "10+"] as const;
const INCOMES = ["much_lower", "lower", "same", "higher", "much_higher"] as const;
const MAX_JOBS = 5;
const SOURCE_PATTERN = /^[a-z0-9._-]{1,40}$/;
const LINK_PATTERN = /(https?:\/\/|www\.|\.(com|net|org|au|cn|io|app)\b)/i;

const oneOf = <T extends string>(options: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (options as readonly string[]).includes(value);

function pick<T extends string>(options: readonly T[], value: unknown, field: string): T {
  if (!oneOf(options, value)) throw new InputError(field);
  return value;
}

function shortText(value: unknown, max: number, field: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw new InputError(field);
  const text = value.trim();
  if (text.length > max || LINK_PATTERN.test(text)) throw new InputError(field);
  return text || null;
}

export interface JobInput {
  jobId: string | null;
  custom: string | null;
  status: "current" | "past";
  years: (typeof YEARS)[number];
  income: (typeof INCOMES)[number] | null;
  satisfaction: number;
  reason: string | null;
}

export interface ProfileInput {
  code: string;
  scores: Record<HollandType, number>;
  mbti: string | null;
  country: (typeof COUNTRIES)[number];
  age: (typeof AGE_BANDS)[number];
  jobs: JobInput[];
  source: string | null;
}

function parseJob(raw: unknown): JobInput {
  if (typeof raw !== "object" || raw === null) throw new InputError("job");
  const j = raw as Record<string, unknown>;
  const jobId = j.jobId === null || j.jobId === undefined ? null : j.jobId;
  if (jobId !== null && (typeof jobId !== "string" || !JOB_IDS.has(jobId))) throw new InputError("jobId");
  const custom = shortText(j.custom, 30, "custom");
  if (!jobId && !custom) throw new InputError("job");
  const satisfaction = j.satisfaction;
  if (typeof satisfaction !== "number" || !Number.isInteger(satisfaction) || satisfaction < 1 || satisfaction > 5) {
    throw new InputError("satisfaction");
  }
  return {
    jobId: jobId as string | null,
    custom: jobId ? null : custom,
    status: pick(["current", "past"] as const, j.status, "status"),
    years: pick(YEARS, j.years, "years"),
    income: j.income === null || j.income === undefined ? null : pick(INCOMES, j.income, "income"),
    satisfaction,
    reason: shortText(j.reason, 80, "reason"),
  };
}

export function parseProfile(body: unknown): ProfileInput {
  if (typeof body !== "object" || body === null) throw new InputError("body");
  const b = body as Record<string, unknown>;
  if (!isHollandCode(b.code)) throw new InputError("code");
  const raw = b.scores as Record<string, unknown> | undefined;
  const scores = {} as Record<HollandType, number>;
  for (const t of TYPES) {
    const v = raw?.[t];
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 100) throw new InputError("scores");
    scores[t] = v;
  }
  const mbti = typeof b.mbti === "string" && /^[EI][SN][TF][JP]$/.test(b.mbti) ? b.mbti : null;
  if (!Array.isArray(b.jobs) || b.jobs.length < 1 || b.jobs.length > MAX_JOBS) throw new InputError("jobs");
  return {
    code: b.code,
    scores,
    mbti,
    country: pick(COUNTRIES, b.country, "country"),
    age: pick(AGE_BANDS, b.age, "age"),
    jobs: b.jobs.map(parseJob),
    source: typeof b.source === "string" && SOURCE_PATTERN.test(b.source) ? b.source : null,
  };
}

export async function saveProfile(
  db: SupabaseClient,
  input: ProfileInput,
  deviceHash: string,
  ipHash: string,
  day: string,
): Promise<{ id: string; created: boolean }> {
  const { data, error } = await db.rpc("fit_submit", {
    p: {
      device_hash: deviceHash,
      code: input.code,
      r: input.scores.R,
      i: input.scores.I,
      a: input.scores.A,
      s: input.scores.S,
      e: input.scores.E,
      c: input.scores.C,
      mbti: input.mbti,
      country: input.country,
      age_band: input.age,
      ip_hash: ipHash,
      submitted_on: day,
      source: input.source,
      jobs: input.jobs.map((job, position) => ({
        position,
        job_id: job.jobId,
        custom: job.custom,
        status: job.status,
        years: job.years,
        income: job.income,
        satisfaction: job.satisfaction,
        reason: job.reason,
      })),
    },
  });
  if (error) throw error;
  return data as { id: string; created: boolean };
}

export interface JobStat {
  job: string; // a job id, or "custom:<text>" for a job typed in
  custom: string | null;
  n: number;
  avg: number;
  happy: number; // ratings of 4 or 5
  reasons: { text: string; satisfaction: number }[];
}

export interface FitStats {
  total: number;
  sizes: Partial<Record<"main" | "pair" | "mbti", number>>;
  jobs: Partial<Record<"main" | "pair" | "mbti", JobStat[]>>;
  typeShare: Partial<Record<HollandType, number>>;
}

export async function profileStats(db: SupabaseClient, id: string): Promise<FitStats | null> {
  const { data, error } = await db.rpc("fit_stats", { p_id: id });
  if (error) throw error;
  return (data as FitStats | null) ?? null;
}

export async function profileSummary(db: SupabaseClient, id: string) {
  const { data, error } = await db.from("fit_profiles").select("code, r, i, a, s, e, c, mbti").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function participantCount(db: SupabaseClient): Promise<number> {
  const { count, error } = await db.from("fit_profiles").select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

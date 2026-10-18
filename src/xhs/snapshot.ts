import type { FitStats, JobStat } from "../api";
import type { HollandType } from "../holland";
import raw from "./snapshot.json";

interface Snapshot {
  total: number;
  generatedOn: string;
  typeShare: Partial<Record<HollandType, number>>;
  sizes: { main: Record<string, number>; pair: Record<string, number> };
  jobs: { main: Record<string, JobStat[]>; pair: Record<string, JobStat[]> };
}

export const snapshot = raw as Snapshot;

const pairKey = (code: string) => [code[0], code[1]].sort().join("");

// The bundled stats for one profile, shaped like the API's so the same results view renders them.
export function statsFor(code: string): FitStats {
  const main = code[0];
  const pair = pairKey(code);
  return {
    total: snapshot.total,
    typeShare: snapshot.typeShare,
    sizes: { main: snapshot.sizes.main[main] ?? 0, pair: snapshot.sizes.pair[pair] ?? 0 },
    jobs: { main: snapshot.jobs.main[main] ?? [], pair: snapshot.jobs.pair[pair] ?? [] },
  };
}

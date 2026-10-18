import { useState } from "react";
import type { FitStats, Group, JobStat } from "./api";
import { TYPE_INFO, type HollandType } from "./holland";
import { jobById } from "./jobs";

interface Props {
  code: string;
  mbti: string | null;
  stats: FitStats;
}

// Below this many ratings a job's average is shown but flagged as a small sample.
const SMALL_SAMPLE = 3;
const TOP = 10;
// Average rating at or below which a job is listed as not recommended rather than ranked.
const LOW = 2.5;

// Ranks jobs by average pulled toward a neutral 3 stars, so one 5-star rating doesn't outrank many 4.5s.
const PRIOR_WEIGHT = 2;
const weighted = (s: JobStat) => (s.avg * s.n + 3 * PRIOR_WEIGHT) / (s.n + PRIOR_WEIGHT);

const jobName = (s: JobStat) => (s.custom ? s.custom : (jobById.get(s.job)?.name ?? s.job));
const stars = (avg: number) => "★".repeat(Math.round(avg)) + "☆".repeat(5 - Math.round(avg));

function JobRow({ s }: { s: JobStat }) {
  return (
    <li className="job-stat">
      <div className="job-stat-head">
        <b>{jobName(s)}</b>
        <span className="avg" title={`${s.avg} / 5`}>
          {stars(s.avg)} <small>{s.avg.toFixed(1)}</small>
        </span>
      </div>
      <p className="meta">
        {s.n} 人做过 · {Math.round((s.happy / s.n) * 100)}% 觉得满意
        {s.n < SMALL_SAMPLE && <em> · 样本还少</em>}
      </p>
      {s.reasons.length > 0 && (
        <ul className="reasons">
          {s.reasons.map((r, i) => (
            <li key={i}>
              <span className={r.satisfaction >= 4 ? "good" : r.satisfaction <= 2 ? "bad" : ""}>{r.satisfaction >= 4 ? "👍" : r.satisfaction <= 2 ? "👎" : "😐"}</span>
              {r.text}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

// What people like you do: by main type, by your top two types, or by your MBTI.
export function CrowdResults({ code, mbti, stats }: Props) {
  const groups: { key: Group; label: string }[] = [
    { key: "pair", label: `最像你（${[...code.slice(0, 2)].join("+")}）` },
    { key: "main", label: `同为${TYPE_INFO[code[0] as HollandType].name}` },
    ...(mbti ? [{ key: "mbti" as Group, label: `同为 ${mbti}` }] : []),
  ];
  const [group, setGroup] = useState<Group>("pair");
  const jobs = stats.jobs[group] ?? [];
  const size = stats.sizes[group] ?? 0;
  const best = jobs
    .filter((s) => s.avg > LOW)
    .sort((a, b) => weighted(b) - weighted(a))
    .slice(0, TOP);
  const worst = jobs
    .filter((s) => s.avg <= LOW && s.n >= 2)
    .sort((a, b) => weighted(a) - weighted(b))
    .slice(0, 3);

  return (
    <section className="card crowd">
      <h3>和你同类型的人，都在做什么？</h3>
      <div className="tabs">
        {groups.map((g) => (
          <button key={g.key} className={group === g.key ? "on" : ""} onClick={() => setGroup(g.key)}>
            {g.label}
            <small>{stats.sizes[g.key] ?? 0} 人</small>
          </button>
        ))}
      </div>
      {size <= 1 ? (
        <p className="hint">你是这一组的第一位，分享给同类型的朋友，数据会越来越多 🙌</p>
      ) : (
        <p className="hint">
          {size} 位{groups.find((g) => g.key === group)?.label.replace(/（.*）/, "")}的参与者，按满意度排序：
        </p>
      )}
      <ol className="job-stats">
        {best.map((s) => (
          <JobRow key={s.job} s={s} />
        ))}
      </ol>
      {worst.length > 0 && (
        <>
          <h4>同类型的人不太推荐</h4>
          <ol className="job-stats">
            {worst.map((s) => (
              <JobRow key={s.job} s={s} />
            ))}
          </ol>
        </>
      )}
      <p className="note">数据来自本站参与者的匿名填写，不代表所有人。共 {stats.total} 人参与。</p>
    </section>
  );
}

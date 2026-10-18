import { useState } from "react";
import type { JobEntry } from "./api";
import { AGE_BANDS, blankJob, COUNTRIES, INCOMES, MAX_JOBS, MBTI_AXES, YEARS, type Details } from "./details";
import { CATEGORIES, JOBS, jobById } from "./jobs";

function JobPicker({ value, custom, onPick }: { value: string | null; custom: string | null; onPick: (id: string | null, custom: string | null) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(!value && !custom);
  if (!open) {
    return (
      <button type="button" className="picked" onClick={() => setOpen(true)}>
        {value ? jobById.get(value)?.name : custom} <small>换一个</small>
      </button>
    );
  }
  const q = query.trim();
  const matches = q ? JOBS.filter((j) => j.name.toLowerCase().includes(q.toLowerCase())) : [];
  return (
    <div className="picker">
      <input autoFocus placeholder="搜职业，比如 设计、护士、程序员" value={query} onChange={(e) => setQuery(e.target.value)} />
      {q ? (
        <div className="options">
          {matches.slice(0, 8).map((j) => (
            <button type="button" key={j.id} onClick={() => (onPick(j.id, null), setOpen(false))}>
              {j.name} <small>{j.category}</small>
            </button>
          ))}
          <button type="button" className="custom" onClick={() => (onPick(null, q.slice(0, 30)), setOpen(false))}>
            没找到？就用「{q.slice(0, 30)}」
          </button>
        </div>
      ) : (
        <details className="browse">
          <summary>或者按类别找</summary>
          {CATEGORIES.map((c) => (
            <div key={c} className="cat">
              <p>{c}</p>
              <div className="chips">
                {JOBS.filter((j) => j.category === c).map((j) => (
                  <button type="button" key={j.id} className="chip" onClick={() => (onPick(j.id, null), setOpen(false))}>
                    {j.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </details>
      )}
    </div>
  );
}

interface Props {
  value: Details;
  onChange: (update: (prev: Details) => Details) => void;
}

export function JobsForm({ value, onChange }: Props) {
  const set = (patch: (prev: Details) => Partial<Details>) => onChange((prev) => ({ ...prev, ...patch(prev) }));
  const setJob = (i: number, patch: Partial<JobEntry>) =>
    set((prev) => ({ jobs: prev.jobs.map((j, k) => (k === i ? { ...j, ...patch } : j)) }));

  return (
    <section className="card form">
      <h2>解锁真人数据</h2>
      <p className="hint">匿名填一下你做过的工作，就能看到和你同类型的人都在做什么、做得开不开心。不用注册，只存区间和你写的一句话。</p>

      <p className="label">你在哪个国家/地区工作？</p>
      <div className="chips">
        {COUNTRIES.map(([k, name]) => (
          <button type="button" key={k} className={value.country === k ? "chip on" : "chip"} onClick={() => set(() => ({ country: k }))}>
            {name}
          </button>
        ))}
      </div>

      <p className="label">年龄</p>
      <div className="chips">
        {AGE_BANDS.map((a) => (
          <button type="button" key={a} className={value.age === a ? "chip on" : "chip"} onClick={() => set(() => ({ age: a }))}>
            {a}
          </button>
        ))}
      </div>

      <p className="label">
        你的 MBTI <small>（选填，知道的话可以看同 MBTI 的人）</small>
      </p>
      <div className="mbti">
        {MBTI_AXES.map(([a, b], axis) => (
          <div key={axis} className="segmented">
            {[a, b].map((letter) => (
              <button
                type="button"
                key={letter}
                className={value.mbti[axis] === letter ? "on" : ""}
                onClick={() =>
                  set((prev) => {
                    const next = prev.mbti.length === 4 ? [...prev.mbti] : ["", "", "", ""];
                    next[axis] = next[axis] === letter ? "" : letter;
                    return { mbti: next.every((x) => x === "") ? [] : next };
                  })
                }
              >
                {letter}
              </button>
            ))}
          </div>
        ))}
        {value.mbti.length > 0 && <span className="mbti-code">{value.mbti.map((x) => x || "?").join("")}</span>}
      </div>

      {value.jobs.map((job, i) => (
        <div key={i} className="job">
          <div className="job-head">
            <b>工作 {i + 1}</b>
            {value.jobs.length > 1 && (
              <button type="button" className="link" onClick={() => set((prev) => ({ jobs: prev.jobs.filter((_, k) => k !== i) }))}>
                删除
              </button>
            )}
          </div>
          <JobPicker value={job.jobId} custom={job.custom} onPick={(jobId, custom) => setJob(i, { jobId, custom })} />
          <div className="segmented">
            {(["current", "past"] as const).map((s) => (
              <button type="button" key={s} className={job.status === s ? "on" : ""} onClick={() => setJob(i, { status: s })}>
                {s === "current" ? "现在在做" : "以前做过"}
              </button>
            ))}
          </div>
          <p className="label">做了多久</p>
          <div className="chips">
            {YEARS.map(([k, name]) => (
              <button type="button" key={k} className={job.years === k ? "chip on" : "chip"} onClick={() => setJob(i, { years: k })}>
                {name}
              </button>
            ))}
          </div>
          <p className="label">满意度</p>
          <div className="stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} className={job.satisfaction >= n ? "on" : ""} onClick={() => setJob(i, { satisfaction: n })} aria-label={`${n} 星`}>
                ★
              </button>
            ))}
            <span>{["", "很不喜欢", "不太喜欢", "一般", "挺喜欢", "非常喜欢"][job.satisfaction]}</span>
          </div>
          <p className="label">
            收入和当地同龄人比 <small>（选填）</small>
          </p>
          <div className="chips">
            {INCOMES.map(([k, name]) => (
              <button type="button" key={k} className={job.income === k ? "chip on" : "chip"} onClick={() => setJob(i, { income: job.income === k ? null : k })}>
                {name}
              </button>
            ))}
          </div>
          <p className="label">
            一句话：为什么适合 / 不适合你？ <small>（选填，会匿名展示给同类型的人）</small>
          </p>
          <input
            className="reason"
            maxLength={80}
            placeholder="比如：能安静做自己的事，不用天天开会"
            value={job.reason ?? ""}
            onChange={(e) => setJob(i, { reason: e.target.value || null })}
          />
        </div>
      ))}
      {value.jobs.length < MAX_JOBS && (
        <button type="button" className="secondary" onClick={() => set((prev) => ({ jobs: [...prev.jobs, blankJob()] }))}>
          + 再加一份工作
        </button>
      )}
    </section>
  );
}

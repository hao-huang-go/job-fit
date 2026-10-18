import { useEffect, useState } from "react";
import { ApiError, fetchPeople, fetchProfile, submitProfile, type FitStats } from "./api";
import { CrowdResults } from "./CrowdResults";
import { hollandCode, QUESTIONS, scoreAnswers, typeName, type Scores } from "./holland";
import { detailsComplete, emptyDetails, type Details } from "./details";
import { JobsForm } from "./JobsForm";
import { Profile } from "./Profile";
import { Quiz } from "./Quiz";
import { loadSaved, storeSaved, type Saved } from "./saved";
import { ShareButton } from "./ShareButton";
import { visitSource } from "./source";

type Stage = "intro" | "quiz" | "profile" | "jobs" | "results";

// /r/<id> is someone's shared result.
const sharedId = /^\/r\/([0-9a-f-]{36})\/?$/i.exec(window.location.pathname)?.[1] ?? null;

interface Loaded {
  code: string;
  scores: Scores;
  mbti: string | null;
  stats: FitStats;
}

const fromRow = (p: { code: string; r: number; i: number; a: number; s: number; e: number; c: number; mbti: string | null }, stats: FitStats): Loaded => ({
  code: p.code,
  scores: { R: p.r, I: p.i, A: p.a, S: p.s, E: p.e, C: p.c },
  mbti: p.mbti,
  stats,
});

export default function App() {
  const [saved, setSaved] = useState<Saved>(loadSaved);
  const [stage, setStage] = useState<Stage>(() => {
    const s = loadSaved();
    if (s.id) return "results";
    return Object.keys(s.answers).length >= QUESTIONS.length ? "profile" : Object.keys(s.answers).length ? "quiz" : "intro";
  });
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [people, setPeople] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    visitSource();
    fetchPeople().then(setPeople);
    const id = sharedId ?? loadSaved().id;
    if (id) fetchProfile(id).then((r) => setLoaded(fromRow(r.profile, r.stats))).catch(() => setLoaded(null));
  }, []);

  function persist(update: (prev: Saved) => Saved) {
    setSaved((prev) => {
      const next = update(prev);
      storeSaved(next);
      return next;
    });
  }

  const scores = scoreAnswers(saved.answers);
  const code = hollandCode(scores);

  async function submit() {
    setBusy(true);
    setError(null);
    const mbti = details.mbti.length === 4 && details.mbti.every(Boolean) ? details.mbti.join("") : null;
    try {
      const result = await submitProfile({
        code,
        scores,
        mbti,
        country: details.country!,
        age: details.age!,
        jobs: details.jobs,
      });
      persist((prev) => ({ ...prev, id: result.id }));
      setLoaded({ code, scores, mbti, stats: result.stats });
      setStage("results");
      window.scrollTo({ top: 0 });
    } catch (e) {
      if (e instanceof ApiError && e.code === "already_submitted" && typeof e.body.id === "string") {
        const id = e.body.id;
        persist((prev) => ({ ...prev, id }));
        fetchProfile(id).then((r) => setLoaded(fromRow(r.profile, r.stats)));
        setStage("results");
      } else {
        setError(e instanceof ApiError && e.code === "rate_limited" ? "今天提交太多次了，明天再来" : "提交失败了，稍后再试");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <header>
        <h1>我适合什么工作？</h1>
        <p className="subtitle">测你的职业兴趣类型，再看看和你同类型的真实的人，都在做什么、做得开不开心</p>
        {!!people && <p className="people">已有 {people} 人参与</p>}
      </header>

      {sharedId ? (
        <>
          <p className="shared-kicker">朋友分享的测试结果 👇</p>
          {loaded ? (
            <>
              <Profile code={loaded.code} scores={loaded.scores} share={loaded.stats.typeShare} total={loaded.stats.total} shared />
              <CrowdResults code={loaded.code} mbti={loaded.mbti} stats={loaded.stats} />
            </>
          ) : (
            <div className="card loading" />
          )}
          <a className="primary wide cta" href="/">
            我也测测我适合什么工作 →
          </a>
        </>
      ) : stage === "intro" ? (
        <section className="card intro">
          <ul>
            <li>30 道题，大约 3 分钟</li>
            <li>测出你的霍兰德职业兴趣类型（六型里你最偏哪几种）</li>
            <li>匿名填你做过的工作，解锁同类型的人的真实去向和满意度</li>
            <li>完全免费，不用注册，不卖报告</li>
          </ul>
          <button className="primary wide" onClick={() => setStage("quiz")}>
            开始测试
          </button>
        </section>
      ) : stage === "quiz" ? (
        <Quiz
          answers={saved.answers}
          onAnswer={(id, value) => persist((prev) => ({ ...prev, answers: { ...prev.answers, [id]: value } }))}
          onDone={() => (setStage("profile"), window.scrollTo({ top: 0 }))}
        />
      ) : stage === "profile" ? (
        <>
          <Profile code={code} scores={scores} />
          <section className="card unlock">
            <h3>同类型的真实的人，做什么工作最开心？</h3>
            <p className="hint">匿名填一下你做过的工作（1 分钟），就能看到和你同类型的人的真实去向、满意度和他们的一句话经验。</p>
            <button className="primary wide" onClick={() => (setStage("jobs"), window.scrollTo({ top: 0 }))}>
              填工作经历，解锁真人数据
            </button>
            <button className="link" onClick={() => setStage("quiz")}>
              重新看看题目
            </button>
          </section>
        </>
      ) : stage === "jobs" ? (
        <>
          <JobsForm value={details} onChange={setDetails} />
          {error && <p className="error">{error}</p>}
          <button className="primary wide" disabled={busy || !detailsComplete(details)} onClick={() => void submit()}>
            {busy ? "提交中…" : detailsComplete(details) ? "看看同类型的人" : "填好国家、年龄和工作信息后提交"}
          </button>
        </>
      ) : loaded ? (
        <>
          <Profile code={loaded.code} scores={loaded.scores} share={loaded.stats.typeShare} total={loaded.stats.total} />
          <CrowdResults code={loaded.code} mbti={loaded.mbti} stats={loaded.stats} />
          {saved.id && <ShareButton id={saved.id} title={`我是${typeName(loaded.code)}，你呢？`} />}
        </>
      ) : (
        <div className="card loading" />
      )}

      <footer>非官方小工具，基于霍兰德职业兴趣理论自编题目，仅供参考。真人数据来自参与者匿名填写，只存区间和你写的一句话。</footer>
    </main>
  );
}

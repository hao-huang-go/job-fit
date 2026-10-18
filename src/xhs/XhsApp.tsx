import { useRef, useState } from "react";
import { CrowdResults } from "../CrowdResults";
import { hollandCode, QUESTIONS, scoreAnswers, typeName, type Answers } from "../holland";
import { Profile } from "../Profile";
import { Quiz } from "../Quiz";
import { canPostNote, cardJobs, drawShareCard, postResult } from "./shareCard";
import { snapshot, statsFor } from "./snapshot";

type Stage = "intro" | "quiz" | "result";

// Answers stay on the device so reopening the tool lands on the result. The container may clear it.
const KEY = "job-fit.xhs.answers.v1";

function loadAnswers(): Answers {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Answers;
  } catch {
    return {};
  }
}

function storeAnswers(answers: Answers) {
  try {
    localStorage.setItem(KEY, JSON.stringify(answers));
  } catch {
    // storage unavailable: answers last for this visit
  }
}

const complete = (a: Answers) => QUESTIONS.every((q) => a[q.id] !== undefined);

// A single touch fires pointerdown then click; this window keeps one tap from opening the publisher twice.
const TAP_DEDUPE_MS = 800;

// The offline build that runs inside rednote's mini-tool container: quiz, result, the bundled
// same-type snapshot, and posting the result card as a note. No network.
export default function XhsApp() {
  const [answers, setAnswers] = useState<Answers>(loadAnswers);
  const [stage, setStage] = useState<Stage>(() => {
    const a = loadAnswers();
    return complete(a) ? "result" : Object.keys(a).length ? "quiz" : "intro";
  });
  const [shareState, setShareState] = useState<"idle" | "busy" | "failed">("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const lastShare = useRef(0);

  const scores = scoreAnswers(answers);
  const code = hollandCode(scores);

  function share() {
    if (Date.now() - lastShare.current < TAP_DEDUPE_MS) return;
    lastShare.current = Date.now();
    if (!canPostNote()) {
      setPreview(drawShareCard(code, scores, cardJobs(code)));
      return;
    }
    setShareState("busy");
    postResult(code, scores)
      .then(() => setShareState("idle"))
      .catch(() => setShareState("failed"));
  }

  function restart() {
    storeAnswers({});
    setAnswers({});
    setPreview(null);
    setStage("quiz");
    window.scrollTo(0, 0);
  }

  return (
    <main>
      <header>
        <h1>我适合什么工作？</h1>
        <p className="subtitle">测你的职业兴趣类型，再看看同类型的真实的人都在做什么、做得开不开心</p>
      </header>

      {stage === "intro" ? (
        <section className="card intro">
          <ul>
            <li>30 道题，大约 3 分钟</li>
            <li>测出你的霍兰德职业兴趣类型（六型里你最偏哪几种）</li>
            <li>看看同类型的人做什么工作最开心</li>
            <li>完全免费，不用注册</li>
          </ul>
          <button className="primary wide" onClick={() => setStage("quiz")}>
            开始测试
          </button>
        </section>
      ) : stage === "quiz" ? (
        <Quiz
          answers={answers}
          onAnswer={(id, value) =>
            setAnswers((prev) => {
              const next = { ...prev, [id]: value };
              storeAnswers(next);
              return next;
            })
          }
          onDone={() => {
            setStage("result");
            window.scrollTo(0, 0);
          }}
        />
      ) : (
        <>
          <Profile code={code} scores={scores} share={snapshot.typeShare} total={snapshot.total} />
          <CrowdResults
            code={code}
            mbti={null}
            stats={statsFor(code)}
            emptyHint="同类型的真人数据还在收集中。在评论区留下你的类型代码、做过的工作和满不满意，下次更新就会出现在这里 🙌"
            footnote={`数据来自参与者的匿名填写，不代表所有人。共 ${snapshot.total} 人，更新于 ${snapshot.generatedOn}。`}
          />
          <button
            className="primary wide"
            disabled={shareState === "busy"}
            onPointerDown={share}
            onClick={share}
          >
            {shareState === "busy" ? "正在打开发布页…" : `晒出我的结果：${typeName(code)}`}
          </button>
          {shareState === "failed" && <p className="error">没能打开发布页，再点一次试试</p>}
          {preview && <img className="card-preview" src={preview} alt={`${typeName(code)} 结果卡片`} />}
          <button className="link" onClick={restart}>
            重新测一次
          </button>
        </>
      )}

      <footer>基于霍兰德职业兴趣理论自编题目，仅供参考。兴趣不代表能力，也不决定你适合什么。</footer>
    </main>
  );
}

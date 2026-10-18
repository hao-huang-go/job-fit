import { useState } from "react";
import { QUESTIONS, SCALE, SCALE_LABELS, type Answers } from "./holland";

interface Props {
  answers: Answers;
  onAnswer: (id: string, value: number) => void;
  onDone: () => void;
}

// One activity per screen; picking an answer moves on to the next.
export function Quiz({ answers, onAnswer, onDone }: Props) {
  const firstOpen = QUESTIONS.findIndex((q) => answers[q.id] === undefined);
  const [index, setIndex] = useState(firstOpen === -1 ? QUESTIONS.length - 1 : firstOpen);
  const q = QUESTIONS[index];
  const answered = QUESTIONS.filter((x) => answers[x.id] !== undefined).length;

  function pick(value: number) {
    onAnswer(q.id, value);
    if (index < QUESTIONS.length - 1) setIndex(index + 1);
    else onDone();
  }

  return (
    <section className="card quiz">
      <div className="progress">
        <i style={{ width: `${(answered / QUESTIONS.length) * 100}%` }} />
      </div>
      <p className="step">
        第 {index + 1} / {QUESTIONS.length} 题
      </p>
      <p className="ask">你会喜欢做这件事吗？</p>
      <h2 className="activity">{q.text}</h2>
      <p className="hint">不用管你会不会、学没学过，只看喜不喜欢。</p>
      <div className="scale">
        {SCALE.map((value) => (
          <button key={value} className={answers[q.id] === value ? "on" : ""} onClick={() => pick(value)}>
            {SCALE_LABELS[value - 1]}
          </button>
        ))}
      </div>
      <div className="quiz-nav">
        <button className="link" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          ← 上一题
        </button>
        {answered === QUESTIONS.length && (
          <button className="link" onClick={onDone}>
            看结果 →
          </button>
        )}
      </div>
    </section>
  );
}

import { TYPE_INFO, TYPES, typeName, type HollandType, type Scores } from "./holland";
import { theoryJobs } from "./jobs";

interface Props {
  code: string;
  scores: Scores;
  share?: Partial<Record<HollandType, number>>; // people per main type, when known
  total?: number;
  shared?: boolean;
}

export function Profile({ code, scores, share, total, shared = false }: Props) {
  const main = code[0] as HollandType;
  const mainShare = share && total ? Math.round(((share[main] ?? 0) / total) * 100) : null;
  return (
    <section className="profile">
      <div className="type-card">
        <p className="kicker">{shared ? "TA 的职业兴趣类型" : "你的职业兴趣类型"}</p>
        <h2>{typeName(code)}</h2>
        <p className="code">
          {code.split("").map((t) => (
            <span key={t}>
              {t} {TYPE_INFO[t as HollandType].name}
            </span>
          ))}
        </p>
        <p className="summary">{TYPE_INFO[main].summary}</p>
        {mainShare !== null && total! > 1 && (
          <p className="share-line">
            参与者里 {mainShare}% 是{TYPE_INFO[main].name}
          </p>
        )}
      </div>

      <div className="card">
        <h3>六种兴趣的得分</h3>
        <ul className="bars">
          {[...TYPES]
            .sort((a, b) => scores[b] - scores[a])
            .map((t) => (
              <li key={t} className={code.includes(t) ? "top" : ""}>
                <span>
                  {t} · {TYPE_INFO[t].name}
                </span>
                <i>
                  <em style={{ width: `${Math.max(3, scores[t])}%` }} />
                </i>
                <b>{scores[t]}</b>
              </li>
            ))}
        </ul>
        <p className="note">基于霍兰德职业兴趣理论（RIASEC）自编题目。兴趣只是选工作的参考之一，不代表能力，也不决定你适合什么。</p>
      </div>

      <div className="card">
        <h3>理论上可能适合的工作</h3>
        <div className="chips">
          {theoryJobs(code).map((j) => (
            <span key={j.id} className="chip">
              {j.name}
            </span>
          ))}
        </div>
        <p className="note">这是按理论对应出来的。真实的人做这些工作开不开心，要看下面的真人数据。</p>
      </div>
    </section>
  );
}

import { consistency, differentiation, evidence, jobMatches, lowestType, workTasks } from "./analysis";
import { Hexagon, WorkMap } from "./Charts";
import { TYPE_INFO, typeName, type Answers, type HollandType, type Scores } from "./holland";
import { CONSISTENCY_TEXT, DIFFERENTIATION_TEXT, TYPE_DETAILS } from "./typeDetails";

interface Props {
  code: string;
  scores: Scores;
  answers?: Answers; // the quiz answers, when this device has them; shared results don't
  share?: Partial<Record<HollandType, number>>; // people per main type, when known
  total?: number;
  shared?: boolean;
}

const LEVEL = { high: "高", medium: "中", low: "低" };
const TOP_MATCHES = 10;

// One sentence for where the profile sits on the work-task map.
function workTaskSentence(x: number, y: number): string {
  const people = y > 0.15 ? "更喜欢和人打交道" : y < -0.15 ? "更喜欢和具体的事物、工具打交道" : "和人、和事物打交道都可以";
  const ideas = x > 0.15 ? "偏好数据、事实和清晰的流程" : x < -0.15 ? "偏好想法、创意和理论" : "在数据和想法之间比较平衡";
  return `你${people}，${ideas}。`;
}

const typeLabel = (t: HollandType) => `${t} ${TYPE_INFO[t].name}`;

export function Profile({ code, scores, answers, share, total, shared = false }: Props) {
  const main = code[0] as HollandType;
  const second = code[1] as HollandType;
  const mainShare = share && total ? Math.round(((share[main] ?? 0) / total) * 100) : null;
  const detail = TYPE_DETAILS[main];
  const diff = differentiation(scores);
  const cons = consistency(code);
  const tasks = workTasks(scores);
  const matches = jobMatches(scores);
  const low = lowestType(scores);
  const proof = answers ? evidence(answers, scores) : null;
  const you = shared ? "TA" : "你";

  return (
    <section className="profile">
      <div className="type-card">
        <p className="kicker">{you}的职业兴趣类型</p>
        <h2>{typeName(code)}</h2>
        <p className="code">
          {code.split("").map((t) => (
            <span key={t}>{typeLabel(t as HollandType)}</span>
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
        <h3>六种兴趣的形状</h3>
        <Hexagon scores={scores} code={code} />
        <p className="note">
          霍兰德把职业兴趣分成六种，排成一个六边形：相邻的类型相似，相对的类型差异最大。{you}的形状越往哪个角伸，越偏向那种兴趣。
        </p>
      </div>

      {proof && (proof.liked.length > 0 || proof.disliked.length > 0) && (
        <div className="card">
          <h3>这个结果从哪来？</h3>
          {proof.liked.length > 0 && (
            <>
              <p className="label">你最喜欢的事</p>
              <ul className="proof">
                {proof.liked.map((p) => (
                  <li key={p.text}>
                    <span className="good">♥</span>
                    <b>{p.text}</b>
                    <em>{TYPE_INFO[p.type].name}</em>
                  </li>
                ))}
              </ul>
            </>
          )}
          {proof.disliked.length > 0 && (
            <>
              <p className="label">你最不想做的事</p>
              <ul className="proof">
                {proof.disliked.map((p) => (
                  <li key={p.text}>
                    <span className="bad">✕</span>
                    <b>{p.text}</b>
                    <em>{TYPE_INFO[p.type].name}</em>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="note">每种兴趣由 5 道题算出，得分 = 这 5 件事你有多喜欢（0–100）。</p>
        </div>
      )}

      <div className="card">
        <h3>{you}的类型画像</h3>
        <dl className="detail">
          <dt>核心动力</dt>
          <dd>{detail.drive}</dd>
          <dt>工作中的{you}</dt>
          <dd>
            {detail.atWork}加上第二兴趣<b>{TYPE_INFO[second].name}</b>，{you}会更倾向通过「{TYPE_INFO[second].likes}」这类方式去实现它。
          </dd>
          <dt>适合的环境</dt>
          <dd>{detail.environment}</dd>
          <dt>容易消耗{you}的</dt>
          <dd>{detail.drains}</dd>
        </dl>
        <div className="two-col">
          <div>
            <p className="label">优势</p>
            <ul className="tags good-tags">
              {detail.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label">需要留意</p>
            <ul className="tags">
              {detail.blindSpots.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>兴趣结构</h3>
        <div className="metric">
          <div className="metric-head">
            <b>分化度</b>
            <span className={`pill ${diff.level}`}>{LEVEL[diff.level]}</span>
            <small>最高与最低相差 {diff.gap} 分</small>
          </div>
          <p>{DIFFERENTIATION_TEXT[diff.level]}</p>
        </div>
        <div className="metric">
          <div className="metric-head">
            <b>一致性</b>
            <span className={`pill ${cons.level}`}>{LEVEL[cons.level]}</span>
            <small>
              {TYPE_INFO[main].name}和{TYPE_INFO[second].name}
              {cons.distance === 1 ? "相邻" : cons.distance === 2 ? "隔一位" : "相对"}
            </small>
          </div>
          <p>{CONSISTENCY_TEXT[cons.level]}</p>
        </div>
      </div>

      <div className="card">
        <h3>工作偏好地图</h3>
        <WorkMap x={tasks.x} y={tasks.y} />
        <p className="map-sentence">{workTaskSentence(tasks.x, tasks.y)}</p>
        <p className="note">按 Prediger 的工作任务模型，由六种兴趣得分换算：越靠上越偏人，越靠下越偏事物；越靠右越偏数据，越靠左越偏想法。</p>
      </div>

      <div className="card">
        <h3>理论上最匹配的工作</h3>
        <ol className="matches">
          {matches.slice(0, TOP_MATCHES).map(({ job, match }) => {
            const [a, b] = job.code as unknown as [HollandType, HollandType];
            return (
              <li key={job.id}>
                <div className="match-head">
                  <b>{job.name}</b>
                  <span className="match">{match}%</span>
                </div>
                <i className="match-bar">
                  <em style={{ width: `${match}%` }} />
                </i>
                <p className="meta">
                  需要{TYPE_INFO[a].name}（{you} {scores[a]}）+ {TYPE_INFO[b].name}（{you} {scores[b]}）
                </p>
              </li>
            );
          })}
        </ol>
        <p className="label">可能不太适合</p>
        <div className="chips">
          {matches.slice(-4).reverse().map(({ job, match }) => (
            <span key={job.id} className="chip muted">
              {job.name} {match}%
            </span>
          ))}
        </div>
        <p className="note">匹配度 = 这份工作最需要的两种兴趣上{you}的得分（主 60% + 次 40%），基于常见职业的霍兰德代码。真实的人做得开不开心，要看下面的真人数据。</p>
      </div>

      <div className="card">
        <h3>
          {you}最低的兴趣：{typeLabel(low)}
        </h3>
        <p>
          {you}对{TYPE_INFO[low].name}的活动兴趣最低（{scores[low]} 分）。需要大量「{TYPE_INFO[low].likes}」的工作，长期做可能会比较消耗。这不代表{you}做不好，只是做起来更费能量；如果必须做，可以尽量和{you}高分的兴趣搭配。
        </p>
      </div>

      <details className="card method">
        <summary>测评方法说明</summary>
        <ul>
          <li>理论基础：霍兰德职业兴趣理论（RIASEC），职业规划中使用最广的兴趣模型之一。</li>
          <li>题目：30 道活动题，每种兴趣 5 道，由本站编写；只问喜不喜欢，不问会不会。</li>
          <li>计分：每种兴趣 = 5 题得分之和换算成 0–100；得分最高的三种组成霍兰德代码。</li>
          <li>分化度、一致性、工作偏好地图都是霍兰德理论和 Prediger 模型里的标准解读方式，由得分直接计算。</li>
          <li>局限：兴趣不等于能力，研究里兴趣匹配对工作满意度的预测是中等偏弱的。请把结果当参考，而不是结论。</li>
        </ul>
      </details>
    </section>
  );
}

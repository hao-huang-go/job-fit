import { TYPE_INFO, TYPES, type Scores } from "./holland";

const SIZE = 300;
const C = SIZE / 2;
const R = 100;

const point = (i: number, radius: number) => {
  const angle = ((-90 + i * 60) * Math.PI) / 180;
  return [C + radius * Math.cos(angle), C + radius * Math.sin(angle)] as const;
};
const polygon = (radii: number[]) => radii.map((r, i) => point(i, r).join(",")).join(" ");

// The six interests around Holland's hexagon (R-I-A-S-E-C clockwise), filled to each score.
export function Hexagon({ scores, code }: { scores: Scores; code: string }) {
  return (
    <svg className="hexagon" viewBox={`-30 -14 ${SIZE + 60} ${SIZE + 28}`} role="img" aria-label="六种兴趣的雷达图">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} className="hex-grid" points={polygon(TYPES.map(() => R * f))} />
      ))}
      {TYPES.map((_, i) => {
        const [x, y] = point(i, R);
        return <line key={i} className="hex-grid" x1={C} y1={C} x2={x} y2={y} />;
      })}
      <polygon className="hex-shape" points={polygon(TYPES.map((t) => R * Math.max(0.04, scores[t] / 100)))} />
      {TYPES.map((t, i) => {
        const [x, y] = point(i, R + 34);
        return (
          <text key={t} className={code.includes(t) ? "hex-label top" : "hex-label"} x={x} y={y - 8} textAnchor="middle">
            <tspan x={x}>{TYPE_INFO[t].name}</tspan>
            <tspan x={x} dy={18} className="hex-score">
              {scores[t]}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}

const MAP = 240;

// Prediger's work-task map: up = people, down = things, left = ideas, right = data.
export function WorkMap({ x, y }: { x: number; y: number }) {
  const px = ((x + 1) / 2) * MAP;
  const py = ((1 - y) / 2) * MAP;
  return (
    <svg className="workmap" viewBox={`-60 -30 ${MAP + 120} ${MAP + 60}`} role="img" aria-label="工作偏好地图">
      <rect className="map-frame" x={0} y={0} width={MAP} height={MAP} rx={12} />
      <line className="hex-grid" x1={MAP / 2} y1={0} x2={MAP / 2} y2={MAP} />
      <line className="hex-grid" x1={0} y1={MAP / 2} x2={MAP} y2={MAP / 2} />
      <text className="map-label" x={MAP / 2} y={-12} textAnchor="middle">和人打交道</text>
      <text className="map-label" x={MAP / 2} y={MAP + 22} textAnchor="middle">和事物打交道</text>
      <text className="map-label" x={-8} y={MAP / 2} textAnchor="end" dominantBaseline="middle">想法</text>
      <text className="map-label" x={MAP + 8} y={MAP / 2} dominantBaseline="middle">数据</text>
      <circle className="map-dot-halo" cx={px} cy={py} r={18} />
      <circle className="map-dot" cx={px} cy={py} r={8} />
    </svg>
  );
}

import { TYPE_INFO, TYPES, typeName, type HollandType, type Scores } from "../holland";
import { theoryJobs } from "../jobs";

const W = 1080;
const H = 1440;
const FONT = '-apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';

// Punctuation that must not begin a line; it stays on the line before even if that runs slightly long.
const NO_LINE_START = "，。、：；！？）」』·";

// Breaks text into lines that fit `width`, character by character (Chinese has no spaces to break on).
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > width && line && !NO_LINE_START.includes(ch)) {
      lines.push(line);
      line = ch;
    } else {
      line += ch;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// A 3:4 result card for posting as a note image; returns a PNG data URL.
export function drawShareCard(code: string, scores: Scores, topJobs: string[]): string {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#4338ca");
  bg.addColorStop(1, "#7c3aed");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const pad = 80;
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = `600 40px ${FONT}`;
  ctx.fillText("我的职业兴趣类型", pad, 150);

  ctx.fillStyle = "#ffffff";
  ctx.font = `800 104px ${FONT}`;
  ctx.fillText(typeName(code), pad, 290);

  let x = pad;
  ctx.font = `700 38px ${FONT}`;
  for (const t of code) {
    const label = `${t} ${TYPE_INFO[t as HollandType].name}`;
    const w = ctx.measureText(label).width + 48;
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    roundRect(ctx, x, 340, w, 68, 34);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, x + 24, 388);
    x += w + 20;
  }

  ctx.font = `400 38px ${FONT}`;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  wrap(ctx, TYPE_INFO[code[0] as HollandType].summary, W - pad * 2).forEach((line, i) => ctx.fillText(line, pad, 500 + i * 58));

  // Score bars on a white panel.
  const panelY = 660;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, pad - 20, panelY, W - (pad - 20) * 2, 470, 36);
  ctx.fill();
  const sorted = [...TYPES].sort((a, b) => scores[b] - scores[a]);
  sorted.forEach((t, i) => {
    const y = panelY + 80 + i * 66;
    const top = code.includes(t);
    ctx.fillStyle = top ? "#1e1b2e" : "#6d6880";
    ctx.font = `${top ? 700 : 400} 34px ${FONT}`;
    ctx.fillText(`${t} · ${TYPE_INFO[t].name}`, pad + 20, y);
    const bx = pad + 240;
    const bw = W - bx - pad - 110;
    ctx.fillStyle = "#eceafc";
    roundRect(ctx, bx, y - 24, bw, 22, 11);
    ctx.fill();
    ctx.fillStyle = "#4338ca";
    roundRect(ctx, bx, y - 24, Math.max(22, (bw * scores[t]) / 100), 22, 11);
    ctx.fill();
    ctx.fillStyle = top ? "#1e1b2e" : "#6d6880";
    ctx.textAlign = "right";
    ctx.fillText(String(scores[t]), W - pad - 20, y);
    ctx.textAlign = "left";
  });

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 38px ${FONT}`;
  ctx.fillText("可能适合", pad, 1210);
  ctx.font = `400 36px ${FONT}`;
  wrap(ctx, topJobs.join(" · "), W - pad * 2)
    .slice(0, 2)
    .forEach((line, i) => ctx.fillText(line, pad, 1270 + i * 54));

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = `400 30px ${FONT}`;
  ctx.fillText("测测你适合什么工作 · 基于霍兰德职业兴趣理论", pad, 1390);

  return canvas.toDataURL("image/png");
}

export const cardJobs = (code: string) => theoryJobs(code, 5).map((j) => j.name.split(" / ")[0]);

interface MiniTool {
  postNote(options: {
    title?: string;
    content?: string;
    pageType?: "photo_publish";
    mediaInfo: { image_resources: { url: string }[] };
    tags?: string;
  }): Promise<unknown>;
}

const miniTool = (): MiniTool | null =>
  (window as unknown as { xhs?: { miniTool?: MiniTool } }).xhs?.miniTool ?? null;

export const canPostNote = () => miniTool() !== null;

// Opens rednote's publish page with the result card attached.
export async function postResult(code: string, scores: Scores): Promise<void> {
  const tool = miniTool();
  if (!tool) throw new Error("no_bridge");
  const name = typeName(code);
  await tool.postNote({
    title: `测出来我是${name}`.slice(0, 20),
    content: `我的霍兰德职业兴趣代码是 ${code}（${code
      .split("")
      .map((t) => TYPE_INFO[t as HollandType].name)
      .join(" / ")}）。你是什么类型？评论区说说你在做什么工作、喜不喜欢～`,
    pageType: "photo_publish",
    mediaInfo: { image_resources: [{ url: drawShareCard(code, scores, cardJobs(code)) }] },
    tags: "职业测评,霍兰德职业兴趣,我适合什么工作",
  });
}

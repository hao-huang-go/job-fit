// Holland's six career-interest types (RIASEC). The theory is public; the questions below are our own,
// written in Chinese for this app rather than taken from any published item bank.

export const TYPES = ["R", "I", "A", "S", "E", "C"] as const;
export type HollandType = (typeof TYPES)[number];

export const TYPE_INFO: Record<HollandType, { name: string; noun: string; adjective: string; summary: string; likes: string }> = {
  R: {
    name: "实干型",
    noun: "实干家",
    adjective: "动手能力强的",
    summary: "喜欢和具体的东西打交道：工具、机器、材料、身体、户外。看得见摸得着的成果最让你满足。",
    likes: "修理、组装、操作设备、户外和体力活",
  },
  I: {
    name: "研究型",
    noun: "探索者",
    adjective: "爱琢磨的",
    summary: "喜欢想明白事情背后的道理：分析、研究、解题。比起被安排，你更享受独立钻研。",
    likes: "分析数据、做研究、解决复杂问题",
  },
  A: {
    name: "艺术型",
    noun: "创作者",
    adjective: "有创意的",
    summary: "喜欢表达和创造：写、画、拍、设计、演。重视自由和审美，讨厌一成不变。",
    likes: "设计、写作、拍摄剪辑、音乐表演",
  },
  S: {
    name: "社会型",
    noun: "助人者",
    adjective: "温暖的",
    summary: "喜欢和人在一起、帮别人成长或变好：教、照顾、倾听、协调。别人的感谢就是你的动力。",
    likes: "教学、照护、咨询、团队协作",
  },
  E: {
    name: "企业型",
    noun: "带头人",
    adjective: "有冲劲的",
    summary: "喜欢影响别人、推动事情发生：带团队、谈判、销售、创业。目标和结果让你兴奋。",
    likes: "带团队、谈生意、做决策、推动项目",
  },
  C: {
    name: "常规型",
    noun: "组织者",
    adjective: "有条理的",
    summary: "喜欢清楚的规则和秩序：整理、核对、规划、流程。把事情做得准确稳妥让你安心。",
    likes: "整理数据、做表格、管流程、核对细节",
  },
};

// Five activities per type; people say how much they'd enjoy each one, whatever their training.
export const QUESTIONS: { id: string; type: HollandType; text: string }[] = [
  { id: "r1", type: "R", text: "自己动手组装家具或修好坏掉的东西" },
  { id: "i1", type: "I", text: "研究一个问题背后的原因，直到彻底想明白" },
  { id: "a1", type: "A", text: "设计海报、logo 或者给房间做软装搭配" },
  { id: "s1", type: "S", text: "耐心地教别人一个新技能" },
  { id: "e1", type: "E", text: "说服别人接受你的方案或买你的东西" },
  { id: "c1", type: "C", text: "把一堆杂乱的文件、照片或数据整理得井井有条" },
  { id: "r2", type: "R", text: "操作专业设备或机器，比如相机、车床、无人机" },
  { id: "i2", type: "I", text: "看数据、做分析，从里面找出规律" },
  { id: "a2", type: "A", text: "写故事、写文案，或者写歌词" },
  { id: "s2", type: "S", text: "倾听朋友的烦恼，帮他们理清思路" },
  { id: "e2", type: "E", text: "带领一个小团队完成目标" },
  { id: "c2", type: "C", text: "做预算、记账，每一笔都对得上" },
  { id: "r3", type: "R", text: "在户外干活，比如种植、搭建、做园艺" },
  { id: "i3", type: "I", text: "读论文或深度文章，弄懂一个新领域" },
  { id: "a3", type: "A", text: "拍照、拍视频并剪辑成片" },
  { id: "s3", type: "S", text: "照顾老人、小孩或者生病的人" },
  { id: "e3", type: "E", text: "自己开一家店或做一门小生意" },
  { id: "c3", type: "C", text: "按清晰的流程把重复的工作做得又快又准" },
  { id: "r4", type: "R", text: "做手工活，比如木工、烘焙、缝纫" },
  { id: "i4", type: "I", text: "写代码或搭一个系统，让它自动解决问题" },
  { id: "a4", type: "A", text: "唱歌、跳舞、演戏或者在台上表演" },
  { id: "s4", type: "S", text: "组织活动，让一群人玩得开心、互相认识" },
  { id: "e4", type: "E", text: "谈判，比如谈价格、谈合作条件" },
  { id: "c4", type: "C", text: "检查文件里的错别字和数字错误" },
  { id: "r5", type: "R", text: "修车、装电脑，或者折腾电子设备" },
  { id: "i5", type: "I", text: "做实验验证一个想法对不对" },
  { id: "a5", type: "A", text: "做自媒体内容，比如小红书笔记、播客" },
  { id: "s5", type: "S", text: "做志愿者，帮助有需要的人" },
  { id: "e5", type: "E", text: "在很多人面前演讲或主持" },
  { id: "c5", type: "C", text: "制定详细的计划表并严格按计划执行" },
];

export const SCALE = [1, 2, 3, 4, 5] as const;
export const SCALE_LABELS = ["很不喜欢", "不太喜欢", "无所谓", "比较喜欢", "很喜欢"];

export type Answers = Record<string, number>; // question id -> 1..5
export type Scores = Record<HollandType, number>; // 0..100

// Each type's score is how much its five activities were liked, scaled to 0-100.
export function scoreAnswers(answers: Answers): Scores {
  const scores = {} as Scores;
  for (const type of TYPES) {
    const items = QUESTIONS.filter((q) => q.type === type);
    const sum = items.reduce((s, q) => s + (answers[q.id] ?? 3), 0);
    scores[type] = Math.round(((sum - items.length) / (items.length * 4)) * 100);
  }
  return scores;
}

// Holland code: the three highest types, highest first; ties keep RIASEC order.
export function hollandCode(scores: Scores): string {
  return [...TYPES].sort((a, b) => scores[b] - scores[a]).slice(0, 3).join("");
}

// A readable name from the top two types, e.g. "IA" -> "有创意的探索者".
export function typeName(code: string): string {
  const [first, second] = code as unknown as [HollandType, HollandType];
  return `${TYPE_INFO[second].adjective}${TYPE_INFO[first].noun}`;
}

export const isHollandCode = (value: unknown): value is string =>
  typeof value === "string" && /^[RIASEC]{3}$/.test(value) && new Set(value).size === 3;

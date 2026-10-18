// Options and completeness rules for the "your jobs" form.
import type { JobEntry } from "./api";

export const COUNTRIES: [string, string][] = [
  ["cn", "中国大陆"], ["au", "澳大利亚"], ["us", "美国"], ["ca", "加拿大"], ["uk", "英国"], ["sg", "新加坡"],
  ["nz", "新西兰"], ["hk", "香港"], ["tw", "台湾"], ["my", "马来西亚"], ["jp", "日本"], ["eu", "欧洲"], ["other", "其他"],
];
export const AGE_BANDS = ["<22", "22-25", "26-30", "31-35", "36-40", "41-50", "50+"];
export const YEARS: [string, string][] = [["<1", "不到 1 年"], ["1-3", "1–3 年"], ["3-5", "3–5 年"], ["5-10", "5–10 年"], ["10+", "10 年以上"]];
export const INCOMES: [string, string][] = [
  ["much_lower", "明显偏低"], ["lower", "偏低"], ["same", "差不多"], ["higher", "偏高"], ["much_higher", "明显偏高"],
];
export const MBTI_AXES: [string, string][] = [["E", "I"], ["S", "N"], ["T", "F"], ["J", "P"]];
export const MAX_JOBS = 3;

export interface Details {
  country: string | null;
  age: string | null;
  mbti: string[]; // four letters, or empty when not given
  jobs: JobEntry[];
}

export const blankJob = (): JobEntry => ({ jobId: null, custom: null, status: "current", years: "", income: null, satisfaction: 0, reason: null });

export const emptyDetails = (): Details => ({ country: null, age: null, mbti: [], jobs: [blankJob()] });

export const jobComplete = (j: JobEntry) => (j.jobId || j.custom) && j.years && j.satisfaction > 0;
export const detailsComplete = (d: Details) => d.country && d.age && d.jobs.length > 0 && d.jobs.every(jobComplete);

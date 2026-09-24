// 少年圖靈計畫（高中生，依屆次）與青年圖靈++（校友，依年度）共用的小工具。

export const TRACK = {
  main: { key: 'main', label: '少年圖靈計畫', href: '/program/' },
  plus: { key: 'plus', label: '青年圖靈++', href: '/turing-plus/' },
} as const;

export const STAGE_LABEL: Record<string, string> = {
  camp: '程式挑戰營', project: '專題實作', hackathon: '黑客松', overseas: '海外參訪',
};
export const PHASE_LABEL = ['', 'Phase I', 'Phase II', 'Phase III'];

export const stagePath = (edition: number, type: string) => `/cohorts/${edition}/${type}/`;
export const cohortPath = (edition: number) => `/cohorts/${edition}/`;

// 'YYYY' | 'YYYY-MM' | 'YYYY-MM-DD' → '2026' | '2026/07' | '2026/07/07'
export const fmtDate = (d?: string) => (d ? d.replaceAll('-', '/') : '');

export function fmtRange(start?: string, end?: string) {
  if (!start) return '';
  if (!end || end === start) return fmtDate(start);
  // 同年省略年份：2025/10 – 2026/03、2026/04/25 – 04/26
  const [sy] = start.split('-'), [ey] = end.split('-');
  return `${fmtDate(start)} – ${sy === ey ? fmtDate(end).slice(5) : fmtDate(end)}`;
}

// 故事的 cohort 欄位是自由文字（「第 6 屆（2021）」「第 3–5 屆（2018–2020）」），解析出涵蓋的屆次
export function cohortEditions(text?: string): number[] {
  const m = text?.match(/第\s*(\d+)(?:\s*[–-]\s*(\d+))?\s*屆/);
  if (!m) return [];
  const a = Number(m[1]), b = Number(m[2] ?? m[1]);
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

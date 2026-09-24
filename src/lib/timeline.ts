// 首頁年度時程的資料與幾何（PLAN-v1 階段 4、設計系統「時間軸與動態」）。
// 視窗：Y 年 3 月 1 日（寒假結束）→ Y+1 年 8 月 31 日（暑假結束），依「日」線性換算 x。
// 少年圖靈計畫在軸線上方，分三段；青年圖靈++ 在軸線下方，每場畫起迄（報名開始 → 競賽日）。

export type Track = 'main' | 'plus';
export interface TLNode { id: string; track: Track; name: string; label: string; date: string; x: number; t: number; tier: 1 | 2 | 3; href?: string; approx?: boolean }
export interface TLSeg { id: string; track: Track; x1: number; x2: number; t1: number; t2: number; phase?: string; name?: string; dashed?: boolean; clipLeft?: boolean; href?: string }
export interface TLPlus { id: string; name: string; dates: string; x: number; labelX: number; seg: TLSeg; endNode?: { x: number; t: number }; pending: boolean; href: string }

export const VW = 1040, X0 = 96, XR = 20;
export const Y = { phase: 20, bracket: 32, tier2: 62, tier1: 92, main: 128, tier3: 154, axis: 194, plus: 262, height: 330 };

const DAY = 86400000;
export const utc = (y: number, m: number, d = 1) => Date.UTC(y, m - 1, d);

// 'YYYY-MM-DD' → 該日；'YYYY-MM' → 當月 15 日（只知月份，approx）；'YYYY' 或空 → null
export function parse(s?: string): { t: number; approx: boolean } | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!m) return null;
  return { t: utc(y, m, d ?? 15), approx: !d };
}
const md = (t: number) => { const d = new Date(t); return `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}`; };
const ym = (t: number) => { const d = new Date(t); return `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`; };
const textW = (s: string) => [...s].reduce((w, c) => w + (/[⺀-￿]/.test(c) ? 14 : 8.2), 0);

export function build(cohort: any, plusEvents: any[], stageHackathonTitle?: string) {
  const year: number = cohort.data.year, n: number = cohort.data.edition;
  const w0 = utc(year, 3, 1), w1 = utc(year + 1, 9, 1);           // 半開區間，到 8/31 為止
  const pxPerMs = (VW - X0 - XR) / (w1 - w0);
  const x = (t: number) => X0 + (Math.min(Math.max(t, w0), w1) - w0) * pxPerMs;

  const stages = Object.fromEntries(cohort.data.stages.map((s: any) => [s.phase, s]));
  const ev = (phase: number, name: string) => stages[phase]?.events.find((e: any) => e.name === name);
  const firstEv = (phase: number) => stages[phase]?.events.find((e: any) => parse(e.start));

  const nodes: TLNode[] = [];
  const add = (id: string, name: string, p: { t: number; approx: boolean } | null, href: string, fmt: 'md' | 'ym' = 'md') => {
    if (!p) return;
    nodes.push({ id, track: 'main', name, label: name, date: p.approx || fmt === 'ym' ? ym(p.t) : md(p.t), x: x(p.t), t: p.t, tier: 1, href, approx: p.approx });
  };
  const base = `/cohorts/${n}/`;
  // Phase I：報名開始、報名截止、線上初賽、程式挑戰營（Phase I 結束）
  const reg = ev(1, '報名');
  add('reg-open', '報名開始', parse(reg?.start), `${base}camp/`);
  add('reg-close', '報名截止', parse(reg?.end), `${base}camp/`);
  add('prelim', '線上初賽', parse(ev(1, '線上初賽')?.start), `${base}camp/`);
  const camp = parse(ev(1, '程式挑戰營')?.start);
  add('camp', '程式挑戰營', camp, `${base}camp/`);
  // Phase II：挑戰營 + 14 天起（不標日期）→ 第二階段的終點（黑客松競賽日；專題實作時代為成果發表）
  const p2type = stages[2]?.type;
  const p2endEv = p2type === 'hackathon' ? stages[2].events[stages[2].events.length - 1] : ev(2, '成果發表');
  const p2end = parse(p2endEv?.start);
  add('p2-end', p2type === 'hackathon' ? (stageHackathonTitle ?? stages[2].title) : '成果發表', p2end, `${base}${p2type}/`);
  // Phase III：第二階段終點 + 14 天起（不標日期）→ 選拔、出訪
  const sel = parse(ev(3, '海外參訪選拔')?.start), trip = parse(ev(3, '海外參訪出訪')?.start);
  add('select', '海外參訪選拔', sel, `${base}overseas/`, 'ym');
  add('trip', '海外參訪出訪', trip, `${base}overseas/`, 'ym');

  const p1start = parse(reg?.start) ?? parse(firstEv(1)?.start);
  const segs: TLSeg[] = [];
  const seg = (id: string, phase: string, name: string, a: number | undefined, b: number | undefined, href: string) => {
    if (a == null) return;
    const dashed = b == null; const tb = b ?? w1;
    segs.push({ id, track: 'main', phase, name, x1: x(a), x2: x(tb), t1: a, t2: tb, dashed, href });
  };
  seg('p1', 'Phase I', stages[1]?.title ?? '程式挑戰營', p1start?.t, camp?.t, `${base}camp/`);
  const p2s = camp ? camp.t + 14 * DAY : undefined;
  seg('p2', 'Phase II', p2type === 'hackathon' ? '黑客松' : '專題實作', p2s, p2end?.t, `${base}${p2type}/`);
  const p3s = p2end ? p2end.t + 14 * DAY : undefined;
  seg('p3', 'Phase III', '海外參訪', p3s, (trip ?? sel)?.t, `${base}overseas/`);

  // 標籤分層：第 1 層（線上方）→ 第 3 層（線下方）→ 第 2 層（線上方較高處，加引線），取第一個不重疊的
  const GAP = 10;
  const lastRight: Record<number, number> = { 1: -1e9, 2: -1e9, 3: -1e9 };
  for (const nd of [...nodes].sort((a, b) => a.x - b.x)) {
    const w = Math.max(textW(nd.label), textW(nd.date)) / 2;
    const tier = ([1, 3, 2] as const).find(k => nd.x - w > lastRight[k] + GAP) ?? 2;
    nd.tier = tier;
    lastRight[tier] = nd.x + w;
  }

  // 青年圖靈++：與視窗重疊的場次
  const plus: TLPlus[] = [];
  for (const h of plusEvents) {
    const yr = Number(h.id);
    const rs = parse(h.data.regStart), s = parse(h.data.start), e = parse(h.data.end) ?? s;
    const href = `/turing-plus/${h.id}/`, name = h.data.title.split('：')[0];
    if (s && e) {
      const a = (rs ?? s).t;
      if (e.t < w0 || a >= w1) continue;
      const sg: TLSeg = { id: `plus-${h.id}`, track: 'plus', x1: x(a), x2: x(e.t), t1: a, t2: e.t, clipLeft: a < w0, href };
      const dates = `${rs ? `${md(rs.t)} 報名起 – ` : ''}${md(s.t)}${e.t !== s.t ? `–${md(e.t).slice(3)}` : ''} 競賽`;
      plus.push({ id: h.id, name, dates, x: sg.x2, labelX: Math.max(X0 + 4, sg.x1), seg: sg, endNode: { x: sg.x2, t: e.t }, pending: false, href });
    } else {
      // 日期未定：上半年（1–6 月）虛線框
      const a = utc(yr, 1, 1), b = utc(yr, 7, 1);
      if (b <= w0 || a >= w1) continue;
      const sg: TLSeg = { id: `plus-${h.id}`, track: 'plus', x1: x(a), x2: x(b - DAY), t1: a, t2: b - DAY, dashed: true, href };
      plus.push({ id: h.id, name, dates: `${yr} 上半年（日期待公布）`, x: sg.x1, labelX: sg.x1, seg: sg, pending: true, href });
    }
  }

  // 月份刻度與年度色帶
  const months: { x: number; mid: number; label: string }[] = [];
  for (let i = 0; i < 18; i++) {
    const yy = year + Math.floor((i + 2) / 12), mm = ((i + 2) % 12) + 1;
    const a = utc(yy, mm, 1), b = utc(yy, mm + 1, 1);
    months.push({ x: x(a), mid: (x(a) + x(b)) / 2, label: String(mm) });
  }
  const years = [
    { year, x1: x(w0), x2: x(utc(year + 1, 1, 1)) },
    { year: year + 1, x1: x(utc(year + 1, 1, 1)), x2: x(w1) },
  ];
  return { edition: n, year, era: cohort.data.era, w0, w1, pxPerMs, x, nodes, segs, plus, months, years };
}

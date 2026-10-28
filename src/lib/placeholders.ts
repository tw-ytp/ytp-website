/** 內容裡的動態佔位字串：{{season.edition}}、{{season.year}}、{{season.registration.close}}、{{site.email}}、{{stats.editions}}、{{site.oj.url}}、
 *  以及 {{season.nextYear}}（= year + 1）。Markdown 正文由 astro.config.mjs 的 remark 外掛替換，frontmatter 欄位由頁面模板呼叫 interpolate()。
 *  後台同仁只要照打 {{season.edition}} 就會顯示當屆數字，賽季換屆時不必逐頁改。 */
import season from '../data/season.json';
import site from '../data/site.json';
import stats from '../data/stats.json';

const data: Record<string, unknown> = {
  season: { ...season, nextYear: season.year + 1 },
  site,
  stats,
};

const get = (path: string): unknown => path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), data);

export const PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

/** 把字串裡的 {{a.b.c}} 換成對應值；找不到的保留原樣（建置時印警告，方便發現打錯）。 */
export function interpolate(text: string): string {
  return text.replace(PLACEHOLDER, (m, key: string) => {
    const v = get(key);
    if (v === undefined || v === null || typeof v === 'object') { console.warn(`[placeholders] 找不到 ${m}`); return m; }
    return String(v);
  });
}

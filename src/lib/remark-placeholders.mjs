/** remark 外掛：Markdown 正文的 {{season.edition}} 等佔位字串替換（見 src/lib/placeholders.ts）。
 *  astro.config.mjs 載入時 Node 無法直接 import .ts，所以這裡自己讀 JSON。 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const load = (f) => JSON.parse(readFileSync(fileURLToPath(new URL(`../data/${f}`, import.meta.url)), 'utf8'));
const season = load('season.json');
const data = { season: { ...season, nextYear: season.year + 1 }, site: load('site.json'), stats: load('stats.json') };
const RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
const get = (p) => p.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), data);
const swap = (s) => s.replace(RE, (m, key) => { const v = get(key); return v === undefined || v === null || typeof v === 'object' ? m : String(v); });
export default function remarkPlaceholders() {
  return (tree) => {
    const walk = (node) => {
      if (node.type === 'text' || node.type === 'inlineCode') node.value = swap(node.value);
      if (node.type === 'link' && node.url) node.url = swap(node.url);
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}

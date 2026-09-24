// 建置後產生 dist/sitemap.xml。用 Node 而非 Python：
// 託管平台的建置環境一定有 Node，未必有 python3，少一個失敗點。
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = readFileSync(join(root, 'astro.config.mjs'), 'utf8');
const site = (cfg.match(/site:\s*['"]([^'"]+)['"]/)?.[1] ?? 'https://www.tw-ytp.org').replace(/\/$/, '');
const dist = join(root, 'dist');

const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
});

const today = new Date().toISOString().slice(0, 10);
const urls = walk(dist)
  .map((f) => relative(dist, f).split('\\').join('/'))
  .filter((r) => r !== '404.html')
  .map((r) => site + (r === 'index.html' ? '/' : r.endsWith('/index.html') ? '/' + r.slice(0, -'index.html'.length) : '/' + r))
  .sort();

writeFileSync(join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
  `\n</urlset>\n`);
console.log(`${urls.length} 個網址 → dist/sitemap.xml`);

// 預覽部署（PUBLIC_NOINDEX=true）：robots.txt 改為禁止索引，避免搜尋引擎收錄 *.pages.dev
if (process.env.PUBLIC_NOINDEX === 'true') {
  writeFileSync(join(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  console.log('PUBLIC_NOINDEX=true → dist/robots.txt 禁止索引');
}

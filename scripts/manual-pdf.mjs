#!/usr/bin/env node
/** 把 docs/manual.md 匯出成 PDF（邀請同仁時隨信附上）。用法：node scripts/manual-pdf.mjs → docs/manual.pdf
 *  需要 marked 與 playwright（npx 會自動抓）；截圖從 docs/manual/ 內嵌。 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { marked } from 'marked';
import { chromium } from 'playwright';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(resolve(root, 'docs/manual.md'), 'utf8');
const [, fm, body] = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
const title = fm.match(/^title:\s*(.+)$/m)?.[1] ?? '操作手冊';
const updated = fm.match(/^updated:\s*(.+)$/m)?.[1] ?? '';
const html = marked.parse(body.replace(/\]\(\/docs\/manual\//g, '](manual/'));
const page = `<!doctype html><html lang="zh-Hant-TW"><meta charset="utf-8"><title>${title}</title>
<style>
  @page{size:A4;margin:18mm 16mm}
  body{font-family:"Noto Sans TC","Noto Sans CJK TC","PingFang TC","Microsoft JhengHei",sans-serif;font-size:11pt;line-height:1.7;color:#14213D}
  h1{font-size:22pt;margin:0 0 4pt} h2{font-size:15pt;margin:22pt 0 8pt;padding-top:8pt;border-top:1px solid #D9DED8;page-break-after:avoid}
  p{margin:0 0 8pt} table{border-collapse:collapse;width:100%;font-size:9.5pt;margin:6pt 0 10pt} th,td{border:1px solid #D9DED8;padding:4pt 6pt;vertical-align:top;text-align:left} th{background:#F2F4F1}
  img{max-width:100%;border:1px solid #D9DED8;border-radius:3pt;margin:4pt 0 10pt;page-break-inside:avoid}
  code{font-family:"IBM Plex Mono",Menlo,monospace;font-size:9.5pt;background:#F2F4F1;padding:0 3pt;border-radius:2pt}
  .meta{color:#4A5568;font-size:9.5pt;margin-bottom:14pt} hr{border:0;border-top:1px dashed #D9DED8;margin:16pt 0}
</style><body><h1>${title}</h1><p class="meta">最後更新 ${updated}</p>${html}</body></html>`;
const out = resolve(root, 'docs/manual.html');
writeFileSync(out, page);
const browser = await chromium.launch();
const p = await browser.newPage();
await p.goto(pathToFileURL(out).href, { waitUntil: 'networkidle' });
await p.pdf({ path: resolve(root, 'docs/manual.pdf'), format: 'A4', printBackground: true, displayHeaderFooter: true,
  headerTemplate: '<span></span>', footerTemplate: '<div style="font-size:8pt;color:#4A5568;width:100%;text-align:center;font-family:sans-serif">YTP 官網內容後台操作手冊 · <span class="pageNumber"></span>/<span class="totalPages"></span></div>' });
await browser.close();
console.log('docs/manual.pdf 已產生');

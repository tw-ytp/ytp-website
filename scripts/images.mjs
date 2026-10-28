#!/usr/bin/env node
/** 建置前的圖片處理（取代以前手工做縮圖、手填 gallery.json）。
 *
 *  1. 相簿 public/photos/<屆次數字>/：每張原圖產生 <名稱>-t.jpg 縮圖（最長邊 480px），
 *     並把尺寸寫進 src/data/gallery.json，Gallery.astro 直接讀。
 *     同仁只要在後台「活動照片」裡建資料夾（如 12）上傳照片，屆次頁就會有相簿。
 *  2. 所有 public/photos/** 原圖：寬或高超過 1600px 就就地縮小（手機原圖 4000px 以上會拖慢網頁）。
 *  3. 縮圖已存在就跳過（--force 全部重做）；縮圖與 gallery.json 都進 git，Cloudflare 建置只補新照片的縮圖。
 *
 *  用法：node scripts/images.mjs（npm run build 會自動先跑）；--check 只列出會做的事。 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PHOTOS = path.join(ROOT, 'public', 'photos');
const GALLERY = path.join(ROOT, 'src', 'data', 'gallery.json');
const MAX = 1600, THUMB = 480;
const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const check = process.argv.includes('--check'), force = process.argv.includes('--force');
let resized = 0, thumbs = 0;

async function* walk(dir) {
  for (const d of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) yield* walk(p);
    else yield p;
  }
}
const isThumb = f => /-t\.jpg$/i.test(f);
const mtime = async f => { try { return (await fs.stat(f)).mtimeMs; } catch { return 0; } };

// 2. 超大原圖就地縮小
for await (const f of walk(PHOTOS)) {
  if (!EXT.has(path.extname(f).toLowerCase()) || isThumb(f)) continue;
  const m = await sharp(f).metadata();
  if (Math.max(m.width ?? 0, m.height ?? 0) <= MAX) continue;
  resized++;
  if (check) { console.log('resize', path.relative(ROOT, f), `${m.width}x${m.height}`); continue; }
  const buf = await sharp(f).rotate().resize({ width: MAX, height: MAX, fit: 'inside' }).toBuffer();
  await fs.writeFile(f, buf);
}

// 1. 相簿：屆次資料夾 → 縮圖 + gallery.json
const gallery = {};
const dirs = (await fs.readdir(PHOTOS, { withFileTypes: true })).filter(d => d.isDirectory() && /^\d+$/.test(d.name)).map(d => d.name).sort((a, b) => a - b);
for (const ed of dirs) {
  const dir = path.join(PHOTOS, ed);
  const files = (await fs.readdir(dir)).filter(n => EXT.has(path.extname(n).toLowerCase()) && !isThumb(n)).sort();
  const items = [];
  for (const name of files) {
    const src = path.join(dir, name), base = name.replace(/\.[^.]+$/, ''), thumb = path.join(dir, `${base}-t.jpg`);
    const m = await sharp(src).metadata();
    items.push({ f: base, ext: path.extname(name).slice(1).toLowerCase(), w: m.width, h: m.height });
    if (!force && (await mtime(thumb))) continue;
    thumbs++;
    if (check) { console.log('thumb', path.relative(ROOT, thumb)); continue; }
    await sharp(src).rotate().resize({ width: THUMB, height: THUMB, fit: 'inside' }).jpeg({ quality: 78 }).toFile(thumb);
  }
  if (items.length) gallery[ed] = items;
}
if (!check) await fs.writeFile(GALLERY, JSON.stringify(gallery).replace(/\],"/g, '],\n"') + '\n');
console.log(`images: ${Object.keys(gallery).length} 個相簿、${Object.values(gallery).reduce((n, a) => n + a.length, 0)} 張照片；縮小 ${resized} 張、產生縮圖 ${thumbs} 張${check ? '（--check，未寫入）' : ''}`);

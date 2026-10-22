#!/usr/bin/env python3
"""產生各頁 Banner 底圖：由 public/ 既有照片裁切成寬幅並輸出 WebP（1800w 與 900w）。
   來源與焦點在 BANNERS 表；改表後重跑 `python3 scripts/gen_banners.py`。"""
from PIL import Image
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# name: (source, aspect w:h, focus-y 0..1 用於垂直裁切[, 先保留左側寬度比例 0..1：讓圖中主體往右移，避開左側標題])
BANNERS = {
    'home':       ('public/photos/11/045.jpg', (16, 8), 0.55),   # 第 11 屆挑戰營大合照
    'program':    ('public/photos/11/027.jpg', (21, 9), 0.5),
    'cohorts':    ('public/photos/11/045.jpg', (21, 9), 0.55),
    'projects':   ('public/photos/11/018.jpg', (21, 9), 0.4),
    'resources':  ('public/photos/11/042.jpg', (21, 9), 0.5),
    'news':       ('public/photos/10/022.jpg', (21, 9), 0.5),
    'stories':    ('src/assets/banner-src/overseas-2024-google.jpg', (21, 9), 0.55),   # 2024 海外參訪 Google 園區（2026-10-22 提供）
    'turing-plus':('src/assets/banner-src/hackathon-2026.jpg', (21, 9), 0.45),   # YTP2026黑客松現場（2026-10-22 提供）
    'about':      ('public/photos/10/064.jpg', (21, 9), 0.5),
}
for name, spec in BANNERS.items():
    src, (aw, ah), fy = spec[:3]; keep = spec[3] if len(spec) > 3 else 1.0
    im = Image.open(os.path.join(ROOT, src)).convert('RGB')
    if keep < 1: im = im.crop((0, 0, int(im.size[0] * keep), im.size[1]))
    W, H = im.size
    th = int(W * ah / aw)
    if th <= H:
        top = int((H - th) * fy); box = (0, top, W, top + th)
    else:
        tw = int(H * aw / ah); left = (W - tw) // 2; box = (left, 0, left + tw, H)
    im = im.crop(box)
    for w in (1800, 900):
        out = im.resize((w, int(w * ah / aw)), Image.LANCZOS)
        p = os.path.join(ROOT, 'public/banners', f'{name}-{w}.webp')
        out.save(p, 'WEBP', quality=72 if w == 1800 else 70, method=6)
        print(f'{p.split("/public/")[1]}  {out.size[0]}x{out.size[1]}  {os.path.getsize(p)//1024} KB')

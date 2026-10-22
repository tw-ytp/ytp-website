#!/usr/bin/env python3
"""首頁候選底圖 A：仿舊官網的「散落數字」背景（原創產生，不用圖庫）。
   深綠放射漸層 + 兩種尺寸的半透明數字 + 少量淡光線。輸出 public/banners/home-digits-{1800,900}.webp"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import random, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1800, 900
random.seed(7)
def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
# 放射漸層
bg = Image.new('RGB', (W, H)); px = bg.load()
c0, c1, c2 = (21, 64, 28), (10, 36, 16), (3, 11, 5)
cx, cy, R = W * .5, H * .45, W * .75
for y in range(H):
    for x in range(0, W):
        d = ((x - cx) ** 2 + (y - cy) ** 2) ** .5 / R
        px[x, y] = lerp(c0, c1, d / .55) if d < .55 else lerp(c1, c2, min(1, (d - .55) / .45))
# 數字層（分清晰與模糊兩層）
sharp = Image.new('RGBA', (W, H), (0, 0, 0, 0)); soft = Image.new('RGBA', (W, H), (0, 0, 0, 0))
ds, dso = ImageDraw.Draw(sharp), ImageDraw.Draw(soft)
F = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'; FB = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
for _ in range(560):
    big = random.random() < .18
    fs = int(26 + random.random() * 14) if big else int(13 + random.random() * 9)
    font = ImageFont.truetype(FB if big else F, fs)
    a = (.22 if big else .14) + random.random() * (.45 if big else .3)
    col = (130 + random.randrange(60), 200 + random.randrange(40), 70 + random.randrange(40))
    blur = random.random() < .35
    (dso if blur else ds).text((random.random() * W, random.random() * H), str(random.randrange(10)), font=font,
                               fill=col + (int(255 * (a * .6 if blur else a)),))
soft = soft.filter(ImageFilter.GaussianBlur(3))
lines = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dl = ImageDraw.Draw(lines)
for _ in range(14):
    y0 = random.random() * H
    dl.line([(0, y0), (W, y0 + (random.random() - .5) * 200)], fill=(120, 210, 80, int(255 * (.03 + random.random() * .05))), width=1)
out = bg.convert('RGBA')
for layer in (soft, sharp, lines): out = Image.alpha_composite(out, layer)
out = out.convert('RGB')
for w in (1800, 900):
    im = out if w == W else out.resize((w, H * w // W), Image.LANCZOS)
    p = os.path.join(ROOT, 'public/banners', f'home-digits-{w}.webp'); im.save(p, 'WEBP', quality=80, method=6)
    print(p.split('/public/')[1], im.size, os.path.getsize(p) // 1024, 'KB')

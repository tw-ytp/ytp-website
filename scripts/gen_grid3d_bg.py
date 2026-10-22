#!/usr/bin/env python3
"""常見問題 Banner 底圖「透視程式碼網格」（Claude Design 方案 5）。
   56×40 格程式符號平面，3D 透視（perspective 900px、rotateX 58°、rotateZ -28°），8% 特亮格、斜向光帶。
   輸出 public/banners/faq-{1800,900}.webp（21:9，供 Banner.astro image="faq"）。"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, random, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DW, DH = 1280, 640                       # 設計稿座標
W, H = 1800, 771; K = W / DW             # 輸出 21:9；垂直取設計稿中段
OY = (DH - H / K) / 2
TILT_X, TILT_Z, COLS, ROWS, ROW_GAP, PERSP, BRIGHT = 58, -28, 56, 40, 22, 900, 0.85
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
GLYPHS = ['0','1','{','}',';','(',')','<','>','=','+','*','/','[',']','&','|','!','#',':','2','3','4','5','6','7','8','9','if','for','int','def','dp','bfs','λ','∑','≠','→','++','=>','&&','||','O(n)','mod','q','v','u','n']
random.seed(5151)
# 底：放射漸層，亮心在右上 (70%,20%)
bg = Image.new('RGB', (W, H)); px = bg.load()
def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
c0, c1, c2 = (15, 42, 16), (6, 20, 8), (2, 6, 2)
for y in range(H):
    for x in range(W):
        d = math.hypot((x - W * .7) / W, (y - H * .2) / H) / .8
        px[x, y] = lerp(c0, c1, min(1, d / .5)) if d < .5 else lerp(c1, c2, min(1, (d - .5) / .5))
# 3D 投影：平面 2800 寬、格高 (字 ~20 + gap)，中心在設計稿 (640,320)
cell_w = 2800 / COLS; row_h = 22 + ROW_GAP
ax, az = math.radians(TILT_X), math.radians(TILT_Z)
layers = {k: Image.new('RGBA', (W, H)) for k in ('sharp', 'glow', 'hot')}; draws = {k: ImageDraw.Draw(v) for k, v in layers.items()}
fonts = {}
def font(sz):
    if sz not in fonts: fonts[sz] = ImageFont.truetype(FB, max(4, sz))
    return fonts[sz]
items = []
for r in range(ROWS):
    for c in range(COLS):
        u = (c + .5) * cell_w - 1400; v = r * row_h - ROWS * row_h / 2
        # rotateZ 再 rotateX（CSS: rotateX(a) rotateZ(b) 先套 Z）
        x1 = u * math.cos(az) - v * math.sin(az); y1 = u * math.sin(az) + v * math.cos(az)
        y2 = y1 * math.cos(ax); z2 = y1 * math.sin(ax)
        if z2 >= PERSP - 40: continue
        f = PERSP / (PERSP - z2)
        sx, sy = 640 + x1 * f, 320 + y2 * f
        items.append((f, r, c, sx, sy))
items.sort(key=lambda t: t[0])             # 遠的先畫
for f, r, c, sx, sy in items:
    hot = random.random() < 0.08
    band = math.sin((c * 0.35 + r * 0.9) * 0.6) * 0.5 + 0.5
    a = min(1, (0.18 + band * 0.45 + (0.4 if hot else 0)) * BRIGHT)
    size = (22 + random.randrange(8)) if hot else (16 + random.randrange(6))
    sz = int(size * f * K)
    if sz < 3: continue
    X, Y = sx * K, (sy - OY) * K
    if X < -80 or X > W + 80 or Y < -80 or Y > H + 80: continue
    text = random.choice(GLYPHS); fnt = font(sz); w = draws['sharp'].textlength(text, font=fnt)
    pos = (X - w / 2, Y - sz / 2)
    col = (215, 255, 170, int(255 * a)) if hot else (118, 185, 0, int(255 * a))
    draws['sharp'].text(pos, text, font=fnt, fill=col)
    if hot: draws['hot'].text(pos, text, font=fnt, fill=(140, 220, 90, 242))
    elif band > 0.7: draws['glow'].text(pos, text, font=fnt, fill=(118, 185, 0, int(255 * a * 0.6)))
out = bg.convert('RGBA')
out = Image.alpha_composite(out, layers['hot'].filter(ImageFilter.GaussianBlur(9)))
out = Image.alpha_composite(out, layers['glow'].filter(ImageFilter.GaussianBlur(4)))
out = Image.alpha_composite(out, layers['sharp']).convert('RGB')
for w in (1800, 900):
    im = out if w == W else out.resize((w, H * w // W), Image.LANCZOS)
    p = os.path.join(ROOT, 'public/banners', f'faq-{w}.webp'); im.save(p, 'WEBP', quality=80, method=6)
    print(p.split('/public/')[1], im.size, os.path.getsize(p) // 1024, 'KB')

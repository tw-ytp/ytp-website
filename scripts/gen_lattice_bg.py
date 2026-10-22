#!/usr/bin/env python3
"""首頁底圖「平面程式碼晶格・斜向光帶」（Claude Design 方案 6）。
   44×30 格的程式符號晶格、整體傾斜 -12°、沿對角線的亮帶、6% 特亮格、25% 遠景格（小、糊）。
   NVIDIA 綠 #76B900，黑綠對角漸層底。輸出 public/banners/home-lattice-{1800,900}.webp。
   旋鈕：TILT / COLS / ROW_GAP / BRIGHT（同設計稿 Tweaks）。"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, random, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1800, 900; K = W / 1280                       # 設計稿 1280 寬 → 1800
TILT, COLS, ROWS, ROW_GAP, BRIGHT = -12, 44, 30, 18, 0.85
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
GLYPHS = ['0','1','{','}',';','(',')','<','>','=','+','*','/','[',']','&','|','!','#',':','2','3','5','7','8','9','if','for','int','def','dp','bfs','λ','∑','≠','→','++','=>','&&','O(n)','mod','n','v','q']
random.seed(6161)
# 底：135° 對角漸層 #061408 → #0d2410(45%) → #061408
bg = Image.new('RGB', (W, H)); px = bg.load()
def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
c0, c1 = (6, 20, 8), (13, 36, 16)
for y in range(H):
    for x in range(W):
        t = (x / W + y / H) / 2                       # 135° 方向 0..1
        px[x, y] = lerp(c0, c1, t / .45) if t < .45 else lerp(c1, c0, (t - .45) / .55)
# 晶格：設計稿容器 1700 寬、左上 (-200,-160)，每列高 ≈ 最大字 28 + 18 gap
cell_w = 1700 / COLS; row_h = 28 + ROW_GAP
cx, cy = -200 + 850, -160 + ROWS * row_h / 2       # 旋轉中心（設計稿座標）
th = math.radians(TILT)
layers = {'sharp': Image.new('RGBA', (W, H)), 'far': Image.new('RGBA', (W, H)), 'glow': Image.new('RGBA', (W, H)), 'hotglow': Image.new('RGBA', (W, H))}
draws = {k: ImageDraw.Draw(v) for k, v in layers.items()}
fonts = {}
def font(sz):
    if sz not in fonts: fonts[sz] = ImageFont.truetype(FB, sz)
    return fonts[sz]
for r in range(ROWS):
    for c in range(COLS):
        band = max(0.0, math.sin((c * 0.9 + r * 1.3) * 0.22)) ** 2
        hot = random.random() < 0.06
        far = random.random() < 0.25
        a = (0.2 + band * 0.55 + (0.35 if hot else 0)) * BRIGHT * (0.55 if far else 1)
        size = (24 if hot else 18) + random.randrange(5) - (4 if far else 0)
        text = random.choice(GLYPHS)
        # 設計稿座標 → 旋轉 → 放大到 1800
        gx, gy = -200 + (c + .5) * cell_w, -160 + r * row_h + 14
        dx, dy = gx - cx, gy - cy
        X = (cx + dx * math.cos(th) - dy * math.sin(th)) * K
        Y = (cy + dx * math.sin(th) + dy * math.cos(th)) * K
        if X < -60 or X > W + 60 or Y < -60 or Y > H + 60: continue
        sz = int(size * K)
        col = (220, 255, 180, int(255 * min(1, a))) if hot else (118, 185, 0, int(255 * min(1, a)))
        f = font(sz); w = draws['sharp'].textlength(text, font=f)
        pos = (X - w / 2, Y - sz / 2)
        draws['far' if far else 'sharp'].text(pos, text, font=f, fill=col)
        if hot: draws['hotglow'].text(pos, text, font=f, fill=(140, 220, 90, 242))
        elif band > 0.5: draws['glow'].text(pos, text, font=f, fill=(118, 185, 0, int(255 * a * 0.6)))
out = bg.convert('RGBA')
out = Image.alpha_composite(out, layers['hotglow'].filter(ImageFilter.GaussianBlur(9)))
out = Image.alpha_composite(out, layers['glow'].filter(ImageFilter.GaussianBlur(5)))
out = Image.alpha_composite(out, layers['far'].filter(ImageFilter.GaussianBlur(1.4)))
out = Image.alpha_composite(out, layers['sharp'])
# 斜向光帶：115°，中央 10% 綠
band = Image.new('RGBA', (W, H), (0, 0, 0, 0)); bp = band.load()
for y in range(H):
    for x in range(W):
        t = (x / W * math.cos(math.radians(25)) + y / H * math.sin(math.radians(25))) / (math.cos(math.radians(25)) + math.sin(math.radians(25)))
        al = max(0.0, 1 - abs(t - .5) / .2) * 0.10
        bp[x, y] = (118, 185, 0, int(255 * al))
out = Image.alpha_composite(out, band).convert('RGB')
for w in (1800, 900):
    im = out if w == W else out.resize((w, H * w // W), Image.LANCZOS)
    p = os.path.join(ROOT, 'public/banners', f'home-lattice-{w}.webp'); im.save(p, 'WEBP', quality=82, method=6)
    print(p.split('/public/')[1], im.size, os.path.getsize(p) // 1024, 'KB')

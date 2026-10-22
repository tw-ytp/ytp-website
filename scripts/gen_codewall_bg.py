#!/usr/bin/env python3
"""首頁底圖「程式碼牆」（設計稿方案 1）：兩層真正的程式碼平鋪，前層清晰、後層模糊，整體傾斜 -4°。
   關鍵字嫩綠、數字黃、字串淡綠、符號淡化。輸出 public/banners/home-codewall-{1800,900}.webp。
   調整：FRONT_ALPHA / BACK_ALPHA / SOFT_ROWS；重跑即可。"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import random, re, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1800, 900
FRONT_ALPHA, BACK_ALPHA, SOFT_ROWS = 0.62, 0.5, 0.30
F = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'; FB = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
SRC = [
 '#include <bits/stdc++.h>', 'using namespace std;',
 'int n, m; vector<int> adj[200005]; int dist[200005];',
 'int bfs(int s, int t) {',
 '    queue<int> q; q.push(s); fill(dist, dist + n + 1, -1); dist[s] = 0;',
 '    while (!q.empty()) {', '        int u = q.front(); q.pop();',
 '        for (int v : adj[u]) if (dist[v] < 0) { dist[v] = dist[u] + 1; q.push(v); }',
 '    }', '    return dist[t];', '}',
 'def turing(tape, state="q0"):', '    head = 0', '    while state != "halt":',
 '        sym = tape[head]', '        state, tape[head], move = delta[(state, sym)]',
 '        head += 1 if move == "R" else -1', '    return "".join(tape)',
 'int main() { cin >> n >> m; for (int i = 0; i < m; i++) { int a, b; cin >> a >> b; adj[a].push_back(b); adj[b].push_back(a); }',
 '    cout << bfs(1, n) << "\\n"; return 0; }',
 'for i in range(1, 101): print("Fizz" * (i % 3 == 0) + "Buzz" * (i % 5 == 0) or i)',
 'memo = {}', 'def fib(n): return n if n < 2 else memo.setdefault(n, fib(n - 1) + fib(n - 2))',
 'template<class T> T gcd(T a, T b) { return b ? gcd(b, a % b) : a; }',
 'long long modpow(long long a, long long e, long long p) { long long r = 1; a %= p; while (e) { if (e & 1) r = r * a % p; a = a * a % p; e >>= 1; } return r; }',
 'sort(v.begin(), v.end(), [](auto& x, auto& y) { return x.second > y.second; });',
 'dp[i][j] = max(dp[i - 1][j], dp[i][j - w[i]] + val[i]);',
 'struct Edge { int to, w; }; priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> pq;',
 'while (lo < hi) { int mid = (lo + hi) / 2; if (ok(mid)) hi = mid; else lo = mid + 1; }',
 'def dfs(u, p): for v in g[u]: if v != p: depth[v] = depth[u] + 1; dfs(v, u)',
 'ans = sum(a[i] * b[n - 1 - i] for i in range(n)) % MOD',
 'const int MOD = 1e9 + 7; int fact[N], inv[N];',
]
KW = re.compile(r'^(#include|using|namespace|int|long|void|return|while|for|if|else|def|template|class|auto|vector|queue|fill|sort|import|range|print|struct|const|max|min|sum|greater|pair|priority_queue)$')
TOK = re.compile(r'\s+|"[^"]*"|[A-Za-z_#][A-Za-z0-9_]*|\d+(\.\d+)?|[^\sA-Za-z0-9_"]+')
def color(tok, a, dim):
    if tok.isspace(): return None
    if KW.match(tok): return (140, 203, 63, int(255 * a * (0.8 if dim else 1)))
    if re.match(r'^\d+(\.\d+)?$', tok): return (255, 183, 3, int(255 * a))
    if tok.startswith('"'): return (205, 235, 214, int(255 * a))
    if re.match(r'^[{}()\[\];,<>=+\-*/%&|!?:.]+$', tok): return (125, 184, 41, int(255 * a * 0.6))
    return (195, 232, 160, int(255 * a * 0.9))
def layer(lines, size, alpha_fn, bold=False):
    # 畫在放大的畫布上再旋轉裁切，避免邊角露白
    BW, BH = int(W * 1.3), int(H * 1.3)
    im = Image.new('RGBA', (BW, BH), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    font = ImageFont.truetype(FB if bold else F, size); lh = int(size * 1.5)
    y = 0
    for i, text in enumerate(lines):
        a, dim = alpha_fn(i)
        x = 0
        for m in TOK.finditer(text):
            tok = m.group(0); w = d.textlength(tok, font=font)
            c = color(tok, a, dim)
            if c: d.text((x, y), tok, font=font, fill=c)
            x += w
            if x > BW: break
        y += lh
        if y > BH: break
    im = im.rotate(4, resample=Image.BICUBIC, center=(BW * .5, BH * .5))
    ox, oy = (BW - W) // 2, (BH - H) // 2
    return im.crop((ox, oy, ox + W, oy + H))
random.seed(7)
bg = Image.new('RGB', (W, H)); px = bg.load()
def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
c0, c1, c2 = (18, 58, 26), (10, 36, 17), (4, 16, 10)
cx, cy, R = W * .5, H * .4, W * .75
for yy in range(H):
    for xx in range(W):
        dd = ((xx - cx) ** 2 + (yy - cy) ** 2) ** .5 / R
        px[xx, yy] = lerp(c0, c1, dd / .55) if dd < .55 else lerp(c1, c2, min(1, (dd - .55) / .45))
def fill_line(start, step, min_chars):
    out, k = [], start
    while sum(len(t) + 4 for t in out) < min_chars:
        out.append(SRC[k % len(SRC)].strip()); k += step
    return ' '*random.randrange(0, 24) + '    '.join(out)
front_lines = [fill_line(i, 1, 200) for i in range(46)]
back_lines = [fill_line(i * 7 + 3, 11, 260) for i in range(70)]
soft = [random.random() < SOFT_ROWS for _ in range(46)]
front_a = [FRONT_ALPHA * (0.5 if soft[i] else 0.75 + random.random() * 0.25) for i in range(46)]
back_a = [BACK_ALPHA * (0.6 + random.random() * 0.4) for _ in range(70)]
back = layer(back_lines, 17, lambda i: (back_a[i], True)).filter(ImageFilter.GaussianBlur(1.2))
front_sharp = layer([front_lines[i] if not soft[i] else '' for i in range(46)], 21, lambda i: (front_a[i], False))
front_soft = layer([front_lines[i] if soft[i] else '' for i in range(46)], 21, lambda i: (front_a[i], True)).filter(ImageFilter.GaussianBlur(2))
out = bg.convert('RGBA')
for l in (back, front_soft, front_sharp): out = Image.alpha_composite(out, l)
out = out.convert('RGB')
for w in (1800, 900):
    im = out if w == W else out.resize((w, H * w // W), Image.LANCZOS)
    p = os.path.join(ROOT, 'public/banners', f'home-codewall-{w}.webp'); im.save(p, 'WEBP', quality=80, method=6)
    print(p.split('/public/')[1], im.size, os.path.getsize(p) // 1024, 'KB')

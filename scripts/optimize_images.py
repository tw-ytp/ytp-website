#!/usr/bin/env python3
"""把站上引用到的過大圖片，產生網頁用的縮圖，並改寫引用路徑。

為什麼要分兩份：`public/legacy/` 裡的原檔是舊站關閉前搶救下來的**保存版**，
不動它；網頁只需要 1400px 寬就綽綽有餘，縮圖放在 `public/legacy/web/`。

用法：python3 scripts/optimize_images.py [--apply]
不加 --apply 只列出會做什麼。
"""
import os, re, sys, glob, io, urllib.parse
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "public", "legacy")
OUT = os.path.join(SRC, "web")
LIMIT = 400 * 1024      # 超過這個大小才處理
MAX_W = 1400
QUALITY = 82
APPLY = "--apply" in sys.argv

text_files = [f for f in glob.glob(f"{ROOT}/src/**/*", recursive=True)
              if os.path.isfile(f) and f.endswith((".md", ".json", ".astro"))]

referenced = set()
for f in text_files:
    for m in re.finditer(r"/legacy/(?!web/)([^\s\"')\]]+)", io.open(f, encoding="utf-8").read()):
        referenced.add(urllib.parse.unquote(m.group(1)))

todo = []
for name in sorted(referenced):
    p = os.path.join(SRC, name)
    if not os.path.isfile(p) or os.path.splitext(name)[1].lower() not in (".jpg", ".jpeg", ".png"):
        continue
    if os.path.getsize(p) <= LIMIT:
        continue
    todo.append((name, p, os.path.getsize(p)))

if not todo:
    print("沒有需要處理的圖片。"); sys.exit(0)

os.makedirs(OUT, exist_ok=True) if APPLY else None
mapping = {}
saved = 0
for name, p, size in todo:
    im = Image.open(p)
    alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
    if alpha and im.mode in ("RGBA", "LA") and im.getchannel("A").getextrema()[0] == 255:
        alpha = False   # 有 alpha 通道但全不透明，當成一般照片轉 JPEG
    ext = ".png" if alpha else ".jpg"
    out_name = os.path.splitext(name)[0] + ext
    out_path = os.path.join(OUT, out_name)
    if im.width > MAX_W:
        im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
    if APPLY:
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        if alpha:
            im.save(out_path, "PNG", optimize=True)
        else:
            im.convert("RGB").save(out_path, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        new = os.path.getsize(out_path)
    else:
        new = -1
    mapping[name] = out_name
    saved += size - (new if new > 0 else 0)
    print(f"  {size//1024:>5} KB → {new//1024 if new>0 else '?':>5} KB  {name}")

print(f"\n{len(todo)} 張，{'已' if APPLY else '預計'}省下約 {saved//1024//1024} MB")

if APPLY:
    changed = 0
    for f in text_files:
        t = o = io.open(f, encoding="utf-8").read()
        for old, new in mapping.items():
            for a, b in ((old, new), (urllib.parse.quote(old), urllib.parse.quote(new))):
                t = t.replace("/legacy/" + a, "/legacy/web/" + b)
        if t != o:
            io.open(f, "w", encoding="utf-8").write(t); changed += 1
    print(f"改寫 {changed} 個檔案的引用路徑")

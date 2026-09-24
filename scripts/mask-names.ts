// 同學姓名遮蔽：名冊 → 掃描 → 報告 → 套用。規則來自 src/lib/mask.ts（唯一來源）。
//
//   npm run mask -- --init-roster   從內容擷取名單，建立／補充私人名冊（不覆蓋已複核的列）
//   npm run mask -- --dry-run       只產生報告 docs/mask-report.md，不改任何檔案
//   npm run mask -- --apply         依名冊替換姓名、改寫故事網址與圖檔名（須先經 Thomas 複核）
//
// 名冊路徑：環境變數 YTP_ROSTER，預設 .private/roster.csv（.gitignore 已排除，不進任何 repo）。
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { maskName } from '../src/lib/mask.ts';

const ROOT = process.cwd();
const ROSTER = process.env.YTP_ROSTER ?? path.join(ROOT, '.private/roster.csv');
const REPORT = path.join(ROOT, 'docs/mask-report.md');
const mode = process.argv.find(a => a.startsWith('--')) ?? '--dry-run';

const TEXT_EXT = new Set(['.md', '.mdx', '.astro', '.json', '.yml', '.yaml', '.html', '.txt', '.ts', '.mjs', '.py', '.svg']);
const SCAN_DIRS = ['src', 'public', 'scripts'];
const SKIP = new Set(['scripts/mask-names.ts', 'src/lib/mask.test.ts']);
// 已徵得同意、保留全名的內容：學員故事（個人專訪、本人自撰文稿）。Thomas 2026-09-24 決定。
const CONSENTED = [/^src\/content\/stories\//];

type Row = { full_name: string; display_name: string; role: 'student' | 'staff'; certain: string; sources: string };

// ---------- 小工具 ----------
const rel = (p: string) => path.relative(ROOT, p).split(path.sep).join('/');
function walk(dir: string, out: string[] = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'dist') walk(p, out); }
    else out.push(p);
  }
  return out;
}
const frontmatter = (t: string) => (t.startsWith('---') ? t.split('---')[1] ?? '' : '');
const csvCell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
function readCsv(file: string): Row[] {
  const [head, ...lines] = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/);
  const cols = head.split(',');
  return lines.filter(Boolean).map(l => {
    const cells: string[] = []; let cur = '', q = false;
    for (let i = 0; i < l.length; i++) {
      const c = l[i];
      if (q) { if (c === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
      else if (c === '"') q = true; else if (c === ',') { cells.push(cur); cur = ''; } else cur += c;
    }
    cells.push(cur);
    return Object.fromEntries(cols.map((c, i) => [c, cells[i] ?? ''])) as Row;
  });
}
function writeCsv(file: string, rows: Row[]) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const cols: (keyof Row)[] = ['full_name', 'display_name', 'role', 'certain', 'sources'];
  fs.writeFileSync(file, [cols.join(','), ...rows.map(r => cols.map(c => csvCell(String(r[c]))).join(','))].join('\n') + '\n');
}

// ---------- 1. 從內容擷取名單 ----------
function extractPeople() {
  const people = new Map<string, { role: 'student' | 'staff'; sources: Set<string> }>();
  const add = (name: string, role: 'student' | 'staff', src: string) => {
    name = name.replace(/\s*(教授|老師)$/, '').trim();
    if (!name) return;
    const p = people.get(name) ?? { role, sources: new Set() };
    if (role === 'student') p.role = 'student';
    p.sources.add(src); people.set(name, p);
  };
  for (const f of walk(path.join(ROOT, 'src/content/projects'))) {
    const fm = frontmatter(fs.readFileSync(f, 'utf8'));
    for (const m of fm.matchAll(/name:\s*['"]?([^'"\n,}]+)/g)) add(m[1], 'student', 'projects.members');
    for (const m of fm.matchAll(/overseasReps:\s*\[(.*?)\]/g)) for (const n of m[1].split(',')) add(n.replace(/['"]/g, ''), 'student', 'projects.overseasReps');
    const adv = fm.match(/^advisor:\s*(.+)$/m); if (adv) add(adv[1], 'staff', 'projects.advisor');
  }
  for (const f of walk(path.join(ROOT, 'src/content/stories'))) {
    const a = frontmatter(fs.readFileSync(f, 'utf8')).match(/^author:\s*(.+)$/m);
    if (a) add(a[1], 'student', 'stories.author');
  }
  return people;
}

function initRoster() {
  const existing = fs.existsSync(ROSTER) ? readCsv(ROSTER) : [];
  const known = new Set(existing.map(r => r.full_name));
  const added: Row[] = [];
  for (const [name, p] of extractPeople()) {
    if (known.has(name)) continue;
    const r = p.role === 'student' ? maskName(name) : { masked: name, certain: true };
    added.push({ full_name: name, display_name: r.masked, role: p.role, certain: r.certain ? 'yes' : `NO：${(r as any).reason ?? ''}`, sources: [...p.sources].join(' ') });
  }
  writeCsv(ROSTER, [...existing, ...added]);
  console.log(`名冊：${ROSTER}\n  既有 ${existing.length} 列，新增 ${added.length} 列（學生 ${added.filter(r => r.role === 'student').length}、工作人員 ${added.filter(r => r.role === 'staff').length}）`);
}

// ---------- 2. 掃描 ----------
function loadStudents() {
  if (!fs.existsSync(ROSTER)) { console.error(`找不到名冊 ${ROSTER}，請先執行 --init-roster`); process.exit(1); }
  return readCsv(ROSTER).filter(r => r.role === 'student' && r.full_name !== r.display_name)
    .sort((a, b) => [...b.full_name].length - [...a.full_name].length);   // 長名優先，避免子字串先被換掉
}

type Hit = { file: string; line: number; name: string; before: string; after: string };
function scanText(students: Row[]) {
  const hits: Hit[] = []; const changed = new Map<string, string>();
  for (const dir of SCAN_DIRS) for (const f of walk(path.join(ROOT, dir))) {
    const r = rel(f);
    if (SKIP.has(r) || CONSENTED.some(c => c.test(r)) || !TEXT_EXT.has(path.extname(f)) && path.basename(f) !== '_redirects') continue;
    const orig = fs.readFileSync(f, 'utf8'); let t = orig;
    const lines = orig.split('\n');
    for (const s of students) {
      if (!t.includes(s.full_name)) continue;
      lines.forEach((ln, i) => {
        let idx = ln.indexOf(s.full_name);
        while (idx >= 0) {
          const ctx = ln.slice(Math.max(0, idx - 14), idx + s.full_name.length + 14).replace(/\|/g, '｜');
          hits.push({ file: r, line: i + 1, name: s.full_name, before: ctx, after: ctx.split(s.full_name).join(s.display_name) });
          idx = ln.indexOf(s.full_name, idx + 1);
        }
      });
      t = t.split(s.full_name).join(s.display_name);
    }
    if (t !== orig) changed.set(f, t);
  }
  return { hits, changed };
}

// 故事網址：拼音姓名 → YYYY-NN
function storySlugPlan() {
  const dir = path.join(ROOT, 'src/content/stories');
  const items = walk(dir).filter(f => f.endsWith('.md')).map(f => {
    const fm = frontmatter(fs.readFileSync(f, 'utf8'));
    return { file: f, slug: path.basename(f, '.md'), date: fm.match(/^date:\s*(\S+)/m)?.[1] ?? '' };
  }).sort((a, b) => a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug));
  const count: Record<string, number> = {};
  return items.map(it => {
    const y = it.slug.slice(0, 4); count[y] = (count[y] ?? 0) + 1;
    return { ...it, next: `${y}-${String(count[y]).padStart(2, '0')}` };
  }).filter(it => it.slug !== it.next);
}

// 檔名含姓名的圖片
function imagePlan(students: Row[], slugMap: Map<string, string>) {
  const names = readCsv(ROSTER).filter(r => r.role === 'student').map(r => r.full_name);
  const files = walk(path.join(ROOT, 'public')).filter(f => names.some(n => path.basename(f).includes(n)));
  const texts = [...walk(path.join(ROOT, 'src/content')), ...walk(path.join(ROOT, 'src/pages'))];
  const perStory: Record<string, number> = {};
  return files.map(f => {
    const base = path.basename(f); const url = '/' + rel(f).replace(/^public\//, '');
    const enc = '/' + rel(f).replace(/^public\//, '').split('/').map(encodeURIComponent).join('/');
    const refs = texts.filter(t => { const s = fs.readFileSync(t, 'utf8'); return s.includes(url) || s.includes(enc); }).map(rel);
    const story = refs.find(r => r.startsWith('src/content/stories/'));
    const ext = path.extname(base.replace(/\.\d+$/, '')) || '.jpg';
    let next = '';
    if (story) {
      const slug = slugMap.get(path.basename(story, '.md')) ?? path.basename(story, '.md');
      perStory[slug] = (perStory[slug] ?? 0) + 1;
      next = `${path.dirname(url)}/story-${slug}-${perStory[slug]}${ext}`;
    }
    return { file: f, url, enc, refs, next, orphan: refs.length === 0 };
  });
}

function pdfScan(names: string[]) {
  const out: { file: string; hits: string[] }[] = [];
  let ok = true;
  for (const f of walk(path.join(ROOT, 'public')).filter(f => f.toLowerCase().endsWith('.pdf'))) {
    let txt = '';
    try { txt = execFileSync('pdftotext', [f, '-'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); }
    catch { ok = false; continue; }
    const hits = names.filter(n => txt.includes(n));
    if (hits.length) out.push({ file: rel(f), hits });
  }
  return { out, ok };
}

function personalLinks() {
  const out: { file: string; url: string }[] = [];
  for (const f of walk(path.join(ROOT, 'src/content/projects'))) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/https?:\/\/(?:github\.com|gitlab\.com|[\w-]+\.github\.io|(?:www\.)?linkedin\.com)\/[^\s'")\]]+/g))
      if (!m[0].includes('github.com/26ytph')) out.push({ file: rel(f), url: m[0] });
  }
  return out;
}

function mediaForEyeball() {
  const out: { file: string; img: string }[] = [];
  for (const dir of ['stories', 'news', 'turing-plus', 'stage-hackathons']) for (const f of walk(path.join(ROOT, 'src/content', dir))) {
    const t = fs.readFileSync(f, 'utf8');
    for (const m of t.matchAll(/!\[[^\]]*\]\(([^)]+)\)|^(?:banner|poster):\s*["']?([^"'\n]+)/gm)) {
      const u = m[1] ?? m[2]; if (u && /\.(jpe?g|png|webp|gif)$/i.test(u)) out.push({ file: rel(f), img: decodeURIComponent(u) });
    }
  }
  return out;
}

// ---------- 3. 報告 ----------
function report() {
  const students = loadStudents();
  const all = readCsv(ROSTER);
  const { hits, changed } = scanText(students);
  const slugs = storySlugPlan();
  const slugMap = new Map(slugs.map(s => [s.slug, s.next]));
  const imgs = imagePlan(students, slugMap);
  const pdf = pdfScan(all.filter(r => r.role === 'student').map(r => r.full_name));
  const links = personalLinks();
  const media = mediaForEyeball();
  const unsure = all.filter(r => r.role === 'student' && r.certain !== 'yes');
  const byFile = new Map<string, Hit[]>(); hits.forEach(h => byFile.set(h.file, [...(byFile.get(h.file) ?? []), h]));

  const L: string[] = [];
  L.push('# 同學姓名遮蔽報告（dry-run）', '',
    '> 內部文件，含全名，**不得進入 public repo**。由 `npm run mask -- --dry-run` 產生，請勿手改；改名冊後重跑即可。',
    `> 產生時間：${new Date().toISOString().slice(0, 16).replace('T', ' ')}　名冊：\`${path.relative(ROOT, ROSTER)}\``, '',
    '## 摘要', '',
    '| 項目 | 數量 | 套用方式 |', '|---|---|---|',
    `| 名冊：學生 | ${all.filter(r => r.role === 'student').length} | 遮蔽 |`,
    `| 名冊：工作人員（保留全名） | ${all.filter(r => r.role === 'staff').length} | 不動 |`,
    `| 名冊：規則無法確定、需人工決定 | **${unsure.length}** | 請在名冊改 display_name 後把 certain 改為 yes |`,
    `| 文字中的姓名出現次數 | ${hits.length}（${changed.size} 個檔案） | \`--apply\` 自動替換 |`,
    `| 含拼音姓名的故事網址 | ${slugs.length} | \`--apply\` 自動改為 YYYY-NN，並更新轉址與站內連結 |`,
    `| 檔名含姓名的圖片 | ${imgs.length}（其中未被引用 ${imgs.filter(i => i.orphan).length}） | \`--apply\` 改名；未引用者刪除 |`,
    `| 內文含姓名的 PDF | ${pdf.out.length}${pdf.ok ? '' : '（部分 PDF 無法讀取）'} | **人工** |`,
    `| 個人帳號連結（GitHub 等） | ${links.length} | 保留（Thomas 2026-09-24 決定：存取權由原作者在 GitHub 端控制） |`,
    `| 含人物或名單的圖片（需目視） | ${media.length} | **人工** |`, '');

  L.push('## A. 名冊複核', '', '學生全名 → 顯示名稱。規則確定者只列統計；以下只列**需要你決定**的名字，以及全部 2 字名（遮姓後只剩一字，請確認可接受）。', '');
  L.push('| 全名 | 建議顯示 | 原因 | 出處 |', '|---|---|---|---|');
  for (const r of unsure) L.push(`| ${r.full_name} | ${r.display_name} | ${r.certain.replace(/^NO：/, '')} | ${r.sources} |`);
  for (const r of all.filter(r => r.role === 'student' && r.certain === 'yes' && [...r.full_name].length === 2)) L.push(`| ${r.full_name} | ${r.display_name} | 2 字名 | ${r.sources} |`);
  L.push('', `工作人員（保留全名）：${all.filter(r => r.role === 'staff').map(r => r.full_name).join('、')}`, '');

  L.push('## B. 文字替換明細', '', '依檔案列出。`--apply` 會全部替換。', '');
  for (const [file, hs] of [...byFile].sort()) {
    L.push(`<details><summary><code>${file}</code>（${hs.length}）</summary>`, '', '| 行 | 原文 | 替換後 |', '|---|---|---|');
    hs.forEach(h => L.push(`| ${h.line} | ${h.before} | ${h.after} |`));
    L.push('', '</details>', '');
  }

  L.push('## C. 人工複核', '');
  L.push('### C1. 故事網址（`--apply` 自動處理）', '', '| 現在 | 改為 |', '|---|---|');
  slugs.forEach(s => L.push(`| /stories/${s.slug}/ | /stories/${s.next}/ |`));
  L.push('', '舊站網址（`/overseas_wangyanren/`、`/youngturing-*/` 等）保留為轉址來源，目標改指新網址；新網址本身未上線，不需再加轉址。', '');
  L.push('### C2. 檔名含姓名的圖片（`--apply` 自動處理）', '', '| 檔案 | 處理 |', '|---|---|');
  imgs.forEach(i => L.push(`| ${rel(i.file)} | ${i.orphan ? '未被任何頁面引用 → 刪除' : `改名為 ${i.next}`} |`));
  L.push('', '### C3. 圖片 alt 文字', '', '已包含在 B 的文字替換中（例如圖說「某某某（左一）」）。', '');
  L.push('### C4. 需目視檢查的圖片', '', '圖片裡的名牌、證書、晉級名單、合照標註無法用程式遮蔽。請逐張看過，決定「保留／裁切或打馬賽克／下架」。晉級名單圖片（news）幾乎確定含全名，建議直接下架或改成遮蔽後的文字表格。', '', '| 頁面 | 圖片 |', '|---|---|');
  media.forEach(m => L.push(`| ${m.file} | ${m.img} |`));
  L.push('', '### C5. PDF', '');
  if (pdf.out.length) { L.push('| 檔案 | 內文出現的學生姓名 |', '|---|---|'); pdf.out.forEach(p => L.push(`| ${p.file} | ${p.hits.join('、')} |`)); }
  else L.push('文字層未找到學生姓名。掃描版 PDF（純圖片）無法偵測，請抽查。');
  L.push('', '另請檢查 PDF 的「作者」中繼資料。', '');
  L.push('### C6. 個人帳號連結（保留）', '', 'Thomas 2026-09-24 決定全部保留：連結指向原作者自己的 GitHub 與作品，存取權由原作者控制。外部簡報連結（Google Drive／Docs、Canva）同理照現況保留。僅列出備查，`--apply` 不處理。', '',
    '| 專題 | 連結 |', '|---|---|');
  links.forEach(l => L.push(`| ${l.file.replace('src/content/projects/', '')} | ${l.url} |`));
  L.push('', '### C7. 頁面標題、`<meta>`、Open Graph', '', '由內容自動產生（故事標題、專題描述中的隊員名），B 的替換完成後即一併遮蔽；`--apply` 後會以建置結果再驗證一次。', '');
  L.push('### C8. 不進 public repo 的檔案', '', '學員故事（`src/content/stories/`，個人專訪與本人自撰文稿）已徵得同意刊登，保留全名，不列入掃描。`docs/`、`HANDOFF.md`、`TODO-REPORT.md`、`PLAN-v1.md` 含全名但屬內部文件，依 PLAN §5.2 排除，不遮蔽。`scripts/gen_projects*.py` 內嵌原始名單，已列入 B 一併遮蔽。', '');
  fs.writeFileSync(REPORT, L.join('\n'));
  console.log(`報告：${rel(REPORT)}\n  文字 ${hits.length} 處／${changed.size} 檔；網址 ${slugs.length}；圖檔 ${imgs.length}；PDF ${pdf.out.length}；個人連結 ${links.length}；需目視圖片 ${media.length}；名冊待決定 ${unsure.length}`);
  return { students, changed, slugs, imgs };
}

// ---------- 4. 套用 ----------
function apply() {
  const unsure = readCsv(ROSTER).filter(r => r.role === 'student' && r.certain !== 'yes');
  if (unsure.length) { console.error(`名冊仍有 ${unsure.length} 列 certain ≠ yes，請先複核：${unsure.map(r => r.full_name).join('、')}`); process.exit(1); }
  const { changed, slugs, imgs } = report();
  for (const [f, t] of changed) fs.writeFileSync(f, t);
  // 圖片改名／刪除，並更新引用
  const texts = () => [...walk(path.join(ROOT, 'src')), path.join(ROOT, 'public/_redirects')].filter(f => TEXT_EXT.has(path.extname(f)) || f.endsWith('_redirects'));
  for (const i of imgs) {
    if (i.orphan) { fs.rmSync(i.file); continue; }
    const target = path.join(ROOT, 'public', i.next);
    fs.renameSync(i.file, target);
    for (const f of texts()) { const s = fs.readFileSync(f, 'utf8'); const n = s.split(i.url).join(i.next).split(i.enc).join(i.next); if (n !== s) fs.writeFileSync(f, n); }
  }
  // 故事網址
  for (const s of slugs) {
    fs.renameSync(s.file, path.join(path.dirname(s.file), `${s.next}.md`));
    for (const f of texts()) { const t = fs.readFileSync(f, 'utf8'); const n = t.split(`/stories/${s.slug}/`).join(`/stories/${s.next}/`); if (n !== t) fs.writeFileSync(f, n); }
  }
  console.log('已套用。請執行 npm run mask -- --dry-run 確認文字命中為 0，並 npm run build。');
}

if (mode === '--init-roster') initRoster();
else if (mode === '--apply') apply();
else report();

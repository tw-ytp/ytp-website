// 以全名清單掃描 git 追蹤中的檔案。清單來自環境變數 ROSTER_NAMES（每行一個全名），不寫在 repo 裡。
// 輸出只顯示遮蔽後的名字，避免全名出現在 CI 紀錄。
//   本機：ROSTER_NAMES="$(cut -d, -f1 .private/roster.csv | tail -n +2)" node scripts/name-guard.mjs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

// 內部文件不會進 public repo，私有 repo 裡掃到也不算（與 PLAN §5.2 一致）
const INTERNAL = [/^docs\//, /^PLAN-v1\.md$/, /^HANDOFF\.md$/, /^TODO-REPORT\.md$/, /^\.private\//];
// 已徵得同意、保留全名：學員故事（個人專訪、本人自撰文稿）。檔名仍須中性，不得含姓名。
const CONSENTED = [/^src\/content\/stories\//];
const names = (process.env.ROSTER_NAMES ?? '').split(/\r?\n/).map(s => s.trim()).filter(s => s.length >= 2);
if (!names.length) { console.log('::warning::ROSTER_NAMES 未設定，略過姓名掃描。public repo 必須設定此 Secret。'); process.exit(0); }

const hide = n => [...n].map((c, i, a) => (a.length === 2 ? (i === 0 ? 'O' : c) : i === 1 ? 'O' : c)).join('');
// 兩種模式：預設掃 git 追蹤的檔案（CI）；--dir <資料夾> 掃整個資料夾（publish.sh 對匯出結果）
const dirIdx = process.argv.indexOf('--dir');
const baseDir = dirIdx > 0 ? process.argv[dirIdx + 1] : '.';
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.name === '.git' || e.name === 'node_modules' ? [] : e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]);
// -z 與 core.quotepath=false：保留中文檔名原樣，否則含中文的路徑會被跳過
const files = (dirIdx > 0
  ? walk(baseDir).map(f => f.slice(baseDir.length + 1))
  : execFileSync('git', ['-c', 'core.quotepath=false', 'ls-files', '-z'], { encoding: 'utf8' }).split('\0')
).filter(f => f && !INTERNAL.some(r => r.test(f)));
let found = 0;
for (const f of files) {
  if (names.some(n => f.includes(n))) { console.log(`::error file=${f}::檔名含同學全名`); found++; }
  if (CONSENTED.some(r => r.test(f))) continue;
  let t; try { t = fs.readFileSync(`${baseDir}/${f}`, 'utf8'); } catch { continue; }
  if (t.includes('\u0000')) continue;                  // 二進位檔
  t.split('\n').forEach((line, i) => {
    for (const n of names) if (line.includes(n)) { console.log(`::error file=${f},line=${i + 1}::未遮蔽的同學姓名（${hide(n)}）`); found++; }
  });
}
console.log(found ? `發現 ${found} 處未遮蔽姓名` : `通過：${files.length} 個檔案、${names.length} 個名字`);
process.exit(found ? 1 : 0);

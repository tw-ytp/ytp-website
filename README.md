# YTP 少年圖靈計畫 官網

[YTP 少年圖靈計畫](https://www.tw-ytp.org)（Young Turing Program）的官方網站原始碼。YTP 由精誠集團自 2016 年起舉辦，為國中、高中職五專學生設計年度三階段計畫（程式挑戰營、第二階段、海外參訪），並為校友舉辦「青年圖靈++」年度活動。

## 技術

- [Astro](https://astro.build) 靜態網站，內容全部是 Markdown（`src/content/`）
- 顏色、字體來自 `src/styles/tokens.css`（由 YTP 設計系統匯出）
- 部署在 Cloudflare Pages；舊網址轉址見 `public/_redirects`

## 本機開發

需要 Node.js 22 以上。

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # 輸出到 dist/
npm run test:mask    # 同學姓名遮蔽規則的單元測試
```

### 內容後台（Pages CMS）與上稿／下稿

不碰 git 的同仁用 [app.pagescms.org](https://app.pagescms.org) 維護內容；後台設定在 `.pages.yml`，欄位與 `src/content.config.ts` 對應，改 schema 要同步改。

- **第一次設定（管理員，需 GitHub 帳號且對本 repo 有寫入權）**：到 app.pagescms.org 用 GitHub 登入 → 安裝 Pages CMS 的 GitHub App 到 `tw-ytp` 組織並勾選 `ytp-website` → 開啟 repo，後台會讀 `.pages.yml`。
- **加同仁**：後台 Settings → Collaborators，輸入 email 邀請；對方用 email 登入，不需要 GitHub 帳號，權限只限這個 repo 的內容與媒體，不能改 `.pages.yml` 或邀請他人。人員異動在同一處移除。
- **上稿／下稿**：每筆內容有「草稿」開關（`draft`）。勾選 = 不上稿，正式站完全不建置這一筆（沒有網址、不進列表、不進搜尋）；取消 = 上稿。
- **內容狀態**（`status`）：`revised` = 正常、`todo` = 內容待補（頁面顯示黃色提示，但仍會上線）。與上下稿無關；要不上線一律用草稿。2026-10-28 已把搬遷時的 `migrated` 整批改為 `revised`。
- **預覽草稿**：固定預覽網址 `https://staging.ytp-website.pages.dev`（`.github/workflows/sync-preview.yml` 在每次 main 更新時把 main 同步到 `staging` 分支；Cloudflare Pages 的 **Preview** 環境變數須設 `PUBLIC_SHOW_DRAFTS=true`）。這個網址 = 正式內容 + 所有草稿，草稿頁面有「草稿」橫幅。後台不會渲染網站，看版面一律用這裡；`npm run dev` 也會顯示草稿。
- **同仁上稿流程**：後台新增內容、勾「草稿」、存檔 → 等 1–2 分鐘開預覽網址確認 → 回後台取消「草稿」、存檔 → 正式站約 1–2 分鐘後更新。
- **存檔即部署**：後台存檔 = commit 到 GitHub → Cloudflare Pages 自動建置；建置失敗（例如姓名未遮蔽、欄位格式錯）不會上線，正式站維持上一版。

### 後台能改哪些東西

| 後台區塊 | 檔案 | 說明 |
|---|---|---|
| 最新消息、學員故事、常見問題、歷屆成果、備賽資源 | `src/content/{news,stories,faq,projects,hub}/` | 一筆一檔 Markdown；學員故事有選填「封面照」（`cover`） |
| 網站頁面（關於、計畫介紹、報名、規則、下載、備賽資源、青年圖靈++、English） | `src/content/pages/*.md` | 只改文字；頁面不可新增刪除，版面在 `src/pages/` 對應模板，模板只保留動態區塊並 `render()` 正文 |
| 歷年考古題 | `src/content/exams/` | 一題一檔，只有欄位；PDF 放 `public/downloads/exams/` |
| 當屆賽季狀態、影響力數字、站台基本資料 | `src/data/{season,stats,site}.json` | 表單式 |
| 進階：第二階段黑客松、青年圖靈++、歷屆三階段時程 | `src/content/{stage-hackathons,turing-plus,cohorts}/` | 不可新增刪除，新場次由管理員用 git 建檔 |
| 媒體：活動照片、下載檔案、頁首橫幅 | `public/photos/`、`public/downloads/`、`public/banners/` | 見下節 |

**佔位字串**：正文與副標可寫 `{{season.edition}}`、`{{season.year}}`、`{{season.nextYear}}`、`{{season.registration.close}}`、`{{site.email}}`、`{{site.social.discord}}`、`{{site.oj.url}}` 等，建置時換成資料檔的值（frontmatter 由 `src/lib/placeholders.ts`、正文由 `src/lib/remark-placeholders.mjs` 處理）。換屆只改 `season.json`，不必逐頁改文字。找不到的佔位字串會原樣保留並在建置時印警告。

### 圖片與檔案

- `npm run build` 會先跑 `scripts/images.mjs`（sharp）：
  - `public/photos/<屆次數字>/` 是各屆程式挑戰營相簿，自動產生 `<名稱>-t.jpg` 縮圖與 `src/data/gallery.json`，屆次頁與首頁花絮直接讀。同仁只要在後台「活動照片」建資料夾（如 `12`）上傳照片即可；縮圖與 gallery.json 都進 git，建置只補新照片。`npm run images -- --force` 全部重做。
  - `public/photos/**` 任何原圖寬或高超過 1600px 會就地縮小。
- `public/photos/posts/`：文章內文用圖與學員故事封面（後台編輯器插圖預設放這裡）。`public/photos/hackathon/`：黑客松主視覺、活動 logo、單位 logo（後台以選圖欄位選取）。
- `public/downloads/`：簡章、考古題等 PDF；後台「歷年考古題」與「當屆賽季狀態」的檔案欄位從這裡選。2026-10-28 已把考古題與第 11 屆簡章／FAQ 從 `public/legacy/` 搬來（舊網址在 `_redirects` 轉址）；其餘舊站檔案仍在 `public/legacy/`。
- 後台要換圖或換檔：先按欄位上的 ×（刪除），欄位會變回「選擇／上傳」按鈕，再選新檔。
- 影片不上傳，用 YouTube 連結。

### 操作手冊（不對外）

- 正本 `docs/manual.md`，截圖 `docs/manual/`；**不在 `public/`，網站不會顯示**。後台側欄最下方「操作手冊」就是這個檔，可直接改。
- 匯出 PDF（邀請同仁時隨信附上）：`node scripts/manual-pdf.mjs` → `docs/manual.pdf`（需 `npx playwright install chromium` 一次）。手冊改完記得重新匯出並 commit。

### 全站搜尋（Pagefind）

- 索引在 `npm run build` 結束時由 `astro-pagefind` 產生到 `dist/pagefind/`，搜尋在瀏覽器端執行，沒有後端。
- `npm run dev` 不會重建索引：先 `npm run build` 一次，dev server 會讀 `dist/pagefind/` 的上次索引（內容改了要再 build 才會反映）。
- 只索引 `<main data-pagefind-body>`（`src/layouts/Base.astro`）；導覽、頁尾、篩選列、相關專題清單已用 `data-pagefind-ignore` 排除。
- 搜尋面板：`src/components/SearchDialog.astro`（Ctrl+K／⌘K／`/` 開啟，`?q=` 可預填）。
- 專題技術標籤由 `src/lib/tags.ts` 正規化（別名 → 23 個正規標籤），`/projects/` 篩選列與搜尋篩選器共用。
```
```

建置時可用的環境變數：

| 變數 | 用途 |
|---|---|
| `PUBLIC_SHOW_TODO=false` | 不輸出內部待補提示（正式與預覽部署都要設） |
| `PUBLIC_NOINDEX=true` | 預覽網址：加上 noindex、robots.txt 禁止索引 |

## 內容在哪裡

| 想改的東西 | 檔案 |
|---|---|
| 目前是第幾屆、首頁狀態 | `src/data/season.json` |
| 各屆三階段日期（首頁年度時程） | `src/content/cohorts/{屆}.md` |
| 青年圖靈++ 活動 | `src/content/turing-plus/{年}.md` |
| 第 11 屆起的第二階段黑客松 | `src/content/stage-hackathons/{屆}.md` |
| 專題與黑客松作品 | `src/content/projects/` |
| 學員故事、最新消息、常見問題 | `src/content/stories/`、`news/`、`faq/` |
| 關於、計畫介紹、報名、規則、下載、備賽資源、青年圖靈++、English 的文字 | `src/content/pages/` |
| 歷年考古題 | `src/content/exams/`（一題一檔，PDF 在 `public/downloads/exams/`） |
| 各屆挑戰營相簿 | `public/photos/{屆}/`（縮圖與 `gallery.json` 由建置自動產生） |

欄位規則在 `src/content.config.ts`，填錯會建置失敗並指出是哪個檔案。更多說明見 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 授權

- 程式碼：MIT License（見 [LICENSE](LICENSE)）
- 文字內容（`src/content/`）：[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.zh-hant)
- 照片、活動主視覺、標誌與 YTP 名稱：保留所有權利，未經同意不得使用

聯絡：ytp@tw-ytp.org

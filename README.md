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
- **上稿／下稿**：每筆內容有「草稿」開關（`draft`）。勾選 = 不上稿，正式站完全不建置這一筆（沒有網址、不進列表、不進搜尋）；取消 = 上稿。`status`（migrated／excerpt／todo／revised）只是舊站搬遷註記，不影響上下稿。
- **預覽草稿**：Cloudflare Pages 的 Preview 環境變數設 `PUBLIC_SHOW_DRAFTS=true`，非 main 分支的建置就會帶草稿（頁面有「草稿」橫幅）；`npm run dev` 也會顯示草稿。
- **存檔即部署**：後台存檔 = commit 到 GitHub → Cloudflare Pages 自動建置；建置失敗（例如姓名未遮蔽、欄位格式錯）不會上線，正式站維持上一版。

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

欄位規則在 `src/content.config.ts`，填錯會建置失敗並指出是哪個檔案。更多說明見 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 授權

- 程式碼：MIT License（見 [LICENSE](LICENSE)）
- 文字內容（`src/content/`）：[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.zh-hant)
- 照片、活動主視覺、標誌與 YTP 名稱：保留所有權利，未經同意不得使用

聯絡：ytp@tw-ytp.org

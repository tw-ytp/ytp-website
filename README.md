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

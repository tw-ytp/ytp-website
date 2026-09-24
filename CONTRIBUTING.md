# 內容更新說明

這個 repo 是 YTP 官網的公開版本，內容由 YTP 執行小組維護。發現錯字或連結失效，歡迎開 issue 或 pull request。

## 同學姓名

- 專題隊員（`members[].name`）、海外參訪代表（`overseasReps`）一律填**遮蔽後**的名字：2 字遮姓（O徹）、3 字遮中間（王O仁）、複姓保留（歐陽O凱）、英文名留名與姓首字母（Kevin W.）。規則在 `src/lib/mask.ts`。
- 填成全名時 `npm run build` 會失敗；GitHub Actions 的 `name-guard` 也會擋下。
- 學員故事（`src/content/stories/`）是本人專訪或自撰文稿，已徵得同意刊登，保留全名；新增故事前請先取得本人同意。故事網址與圖檔名用中性編號（`/stories/2025-01/`、`story-2025-01-1.jpg`），不要放姓名。
- 講師、評審、工作人員保留全名。
- 不要放檔名含姓名的圖片，或印有全名的名單圖片（請改成文字清單）。

## 日期與年度時程

- 首頁年度時程從每屆 3 月畫到隔年 8 月，資料來自 `src/content/cohorts/{屆}.md`：Phase I 的「報名」（start＝開始、end＝截止）、「線上初賽」、「程式挑戰營」；Phase II 的競賽日；Phase III 的「海外參訪選拔」「海外參訪出訪」。只知月份時填 `YYYY-MM`。
- 青年圖靈++ 每場填 `regStart`（報名開始）與 `start`／`end`（競賽日）；未定就留空。
- 換屆：修改 `src/data/season.json` 的 `edition` 與 `year`。

## 文字

- 章節標題用名詞，標出時間與範圍（「2016–2026 成果」），不用問句。
- meta 之間用「｜」分隔；日期寫成 2026/12/12（六）。
- 不寫死色碼，顏色一律用 `src/styles/tokens.css` 的變數。

---
title: Bloxorz 益智遊戲 AI 輔助教學系統
edition: 8
year: 2023
rank: 0
tags:
- AI
- 遊戲
- 教育
members:
- name: 王O翔
  school: 延平中學
- name: 黃O睿
  school: 延平中學
- name: 楊O鏘
  school: 延平中學
overseasReps: []
github: https://github.com/rey0818/bloxorz
demo: https://www.youtube.com/watch?v=OkWJNB8Ffes
poster: https://drive.google.com/file/d/1eEA2G9j_5gNlBe-jEBVz7D2oGOtjSvwY/view
status: migrated
source_url: Google Drive：YTP 8th 專題實作成果發表會-各組成員及摘要.pptx
team: FURIOUS F
advisor: 何信瑩 教授
---

該專題以益智遊戲 Bloxorz 為題，指出玩家卡關時只能查詢他人解法，無法即時得知當下該如何移動。團隊引用論文說明地圖含按鈕機關時狀態組合過多，BFS 難以即時求解，改以預先訓練的神經網路提供指引。做法是用 C++ 生成超過 330,000 張 10 x 10 隨機地圖，以 BFS 計算各格與終點距離作為標籤，並用 PyTorch 建立 CNN（兩層卷積加三層全連接），輸入地圖、機關狀態與玩家、終點位置，輸出四個方向的機率，優化器為 Adam、學習率 0.0001，訓練逾 4 小時。測試資料中找到最佳路徑的比率無按鈕為 97%、有按鈕為 95%，找到可行路徑皆為 100%。介面以 TypeScript 與 Three.js 製作 3D 網頁版遊戲，並以 ONNX 在瀏覽器執行模型。

---
title: Anti-Aimbot 遊戲外掛與反外掛工具
edition: 8
year: 2023
rank: 3
tags:
- 資安
- 遊戲
members:
- name: 蔡O豐
  school: 臺中一中
- name: 林O睿
  school: 臺中一中
- name: 陳O邑
  school: 臺中一中
overseasReps: []
github: https://github.com/GrandTiger1729/Aimbot
demo: ''
poster: https://drive.google.com/file/d/1qzXiAOquRZ1Lej2poG5NAwwOeYEW3yAH/view
status: migrated
source_url: Google Drive：YTP 8th 專題實作成果發表會-各組成員及摘要.pptx
team: 台中彭于晏金城武郭富城
advisor: 鄭瑞光 教授
---

團隊因遊玩槍戰遊戲時受自瞄外掛影響，而人工檢視影片判斷是否作弊又相當耗時，嘗試以滑鼠軌跡自動推論作弊行為。實作上先在 Aimlabs 平臺蒐集資料，以 Cascade Trainer GUI 訓練偵測藍色球目標的模型，再用 pywin32、AutoIt、mss 模擬滑鼠直線移動製作自動射擊外掛，並以 OpenCV 與 NumPy 將錄影逐幀轉為物件座標。接著把準心與目標的距離依序記錄成序列，輸入以 PyTorch 建立的 LSTM 分類器（LSTM 接全連接層與 sigmoid），資料按 80% 訓練、20% 測試切分。在 GridShot Single 測試中，區分直線自瞄與人類的準確率達 99.66%，輔助瞄準為 81.77%。限制包括螢幕錄影僅 30 fps 無法即時偵測、解析度僅 1600 x 900、輔助瞄準較難辨識，且人類數據取樣有限；未來擬嘗試更多路徑、改以 GAN 訓練並應用於實際射擊遊戲。

---
title: PUZcopan 拼圖小幫手
edition: 6
year: 2021
rank: 0
tags:
- 演算法
members:
- name: 侯O緯
  school: 師大附中
- name: 鄭O臻
  school: 北一女中
- name: 林O瑄
  school: 師大附中
overseasReps: []
github: ''
demo: ''
poster: https://drive.google.com/file/d/13wtdLCDW-9lNNWU-Ph9X5foAnsnI-X2s/view
status: migrated
source_url: Google Drive：第六屆 YTP 專題實作簡報資料夾
team: DropPhoneMaster
---

起心動念來自選訓課程裡拼不完的拼圖。現有的 Puzzle Solver（Zolver、Jigsaw-Net）要求所有拼圖同框入鏡、片數上限約 50 片、正確率也不穩，難以應付千片拼圖。這組把定位從 solver 改為 guider：使用者每次只拍少量拼圖分批輸入，系統推薦下一片該接哪塊，判斷錯就給次佳解，藉此移除「必須完全正確」的包袱。做法上以 OpenCV 轉灰階、二值化後取輪廓，再從凸包上依夾角與間距篩出四個角，順時針切出四條邊；配對時縮放對齊端點，沿邊等分取樣計算點距離與鄰域顏色中位數的歐氏距離，加權為「不匹配度」，超過門檻即視為不可能相接。實測 1,000 片（32MB）預處理約 9 分 28 秒，之後每推薦一片約 1 秒；圖片品質良好時推薦正確率接近 100%。延伸應用想像包括碎紙文件復原與協助考古學家拼接古文物碎塊。


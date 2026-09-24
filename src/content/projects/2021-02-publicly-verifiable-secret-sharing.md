---
title: Publicly Verifiable Secret Sharing：安全且可驗證的分散式資料儲存服務 — 學習歷程檔案
edition: 6
year: 2021
rank: 2
tags:
- 密碼學
- 分散式系統
- PVSS
members:
- name: 王O翔
  school: 成功高中
- name: 許O翔
  school: 臺中一中
- name: 黃O禕
  school: 中山女中
overseasReps: []
github: ''
demo: ''
poster: https://drive.google.com/file/d/1n3Tozcdx-IlR9nF06VhVxx03wuBmoIuT/view
status: migrated
source_url: Google Drive：第六屆 YTP 專題實作簡報資料夾
team: 婐部繪曲兌鳴
advisor: 蕭旭君 教授
---

動機來自學習歷程檔案在移機過程中誤遭刪除且無備份而永久遺失的事件。單純多伺服器存同一份檔案會有單點被駭即外洩的問題，把金鑰放用戶端又怕遺失。我們以 Publicly Verifiable Secret Sharing（PVSS）設計 ePort-fortify：檔案加密後金鑰切成碎片分送多台伺服器，只要過半碎片即可用拉格朗日插值還原，單一伺服器被駭只拿到亂碼，還原時可驗證碎片是否被竄改；同時解決資料遺失、遭竊、遭竄改三個問題。建立了完整的 Threat Model（學生、老師、教授、廠商、攻擊者），並實作 256-bit 金鑰的加解密與伺服器端，效能與一般加解密相當、空間與異地備份相同。


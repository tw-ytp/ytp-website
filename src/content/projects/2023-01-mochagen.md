---
title: MochaGen 競賽程式測試資料生成器
edition: 8
year: 2023
rank: 1
tags:
- 競程
- 測資生成
members:
- name: 吳O倫
  school: 建國中學
- name: 蔡O衡
  school: 建國中學
- name: 蔡O晉
  school: 建國中學
overseasReps: []
github: https://github.com/CKEFGISC/MochaGen
demo: ''
poster: https://drive.google.com/file/d/1W8LSlLoy9d3Qha06_YRAxRFDptNXLAxR/view
status: migrated
source_url: Google Drive：YTP 8th 專題實作成果發表會-各組成員及摘要.pptx
team: 蔡摩卡與紙箱
advisor: 鄭瑞光 教授
---

演算法競賽的出題者必須自行撰寫 generator 與 validator 來產生測試資料，對新手門檻偏高：jngen、testlib.h 等函式庫文件不易上手，Polygon、TPS 也無法代為撰寫 generator。團隊因此開發 MochaGen，以 Tauri 建置桌面應用程式，前端使用 React、後端使用 Rust，另以 C++ 撰寫、CMake 建置的 Assembler 函式庫負責生成。系統把測資輸入抽象為 Token，涵蓋整數、浮點數、陣列、字串、樹、圖與幾何等類別及其屬性，並以 Google 的 Blockly 積木函式庫做出視覺化的 Token Editor，轉出 generator.cpp 與 validator.cpp，再由 Assembler 串接 jngen 編譯產生測資。成果是一款可一鍵安裝、免環境設定的工具；未來規劃以 AI 將題目敘述自動轉為 Token、支援其他語言並串接 Polygon 與 TPS。

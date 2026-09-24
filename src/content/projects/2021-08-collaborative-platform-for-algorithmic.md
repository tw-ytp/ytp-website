---
title: A Collaborative Platform for Algorithmic Problem Solving
edition: 6
year: 2021
rank: 0
tags:
- 區塊鏈
- 競程
members:
- name: 邱O亦
  school: 竹科實中
- name: 廖O陽
  school: 竹科實中
- name: 廖O胤
  school: 竹科實中
overseasReps: []
github: ''
demo: ''
poster: https://drive.google.com/file/d/1KpbUZtOQj4j0HC6twFar_mDmqUQMmcCy/view
status: migrated
source_url: Google Drive：第六屆 YTP 專題實作簡報資料夾
team: 我負責雜耍
---

三個現有平台各有侷限：LeetCode 使用者不能自行發布問題、題目多為基礎演算法題；Gitcoin 專注於 web3 開發的資金分配，對其他類型題目較少著墨；Kaggle 只有第一名拿得到獎金，主辦企業與參賽者的地位也不對等。CodeX 想做的是讓任何人都能發布開放式問題、解題者靠交易程式碼獲利，而提問者與解題者身分對等。流程是提問者把題目的輸入輸出格式化、決定計分方式、撰寫 checker 並生成測資後上傳；解題者上傳程式碼並自訂價格，系統評分後把程式碼存進 IPFS、由智能合約記錄儲存位址。關鍵設計是購買前只公開分數、看不到內容，讓買方以分數衡量價格是否值得，程式碼也不留在平台伺服器上。合約以 Solidity 撰寫，取代傳統管理員角色並負責代幣與程式碼資訊的管理。未來規劃自行發幣，設獎金池依得分回饋解題者，並抽出一部分獎勵出題者。

<!-- 註：簡報檔名為「CodeX」 -->

# Repository Guidelines

## 專案概述

這個儲存庫是一個靜態繁體中文記帳網站，用來記錄美國生活的美元收支，並讓台灣家人查看台幣換算、每月摘要、學生證餘額與行前花費。維持純 HTML、CSS、JavaScript 與 Python，不要為小改動新增框架或建置流程。

## 專案結構

- `index.html`：頁面結構、輸入表單、摘要區、分析區、交易表格與 template。
- `styles.css`：所有視覺樣式、RWD、表單、卡片、表格與按鈕狀態。
- `app.js`：前端資料邏輯，包括 localStorage、公開資料載入、匯入匯出、月份篩選、統計、編輯、匯率更新與資料正規化。
- `data/transactions.json`：部署後公開顯示的交易資料。
- `tools/publish_ledger.py`：從匯出的 JSON 更新公開資料，可選擇提交、推送並同步 `gh-pages`。

`.gitignore` 應持續排除本機試算表、匯出備份、暫存檔、`.env`、Python 快取與其他私人資料。

## Agent 工作原則

一般 UI、樣式、選單或前端邏輯小改動時，不要讀取完整 `data/transactions.json`。需要確認資料欄位或是否存在特定值時，優先用 `rg` 搜尋關鍵字或讀取小段上下文。只有在使用者要求發布資料、修正公開交易資料、檢查資料完整性，或變更 `tools/publish_ledger.py` 的資料輸出行為時，才完整檢查 `data/transactions.json`。

## 開發與發布指令

此專案不需要 npm install、打包或本機伺服器。

- 直接用瀏覽器開啟 `index.html`：本機執行網站。
- `node --check app.js`：檢查 JavaScript 語法。
- `python -m py_compile tools/publish_ledger.py`：檢查 Python 語法。
- `python tools/publish_ledger.py --no-git`：只更新 `data/transactions.json`，不提交。
- `python tools/publish_ledger.py --json C:\path\to\us-ledger.json --no-git`：用指定 JSON 更新公開資料但不提交。
- `python tools/publish_ledger.py`：更新公開資料、提交、推送，並同步 `gh-pages`。
- `git push origin main`：推送原始碼。
- `git push origin main:gh-pages`：同步公開網站分支。

## 程式風格

JavaScript 使用兩格縮排、分號、雙引號與 `camelCase`。DOM 參照集中在 `elements`，儲存鍵、固定 URL、特殊篩選值與固定選項使用大寫常數。資料正規化應集中在既有 normalize / infer helper，不要把規則散落在渲染函式。

Python 使用四格縮排、`snake_case`、`pathlib.Path`，讀寫檔案時明確指定 UTF-8。修改發布工具時保留既有 CLI 行為，避免讓 `--no-git` 產生提交或推送。

## UI 與版面

網站風格是簡約賽博朋克 Minimal Cyberpunk：深色背景、冷色資訊介面、乾淨網格、大量留白、少量高飽和霓虹點綴。保留未來科技感與神祕感，但避免傳統 Cyberpunk 的擁擠、雜亂與過度裝飾。修改 UI 時維持：

- 純 HTML/CSS，字體使用 `Space Grotesk` 作為標題、`IBM Plex Mono` 作為內文與數字。
- Deep Dark Mode：純黑或極深灰藍背景，搭配螢光藍、螢光粉、電光綠等少量 accent。
- 元件採直角、細霓虹邊框、低強度 glow 與簡單科技線條。
- 清楚的 section 分隔與 RWD。
- 約 `0.25s` 到 `0.3s` 的 hover / transition。
- 表格與表單優先可讀性。
- 不加入大型框架、厚重裝飾、閃爍動畫、雜亂卡片堆疊或大面積霓虹色塊。

## 資料模型與分類規則

月度收支資料來自 `data/transactions.json` 或瀏覽器 localStorage。交易資料必須保留：

- `date`
- `type`
- `category`
- `merchant`
- `paymentMethod`
- `note`
- `amount`

支出使用「大分類 + 店家」兩層結構。支出分類包含 `房租`、`超市`、`學餐`、`外食`、`交通`、`學費`、`醫療`、`娛樂`、`其他`。`merchant` 放實際店家，例如 `Trader Joe's`、`Walmart`、`Starbucks HSC`、`校園餐車`。店家選單依分類動態篩選；更新匯入、匯出、正規化或發布工具時必須保留 `merchant` 欄位。

收入類型目前允許 `rec center` 與 `學校` 作為分類。收入來源規則：

- `operation assisted`
- `lifeguard`
- `UAB INTO`

`operation assisted` 與 `lifeguard` 屬於 `rec center`；`UAB INTO` 屬於 `學校`。若匯入舊資料出現拼錯的 `lifegrade`，應正規化為 `lifeguard`。

選擇 `income` 時，表單應只顯示收入分類與收入來源；匯入舊資料時也應正規化到這套收入規則。

## 匯率與行前花費

一般生活收支使用頁面上方目前的 USD to TWD 匯率換算。匯率可自動更新，也可手動調整並保存到 localStorage。

行前總花費寫在 `app.js` 的 `pretripExpenses`，來源是 `總花費.xlsx`。其中有記錄「當時匯率」的項目必須固定使用該匯率，不可改用頁面上方的即時匯率。沒有歷史匯率的項目應標示未記錄匯率。

## 測試準則

目前沒有正式測試框架。修改行為後至少執行：

```powershell
node --check app.js
python -m py_compile tools/publish_ledger.py
```

若只改前端 JS，可只跑 `node --check app.js`。若改發布工具，必須跑 Python 語法檢查。重要行為仍需在瀏覽器手動驗證：新增、編輯、刪除、JSON/CSV 匯入匯出、月份篩選、收入來源選單、行前總花費與匯率更新。

發布資料前先使用 `--no-git`，確認 `data/transactions.json` 正確後再執行完整發布。

## Commit 與 PR

Commit 採短句、祈使語氣與標題式大小寫，例如 `Update public ledger data`、`Add rec center income options`。每個 commit 聚焦單一變更。PR 應說明使用者可見變化、列出驗證方式、標明是否更新公開資料；若改 UI，附上截圖。

## 安全提醒

不要提交私人試算表、匯出的本機備份、`.env`、密鑰、銀行帳號或完整信用卡資訊。`data/transactions.json` 會隨靜態網站公開部署，只能放可公開資料。

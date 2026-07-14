# Repository Guidelines

## 專案概述

這個儲存庫是一個靜態繁體中文記帳網站，用來記錄美國生活的美元收支，並讓台灣家人查看台幣換算、每月摘要、學生證餘額與行前花費。維持純 HTML、CSS、JavaScript 與 Python，不要為小改動新增框架或建置流程。

## 專案結構

- `index.html`：頁面結構、輸入表單、摘要區、分析區、交易表格與 template。
- `styles.css`：所有視覺樣式、RWD、表單、卡片、表格與按鈕狀態。
- `app.js`：前端資料邏輯，包括 localStorage、公開資料載入、匯入匯出、月份篩選、統計、編輯、匯率更新與資料正規化。
- `data/transactions.json`：部署後公開顯示的權威交易資料。
- `data/transactions.js`：由發布工具從 `transactions.json` 產生的本機載入副本。直接以 `file:` 開啟 `index.html` 時，瀏覽器可能禁止 `fetch()` JSON；此檔案讓頁面仍能載入公開資料。其內容必須與 `transactions.json` 相同，不可手動只更新其中一份。
- `tools/publish_ledger.py`：從指定匯出的 JSON 更新公開資料、產生 `transactions.js`、備份最新匯出檔，可選擇提交、推送並同步 `gh-pages`。
- `發布最新記帳資料.bat`：可雙擊的 Windows 發布入口。它會自動選擇 Downloads 中修改時間最新的 `us-ledger*.json` 後執行完整發布，成功後開啟 GitHub Pages 並保留命令視窗。
- `exports/latest-us-ledger.json`：發布工具建立的本機最新匯出備份，只供復原與核對，絕不可提交。

`.gitignore` 應持續排除本機試算表、`exports/` 匯出備份、暫存檔、`.env`、Python 快取與其他私人資料。

## Agent 工作原則

一般 UI、樣式、選單或前端邏輯小改動時，不要讀取完整 `data/transactions.json`。需要確認資料欄位或是否存在特定值時，優先用 `rg` 搜尋關鍵字或讀取小段上下文。只有在使用者要求發布資料、修正公開交易資料、檢查資料完整性，或變更 `tools/publish_ledger.py` 的資料輸出行為時，才完整檢查 `data/transactions.json`。

變更公開資料或發布工具時，`data/transactions.json` 與 `data/transactions.js` 必須一起更新並維持相同筆數、順序與欄位內容。不要刪除 `transactions.js` 或把本機 `file:` 模式的載入失敗退回範例資料，否則直接開啟 `index.html` 會與 GitHub Pages 顯示不同內容。

## 開發與發布指令

此專案不需要 npm install、打包或本機伺服器。

- 直接用瀏覽器開啟 `index.html`：本機執行網站。
- `node --check app.js`：檢查 JavaScript 語法。
- `node --check data/transactions.js`：檢查本機公開資料副本的 JavaScript 語法。
- `python -m py_compile tools/publish_ledger.py`：檢查 Python 語法。
- `python tools/publish_ledger.py --json C:\path\to\us-ledger.json --no-git`：用指定 JSON 更新 `data/transactions.json`、`data/transactions.js` 與 `exports/latest-us-ledger.json`，但不提交或推送。
- `python tools/publish_ledger.py --json C:\path\to\us-ledger.json`：用指定 JSON 更新資料、建立本機備份、提交、推送並同步 `gh-pages`。
- 雙擊 `發布最新記帳資料.bat`：自動選擇 Downloads 中最新的 `us-ledger*.json` 並執行完整發布；這是日常發布的建議方式。
- `git push origin main`：推送原始碼。
- `git push origin main:gh-pages`：同步公開網站分支。

### 發布資料的固定流程

1. 在記帳頁面完成新增、修改或刪除後，按「匯出 JSON」。Chrome 若發現同名檔案存在，可能建立 `us-ledger (1).json`、`us-ledger (2).json` 等檔名；不可假設永遠是 `us-ledger.json`。
2. 日常情況直接雙擊 `發布最新記帳資料.bat`。它依修改時間選最新檔，避免固定讀到舊的 `us-ledger.json`。
3. 需要人工核對時，明確指定剛匯出的完整路徑並先執行 `--no-git`。確認 `data/transactions.json` 的筆數、最新日期與預期資料後，再以相同來源執行完整發布。
4. 發布成功後，確認 `exports/latest-us-ledger.json` 已更新；這是刪除 Downloads 後可保留的本機備份，不會上傳 GitHub。
5. 命令視窗會開啟 GitHub Pages。若網站尚未立即反映，稍候後重新整理；若仍不符，先比較最新匯出檔與 `data/transactions.json`，不要立刻再發布其他舊檔。

不要在沒有 `--json` 的情況下讓工具自行猜測資料來源，也不要直接用可能含範例資料的本機頁面結果覆蓋公開資料。若最新匯出檔的筆數或最新日期異常，先停止發布並確認來源。

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

支出使用「大分類 + 店家」兩層結構。支出分類包含 `房租`、`超市`、`學餐`、`外食`、`網購`、`交通`、`學費`、`醫療`、`娛樂`、`其他`。`merchant` 放實際店家，例如 `Trader Joe's`、`Walmart`、`Amazon`、`Starbucks HSC`、`校園餐車`。網購店家選單包含 Amazon、Walmart.com、Target.com、Costco.com、Best Buy、eBay、Etsy、Temu、SHEIN 與 AliExpress。店家選單依分類動態篩選；更新匯入、匯出、正規化或發布工具時必須保留 `merchant` 欄位。

付款方式應隨表單分類自動帶入：選擇 `學餐` 時使用 `學生證`，其餘分類使用 `美國信用卡`。編輯既有交易時則保留原本記錄的付款方式。

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
node --check data/transactions.js
python -m py_compile tools/publish_ledger.py
```

若只改前端 JS，可檢查受影響的 JS 檔案。若改發布工具，必須跑 Python 語法檢查，並以 `--json ... --no-git` 驗證它會同步更新 JSON、JavaScript 資料副本與 `exports` 備份。重要行為仍需在瀏覽器手動驗證：新增、編輯、刪除、JSON/CSV 匯入匯出、月份篩選、收入來源選單、行前總花費與匯率更新，以及直接開啟 `index.html` 時資料不會退回範例交易。

發布資料前先使用 `--no-git`，確認 `data/transactions.json` 與 `data/transactions.js` 的內容一致後再執行完整發布。若使用日常 `.bat` 發布，發布前應確認 Downloads 的最新匯出檔時間確實是剛完成匯出後的時間。

## Commit 與 PR

Commit 採短句、祈使語氣與標題式大小寫，例如 `Update public ledger data`、`Add rec center income options`。每個 commit 聚焦單一變更。PR 應說明使用者可見變化、列出驗證方式、標明是否更新公開資料；若改 UI，附上截圖。

## 安全提醒

不要提交私人試算表、`exports/` 下的匯出備份、`.env`、密鑰、銀行帳號或完整信用卡資訊。`data/transactions.json` 與 `data/transactions.js` 都會隨靜態網站公開部署，只能放可公開資料。

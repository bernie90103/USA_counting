# Repository Guidelines

## 專案結構與模組分工

這個儲存庫是一個靜態繁體中文記帳網站，用來記錄美國生活的美元收支，並換算台幣給家人查看。主要檔案都在根目錄：

- `index.html`：頁面結構、表單與樣板。
- `styles.css`：全部視覺樣式與響應式排版。
- `app.js`：前端邏輯，包括 localStorage、匯入匯出、篩選、編輯與匯率更新。
- `data/transactions.json`：部署後公開顯示的交易資料。
- `tools/publish_ledger.py`：從匯出的 JSON 更新公開資料，並可同步到 GitHub Pages。

`.gitignore` 已排除本機試算表、暫存檔、`.env`、Python 快取等檔案。

## 建置、測試與開發指令

此專案不需要 npm 或打包流程。

- 直接用瀏覽器開啟 `index.html`：本機執行網站。
- `python tools/publish_ledger.py --no-git`：只更新 `data/transactions.json`，不提交。
- `python tools/publish_ledger.py --json C:\path\to\us-ledger.json --no-git`：指定匯出的 JSON 更新資料。
- `python tools/publish_ledger.py`：更新資料、提交、推送，並同步 `gh-pages`。
- `node --check app.js`：檢查 JavaScript 語法。
- `python -m py_compile tools/publish_ledger.py`：檢查 Python 語法。

## 程式風格與命名慣例

維持純 HTML、CSS、JavaScript 與 Python，不要為小改動新增框架。JavaScript 使用兩格縮排、分號、雙引號；DOM 參照、函式與變數使用 `camelCase`。儲存鍵與固定 URL 可使用大寫常數。Python 使用四格縮排、`snake_case`、`pathlib.Path`，讀寫資料時明確指定 UTF-8。

## 測試準則

目前沒有正式測試框架。修改行為後，至少執行語法檢查，並在瀏覽器手動驗證新增、編輯、刪除、JSON/CSV 匯入匯出、月份篩選與匯率更新。發布資料前先使用 `--no-git`，確認 `data/transactions.json` 正確後再執行完整發布。

## Commit 與 Pull Request 準則

近期 commit 採短句、祈使語氣與標題式大小寫，例如 `Update public ledger data`、`Add ledger publish script`。每個 commit 應聚焦單一變更。PR 需說明使用者可見變化、列出驗證方式、標明是否更新公開資料；若改 UI，請附截圖。

## 安全與設定提醒

不要提交私人試算表、匯出的本機備份、`.env` 或任何密鑰。`data/transactions.json` 會隨靜態網站公開部署，請只放可公開的資料。

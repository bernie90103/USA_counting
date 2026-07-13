# 美國生活記帳

靜態繁體中文記帳網站，用美元記錄美國生活的收入與支出，並換算成台幣，方便台灣家人查看每月花費、收入、結餘、學生證餘額與行前總花費。

公開網站：<https://bernie90103.github.io/USA_counting/>

## 主要功能

- 每月收入、支出、結餘與每日平均支出摘要。
- 依月份篩選交易明細。
- 依大分類與店家統計支出。
- 本機編輯模式支援新增、修改、刪除、JSON/CSV 匯入與匯出。
- 自動或手動設定 USD to TWD 匯率。
- 顯示學生證餘額與行前總花費；有歷史匯率的行前項目會固定使用當時匯率。

## 本機使用

此專案不需要 npm、打包或本機伺服器。直接用瀏覽器開啟 `index.html` 即可執行。

常用檢查與發布指令：

```powershell
node --check app.js
node --check data/transactions.js
python -m py_compile tools/publish_ledger.py
python tools/publish_ledger.py --json "C:\path\to\us-ledger.json" --no-git
python tools/publish_ledger.py --json "C:\path\to\us-ledger.json"
```

日常發布可直接雙擊根目錄的 `發布最新記帳資料.bat`。它會自動選擇 Downloads 中修改時間最新的 `us-ledger*.json`（例如 `us-ledger (1).json`），執行完整發布，成功後開啟 GitHub Pages 並保留結果視窗。

需要人工核對時，先以 `--json ... --no-git` 指定剛匯出的完整路徑。它會更新公開資料但不提交，並將同一份資料備份到 `exports/latest-us-ledger.json`。確認筆數、最新日期與內容正確後，再以相同 `--json` 指令完整發布。不要固定使用 `us-ledger.json`，因為 Chrome 可能將新匯出檔命名為 `us-ledger (1).json`。

## 檔案結構

- `index.html`：頁面結構、輸入表單、摘要區、分析區與交易表格樣板。
- `styles.css`：全部視覺樣式、RWD、表單、卡片、表格與按鈕狀態。
- `app.js`：前端資料邏輯、localStorage、公開資料載入、匯入匯出、統計、編輯、匯率更新與資料正規化。
- `data/transactions.json`：部署後公開網站載入的權威交易資料。
- `data/transactions.js`：由發布工具產生的資料副本；供直接開啟本機 `index.html` 時使用，必須與 `transactions.json` 同步。
- `tools/publish_ledger.py`：從指定匯出的 JSON 更新公開資料與本機資料副本、建立本機備份，並可同步 `gh-pages`。
- `發布最新記帳資料.bat`：自動選取最新 Downloads 匯出檔的雙擊發布入口。
- `exports/latest-us-ledger.json`：本機備份，方便刪除 Downloads 後復原；此資料夾已排除於 Git。
- `AGENTS.md`：貢獻與代理工作規則。

## 資料與分類規則

交易資料保留 `date`、`type`、`category`、`merchant`、`paymentMethod`、`note`、`amount`。

支出使用「大分類 + 店家」兩層結構。支出分類包含 `房租`、`超市`、`學餐`、`外食`、`交通`、`學費`、`醫療`、`娛樂`、`其他`。店家選單會依分類動態篩選，例如超市顯示 `Walmart`、`Trader Joe's`、`ALDI`，學餐顯示 `Starbucks HSC`、`Mein Bowl`、`The Commons on the Green`。

收入分類目前包含：

- `rec center`：`operation assisted`、`lifeguard`
- `學校`：`UAB INTO`

匯入舊資料時，拼錯的 `lifegrade` 應正規化為 `lifeguard`。

## 介面風格

網站採用簡約賽博朋克 Minimal Cyberpunk 視覺：深色背景、冷色資訊介面、乾淨網格、大量留白、少量高飽和霓虹點綴。標題使用 `Space Grotesk`，內文與數字使用 `IBM Plex Mono`。修改 UI 時維持可讀性，不加入大型框架、厚重裝飾或閃爍動畫。

## 開發注意

- 小型 UI、樣式或選單變更不需要完整讀取 `data/transactions.json`；先用 `rg` 搜尋關鍵字即可。
- 修改前端 JS 後至少執行 `node --check app.js`。
- 修改本機資料載入機制後也執行 `node --check data/transactions.js`。
- 修改發布工具後執行 `python -m py_compile tools/publish_ledger.py`。
- 發布公開資料前先以剛匯出的完整 JSON 路徑執行 `--no-git` 檢查輸出。

## 安全提醒

`data/transactions.json` 與 `data/transactions.js` 都會部署到公開網站，只能放可公開資料。不要提交私人試算表、`exports/` 下的本機備份、`.env`、密鑰、銀行帳號或完整信用卡資訊。

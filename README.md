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
python -m py_compile tools/publish_ledger.py
python tools/publish_ledger.py --no-git
python tools/publish_ledger.py
git push origin main
git push origin main:gh-pages
```

`python tools/publish_ledger.py --no-git` 只更新 `data/transactions.json`，適合正式發布前先檢查公開資料。完整發布會更新資料、提交、推送，並同步 GitHub Pages。

## 檔案結構

- `index.html`：頁面結構、輸入表單、摘要區、分析區與交易表格樣板。
- `styles.css`：全部視覺樣式、RWD、表單、卡片、表格與按鈕狀態。
- `app.js`：前端資料邏輯、localStorage、公開資料載入、匯入匯出、統計、編輯、匯率更新與資料正規化。
- `data/transactions.json`：部署後公開網站載入的交易資料。
- `tools/publish_ledger.py`：從匯出的 JSON 或瀏覽器 localStorage 更新公開資料，並可同步 `gh-pages`。
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
- 修改發布工具後執行 `python -m py_compile tools/publish_ledger.py`。
- 發布公開資料前先跑 `python tools/publish_ledger.py --no-git` 檢查輸出。

## 安全提醒

`data/transactions.json` 會部署到公開網站，只能放可公開資料。不要提交私人試算表、本機備份、`.env`、密鑰、銀行帳號或完整信用卡資訊。

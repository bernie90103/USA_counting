# 美國生活記帳網頁

這是一個可直接部署的靜態記帳網頁，介面以繁體中文呈現，適合在美國記錄美元收支，並換算成台幣給台灣家人查看。

## 使用方式

1. 直接用瀏覽器開啟 `index.html`。
2. 新增收入或支出，資料會存在目前瀏覽器的 `localStorage`。
3. 用「匯出 JSON」備份資料，或用「匯出 CSV」給 Excel/Google Sheets 使用。
4. 若要從 Excel 匯入，先將 Excel 另存成 CSV，欄位需包含：`date,type,category,note,amount`。

## 即時匯率

網頁載入時會自動從 `fxapi.app` 抓取最新 USD → TWD 匯率，也可以按「更新匯率」手動刷新。若 API 暫時失敗，網頁會保留上一個可用匯率，仍可手動輸入。

## 從目前 Excel 更新公開資料

這個專案已附一個轉換腳本，可把 `my account.xlsx` 的 `日期 / 東西 / 錢 / 備注` 欄位轉成網站會讀取的 JSON：

```powershell
python tools/convert_xlsx.py "my account.xlsx" data/transactions.json
```

轉換後重新整理網頁。如果瀏覽器之前已經新增過本機資料，會優先使用本機資料；可在瀏覽器清除這個網站的 localStorage，或改用匯入 JSON。

## 分享給台灣家人

這個版本是靜態網頁，最簡單的分享方式是部署到 GitHub Pages、Netlify 或 Vercel。家人可以看到網頁本身，但瀏覽器本機新增的資料不會自動同步到其他人電腦。

若要讓家人看到最新資料，有兩種做法：

1. 匯出 JSON 後，覆蓋 `data/transactions.json`，再重新部署網站。
2. 下一階段改成雲端同步版本，例如 Firebase、Supabase 或 Google Sheets API。

## CSV 格式

```csv
date,type,category,note,amount
2026-05-01,expense,房租,五月房租,1250
2026-05-05,income,收入,Part-time paycheck,820
```

`type` 只能用 `expense` 或 `income`。

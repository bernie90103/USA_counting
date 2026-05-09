# 美國生活記帳網頁

這是一個可直接部署的靜態記帳網頁，介面以繁體中文呈現，適合在美國記錄美元收支，並換算成台幣給台灣家人查看。

## 使用方式

1. 直接用瀏覽器開啟 `index.html`。
2. 新增收入或支出，資料會存在目前瀏覽器的 `localStorage`。
3. 用「匯出 JSON」備份資料，或用「匯出 CSV」給 Excel/Google Sheets 使用。
4. 若要讓部署後的網站顯示最新公開資料，匯出 JSON 後覆蓋 `data/transactions.json`，再重新部署。

## 即時匯率

網頁載入時會自動從 `fxapi.app` 抓取最新 USD → TWD 匯率，也可以按「更新匯率」手動刷新。若 API 暫時失敗，網頁會保留上一個可用匯率，仍可手動輸入。

## 更新公開資料

以後可以直接在網頁新增資料。資料會先存在你目前使用的瀏覽器，所以建議定期按「匯出 JSON」備份。

如果要讓台灣家人看到最新資料：

1. 在網頁按「匯出 JSON」。
2. 用匯出的 JSON 覆蓋 `data/transactions.json`。
3. 提交並推送到 GitHub，讓 GitHub Pages 或部署平台更新網站。

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

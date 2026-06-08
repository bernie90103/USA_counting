# 美國生活記帳

這是一個靜態繁體中文記帳網站，用美元記錄在美國生活的收入與支出，並即時換算成台幣，方便台灣家人查看每月花費、收入、結餘與行前總花費。

公開網站：<https://bernie90103.github.io/USA_counting/>

## 主要功能

- 顯示每月收入、支出、結餘與每日平均支出。
- 依月份篩選收支明細。
- 依大分類與店家統計支出。
- 顯示每筆交易的日期、類型、分類、店家、付款方式、說明、美元與台幣金額。
- 計算學生證餘額，從初始加值金額扣除學生證支出。
- 顯示行前總花費，並保留有記錄項目的歷史匯率。
- 本機編輯模式可新增、修改、刪除、匯入與匯出 JSON/CSV。

## 資料規則

交易資料使用「分類 + 店家」兩層結構：

- `type`：`expense` 或 `income`。
- `category`：大分類。
- `merchant`：店家或收入來源。
- `paymentMethod`：台灣信用卡、美國信用卡、學生證或現金。

支出分類包含房租、超市、學餐、外食、交通、學費、醫療、娛樂與其他。店家選單會依分類動態篩選，例如超市會顯示 Walmart、Trader Joe's、ALDI 等，學餐會顯示 Starbucks HSC、Mein Bowl、The Commons on the Green 等。

收入類型目前只使用 `rec center` 分類，收入來源只包含：

- `operation assisted`
- `lifegrade`

## 匯率規則

一般生活收支使用頁面上方的 USD to TWD 匯率換算台幣。網站載入後會嘗試更新即時匯率，也可以手動調整。

行前花費寫在 `app.js` 的 `pretripExpenses`。如果項目有記錄當時匯率，就固定使用該匯率，不會改用現在的即時匯率；沒有歷史匯率的項目會顯示未記錄匯率。

## 本機使用

這個專案不需要 npm 或打包流程，直接用瀏覽器開啟 `index.html` 即可。

常用檢查與發布指令：

```powershell
node --check app.js
python -m py_compile tools/publish_ledger.py
python tools/publish_ledger.py --no-git
python tools/publish_ledger.py
git push origin main
git push origin main:gh-pages
```

`python tools/publish_ledger.py --no-git` 只更新 `data/transactions.json`，適合發布前先檢查資料。完整發布會更新資料、提交、推送，並同步 GitHub Pages。

## 檔案結構

- `index.html`：頁面結構、表單與表格樣板。
- `styles.css`：全部視覺樣式與響應式排版。
- `app.js`：前端邏輯、資料正規化、localStorage、匯入匯出、統計與匯率更新。
- `data/transactions.json`：公開網站載入的交易資料。
- `tools/publish_ledger.py`：從匯出的 JSON 更新公開資料，並可同步部署。

## 安全提醒

`data/transactions.json` 會部署到公開網站，只放可以公開分享的資料。不要提交私人試算表、本機備份、`.env`、密鑰、銀行帳號或完整信用卡資訊。

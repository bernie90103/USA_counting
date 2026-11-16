# 美國生活記帳

[開啟記帳網站](https://bernie90103.github.io/USA_counting/)

私人家庭帳本，支援美元記帳、台幣換算、每月摘要、學生證餘額與行前花費。手機與電腦共用 Supabase 雲端資料；擁有者可以編輯，家人登入後只能查看。

**日常記帳不用 commit、push 或重新發布。** 在 App 或網站儲存成功後，其他裝置重新載入就能看到更新。只有修改網站程式時才需要更新 GitHub 與部署。

## 使用與備份

- 使用管理者建立的 Email／密碼登入，未登入無法查看帳目；網站不開放自行註冊。
- 可新增、修改、刪除、複製交易，依月份、分類與關鍵字查詢。
- 一般收支依帳本匯率換算；行前花費保留當時匯率。
- 第一版需連網。儲存失敗會保留表單；其他裝置已修改時，須重新載入後再編輯。
- 定期匯出 JSON 作私人備份，內含交易、行前花費、學生證加值與匯率設定。CSV 只包含交易。

交易資料存於 Supabase，不存放在 GitHub。舊公開交易副本與發布腳本已從目前版本移除；過去提交中的內容仍可能存在於 Git 歷史。

## 專案結構

| 路徑 | 用途 |
| --- | --- |
| `index.html`、`styles.css`、`app.js` | 登入頁、記帳介面、分類與統計 |
| `cloud.js`、`config.js` | Supabase 登入、角色、讀寫與連線設定 |
| `supabase/` | 初始化資料表、RLS 與帳本成員設定 SQL |
| `ios-app/` | 共用網頁程式的 Capacitor iOS 工程 |
| `vendor/` | 本機載入的瀏覽器套件與授權聲明 |
| `tools/`、`tests/` | 打包、連線檢查及測試 |
| `docs/SETUP.md` | 環境、Supabase、部署與 iPhone 安裝教學 |

沿用純 HTML、CSS、JavaScript 與 Python，沒有前端框架。網頁可以直接開啟 `index.html`；Node.js 用於測試、套件副本與 iOS 包裝。

## 開發與檢查

需要 Node.js 22+ 與 Python 3：

```bash
git clone https://github.com/bernie90103/USA_counting.git
cd USA_counting
npm ci
npm run check
python3 -m unittest discover -s tests -p 'test_*.py'
npm run package:web
```

更新套件後執行 `npm run vendor`，將產生的瀏覽器套件與 lockfile 一起提交。`config.js` 只放 Project URL 和 publishable key；不放 secret key、資料庫密碼或 SMTP 密碼。

## 網站部署與 iOS 更新

網站使用 GitHub Pages。程式修改提交到 `main` 後，到 **Actions → Deploy private ledger → Run workflow** 手動部署。流程只上傳 `dist/` 的允許清單，不會發布整個儲存庫、SQL 或私人備份。

iOS 使用完整 Xcode 與 Apple 帳號：

```bash
npm run ios:sync
npm run ios:open
```

在 Xcode 選自己的 Personal Team 與 iPhone，按 Run。免費 Personal Team 簽署約 7 天到期，需重新簽署安裝；一般帳目更新不需要重新安裝。

詳細步驟見 [設定與維護教學](docs/SETUP.md)。

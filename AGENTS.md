# Repository Guidelines

## 專案現況

這是繁體中文私人家庭記帳網站與共用網頁程式的 Capacitor iOS App。保持純 HTML、CSS、JavaScript 與 Python，不為小改動加入框架或額外建置流程。

交易、學生證加值、行前花費與帳本匯率的權威來源是 Supabase。日常記帳直接寫入雲端，不需要 Git commit 或發布。GitHub 只保存程式與 SQL 範本。

舊公開交易副本、localStorage 記帳流程與發布腳本已退役。不要重新建立公開交易 JSON／JavaScript、硬編碼私人花費、讀取私人備份當成執行時資料，或在載入失敗時退回範例交易。

## 結構

- `index.html`、`styles.css`、`app.js`：表單、篩選、統計、交易與資料正規化。
- `cloud.js`：登入、工作階段、角色、雲端 RPC、版本衝突、原生檔案分享。
- `config.js`：可公開的 Project URL／publishable key 與密碼重設回跳網址。
- `supabase/`：資料表、RLS、讀寫 RPC 與不含真實帳號的成員設定範本。
- `ios-app/`：Xcode／Capacitor 工程；保留使用者在 Xcode 設定的簽署與裝置設定。
- `tools/package_private.py`：用明確允許清單產生 `dist/` 與 iOS `www/`。
- `tools/vendor.mjs`、`vendor/`：產生與保存本機瀏覽器套件；保留授權聲明。
- `tools/check_connection.mjs`、`tools/check_live_site.mjs`：不需密碼的連線檢查。
- `tests/`：資料庫權限、原子匯入、登入與打包檢查。
- `docs/SETUP.md`：設定、備份、發布與自用 iOS 安裝說明。
- `private-backup/`、`exports/`：忽略的私人備份；不能提交或部署。

## 安全與資料存取

- 不提交密碼、secret／service_role key、SMTP 憑證、私人帳目、試算表、匯出檔或個人驗證紀錄。
- 只在使用者要求資料遷移、修復或完整性核對時讀取私人交易；一般 UI 修改不需讀取帳目。
- 權限在 Supabase RLS 與 RPC 中執行：匿名與非成員不能讀取，viewer 不能寫入或自行提升角色。
- 雲端確認成功後才顯示儲存完成；失敗保留表單。保留 revision 衝突檢查及整批匯入的原子性。
- 登出清除敏感畫面。不要為診斷索取使用者登入密碼或放寬資料庫權限。
- 既有密碼登入不套用新密碼的長度要求；密碼重設才檢查新密碼規則。
- 匯入前顯示筆數、日期範圍、金額與是否包含設定，保留確認及備份提示。

## 開發與發布

```bash
npm ci
npm run check
python3 -m unittest discover -s tests -p 'test_*.py'
npm run package:web
```

只改前端時可執行受影響 JS 語法檢查與 `node --test tests/frontend.test.cjs`。改 SQL 時須執行資料庫權限／衝突／原子匯入測試。改打包時須核對輸出允許清單與私人資料排除。

依賴異動後執行 `npm run vendor` 並提交 lockfile 與對應 vendor 檔案。iOS 更新執行 `npm run ios:sync`，再於 Xcode Run；不要宣稱僅同步資源就已更新手機上的 App。

網站從 `main` 透過 **Deploy private ledger** 手動 Actions 部署，只上傳 `dist/`。不要使用 `git push origin main:gh-pages`，也不要部署整個原始碼目錄。一般記帳不觸發 Git 或網站部署。

發布前確認測試通過、輸出不含交易／SQL／備份；發布後檢查登入頁及舊交易 URL 的 404。不得將伺服器／測試失敗解讀為已通過，也不得把角色 SQL 核對當成真實帳號登入驗證。

## 程式風格與 UI

JavaScript 使用兩格縮排、分號、雙引號與 camelCase。DOM 參照集中管理，固定選項與儲存鍵使用大寫常數，正規化規則集中於 normalize／infer helpers。Python 使用四格縮排、snake_case、pathlib.Path 與明確 UTF-8。

保持 Warm Glassmorphism：暖米色、淺金與柔和深棕、透明面板、圓角和柔和陰影。標題用 Space Grotesk，內文數字用 IBM Plex Mono。保留收入淡綠、Marshall 珊瑚紅、支出膠囊、平日 Warm Amber Latte 與週末 Dreamy Amethyst Violet；各配色不可相互覆蓋。支援手機安全區域與可讀明細，hover／transition 約 0.2–0.3 秒，不加入過度動畫。

## 資料模型與既有行為

保留交易 `id`、`date`、`type`、`category`、`merchant`、`paymentMethod`、`note`、`amount`。支出分類為房租、超市、學餐、外食、網購、3C、交通、學費、醫療、娛樂、其他；店家依分類篩選。選學餐自動帶入學生證，其餘使用既有信用卡預設；編輯時保留原付款方式。

收入分類為代收代付、rec center、學校、其他收入。保留 operation assisted／lifeguard、UAB INTO 等來源；舊 lifegrade 正規化為 lifeguard。依同學、代付、還款、分帳等備註判斷代收代付。收入表單只顯示收入分類與來源，匯入匯出保留 merchant。

一般生活收支使用帳本目前匯率；行前花費有歷史匯率時固定使用當時匯率，未記錄時顯示未記錄。資料來自受保護帳本設定，不寫回程式常數。

## Commit 與 PR

Commit 使用短句、祈使語氣與標題式大小寫，聚焦單一變更。PR 說明可見行為與驗證；UI 修改附實際截圖，無法取得時誠實標示。不要把個人診斷紀錄或真實帳目放入公開 PR。

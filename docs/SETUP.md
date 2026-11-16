# 設定與維護

正式網站：<https://bernie90103.github.io/USA_counting/>

日常記帳只需要登入網站或 iOS App。資料由 Supabase 保存，不需要匯出後發布，也不需要 commit／push。

## 本機環境

需要 Node.js 22+ 與 Python 3；iOS 另需 macOS、完整 Xcode 26+ 及 Apple 帳號。

```bash
git clone https://github.com/bernie90103/USA_counting.git
cd USA_counting
npm ci
npm run check
python3 -m unittest discover -s tests -p 'test_*.py'
```

可直接開啟 `index.html`，macOS 也可雙擊 `開啟記帳網頁.command`。網頁和 iOS 都需要網路連線才能讀寫雲端帳目。

## Supabase 與帳號

現有專案已設定完成，不要在使用中的資料庫重跑初始化 SQL。以下用於另外建立新環境：

1. 建立 Supabase 專案，在 SQL Editor 執行 `supabase/schema.sql` 一次。
2. 在 Authentication 啟用 Email／Password，關閉自行註冊及匿名登入。
3. 在 Authentication > Users 建立擁有者與家人帳號，管理者確認帳號（Auto Confirm）。
4. 在 SQL Editor 貼上 `supabase/create-household.sql`，將佔位 Email 換成實際帳號，執行一次建立帳本與角色。真實 Email／密碼不要存回儲存庫。
5. 在 `config.js` 填 Project URL、以 `sb_publishable_` 開頭的 publishable key，以及密碼重設回跳網址。程式不接受 secret key 或舊 JWT 格式金鑰。

成員權限由 RLS 與 RPC 執行；擁有者可編輯，viewer 只能查看。新增家人時，使用 `create-household.sql` 底部的範例，指定既有帳本 ID，不需新建帳本或給家人 Supabase 後台管理權。

既有密碼登入直接由 Supabase 驗證。建立／重設新密碼時，使用至少 8 個字元。

```bash
node tools/check_connection.mjs
```

此指令只檢查登入服務設定與匿名讀取是否被拒絕，不測試任何人的密碼，也不等於已驗證使用者實際登入。

## 密碼重設郵件

在 Authentication > URL Configuration 設定 Site URL 與 Redirect URLs，使用正式網站完整網址（含最後的 `/`），並與 `config.js` 的 `resetRedirectUrl` 相同。

家人收取密碼重設信需設定 Custom SMTP；Supabase 預設寄信服務只限專案團隊成員。SMTP 憑證只填在 Supabase 後台，不放入程式。寄信服務費用依所選方案另計。

[Supabase 官方 SMTP 說明](https://supabase.com/docs/guides/auth/auth-smtp)

重設連結在瀏覽器開啟，設定新密碼後重新登入；iOS App 也使用新密碼登入。

## 備份、匯入與衝突

- 擁有者定期匯出 JSON，另存一份不同裝置的私人備份。JSON 包含交易及設定；CSV 只有交易。
- 完整 JSON 格式為 `us-ledger-backup-v1`，包含 `transactions` 與 `settings`；舊交易陣列與 CSV 也可匯入，但不取代設定。
- 匯入前核對筆數、日期範圍與金額，確認後才整批取代雲端資料；任一筆失敗會整批回復。
- `settings.deposits` 保存學生證加值，`settings.pretripExpenses` 保存行前花費與歷史匯率。需要編輯時，先備份完整 JSON，修改後透過擁有者匯入。
- 多裝置同時編輯會以帳本 revision 檢查衝突；先保留未儲存文字，再重新載入最新帳目並編輯。
- 確認儲存成功後才離開。第一版沒有離線新增或背景合併。

備份、試算表、私人 SQL 與診斷結果放在儲存庫外，或已忽略的 `private-backup/`／`exports/`。舊版遷移工具及公開資料的本機備份僅留作復原，不是執行時資料來源。

## 更新網站程式

只有程式修改需要提交 GitHub；記帳資料不會觸發部署。

```bash
npm run check
python3 -m unittest discover -s tests -p 'test_*.py'
npm run package:web
```

`dist/` 與 iOS 的 `www/` 都由明確允許清單產生，不包含帳目、SQL、備份或原生工程。套件異動時先執行 `npm run vendor`，將 vendor 檔案與 lockfile 一起提交。

將程式提交到 `main` 後，在 GitHub **Actions → Deploy private ledger → Run workflow** 手動部署，等 workflow 成功。Pages 的發布來源使用 **GitHub Actions**。不要用整個 main 分支覆蓋舊 gh-pages 分支。

```bash
node tools/check_live_site.mjs
```

部署後核對首頁為登入版，以及舊 `data/transactions.json`／`.js` 網址回傳 404。從目前版本移除舊資料不會清除 Git 歷史；歷史清理需另行處理。

[GitHub Pages 工作流程說明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## 更新自用 iOS App

```bash
npm run ios:sync
npm run ios:open
```

在 Xcode 選 App target > Signing & Capabilities，啟用 Automatically manage signing，Team 選自己的 Personal Team。連接並信任 iPhone，開啟 Developer Mode，選手機後按 Run。

若命令列仍選到 Command Line Tools，可只對這次指令指定 Xcode：

```bash
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer npm run ios:open
```

程式或連線設定更新後，先同步資源再用 Xcode Run 覆蓋安裝；只執行 sync 不會更新已安裝的 App。免費 Personal Team 的簽署約 7 天到期，需重新簽署安裝。一般帳目更新則直接透過 Supabase 同步。

[Apple 自用開發帳號說明](https://developer.apple.com/help/account/basics/about-your-developer-account) · [Capacitor 環境需求](https://capacitorjs.com/docs/getting-started/environment-setup)

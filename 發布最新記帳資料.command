#!/bin/bash

# 切換到本腳本所在目錄（macOS 雙擊 .command 預設會在家目錄執行）
cd "$(dirname "$0")" || exit 1

# 尋找 Python 3 執行檔（macOS 預設通常為 python3）
PYTHON_BIN=""
if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  echo ""
  echo "========================================================"
  echo " 錯誤：找不到 Python 執行環境！"
  echo " 請先至 https://www.python.org 安裝 Python 3。"
  echo "========================================================"
  echo ""
  read -n 1 -s -r -p "按任意鍵結束..."
  echo ""
  exit 1
fi

# 自動從 ~/Downloads 搜尋修改時間最新的 us-ledger*.json
LEDGER_JSON=$("$PYTHON_BIN" -c '
import pathlib
downloads = pathlib.Path.home() / "Downloads"
files = list(downloads.glob("us-ledger*.json"))
if files:
    latest = max(files, key=lambda f: f.stat().st_mtime)
    print(str(latest.resolve()))
')

if [ -z "$LEDGER_JSON" ] || [ ! -f "$LEDGER_JSON" ]; then
  echo ""
  echo "========================================================"
  echo " 錯誤：在「下載 (Downloads)」資料夾中找不到任何 us-ledger JSON 匯出檔。"
  echo " 請在記帳網頁完成記帳後點擊「匯出 JSON」，再重新執行本程式。"
  echo "========================================================"
  echo ""
  read -n 1 -s -r -p "按任意鍵結束..."
  echo ""
  exit 1
fi

echo ""
echo "========================================================"
echo " 準備發布最新記帳資料到 GitHub Pages"
echo " 來源檔案：$LEDGER_JSON"
echo "========================================================"
echo ""

"$PYTHON_BIN" "tools/publish_ledger.py" --json "$LEDGER_JSON"
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "========================================================"
  echo " 發布失敗！請檢查上方錯誤訊息。"
  echo "========================================================"
  echo ""
  read -n 1 -s -r -p "按任意鍵結束..."
  echo ""
  exit $EXIT_CODE
fi

echo ""
echo "========================================================"
echo " 發布完成！GitHub Pages 可能需要 1~2 分鐘更新快取。"
echo " 正在為您開啟公開網站..."
echo "========================================================"
echo ""

open "https://bernie90103.github.io/USA_counting/"

echo ""
read -n 1 -s -r -p "按任意鍵結束..."
echo ""

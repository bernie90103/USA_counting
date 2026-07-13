@echo off
setlocal

set "LEDGER_JSON="
pushd "%USERPROFILE%\Downloads" >nul 2>&1
for /f "delims=" %%F in ('dir /b /a-d /o-d "us-ledger*.json" 2^>nul') do (
  set "LEDGER_JSON=%CD%\%%F"
  goto :ledger_found
)

:ledger_found
popd >nul 2>&1

if not defined LEDGER_JSON (
  echo.
  echo ERROR: No us-ledger JSON export was found in Downloads.
  echo Export JSON from the ledger page, then run this file again.
  echo.
  pause
  exit /b 1
)

echo.
echo Publishing the latest ledger data...
python "%~dp0tools\publish_ledger.py" --json "%LEDGER_JSON%"

if errorlevel 1 (
  echo.
  echo Publishing failed. Review the message above.
  pause
  exit /b 1
)

echo.
echo Publishing complete. GitHub Pages may take a moment to update.
start "" "https://bernie90103.github.io/USA_counting/"
pause

@echo off
setlocal
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo [RAID QIX] npm was not found. Install Node.js first.
  pause
  exit /b 1
)

if not exist node_modules (
  echo [RAID QIX] Installing dependencies...
  call npm install
  if errorlevel 1 goto :error
)

echo [RAID QIX] Starting...
call npm start
exit /b %errorlevel%

:error
echo.
echo [RAID QIX] Failed.
pause
exit /b 1

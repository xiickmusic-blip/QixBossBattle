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

echo [RAID QIX] Building Windows portable package...
call npm run build
if errorlevel 1 goto :error

echo.
echo [RAID QIX] Build complete. Check the dist folder.
pause
exit /b 0

:error
echo.
echo [RAID QIX] Build failed.
pause
exit /b 1

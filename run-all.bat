@echo off
chcp 65001 >nul
title Huy Perfume - Run Active Services

:: ── Clean stale processes ──────────────────────────────────
echo ============================================
echo   HUY PERFUME - DANG DON DEP TRUOC KHI CHAY
echo ============================================
echo.
echo Don dep tien trinh Node cu...
taskkill /F /IM node.exe >nul 2>&1
echo Da don dep xong.
echo.

:: ── Check SQL Server ───────────────────────────────────────
set SQLSERVER_SERVICE=
for /f "tokens=1* delims=:" %%A in ('sc query state^= all ^| findstr /I "MSSQL$ SQL Server"') do (
    set SQLSERVER_SERVICE=%%A
)

echo [0/3] Kiem tra SQL Server...
if "%SQLSERVER_SERVICE%"=="" (
    echo         [CANH BAO] Khong tim thay SQL Server service.
    echo         Vui long mo Services va start SQL Server truoc.
) else (
    echo         Service tim thay: %SQLSERVER_SERVICE%
    sc query "%SQLSERVER_SERVICE%" | find /I "RUNNING" >nul
    if "%ERRORLEVEL%"=="0" (
        echo         SQL Server dang chay - OK.
    ) else (
        echo         SQL Server chua chay. Vui long start SQL Server.
    )
)

:: ── Start backend ──────────────────────────────────────────
echo.
echo [1/3] Express API Server ^(:4000^)...
if not exist "server\node_modules" (
    echo         Dang cai dat packages...
    cd server && call npm install && cd ..
)
start "Express API" cmd /k "cd /d server && npm run dev"

:: ── Start user frontend ────────────────────────────────────
echo [2/3] React User Frontend ^(:5177^)...
if not exist "frontend\node_modules" (
    echo         Dang cai dat packages...
    cd frontend && call npm install && cd ..
)
start "React User Frontend" cmd /c "cd /d frontend && npm run dev:user"

:: ── Start admin frontend ───────────────────────────────────
echo [3/3] React Admin Frontend ^(:5178^)...
start "React Admin Frontend" cmd /c "cd /d frontend && npm run dev:admin"

:: ── Wait & open browser ────────────────────────────────────
set FRONTEND_HOME=http://localhost:5177/home
set ADMIN_URL=http://localhost:5178/

echo.
echo ============================================
echo   DANG CHO SERVER SAN SANG ...
echo ============================================
echo.

:: Poll the health endpoint until it responds, then open Chrome
set RETRIES=0
:waitloop
timeout /t 2 /nobreak >nul
curl -s --max-time 2 http://localhost:4000/api/health >nul 2>&1
if "%ERRORLEVEL%"=="0" goto ready
set /a RETRIES+=1
if %RETRIES% LSS 15 goto waitloop

:ready
echo.
echo ============================================
echo   TAT CA DA SAN SANG!
echo ============================================
echo   Trang chu      : %FRONTEND_HOME%
echo   Trang Admin    : %ADMIN_URL%
echo   Backend API    : http://localhost:4000
echo.
echo   Tai khoan Admin: admin@huyperfume.com / admin123
echo ============================================
echo.

:: Open Chrome directly to the home page
echo Dang mo Chrome vao trang chu...
start "" chrome.exe "%FRONTEND_HOME%"

echo.
echo Nhan phim bat ky de thoat ...
pause >nul

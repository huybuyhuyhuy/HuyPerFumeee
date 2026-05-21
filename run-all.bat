@echo off
chcp 65001 >nul
title Huy Perfume - Run Active Services

set SQLSERVER_SERVICE=
for /f "tokens=1* delims=:" %%A in ('sc query state^= all ^| findstr /I "MSSQL$ SQL Server"') do (
    set SQLSERVER_SERVICE=%%A
)

echo ============================================
echo   HUY PERFUME - STARTING ACTIVE SERVICES
echo ============================================
echo.

echo [0/3] Checking SQL Server...
if "%SQLSERVER_SERVICE%"=="" (
    echo         [CANH BAO] Khong tim thay service SQL Server.
    echo         Vui long mo Services va start SQL Server instance.
) else (
    echo         Da tim thay service SQL Server: %SQLSERVER_SERVICE%
    sc query "%SQLSERVER_SERVICE%" | find /I "RUNNING" >nul
    if "%ERRORLEVEL%"=="0" (
        echo         SQL Server dang chay.
    ) else (
        echo         SQL Server chua chay hoac ten service khong hop le.
        echo         Vui long start SQL Server truoc khi chay app.
    )
)

echo.
echo [1/3] Express API Server (:4000)...
if not exist "server\node_modules" (
    cd server && call npm install && cd ..
)
start "Express API" cmd /k "cd /d server && npm run dev"

echo [2/4] React User Frontend (:5177)...
if not exist "frontend\node_modules" (
    cd frontend && call npm install && cd ..
)
start "React User Frontend" cmd /k "cd /d frontend && npm run dev:user"

echo [3/4] React Admin Frontend (:5178)...
start "React Admin Frontend" cmd /k "cd /d frontend && npm run dev:admin"

echo [4/4] All requested frontends are starting...

echo.
echo ============================================
echo   Active services started!
echo.
set FRONTEND_HOME=http://localhost:5177/
set ADMIN_URL=http://localhost:5178/

echo   Trang chu      : %FRONTEND_HOME%
echo   Trang Admin    : %ADMIN_URL%
echo   Backend chinh  : Express API (:4000)
echo.
echo   Admin: admin@huyperfume.com / admin123
echo ============================================
pause
--cách chạy Terminal > Run Task > Run active app

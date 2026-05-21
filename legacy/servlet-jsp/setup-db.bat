@echo off
chcp 65001 >nul
title Setup Database - Huy Perfume

echo ============================================
echo   HUY PERFUME - DATABASE SETUP
echo ============================================
echo.

set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
set MYSQLD_PATH=C:\xampp\mysql\bin\mysqld.exe

:: 1. Check XAMPP MySQL
echo [1/3] Kiem tra XAMPP MySQL...

tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo        MySQL da chay.
) else (
    if exist "%MYSQLD_PATH%" (
        echo        Dang khoi dong XAMPP MySQL...
        start "" /B "%MYSQLD_PATH%" --defaults-file="C:\xampp\mysql\bin\my.ini"
        echo        Doi MySQL khoi dong...
        timeout /t 5 /nobreak >nul
    ) else (
        echo        [LOI] Khong tim thay XAMPP MySQL!
        echo        Vui long mo XAMPP Control Panel ^> Start MySQL.
        goto :end
    )
)

:: 2. Check mysql.exe
if not exist "%MYSQL_PATH%" (
    echo        [LOI] Khong tim thay mysql.exe tai %MYSQL_PATH%
    goto :end
)

:: 3. Run SQL
echo [2/3] Dang tao database huyperfume...
"%MYSQL_PATH%" -u root < database_setup.sql 2>NUL
if "%ERRORLEVEL%"=="0" (
    echo [3/3] TAO DATABASE THANH CONG!
) else (
    echo        Thu lai voi cach khac...
    "%MYSQL_PATH%" -u root -e "source database_setup.sql" 2>NUL
    if "%ERRORLEVEL%"=="0" (
        echo [3/3] TAO DATABASE THANH CONG!
    ) else (
        echo        [LOI] Khong the chay database_setup.sql.
        echo        Hay chay thu cong: mysql -u root ^< database_setup.sql
        goto :end
    )
)

echo.
echo ============================================
echo   Database: huyperfume
echo   Tables:  categories, brand, users, products,
echo            orders, order_items, wishlist
echo.
echo   Admin: admin@huyperfume.com / admin123
echo ============================================

:end
echo.
pause

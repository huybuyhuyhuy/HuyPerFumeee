@echo off
echo ========================================
echo  TAI THU VIEN CHO DU AN HUY PERFUME
echo ========================================
echo.

REM Tao thu muc lib neu chua ton tai
if not exist "web\WEB-INF\lib" mkdir "web\WEB-INF\lib"

echo Dang tai cac thu vien...
echo.

REM Tai MySQL Connector
echo [1/4] Dang tai mysql-connector-java-8.0.29.jar...
curl -L -o "web\WEB-INF\lib\mysql-connector-java-8.0.29.jar" "https://repo1.maven.org/maven2/mysql/mysql-connector-java/8.0.29/mysql-connector-java-8.0.29.jar"

REM Tai Gson
echo [2/4] Dang tai gson-2.10.1.jar...
curl -L -o "web\WEB-INF\lib\gson-2.10.1.jar" "https://repo1.maven.org/maven2/com/google/code/gson/gson/2.10.1/gson-2.10.1.jar"

REM Tai JSTL
echo [3/4] Dang tai jakarta.servlet.jsp.jstl-2.0.0.jar...
curl -L -o "web\WEB-INF\lib\jakarta.servlet.jsp.jstl-2.0.0.jar" "https://repo1.maven.org/maven2/org/glassfish/web/jakarta.servlet.jsp.jstl/2.0.0/jakarta.servlet.jsp.jstl-2.0.0.jar"

REM Tai JSTL API
echo [4/4] Dang tai jakarta.servlet.jsp.jstl-api-2.0.0.jar...
curl -L -o "web\WEB-INF\lib\jakarta.servlet.jsp.jstl-api-2.0.0.jar" "https://repo1.maven.org/maven2/jakarta/servlet/jsp/jstl/jakarta.servlet.jsp.jstl-api/2.0.0/jakarta.servlet.jsp.jstl-api-2.0.0.jar"

echo.
echo ========================================
echo  HOAN THANH!
echo ========================================
echo Cac thu vien da duoc tai vao: web\WEB-INF\lib\
echo.
echo Cac buoc tiep theo:
echo 1. Chay file database_setup.sql trong MySQL
echo 2. Mo project trong NetBeans
echo 3. Clean and Build
echo 4. Run project
echo.
pause

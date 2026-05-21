@echo off
title Build Huy Perfume API
echo ============================================
echo   Building Spring Boot API...
echo ============================================

:: Set Java
set JAVA_HOME=C:\Program Files\Java\jdk-24
if not exist "%JAVA_HOME%" set JAVA_HOME=C:\Program Files\Java\jdk-21
if not exist "%JAVA_HOME%" set JAVA_HOME=C:\Program Files\Java\jdk-17

echo JAVA_HOME=%JAVA_HOME%

:: Download maven wrapper if needed
if not exist ".mvn\wrapper\maven-wrapper.jar" (
    echo Downloading Maven Wrapper...
    powershell -Command "Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar' -OutFile '.mvn\wrapper\maven-wrapper.jar'"
)

:: Build
echo.
echo Building huyperfume-api...
call mvnw.cmd -f huyperfume-api\pom.xml clean compile -DskipTests
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo BUILD FAILED! Check errors above.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   BUILD SUCCESS!
echo ============================================
pause

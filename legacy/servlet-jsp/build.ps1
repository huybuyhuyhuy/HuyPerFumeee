# Build script for VS Code - compiles Java sources for the legacy Servlet/JSP app
$projectRoot = $PSScriptRoot
$srcDir = Join-Path $projectRoot "src\java"
$webDir = Join-Path $projectRoot "web"
$classesDir = Join-Path $webDir "WEB-INF\classes"
$libDir = Join-Path $webDir "WEB-INF\lib"

# Ensure classes directory exists
New-Item -ItemType Directory -Force -Path $classesDir | Out-Null

# Collect all JAR files for classpath
$jars = Get-ChildItem "$libDir\*.jar" | ForEach-Object { $_.FullName }
$tomcatLib = if ($env:CATALINA_HOME) { Join-Path $env:CATALINA_HOME "lib" } else { "D:\tomcat\apache-tomcat-10.1.55\lib" }
$servletJars = Get-ChildItem "$tomcatLib\*.jar" | ForEach-Object { $_.FullName }
$allJars = $jars + $servletJars
$classpath = ($allJars -join ";")

# Find all Java files to compile
$javaFiles = Get-ChildItem -Path $srcDir -Recurse -Filter "*.java" | ForEach-Object { $_.FullName }
$javaFilesStr = $javaFiles -join " "

if ([string]::IsNullOrWhiteSpace($javaFilesStr)) {
    Write-Host "No Java files found."
    exit 1
}

Write-Host "Compiling $($javaFiles.Count) Java files..."
Write-Host "Output: $classesDir"

# Compile
$result = javac --release 17 -encoding UTF-8 -cp $classpath -d $classesDir @($javaFiles) 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "COMPILE ERROR:"
    Write-Host $result
    exit 1
}

Write-Host "Build successful!"
Write-Host "Classes written to $classesDir"

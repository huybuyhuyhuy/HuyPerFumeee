$tomcatBin = "D:\tomcat\apache-tomcat-10.1.55\bin"
$env:CATALINA_HOME = "D:\tomcat\apache-tomcat-10.1.55"
$env:JAVA_HOME = [System.Runtime.InteropServices.RuntimeEnvironment]::GetRuntimeDirectory().TrimEnd('\')
$projectRoot = $PSScriptRoot
$nativeLibDir = Join-Path $projectRoot "web\WEB-INF\lib"
$env:CATALINA_OPTS = "-Djava.library.path=$nativeLibDir"

Write-Host "Starting Tomcat..."
Write-Host "JAVA_HOME: $env:JAVA_HOME"
Write-Host "CATALINA_HOME: $env:CATALINA_HOME"
Write-Host "CATALINA_OPTS: $env:CATALINA_OPTS"
Write-Host "App will be at: http://localhost:8080/BaiThiCuoiKi/home"

& "$tomcatBin\catalina.bat" run

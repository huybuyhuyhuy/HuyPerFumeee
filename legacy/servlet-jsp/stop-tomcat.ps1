$tomcatBin = "D:\tomcat\apache-tomcat-10.1.55\bin"
$env:CATALINA_HOME = "D:\tomcat\apache-tomcat-10.1.55"
& "$tomcatBin\shutdown.bat"
Write-Host "Tomcat stopped."

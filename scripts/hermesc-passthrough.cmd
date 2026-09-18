@echo off
rem Stand-in for hermesc used only with `gradlew ... -PskipHermesc`.
rem See android/app/build.gradle and scripts/hermesc-passthrough.js.
node "%~dp0hermesc-passthrough.js" %*
exit /b %ERRORLEVEL%

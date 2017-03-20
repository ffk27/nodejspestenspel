@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\node_modules\nodemon\bin\nodemon.js" %*
) ELSE (
  node  "%~dp0\node_modules\nodemon\bin\nodemon.js" %*
)
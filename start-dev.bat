@echo off
setlocal
cd /d "%~dp0"

title Sweet Drip - Starting dev servers

echo.
echo  ========================================
echo   Sweet Drip - Frontend + Backend
echo  ========================================
echo.

where dotnet >nul 2>&1
if errorlevel 1 (
    echo [ERROR] .NET SDK not found. Install .NET 8 from https://dotnet.microsoft.com/download
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js / npm not found. Install from https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
    echo.
)

echo Starting Backend API  (http://localhost:5025) ...
start "Sweet Drip API" cmd /k "cd /d "%~dp0backend\SweetDrip.Api" && dotnet run"

timeout /t 2 /nobreak >nul

echo Starting Frontend     (http://localhost:5173) ...
start "Sweet Drip Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo  Both servers are starting in separate windows.
echo.
echo  Backend:  http://localhost:5025
echo  Frontend: http://localhost:5173
echo.
echo  Make sure .env contains:
echo    VITE_API_URL=http://localhost:5025
echo.
echo  Close the API / Frontend windows to stop the servers.
echo.
pause

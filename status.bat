@echo off
REM Status Check Script for Windows
REM Checks the current status of all services and components

echo 📊 Prompt Engineering Playground Status Check
echo ==============================================

echo 🔧 Dependencies:
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do echo    ✅ Python %%i
) else (
    echo    ❌ Python not found
)

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f %%i in ('node --version') do echo    ✅ Node.js %%i
) else (
    echo    ❌ Node.js not found
)

REM Check Docker
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=3" %%i in ('docker --version') do echo    ✅ Docker %%i
) else (
    echo    ❌ Docker not found
)

echo.
echo 📁 Project Structure:

if exist "backend" (
    echo    ✅ backend\
) else (
    echo    ❌ backend\ missing
)

if exist "frontend" (
    echo    ✅ frontend\
) else (
    echo    ❌ frontend\ missing
)

if exist "backend\main.py" (
    echo    ✅ backend\main.py
) else (
    echo    ❌ backend\main.py missing
)

if exist "frontend\package.json" (
    echo    ✅ frontend\package.json
) else (
    echo    ❌ frontend\package.json missing
)

if exist "docker-compose.yml" (
    echo    ✅ docker-compose.yml
) else (
    echo    ❌ docker-compose.yml missing
)

echo.
echo ⚙️  Environment Configuration:

if exist "backend\.env" (
    echo    ✅ backend\.env exists
    findstr /C:"OPENAI_API_KEY=sk-" backend\.env >nul 2>&1
    if %errorlevel% equ 0 (
        echo    ✅ OpenAI API key configured
    ) else (
        echo    ⚠️  OpenAI API key not configured
    )
) else (
    echo    ❌ backend\.env missing
)

if exist "frontend\.env.local" (
    echo    ✅ frontend\.env.local exists
) else (
    echo    ❌ frontend\.env.local missing
)

echo.
echo 📦 Dependencies Status:

if exist "backend\venv" (
    echo    ✅ Python virtual environment
) else (
    echo    ⚠️  Python virtual environment not found
)

if exist "frontend\node_modules" (
    echo    ✅ Node.js dependencies installed
) else (
    echo    ⚠️  Node.js dependencies not installed
)

echo.
echo 🖥️  Service Status:

REM Check backend
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Backend API ^(http://localhost:8000^)
) else (
    echo    ❌ Backend API not responding
)

REM Check frontend
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Frontend ^(http://localhost:3000^)
) else (
    echo    ❌ Frontend not responding
)

echo.
echo 🐳 Docker Services:
docker-compose ps 2>nul | findstr "Up" >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Docker services are running
    docker-compose ps
) else (
    echo    ❌ Docker services are not running
    echo    Run: docker-compose up -d
)

echo.
echo 🔧 Useful Commands:
echo.
echo Docker Development:
echo    Start:     docker-compose up -d
echo    Stop:      docker-compose down
echo    Logs:      docker-compose logs -f
echo    Rebuild:   docker-compose build --no-cache
echo.
echo Local Development:
echo    Setup:     setup-dev.bat
echo    Backend:   start-backend.bat
echo    Frontend:  start-frontend.bat
echo.
echo Testing:
echo    API Test:  python test-setup.py
echo    Health:    curl http://localhost:8000/health
echo    Frontend:  curl http://localhost:3000
echo.
echo 📝 Quick Start:
echo    1. For Docker: deploy.bat
echo    2. For local dev: setup-dev.bat
echo    3. Test setup: python test-setup.py

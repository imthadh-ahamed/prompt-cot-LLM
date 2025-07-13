@echo off
REM Prompt Engineering Playground Deployment Script for Windows
REM This script sets up the development environment

echo 🚀 Setting up Prompt Engineering ^& Chain-of-Thought Playground
echo ==============================================================

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    echo Visit: https://docs.docker.com/get-docker/
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    echo Visit: https://docs.docker.com/compose/install/
    exit /b 1
)

echo 1. Checking environment files...

REM Check if .env files exist
if not exist "backend\.env" (
    echo ❌ Missing backend\.env file
    echo Please copy and configure: copy backend\.env.example backend\.env
    goto :env_error
)

if not exist "frontend\.env.local" (
    echo ❌ Missing frontend\.env.local file
    echo Please copy and configure: copy frontend\.env.local.example frontend\.env.local
    goto :env_error
)

echo 2. Validating configuration...

REM Check API keys (basic validation)
findstr /C:"OPENAI_API_KEY=sk-" backend\.env >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Warning: OPENAI_API_KEY not set or invalid in backend\.env
    echo    Please add your OpenAI API key for full functionality.
)

echo 3. Setting up data directory...
if not exist "data" mkdir data

echo 4. Building and starting services...
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

echo.
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check if services are running
docker-compose ps | findstr "Up" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Services are running!
) else (
    echo ⚠️  Services may still be starting. Check status with:
    echo    docker-compose ps
    echo    docker-compose logs
)

echo.
echo 🌐 Application URLs:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:8000
echo    API Documentation: http://localhost:8000/docs
echo.
echo 📋 Useful commands:
echo    View logs: docker-compose logs -f
echo    Stop services: docker-compose down
echo    Restart services: docker-compose restart
echo    View status: docker-compose ps
echo.
echo 🎉 Prompt Engineering Playground is ready!
echo    Open http://localhost:3000 to get started.

goto :end

:env_error
echo.
echo Please copy and configure the environment files:
echo    copy backend\.env.example backend\.env
echo    copy frontend\.env.local.example frontend\.env.local
echo.
echo Then edit them with your API keys and configuration.
exit /b 1

:end

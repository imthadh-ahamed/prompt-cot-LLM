@echo off
REM Development Setup Script for Windows
REM Sets up local development environment without Docker

echo 🛠️  Setting up Local Development Environment
echo =============================================

echo 1. Checking prerequisites...

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

REM Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    exit /b 1
)

echo ✅ Prerequisites check passed

echo 2. Setting up environment files...

if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env"
    echo 📄 Created backend\.env from template
)

if not exist "frontend\.env.local" (
    copy "frontend\.env.local.example" "frontend\.env.local"
    echo 📄 Created frontend\.env.local from template
)

echo ⚠️  Please edit the environment files with your API keys:
echo    - backend\.env ^(add your LLM API keys^)
echo    - frontend\.env.local ^(configure API URL if needed^)

echo 3. Setting up backend...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 🐍 Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment and install dependencies
echo 📦 Installing Python dependencies...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Create directories
if not exist "logs" mkdir logs
if not exist "data" mkdir data

cd ..
echo ✅ Backend setup complete

echo 4. Setting up frontend...
cd frontend

REM Install dependencies
echo 📦 Installing Node.js dependencies...
npm install

cd ..
echo ✅ Frontend setup complete

echo 5. Creating startup scripts...

REM Backend startup script
echo @echo off > start-backend.bat
echo cd backend >> start-backend.bat
echo call venv\Scripts\activate.bat >> start-backend.bat
echo echo 🚀 Starting backend server... >> start-backend.bat
echo echo API will be available at http://localhost:8000 >> start-backend.bat
echo echo API docs will be available at http://localhost:8000/docs >> start-backend.bat
echo uvicorn main:app --reload --host 0.0.0.0 --port 8000 >> start-backend.bat

REM Frontend startup script
echo @echo off > start-frontend.bat
echo cd frontend >> start-frontend.bat
echo echo 🚀 Starting frontend development server... >> start-frontend.bat
echo echo Application will be available at http://localhost:3000 >> start-frontend.bat
echo npm run dev >> start-frontend.bat

echo ✅ Startup scripts created

echo.
echo 🎉 Development environment setup complete!
echo.
echo 📝 Next steps:
echo 1. Edit environment files with your API keys:
echo    - backend\.env ^(add OPENAI_API_KEY, etc.^)
echo    - frontend\.env.local ^(usually no changes needed^)
echo.
echo 2. Start development servers:
echo    start-backend.bat  # Start backend only
echo    start-frontend.bat # Start frontend only
echo.
echo 3. Open your browser:
echo    Frontend: http://localhost:3000
echo    API Docs: http://localhost:8000/docs
echo.
echo 📋 Useful commands:
echo    Backend tests: cd backend ^&^& python -m pytest
echo    Frontend tests: cd frontend ^&^& npm test
echo    Type checking: cd frontend ^&^& npm run type-check

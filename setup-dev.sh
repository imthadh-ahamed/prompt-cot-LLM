#!/bin/bash

# Development Setup Script
# Sets up local development environment without Docker

set -e

echo "🛠️  Setting up Local Development Environment"
echo "============================================="

# Check prerequisites
check_prerequisites() {
    echo "1. Checking prerequisites..."
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed. Please install npm first."
        exit 1
    fi
    
    echo "✅ Prerequisites check passed"
}

# Setup environment files
setup_env_files() {
    echo "2. Setting up environment files..."
    
    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        echo "📄 Created backend/.env from template"
    fi
    
    if [ ! -f "frontend/.env.local" ]; then
        cp frontend/.env.local.example frontend/.env.local
        echo "📄 Created frontend/.env.local from template"
    fi
    
    echo "⚠️  Please edit the environment files with your API keys:"
    echo "   - backend/.env (add your LLM API keys)"
    echo "   - frontend/.env.local (configure API URL if needed)"
}

# Setup backend
setup_backend() {
    echo "3. Setting up backend..."
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        echo "🐍 Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment and install dependencies
    echo "📦 Installing Python dependencies..."
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Create logs directory
    mkdir -p logs
    
    # Create data directory
    mkdir -p data
    
    cd ..
    echo "✅ Backend setup complete"
}

# Setup frontend
setup_frontend() {
    echo "4. Setting up frontend..."
    cd frontend
    
    # Install dependencies
    echo "📦 Installing Node.js dependencies..."
    npm install
    
    cd ..
    echo "✅ Frontend setup complete"
}

# Create startup scripts
create_startup_scripts() {
    echo "5. Creating startup scripts..."
    
    # Backend startup script
    cat > start-backend.sh << 'EOF'
#!/bin/bash
cd backend
source venv/bin/activate
echo "🚀 Starting backend server..."
echo "API will be available at http://localhost:8000"
echo "API docs will be available at http://localhost:8000/docs"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
EOF
    chmod +x start-backend.sh
    
    # Frontend startup script
    cat > start-frontend.sh << 'EOF'
#!/bin/bash
cd frontend
echo "🚀 Starting frontend development server..."
echo "Application will be available at http://localhost:3000"
npm run dev
EOF
    chmod +x start-frontend.sh
    
    # Combined startup script
    cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting development environment..."
echo "This will start both backend and frontend servers"
echo ""

# Start backend in background
./start-backend.sh &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
./start-frontend.sh &
FRONTEND_PID=$!

echo ""
echo "🌐 Services started:"
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo ""; echo "🛑 Stopping services..."; kill $BACKEND_PID $FRONTEND_PID; exit 0' INT
wait
EOF
    chmod +x start-dev.sh
    
    echo "✅ Startup scripts created"
}

# Show next steps
show_next_steps() {
    echo ""
    echo "🎉 Development environment setup complete!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Edit environment files with your API keys:"
    echo "   - backend/.env (add OPENAI_API_KEY, etc.)"
    echo "   - frontend/.env.local (usually no changes needed)"
    echo ""
    echo "2. Start development servers:"
    echo "   ./start-dev.sh     # Start both backend and frontend"
    echo "   ./start-backend.sh # Start only backend"
    echo "   ./start-frontend.sh # Start only frontend"
    echo ""
    echo "3. Open your browser:"
    echo "   Frontend: http://localhost:3000"
    echo "   API Docs: http://localhost:8000/docs"
    echo ""
    echo "📋 Useful commands:"
    echo "   Backend tests: cd backend && python -m pytest"
    echo "   Frontend tests: cd frontend && npm test"
    echo "   Type checking: cd frontend && npm run type-check"
}

# Main execution
main() {
    check_prerequisites
    setup_env_files
    setup_backend
    setup_frontend
    create_startup_scripts
    show_next_steps
}

# Handle script interruption
trap 'echo "❌ Setup interrupted"; exit 1' INT

# Run main function
main

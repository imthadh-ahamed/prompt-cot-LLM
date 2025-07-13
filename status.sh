#!/bin/bash

# Status Check Script
# Checks the current status of all services and components

echo "📊 Prompt Engineering Playground Status Check"
echo "=============================================="

# Check if Docker is running
check_docker() {
    echo "🐳 Docker Status:"
    if command -v docker &> /dev/null; then
        if docker info &> /dev/null; then
            echo "   ✅ Docker is running"
            return 0
        else
            echo "   ❌ Docker is installed but not running"
            return 1
        fi
    else
        echo "   ❌ Docker is not installed"
        return 1
    fi
}

# Check Docker services
check_docker_services() {
    echo ""
    echo "🔧 Docker Services:"
    if docker-compose ps | grep -q "Up"; then
        echo "   ✅ Docker services are running"
        docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
    else
        echo "   ❌ Docker services are not running"
        echo "   Run: docker-compose up -d"
    fi
}

# Check local development servers
check_local_services() {
    echo ""
    echo "🖥️  Local Services:"
    
    # Check backend
    if curl -s http://localhost:8000/health &> /dev/null; then
        echo "   ✅ Backend API (http://localhost:8000)"
    else
        echo "   ❌ Backend API not responding"
    fi
    
    # Check frontend
    if curl -s http://localhost:3000 &> /dev/null; then
        echo "   ✅ Frontend (http://localhost:3000)"
    else
        echo "   ❌ Frontend not responding"
    fi
}

# Check environment files
check_env_files() {
    echo ""
    echo "⚙️  Environment Configuration:"
    
    if [ -f "backend/.env" ]; then
        echo "   ✅ backend/.env exists"
        if grep -q "OPENAI_API_KEY=sk-" backend/.env 2>/dev/null; then
            echo "   ✅ OpenAI API key configured"
        else
            echo "   ⚠️  OpenAI API key not configured"
        fi
    else
        echo "   ❌ backend/.env missing"
    fi
    
    if [ -f "frontend/.env.local" ]; then
        echo "   ✅ frontend/.env.local exists"
    else
        echo "   ❌ frontend/.env.local missing"
    fi
}

# Check project structure
check_project_structure() {
    echo ""
    echo "📁 Project Structure:"
    
    local directories=("backend" "frontend" "backend/logs" "backend/data")
    local files=("backend/main.py" "frontend/package.json" "docker-compose.yml")
    
    for dir in "${directories[@]}"; do
        if [ -d "$dir" ]; then
            echo "   ✅ $dir/"
        else
            echo "   ❌ $dir/ missing"
        fi
    done
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            echo "   ✅ $file"
        else
            echo "   ❌ $file missing"
        fi
    done
}

# Check dependencies
check_dependencies() {
    echo ""
    echo "📦 Dependencies:"
    
    # Python
    if command -v python3 &> /dev/null; then
        echo "   ✅ Python $(python3 --version | cut -d' ' -f2)"
    else
        echo "   ❌ Python not found"
    fi
    
    # Node.js
    if command -v node &> /dev/null; then
        echo "   ✅ Node.js $(node --version)"
    else
        echo "   ❌ Node.js not found"
    fi
    
    # Check Python virtual environment
    if [ -d "backend/venv" ]; then
        echo "   ✅ Python virtual environment"
    else
        echo "   ⚠️  Python virtual environment not found"
    fi
    
    # Check Node modules
    if [ -d "frontend/node_modules" ]; then
        echo "   ✅ Node.js dependencies installed"
    else
        echo "   ⚠️  Node.js dependencies not installed"
    fi
}

# Show helpful commands
show_commands() {
    echo ""
    echo "🔧 Useful Commands:"
    echo ""
    echo "Docker Development:"
    echo "   Start:     docker-compose up -d"
    echo "   Stop:      docker-compose down"
    echo "   Logs:      docker-compose logs -f"
    echo "   Rebuild:   docker-compose build --no-cache"
    echo ""
    echo "Local Development:"
    echo "   Setup:     ./setup-dev.sh"
    echo "   Backend:   ./start-backend.sh"
    echo "   Frontend:  ./start-frontend.sh"
    echo "   Both:      ./start-dev.sh"
    echo ""
    echo "Testing:"
    echo "   API Test:  python test-setup.py"
    echo "   Health:    curl http://localhost:8000/health"
    echo "   Frontend:  curl http://localhost:3000"
}

# Main execution
main() {
    check_dependencies
    check_project_structure
    check_env_files
    
    # Check for Docker setup
    if check_docker; then
        check_docker_services
    fi
    
    # Check for local development
    check_local_services
    
    show_commands
    
    echo ""
    echo "📝 Quick Start:"
    echo "   1. For Docker: ./deploy.sh"
    echo "   2. For local dev: ./setup-dev.sh"
    echo "   3. Test setup: python test-setup.py"
}

main

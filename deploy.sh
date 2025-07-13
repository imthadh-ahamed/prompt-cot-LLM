#!/bin/bash

# Prompt Engineering Playground Deployment Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Prompt Engineering & Chain-of-Thought Playground"
echo "=============================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Function to check if .env files exist
check_env_files() {
    local missing_files=()
    
    if [ ! -f "backend/.env" ]; then
        missing_files+=("backend/.env")
    fi
    
    if [ ! -f "frontend/.env.local" ]; then
        missing_files+=("frontend/.env.local")
    fi
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        echo "❌ Missing environment files:"
        for file in "${missing_files[@]}"; do
            echo "   - $file"
        done
        echo ""
        echo "Please copy and configure the environment files:"
        echo "   cp backend/.env.example backend/.env"
        echo "   cp frontend/.env.local.example frontend/.env.local"
        echo ""
        echo "Then edit them with your API keys and configuration."
        exit 1
    fi
}

# Function to validate API keys
validate_api_keys() {
    echo "🔑 Checking API keys configuration..."
    
    if ! grep -q "OPENAI_API_KEY=sk-" backend/.env 2>/dev/null; then
        echo "⚠️  Warning: OPENAI_API_KEY not set or invalid in backend/.env"
        echo "   Please add your OpenAI API key for full functionality."
    fi
    
    if ! grep -q "ANTHROPIC_API_KEY=" backend/.env 2>/dev/null; then
        echo "ℹ️  Info: ANTHROPIC_API_KEY not set (optional)"
    fi
    
    if ! grep -q "HUGGINGFACE_API_KEY=" backend/.env 2>/dev/null; then
        echo "ℹ️  Info: HUGGINGFACE_API_KEY not set (optional)"
    fi
}

# Function to create data directory
create_data_dir() {
    echo "📁 Creating data directory..."
    mkdir -p data
    chmod 755 data
}

# Function to build and start services
start_services() {
    echo "🔨 Building and starting services..."
    docker-compose down --remove-orphans
    docker-compose build --no-cache
    docker-compose up -d
    
    echo ""
    echo "⏳ Waiting for services to start..."
    sleep 10
    
    # Check if services are healthy
    if docker-compose ps | grep -q "Up.*healthy"; then
        echo "✅ Services are running and healthy!"
    else
        echo "⚠️  Services may still be starting. Check status with:"
        echo "   docker-compose ps"
        echo "   docker-compose logs"
    fi
}

# Function to show service URLs
show_urls() {
    echo ""
    echo "🌐 Application URLs:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:8000"
    echo "   API Documentation: http://localhost:8000/docs"
    echo ""
    echo "📋 Useful commands:"
    echo "   View logs: docker-compose logs -f"
    echo "   Stop services: docker-compose down"
    echo "   Restart services: docker-compose restart"
    echo "   View status: docker-compose ps"
}

# Main execution
main() {
    echo "1. Checking environment files..."
    check_env_files
    
    echo "2. Validating configuration..."
    validate_api_keys
    
    echo "3. Setting up data directory..."
    create_data_dir
    
    echo "4. Building and starting services..."
    start_services
    
    echo "5. Setup complete!"
    show_urls
    
    echo ""
    echo "🎉 Prompt Engineering Playground is ready!"
    echo "   Open http://localhost:3000 to get started."
}

# Handle script interruption
trap 'echo "❌ Setup interrupted"; docker-compose down; exit 1' INT

# Run main function
main

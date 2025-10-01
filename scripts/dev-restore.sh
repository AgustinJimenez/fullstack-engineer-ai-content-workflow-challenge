#!/bin/bash

# Development restore script to switch backend back to Ollama
echo "🔧 Restoring development environment..."

# Check if docker compose or docker-compose is available
if command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

# Restart backend with Ollama (default for development)
echo "🔄 Configuring backend to use Ollama for development..."
$DOCKER_COMPOSE_CMD -f compose.dev.yml up -d backend

# Wait a moment for the backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 3

# Test the backend is working
echo "✅ Testing backend..."
if curl -s --max-time 5 http://localhost:8080/api/v1/health >/dev/null; then
    echo "✅ Backend is ready for development with Ollama"
else
    echo "❌ Backend health check failed"
    exit 1
fi
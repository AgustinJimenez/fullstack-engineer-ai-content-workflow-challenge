#!/bin/bash

# Test setup script to ensure backend uses fake AI provider
echo "🧪 Setting up test environment..."

# Check if docker compose or docker-compose is available
if command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

# Restart backend with fake AI provider
echo "🔄 Configuring backend to use fake AI provider for tests..."
AI_PROVIDER=fake $DOCKER_COMPOSE_CMD -f compose.dev.yml up -d backend

# Wait a moment for the backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 3

# Test the fake provider is working
echo "✅ Testing fake AI provider..."
if curl -s --max-time 5 http://localhost:8080/health >/dev/null; then
    echo "✅ Backend is ready for testing with fake AI provider"
else
    echo "❌ Backend health check failed"
    exit 1
fi
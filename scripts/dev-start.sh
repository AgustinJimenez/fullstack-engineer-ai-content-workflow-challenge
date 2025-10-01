#!/bin/bash

# Simple Development Startup Script
# Starts the development environment

set -e

echo "🚀 Starting Development Environment..."

# Check if .env exists, create basic one if not
if [ ! -f .env ]; then
    echo "📝 Creating basic .env file..."
    cp .env.example .env
fi

# Start development services
echo "🐳 Starting Docker containers..."
docker compose -f compose.dev.yml up
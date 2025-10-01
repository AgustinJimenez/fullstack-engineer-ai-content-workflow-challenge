#!/bin/bash

# AI Content Workflow System - Interactive Installation Script
# Supports Local LLM (Ollama), External APIs (OpenAI/Anthropic), and Hybrid setups

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

clear

echo -e "${BLUE}=🚀 AI Content Workflow System Setup${NC}"
echo ""
echo "Welcome to the AI Content Workflow System!"
echo ""
echo "This interactive script will help you configure your preferred AI setup."
echo ""

# Check prerequisites
echo -e "${CYAN}=⚙️ Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not available. Please install Docker Compose.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is installed${NC}"
echo ""

# Present options
echo -e "${BLUE}Choose your AI setup:${NC}"
echo ""
echo -e "${GREEN}1) 🏠 Local LLM (Ollama - Free & Private)${NC}"
echo "   ✅ Completely free and private"
echo "   ✅ No API keys required"
echo "   ✅ Works offline"
echo "   ⚠️ Requires ~4GB RAM, downloads 2.1GB model"
echo ""
echo -e "${CYAN}2) ☁️ External AI APIs (OpenAI/Anthropic)${NC}"
echo "   ✅ Faster responses"
echo "   ✅ No local resource usage"
echo "   ⚠️ Requires API keys (paid services)"
echo ""
echo -e "${YELLOW}3) 🔧 Hybrid Setup (Both Local + External)${NC}"
echo "   ✅ Best of both worlds"
echo "   ✅ Local LLM for development/testing"
echo "   ✅ External APIs for production"
echo ""

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo -e "${GREEN}Setting up Local LLM with Ollama...${NC}"
        echo ""
        echo "Choose your Ollama model:"
        echo "  Popular options:"
        echo "  - phi4-mini:latest (recommended, ~2.5GB)"
        echo "  - gemma3:1b (~815MB, lightweight)"
        echo "  - phi3:mini (~2.2GB)"
        echo "  - llama3.2:1b (~1.3GB, fastest)"
        echo "  - llama3.2:3b (~2.0GB)"
        echo ""
        read -p "Enter model name (default: phi4-mini:latest): " ollama_model
        ollama_model=${ollama_model:-phi4-mini:latest}
        
        # Create .env file for Ollama
        cp .env.example .env
        echo "AI_PROVIDER=ollama" >> .env
        echo "OLLAMA_MODEL=$ollama_model" >> .env
        
        echo -e "${YELLOW}Starting services with Ollama...${NC}"
        docker compose -f compose.dev.yml up -d
        
        echo -e "${CYAN}Setting up Ollama model '$ollama_model' (this may take a few minutes)...${NC}"
        sleep 5  # Wait for Ollama to start
        
        # Pull the model
        docker exec ai-content-ollama ollama pull "$ollama_model" || echo -e "${YELLOW}Model will be downloaded on first use${NC}"
        
        echo -e "${GREEN}✅ Local LLM setup complete!${NC}"
        ;;
        
    2)
        echo -e "${CYAN}Setting up External AI APIs...${NC}"
        
        cp .env.example .env
        
        echo ""
        echo "Choose your AI provider:"
        echo "1) OpenAI (GPT-4, GPT-3.5)"
        echo "2) Anthropic (Claude)"
        
        read -p "Enter choice (1-2): " api_choice
        
        if [ "$api_choice" = "1" ]; then
            read -p "Enter your OpenAI API key: " api_key
            echo "AI_PROVIDER=openai" >> .env
            echo "AI_API_KEY=$api_key" >> .env
        elif [ "$api_choice" = "2" ]; then
            read -p "Enter your Anthropic API key: " api_key
            echo "AI_PROVIDER=anthropic" >> .env
            echo "AI_API_KEY=$api_key" >> .env
        else
            echo -e "${RED}Invalid choice. Defaulting to OpenAI.${NC}"
            echo "AI_PROVIDER=openai" >> .env
        fi
        
        echo -e "${YELLOW}Starting services...${NC}"
        docker compose up -d --build
        
        echo -e "${GREEN}✅ External AI setup complete!${NC}"
        ;;
        
    3)
        echo -e "${YELLOW}Setting up Hybrid configuration...${NC}"
        echo ""
        echo "Choose your Ollama model:"
        echo "  Popular options:"
        echo "  - phi4-mini:latest (recommended, ~2.5GB)"
        echo "  - gemma3:1b (~815MB, lightweight)"
        echo "  - phi3:mini (~2.2GB)"
        echo "  - llama3.2:1b (~1.3GB, fastest)"
        echo "  - llama3.2:3b (~2.0GB)"
        echo ""
        read -p "Enter model name (default: phi4-mini:latest): " ollama_model
        ollama_model=${ollama_model:-phi4-mini:latest}
        
        cp .env.example .env
        echo "AI_PROVIDER=ollama" >> .env
        echo "OLLAMA_MODEL=$ollama_model" >> .env
        
        echo ""
        echo "Enter your API keys (press Enter to skip):"
        
        read -p "OpenAI API key: " openai_key
        read -p "Anthropic API key: " anthropic_key
        
        if [ ! -z "$openai_key" ]; then
            echo "OPENAI_API_KEY=$openai_key" >> .env
        fi
        
        if [ ! -z "$anthropic_key" ]; then
            echo "ANTHROPIC_API_KEY=$anthropic_key" >> .env
        fi
        
        echo -e "${YELLOW}Starting services with hybrid setup...${NC}"
        docker compose -f compose.dev.yml up -d
        
        echo -e "${CYAN}Setting up Ollama model '$ollama_model'...${NC}"
        sleep 5
        docker exec ai-content-ollama ollama pull "$ollama_model" || echo -e "${YELLOW}Model will be downloaded on first use${NC}"
        
        echo -e "${GREEN}✅ Hybrid setup complete!${NC}"
        ;;
        
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Installation Complete!${NC}"
echo ""
echo -e "${BLUE}=🌐 Access points:${NC}"
echo "  🖥️  Frontend:    http://localhost:3000"
echo "  🔧 Backend API: http://localhost:8080"
if [ "$choice" = "1" ] || [ "$choice" = "3" ]; then
    echo "  🤖 Ollama API:  http://localhost:11434"
fi
echo ""
echo -e "${BLUE}=📖 Next steps:${NC}"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Create your first campaign"
echo "3. Add content pieces and generate AI content"
echo ""
echo -e "${CYAN}=⚡ Useful commands:${NC}"
echo "  📊 View logs: docker compose logs -f"
echo "  🛑 Stop services: docker compose down"
echo "  🧪 Run tests: npm run test:e2e"
echo ""
echo -e "${YELLOW}=📚 Documentation: docs/HOW_TO_USE.md${NC}"
echo ""
echo "Happy content creating! 🚀"
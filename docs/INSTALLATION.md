# 🚀 Installation Guide

## Quick Start (Recommended)

The fastest way to get the AI Content Workflow system running is using our interactive installer:

```bash
git clone <repository-url>
cd fullstack-engineer-ai-content-workflow-challenge
./install.sh
```

## Installation Options

The installer provides three setup options to fit different needs:

### 🏠 Option 1: Local LLM (Self-hosted)

**Best for:** Privacy-focused users, offline work, cost-sensitive projects

**What it includes:**
- Ollama with Phi-4-mini-reasoning model
- Complete Docker stack
- No external dependencies

**Requirements:**
- ~4GB available RAM
- ~2.1GB disk space for model
- 10-15 minutes initial setup time

**Advantages:**
- ✅ Completely free
- ✅ Fully private (no data leaves your machine)
- ✅ Works offline
- ✅ No API rate limits

**Setup process:**
1. Choose "Local LLM" option
2. Select Docker (recommended) or local Ollama installation
3. Wait for model download and setup
4. System ready!

### ☁️ Option 2: External AI APIs

**Best for:** Production environments, teams needing fastest responses

**What it includes:**
- OpenAI and/or Anthropic API integration
- Lightweight Docker stack
- Quick setup

**Requirements:**
- Valid API keys (OpenAI and/or Anthropic)
- Internet connection
- API costs (pay-per-use)

**Advantages:**
- ✅ Fastest response times
- ✅ Latest AI models
- ✅ No local resource usage
- ✅ Scales automatically

**Setup process:**
1. Choose "External AI APIs" option
2. Enter your API keys
3. System validates and configures
4. Ready in under 5 minutes!

### 🔧 Option 3: Hybrid Setup

**Best for:** Development teams, flexible production environments

**What it includes:**
- Both local LLM and external API support
- Easy switching between providers
- Full feature set

**Requirements:**
- Local LLM requirements (RAM, disk space)
- Optional API keys for external providers

**Advantages:**
- ✅ Best of both worlds
- ✅ Switch providers via configuration
- ✅ Local for development, external for production
- ✅ Cost optimization flexibility

**Setup process:**
1. Choose "Hybrid" option
2. Sets up local LLM first
3. Optionally add API keys
4. Configure switching in .env file

## What Happens During Installation

### System Checks
- ✅ Docker and Docker Compose availability
- ✅ Docker daemon running
- ✅ System resources (for local LLM)

### Automatic Setup
- 🐳 Docker containers built and started
- 🗄️ Database with migrations applied
- 🔄 Redis cache configured
- 🤖 AI provider setup (local or external)
- 🌐 Frontend and backend services
- ✅ Health checks and validation

### Post-Installation
- 📊 Service status verification
- 🧪 Connection testing
- 📋 Usage instructions
- 🛠️ Management commands

## Manual Installation

If you prefer manual setup or need custom configuration:

### Local LLM Setup
```bash
# 1. Setup Phi-4 model
bash scripts/setup-phi4-reasoning.sh local

# 2. Configure environment
cp .env.example .env
# Edit .env: AI_PROVIDER=fake, OLLAMA_MODEL=phi-4-reasoning

# 3. Start services
docker compose up --build
```

### External APIs Setup
```bash
# 1. Configure environment
cp .env.example .env
# Edit .env: Add API keys, AI_PROVIDER=openai

# 2. Start services
docker compose up --build
```

### Docker-Only Local LLM
```bash
# Complete containerized setup
docker compose -f compose.ollama.yml up --build
```

## Troubleshooting

### Common Issues

**Docker not running:**
```bash
# Start Docker Desktop or daemon
sudo systemctl start docker  # Linux
open -a Docker  # macOS
```

**Port conflicts:**
```bash
# Check what's using ports
lsof -i :3000  # Frontend
lsof -i :8080  # Backend  
lsof -i :11434 # Ollama

# Stop conflicting services or change ports in compose files
```

**Ollama model download fails:**
```bash
# Check internet connection and try manual download
ollama pull phi-4-reasoning
```

**Out of memory (local LLM):**
```bash
# Free up RAM or use external APIs instead
docker system prune
```

### Getting Help

**Check service status:**
```bash
docker compose ps
docker compose logs [service-name]
```

**Test endpoints:**
```bash
curl http://localhost:8080/health  # Backend health
curl http://localhost:3000         # Frontend
curl http://localhost:11434/api/version  # Ollama (if local)
```

**Reset and restart:**
```bash
docker compose down
docker compose up --build
```

## Configuration

After installation, you can customize the system via the `.env` file:

### Key Settings

```bash
# AI Provider Selection
AI_PROVIDER=fake           # true=local LLM, false=external APIs
AI_PROVIDER=ollama         # ollama|openai|anthropic
OLLAMA_MODEL=phi-4-reasoning

# API Keys (for external providers)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Service URLs
OLLAMA_BASE_URL=http://host.docker.internal:11434  # Local Ollama
# OLLAMA_BASE_URL=http://ollama:11434               # Docker Ollama
```

### Switching Providers

**Local to External:**
```bash
# Edit .env
AI_PROVIDER=openai
AI_PROVIDER=openai

# Restart
docker compose restart
```

**External to Local:**
```bash
# Edit .env  
AI_PROVIDER=fake
AI_PROVIDER=ollama

# Restart
docker compose restart
```

## Next Steps

After successful installation:

1. **Access the application:** http://localhost:3000
2. **Create your first campaign**
3. **Generate AI content**
4. **Explore features:** translation, analysis, workflows
5. **Check documentation:** README.md, docs/ folder

## Support

- 📖 **Documentation:** README.md, docs/
- 🐛 **Issues:** GitHub Issues
- 💬 **Discussions:** GitHub Discussions
- 📧 **Contact:** See repository for contact information
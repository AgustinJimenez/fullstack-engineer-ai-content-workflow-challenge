# Local AI with Ollama & Phi-4-mini-reasoning

The system now includes **Phi-4-mini-reasoning** as the default local LLM model, providing high-quality AI responses for marketing content creation completely free and offline.

## Smart Behavior

| Configuration | Behavior | Use Case |
|---------------|----------|----------|
| `AI_PROVIDER=openai/anthropic` + API keys | ☁️ **Cloud AI** (OpenAI/Anthropic) | Production |
| `AI_PROVIDER=ollama` + Ollama running | 🏠 **Local LLM** (Phi-4-mini-instruct) | Development/Testing |
| `AI_PROVIDER=fake` + Ollama running | 🏠 **Local LLM** (Phi-4-mini-instruct) | Testing with real AI |
| `AI_PROVIDER=fake` + No Ollama | 🎭 **Mock strings** | Unit tests |

## Benefits

- ✅ **Real LLM responses** for testing (when Ollama available)
- ✅ **No API costs** - runs completely locally  
- ✅ **Automatic fallback** - works without any setup
- ✅ **Fast** - especially with Apple Silicon or NVIDIA GPUs
- ✅ **Perfect for E2E tests** - no rate limits or quotas

## Quick Setup

### 1. Automated Setup (Recommended)

Use our interactive installer:
```bash
./install.sh
# Choose option 1: Local LLM
```

Or use the dedicated Phi-4 setup script:
```bash
bash scripts/setup-phi4-reasoning.sh local
```

### 2. Manual Installation

**macOS/Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Download from [ollama.ai](https://ollama.ai/download)

**Verify installation:**
```bash
ollama --version
```

### 3. Setup Phi-4-mini-reasoning Model

**Automated (Recommended):**
```bash
bash scripts/setup-phi4-reasoning.sh local
```

**Manual Setup:**
```bash
# Download the GGUF model file
curl -L -o phi-4-mini-reasoning.gguf \
  "https://huggingface.co/unsloth/Phi-4-mini-reasoning-GGUF/resolve/main/Phi-4-mini-reasoning-Q4_K_M.gguf"

# Create optimized Modelfile
cat > Modelfile << 'EOF'
FROM ./phi-4-mini-reasoning.gguf

PARAMETER temperature 0.3
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER repeat_penalty 1.1

SYSTEM """You are Phi-4-mini, an advanced AI assistant specialized in reasoning and creative content generation for marketing purposes."""
EOF

# Create the model in Ollama
ollama create phi-4-reasoning -f Modelfile
```

**Alternative Models:**
```bash
# For testing/development:
ollama pull llama3.2:1b    # Lightweight option
ollama pull mistral:7b     # High quality option
```

**Verify models:**
```bash
ollama list
# Should show: phi-4-reasoning:latest
```

### 4. Configure Your Application

**Option A: Use Ollama as Primary Provider**
```bash
# .env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=phi-4-reasoning
AI_PROVIDER=openai
```

**Option B: Auto-Use Ollama When Testing (Recommended)**
```bash
# .env  
AI_PROVIDER=openai  # or anthropic for production
OPENAI_API_KEY=your_key_here

# Ollama for testing (auto-used when AI_PROVIDER=fake)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
AI_PROVIDER=openai
```

Now your tests automatically use Ollama:
```bash
AI_PROVIDER=fake npm run test:e2e  # Uses Ollama if running, otherwise mocks
```

### 4. Start Services

**Option A: With Docker Compose (Recommended)**

The backend container is configured to access Ollama on your host machine:

```bash
# Start Ollama on host
ollama serve  # Keep this running

# In another terminal, start the app
docker compose up
```

**Option B: Local Development**

```bash
# Start Ollama
ollama serve

# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev
```

## Testing Different Models

You can switch models at runtime without restarting:

**Via Environment Variable:**
```bash
# In .env
OLLAMA_MODEL=mistral
```

**Via API Request:**
```bash
curl -X POST http://localhost:8080/api/v1/content/123/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ollama",
    "prompt": "Make this more engaging"
  }'
```

**In Tests:**
```bash
AI_PROVIDER=ollama OLLAMA_MODEL=llama3.2 npm run test:e2e
```

## Recommended Models by Use Case

| Use Case | Model | Size | Speed | Quality |
|----------|-------|------|-------|---------|
| **E2E Testing** | `llama3.2` | 1.3GB | ⚡⚡⚡ | ⭐⭐⭐ |
| **Development** | `gemma2:2b` | 1.6GB | ⚡⚡ | ⭐⭐⭐⭐ |
| **Production-like** | `mistral` | 4.1GB | ⚡ | ⭐⭐⭐⭐⭐ |
| **Best Quality** | `llama3.1:8b` | 4.7GB | ⚡ | ⭐⭐⭐⭐⭐ |

## Performance Tips

### 1. Keep Ollama Warm
```bash
# Keep model loaded in memory
ollama run llama3.2 --keepalive 1h
```

### 2. Adjust Context Size
```bash
# In .env, for shorter responses (faster)
OLLAMA_NUM_CTX=2048

# For longer context (slower but more accurate)
OLLAMA_NUM_CTX=8192
```

### 3. Use GPU Acceleration

Ollama automatically uses:
- **Apple Silicon**: Metal acceleration
- **NVIDIA**: CUDA acceleration
- **AMD**: ROCm acceleration

## E2E Testing with Ollama

Replace `AI_PROVIDER=fake` with Ollama for more realistic tests:

**Before (Mock):**
```bash
AI_PROVIDER=fake npm run test:e2e
# Output: "AI-Generated: Sample content — Compelling & Engaging!"
```

**After (Real LLM):**
```bash
AI_PROVIDER=ollama npm run test:e2e
# Output: Real AI-generated content from Llama 3.2
```

## Troubleshooting

### Ollama Not Connecting

```bash
# Check if Ollama is running
curl http://localhost:11434/api/version

# Should return: {"version":"0.x.x"}
```

### Docker Can't Reach Host Ollama

The `docker-compose.yml` is configured with:
```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

And uses: `OLLAMA_BASE_URL=http://host.docker.internal:11434`

On **Linux**, if this doesn't work, use:
```bash
OLLAMA_BASE_URL=http://172.17.0.1:11434
```

### Model Too Slow

Switch to a smaller model:
```bash
ollama pull llama3.2  # 1.3GB, much faster
OLLAMA_MODEL=llama3.2 npm run test:e2e
```

### Out of Memory

Close other applications or use a smaller model:
```bash
ollama pull phi3:mini  # Only 2.3GB
```

## Comparison: Fake AI vs Ollama vs Cloud APIs

| Feature | `AI_PROVIDER=fake` | Ollama | OpenAI/Anthropic |
|---------|-------------------|--------|------------------|
| **Setup** | ✅ Instant | ⚠️ Download models | ✅ Just API key |
| **Cost** | ✅ Free | ✅ Free | ❌ $$ per request |
| **Quality** | ❌ Mock strings | ✅ Real LLM | ✅ Best quality |
| **Speed** | ⚡⚡⚡ Instant | ⚡⚡ Fast | ⚡ Network latency |
| **Offline** | ✅ Yes | ✅ Yes | ❌ No |
| **Testing** | ⚠️ Not realistic | ✅ Realistic | ✅ Production-like |
| **CI/CD** | ✅ Easy | ⚠️ Needs setup | ⚠️ Costs add up |

## Advanced: Running Ollama in Docker (Optional)

If you want Ollama inside Docker:

```yaml
# docker-compose.ollama.yml
services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]

volumes:
  ollama_models:
```

```bash
# Start Ollama in Docker
docker compose -f docker-compose.ollama.yml up -d

# Pull model inside container
docker exec ollama ollama pull llama3.2

# Update backend to use container
OLLAMA_BASE_URL=http://ollama:11434
```

## CI/CD with Ollama

For GitHub Actions (optional):

```yaml
- name: Setup Ollama
  run: |
    curl -fsSL https://ollama.ai/install.sh | sh
    ollama serve &
    sleep 5
    ollama pull llama3.2

- name: Run E2E Tests with Ollama
  env:
    AI_PROVIDER: ollama
    OLLAMA_MODEL: llama3.2
  run: npm run test:e2e
```

⚠️ **Note:** This increases CI time and resource usage. For CI, `AI_PROVIDER=fake` is usually better.

## API Compatibility

Ollama works seamlessly through LangChain. The code automatically handles:

```typescript
// backend/src/services/langchainService.ts
if (selectedProvider === 'ollama') {
  return new ChatOllama({
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.2',
    temperature: 0.7,
  });
}
```

All endpoints work the same:
- ✅ `/api/v1/content/:id/generate` - Content generation
- ✅ `/api/v1/content/:id/analyze` - Content analysis
- ✅ `/api/v1/content/:id/translate` - Translation
- ✅ `/api/v1/langchain/*` - LangChain workflows

## Example: Using in Development

```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Pull model (one time)
ollama pull llama3.2

# Terminal 3: Set environment and start app
cat > .env << EOF
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
AI_PROVIDER=openai
EOF

docker compose up
```

Now your app uses real AI locally! 🎉

## Resources

- [Ollama Official Site](https://ollama.ai)
- [Available Models](https://ollama.ai/library)
- [LangChain Ollama Docs](https://js.langchain.com/docs/integrations/chat/ollama)
- [Model Performance Benchmarks](https://ollama.ai/blog/models)
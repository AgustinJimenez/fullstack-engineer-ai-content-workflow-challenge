# Using GGUF Models with Ollama

Ollama natively supports GGUF (GPT-Generated Unified Format) models, making it easy to use models from Hugging Face and other sources.

## Quick Start: Using GGUF Models

### Method 1: Import Local GGUF File

```bash
# 1. Download a GGUF model (example: from TheBloke on Hugging Face)
curl -L -o mistral-7b.gguf https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf

# 2. Create a Modelfile
cat > Modelfile << 'EOF'
FROM ./mistral-7b.gguf

# Optional: Set parameters
PARAMETER temperature 0.7
PARAMETER top_p 0.9

# Optional: Set a custom prompt template
TEMPLATE """[INST] {{ .Prompt }} [/INST]"""
EOF

# 3. Create the model in Ollama
ollama create mistral-custom -f Modelfile

# 4. Run your custom model
ollama run mistral-custom "What is the capital of France?"

# 5. Use it in your app
OLLAMA_MODEL=mistral-custom npm run dev
```

### Method 2: Import from Hugging Face

```bash
# Many models are available directly
ollama run hf.co/mlabonne/NeuralHermes-2.5-Mistral-7B-GGUF

# Or specific quantization versions
ollama run hf.co/TheBloke/Llama-2-13B-chat-GGUF:q4_k_m
```

### Method 3: Convert and Import

```bash
# If you have a non-GGUF model, convert it first
# Using llama.cpp's convert script
python convert.py model-directory/ --outtype f16 --outfile model.gguf

# Then import to Ollama
ollama create mymodel -f Modelfile
```

## Popular GGUF Models for Ollama

### Small & Fast (Good for Testing)
```bash
# Phi-2 (2.7B) - Microsoft's small model
ollama pull phi

# TinyLlama (1.1B) - Ultra-fast
curl -L -o tinyllama.gguf https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf
```

### Medium (Balanced)
```bash
# Mistral 7B - Great quality/speed balance
ollama pull mistral

# Zephyr 7B - Fine-tuned for helpful responses
curl -L -o zephyr.gguf https://huggingface.co/TheBloke/zephyr-7B-beta-GGUF/resolve/main/zephyr-7b-beta.Q4_K_M.gguf
```

### Large (High Quality)
```bash
# Llama 2 13B
ollama pull llama2:13b

# Code Llama for programming
ollama pull codellama:13b
```

## Quantization Levels

GGUF models come in different quantization levels:

| Quantization | Size | Speed | Quality | Use Case |
|-------------|------|-------|---------|----------|
| Q2_K | Smallest | Fastest | Lower | Testing/Development |
| Q3_K_M | Small | Fast | Good | Development |
| Q4_K_M | **Medium** | **Fast** | **Good** | **Recommended** |
| Q5_K_M | Large | Medium | Better | Production |
| Q6_K | Larger | Slower | High | Quality-focused |
| Q8_0 | Largest | Slowest | Highest | Maximum quality |

## Using Custom GGUF Models in Your App

### 1. Configure Your Model

```bash
# Download a specialized model (e.g., marketing-focused)
curl -L -o marketing-llama.gguf [model-url]

# Create Modelfile with marketing-specific settings
cat > Modelfile << 'EOF'
FROM ./marketing-llama.gguf

PARAMETER temperature 0.8
PARAMETER top_p 0.95

SYSTEM """You are a creative marketing copywriter. 
Generate compelling, engaging content that converts.
Focus on emotional appeal and clear calls to action."""

TEMPLATE """[INST] <<SYS>>
{{ .System }}
<</SYS>>

{{ .Prompt }} [/INST]"""
EOF

# Import to Ollama
ollama create marketing-ai -f Modelfile
```

### 2. Update Your Environment

```bash
# .env
OLLAMA_MODEL=marketing-ai
OLLAMA_BASE_URL=http://localhost:11434
AI_PROVIDER=fake
```

### 3. Test Your Custom Model

```bash
# Test directly
ollama run marketing-ai "Create a headline for a fitness app"

# Or through your app
npm run dev
# Create content and see specialized marketing output!
```

## Advanced: Model Customization

### Custom System Prompts

```dockerfile
FROM ./model.gguf

# Specialized for your use case
SYSTEM """You are an AI content specialist for digital marketing.
Your responses should be:
- SEO-optimized
- Conversion-focused
- Brand-voice aware
- Emotionally engaging
Always provide multiple options."""
```

### Custom Parameters

```dockerfile
FROM ./model.gguf

# Adjust for creativity vs consistency
PARAMETER temperature 0.9    # Higher = more creative
PARAMETER top_k 40           # Vocabulary diversity
PARAMETER top_p 0.95        # Nucleus sampling
PARAMETER repeat_penalty 1.1 # Reduce repetition
PARAMETER num_predict 512    # Max tokens to generate
```

## Finding GGUF Models

### Best Sources:

1. **Hugging Face** - [TheBloke's Models](https://huggingface.co/TheBloke)
   - Hundreds of GGUF conversions
   - Multiple quantization options
   - Detailed model cards

2. **Ollama Library** - [ollama.ai/library](https://ollama.ai/library)
   - Pre-configured models
   - Optimized for Ollama

3. **LM Studio Models** - Compatible GGUFs
   - Download from LM Studio
   - Use directly in Ollama

## Example: Marketing-Optimized Setup

```bash
# 1. Get a creative writing model
curl -L -o nous-hermes.gguf \
  https://huggingface.co/TheBloke/Nous-Hermes-2-Mixtral-8x7B-DPO-GGUF/resolve/main/nous-hermes-2-mixtral-8x7b-dpo.Q4_K_M.gguf

# 2. Create marketing-focused configuration
cat > MarketingModelfile << 'EOF'
FROM ./nous-hermes.gguf

PARAMETER temperature 0.85
PARAMETER top_p 0.9

SYSTEM """You are a world-class marketing copywriter.
Create compelling content that:
1. Grabs attention immediately
2. Addresses customer pain points
3. Highlights unique value propositions
4. Includes clear calls-to-action
5. Uses power words and emotional triggers
Always provide 3-5 variations with different angles."""

TEMPLATE """### Human: {{ .Prompt }}
### Assistant:"""
EOF

# 3. Create and test
ollama create marketing-genius -f MarketingModelfile
ollama run marketing-genius "Create a headline for a productivity app"

# 4. Use in your app
OLLAMA_MODEL=marketing-genius docker compose up
```

## Performance Tips

### Memory Requirements
```bash
# Check available memory
ollama ps

# Estimate GGUF memory needs:
# Q4_K_M: ~4GB for 7B model
# Q4_K_M: ~8GB for 13B model
# Q4_K_M: ~16GB for 30B model
```

### Speed Optimization
```bash
# Use smaller quantization for speed
ollama create fast-model -f Modelfile-Q2K

# Limit context for faster responses
PARAMETER num_ctx 2048  # Instead of 4096
```

## Troubleshooting

### Model Won't Load
```bash
# Check model format
file model.gguf  # Should show "GGUF model file"

# Verify checksum
sha256sum model.gguf

# Check Ollama logs
ollama logs
```

### Poor Quality Output
- Try higher quantization (Q5_K_M or Q6_K)
- Adjust temperature (lower = more focused)
- Use better base model

### Slow Performance
- Use smaller model or lower quantization
- Reduce context size
- Check GPU utilization: `ollama ps`

## Your Current Setup

With your current configuration:
```bash
# You're using
OLLAMA_MODEL=llama3.2:1b

# You could upgrade to a specialized GGUF:
curl -L -o marketing-llama.gguf [specialized-model-url]
ollama create marketing-llama -f Modelfile
OLLAMA_MODEL=marketing-llama npm run dev
```

Now your AI Content Workflow will use a specialized marketing model optimized for your specific use case!
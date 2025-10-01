# Ollama with Phi-4-mini-reasoning model
FROM ollama/ollama:latest

# Create app directory
WORKDIR /app

# Download the Phi-4-mini-reasoning GGUF model
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Download the specific model file
RUN curl -L -o /tmp/phi-4-mini-reasoning.gguf \
    "https://huggingface.co/unsloth/Phi-4-mini-reasoning-GGUF/resolve/main/Phi-4-mini-reasoning-Q4_K_M.gguf"

# Create Modelfile with optimized settings for reasoning
RUN echo 'FROM /tmp/phi-4-mini-reasoning.gguf\n\
\n\
# Optimized parameters for reasoning tasks\n\
PARAMETER temperature 0.3\n\
PARAMETER top_p 0.9\n\
PARAMETER top_k 40\n\
PARAMETER repeat_penalty 1.1\n\
PARAMETER num_predict 512\n\
\n\
# System prompt optimized for marketing and content creation\n\
SYSTEM """You are Phi-4-mini, an advanced AI assistant specialized in reasoning and creative content generation.\n\
\n\
When creating marketing content:\n\
1. Think step-by-step about the target audience\n\
2. Consider emotional triggers and pain points\n\
3. Use persuasive language and clear calls-to-action\n\
4. Provide multiple creative variations\n\
5. Explain your reasoning behind each suggestion\n\
\n\
Always be helpful, creative, and provide actionable content."""\n\
\n\
# Template for consistent formatting\n\
TEMPLATE """<|user|>\n\
{{ .Prompt }}<|end|>\n\
<|assistant|>\n\
"""' > /tmp/Modelfile

# Start Ollama in background and create the model
RUN ollama serve & \
    sleep 10 && \
    ollama create phi-4-reasoning -f /tmp/Modelfile && \
    pkill ollama

# Cleanup
RUN rm -f /tmp/phi-4-mini-reasoning.gguf /tmp/Modelfile

# Expose Ollama port
EXPOSE 11434

# Start Ollama server
CMD ["ollama", "serve"]
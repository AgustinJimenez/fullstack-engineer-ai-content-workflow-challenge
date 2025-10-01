# Documentation Index

Complete documentation for the AI Content Workflow application.

## 📚 Core Documentation

### Getting Started
- **[Main README](../README.md)** - Project overview, quick start, features
- **[Installation Guide](../INSTALLATION.md)** - Interactive installation options
- **[How to Use Guide](HOW_TO_USE.md)** - Complete user guide with examples
- **[Development Guide](DEVELOPMENT.md)** - Local development setup and workflows

### Technical Documentation
- **[Architecture Overview](ARCHITECTURE.md)** - System design, data models, tech stack
- **[API Documentation](API.md)** - Complete REST and GraphQL API reference
- **[Real-time Events (SSE)](REALTIME.md)** - Server-Sent Events implementation
- **[LangChain & GraphQL](LANGCHAIN_GRAPHQL.md)** - Advanced workflows and subscriptions

### Testing & Quality
- **[Testing Guide](TESTING.md)** - E2E, integration, and unit testing strategies
- **[E2E Test Guide](../E2E-TEST-GUIDE.md)** - Playwright test documentation

### Deployment & Operations
- **[Kubernetes Guide](../k8s/README.md)** - Kubernetes deployment manifests
- **[ArgoCD Guide](ARGOCD.md)** - GitOps continuous delivery setup
- **[Service Commands](SERVICE_COMMANDS.md)** - Common operational commands

### AI & Local LLM
- **[Ollama Setup Guide](OLLAMA_SETUP.md)** - Local AI with Phi-4-mini-reasoning
- **[GGUF Models Guide](OLLAMA_GGUF_GUIDE.md)** - Using custom GGUF models
- **[LangChain & GraphQL](LANGCHAIN_GRAPHQL.md)** - Advanced workflows and subscriptions

### Additional Resources
- **[Implementation Guide](IMPLEMENTATION_GUIDE.md)** - Implementation decisions and patterns
- **[OpenAPI Spec](openapi.yaml)** - OpenAPI 3.0 specification (stub)
- **[Original Requirements](../README.OLD.md)** - Challenge specifications

## 🗂 Documentation Structure

```
docs/
├── README.md                    # This file
├── API.md                       # Complete API reference
├── ARCHITECTURE.md              # System architecture
├── ARGOCD.md                    # ArgoCD deployment guide
├── DEVELOPMENT.md               # Development guide
├── HOW_TO_USE.md               # User guide
├── IMPLEMENTATION_GUIDE.md      # Implementation details
├── LANGCHAIN_GRAPHQL.md        # LangChain & GraphQL
├── OLLAMA_SETUP.md             # Local AI setup guide
├── OLLAMA_GGUF_GUIDE.md        # GGUF models guide
├── REALTIME.md                 # SSE real-time events
├── SERVICE_COMMANDS.md         # Operational commands
├── TESTING.md                  # Testing strategies
├── openapi.yaml                # OpenAPI specification
└── testing/                    # Testing-related docs

Root installation files:
├── install.sh                  # Interactive installer
├── INSTALLATION.md             # Installation guide
└── scripts/setup-phi4-reasoning.sh  # Phi-4 model setup
```

## 🎯 Quick Navigation

### For New Users
1. Read [Main README](../README.md) for project overview
2. Use [Interactive Installer](../INSTALLATION.md) for easy setup
3. Or follow [Quick Start](../README.md#quick-start) to run manually
4. Check [How to Use Guide](HOW_TO_USE.md) for features

### For Developers
1. Read [Architecture Overview](ARCHITECTURE.md) for system design
2. Follow [Development Guide](DEVELOPMENT.md) for setup
3. Check [API Documentation](API.md) for endpoints
4. Review [Testing Guide](TESTING.md) for testing

### For DevOps/SRE
1. Check [Kubernetes Guide](../k8s/README.md) for deployment
2. Read [ArgoCD Guide](ARGOCD.md) for GitOps setup
3. Review [Service Commands](SERVICE_COMMANDS.md) for operations
4. Check health endpoints in [API Documentation](API.md#health--monitoring)

## 📖 Documentation Standards

All documentation follows these principles:
- **Clear and Concise**: Easy to understand, no jargon
- **Up to Date**: Reflects current implementation
- **Actionable**: Includes examples and commands
- **Comprehensive**: Covers all major features
- **Well-Organized**: Logical structure with navigation

## 🔍 Finding Information

### By Topic
- **AI Features**: [LangChain & GraphQL](LANGCHAIN_GRAPHQL.md), [API - AI Operations](API.md#ai-operations)
- **Real-time Updates**: [Real-time Events](REALTIME.md), [Architecture - Real-time](ARCHITECTURE.md#real-time-architecture)
- **Deployment**: [Kubernetes Guide](../k8s/README.md), [ArgoCD Guide](ARGOCD.md)
- **Testing**: [Testing Guide](TESTING.md), [E2E Test Guide](../E2E-TEST-GUIDE.md)
- **Development**: [Development Guide](DEVELOPMENT.md), [Service Commands](SERVICE_COMMANDS.md)

### By Role
- **Product Manager**: [How to Use Guide](HOW_TO_USE.md), [Main README](../README.md)
- **Frontend Developer**: [API Documentation](API.md), [Real-time Events](REALTIME.md)
- **Backend Developer**: [Architecture](ARCHITECTURE.md), [API Documentation](API.md)
- **QA Engineer**: [Testing Guide](TESTING.md), [E2E Test Guide](../E2E-TEST-GUIDE.md)
- **DevOps Engineer**: [Kubernetes Guide](../k8s/README.md), [ArgoCD Guide](ARGOCD.md)

## 🤝 Contributing to Documentation

When updating documentation:
1. Keep it accurate and current
2. Include code examples where helpful
3. Update table of contents if adding new sections
4. Cross-reference related docs
5. Test all commands and examples
6. Use clear headings and formatting

## 📝 Notes

- **Original Challenge**: See [README.OLD.md](../README.OLD.md) for requirements
- **Project Status**: See [TODO.md](../TODO.md) for current work (if exists)
- **Agents Guide**: See [AGENTS.md](../AGENTS.md) for AI agent instructions


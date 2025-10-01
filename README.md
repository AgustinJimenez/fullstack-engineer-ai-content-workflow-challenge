# AI Content Workflow System

A full-stack AI-powered content management system for creating, translating, and reviewing marketing content across multiple languages and campaigns.

## 🚀 Features

- **Campaign Management**: Create and manage marketing campaigns with multiple content pieces
- **AI Content Generation**: Generate compelling content using AI (provider-agnostic system)
- **Multi-language Support**: Automatic translation and localization to multiple target languages  
- **Content Analysis**: AI-powered analysis for keywords, tone, and sentiment
- **Review Workflow**: Human-in-the-loop approval process (draft → AI generated → review → approved/rejected)
- **Real-time Updates**: Live updates across all users using Server-Sent Events
- **Advanced Filtering**: Filter content by status, tone, sentiment, and keywords
- **Responsive UI**: Modern React interface with shadcn/ui components

## 🛠 Tech Stack

### Backend
- **Language**: TypeScript
- **Framework**: Express.js with Sequelize ORM
- **Database**: PostgreSQL
- **AI Integration**: Unified system supporting OpenAI, Anthropic, and Ollama (local LLM)
- **Real-time**: Server-Sent Events (SSE)
- **API**: RESTful API architecture

### Frontend  
- **Framework**: Next.js 14 (React)
- **UI Components**: shadcn/ui with Tailwind CSS
- **State Management**: React hooks and context
- **Testing**: Playwright for E2E testing

### Infrastructure
- **Containerization**: Docker with docker-compose
- **Database**: PostgreSQL with automated migrations
- **Environment**: Configurable for development, testing, and production

## 🚀 Quick Start

### Interactive Installation (Recommended)

The easiest way to get started is using our interactive installation script:

```bash
git clone <repository-url>
cd fullstack-engineer-ai-content-workflow-challenge
chmod +x install.sh
./install.sh
```

The installer will guide you through three options:

#### Option 1: 🏠 Local LLM (Self-hosted)
- ✅ **Completely free and private**
- ✅ **No API keys required**
- ✅ **Works offline**
- Uses Ollama with Phi-4-mini model
- Requires ~4GB RAM, downloads 2.5GB model

#### Option 2: ☁️ External AI APIs
- ✅ **Faster responses**
- ✅ **No local resource usage**
- Supports OpenAI and Anthropic
- Requires API keys (paid services)

#### Option 3: 🔧 Hybrid Setup
- ✅ **Best of both worlds**
- Local LLM for development/testing
- External APIs for production

### Manual Installation

If you prefer manual setup:

### Prerequisites
- Docker and Docker Compose
- For local LLM: ~4GB available RAM
- For external APIs: OpenAI or Anthropic API key

### 1. Clone the Repository
```bash
git clone <repository-url>
cd fullstack-engineer-ai-content-workflow-challenge
```

### 2. Choose Your Setup

**Option A: Use Cloud AI (OpenAI/Anthropic)**
```bash
cp .env.example .env

# Configure your AI settings in .env
AI_PROVIDER=openai          # or 'anthropic'
AI_API_KEY=your_api_key_here
```

**Option B: Local AI with Ollama (Recommended for Development)**
```bash
# Configure .env for local AI
cp .env.example .env
echo "AI_PROVIDER=ollama" >> .env
echo "OLLAMA_MODEL=phi4-mini:latest" >> .env
echo "OLLAMA_BASE_URL=http://localhost:11434" >> .env

# For hybrid setup, also add API keys:
# echo "OPENAI_API_KEY=your_key_here" >> .env
# echo "ANTHROPIC_API_KEY=your_key_here" >> .env
```

**Option C: Fake AI for Testing/Development**
```bash
cp .env.example .env

# Use fake AI provider for testing
AI_PROVIDER=fake
OLLAMA_BASE_URL=http://localhost:11434  # Optional: will use Ollama if available
OLLAMA_MODEL=phi4-mini:latest
```

**Smart AI Provider Behavior:**
- `AI_PROVIDER=openai/anthropic` → Uses cloud AI APIs (production)
- `AI_PROVIDER=ollama` → Uses local Ollama installation
- `AI_PROVIDER=fake` + Ollama running → Uses real local LLM (testing)
- `AI_PROVIDER=fake` + No Ollama → Falls back to mocks (unit tests)

See [Ollama Setup Guide](docs/OLLAMA_SETUP.md) and [GGUF Models Guide](docs/OLLAMA_GGUF_GUIDE.md) for detailed instructions.

### 3. Start the Application
```bash
# Start all services (database, backend, frontend)
docker-compose up --build

# Or start in detached mode
docker-compose up --build -d
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Database**: PostgreSQL on localhost:5432

### 5. First Steps
1. Open http://localhost:3000 in your browser
2. Click "Create Campaign" to create your first campaign
3. Add content pieces and generate AI content
4. Follow the [How to Use Guide](docs/HOW_TO_USE.md) for detailed instructions

## ⚡ Quick Development Workflow

For regular development, you only need these commands:

```bash
# Start development environment
npm run dev                    # Full Docker setup

# Run tests  
npm run test:e2e              # E2E tests with fake AI
npm run test:e2e:html         # E2E tests with HTML report

# Database management
./scripts/manage-db.sh reset  # Reset database
./scripts/manage-db.sh status # Check database status

# View logs
npm run logs                  # All services
npm run logs:backend          # Backend only
npm run logs:frontend         # Frontend only

# Stop services
npm run down                  # Stop all containers
```

## 📚 Documentation

- **[How to Use Guide](docs/HOW_TO_USE.md)** - Complete user guide with examples
- **[Ollama Setup Guide](docs/OLLAMA_SETUP.md)** - Use local LLM instead of cloud APIs
- **[API Documentation](docs/API.md)** - REST API endpoints and examples
- **[Architecture Guide](docs/ARCHITECTURE.md)** - System design and architecture
- **[Development Guide](docs/DEVELOPMENT.md)** - Development setup and workflows
- **[Testing Guide](docs/TESTING.md)** - Testing strategies and commands

## 🔧 Development

### Local Development Setup
```bash
# Quick start (recommended)
npm run dev              # Uses docker compose with dev settings

# Alternative development options
npm run dev:simple       # Simple docker compose start
npm run dev:prod         # Production-like build
npm run dev:local        # Run backend/frontend locally (no Docker)

# Manual setup (if needed)
npm install              # Install root dependencies
cd backend && npm install && cd ../frontend && npm install
docker compose up db -d  # Start database only
```

### Running Tests
```bash
# E2E tests (requires services running)
npm run test:e2e

# E2E tests with different reporters
npm run test:e2e:html       # HTML report
npm run test:e2e:headed     # With browser UI
npm run test:e2e:junit      # JUnit XML report

# Backend unit tests
cd backend && npm test

# Frontend component tests
cd frontend && npm test
```

### Database Management
```bash
# Reset database (development)
./scripts/manage-db.sh reset

# Run migrations
./scripts/manage-db.sh migrate

# Check database status
./scripts/manage-db.sh status

# Seed database with sample data
npm run seed              # Create 3000 campaigns with content
npm run seed:small        # Create 100 campaigns (faster)
npm run seed:large        # Create 5000 campaigns
npm run seed:clear        # Clear all data then seed with defaults
```

### Database Seeding

The application includes comprehensive database seeders to populate your development environment with realistic sample data:

**Quick Seeding Commands:**
```bash
# Standard seeding (3000 campaigns)
npm run seed

# Small dataset for testing (100 campaigns)
npm run seed:small

# Large dataset for performance testing (5000 campaigns)
npm run seed:large

# Clear existing data and reseed
npm run seed:clear
```

**What Gets Seeded:**
- **Campaigns**: Marketing campaigns with realistic names, descriptions, and target languages
- **Content Pieces**: Various content types (headlines, descriptions, CTAs, social posts, etc.)
- **AI Generations**: Simulated AI-generated content with metadata
- **Translations**: Multi-language translations with quality scores
- **Reviews**: Human review workflow data with feedback

**Seeder Features:**
- **Realistic Data**: Uses Faker.js for authentic-looking content
- **Relationships**: Proper foreign key relationships between all entities
- **Variety**: Different content types, statuses, and workflows
- **Performance**: Efficient batch processing for large datasets
- **Configurable**: Customizable via command-line options

**Manual Seeding Options:**
```bash
# Run seeder directly with custom options
docker exec ai-content-backend npx ts-node src/seeders/index.ts --count=500 --clear

# Available options:
# --count=N    Number of campaigns to create (default: 3000)
# --clear      Clear existing data before seeding
# --quiet      Minimal output during seeding
```

The seeders create a realistic development environment with:
- Mixed campaign statuses (active, paused, completed)
- Content in various stages of the workflow
- AI generations with different providers and models
- Multi-language translations
- Review workflow data with human feedback

## 🎯 AI Integration Design

### Unified AI Provider System
Our AI integration uses a **provider-agnostic architecture**:

**Supported Providers:**
- ☁️ **OpenAI** (GPT-4, GPT-3.5-turbo)
- ☁️ **Anthropic** (Claude 3.5 Sonnet, Claude 3 Haiku)
- 🏠 **Ollama** (Phi-4-mini, Gemma 3, Llama 3.2, Mistral) - **FREE & Local!**

**Why This Approach?**
- **Flexibility**: Easy to switch between providers
- **Cost Optimization**: Use free local models for dev/testing, cloud for production
- **Risk Mitigation**: Not dependent on a single AI provider
- **Privacy**: Run completely offline with Ollama
- **Future-Proof**: Easy to add new providers (Google, Cohere, etc.)

**Configuration**:
```bash
# Cloud AI
AI_PROVIDER=openai    # or 'anthropic'
AI_API_KEY=your_key

# Local LLM (no API key needed!)
AI_PROVIDER=ollama
OLLAMA_MODEL=phi4-mini:latest

# Fake AI for testing/development
AI_PROVIDER=fake
```

**Benefits**:
- Single configuration point
- Provider-specific optimizations handled automatically
- Consistent API interface regardless of provider
- Fallback and error handling per provider

### AI Features Implemented

1. **Content Generation**
   - Context-aware content creation
   - Content type-specific prompting (headlines, descriptions, CTAs)
   - Maintains brand voice and style

2. **Translation & Localization**
   - Automatic translation to target languages
   - Quality scoring for translations
   - Language-specific content review

3. **Content Analysis**
   - Keyword extraction
   - Tone detection (professional, casual, enthusiastic, etc.)
   - Sentiment analysis with confidence scores
   - Structured data extraction

4. **Human-in-the-Loop Workflow**
   - AI suggestions require human approval
   - Review process with feedback tracking
   - Per-language review capabilities

## 🏗 Architecture Decisions

### REST API Choice
**Why REST over GraphQL?**
- **Simplicity**: Straightforward endpoint design for CRUD operations
- **Caching**: Better HTTP caching for campaign and content data
- **Real-time**: SSE integrates naturally with REST endpoints
- **Tooling**: Extensive ecosystem and testing tools

**API Design Principles**:
- Resource-based URLs (`/api/v1/campaigns/{id}/content`)
- Consistent HTTP status codes
- Comprehensive error handling
- Pagination for large datasets

### Database Design
**PostgreSQL Choice**:
- **ACID Compliance**: Critical for content workflow integrity
- **JSON Support**: Flexible metadata storage for AI analysis
- **Performance**: Excellent for complex queries and filtering
- **Scaling**: Proven at enterprise scale

**Key Design Decisions**:
- Separate tables for campaigns, content, AI generations, and reviews
- JSON metadata for flexible AI analysis data
- Proper foreign key relationships
- Migration-based schema evolution

### Real-time Updates
**Server-Sent Events (SSE) over WebSockets**:
- **Simplicity**: One-way communication fits our use case
- **Reliability**: Automatic reconnection and error handling
- **HTTP-Friendly**: Works with standard web infrastructure
- **Resource Efficient**: Lower overhead than WebSockets

## 🧪 Testing Strategy

### End-to-End Testing
- **Framework**: Playwright for cross-browser testing
- **Coverage**: Full user workflows from campaign creation to approval
- **Environment**: Dockerized test environment with real database
- **AI Testing**: Fake AI responses for consistent testing

### Test Categories
1. **Campaign Management**: Create, edit, delete campaigns
2. **Content Workflow**: Complete content lifecycle testing
3. **AI Integration**: AI generation, translation, and analysis
4. **Real-time Features**: SSE event handling
5. **UI Components**: Interactive elements and forms

## 🚀 Deployment

### Docker Production Setup
```bash
# Production build
docker-compose -f compose.yml -f compose.prod.yml up --build

# With environment overrides
AI_PROVIDER=anthropic AI_API_KEY=prod_key docker-compose up --build
```

### Kubernetes Deployment

The application includes complete Kubernetes manifests for production deployment:

```bash
# Deploy using kubectl
cd k8s
./deploy.sh

# Or deploy manually
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f postgres-deployment.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f ingress.yaml
kubectl apply -f hpa.yaml
```

See the [Kubernetes Deployment Guide](k8s/README.md) for detailed instructions.

### GitOps with ArgoCD

For automated GitOps-based deployment:

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Deploy application with ArgoCD
kubectl apply -f k8s/argocd-project.yaml
kubectl apply -f k8s/argocd-application.yaml

# Monitor deployment
argocd app sync ai-content-workflow --watch
```

See the [ArgoCD Deployment Guide](docs/ARGOCD.md) for complete setup and configuration.

### Environment Variables
```bash
# Required
AI_PROVIDER=openai|anthropic|ollama|fake
AI_API_KEY=your_api_key  # Not required for ollama or fake

# Optional
DATABASE_URL=postgresql://...
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-api-domain.com
OLLAMA_BASE_URL=http://localhost:11434  # For ollama or fake with Ollama
OLLAMA_MODEL=phi4-mini:latest
```

## 🔍 Monitoring and Debugging

### Health Checks
- **Backend**: `GET /api/health` - Database and AI provider status
- **Database**: Connection pooling and query monitoring
- **AI Providers**: Rate limiting and error tracking

### Logging
- Structured logging with request tracing
- AI API call monitoring and error tracking
- Performance metrics for database queries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm run test:e2e:docker`)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📈 Performance Considerations

- **Database Indexing**: Optimized queries for campaigns and content
- **Pagination**: Efficient handling of large datasets
- **Caching**: HTTP caching for static content
- **AI Rate Limiting**: Respect provider rate limits
- **Lazy Loading**: Content loaded on demand

## 🔒 Security

- **Input Validation**: All user inputs validated and sanitized
- **API Keys**: Secure environment variable handling
- **CORS**: Configured for production domains
- **SQL Injection**: Parameterized queries with Sequelize ORM

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🎯 Quick Links

- **[User Guide](docs/HOW_TO_USE.md)** - Start here if you're new to the system
- **[API Docs](docs/API.md)** - Complete API reference
- **[Architecture](docs/ARCHITECTURE.md)** - Technical deep dive
- **[Kubernetes Guide](k8s/README.md)** - Kubernetes deployment
- **[ArgoCD Guide](docs/ARGOCD.md)** - GitOps with ArgoCD
- **[Original Requirements](README.OLD.md)** - Challenge specifications

Built with ❤️ for ACME GLOBAL MEDIA's content workflow needs.
# AI Content Workflow Backend

A comprehensive backend service for AI-powered content creation, translation, and review workflows. This service provides both REST and GraphQL APIs for managing marketing campaigns, generating content using multiple AI models, and handling translation and approval processes.

## 🚀 Features

- **Dual API Support**: REST and GraphQL APIs for flexible data access
- **Multi-Model AI Generation**: Support for OpenAI and Anthropic models with side-by-side comparison
- **Advanced Workflows**: LangChain integration for complex AI workflows
- **Translation Services**: Automated content translation with quality scoring
- **Review System**: Content approval workflows with feedback
- **Content Analysis**: Sentiment analysis, keyword extraction, and tone detection
- **Monitoring**: Comprehensive health checks and Prometheus metrics
- **Production Ready**: Docker support, CI/CD pipeline, and observability

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Architecture](#-architecture)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Monitoring](#-monitoring)
- [Contributing](#-contributing)

## 🏃 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the database:**
   ```bash
   # Using Docker
   docker-compose up -d postgres
   
   # Or use your local PostgreSQL instance
   # Create database: ai_content_workflow
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Access the services:**
   - REST API: http://localhost:8080/api/v1
   - GraphQL API: http://localhost:8080/graphql
   - Health Check: http://localhost:8080/health
   - API Metrics: http://localhost:8080/metrics

## 📚 API Documentation

### Complete Documentation
- **[API Documentation](./docs/api-documentation.md)** - Comprehensive guide covering both REST and GraphQL APIs
- **[OpenAPI Specification](./docs/openapi.yaml)** - Machine-readable REST API specification
- **[GraphQL Schema](./docs/graphql.md)** - GraphQL implementation details

### Quick API Examples

#### REST API
```bash
# Create a campaign
curl -X POST http://localhost:8080/api/v1/campaigns \
  -H "Content-Type: application/json" \
  -d '{"name": "Summer Campaign", "targetLanguages": ["es", "fr"]}'

# Generate AI content
curl -X POST http://localhost:8080/api/v1/content/1/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create compelling headline"}'
```

#### GraphQL API
```graphql
# Query campaigns with content
query {
  campaigns {
    id
    name
    contentPieces {
      id
      type
      aiGenerations {
        generatedText
        modelVersion
      }
    }
  }
}
```

### Interactive API Exploration
- **GraphQL Playground**: http://localhost:8080/graphql (development only)
- **Swagger UI**: Use tools like [Swagger Editor](https://editor.swagger.io/) with our OpenAPI spec

## 🏗 Architecture

### System Design
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   AI Services   │
                       │   OpenAI        │
                       │   Anthropic     │
                       │   LangChain     │
                       └─────────────────┘
```

### Key Components
- **Express.js**: REST API server with comprehensive middleware
- **Apollo Server**: GraphQL API with Type-GraphQL integration
- **Sequelize ORM**: Database abstraction with PostgreSQL
- **AI Integration**: OpenAI and Anthropic APIs with model comparison
- **LangChain**: Advanced AI workflow orchestration
- **Monitoring**: Health checks, metrics, and observability

### Database Schema
```sql
-- Core entities
Campaigns (id, name, description, status, languages)
ContentPieces (id, campaign_id, type, content, status)
AIGenerations (id, content_id, text, model, metadata)
Translations (id, content_id, language, text, quality)
Reviews (id, content_id, status, feedback)
```

## 💻 Development

### Project Structure
```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── graphql/         # GraphQL schema & resolvers
│   ├── config/          # Configuration files
│   └── utils/           # Utility functions
├── tests/               # Test suites
├── docs/                # Documentation
├── migrations/          # Database migrations
└── docker/              # Docker configuration
```

### Development Commands
```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Linting and formatting
npm run lint
npm run format

# Database migrations
npm run migrate
npm run migrate:undo
```

### Environment Configuration
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_content_workflow
DB_USER=postgres
DB_PASS=password

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
USE_FAKE_AI=false  # Set to true for testing without API keys

# Application
NODE_ENV=development
PORT=8080
FRONTEND_URL=http://localhost:3000
```

## 🧪 Testing

### Test Suites
- **Unit Tests**: Individual function and service testing
- **Integration Tests**: API endpoint testing with test database
- **E2E Tests**: Full workflow testing (handled by frontend)

### Running Tests
```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Test coverage
npm run test:coverage

# Test with fake AI (no API keys needed)
USE_FAKE_AI=true npm test
```

### Test Configuration
```bash
# Test database
DB_NAME=ai_content_test
USE_FAKE_AI=true  # Enables mock AI responses for testing
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build image
docker build -t ai-content-backend .

# Run with docker-compose
docker-compose up -d

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Environment-Specific Deployment
- **[Kubernetes Manifests](./docs/kubernetes/)** - Production Kubernetes deployment
- **[ArgoCD Configuration](./docs/argocd/)** - GitOps deployment setup
- **[Environment Configuration](./docs/environment.md)** - Environment-specific settings

### Production Checklist
- [ ] Set environment variables
- [ ] Configure database with connection pooling
- [ ] Set up SSL/TLS certificates
- [ ] Configure monitoring and alerting
- [ ] Set up log aggregation
- [ ] Enable rate limiting
- [ ] Configure backup strategies

## 📊 Monitoring

### Health Checks
- **`/health`** - Comprehensive system health
- **`/health/live`** - Kubernetes liveness probe
- **`/health/ready`** - Kubernetes readiness probe
- **`/metrics`** - Prometheus metrics
- **`/info`** - Application information

### Observability Stack
```yaml
# Prometheus metrics collection
# Grafana dashboards
# Alert manager integration
# Structured logging with Winston
# Distributed tracing support
```

### Key Metrics
- Request latency and throughput
- Database connection health
- AI service response times
- Memory and CPU usage
- Error rates by endpoint

**[Full Monitoring Guide](./docs/monitoring.md)**

## 🛠 API Integration Patterns

### Hybrid API Architecture
This service implements both REST and GraphQL APIs:

- **REST**: Simple CRUD operations, file uploads, caching
- **GraphQL**: Complex queries, flexible data fetching, real-time updates

### Best Practices
- Use REST for simple operations and standard HTTP patterns
- Use GraphQL for complex data relationships and mobile clients
- Implement proper error handling across both API types
- Follow consistent naming conventions
- Provide comprehensive documentation

## 🔐 Security

### Security Features
- CORS configuration for cross-origin requests
- Helmet.js for security headers
- Input validation with class-validator
- SQL injection prevention with ORM
- Rate limiting (to be implemented)

### Production Security
- Implement authentication (JWT recommended)
- Add authorization/RBAC
- Enable HTTPS enforcement
- Set up API key management
- Configure security monitoring

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Submit a pull request

### Code Standards
- Follow TypeScript best practices
- Maintain test coverage above 80%
- Use conventional commit messages
- Document new APIs and features
- Follow existing code style

### Pull Request Process
1. Ensure CI passes (tests, linting, build)
2. Update documentation if needed
3. Add or update tests for new features
4. Request review from maintainers

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` directory for detailed guides
- **Issues**: Report bugs and request features on GitHub
- **Discussions**: Use GitHub Discussions for questions and ideas

## 🔄 API Versioning

Current version: `v1`

We follow semantic versioning for the API:
- Breaking changes → new major version (`v2`)
- New features → new minor version features
- Bug fixes → patch version updates

---

## Recent Updates

### Version 1.0.0
- ✅ REST API with full CRUD operations
- ✅ GraphQL API with Type-GraphQL integration
- ✅ Multi-model AI content generation (OpenAI + Anthropic)
- ✅ LangChain workflow integration
- ✅ Comprehensive monitoring and health checks
- ✅ Production-ready CI/CD pipeline
- ✅ Complete API documentation
- ✅ Docker containerization support

---

**Built with ❤️ for modern content workflows**
# Architecture Overview

Complete system architecture for the AI Content Workflow application.

## System Architecture

```
┌───────────────────────────────────────────────────────┐
│                     Frontend (Next.js 14)                    │
│  - React Server Components + Client Components              │
│  - Shadcn/ui + Tailwind CSS                                 │
│  - SSE Client for real-time updates                         │
│  - GraphQL Client (Apollo/urql)                             │
└───────────────────┬───────────────────────────────────┘
                    │
                    │ HTTP/REST + SSE + GraphQL/Subscriptions
                    │
┌───────────────────┴───────────────────────────────────┐
│               Backend API (Express + TypeScript)             │
│                                                               │
│  REST API        GraphQL API       SSE Events                │
│  ├─ Campaigns     ├─ Queries        ├─ Real-time updates      │
│  ├─ Content       ├─ Mutations      └─ Event streaming        │
│  ├─ AI Ops        └─ Subscriptions                             │
│  ├─ LangChain                                                │
│  └─ Reviews                                                  │
│                                                               │
│  Controllers ←→ Services ←→ Models (Sequelize ORM)         │
└────────┬──────────────────┬────────────────────────────┘
         │                  │
         │                  │
┌────────┴───────┐  ┌────────┴────────────────────┐
│   PostgreSQL  │  │    AI Providers              │
│   Database    │  │  - OpenAI (GPT-4, GPT-3.5) │
│               │  │  - Anthropic (Claude)      │
│  + Redis      │  │  - Ollama (Local LLMs)     │
│  (Event Bus)  │  │  - Fake (Mock for testing) │
│               │  │  - LangChain Framework     │
│               │  └───────────────────────────┘
└─────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: Shadcn/ui components
- **Styling**: Tailwind CSS
- **State Management**: React hooks, Context API
- **Real-time**: SSE (Server-Sent Events)
- **GraphQL**: Apollo Client (for subscriptions)

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Sequelize
- **API Styles**: REST + GraphQL
- **Real-time**: SSE + GraphQL Subscriptions
- **AI Integration**: LangChain, OpenAI SDK, Anthropic SDK, Ollama

### Data Layer
- **Primary Database**: PostgreSQL 15+
- **Event Bus**: Redis (for distributed SSE)
- **Migrations**: Sequelize migrations

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes
- **GitOps**: ArgoCD
- **CI/CD**: GitHub Actions
- **Testing**: Playwright (E2E), Jest (Unit)

## Data Model

### Core Entities

#### Campaign
```typescript
{
  id: number
  name: string
  description: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  defaultLanguage: string (ISO 639-1)
  targetLanguages: string[] (ISO 639-1)
  createdAt: timestamp
  updatedAt: timestamp
  
  // Relations
  contentPieces: ContentPiece[]
}
```

#### ContentPiece
```typescript
{
  id: number
  campaignId: number
  type: 'headline' | 'description' | 'body_content' | 'cta' | 'tagline' | 'social_post'
  originalContent: string
  language: string (ISO 639-1)
  status: 'draft' | 'under_review' | 'approved' | 'rejected'
  createdAt: timestamp
  updatedAt: timestamp
  
  // Relations
  campaign: Campaign
  aiGenerations: AIGeneration[]
  translations: Translation[]
  reviews: Review[]
}
```

#### AIGeneration
```typescript
{
  id: number
  contentPieceId: number
  aiModel: 'openai' | 'anthropic' | 'ollama' | 'fake'
  modelVersion: string (e.g., 'gpt-4', 'claude-3-opus')
  promptUsed: string
  generatedText: string
  metadata: json {
    temperature?: number
    tokensUsed?: number
    processingTime?: number
  }
  createdAt: timestamp
  
  // Relations
  contentPiece: ContentPiece
}
```

#### Translation
```typescript
{
  id: number
  contentPieceId: number
  targetLanguage: string (ISO 639-1)
  translatedText: string
  aiModel: 'openai' | 'anthropic' | 'ollama' | 'fake'
  status: 'pending' | 'completed' | 'failed'
  qualityScore: number (0-1)
  createdAt: timestamp
  
  // Relations
  contentPiece: ContentPiece
}
```

#### Review
```typescript
{
  id: number
  contentPieceId: number
  reviewerName: string
  status: 'approved' | 'rejected' | 'needs_revision'
  feedback: string
  language: string (ISO 639-1)
  reviewedAt: timestamp
  
  // Relations
  contentPiece: ContentPiece
}
```

## Request Flow

### Content Generation Flow
```
1. User clicks "Generate AI Content" in UI
2. Frontend: POST /api/v1/ai/generate/:contentId
3. Backend: 
   - aiController.generateContent()
   - Calls AI provider (OpenAI/Anthropic)
   - Saves AIGeneration to database
   - Emits SSE event 'aiGenerationCreated'
4. Frontend: 
   - Receives SSE event
   - Refreshes content display
   - Shows new AI-generated text
```

### Translation Flow
```
1. User selects target language and clicks "Translate"
2. Frontend: POST /api/v1/ai/translate/:contentId
3. Backend:
   - aiController.translateContent()
   - Calls AI provider for translation
   - Calculates quality score
   - Saves Translation to database
   - Emits SSE event 'translationCreated'
4. Frontend:
   - Receives SSE event
   - Updates translations list
   - Shows quality score badge
```

### Review Workflow
```
1. Content creator submits for review
   POST /api/v1/content/:id/submit-for-review
   
2. Reviewer views content:
   GET /api/v1/content/for-review?language=es
   
3. Reviewer approves/rejects:
   POST /api/v1/content/reviews
   { contentPieceId, status, feedback, language }
   
4. Backend emits SSE event 'reviewCreated'

5. UI updates status badge for that language
   GET /api/v1/content/:id/status-rollup
```

### LangChain Smart Workflow
```
1. User triggers smart workflow
2. POST /api/v1/langchain/smart-workflow
3. LangChain chains:
   a) Generate enhanced content (GPT-4)
   b) Analyze content (extract keywords, tone, sentiment)
   c) Translate to multiple languages in parallel
4. Returns complete workflow result
5. Frontend displays all results in modal
```

## Real-time Architecture

### Server-Sent Events (SSE)

**Why SSE over WebSockets?**
- Simpler implementation (one-way: server → client)
- Automatic reconnection
- Works with standard HTTP
- Lower overhead for our use case
- No need for bidirectional communication

**Event Flow**:
```
Database Change → Event Bus (Redis) → SSE Broadcaster → All Connected Clients
```

**Event Types**:
- `campaignCreated`, `campaignUpdated`, `campaignDeleted`
- `contentCreated`, `contentUpdated`, `contentDeleted`
- `aiGenerationCreated`
- `translationCreated`
- `reviewCreated`
- `workflowCompleted`

### GraphQL Subscriptions

For more complex real-time needs:
```graphql
subscription {
  contentUpdated {
    id
    originalContent
    status
    translations {
      targetLanguage
      translatedText
    }
  }
}
```

## API Architecture

### REST API

**Advantages**:
- Simple, well-understood pattern
- Great HTTP caching
- Easy testing and debugging
- Excellent tooling

**Structure**:
```
/api/v1/
  /campaigns       - Campaign CRUD
  /content         - Content CRUD + reviews
  /ai              - AI operations
  /langchain       - LangChain workflows
  /events/stream   - SSE endpoint
  /health          - Health checks
```

### GraphQL API

**Advantages**:
- Flexible queries (request exactly what you need)
- Strong typing
- Real-time subscriptions
- Single endpoint

**Schema**:
```graphql
type Query {
  campaigns: [Campaign!]!
  campaign(id: ID!): Campaign
  content(id: ID!): ContentPiece
}

type Mutation {
  createCampaign(input: CreateCampaignInput!): Campaign!
  updateContent(id: ID!, input: UpdateContentInput!): ContentPiece!
}

type Subscription {
  campaignUpdated: Campaign!
  contentUpdated: ContentPiece!
}
```

## AI Provider Architecture

### Provider-Agnostic Design

```typescript
interface AIProvider {
  generateContent(prompt: string, options: AIOptions): Promise<string>
  translate(text: string, targetLang: string): Promise<Translation>
  analyze(text: string): Promise<Analysis>
}

class OpenAIProvider implements AIProvider { ... }
class AnthropicProvider implements AIProvider { ... }
class OllamaProvider implements AIProvider { ... }  // Local LLM
class FakeProvider implements AIProvider { ... }    // Testing
```

**Provider Selection Priority**:
- Environment variable `AI_PROVIDER` takes precedence
- When set to `fake` or `ollama`, ignores frontend model selection
- Automatic fallback to mock responses in test environment

**Benefits**:
- Easy to switch providers
- Compare model outputs
- Fallback if one provider fails
- Cost optimization

### LangChain Integration

```typescript
// Chain multiple operations
const chain = new SequentialChain([
  new LLMChain({ llm: openai, prompt: generatePrompt }),
  new LLMChain({ llm: openai, prompt: analyzePrompt }),
  new TransformChain({ transform: translateToMultipleLanguages })
]);

const result = await chain.call({ input: userContent });
```

## Security Architecture

### Input Validation
- All inputs validated with Zod schemas
- SQL injection prevented by Sequelize ORM
- XSS prevention in frontend

### API Keys
- Stored in environment variables
- Never exposed to frontend
- Rotated regularly

### CORS
- Configured for specific domains
- Credentials properly handled

### Rate Limiting
- Per-endpoint rate limits
- AI provider rate limit respect
- Exponential backoff on failures

## Deployment Architecture

### Docker Compose (Development)
```yaml
services:
  postgres:   # Database
  redis:      # Event bus
  ollama:     # Local LLM server (Ollama)
  backend:    # API server
  frontend:   # Next.js app
```

**Ollama Integration**:
- Automatically started with `npm run dev`
- Downloads models on first run
- Accessible at `http://localhost:11434`

### Kubernetes (Production)
```
Namespace: ai-content-workflow
  - Frontend Deployment (3 replicas)
  - Backend Deployment (3 replicas)
  - PostgreSQL StatefulSet (1 replica)
  - Redis Deployment (1 replica)
  - Ingress (nginx)
  - HPA (auto-scaling)
  - Network Policies
```

### GitOps with ArgoCD
```
Git Repository (source of truth)
  ↓
ArgoCD (monitors & syncs)
  ↓
Kubernetes Cluster (desired state)
```

## Testing Architecture

### E2E Testing (Playwright)
- Full user workflows
- Cross-browser testing
- Visual regression
- Fake AI provider for consistent test results
- Optional Ollama integration for realistic testing

### Integration Testing
- API endpoint testing
- Database operations
- AI provider mocking

### Unit Testing (Jest)
- Service layer logic
- Utility functions
- Component testing

## Monitoring & Observability

### Health Checks
- `/health` - Overall health
- `/health/live` - Liveness probe
- `/health/ready` - Readiness probe

### Metrics
- Prometheus metrics at `/metrics`
- Database query performance
- AI API call latency
- Error rates

### Logging
- Structured JSON logs
- Request ID tracing
- Error stack traces

## Performance Considerations

### Database
- Indexes on foreign keys
- Pagination for large datasets
- Connection pooling

### Caching
- HTTP caching headers
- Redis for session data
- Static asset caching

### AI Optimization
- Request batching
- Response caching (when appropriate)
- Streaming responses
- Token limit management

## Scalability

### Horizontal Scaling
- Stateless backend (scales easily)
- Redis for distributed events
- Database read replicas (if needed)

### Auto-scaling
- HPA based on CPU/memory
- Custom metrics (requests/sec)
- Min 3, max 10 replicas

---

For more details:
- [API Documentation](API.md)
- [Real-time Events](REALTIME.md)
- [LangChain Workflows](LANGCHAIN_GRAPHQL.md)
- [Deployment Guide](../k8s/README.md)
- [ArgoCD Setup](ARGOCD.md)


# API Documentation

## Base URL

**Development**: `http://localhost:8080`  
**Production**: Configure via `NEXT_PUBLIC_API_URL` environment variable

**Authentication**: None (local dev)  
**Content-Type**: `application/json`  
**API Version**: v1 (prefix: `/api/v1`)

## AI Provider Configuration

**Environment Variables**:
- `AI_PROVIDER`: Select AI provider (`openai`, `anthropic`, `ollama`, `fake`)
- `OPENAI_API_KEY`: API key for OpenAI
- `ANTHROPIC_API_KEY`: API key for Anthropic
- `OLLAMA_BASE_URL`: Base URL for Ollama (default: `http://localhost:11434`)
- `OLLAMA_MODEL`: Model to use with Ollama (default: `phi4-mini:latest`)

**Provider Priority**:
When `AI_PROVIDER` is set to `fake` or `ollama`, the environment setting takes precedence over any frontend model selection.

---

## 📋 Table of Contents

1. [Campaigns](#campaigns)
2. [Content](#content)
3. [Reviews](#reviews)
4. [AI Operations](#ai-operations)
5. [LangChain Workflows](#langchain-workflows)
6. [Health & Monitoring](#health--monitoring)
7. [Real-time Events (SSE)](#real-time-events-sse)
8. [GraphQL API](#graphql-api)
9. [Error Handling](#error-handling)

---

## Campaigns

### Create Campaign
```http
POST /api/v1/campaigns
Content-Type: application/json

{
  "name": "Summer 2025 Campaign",
  "description": "Marketing campaign for summer products",
  "defaultLanguage": "en",
  "targetLanguages": ["es", "fr", "de"]
}
```

**Response**: `201 Created`
```json
{
  "id": 1,
  "name": "Summer 2025 Campaign",
  "description": "Marketing campaign for summer products",
  "status": "draft",
  "defaultLanguage": "en",
  "targetLanguages": ["es", "fr", "de"],
  "createdAt": "2025-01-27T10:00:00.000Z",
  "updatedAt": "2025-01-27T10:00:00.000Z"
}
```

### List Campaigns
```http
GET /api/v1/campaigns
```

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "name": "Summer 2025 Campaign",
    "contentPieces": [...],
    ...
  }
]
```

### Get Campaign
```http
GET /api/v1/campaigns/:id
```

**Response**: `200 OK` - Campaign with full relations (content pieces, AI generations, reviews)

### Update Campaign
```http
PUT /api/v1/campaigns/:id
Content-Type: application/json

{
  "name": "Updated Campaign Name",
  "status": "active",
  "targetLanguages": ["es", "fr", "de", "it"]
}
```

**Response**: `200 OK` - Updated Campaign

### Delete Campaign
```http
DELETE /api/v1/campaigns/:id
```

**Response**: `204 No Content`

### Delete All Campaigns (Dev Only)
```http
DELETE /api/v1/campaigns
```

**Response**: `204 No Content`

### Get Campaign Stats
```http
GET /api/v1/campaigns/stats
```

**Response**: `200 OK`
```json
{
  "totalCampaigns": 10,
  "activeCampaigns": 5,
  "totalContent": 50,
  "contentByStatus": {
    "draft": 10,
    "under_review": 15,
    "approved": 25
  }
}
```

---

## Content

### Create Content
```http
POST /api/v1/content
Content-Type: application/json

{
  "campaignId": 1,
  "type": "headline",
  "originalContent": "Check out our amazing products!",
  "language": "en"
}
```

**Content Types**: `headline`, `description`, `body_content`, `cta`, `tagline`, `social_post`

**Response**: `201 Created`

### Create Content for Campaign
```http
POST /api/v1/campaigns/:id/content
Content-Type: application/json

{
  "type": "description",
  "originalContent": "Our products are amazing...",
  "language": "en"
}
```

**Response**: `201 Created`

### Get Campaign Content
```http
GET /api/v1/campaigns/:id/content
```

**Response**: `200 OK` - Array of ContentPiece with relations

### Get Content
```http
GET /api/v1/content/:id
```

**Response**: `200 OK` - ContentPiece with campaign, aiGenerations, reviews, translations

### Update Content
```http
PUT /api/v1/content/:id
Content-Type: application/json

{
  "originalContent": "Updated content text",
  "status": "approved"
}
```

**Response**: `200 OK`

### Delete Content
```http
DELETE /api/v1/content/:id
```

**Response**: `204 No Content`

---

## Reviews

### Submit Content for Review
```http
POST /api/v1/content/:id/submit-for-review
```

**Response**: `200 OK`
```json
{
  "message": "Content submitted for review",
  "contentPiece": { ... }
}
```

### Create Review
```http
POST /api/v1/content/reviews
Content-Type: application/json

{
  "contentPieceId": 1,
  "reviewerName": "John Doe",
  "status": "approved",
  "feedback": "Looks great!",
  "language": "en"
}
```

**Review Status**: `approved`, `rejected`, `needs_revision`

**Response**: `201 Created`

### Get Reviews for Content
```http
GET /api/v1/content/:contentId/reviews
```

**Response**: `200 OK` - Array of Review objects

### Get Content for Review
```http
GET /api/v1/content/for-review?language=es
```

**Response**: `200 OK` - ContentPiece[] filtered by language

### Get Status Rollup
```http
GET /api/v1/content/:id/status-rollup
```

**Response**: `200 OK`
```json
{
  "contentPieceId": 1,
  "statusByLanguage": {
    "en": "approved",
    "es": "under_review",
    "fr": "draft"
  },
  "counts": {
    "approved": 1,
    "under_review": 1,
    "draft": 1
  },
  "overallStatus": "partially_approved"
}
```

---

## AI Operations

### Generate Content
```http
POST /api/v1/ai/generate/:contentId
Content-Type: application/json

{
  "model": "openai",
  "prompt": "Generate an engaging headline for summer products",
  "seed": 42  // Optional: for deterministic output with supported providers
}
```

**AI Models**: 
- `openai` - OpenAI GPT-4
- `anthropic` - Claude 3 Haiku
- `ollama` - Local LLM via Ollama (requires Ollama running)
- `fake` - Mock responses for testing (instant, no API calls)

**Response**: `201 Created`
```json
{
  "id": 1,
  "contentPieceId": 1,
  "aiModel": "openai",
  "modelVersion": "gpt-4",
  "promptUsed": "Generate an engaging headline...",
  "generatedText": "Summer Deals: Your Perfect Season Starts Here!",
  "metadata": { ... },
  "createdAt": "2025-01-27T10:00:00.000Z"
}
```

### Translate Content
```http
POST /api/v1/ai/translate/:contentId
Content-Type: application/json

{
  "targetLanguage": "es",
  "aiModel": "openai"
}
```

**Response**: `201 Created`
```json
{
  "id": 1,
  "contentPieceId": 1,
  "targetLanguage": "es",
  "translatedText": "Ofertas de Verano: Tu Temporada Perfecta Comienza Aquí!",
  "aiModel": "openai",
  "status": "completed",
  "qualityScore": 0.95,
  "createdAt": "2025-01-27T10:00:00.000Z"
}
```

### Analyze Content
```http
POST /api/v1/ai/analyze/:contentId
Content-Type: application/json

{
  "aiModel": "openai"
}
```

**Response**: `200 OK`
```json
{
  "keywords": ["summer", "deals", "season", "products"],
  "tone": "enthusiastic",
  "sentiment": {
    "label": "positive",
    "score": 0.92
  },
  "readabilityScore": 85,
  "wordCount": 8
}
```

### Get AI Generations
```http
GET /api/v1/ai/generations/:contentId
```

**Response**: `200 OK` - AIGeneration[] (newest first)

### Compare AI Models
```http
POST /api/v1/ai/compare/:contentId
Content-Type: application/json

{
  "prompt": "Generate an engaging headline"
}
```

**Response**: `200 OK`
```json
{
  "openai": {
    "generatedText": "...",
    "model": "gpt-4",
    "processingTime": 1200
  },
  "anthropic": {
    "generatedText": "...",
    "model": "claude-3-opus",
    "processingTime": 1100
  },
  "comparison": {
    "faster": "anthropic",
    "timeDifference": 100
  }
}
```

---

## LangChain Workflows

### Smart Workflow (Generate → Analyze → Translate)
```http
POST /api/v1/langchain/smart-workflow
Content-Type: application/json

{
  "content": "Check out our new product",
  "contentType": "headline",
  "targetLanguages": ["es", "fr", "de"],
  "provider": "openai"
}
```

**Response**: `200 OK`
```json
{
  "original": "Check out our new product",
  "generated": "Discover Our Revolutionary New Product - Transform Your Experience Today!",
  "analysis": {
    "keywords": ["discover", "revolutionary", "product", "transform"],
    "tone": "enthusiastic",
    "sentiment": { "label": "positive", "score": 0.95 }
  },
  "translations": {
    "es": "¡Descubre Nuestro Revolucionario Producto Nuevo!",
    "fr": "Découvrez Notre Nouveau Produit Révolutionnaire!",
    "de": "Entdecken Sie Unser Revolutionäres Neues Produkt!"
  },
  "metadata": {
    "workflow": "generate → analyze → translate",
    "steps": 5,
    "provider": "openai",
    "timestamp": "2025-01-27T10:00:00.000Z"
  }
}
```

### Enhancement Chain (Enhance → Refine → Summarize)
```http
POST /api/v1/langchain/enhancement-chain
Content-Type: application/json

{
  "content": "Our product is good",
  "contentType": "description",
  "provider": "anthropic"
}
```

**Response**: `200 OK`
```json
{
  "original": "Our product is good",
  "enhanced": "Our premium product delivers exceptional quality...",
  "refined": "Experience unparalleled excellence with our premium product...",
  "summary": "Premium product offering exceptional quality and value.",
  "metadata": { ... }
}
```

### Multi-Language Chain (Parallel Translation)
```http
POST /api/v1/langchain/multi-language
Content-Type: application/json

{
  "content": "Welcome to our platform",
  "languages": ["es", "fr", "de", "it", "pt"],
  "provider": "openai"
}
```

**Response**: `200 OK` - Translations for all specified languages

### Workflow for Existing Content
```http
POST /api/v1/langchain/content/:contentId/workflow
Content-Type: application/json

{
  "workflowType": "smart-workflow",
  "targetLanguages": ["es", "fr"]
}
```

**Response**: `200 OK` - Workflow results saved to database

---

## Health & Monitoring

### Health Check
```http
GET /api/v1/health
```

**Response**: `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T10:00:00.000Z",
  "database": "connected",
  "aiProvider": "openai",
  "uptime": 3600
}
```

### Liveness Probe
```http
GET /api/v1/health/live
```

**Response**: `200 OK` - `{ "status": "alive" }`

### Readiness Probe
```http
GET /api/v1/health/ready
```

**Response**: `200 OK` if ready, `503 Service Unavailable` if not

### Metrics
```http
GET /api/v1/metrics
```

**Response**: `200 OK` - Prometheus-compatible metrics

### Application Info
```http
GET /api/v1/info
```

**Response**: `200 OK`
```json
{
  "name": "ai-content-workflow",
  "version": "1.0.0",
  "environment": "production",
  "nodeVersion": "18.x"
}
```

---

## Real-time Events (SSE)

### Subscribe to Events
```http
GET /api/v1/events/stream
```

**Response**: `200 OK` - Server-Sent Events stream

**Event Types**:
- `campaignCreated`
- `campaignUpdated`
- `campaignDeleted`
- `contentCreated`
- `contentUpdated`
- `contentDeleted`
- `aiGenerationCreated`
- `translationCreated`
- `reviewCreated`
- `workflowCompleted`

**Example Event**:
```
event: contentCreated
data: {"id":1,"type":"headline","campaignId":1,...}

```

See [Real-time Documentation](REALTIME.md) for details.

---

## GraphQL API

**Endpoint**: `http://localhost:8080/graphql`

**Playground**: Available in development at `http://localhost:8080/graphql`

### Example Query
```graphql
query {
  campaigns {
    id
    name
    contentPieces {
      id
      type
      originalContent
      aiGenerations {
        generatedText
        aiModel
      }
    }
  }
}
```

### Example Mutation
```graphql
mutation {
  createCampaign(input: {
    name: "Summer Campaign"
    description: "Marketing campaign"
    targetLanguages: ["es", "fr"]
  }) {
    id
    name
    status
  }
}
```

### GraphQL Subscriptions
```graphql
subscription {
  contentUpdated {
    id
    originalContent
    status
  }
}
```

See [LangChain & GraphQL Documentation](LANGCHAIN_GRAPHQL.md) for details.

---

## Error Handling

### Error Response Format
```json
{
  "error": "Error message",
  "message": "Detailed error description",
  "statusCode": 400
}
```

### HTTP Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `204 No Content` - Successful deletion
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

### Common Errors

**Campaign not found**:
```json
{
  "error": "Campaign not found",
  "statusCode": 404
}
```

**Invalid content type**:
```json
{
  "error": "Invalid content type. Must be one of: headline, description, body_content, cta, tagline, social_post",
  "statusCode": 400
}
```

**AI provider error**:
```json
{
  "error": "AI provider error",
  "message": "Rate limit exceeded. Please try again later.",
  "statusCode": 429
}
```

---

## Rate Limiting

AI endpoints have rate limiting to respect provider limits:

- **OpenAI**: Respects tier-based rate limits
- **Anthropic**: Configured for tier-based limits
- **Retry Logic**: Automatic retry with exponential backoff

---

## Additional Resources

- [Architecture Overview](ARCHITECTURE.md)
- [Real-time Events Guide](REALTIME.md)
- [LangChain Workflows](LANGCHAIN_GRAPHQL.md)
- [Development Guide](DEVELOPMENT.md)
- [Testing Guide](TESTING.md)


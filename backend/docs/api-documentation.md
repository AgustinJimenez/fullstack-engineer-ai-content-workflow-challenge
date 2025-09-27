# AI Content Workflow API Documentation

## Overview

The AI Content Workflow API provides both REST and GraphQL interfaces for managing AI-powered content creation, translation, and review workflows. This comprehensive documentation covers all available endpoints, data models, and usage examples.

## Base URLs

- **REST API**: `http://localhost:8080/api/v1`
- **GraphQL API**: `http://localhost:8080/graphql`
- **Health & Monitoring**: `http://localhost:8080`

## Authentication

Currently, the API does not require authentication. In production deployments, implement appropriate authentication and authorization mechanisms.

## Data Models

### Campaign
Represents a marketing campaign containing multiple content pieces.

```typescript
interface Campaign {
  id: number;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'completed';
  defaultLanguage: string;
  targetLanguages: string[];
  createdAt: string;
  updatedAt: string;
  contentPieces?: ContentPiece[];
}
```

### Content Piece
Individual content items within a campaign.

```typescript
interface ContentPiece {
  id: number;
  campaignId: number;
  type: 'headline' | 'description' | 'blog_post' | 'social_media' | 'email';
  originalContent?: string;
  language: string;
  status: 'draft' | 'ai_generated' | 'under_review' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  aiGenerations?: AIGeneration[];
  translations?: Translation[];
  reviews?: Review[];
}
```

### AI Generation
AI-generated content variations.

```typescript
interface AIGeneration {
  id: number;
  contentPieceId: number;
  generatedText: string;
  promptUsed?: string;
  modelVersion: string;
  metadata?: string; // JSON containing analysis data
  createdAt: string;
}
```

### Translation
Translated versions of content.

```typescript
interface Translation {
  id: number;
  contentPieceId: number;
  targetLanguage: string;
  translatedText: string;
  status: 'draft' | 'completed';
  qualityScore?: number;
  createdAt: string;
}
```

### Review
Content review and approval records.

```typescript
interface Review {
  id: number;
  contentPieceId: number;
  language: string;
  status: 'approved' | 'rejected' | 'needs_changes';
  feedback?: string;
  reviewerName?: string;
  createdAt: string;
}
```

---

## REST API Endpoints

### Campaigns

#### List All Campaigns
```http
GET /api/v1/campaigns
```

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Summer Campaign 2024",
      "description": "Marketing campaign for summer products",
      "status": "active",
      "defaultLanguage": "en",
      "targetLanguages": ["es", "fr", "de"],
      "createdAt": "2024-01-01T12:00:00Z",
      "updatedAt": "2024-01-01T12:00:00Z",
      "contentPieces": []
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

#### Get Campaign by ID
```http
GET /api/v1/campaigns/{id}
```

**Parameters**:
- `id` (path): Campaign ID

#### Create Campaign
```http
POST /api/v1/campaigns
Content-Type: application/json

{
  "name": "Campaign Name",
  "description": "Campaign description",
  "defaultLanguage": "en",
  "targetLanguages": ["es", "fr"]
}
```

#### Update Campaign
```http
PUT /api/v1/campaigns/{id}
Content-Type: application/json

{
  "name": "Updated Campaign Name",
  "status": "completed"
}
```

#### Delete Campaign
```http
DELETE /api/v1/campaigns/{id}
```

### Content

#### List Content Pieces
```http
GET /api/v1/content
```

**Query Parameters**:
- `campaignId` (optional): Filter by campaign
- `type` (optional): Filter by content type
- `status` (optional): Filter by status
- `language` (optional): Filter by language

#### Get Content by ID
```http
GET /api/v1/content/{id}
```

#### Create Content
```http
POST /api/v1/content
Content-Type: application/json

{
  "campaignId": 1,
  "type": "headline",
  "originalContent": "Amazing summer deals await you!",
  "language": "en"
}
```

#### Generate AI Content
```http
POST /api/v1/content/{id}/ai/generate
Content-Type: application/json

{
  "prompt": "Create compelling marketing headline",
  "model": "openai" // optional, defaults to configured model
}
```

#### Translate Content
```http
POST /api/v1/content/{id}/translate
Content-Type: application/json

{
  "targetLanguage": "es"
}
```

#### Analyze Content
```http
POST /api/v1/content/{id}/analyze
Content-Type: application/json

{
  "analysisType": "sentiment" // optional
}
```

#### Submit for Review
```http
POST /api/v1/content/{id}/review/submit
```

#### Review Content
```http
POST /api/v1/content/{id}/review
Content-Type: application/json

{
  "status": "approved",
  "feedback": "Looks great!",
  "reviewerName": "John Doe",
  "language": "en"
}
```

### AI Services

#### Compare AI Models
```http
POST /api/v1/ai/compare/{contentId}
Content-Type: application/json

{
  "prompt": "Generate compelling content",
  "models": ["openai", "anthropic"]
}
```

**Response**:
```json
{
  "success": true,
  "results": [
    {
      "provider": "openai",
      "text": "Generated content from OpenAI",
      "analysis": {
        "keywords": ["compelling", "content"],
        "tone": "professional",
        "sentiment": {
          "label": "positive",
          "score": 0.8
        }
      },
      "executionTime": 1200,
      "cost": 0.002
    },
    {
      "provider": "anthropic", 
      "text": "Generated content from Anthropic",
      "analysis": {
        "keywords": ["engaging", "content"],
        "tone": "friendly",
        "sentiment": {
          "label": "positive",
          "score": 0.9
        }
      },
      "executionTime": 1100,
      "cost": 0.003
    }
  ],
  "summary": {
    "totalModels": 2,
    "fastestModel": "anthropic",
    "longestContent": "anthropic"
  }
}
```

### LangChain Workflows

#### Execute LangChain Workflow
```http
POST /api/v1/langchain/{contentId}/workflow
Content-Type: application/json

{
  "targetLanguage": "es",
  "customPrompt": "Create marketing content"
}
```

#### Enhanced LangChain Generation
```http
POST /api/v1/langchain/{contentId}/enhanced
Content-Type: application/json

{
  "prompt": "Generate enhanced content using advanced AI"
}
```

---

## GraphQL API

### Schema Overview

The GraphQL schema provides flexible querying capabilities for complex data relationships.

#### Root Queries
```graphql
type Query {
  campaigns: [Campaign!]!
  campaign(id: ID!): Campaign
  contentPieces: [ContentPiece!]!
  contentPiece(id: ID!): ContentPiece
  contentPiecesByCampaign(campaignId: ID!): [ContentPiece!]!
}
```

#### Root Mutations
```graphql
type Mutation {
  createCampaign(data: CreateCampaignInput!): Campaign!
  updateCampaign(id: ID!, data: CreateCampaignInput!): Campaign
  deleteCampaign(id: ID!): Boolean!
  createContentPiece(data: CreateContentInput!): ContentPiece!
  deleteContentPiece(id: ID!): Boolean!
}
```

### Example Queries

#### Get Campaign with All Related Content
```graphql
query GetCampaignDetails($id: ID!) {
  campaign(id: $id) {
    id
    name
    description
    status
    defaultLanguage
    targetLanguages
    contentPieces {
      id
      type
      originalContent
      status
      aiGenerations {
        id
        generatedText
        modelVersion
        createdAt
      }
      translations {
        id
        targetLanguage
        translatedText
        qualityScore
        status
      }
      reviews {
        id
        status
        feedback
        reviewerName
        createdAt
      }
    }
  }
}
```

#### Get Content with Analysis Data
```graphql
query GetContentWithAnalysis($id: ID!) {
  contentPiece(id: $id) {
    id
    type
    originalContent
    aiGenerations {
      id
      generatedText
      metadata
      modelVersion
    }
  }
}
```

#### Create New Campaign
```graphql
mutation CreateCampaign($data: CreateCampaignInput!) {
  createCampaign(data: $data) {
    id
    name
    description
    status
    createdAt
  }
}
```

**Variables**:
```json
{
  "data": {
    "name": "Winter Campaign 2024",
    "description": "Holiday marketing campaign",
    "targetLanguages": ["es", "fr", "de", "it"]
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error occurred |
| 503 | Service Unavailable | Service temporarily unavailable |

### Error Response Format

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific field error"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### GraphQL Errors

```json
{
  "data": null,
  "errors": [
    {
      "message": "Error description",
      "locations": [{"line": 2, "column": 3}],
      "path": ["fieldName"]
    }
  ]
}
```

---

## Rate Limiting

Currently, no rate limiting is implemented. In production:

- Implement rate limiting per IP/API key
- Different limits for different endpoint types
- GraphQL query complexity analysis
- Proper error responses for rate limit exceeded

---

## Monitoring and Health Checks

### Health Check Endpoints
- `GET /health` - Comprehensive health check
- `GET /health/live` - Liveness probe (Kubernetes)
- `GET /health/ready` - Readiness probe (Kubernetes)
- `GET /metrics` - Prometheus metrics
- `GET /info` - Application information

See [Monitoring Documentation](./monitoring.md) for detailed information.

---

## WebSocket/Real-time (Future)

GraphQL subscriptions can be added for real-time updates:

```graphql
type Subscription {
  contentStatusUpdated(contentId: ID!): ContentPiece!
  aiGenerationCompleted(contentId: ID!): AIGeneration!
  translationCompleted(contentId: ID!): Translation!
}
```

---

## SDKs and Client Libraries

### JavaScript/TypeScript Client Example

```typescript
// REST Client
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Create campaign
const campaign = await apiClient.post('/campaigns', {
  name: 'My Campaign',
  targetLanguages: ['es', 'fr']
});

// GraphQL Client with Apollo
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:8080/graphql',
  cache: new InMemoryCache()
});

const GET_CAMPAIGNS = gql`
  query GetCampaigns {
    campaigns {
      id
      name
      contentPieces {
        id
        type
        status
      }
    }
  }
`;

const { data } = await client.query({ query: GET_CAMPAIGNS });
```

---

## Testing

### REST API Testing with curl

```bash
# Create campaign
curl -X POST http://localhost:8080/api/v1/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign",
    "targetLanguages": ["es", "fr"]
  }'

# Generate AI content
curl -X POST http://localhost:8080/api/v1/content/1/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create compelling headline"
  }'
```

### GraphQL Testing

Use GraphQL Playground at `http://localhost:8080/graphql` for interactive testing.

---

## API Versioning

Current API version: `v1`

Future versions will be supported via:
- REST: `/api/v2/...`
- GraphQL: Schema evolution with deprecation notices

---

## Security Considerations

### Production Recommendations

1. **Authentication & Authorization**
   - Implement JWT or API key authentication
   - Role-based access control (RBAC)
   - Rate limiting per user/organization

2. **Input Validation**
   - Comprehensive input sanitization
   - GraphQL query depth and complexity limiting
   - SQL injection prevention (using ORMs)

3. **Data Protection**
   - HTTPS enforcement
   - Sensitive data encryption
   - PII data handling compliance

4. **Monitoring**
   - API usage logging
   - Security event monitoring
   - Error tracking and alerting

---

## Performance Optimization

### REST API
- Response caching with Redis
- Database query optimization
- Pagination for large datasets
- Compression (gzip)

### GraphQL API
- DataLoader for N+1 query prevention
- Query complexity analysis
- Response caching
- Batch query optimization

---

This documentation provides comprehensive coverage of the AI Content Workflow API. For specific implementation details, refer to the source code and additional documentation files in the `/docs` directory.
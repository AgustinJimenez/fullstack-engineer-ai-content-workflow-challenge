# LangChain Workflows & GraphQL Subscriptions

This document explains the newly implemented LangChain chaining workflows and GraphQL subscriptions.

## 🔗 LangChain Chaining Workflows

### Overview

We've implemented three powerful LangChain workflows that demonstrate the **true power of chaining** multiple AI operations:

1. **Smart Content Workflow**: Generate → Analyze → Translate
2. **Content Enhancement Chain**: Enhance → Refine → Summarize
3. **Multi-language Chain**: Parallel translation to multiple languages

### API Endpoints

All LangChain endpoints are available at: `http://localhost:8080/api/v1/langchain`

---

### 1. Smart Content Workflow

**Endpoint**: `POST /api/v1/langchain/smart-workflow`

**Description**: Chains three AI operations: generates enhanced content, analyzes it, and translates to multiple languages.

**Request Body**:
```json
{
  "content": "Your initial content here",
  "contentType": "headline|description|body_content|cta",
  "targetLanguages": ["es", "fr", "de"],
  "provider": "openai|anthropic|ollama|fake" // optional
}
```

**Response**:
```json
{
  "original": "Your initial content",
  "generated": "AI-enhanced version of your content",
  "analysis": {
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "tone": "professional",
    "sentiment": {
      "label": "positive",
      "score": 0.92
    }
  },
  "translations": {
    "es": "Spanish translation",
    "fr": "French translation",
    "de": "German translation"
  },
  "metadata": {
    "workflow": "generate → analyze → translate",
    "steps": 5,
    "provider": "openai",
    "timestamp": "2025-01-27T..."
  }
}
```

**Example cURL**:
```bash
curl -X POST http://localhost:8080/api/v1/langchain/smart-workflow \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Check out our amazing new product",
    "contentType": "headline",
    "targetLanguages": ["es", "fr", "de"]
  }'
```

---

### 2. Content Enhancement Chain

**Endpoint**: `POST /api/v1/langchain/enhancement-chain`

**Description**: Sequential refinement through three steps: enhances content, refines it, then summarizes.

**Request Body**:
```json
{
  "content": "Your content to enhance",
  "contentType": "headline|description|body_content",
  "provider": "openai|anthropic|ollama|fake" // optional
}
```

**Response**:
```json
{
  "original": "Your content",
  "enhanced": "Enhanced version",
  "refined": "Refined and polished version",
  "summary": "One-sentence summary",
  "metadata": {
    "workflow": "enhance → refine → summarize",
    "steps": 3,
    "provider": "openai",
    "timestamp": "2025-01-27T..."
  }
}
```

**Example cURL**:
```bash
curl -X POST http://localhost:8080/api/v1/langchain/enhancement-chain \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Our product helps businesses grow",
    "contentType": "description"
  }'
```

---

### 3. Multi-language Chain

**Endpoint**: `POST /api/v1/langchain/multi-language`

**Description**: Parallel translation to multiple languages for efficiency.

**Request Body**:
```json
{
  "content": "Content to translate",
  "targetLanguages": ["es", "fr", "de", "it", "pt"],
  "provider": "openai|anthropic|ollama|fake" // optional
}
```

**Response**:
```json
{
  "original": "Content to translate",
  "translations": {
    "es": {
      "text": "Contenido traducido",
      "quality": 0.95
    },
    "fr": {
      "text": "Contenu traduit",
      "quality": 0.93
    },
    // ... more languages
  },
  "summary": {
    "languagesProcessed": 5,
    "avgQuality": 0.94
  },
  "metadata": {
    "workflow": "parallel multi-language translation",
    "provider": "openai",
    "timestamp": "2025-01-27T..."
  }
}
```

---

### 4. Workflow for Existing Content

**Endpoint**: `POST /api/v1/langchain/content/:contentId/workflow`

**Description**: Execute smart workflow for an existing content piece and save results.

**Request Body**:
```json
{
  "targetLanguages": ["es", "fr"], // optional, uses campaign's target languages if not provided
  "provider": "openai|anthropic|ollama|fake" // optional
}
```

**Example cURL**:
```bash
curl -X POST http://localhost:8080/api/v1/langchain/content/123/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "targetLanguages": ["es", "fr", "de"]
  }'
```

---

## 🔌 GraphQL Subscriptions

### Overview

GraphQL subscriptions enable **real-time updates** via WebSockets. Get notified instantly when campaigns or content change!

### Connection

**WebSocket URL**: `ws://localhost:8080/graphql`

### Available Subscriptions

#### 1. Campaign Updates (All)

Subscribe to all campaign changes:

```graphql
subscription {
  campaignUpdated {
    id
    name
    status
    description
    defaultLanguage
    targetLanguages
  }
}
```

#### 2. Specific Campaign

Subscribe to updates for a single campaign:

```graphql
subscription {
  campaignById(id: 1) {
    id
    name
    status
    contentPieces {
      id
      originalContent
      status
    }
  }
}
```

#### 3. Content Updates (All)

Subscribe to all content piece changes:

```graphql
subscription {
  contentUpdated {
    id
    campaignId
    type
    originalContent
    status
  }
}
```

#### 4. Content by Campaign

Subscribe to content updates for a specific campaign:

```graphql
subscription {
  contentByCampaign(campaignId: 1) {
    id
    originalContent
    status
    type
  }
}
```

#### 5. AI Generation Events

Subscribe to AI generation completion:

```graphql
subscription {
  aiGenerationCreated
}
```

#### 6. Review Events

Subscribe to review submissions:

```graphql
subscription {
  reviewCreated
}
```

### Testing Subscriptions

#### Using GraphQL Playground

1. Open http://localhost:8080/graphql
2. Click "SUBSCRIPTIONS" tab
3. Enter your subscription query
4. Click play button
5. In another tab, create/update a campaign using mutations
6. Watch live updates in the subscription tab!

**Example Test Flow**:

Tab 1 (Subscription):
```graphql
subscription {
  campaignUpdated {
    id
    name
    status
  }
}
```

Tab 2 (Mutation):
```graphql
mutation {
  createCampaign(data: {
    name: "Test Campaign"
    description: "Testing subscriptions"
    status: "active"
  }) {
    id
    name
  }
}
```

You'll see the new campaign appear in Tab 1 instantly!

---

#### Using JavaScript Client

```javascript
import { createClient } from 'graphql-ws';

const client = createClient({
  url: 'ws://localhost:8080/graphql',
});

// Subscribe to campaign updates
const unsubscribe = client.subscribe(
  {
    query: `
      subscription {
        campaignUpdated {
          id
          name
          status
        }
      }
    `,
  },
  {
    next: (data) => {
      console.log('Campaign updated:', data);
    },
    error: (error) => {
      console.error('Subscription error:', error);
    },
    complete: () => {
      console.log('Subscription complete');
    },
  }
);

// Later, unsubscribe
// unsubscribe();
```

---

## 🎯 Use Cases

### LangChain Workflows

1. **International Campaigns**:
   - Create content once
   - Run smart workflow to generate, analyze, and translate
   - Get professional content in multiple languages instantly

2. **Content Refinement**:
   - Start with a rough draft
   - Use enhancement chain for progressive refinement
   - Get polished, professional content

3. **Bulk Translation**:
   - Need content in 10 languages?
   - Use multi-language chain for parallel processing
   - Faster than sequential translation

### GraphQL Subscriptions

1. **Real-time Dashboard**:
   - Subscribe to campaign updates
   - Show live KPIs as campaigns change
   - No polling needed!

2. **Collaborative Editing**:
   - Multiple users editing campaigns
   - Everyone sees changes instantly
   - Better user experience

3. **Workflow Monitoring**:
   - Subscribe to AI generation events
   - Show progress as content is generated
   - Real-time status updates

---

## 🧪 Testing

### Test LangChain Workflows

```bash
# Test smart workflow
curl -X POST http://localhost:8080/api/v1/langchain/smart-workflow \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Discover our innovative solutions",
    "contentType": "headline",
    "targetLanguages": ["es", "fr"]
  }'

# Test enhancement chain
curl -X POST http://localhost:8080/api/v1/langchain/enhancement-chain \
  -H "Content-Type: application/json" \
  -d '{
    "content": "We make great products",
    "contentType": "description"
  }'

# Test multi-language chain
curl -X POST http://localhost:8080/api/v1/langchain/multi-language \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Welcome to our platform",
    "targetLanguages": ["es", "fr", "de", "it"]
  }'
```

### Test GraphQL Subscriptions

1. Open GraphQL Playground: http://localhost:8080/graphql
2. Run a subscription in one tab
3. Run a mutation in another tab
4. See live updates!

---

## 📊 Performance Notes

### LangChain Workflows

- **Smart Workflow**: ~5-10 seconds (sequential: generate → analyze → translate each language)
- **Enhancement Chain**: ~3-7 seconds (3 sequential AI calls)
- **Multi-language Chain**: ~3-5 seconds (parallel translations, faster than sequential)

### GraphQL Subscriptions

- **Latency**: < 100ms for local updates
- **Connection**: Persistent WebSocket, reconnects automatically
- **Scalability**: Uses Redis Pub/Sub for horizontal scaling

---

## 🔧 Configuration

### Environment Variables

```bash
# AI Provider
AI_PROVIDER=ollama              # Options: openai, anthropic, ollama, fake
AI_API_KEY=your_api_key_here

# Redis (for GraphQL subscriptions)
REDIS_HOST=redis                # or localhost for local dev
REDIS_PORT=6379
```

### Fake AI Mode

For testing without API keys:

```bash
AI_PROVIDER=fake npm start
```

Fake AI mode returns mock responses instantly, perfect for:
- E2E tests
- Development without API costs
- CI/CD pipelines

---

## 🎓 Examples

### Complete Workflow Example

```bash
# 1. Create a campaign
curl -X POST http://localhost:8080/api/v1/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Sale 2025",
    "description": "Promotional campaign",
    "defaultLanguage": "en",
    "targetLanguages": ["es", "fr", "de"]
  }'

# Response: { "id": 123, ... }

# 2. Create content for the campaign
curl -X POST http://localhost:8080/api/v1/campaigns/123/content \
  -H "Content-Type: application/json" \
  -d '{
    "type": "headline",
    "originalContent": "Summer savings up to 50% off"
  }'

# Response: { "id": 456, ... }

# 3. Run LangChain workflow on the content
curl -X POST http://localhost:8080/api/v1/langchain/content/456/workflow \
  -H "Content-Type: application/json" \
  -d '{}'

# Gets enhanced content + analysis + translations!
```

---

## 📚 Additional Resources

- **LangChain Documentation**: https://js.langchain.com/docs/
- **GraphQL Subscriptions**: https://www.apollographql.com/docs/apollo-server/data/subscriptions/
- **Type-GraphQL**: https://typegraphql.com/
- **graphql-ws**: https://github.com/enisdenjo/graphql-ws

---

**Built with ❤️ using LangChain and GraphQL subscriptions**
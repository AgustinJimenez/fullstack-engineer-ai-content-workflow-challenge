# API Architecture: GraphQL + REST Hybrid

## Implementation Status

✅ **GraphQL API**: Fully implemented alongside existing REST API
✅ **Type Safety**: Using TypeScript and Type-GraphQL for end-to-end type safety  
✅ **Apollo Server**: Integrated with Express using apollo-server-express
✅ **Resolvers**: Complete CRUD operations for Campaigns and Content
✅ **Documentation**: Auto-generated schema introspection + manual docs

## Architecture Decision

This application implements a **hybrid API architecture** with both GraphQL and REST endpoints:

### GraphQL Endpoints
- **Main**: `/graphql` - Single endpoint for all GraphQL operations
- **Playground**: `/graphql` - Interactive query explorer (dev only)

### REST Endpoints  
- **Base**: `/api/v1/*` - Traditional REST endpoints
- **Specific**: `/api/v1/campaigns`, `/api/v1/content`, etc.

## Why Both APIs?

### GraphQL Advantages
- **Flexible Queries**: Clients request exactly what they need
- **Single Endpoint**: Reduces API surface area  
- **Strong Typing**: TypeScript integration with auto-generated types
- **Relationships**: Excellent for fetching related data in one query
- **Introspection**: Self-documenting API with schema exploration
- **Real-time**: Built-in subscription support for live updates

### REST Advantages  
- **Simplicity**: Easy to understand and debug
- **Caching**: Better HTTP caching strategies
- **File Uploads**: Simpler binary data handling
- **Testing**: Standard HTTP tools and practices
- **Performance**: Lower overhead for simple operations
- **Compatibility**: Works with all HTTP clients

### Use Cases by API Type

| Feature | GraphQL | REST | Reason |
|---------|---------|------|--------|
| Complex data fetching | ✅ | ❌ | Avoid N+1 queries, flexible responses |
| Simple CRUD operations | ❌ | ✅ | HTTP semantics, caching, simplicity |
| File uploads | ❌ | ✅ | Better multipart/form-data support |
| Real-time updates | ✅ | ❌ | Built-in subscription support |
| Mobile clients | ✅ | ❌ | Reduce over-fetching, bandwidth optimization |
| Legacy integrations | ❌ | ✅ | Standard HTTP patterns |
| Analytics/Logging | ❌ | ✅ | HTTP status codes, simpler monitoring |

## Implementation Details

### GraphQL Schema Types
```graphql
type Campaign {
  id: ID!
  name: String!
  contentPieces: [ContentPiece!]!
}

type ContentPiece {
  id: ID!
  campaignId: ID!  
  aiGenerations: [AIGeneration!]!
  translations: [Translation!]!
}
```

### Query Examples
```graphql
# Get campaign with all related content in one request
query GetCampaignDetails($id: ID!) {
  campaign(id: $id) {
    id
    name
    description
    contentPieces {
      id
      type
      originalContent
      aiGenerations {
        generatedText
        modelVersion
      }
      translations {
        targetLanguage
        translatedText
        qualityScore
      }
    }
  }
}
```

### REST Examples  
```http
GET /api/v1/campaigns/1
GET /api/v1/campaigns/1/content
POST /api/v1/content/1/ai/generate
PUT /api/v1/campaigns/1
```

## Migration Strategy

1. **Phase 1**: Keep both APIs running (current state)
2. **Phase 2**: Migrate complex frontend queries to GraphQL
3. **Phase 3**: Keep REST for file uploads and simple operations
4. **Phase 4**: Monitor usage and optimize based on patterns

## Performance Considerations

### GraphQL
- ✅ Reduces over-fetching
- ✅ Batches related queries
- ⚠️ Requires query complexity analysis
- ⚠️ Caching is more complex

### REST
- ✅ Simple caching with HTTP headers
- ✅ Predictable performance per endpoint  
- ⚠️ Can lead to over-fetching
- ⚠️ Multiple round trips for related data

## Monitoring and Observability

Both APIs are instrumented with:
- Request/response logging via Morgan
- Error handling middleware
- Health checks (`/health`)
- GraphQL query introspection (dev only)

## Security

Both APIs implement:
- CORS configuration
- Helmet security headers
- Request validation
- Input sanitization via class-validator

## Future Enhancements

1. **GraphQL Subscriptions** - Real-time updates
2. **Query Complexity Analysis** - Prevent expensive queries  
3. **Caching Layer** - Redis integration
4. **Rate Limiting** - Per-client request limits
5. **Field-level Authorization** - Granular permissions
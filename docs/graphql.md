# GraphQL API Documentation

## Overview

This application provides both REST and GraphQL APIs alongside each other. The GraphQL API is built using Apollo Server and Type-GraphQL.

## Endpoints

- **GraphQL API**: `http://localhost:8080/graphql`
- **GraphQL Playground**: `http://localhost:8080/graphql` (development only)
- **REST API**: `http://localhost:8080/api/v1`

## Why GraphQL + REST?

This implementation follows a hybrid approach where both APIs coexist:

1. **GraphQL Benefits**:
   - Flexible queries - fetch exactly the data needed
   - Single endpoint for all operations
   - Strong type system with TypeScript integration
   - Real-time subscriptions capability (can be added later)
   - Introspection and automatic documentation

2. **REST Benefits**:
   - Simpler caching strategies
   - Better for file uploads
   - Easier testing and debugging
   - Familiar to most developers

3. **Hybrid Approach**:
   - Use GraphQL for complex data fetching with relationships
   - Keep REST for simple CRUD operations and file handling
   - Migrate endpoints gradually based on requirements

## Available Types

### Campaign
```graphql
type Campaign {
  id: ID!
  name: String!
  description: String
  status: String!
  defaultLanguage: String!
  targetLanguages: [String!]!
  createdAt: DateTime!
  updatedAt: DateTime!
  contentPieces: [ContentPiece]
}
```

### ContentPiece
```graphql
type ContentPiece {
  id: ID!
  campaignId: ID!
  type: String!
  originalContent: String
  language: String!
  status: String!
  createdAt: DateTime!
  updatedAt: DateTime!
  aiGenerations: [AIGeneration]
  translations: [Translation]
  reviews: [Review]
}
```

## Sample Queries

### Get all campaigns with content pieces
```graphql
query GetCampaigns {
  campaigns {
    id
    name
    description
    status
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
    }
  }
}
```

### Get specific content piece with all related data
```graphql
query GetContentPiece($id: ID!) {
  contentPiece(id: $id) {
    id
    type
    originalContent
    language
    status
    aiGenerations {
      id
      generatedText
      promptUsed
      modelVersion
      metadata
      createdAt
    }
    translations {
      id
      targetLanguage
      translatedText
      qualityScore
      status
      createdAt
    }
    reviews {
      id
      language
      status
      feedback
      reviewerName
      createdAt
    }
  }
}
```

## Sample Mutations

### Create a new campaign
```graphql
mutation CreateCampaign($data: CreateCampaignInput!) {
  createCampaign(data: $data) {
    id
    name
    description
    status
    defaultLanguage
    targetLanguages
    createdAt
  }
}
```

Variables:
```json
{
  "data": {
    "name": "Summer Campaign 2024",
    "description": "Marketing campaign for summer products",
    "defaultLanguage": "en",
    "targetLanguages": ["es", "fr", "de"]
  }
}
```

### Create content piece
```graphql
mutation CreateContentPiece($data: CreateContentInput!) {
  createContentPiece(data: $data) {
    id
    campaignId
    type
    originalContent
    language
    status
    createdAt
  }
}
```

## Performance Considerations

1. **N+1 Problem**: The resolvers use field resolvers to avoid N+1 queries
2. **Caching**: Can implement caching at the resolver level
3. **Pagination**: Should be added for large datasets
4. **Rate Limiting**: Can be implemented using middleware
5. **Query Complexity**: Can limit query depth and complexity

## Development Tools

- GraphQL Playground is available in development mode at `/graphql`
- Introspection is enabled in non-production environments
- Schema is automatically generated from TypeScript types
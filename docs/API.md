# API Overview

Base URL: `http://localhost:8080`

Authentication: none (local dev).
Content type: `application/json`.

## Campaigns
- `POST /api/v1/campaigns`
  - body: `{ name, description?, defaultLanguage? ('en'), targetLanguages?: string[] }`
  - 201 -> Campaign
- `GET /api/v1/campaigns`
  - 200 -> Campaign[] (includes `contentPieces`)
- `GET /api/v1/campaigns/:id`
  - 200 -> Campaign (includes content pieces + relations)
- `PUT /api/v1/campaigns/:id`
  - body: `{ name?, description?, status?, defaultLanguage?, targetLanguages? }`
  - 200 -> Campaign
- `DELETE /api/v1/campaigns/:id`
  - 204

## Content
- `POST /api/v1/content`
  - body: `{ campaignId, type, originalContent?, language? ('en') }`
  - 201 -> ContentPiece
- `GET /api/v1/content/:id`
  - 200 -> ContentPiece with `campaign`, `aiGenerations`, `reviews`, `translations`
- `PUT /api/v1/content/:id`
  - body: `{ originalContent?, status? }`
  - 200 -> ContentPiece
- `DELETE /api/v1/content/:id`
  - 204
- `POST /api/v1/campaigns/:id/content`
  - body: `{ type, originalContent?, language? }`
  - 201 -> ContentPiece
- `GET /api/v1/campaigns/:id/content`
  - 200 -> ContentPiece[] (with relations)

### Review workflow
- `POST /api/v1/content/:id/submit-for-review`
  - 200 -> `{ message, contentPiece }`
- `POST /api/v1/content/reviews`
  - body: `{ contentPieceId, reviewerName?, status ('approved'|'rejected'|'needs_revision'), feedback?, language? }`
  - 201 -> Review (with `contentPiece`)
- `GET /api/v1/content/:contentId/reviews`
  - 200 -> Review[]
- `GET /api/v1/content/for-review?language=xx`
  - 200 -> ContentPiece[] filtered by language under review
- `GET /api/v1/content/:id/status-rollup`
  - 200 -> `{ contentPieceId, statusByLanguage: { [lang]: status }, counts, overallStatus }`

## AI
- `POST /api/v1/ai/generate/:contentId`
  - body: `{ aiModel: 'openai'|'anthropic', prompt? }`
  - 201 -> AIGeneration
- `POST /api/v1/ai/translate/:contentId`
  - body: `{ targetLanguage, aiModel? ('openai') }`
  - 201 -> Translation (includes `qualityScore`)
- `GET /api/v1/ai/generations/:contentId`
  - 200 -> AIGeneration[] (newest first)

---

Errors: standard `400/404/500` with `{ error }` field. IDs are numeric.


# Real-time Events (SSE)

Server endpoint: `GET /api/v1/events/stream`
- Content-Type: `text/event-stream`
- Events: `connected`, `contentUpdated`, `aiGenerationCreated`, `translationCreated`, `reviewCreated`, `campaignCreated`, `campaignUpdated`, `campaignDeleted`.

## Event Payloads
- `contentUpdated`: `{ contentPieceId, campaignId, status? }`
- `aiGenerationCreated`: `{ contentPieceId, campaignId, generationId }`
- `translationCreated`: `{ contentPieceId, campaignId, translationId, language }`
- `reviewCreated`: `{ contentPieceId, campaignId, reviewId, status }`
- `campaignCreated|campaignUpdated|campaignDeleted`: `{ campaignId }`

## Client Usage
- A resilient client with auto-reconnect is provided at `frontend/src/lib/events.ts`.
- Example (campaign detail): subscribe and reload when `campaignId` matches.

```ts
const sse = createSSEClient();
const refreshIfMatch = (data: any) => data.campaignId === campaignId && loadCampaign();
const off = sse.on('contentUpdated', refreshIfMatch);
```

Debouncing is applied in key pages to avoid bursty reloads.


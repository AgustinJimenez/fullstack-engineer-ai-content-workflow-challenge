# Architecture Overview

## Components
- Frontend: Next.js (TypeScript, Tailwind), pages under `frontend/src/app`.
- Backend: Express (TypeScript, Sequelize) under `backend/src`.
- Database: PostgreSQL (Sequelize models).
- E2E: Playwright; CI runs multi-browser matrix.
- Real-time: Server-Sent Events (SSE) for live updates.

## Data Model (core)
- Campaign(id, name, description, status, defaultLanguage, targetLanguages[], timestamps)
- ContentPiece(id, campaignId, type, originalContent, language, status, timestamps)
- AIGeneration(id, contentPieceId, aiModel, modelVersion, promptUsed, generatedText, metadata, createdAt)
- Translation(id, contentPieceId, targetLanguage, translatedText, aiModel, status, qualityScore, createdAt)
- Review(id, contentPieceId, reviewerName, status, feedback, reviewedAt, language)

## Request Flow (examples)
- Generate draft: UI → `POST /api/v1/ai/generate/:contentId` → save AIGeneration → SSE `aiGenerationCreated` → UI refresh.
- Translate: UI → `POST /api/v1/ai/translate/:contentId` → save Translation (qualityScore) → SSE `translationCreated` → UI refresh.
- Review: UI → `POST /api/v1/content/reviews` (with `language`) → save Review → SSE `reviewCreated` → status roll-up endpoint for per-language chips.

## Real-time
- One SSE stream `GET /api/v1/events/stream`.
- Frontend subscriptions at list/detail/review pages debounce reloads.


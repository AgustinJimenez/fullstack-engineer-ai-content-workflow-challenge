# Development Guide

## Prerequisites
- Node 18+
- Docker + Docker Compose

## Setup
```bash
cp .env.example .env
npm run install:all
```

## Start stack
```bash
npm run dev   # docker compose up --build
```

Backend: `http://localhost:8080` (health: `/health`)
Frontend: `http://localhost:3000`

## Common commands
- Logs: `npm run logs`, `npm run logs:backend`, `npm run logs:frontend`
- Rebuild + restart: `npm run restart`
- Reset DB: `npm run reset-db` (destroys volumes)

## E2E tests
Use Playwright webServer (don’t manually start services):
```bash
./scripts/run-tests.sh --e2e-only
# or
npx playwright test
```

HTML report: `playwright-report/`
JUnit XML: `test-results/junit-results.xml`

## Real-time events (SSE)
See `docs/REALTIME.md` for event names and client usage.


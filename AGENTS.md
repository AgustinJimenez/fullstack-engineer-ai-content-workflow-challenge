# Repository Guidelines

Refer to `README.md` for the full project requirements and scope. For deeper guidance, see `docs/IMPLEMENTATION_GUIDE.md` and testing details in `docs/TESTING.md`.

## Project Structure & Module Organization
- Root: orchestrates Docker, tests, and shared configs.
- `backend/`: Express + TypeScript API (`src/`), Jest tests in `backend/tests/`, DB migrations in `backend/migrations/`.
- `frontend/`: Next.js app in `frontend/src/` with Tailwind assets in `public/` and configs.
- `tests/e2e/`: Playwright end-to-end tests. Reports in `playwright-report/` and `test-results/`.
- `compose.yml`: local dev stack (db, backend, frontend). Env examples in `.env.example`.

## Build, Test, and Development Commands
- `npm run dev` — start full stack via Docker Compose (rebuilds).
- `npm run start` / `npm run stop` / `npm run down` — manage stack.
- `npm run logs[:backend|:frontend|:db]` — follow service logs.
- `npm run install:all` — install backend and frontend deps.
- `npm run build` — build backend (`tsc`) and frontend (`next build`).
- `npm test` — API unit/integration + Playwright e2e.
- Backend only: `cd backend && npm test`, `npm run test:coverage`, `npm run lint`.
- E2E only: `npm run test:e2e` or `npm run test:e2e:ui`.

### E2E Run Tips
- Playwright manages the stack via `webServer` in `playwright.config.ts`. Prefer: `./scripts/run-tests.sh --e2e-only` or `npx playwright test`.
- To avoid port conflicts, don’t pre-start the stack; let Playwright do it. Health checks hit `http://localhost:8080/health` and `:3000`.
- Mobile viewport tests sometimes require scrolling/forced clicks; helpers in specs already handle this.

## Coding Style & Naming Conventions
- TypeScript across services; 2-space indentation; semicolons required.
- Classes: PascalCase; variables/functions: camelCase.
- Match existing directory patterns (e.g., controllers, routes, models). Place new code alongside peers.
- Lint: ESLint (`backend` and `frontend`). Run before committing.

## Testing Guidelines
- Backend: Jest + ts-jest. Name tests `*.test.ts` or `*.spec.ts`. Keep unit tests near logic or under `backend/tests/`.
- Coverage: collected to `backend/coverage/` (`npm run test:coverage`).
- E2E: Playwright specs in `tests/e2e/*.spec.ts`. Uses `compose.yml` + Playwright `webServer`; base URL `http://localhost:3000`.
- Reports: HTML under `playwright-report/`, JUnit XML under `test-results/junit-results.xml`.

## Commit & Pull Request Guidelines
- Commits: imperative mood, concise summary (e.g., "Add campaign routes"), reference issues when relevant (#123).
- PRs: clear description, linked issues, setup/verification steps, and screenshots for UI changes. Ensure `npm test` passes.

## Security & Configuration Tips
- Copy `.env.example` to `.env` and set `OPENAI_API_KEY`. Docker Compose loads env for backend/frontend.
- Do not commit secrets. Prefer `.env` + Docker for local dev.
- Database runs in local Postgres via Compose; reset with `npm run reset-db` (destroys data).

Note: Do not modify the root `README.md` (original requirements). Add project notes to `AGENTS.md`, `README-TESTING.md`, or `docs/`.

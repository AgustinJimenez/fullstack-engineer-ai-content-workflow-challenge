# Code Quality & Standards

This document outlines the code quality tools and standards used in the AI Content Workflow project.

## 🎨 Code Formatting

### Prettier Configuration

The project uses Prettier for consistent code formatting across all files.

**Configuration**: `.prettierrc.js`

**Key Settings**:
- Single quotes for strings
- Semicolons required
- 2-space indentation
- 100-character line width
- Trailing commas (ES5)

**Run Formatting**:
```bash
# Backend
cd backend && npm run format  # (if configured)

# Frontend
cd frontend && npm run format  # (if configured)
```

## 🔍 Linting

### ESLint Configuration

**Root Configuration**: `eslint.config.mjs` (ESLint 9+ flat config)
- Common ignores for node_modules, dist, build directories
- Shared rules across monorepo

**Backend Configuration**: `backend/` has TypeScript-specific ESLint
```bash
cd backend && npm run lint
```

**Frontend Configuration**: `frontend/` uses Next.js ESLint
```bash
cd frontend && npm run lint
```

## ✅ Type Checking

### TypeScript

Both backend and frontend use strict TypeScript checking.

**Backend Type Check**:
```bash
cd backend && npx tsc --noEmit
```

**Frontend Type Check**:
```bash
cd frontend && npx tsc --noEmit
```

## 🧪 Testing Standards

### Backend Tests
- **Unit Tests**: Jest with coverage reporting
- **Integration Tests**: Full API endpoint testing
- **Coverage Target**: 70%+ for critical paths

```bash
cd backend && npm test
cd backend && npm run test:coverage
```

### Frontend Tests
- **Unit Tests**: Jest + Testing Library
- **Component Tests**: React component testing
- **E2E Tests**: Playwright for full workflows

```bash
cd frontend && npm test
npm run test:e2e  # E2E tests
```

## 📏 Code Standards

### Naming Conventions

**Files**:
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Constants: `UPPER_SNAKE_CASE.ts`
- Types: `PascalCase.ts`

**Variables**:
- Constants: `UPPER_SNAKE_CASE`
- Functions: `camelCase`
- Classes: `PascalCase`
- Interfaces: `PascalCase` (no I prefix)

### Import Order

1. React/Next.js imports
2. External dependencies
3. Internal components
4. Internal utilities
5. Types
6. Styles

Example:
```typescript
import React from 'react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { Campaign } from '@/types';
import './styles.css';
```

## 🔒 Security Standards

### Input Validation
- All user inputs validated and sanitized
- SQL injection prevented by Sequelize ORM
- XSS prevention in React

### API Security
- Environment variables for secrets
- CORS configuration
- Rate limiting on AI endpoints

## 📝 Documentation Standards

### Code Comments
- TSDoc for functions and classes
- Inline comments for complex logic
- README for each major module

### API Documentation
- OpenAPI/Swagger specs in `docs/openapi.yaml`
- Endpoint documentation in `docs/API.md`

## 🚀 CI/CD Quality Gates

The CI pipeline enforces quality standards:

1. **Linting**: Must pass ESLint checks
2. **Type Checking**: No TypeScript errors
3. **Tests**: All tests must pass
4. **Build**: Production builds must succeed

See `.github/workflows/ci.yml` for details.

## 📊 Code Metrics

Current quality metrics:

| Metric | Backend | Frontend |
|--------|---------|----------|
| TypeScript Coverage | 100% | 100% |
| Test Coverage | 70%+ | 80%+ |
| Lint Errors | 0 | 0 |
| Build Status | ✅ | ✅ |

## 🛠 Pre-commit Hooks (Optional)

To enforce standards locally, you can add pre-commit hooks:

```bash
# Install husky (optional)
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm test"
```

## 🤝 Contributing

When contributing code:

1. Run linting: `npm run lint`
2. Run tests: `npm test`
3. Check types: `npx tsc --noEmit`
4. Format code: Use Prettier
5. Write tests for new features
6. Update documentation

---

**Note**: Both backend and frontend have their own specific linting and formatting configurations that extend the root configuration. Always run quality checks in the specific package you're working on.
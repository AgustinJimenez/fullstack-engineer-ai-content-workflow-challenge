# E2E Testing Setup

## Prerequisites

1. **Database Setup**: Make sure PostgreSQL is running and the database is created:
   ```bash
   # Start PostgreSQL (if using Homebrew on macOS)
   brew services start postgresql
   
   # Create the database
   createdb ai_content_workflow
   
   # Or using psql
   psql -c "CREATE DATABASE ai_content_workflow;"
   ```

2. **Environment Variables**: Make sure you have the correct `.env` file in the project root with:
   ```bash
   # Server Configuration
   API_HOST=localhost
   API_PORT=8080
   
   # Frontend Configuration
   FRONTEND_HOST=localhost
   FRONTEND_PORT=3000
   
   # Database Configuration
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/ai_content_workflow
   ```

3. **Backend Dependencies**: Install and run migrations:
   ```bash
   cd ../backend
   npm install
   npm run dev  # This should run migrations automatically
   ```

## Running Tests

### Auto-setup (Playwright starts servers automatically)

1. **Standard E2E tests** (with HTML report):
   ```bash
   npm run test:e2e
   ```

2. **CI/Headless mode** (console output only, no HTML server):
   ```bash
   npm run test:e2e:ci
   ```

3. **Console output only**:
   ```bash
   npm run test:e2e:list    # List format
   npm run test:e2e:junit   # JUnit XML output
   ```

4. **Interactive modes**:
   ```bash
   npm run test:e2e:ui      # Playwright UI
   npm run test:e2e:headed  # See browser
   ```

### Manual setup (Start servers yourself)

1. **Start servers manually**:
   ```bash
   # Terminal 1: Backend
   cd ../backend && npm run dev

   # Terminal 2: Frontend  
   cd frontend && npm run dev
   ```

2. **Run tests against running servers**:
   ```bash
   npm run test:e2e:manual        # HTML report
   npm run test:e2e:manual:junit  # JUnit output only
   ```

3. **Run specific test file**:
   ```bash
   npx playwright test campaigns-infinite-scroll.spec.ts --config=playwright-manual.config.ts
   ```

## Test Structure

- `campaigns-infinite-scroll.spec.ts`: Basic infinite scroll functionality tests
- `campaigns-infinite-scroll-comprehensive.spec.ts`: Comprehensive tests with data setup/cleanup
- `setup.ts`: Test utilities and helper functions

## Troubleshooting

1. **Database connection errors**: Ensure PostgreSQL is running and the database exists
2. **Port conflicts**: Make sure ports 3000 (frontend) and 3001 (backend) are available
3. **Slow tests**: E2E tests can be slow due to database operations and UI rendering
4. **Test cleanup**: Tests should clean up their own data, but you can manually clean with the backend's cleanup endpoint

## Test Data

The tests create and clean up their own data using:
- Test campaigns with predictable names ("Test Campaign 1", etc.)
- Backend cleanup endpoint for removing test data
- Isolated test scenarios that don't interfere with each other
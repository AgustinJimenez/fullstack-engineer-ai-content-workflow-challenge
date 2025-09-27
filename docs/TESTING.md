# 🧪 Testing the AI Content Workflow Project

This guide provides step-by-step instructions for testing the AI Content Workflow project at all levels.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Test Scenarios](#test-scenarios)
- [Troubleshooting](#troubleshooting)
- [CI/CD](#cicd)

## 🛠️ Prerequisites

Before running tests, ensure you have the following installed:

### Required Software
- **Node.js** (v18 or higher)
- **Docker** (v20.10 or higher)  
- **Docker Compose** (v2.0 or higher) - Use `docker compose` command
- **npm** (comes with Node.js)

### Verify Installation
```bash
node --version    # Should be v18+
docker --version  # Should be v20.10+
docker compose version  # Should be v2.0+
```

### Initial Setup
```bash
# Clone the repository (if not done already)
git clone <repository-url>
cd fullstack-engineer-ai-content-workflow-challenge

# Install all dependencies
npm run install:all

# Verify Docker is running
docker ps
```

## 🚀 Quick Start

### Run All Tests (Recommended)
```bash
# Make test script executable (first time only)
chmod +x scripts/run-tests.sh

# Run complete test suite
./scripts/run-tests.sh
```

This command will:
- ✅ Install any missing dependencies
- ✅ Start required Docker containers
- ✅ Run API integration tests
- ✅ Run end-to-end tests
- ✅ Generate test reports
- ✅ Clean up resources

### Expected Output
```
🚀 Starting AI Content Workflow Test Suite
[INFO] Checking prerequisites...
[INFO] Running API Integration Tests...
[SUCCESS] API Integration Tests passed!
[INFO] Running End-to-End Tests...
[SUCCESS] E2E Tests passed!
🎉 All tests completed successfully!
```

## 🔍 Test Types

### 1. API Integration Tests
**Purpose**: Test backend API endpoints and business logic

**What's tested**:
- Campaign CRUD operations
- Content creation and management
- AI generation workflow
- Database relationships
- Error handling

**Technology**: Jest + Supertest

### 2. End-to-End (E2E) Tests
**Purpose**: Test complete user workflows in real browsers

**What's tested**:
- User interface interactions
- Form submissions and validation
- Navigation between pages
- Real-time updates
- Multi-browser compatibility

**Technology**: Playwright

### 3. Testcontainer Tests
**Purpose**: Test with isolated database environments

**What's tested**:
- Database integrity
- Concurrent operations
- Performance under load
- Data consistency

**Technology**: Testcontainers + PostgreSQL

## 🎯 Running Tests

### Option 1: Automated Script (Recommended)

#### Run All Tests
```bash
./scripts/run-tests.sh
```

#### Run Specific Test Types
```bash
# API tests only (fastest)
./scripts/run-tests.sh --api-only

# E2E tests only
./scripts/run-tests.sh --e2e-only

# Include Testcontainer tests (slowest but most thorough)
./scripts/run-tests.sh --testcontainers

# Generate detailed coverage reports
./scripts/run-tests.sh --coverage
```

#### Advanced Options
```bash
# Don't cleanup containers after tests (for debugging)
./scripts/run-tests.sh --no-cleanup

# See all available options
./scripts/run-tests.sh --help
```

### Option 2: Manual Testing

#### API Integration Tests
```bash
# Start test database
docker compose -f docker-compose.test.yml up test-db -d

# Run API tests
cd backend
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- campaigns.test.ts
```

#### End-to-End Tests
```bash
# Install Playwright browsers (first time only)
npx playwright install

# Start full application stack
docker compose up --build -d

# Wait for services to be ready
curl http://localhost:8080/health
curl http://localhost:3000

# Run E2E tests
npm run test:e2e

# Run with interactive UI
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/campaigns.spec.ts
```

#### Testcontainer Tests
```bash
cd backend
npm test -- --testPathPattern=testcontainers
```

### Option 3: Development Testing

#### Watch Mode (for development)
```bash
# Watch API tests
cd backend && npm run test:watch

# Watch E2E tests
npm run test:e2e -- --ui
```

## 📊 Test Scenarios

### Campaign Management Tests

#### API Level
```bash
# Test these scenarios via API
cd backend && npm test -- campaigns.test.ts
```

**Scenarios covered**:
- ✅ Create campaign with valid data
- ✅ Reject campaign with missing name
- ✅ Update campaign information
- ✅ Delete campaign with confirmation
- ✅ List all campaigns with content
- ✅ Handle non-existent campaign IDs

#### UI Level
```bash
# Test these scenarios via browser
npx playwright test tests/e2e/campaigns.spec.ts
```

**Scenarios covered**:
- ✅ Create campaign through web form
- ✅ Edit campaign via modal
- ✅ Navigate between campaign list and details
- ✅ Form validation and error messages
- ✅ Delete campaign with confirmation dialog

### AI Workflow Tests

#### API Level
```bash
cd backend && npm test -- ai-workflow.test.ts
```

**Scenarios covered**:
- ✅ Generate content with OpenAI simulation
- ✅ Generate content with Anthropic simulation
- ✅ Translate content to different languages
- ✅ Track AI generation history
- ✅ Complete review workflow (approve/reject)
- ✅ End-to-end workflow: create → generate → review → approve

#### UI Level
```bash
npx playwright test tests/e2e/ai-workflow.spec.ts
```

**Scenarios covered**:
- ✅ Create content through UI form
- ✅ Generate AI content via buttons
- ✅ Display AI generation results
- ✅ Handle loading states during AI operations
- ✅ Show error states for failed operations
- ✅ Multiple AI model selection

### Database Integration Tests

#### Testcontainer Level
```bash
cd backend && npm test -- testcontainers.test.ts
```

**Scenarios covered**:
- ✅ Complete workflow with isolated database
- ✅ Concurrent operations handling
- ✅ Database constraint enforcement
- ✅ Transaction integrity
- ✅ Performance under bulk operations

## 📈 Understanding Test Results

### Success Indicators
```
✅ API Integration Tests: PASSED
✅ End-to-End Tests: PASSED  
✅ All assertions passed
✅ No errors in container logs
```

### Coverage Reports
```bash
# View HTML coverage report (after running with --coverage)
open backend/coverage/lcov-report/index.html
```

### Test Artifacts
```
test-results/          # Screenshots and videos from failed E2E tests
backend/coverage/      # Code coverage reports
playwright-report/     # Detailed E2E test report
test-logs/            # Container logs (on failure)
```

### Viewing E2E Test Reports
```bash
# View interactive HTML report
npx playwright show-report
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Error: Port 3000/8080/5432 already in use

# Solution: Stop existing services
docker compose down
./scripts/run-tests.sh
```

#### 2. Docker Not Running
```bash
# Error: Cannot connect to Docker daemon

# Solution: Start Docker Desktop or Docker daemon
# Then retry tests
./scripts/run-tests.sh
```

#### 3. Database Connection Failed
```bash
# Error: Database connection failed

# Solution: Clean and restart containers
docker compose down -v
./scripts/run-tests.sh
```

#### 4. Playwright Browser Installation
```bash
# Error: Playwright browsers not found

# Solution: Install browsers
npx playwright install
npm run test:e2e
```

#### 5. Test Timeout Errors
```bash
# Error: Test timeout exceeded

# Solution: Ensure services are running and increase timeout
docker compose ps  # Check service status
./scripts/run-tests.sh --no-cleanup  # Keep containers for debugging
```

### Debugging Failed Tests

#### Check Container Status
```bash
# See running containers
docker compose ps

# View container logs
docker compose logs backend
docker compose logs frontend
docker compose logs db
```

#### Run Tests with Debug Output
```bash
# Debug API tests
cd backend && DEBUG=* npm test

# Debug E2E tests
DEBUG=pw:api npm run test:e2e

# Run E2E tests in headed mode (see browser)
npx playwright test --headed
```

#### Inspect Test Database
```bash
# Connect to test database
docker exec -it ai-content-test-db psql -U postgres -d ai_content_test

# View tables
\dt

# View campaign data
SELECT * FROM campaigns;
```

### Manual Verification

#### Verify Services Manually
```bash
# Check backend health
curl http://localhost:8080/health
# Expected: {"status":"ok"}

# Check frontend
curl http://localhost:3000
# Expected: HTML response

# Create test campaign via API
curl -X POST http://localhost:8080/api/v1/campaigns \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Campaign", "description": "Testing"}'
```

#### Verify UI Manually
1. Open http://localhost:3000 in browser
2. Click "Go to Campaigns"
3. Click "Create Campaign"
4. Fill form and submit
5. Verify campaign appears in list

## 🔄 CI/CD Testing

### GitHub Actions Pipeline
The project includes automated testing via GitHub Actions that runs on:
- Every push to `main` or `develop` branches
- Every pull request to `main` branch

### Pipeline Stages
1. **Backend Tests** - API integration tests with PostgreSQL
2. **Frontend Tests** - TypeScript compilation and linting  
3. **E2E Tests** - Full application testing with Playwright
4. **Security Scan** - Vulnerability scanning with Trivy
5. **Deploy** - Build and push Docker images (on main branch)

### Viewing CI Results
1. Go to your GitHub repository
2. Click "Actions" tab
3. View test results and logs
4. Download test artifacts (coverage, screenshots, etc.)

### Local CI Simulation
```bash
# Run the same tests as CI locally
./scripts/run-tests.sh --coverage --testcontainers
```

## 📚 Test Development Guide

### Adding New Tests

#### New API Test
```typescript
// backend/tests/integration/new-feature.test.ts
describe('New Feature API', () => {
  it('should handle new endpoint', async () => {
    const response = await request(app)
      .post('/api/v1/new-endpoint')
      .send(testData)
      .expect(201);
      
    expect(response.body).toMatchObject({
      id: expect.any(String),
      // Add assertions
    });
  });
});
```

#### New E2E Test
```typescript
// tests/e2e/new-feature.spec.ts
test('should use new feature', async ({ page }) => {
  await page.goto('/new-feature');
  await page.click('[data-testid=action-button]');
  await expect(page.getByText('Success')).toBeVisible();
});
```

### Test Data Management
- Add test fixtures in `backend/tests/fixtures/`
- Add E2E test data in `tests/e2e/fixtures/`
- Use consistent naming and structure

### Best Practices
- Write descriptive test names
- Test both success and error scenarios
- Use proper assertions
- Clean up test data
- Mock external services
- Test user workflows, not implementation details

## 🎯 Performance Testing

### Load Testing (Basic)
```bash
# Test API performance
cd backend
npm test -- --testNamePattern="performance"

# Test concurrent operations
npm test -- --testNamePattern="concurrent"
```

### Performance Metrics
The test suite collects basic performance metrics:
- API response times
- Database query performance
- Frontend load times
- Memory usage during tests

## 📝 Summary

### Testing Commands Quick Reference
```bash
# Complete test suite
./scripts/run-tests.sh

# API tests only
./scripts/run-tests.sh --api-only

# E2E tests only  
./scripts/run-tests.sh --e2e-only

# With coverage
./scripts/run-tests.sh --coverage

# Manual backend tests
cd backend && npm test

# Manual E2E tests
npm run test:e2e

# Interactive E2E tests
npm run test:e2e:ui
```

### Test Levels
1. **Unit Tests** - Individual functions (future enhancement)
2. **API Tests** - Backend endpoints and business logic ✅
3. **Integration Tests** - Database and service integration ✅
4. **E2E Tests** - Complete user workflows ✅
5. **Performance Tests** - Load and stress testing ✅

For questions or issues with testing, refer to this guide or check the test files for examples.
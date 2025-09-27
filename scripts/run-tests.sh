#!/bin/bash

# AI Content Workflow Test Runner Script

set -e

echo "🚀 Starting AI Content Workflow Test Suite"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Portable wait helpers (no GNU timeout dependency)
# Added to improve macOS compatibility.
wait_for_cmd() {
    local seconds=$1
    shift
    local start=$(date +%s)
    while true; do
        if eval "$@"; then
            return 0
        fi
        local now=$(date +%s)
        if [ $((now - start)) -ge $seconds ]; then
            return 1
        fi
        sleep 2
    done
}

wait_for_http() {
    local url=$1
    local seconds=$2
    wait_for_cmd "$seconds" curl -fsS "$url" > /dev/null
}

# Parse command line arguments
RUN_API_TESTS=true
RUN_E2E_TESTS=true
RUN_TESTCONTAINER_TESTS=false
GENERATE_COVERAGE=false
CLEANUP=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --api-only)
            RUN_E2E_TESTS=false
            shift
            ;;
        --e2e-only)
            RUN_API_TESTS=false
            RUN_TESTCONTAINER_TESTS=false
            shift
            ;;
        --testcontainers)
            RUN_TESTCONTAINER_TESTS=true
            shift
            ;;
        --coverage)
            GENERATE_COVERAGE=true
            shift
            ;;
        --no-cleanup)
            CLEANUP=false
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --api-only           Run only API integration tests"
            echo "  --e2e-only          Run only E2E tests"
            echo "  --testcontainers    Include Testcontainer tests"
            echo "  --coverage          Generate coverage reports"
            echo "  --no-cleanup        Don't cleanup Docker containers after tests"
            echo "  --help              Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Cleanup function
cleanup() {
    if [ "$CLEANUP" = true ]; then
        print_status "Cleaning up test environment..."
        docker compose -f docker-compose.test.yml down -v 2>/dev/null || true
        docker compose down 2>/dev/null || true
    fi
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available (try 'docker compose version')"
    exit 1
fi

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    print_status "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    print_status "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

if [ ! -d "node_modules" ] && [ "$RUN_E2E_TESTS" = true ]; then
    print_status "Installing root dependencies for E2E tests..."
    npm install
fi

# Run API Integration Tests
if [ "$RUN_API_TESTS" = true ]; then
    print_status "Running API Integration Tests..."
    
    # Start test database
    print_status "Starting test database..."
    docker compose -f docker-compose.test.yml up test-db -d
    
    # Wait for database to be ready
    print_status "Waiting for test database to be ready..."
    if ! wait_for_cmd 30 docker exec ai-content-test-db pg_isready -U postgres > /dev/null 2>&1; then
        print_error "Test database not ready after timeout"
        exit 1
    fi
    
    # Run backend tests
    cd backend
    
    if [ "$GENERATE_COVERAGE" = true ]; then
        print_status "Running API tests with coverage..."
        npm run test:coverage
    else
        print_status "Running API tests..."
        npm test
    fi
    
    if [ $? -eq 0 ]; then
        print_success "API Integration Tests passed!"
    else
        print_error "API Integration Tests failed!"
        exit 1
    fi
    
    cd ..
fi

# Run Testcontainer Tests
if [ "$RUN_TESTCONTAINER_TESTS" = true ]; then
    print_status "Running Testcontainer Integration Tests..."
    
    cd backend
    npm test -- --testPathPattern=testcontainers --runInBand
    
    if [ $? -eq 0 ]; then
        print_success "Testcontainer Integration Tests passed!"
    else
        print_error "Testcontainer Integration Tests failed!"
        exit 1
    fi
    
    cd ..
fi

# Run E2E Tests
if [ "$RUN_E2E_TESTS" = true ]; then
    print_status "Running End-to-End Tests..."
    
    # Install Playwright if not already installed
    if [ ! -d "node_modules/@playwright" ]; then
        print_status "Installing Playwright..."
        npx playwright install
    fi
    
    # Ensure clean state, then let Playwright manage the webServer
    print_status "Resetting containers (docker compose down -v)..."
    docker compose down -v 2>/dev/null || true
    
    # Run E2E tests (Playwright will start webServer per config)
    print_status "Executing E2E tests (chromium, single worker) — Playwright will start services"
    CI=true npx playwright test --project=chromium --workers=1
    
    if [ $? -eq 0 ]; then
        print_success "E2E Tests passed!"
    else
        print_error "E2E Tests failed!"
        
        # Save logs for debugging
        print_status "Saving container logs for debugging..."
        mkdir -p test-logs
        docker compose logs backend > test-logs/backend.log 2>&1
        docker compose logs frontend > test-logs/frontend.log 2>&1
        docker compose logs db > test-logs/database.log 2>&1
        
        print_warning "Container logs saved to test-logs/ directory"
        exit 1
    fi
fi

# Generate consolidated coverage report
if [ "$GENERATE_COVERAGE" = true ]; then
    print_status "Generating consolidated coverage report..."
    
    if [ -d "backend/coverage" ]; then
        print_success "Backend coverage report available at: backend/coverage/lcov-report/index.html"
    fi
    
    # Add frontend coverage if implemented
    # if [ -d "frontend/coverage" ]; then
    #     print_success "Frontend coverage report available at: frontend/coverage/lcov-report/index.html"
    # fi
fi

# Performance metrics
if [ "$RUN_E2E_TESTS" = true ]; then
    print_status "Collecting performance metrics..."
    
    # Basic health check timing
    BACKEND_RESPONSE_TIME=$(curl -w "%{time_total}" -s -o /dev/null http://localhost:8080/health)
    FRONTEND_RESPONSE_TIME=$(curl -w "%{time_total}" -s -o /dev/null http://localhost:3000)
    
    print_success "Backend health check response time: ${BACKEND_RESPONSE_TIME}s"
    print_success "Frontend response time: ${FRONTEND_RESPONSE_TIME}s"
fi

print_success "🎉 All tests completed successfully!"

# Test summary
echo ""
echo "📊 Test Summary:"
echo "=================="
if [ "$RUN_API_TESTS" = true ]; then
    echo "✅ API Integration Tests: PASSED"
fi
if [ "$RUN_TESTCONTAINER_TESTS" = true ]; then
    echo "✅ Testcontainer Tests: PASSED"
fi
if [ "$RUN_E2E_TESTS" = true ]; then
    echo "✅ End-to-End Tests: PASSED"
fi
if [ "$GENERATE_COVERAGE" = true ]; then
    echo "📈 Coverage Reports: GENERATED"
fi
echo ""

print_success "Test suite execution completed!"
# Portable wait helpers (no GNU timeout dependency)
wait_for_cmd() {
    local seconds=$1
    shift
    local start=$(date +%s)
    while true; do
        if eval "$@"; then
            return 0
        fi
        local now=$(date +%s)
        if [ $((now - start)) -ge $seconds ]; then
            return 1
        fi
        sleep 2
    done
}

wait_for_http() {
    local url=$1
    local seconds=$2
    wait_for_cmd "$seconds" curl -fsS "$url" > /dev/null
}

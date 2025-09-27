# 🛠️ Service Management Commands

Quick reference for managing the AI Content Workflow services and database.

## 🚀 Service Management

### Start Services
```bash
# Start services in foreground (with logs)
npm run dev

# Start services in background (detached)
npm start

# Restart services
npm run restart
```

### Stop Services
```bash
# Stop services (keep containers)
npm run stop

# Stop and remove containers
npm run down

# Complete cleanup (removes volumes and unused resources)
npm run clean
```

### View Logs
```bash
# View all service logs
npm run logs

# View specific service logs
npm run logs:backend
npm run logs:frontend  
npm run logs:db
```

## 🗄️ Database Management

### Quick Commands
```bash
# Reset database (destroy data and restart fresh)
npm run reset-db

# Or use the dedicated script
./scripts/manage-db.sh reset
```

### Advanced Database Commands
```bash
# Show database status and info
./scripts/manage-db.sh status

# Create database backup
./scripts/manage-db.sh backup

# Connect to database shell
./scripts/manage-db.sh connect

# View database logs
./scripts/manage-db.sh logs

# Complete cleanup and restart
./scripts/manage-db.sh clean

# Show help
./scripts/manage-db.sh help
```

## 🧪 Testing Commands

### Run Tests
```bash
# Run all tests
npm test

# Run only API tests
npm run test:api

# Run only E2E tests
npm run test:e2e

# Run E2E tests with interactive UI
npm run test:e2e:ui

# Run complete test suite with our script
./scripts/run-tests.sh

# Test specific scenarios
./scripts/run-tests.sh --api-only
./scripts/run-tests.sh --e2e-only
./scripts/run-tests.sh --coverage
```

## 🔧 Development Workflow

### Initial Setup
```bash
# Install all dependencies
npm run install:all

# Start services
npm start

# Verify everything is running
./scripts/manage-db.sh status
```

### Daily Development
```bash
# Start development with logs
npm run dev

# In another terminal - run tests
npm run test:e2e:ui
```

### When Tests Are Failing
```bash
# Reset database to clean state
./scripts/manage-db.sh reset

# Or use the npm shortcut
npm run reset-db

# Run tests again
npm run test:e2e
```

### Debugging
```bash
# Check service status
docker compose ps

# View specific service logs
npm run logs:backend

# Connect to database
./scripts/manage-db.sh connect

# Check database contents
./scripts/manage-db.sh status
```

## 📊 Database Information

### Database Shell Commands
Once connected with `./scripts/manage-db.sh connect`:

```sql
-- List all databases
\l

-- List tables in current database
\dt

-- Show campaigns
SELECT id, name, status, created_at FROM campaigns;

-- Count campaigns
SELECT COUNT(*) FROM campaigns;

-- Delete all campaigns (be careful!)
DELETE FROM campaigns;

-- Exit
\q
```

### Backup and Restore
```bash
# Create backup
./scripts/manage-db.sh backup

# Backups are stored in ./backups/
ls -la backups/

# View backup contents
cat backups/db_backup_20240101_120000.sql
```

## 🚨 Troubleshooting

### Services Won't Start
```bash
# Check Docker is running
docker --version
docker compose version

# Clean everything and restart
npm run clean
npm start
```

### Database Connection Issues  
```bash
# Reset database
./scripts/manage-db.sh reset

# Check database status
./scripts/manage-db.sh status

# View database logs
./scripts/manage-db.sh logs
```

### Port Conflicts
```bash
# Stop all services
npm run down

# Check what's using the ports
lsof -i :3000  # Frontend
lsof -i :8080  # Backend  
lsof -i :5432  # Database

# Start services again
npm start
```

### E2E Test Issues
```bash
# Reset database for clean state
npm run reset-db

# Install Playwright browsers
npx playwright install

# Run tests
npm run test:e2e
```

## 💡 Pro Tips

1. **Clean State**: Use `npm run reset-db` before running E2E tests for reliable results
2. **Background Services**: Use `npm start` for development, `npm run dev` for debugging
3. **Database Backups**: Automatic cleanup keeps only the last 5 backups
4. **Logs**: Use specific log commands (`npm run logs:backend`) to focus on one service
5. **Database Shell**: Great for inspecting data and debugging issues

## 📝 Environment Files

The services use these configuration files:
- `compose.yml` - Main Docker Compose configuration
- `docker-compose.test.yml` - Test environment configuration  
- Backend uses environment variables from Docker Compose
- Frontend uses `NEXT_PUBLIC_API_URL` for API connection

---

For more detailed information, see:
- [Testing Guide](./TESTING.md)
- [Main README](../README.md)
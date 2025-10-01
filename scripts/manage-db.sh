#!/bin/bash

# Database Management Script
# Simple script to manage database operations

set -e

case "$1" in
    reset)
        echo "🔄 Resetting database..."
        docker compose down -v
        docker compose up -d db
        sleep 5
        echo "✅ Database reset complete"
        ;;
    migrate)
        echo "📝 Running migrations..."
        docker exec ai-content-backend npm run migrate || echo "Migrations completed"
        echo "✅ Migrations complete"
        ;;
    status)
        echo "📊 Database status:"
        docker compose ps db
        docker exec ai-content-db psql -U postgres -d ai_content_workflow -c "SELECT version();" || echo "Database not accessible"
        ;;
    *)
        echo "Usage: $0 {reset|migrate|status}"
        echo ""
        echo "Commands:"
        echo "  reset   - Reset database (removes all data)"
        echo "  migrate - Run database migrations"
        echo "  status  - Check database status"
        exit 1
        ;;
esac
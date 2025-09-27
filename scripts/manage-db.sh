#!/bin/bash

# Database Management Script for AI Content Workflow

set -e

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

show_help() {
    echo "Database Management Commands:"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  reset       Reset database (destroy volumes and restart)"
    echo "  clean       Clean database and restart fresh"
    echo "  backup      Create database backup"
    echo "  restore     Restore from backup (not implemented)"
    echo "  status      Show database status"
    echo "  logs        Show database logs"
    echo "  connect     Connect to database shell"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 reset    # Reset database with fresh data"
    echo "  $0 status   # Check if database is running"
    echo "  $0 logs     # View database logs"
}

check_prerequisites() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi

    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available (try 'docker compose version')"
        exit 1
    fi
}

reset_database() {
    print_warning "This will destroy all data in the database!"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Stopping services..."
        docker compose stop
        
        print_status "Removing database volumes..."
        docker compose down -v
        
        print_status "Starting services with fresh database..."
        docker compose up -d --build
        
        print_status "Waiting for database to be ready..."
        timeout 30s bash -c 'until docker compose exec db pg_isready -U postgres -q; do sleep 1; done' || {
            print_error "Database failed to start within 30 seconds"
            exit 1
        }
        
        print_success "Database reset completed!"
        print_status "Services are running in background mode"
        print_status "Run 'npm run logs' to view logs"
    else
        print_status "Database reset cancelled"
    fi
}

clean_database() {
    print_warning "This will remove all containers, volumes, and unused Docker resources!"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Stopping and removing all containers..."
        docker compose down -v
        
        print_status "Cleaning up Docker resources..."
        docker system prune -f
        
        print_status "Starting fresh services..."
        docker compose up -d --build
        
        print_success "Complete cleanup and restart completed!"
    else
        print_status "Cleanup cancelled"
    fi
}

backup_database() {
    print_status "Creating database backup..."
    
    BACKUP_DIR="./backups"
    mkdir -p "$BACKUP_DIR"
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
    
    docker compose exec -T db pg_dump -U postgres ai_content > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        print_success "Database backup created: $BACKUP_FILE"
        
        # Show backup size
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        print_status "Backup size: $BACKUP_SIZE"
        
        # Keep only the last 5 backups
        BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/db_backup_*.sql 2>/dev/null | wc -l)
        if [ "$BACKUP_COUNT" -gt 5 ]; then
            print_status "Cleaning up old backups (keeping last 5)..."
            ls -1t "$BACKUP_DIR"/db_backup_*.sql | tail -n +6 | xargs rm -f
        fi
    else
        print_error "Failed to create database backup"
        exit 1
    fi
}

show_status() {
    print_status "Database Status:"
    echo ""
    
    # Check if containers are running
    if docker compose ps | grep -q "db.*Up"; then
        print_success "✅ Database container is running"
        
        # Check database connectivity
        if docker compose exec -T db pg_isready -U postgres -q; then
            print_success "✅ Database is accepting connections"
            
            # Show database info
            echo ""
            print_status "Database Information:"
            docker compose exec -T db psql -U postgres -d ai_content -c "\l" 2>/dev/null || {
                print_warning "Cannot connect to ai_content database (may not exist yet)"
            }
            
            # Show table count if database exists
            TABLE_COUNT=$(docker compose exec -T db psql -U postgres -d ai_content -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs || echo "0")
            print_status "Tables in database: $TABLE_COUNT"
            
            # Show campaign count if table exists
            CAMPAIGN_COUNT=$(docker compose exec -T db psql -U postgres -d ai_content -t -c "SELECT COUNT(*) FROM campaigns;" 2>/dev/null | xargs || echo "0")
            print_status "Campaigns in database: $CAMPAIGN_COUNT"
            
        else
            print_error "❌ Database is not accepting connections"
        fi
    else
        print_error "❌ Database container is not running"
        print_status "Run 'npm start' to start services"
    fi
    
    echo ""
    print_status "Container Status:"
    docker compose ps
}

show_logs() {
    print_status "Showing database logs (Press Ctrl+C to exit)..."
    docker compose logs -f db
}

connect_to_db() {
    print_status "Connecting to database shell..."
    print_status "Use '\\q' to exit, '\\l' to list databases, '\\dt' to list tables"
    echo ""
    
    if docker compose ps | grep -q "db.*Up"; then
        docker compose exec db psql -U postgres -d ai_content
    else
        print_error "Database container is not running"
        print_status "Run 'npm start' to start services first"
        exit 1
    fi
}

# Main script logic
check_prerequisites

case "${1:-help}" in
    "reset")
        reset_database
        ;;
    "clean")
        clean_database
        ;;
    "backup")
        backup_database
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "connect")
        connect_to_db
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
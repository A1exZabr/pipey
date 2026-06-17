#!/bin/bash

# Pipey Docker Management Script
# Usage: ./docker.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project name
PROJECT_NAME="pipey"

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to start Docker daemon (Colima or Docker Desktop)
start_docker() {
    print_info "Starting Docker daemon..."

    # Check if Colima is installed
    if command -v colima &> /dev/null; then
        print_info "Starting Colima..."
        colima start 2>&1 | tail -5
        sleep 3
        return 0
    fi

    # Check if Docker Desktop is installed (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if [ -d "/Applications/Docker.app" ]; then
            print_info "Starting Docker Desktop..."
            open -a Docker
            print_info "Waiting for Docker Desktop to start..."

            # Wait up to 60 seconds for Docker to start
            for i in {1..60}; do
                if docker info > /dev/null 2>&1; then
                    print_success "Docker Desktop started!"
                    return 0
                fi
                sleep 1
            done

            print_error "Docker Desktop failed to start in time"
            return 1
        fi
    fi

    print_error "No Docker runtime found. Please install Docker Desktop or Colima."
    return 1
}

# Function to check if Docker is running, start if needed
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_warning "Docker is not running. Attempting to start..."
        if ! start_docker; then
            print_error "Failed to start Docker. Please start it manually."
            exit 1
        fi

        # Double check
        if ! docker info > /dev/null 2>&1; then
            print_error "Docker still not responding. Please check your Docker installation."
            exit 1
        fi
    fi
    print_success "Docker is running"
}

# Function to show help
show_help() {
    echo "Pipey Docker Management Script"
    echo ""
    echo "Usage: ./docker.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       - Start all services in production mode (full build)"
    echo "  dev         - Start services in development mode (hot reload)"
    echo "  stop        - Stop all services"
    echo "  restart     - Restart all services"
    echo "  rebuild     - Rebuild and restart all services"
    echo "  logs        - Show logs from all services"
    echo "  logs-f      - Follow logs from all services"
    echo "  status      - Show status of all services"
    echo "  clean       - Stop and remove all containers, volumes, and images"
    echo "  db-migrate  - Run database migrations"
    echo "  db-reset    - Reset database (destructive!)"
    echo "  shell-be    - Open shell in backend container"
    echo "  shell-fe    - Open shell in frontend container"
    echo "  test        - Run tests"
    echo "  help        - Show this help message"
    echo ""
}

# Function to start services in production mode
start_prod() {
    print_info "Starting Pipey in production mode..."
    check_docker

    print_info "Building images..."
    docker compose -f docker compose.prod.yml build

    print_info "Starting services..."
    docker compose -f docker compose.prod.yml up -d

    print_success "Pipey is starting!"
    print_info "Waiting for services to be healthy..."
    sleep 10

    docker compose -f docker compose.prod.yml ps

    echo ""
    print_success "Pipey is running!"
    echo ""
    echo "🌐 Frontend:  http://localhost:3000"
    echo "🔧 Backend:   http://localhost:3001/api"
    echo "💾 MinIO:     http://localhost:9001 (pipey / pipey_dev_password)"
    echo ""
    print_info "Run './docker.sh logs-f' to see logs"
}

# Function to start services in dev mode
start_dev() {
    print_info "Starting Pipey in development mode..."
    check_docker

    print_info "Starting infrastructure services..."
    docker compose up -d postgres redis minio

    print_success "Infrastructure is running!"
    echo ""
    print_info "Backend and Frontend should be started manually:"
    echo "  Terminal 1: cd backend && npm run start:dev"
    echo "  Terminal 2: cd frontend && npm run dev"
    echo ""
}

# Function to stop services
stop_services() {
    print_info "Stopping Pipey services..."

    # Try both compose files
    docker compose -f docker compose.prod.yml down 2>/dev/null || true
    docker compose down 2>/dev/null || true

    print_success "All services stopped"
}

# Function to restart services
restart_services() {
    stop_services
    sleep 2
    start_prod
}

# Function to rebuild services
rebuild_services() {
    print_info "Rebuilding Pipey..."

    docker compose -f docker compose.prod.yml down
    docker compose -f docker compose.prod.yml build --no-cache
    docker compose -f docker compose.prod.yml up -d

    print_success "Rebuild complete!"
}

# Function to show logs
show_logs() {
    docker compose -f docker compose.prod.yml logs "$@"
}

# Function to show status
show_status() {
    print_info "Service Status:"
    docker compose -f docker compose.prod.yml ps
}

# Function to clean everything
clean_all() {
    print_warning "This will remove all containers, volumes, and images!"
    read -p "Are you sure? (yes/no): " confirm

    if [ "$confirm" = "yes" ]; then
        print_info "Cleaning up..."

        docker compose -f docker compose.prod.yml down -v
        docker compose down -v

        # Remove built images
        docker images | grep pipey | awk '{print $3}' | xargs docker rmi -f 2>/dev/null || true

        print_success "Cleanup complete!"
    else
        print_info "Cleanup cancelled"
    fi
}

# Function to run migrations
run_migrations() {
    print_info "Running database migrations..."

    docker compose -f docker compose.prod.yml exec backend npx prisma migrate deploy

    print_success "Migrations complete!"
}

# Function to reset database
reset_database() {
    print_warning "This will DELETE ALL DATA in the database!"
    read -p "Are you sure? Type 'RESET' to confirm: " confirm

    if [ "$confirm" = "RESET" ]; then
        print_info "Resetting database..."

        docker compose -f docker compose.prod.yml exec backend npx prisma migrate reset --force

        print_success "Database reset complete!"
    else
        print_info "Database reset cancelled"
    fi
}

# Function to open shell in backend
shell_backend() {
    print_info "Opening shell in backend container..."
    docker compose -f docker compose.prod.yml exec backend sh
}

# Function to open shell in frontend
shell_frontend() {
    print_info "Opening shell in frontend container..."
    docker compose -f docker compose.prod.yml exec frontend sh
}

# Main script logic
case "$1" in
    start)
        start_prod
        ;;
    dev)
        start_dev
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    rebuild)
        rebuild_services
        ;;
    logs)
        show_logs "${@:2}"
        ;;
    logs-f)
        show_logs -f "${@:2}"
        ;;
    status)
        show_status
        ;;
    clean)
        clean_all
        ;;
    db-migrate)
        run_migrations
        ;;
    db-reset)
        reset_database
        ;;
    shell-be)
        shell_backend
        ;;
    shell-fe)
        shell_frontend
        ;;
    test)
        print_info "Running tests..."
        docker compose -f docker compose.prod.yml exec backend npm test
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac

.PHONY: help start dev stop restart rebuild logs status clean db-migrate db-reset shell-be shell-fe test

# Default target
.DEFAULT_GOAL := help

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m

help: ## Show this help message
	@echo "$(GREEN)Pipey - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""

start: ## Start all services in production mode
	@./docker.sh start

dev: ## Start infrastructure for development
	@./docker.sh dev

stop: ## Stop all services
	@./docker.sh stop

restart: ## Restart all services
	@./docker.sh restart

rebuild: ## Rebuild and restart all services
	@./docker.sh rebuild

logs: ## Show logs from all services
	@./docker.sh logs

logs-f: ## Follow logs from all services
	@./docker.sh logs-f

status: ## Show status of all services
	@./docker.sh status

clean: ## Remove all containers, volumes, and images
	@./docker.sh clean

db-migrate: ## Run database migrations
	@./docker.sh db-migrate

db-reset: ## Reset database (destructive!)
	@./docker.sh db-reset

shell-be: ## Open shell in backend container
	@./docker.sh shell-be

shell-fe: ## Open shell in frontend container
	@./docker.sh shell-fe

test: ## Run tests
	@./docker.sh test

# Development helpers
install: ## Install dependencies for all projects
	@echo "$(BLUE)Installing backend dependencies...$(NC)"
	@cd backend && npm install
	@echo "$(GREEN)✓ Backend dependencies installed$(NC)"
	@echo ""
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	@cd frontend && npm install
	@echo "$(GREEN)✓ Frontend dependencies installed$(NC)"

setup: install ## Initial setup (install + start infrastructure)
	@echo ""
	@echo "$(BLUE)Starting infrastructure...$(NC)"
	@make dev
	@echo ""
	@echo "$(GREEN)✓ Setup complete!$(NC)"
	@echo ""
	@echo "Run in separate terminals:"
	@echo "  Terminal 1: cd backend && npm run start:dev"
	@echo "  Terminal 2: cd frontend && npm run dev"

prisma-generate: ## Generate Prisma client
	@cd backend && npx prisma generate

prisma-studio: ## Open Prisma Studio
	@cd backend && npx prisma studio

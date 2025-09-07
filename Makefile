# AI Trading System - Docker Compose Management
# Based on Flow Nexus mastery project patterns

.PHONY: help build up down logs shell test clean status

# Default environment
ENV ?= development

help: ## Show this help message
	@echo 'Usage: make [target] [ENV=environment]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Environment setup
setup: ## Set up environment files and dependencies
	@echo "Setting up AI Trading System..."
	@if [ ! -f .env ]; then cp .env.example .env; echo "Created .env file - please configure your API keys"; fi
	@mkdir -p logs data grafana/dashboards grafana/datasources
	@echo "Setup complete! Please edit .env with your API keys before starting."

# Docker operations
build: ## Build all services
	docker-compose build

up: ## Start all core services
	docker-compose up -d

up-monitoring: ## Start with monitoring (Grafana)
	docker-compose --profile monitoring up -d

up-full: ## Start all services including backtesting
	docker-compose --profile monitoring --profile backtesting up -d

down: ## Stop all services
	docker-compose down

down-clean: ## Stop services and remove volumes
	docker-compose down -v

restart: down up ## Restart all services

# Service management
logs: ## View logs from all services
	docker-compose logs -f

logs-engine: ## View trading engine logs
	docker-compose logs -f trading-engine

logs-data: ## View data fetcher logs
	docker-compose logs -f data-fetcher

logs-db: ## View database logs
	docker-compose logs -f postgres

# Database operations
db-shell: ## Connect to PostgreSQL database
	docker-compose exec postgres psql -U trader -d trading

db-backup: ## Backup database
	@mkdir -p backups
	docker-compose exec -T postgres pg_dump -U trader -d trading > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Database backup created in backups/"

db-restore: ## Restore database from backup (specify BACKUP_FILE=filename)
	@if [ -z "$(BACKUP_FILE)" ]; then echo "Please specify BACKUP_FILE=filename"; exit 1; fi
	docker-compose exec -T postgres psql -U trader -d trading < backups/$(BACKUP_FILE)

# Service shells
shell-engine: ## Shell into trading engine container
	docker-compose exec trading-engine sh

shell-redis: ## Connect to Redis CLI
	docker-compose exec redis redis-cli

shell-data: ## Shell into data fetcher container
	docker-compose exec data-fetcher sh

# Testing
test: ## Run all tests
	@echo "Running trading system tests..."
	docker-compose exec trading-engine npm test

test-strategies: ## Test trading strategies
	docker-compose exec trading-engine npm run test:strategies

# Performance and monitoring
status: ## Show system status
	@echo "=== Docker Compose Status ==="
	docker-compose ps
	@echo ""
	@echo "=== Container Resource Usage ==="
	docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
	@echo ""
	@echo "=== Trading Engine Health ==="
	@curl -s http://localhost:3000/health | jq . || echo "Dashboard not accessible"

portfolio: ## Show current portfolio status
	@echo "=== Portfolio Status ==="
	@curl -s http://localhost:8080/api/portfolio | jq . || echo "Trading engine not accessible"

trades: ## Show recent trades
	@echo "=== Recent Trades ==="
	@curl -s http://localhost:8080/api/trades?limit=10 | jq . || echo "Trading engine not accessible"

risk: ## Show risk metrics
	@echo "=== Risk Metrics ==="
	@curl -s http://localhost:8080/api/risk | jq . || echo "Trading engine not accessible"

# Development
dev-up: ## Start in development mode with hot reload
	@echo "Starting in development mode..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

dev-logs: ## Follow development logs
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Backtesting
backtest: ## Run backtesting
	docker-compose --profile backtesting run --rm backtester

backtest-strategy: ## Run specific strategy backtest (specify STRATEGY=name)
	@if [ -z "$(STRATEGY)" ]; then echo "Please specify STRATEGY=strategy_name"; exit 1; fi
	docker-compose --profile backtesting run --rm backtester npm run backtest -- --strategy=$(STRATEGY)

# Data management
fetch-data: ## Manually trigger data fetch
	@echo "Triggering manual data fetch..."
	@curl -X POST http://localhost:8080/api/data/fetch || echo "Data fetcher not accessible"

clean-data: ## Clean old market data (keeps last 30 days)
	docker-compose exec postgres psql -U trader -d trading -c "DELETE FROM market_data WHERE timestamp < NOW() - INTERVAL '30 days';"

# Maintenance
clean: ## Clean up Docker resources
	docker-compose down
	docker system prune -f
	docker volume prune -f

clean-all: ## Clean everything including images
	docker-compose down -v --rmi all
	docker system prune -af

update: ## Update Docker images
	docker-compose pull
	docker-compose up -d

# Security
security-scan: ## Run security scan on containers
	@echo "Running security scan..."
	@command -v docker-scout >/dev/null 2>&1 && docker scout cves || echo "Docker Scout not available"

# Quick actions
quick-start: setup build up ## Quick start: setup + build + run
	@echo "AI Trading System is starting..."
	@echo "Dashboard will be available at: http://localhost:3000"
	@echo "Trading API at: http://localhost:8080"
	@echo "Run 'make logs' to see logs"
	@echo "Run 'make status' to check system status"

# Production deployment
prod-up: ## Start in production mode
	@echo "Starting in production mode..."
	ENV=production docker-compose up -d

# Emergency stop
emergency-stop: ## Emergency stop all trading
	@echo "EMERGENCY STOP - Halting all trading operations"
	docker-compose exec trading-engine curl -X POST http://localhost:8080/api/emergency/stop
	docker-compose stop trading-engine
	@echo "Trading engine stopped. Portfolio positions preserved."

# Monitoring shortcuts
dashboard: ## Open web dashboard
	@echo "Opening dashboard..."
	@open http://localhost:3000 || echo "Please visit http://localhost:3000"

grafana: ## Open Grafana monitoring
	@echo "Opening Grafana..."
	@open http://localhost:3001 || echo "Please visit http://localhost:3001 (admin/admin123)"

# Documentation
docs: ## Generate API documentation
	docker-compose exec trading-engine npm run docs

# Version info
version: ## Show version information
	@echo "AI Trading System"
	@echo "Based on Flow Nexus challenge mastery"
	@echo ""
	@echo "Docker Compose version:"
	@docker-compose version
	@echo ""
	@echo "Services:"
	@docker-compose config --services
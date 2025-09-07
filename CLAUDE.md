# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Docker Operations
```bash
# Start basic trading system
docker-compose up -d

# Start with monitoring (includes Grafana)
docker-compose --profile monitoring up -d

# Start with backtesting capability
docker-compose --profile backtesting up -d

# Stop all services
docker-compose down
```

### Node.js Services
```bash
# Trading engine development
cd services/trading-engine
npm run dev          # Start with nodemon
npm start           # Production start
npm test            # Run Jest tests
npm run test:watch  # Watch mode testing
```

### Service Access
- **Dashboard:** http://localhost:3000
- **Grafana:** http://localhost:3001 (admin/admin123)
- **Database:** localhost:5432 (trader/secure_password_123)
- **Redis:** localhost:6379

## Architecture Overview

This is a microservices-based AI trading system built with Docker Compose. The core architecture consists of:

- **Trading Engine** (`services/trading-engine/`) - Main AI decision-making service with Enhanced RSI strategy
- **Data Fetcher** (`services/data-fetcher/`) - Real-time market data aggregation from multiple APIs
- **Risk Manager** (`services/risk-manager/`) - Position sizing and risk control
- **Dashboard** (`services/dashboard/`) - Web interface for monitoring
- **Backtester** (`services/backtester/`) - Strategy validation and optimization

### Data Layer
- **PostgreSQL** - Trading database for historical data and positions
- **Redis** - Cache for market data and real-time signals

### Key Strategies
The primary strategy is **Enhanced RSI** (`services/trading-engine/src/strategies/enhancedRSI.js`) which implements:
- RSI-based signal generation with volume confirmation
- Multi-timeframe analysis using MACD and Moving Averages
- Advanced risk management with stop-loss/take-profit
- Divergence detection patterns

## Configuration

### Environment Setup
Copy `.env.example` to `.env` and configure:
- API keys for Alpha Vantage, Polygon.io
- Trading parameters (PAPER_TRADING, RISK_LIMIT, etc.)
- Database credentials

### Trading Parameters
- `PAPER_TRADING=true` - Always use for development
- `RISK_LIMIT=0.02` - 2% stop loss
- `MAX_PORTFOLIO_RISK=0.05` - 5% max portfolio risk
- `STARTING_BALANCE=10000` - Initial capital for paper trading

## Service Dependencies

All services depend on PostgreSQL and Redis. The trading engine requires the data fetcher to be running first. Services communicate through Redis for real-time signals and PostgreSQL for persistent data.

### Market Hours
The system includes market hours detection (Monday-Friday, 9:30 AM - 4:00 PM EST) and only executes trades during these hours.

### Scheduled Operations
- Market analysis: Every minute during market hours
- Portfolio rebalancing: Every hour
- Risk assessment: Every 15 minutes
- Daily reports: 4:00 PM weekdays

## Development Notes

- All services use Node.js 18+ with Express.js
- Database schema initialization via `sql/init/` directory
- Logging with Winston across all services
- Graceful shutdown handling with SIGTERM/SIGINT
- No test files currently exist - Jest is configured but tests need to be written
- Strategy interface allows for pluggable trading algorithms
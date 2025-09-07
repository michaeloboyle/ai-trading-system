/**
 * AI Trading Engine - Main Entry Point
 * Based on Flow Nexus challenge mastery patterns
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');

const { logger } = require('./src/utils/logger');
const { TradingEngine } = require('./src/core/TradingEngine');
const { DatabaseManager } = require('./src/utils/database');
const { RedisManager } = require('./src/utils/redis');
const { PortfolioManager } = require('./src/core/PortfolioManager');
const { RiskManager } = require('./src/core/RiskManager');

class TradingEngineService {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 8080;
        this.tradingEngine = null;
        this.isRunning = false;
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request logging
        this.app.use((req, res, next) => {
            logger.info(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '1.0.0',
                engine: {
                    running: this.isRunning,
                    strategies: this.tradingEngine?.getActiveStrategies() || []
                }
            });
        });

        // Trading engine status
        this.app.get('/api/status', async (req, res) => {
            try {
                const status = await this.tradingEngine?.getStatus();
                res.json({
                    success: true,
                    data: status
                });
            } catch (error) {
                logger.error('Status endpoint error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Portfolio information
        this.app.get('/api/portfolio', async (req, res) => {
            try {
                const portfolio = await this.tradingEngine?.getPortfolio();
                res.json({
                    success: true,
                    data: portfolio
                });
            } catch (error) {
                logger.error('Portfolio endpoint error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Recent trades
        this.app.get('/api/trades', async (req, res) => {
            try {
                const limit = parseInt(req.query.limit) || 50;
                const trades = await this.tradingEngine?.getRecentTrades(limit);
                res.json({
                    success: true,
                    data: trades
                });
            } catch (error) {
                logger.error('Trades endpoint error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Manual trading signal
        this.app.post('/api/signal', async (req, res) => {
            try {
                const { symbol, action, confidence, reason } = req.body;
                
                if (!symbol || !action || !['BUY', 'SELL', 'HOLD'].includes(action)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid signal parameters'
                    });
                }

                const result = await this.tradingEngine?.processManualSignal({
                    symbol,
                    action,
                    confidence: confidence || 0.5,
                    reason: reason || 'Manual signal',
                    source: 'manual'
                });

                res.json({
                    success: true,
                    data: result
                });
            } catch (error) {
                logger.error('Manual signal error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Strategy performance
        this.app.get('/api/strategies/performance', async (req, res) => {
            try {
                const performance = await this.tradingEngine?.getStrategyPerformance();
                res.json({
                    success: true,
                    data: performance
                });
            } catch (error) {
                logger.error('Strategy performance error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Risk metrics
        this.app.get('/api/risk', async (req, res) => {
            try {
                const riskMetrics = await this.tradingEngine?.getRiskMetrics();
                res.json({
                    success: true,
                    data: riskMetrics
                });
            } catch (error) {
                logger.error('Risk metrics error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }

    setupErrorHandling() {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'Endpoint not found'
            });
        });

        // Global error handler
        this.app.use((err, req, res, next) => {
            logger.error('Unhandled error:', err);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        });
    }

    async initialize() {
        try {
            logger.info('Initializing AI Trading Engine...');

            // Initialize database connection
            await DatabaseManager.connect();
            logger.info('Database connected');

            // Initialize Redis connection
            await RedisManager.connect();
            logger.info('Redis connected');

            // Initialize portfolio manager
            const portfolioManager = new PortfolioManager();
            await portfolioManager.initialize();

            // Initialize risk manager
            const riskManager = new RiskManager({
                maxPortfolioRisk: parseFloat(process.env.MAX_PORTFOLIO_RISK) || 0.05,
                maxPositionSize: parseFloat(process.env.MAX_POSITION_SIZE) || 0.10,
                stopLossPercent: parseFloat(process.env.RISK_LIMIT) || 0.02
            });

            // Initialize trading engine
            this.tradingEngine = new TradingEngine({
                portfolioManager,
                riskManager,
                paperTrading: process.env.PAPER_TRADING === 'true',
                startingBalance: parseFloat(process.env.STARTING_BALANCE) || 10000
            });

            await this.tradingEngine.initialize();
            logger.info('Trading Engine initialized');

            // Schedule trading operations
            this.scheduleOperations();
            
            this.isRunning = true;
            logger.info('AI Trading Engine fully initialized');

        } catch (error) {
            logger.error('Initialization failed:', error);
            process.exit(1);
        }
    }

    scheduleOperations() {
        // Market analysis every minute during market hours
        cron.schedule('* * * * *', async () => {
            try {
                if (this.isMarketOpen()) {
                    await this.tradingEngine.runAnalysis();
                }
            } catch (error) {
                logger.error('Scheduled analysis error:', error);
            }
        });

        // Portfolio rebalancing every hour
        cron.schedule('0 * * * *', async () => {
            try {
                await this.tradingEngine.rebalancePortfolio();
            } catch (error) {
                logger.error('Portfolio rebalancing error:', error);
            }
        });

        // Risk assessment every 15 minutes
        cron.schedule('*/15 * * * *', async () => {
            try {
                await this.tradingEngine.assessRisk();
            } catch (error) {
                logger.error('Risk assessment error:', error);
            }
        });

        // Daily performance report
        cron.schedule('0 16 * * 1-5', async () => {
            try {
                await this.tradingEngine.generateDailyReport();
            } catch (error) {
                logger.error('Daily report error:', error);
            }
        });

        logger.info('Trading operations scheduled');
    }

    isMarketOpen() {
        const now = new Date();
        const day = now.getDay(); // 0 = Sunday, 6 = Saturday
        const hour = now.getHours();
        
        // Simple check: Monday-Friday, 9:30 AM - 4:00 PM EST
        // In production, this would account for holidays and different markets
        return day >= 1 && day <= 5 && hour >= 9 && hour < 16;
    }

    async start() {
        await this.initialize();
        
        this.app.listen(this.port, () => {
            logger.info(`AI Trading Engine running on port ${this.port}`);
        });
    }

    async shutdown() {
        logger.info('Shutting down AI Trading Engine...');
        
        this.isRunning = false;
        
        if (this.tradingEngine) {
            await this.tradingEngine.shutdown();
        }
        
        await RedisManager.disconnect();
        await DatabaseManager.disconnect();
        
        logger.info('AI Trading Engine shutdown complete');
        process.exit(0);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    if (global.tradingService) {
        await global.tradingService.shutdown();
    }
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    if (global.tradingService) {
        await global.tradingService.shutdown();
    }
});

// Start the service
if (require.main === module) {
    const tradingService = new TradingEngineService();
    global.tradingService = tradingService;
    
    tradingService.start().catch(error => {
        logger.error('Failed to start trading engine:', error);
        process.exit(1);
    });
}

module.exports = TradingEngineService;
/**
 * Integration Tests
 * End-to-end tests for complete trading workflow
 */

const { describe, it, expect, beforeEach, beforeAll, afterAll } = require('@jest/globals');
const { ArbitrageDetector } = require('./arbitrage.test');
const { RiskManager } = require('./risk-management.test');
const { BinanceAuth, IPv4Connector } = require('./api-auth.test');

class TradingSystem {
  constructor(config) {
    this.auth = new BinanceAuth(config.apiKey, config.secretKey);
    this.connector = new IPv4Connector();
    this.arbitrageDetector = new ArbitrageDetector(config.arbitrage);
    this.riskManager = new RiskManager(config.risk);
    
    this.isRunning = false;
    this.paperTrading = config.paperTrading !== false;
    this.systemLogs = [];
    this.tradeHistory = [];
  }

  log(level, message, data = null) {
    const logEntry = {
      timestamp: Date.now(),
      level,
      message,
      data
    };
    this.systemLogs.push(logEntry);
    
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${level}] ${message}`, data || '');
    }
  }

  async initialize() {
    this.log('INFO', 'Initializing trading system');
    
    // Validate credentials
    const apiValidation = this.auth.validateApiKey(this.auth.apiKey);
    const secretValidation = this.auth.validateSecretKey(this.auth.secretKey);
    
    if (!apiValidation.valid || !secretValidation.valid) {
      throw new Error('Invalid API credentials');
    }

    // Test connection
    const connectionTest = this.auth.testConnection();
    if (!connectionTest.success) {
      throw new Error('Connection test failed');
    }

    // Test authentication
    if (!this.paperTrading) {
      const authTest = this.auth.testAuthentication();
      if (!authTest.success) {
        throw new Error('Authentication test failed');
      }
    }

    this.log('INFO', 'System initialized successfully', {
      paperTrading: this.paperTrading,
      startingBalance: this.riskManager.balance
    });

    return true;
  }

  async fetchMarketData() {
    this.log('DEBUG', 'Fetching market data');
    
    // Simulate market data fetch
    const marketData = {
      'USDC/USDT': 0.9999 + (Math.random() - 0.5) * 0.01,
      'USDT/DAI': 1.0001 + (Math.random() - 0.5) * 0.01,
      'DAI/USDC': 1.0000 + (Math.random() - 0.5) * 0.01,
      timestamp: Date.now()
    };

    this.log('DEBUG', 'Market data fetched', marketData);
    return marketData;
  }

  async analyzeOpportunity(marketData) {
    this.log('DEBUG', 'Analyzing arbitrage opportunity');
    
    const opportunity = this.arbitrageDetector.detectOpportunity(marketData);
    
    this.log('INFO', 'Opportunity analysis complete', {
      type: opportunity.type,
      action: opportunity.action,
      profit: opportunity.profit,
      confidence: opportunity.confidence
    });

    return opportunity;
  }

  async executeTrade(opportunity) {
    if (opportunity.action !== 'EXECUTE') {
      this.log('INFO', 'No trade execution required', {
        reason: opportunity.reason || 'Below threshold'
      });
      return null;
    }

    this.log('INFO', 'Preparing trade execution');

    // Calculate position size
    const positionCalc = this.riskManager.calculatePositionSize({
      expectedProfit: opportunity.profit,
      stopLoss: 0.01,
      confidence: opportunity.confidence
    });

    if (!positionCalc.allowed) {
      this.log('WARN', 'Trade blocked by risk management', {
        reason: positionCalc.reason
      });
      return null;
    }

    // Create trade object
    const trade = {
      symbol: 'USDC/USDT/DAI',
      type: 'ARBITRAGE',
      value: positionCalc.size,
      expectedProfit: opportunity.profit,
      confidence: opportunity.confidence,
      stopLoss: 0.01,
      paperTrading: this.paperTrading
    };

    // Validate trade
    const validation = this.riskManager.validateTrade(trade);
    if (!validation.valid) {
      this.log('ERROR', 'Trade validation failed', {
        errors: validation.errors
      });
      return null;
    }

    // Execute trade
    const result = this.riskManager.executeTrade(trade);
    
    if (result.success) {
      this.log('INFO', 'Trade executed successfully', {
        tradeId: result.trade.id,
        value: trade.value,
        riskScore: result.riskScore,
        newBalance: result.newBalance
      });

      this.tradeHistory.push(result.trade);
      
      // Simulate trade completion after delay
      setTimeout(() => {
        this.completeTrade(result.trade.id, opportunity.profit);
      }, 100);

      return result.trade;
    } else {
      this.log('ERROR', 'Trade execution failed', {
        errors: result.errors
      });
      return null;
    }
  }

  async completeTrade(tradeId, expectedProfit) {
    const actualProfit = expectedProfit * (0.95 + Math.random() * 0.1); // 95-105% of expected
    
    const result = this.riskManager.closeTrade(
      tradeId, 
      1 + actualProfit // Simplified exit price
    );

    if (result.success) {
      this.log('INFO', 'Trade completed', {
        tradeId,
        profit: result.profit,
        newBalance: result.newBalance
      });
    } else {
      this.log('ERROR', 'Trade completion failed', {
        tradeId,
        error: result.error
      });
    }

    return result;
  }

  async runCycle() {
    try {
      // Fetch market data
      const marketData = await this.fetchMarketData();
      
      // Analyze opportunity
      const opportunity = await this.analyzeOpportunity(marketData);
      
      // Execute trade if profitable
      const trade = await this.executeTrade(opportunity);
      
      return {
        success: true,
        marketData,
        opportunity,
        trade,
        timestamp: Date.now()
      };
    } catch (error) {
      this.log('ERROR', 'Cycle failed', { error: error.message });
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  getSystemStats() {
    const portfolio = this.riskManager.getPortfolioRisk();
    
    return {
      balance: this.riskManager.balance,
      openPositions: portfolio.openPositions,
      totalTrades: this.tradeHistory.length,
      dailyLoss: this.riskManager.dailyLoss,
      systemLogs: this.systemLogs.length,
      riskLevel: portfolio.riskLevel,
      uptime: Date.now() - (this.startTime || Date.now())
    };
  }

  async stop() {
    this.log('INFO', 'Stopping trading system');
    
    if (this.riskManager.openPositions.length > 0) {
      const emergency = this.riskManager.emergencyStop();
      this.log('INFO', 'Emergency stop executed', emergency);
    }

    this.isRunning = false;
    this.log('INFO', 'System stopped successfully');
  }
}

describe('Trading System Integration', () => {
  let system;

  beforeEach(() => {
    system = new TradingSystem({
      apiKey: 'testApiKey123456789012345678901234',
      secretKey: 'testSecretKey123456789012345678901',
      paperTrading: true,
      arbitrage: {
        profitThreshold: 0.001,
        maxPositionSize: 200,
        fees: 0.001
      },
      risk: {
        startingBalance: 1000,
        maxLossPerTrade: 10,
        maxDailyLoss: 20,
        maxPositionSize: 0.2,
        reserveFund: 0.2
      }
    });
  });

  afterEach(async () => {
    if (system.isRunning) {
      await system.stop();
    }
  });

  describe('System Initialization', () => {
    it('should initialize successfully with valid config', async () => {
      const result = await system.initialize();
      
      expect(result).toBe(true);
      expect(system.systemLogs.length).toBeGreaterThan(0);
      
      const initLog = system.systemLogs.find(log => 
        log.message.includes('initialized successfully')
      );
      expect(initLog).toBeDefined();
      expect(initLog.data.paperTrading).toBe(true);
    });

    it('should fail initialization with invalid credentials', async () => {
      system.auth.apiKey = 'invalid';
      
      await expect(system.initialize()).rejects.toThrow('Invalid API credentials');
    });
  });

  describe('Market Data Flow', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('should fetch market data successfully', async () => {
      const marketData = await system.fetchMarketData();
      
      expect(marketData).toBeDefined();
      expect(marketData['USDC/USDT']).toBeGreaterThan(0.99);
      expect(marketData['USDC/USDT']).toBeLessThan(1.01);
      expect(marketData.timestamp).toBeDefined();
    });

    it('should analyze opportunities from market data', async () => {
      const marketData = await system.fetchMarketData();
      const opportunity = await system.analyzeOpportunity(marketData);
      
      expect(opportunity).toBeDefined();
      expect(opportunity.type).toBe('triangular');
      expect(opportunity.action).toMatch(/^(EXECUTE|MONITOR)$/);
      expect(typeof opportunity.profit).toBe('number');
    });
  });

  describe('Complete Trading Cycle', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('should complete full cycle without errors', async () => {
      const result = await system.runCycle();
      
      expect(result.success).toBe(true);
      expect(result.marketData).toBeDefined();
      expect(result.opportunity).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should execute profitable trades', async () => {
      // Force profitable scenario
      jest.spyOn(system, 'fetchMarketData').mockResolvedValue({
        'USDC/USDT': 1.005,
        'USDT/DAI': 1.003,
        'DAI/USDC': 1.002,
        timestamp: Date.now()
      });

      const result = await system.runCycle();
      
      expect(result.success).toBe(true);
      expect(result.opportunity.action).toBe('EXECUTE');
      expect(result.trade).toBeDefined();
    });

    it('should reject unprofitable trades', async () => {
      // Force unprofitable scenario
      jest.spyOn(system, 'fetchMarketData').mockResolvedValue({
        'USDC/USDT': 1.0001,
        'USDT/DAI': 1.0001,
        'DAI/USDC': 1.0001,
        timestamp: Date.now()
      });

      const result = await system.runCycle();
      
      expect(result.success).toBe(true);
      expect(result.opportunity.action).toBe('MONITOR');
      expect(result.trade).toBeNull();
    });
  });

  describe('Risk Management Integration', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('should respect daily loss limits', async () => {
      // Set daily loss near limit
      system.riskManager.dailyLoss = 19;

      const result = await system.runCycle();
      
      // Even if profitable, should be limited by daily loss
      expect(result.success).toBe(true);
      if (result.opportunity.action === 'EXECUTE') {
        expect(result.trade).toBeNull(); // Blocked by risk management
      }
    });

    it('should enforce position size limits', async () => {
      // Force highly profitable scenario
      jest.spyOn(system, 'fetchMarketData').mockResolvedValue({
        'USDC/USDT': 1.01,
        'USDT/DAI': 1.01,
        'DAI/USDC': 1.01,
        timestamp: Date.now()
      });

      const result = await system.runCycle();
      
      if (result.trade) {
        expect(result.trade.value).toBeLessThanOrEqual(200); // Max position
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle market data fetch errors', async () => {
      await system.initialize();
      
      // Mock fetch error
      jest.spyOn(system, 'fetchMarketData').mockRejectedValue(
        new Error('Network error')
      );

      const result = await system.runCycle();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle analysis errors gracefully', async () => {
      await system.initialize();
      
      // Mock analysis error
      jest.spyOn(system, 'analyzeOpportunity').mockRejectedValue(
        new Error('Analysis failed')
      );

      const result = await system.runCycle();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Analysis failed');
    });
  });

  describe('Logging and Monitoring', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('should log all major operations', async () => {
      await system.runCycle();
      
      const logs = system.systemLogs;
      expect(logs.length).toBeGreaterThan(3);
      
      const logMessages = logs.map(log => log.message);
      expect(logMessages).toContain('Fetching market data');
      expect(logMessages).toContain('Analyzing arbitrage opportunity');
    });

    it('should track system statistics', async () => {
      await system.runCycle();
      
      const stats = system.getSystemStats();
      
      expect(stats.balance).toBe(1000);
      expect(stats.systemLogs).toBeGreaterThan(0);
      expect(stats.riskLevel).toBeDefined();
      expect(stats.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Multiple Cycles', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('should handle multiple trading cycles', async () => {
      const results = [];
      
      for (let i = 0; i < 5; i++) {
        const result = await system.runCycle();
        results.push(result);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      expect(results).toHaveLength(5);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should accumulate trade history', async () => {
      // Force profitable trades
      jest.spyOn(system, 'fetchMarketData').mockResolvedValue({
        'USDC/USDT': 1.008,
        'USDT/DAI': 1.005,
        'DAI/USDC': 1.003,
        timestamp: Date.now()
      });

      for (let i = 0; i < 3; i++) {
        await system.runCycle();
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      expect(system.tradeHistory.length).toBeGreaterThan(0);
      
      const stats = system.getSystemStats();
      expect(stats.totalTrades).toBeGreaterThan(0);
    });
  });

  describe('System Shutdown', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('should shutdown gracefully', async () => {
      await system.stop();
      
      expect(system.isRunning).toBe(false);
      
      const shutdownLog = system.systemLogs.find(log =>
        log.message.includes('stopped successfully')
      );
      expect(shutdownLog).toBeDefined();
    });

    it('should close open positions on shutdown', async () => {
      // Create open position
      jest.spyOn(system, 'fetchMarketData').mockResolvedValue({
        'USDC/USDT': 1.01,
        'USDT/DAI': 1.01,
        'DAI/USDC': 1.01,
        timestamp: Date.now()
      });

      await system.runCycle();
      
      // Should have open position
      const statsBefore = system.getSystemStats();
      expect(statsBefore.openPositions).toBeGreaterThan(0);

      await system.stop();
      
      // Positions should be closed
      const statsAfter = system.getSystemStats();
      expect(statsAfter.openPositions).toBe(0);
    });
  });
});

describe('Performance Integration', () => {
  let system;

  beforeEach(async () => {
    system = new TradingSystem({
      apiKey: 'testApiKey123456789012345678901234',
      secretKey: 'testSecretKey123456789012345678901',
      paperTrading: true,
      arbitrage: { profitThreshold: 0.001 },
      risk: { startingBalance: 1000 }
    });
    
    await system.initialize();
  });

  it('should complete cycles within performance targets', async () => {
    const startTime = Date.now();
    
    for (let i = 0; i < 10; i++) {
      await system.runCycle();
    }
    
    const duration = Date.now() - startTime;
    const avgCycleTime = duration / 10;
    
    expect(avgCycleTime).toBeLessThan(100); // Under 100ms per cycle
  });

  it('should maintain consistent memory usage', async () => {
    const initialMemory = process.memoryUsage();
    
    for (let i = 0; i < 100; i++) {
      await system.runCycle();
    }
    
    const finalMemory = process.memoryUsage();
    const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
    
    expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Under 10MB growth
  });
});

module.exports = { TradingSystem };
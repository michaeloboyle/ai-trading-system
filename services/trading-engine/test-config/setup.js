/**
 * Trading Engine Test Setup
 * Service-specific test configuration and utilities
 */

// Trading Engine specific test utilities
global.tradingEngineTestUtils = {
  // Create mock trading engine configuration
  createMockTradingConfig: () => ({
    paperTrading: true,
    startingBalance: 10000,
    riskLimit: 0.02,
    maxPositionSize: 0.10,
    strategies: ['enhancedRSI'],
    updateInterval: 1000
  }),

  // Create mock strategy
  createMockStrategy: (name = 'TestStrategy') => ({
    name,
    analyze: jest.fn().mockResolvedValue({
      signal: 'HOLD',
      confidence: 0.5,
      reason: 'Test strategy signal'
    }),
    initialize: jest.fn().mockResolvedValue(true),
    cleanup: jest.fn().mockResolvedValue(true)
  }),

  // Create mock risk manager
  createMockRiskManager: () => ({
    assessPositionRisk: jest.fn().mockReturnValue({
      approved: true,
      maxQuantity: 100,
      stopLoss: 147.00,
      riskLevel: 'LOW'
    }),
    validateTrade: jest.fn().mockReturnValue(true),
    calculatePositionSize: jest.fn().mockReturnValue(100)
  }),

  // Create mock portfolio manager
  createMockPortfolioManager: () => ({
    getPortfolio: jest.fn().mockResolvedValue(global.testUtils.createMockPortfolio()),
    executeTrade: jest.fn().mockResolvedValue(global.testUtils.createMockTrade()),
    updatePosition: jest.fn().mockResolvedValue(true),
    getBalance: jest.fn().mockResolvedValue(10000)
  }),

  // Create mock database manager
  createMockDatabaseManager: () => ({
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(true),
    transaction: jest.fn().mockImplementation((callback) => callback({
      query: jest.fn().mockResolvedValue({ rows: [] })
    }))
  })
};

// Mock TradingEngine dependencies
jest.mock('../src/core/TradingEngine', () => {
  return {
    TradingEngine: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(true),
      runAnalysis: jest.fn().mockResolvedValue(true),
      processSignal: jest.fn().mockResolvedValue(true),
      getStatus: jest.fn().mockResolvedValue({
        running: true,
        strategies: ['enhancedRSI'],
        portfolio: global.testUtils.createMockPortfolio()
      }),
      shutdown: jest.fn().mockResolvedValue(true)
    }))
  };
});

console.log('Trading Engine test setup complete');
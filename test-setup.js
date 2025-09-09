/**
 * Global test setup for AI Trading System
 * Configures common test utilities and mocks
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.DB_URL = 'postgresql://trader:test_password@localhost:5433/trading_test';
process.env.PAPER_TRADING = 'true';
process.env.STARTING_BALANCE = '10000';
process.env.RISK_LIMIT = '0.02';

// Global test timeout
jest.setTimeout(10000);

// Mock external services by default
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

// Mock Redis by default
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    hget: jest.fn(),
    hset: jest.fn(),
    hdel: jest.fn(),
    lpush: jest.fn(),
    rpop: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  }))
}));

// Mock PostgreSQL by default  
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    connect: jest.fn(),
    end: jest.fn(),
    query: jest.fn()
  })),
  Client: jest.fn(() => ({
    connect: jest.fn(),
    end: jest.fn(), 
    query: jest.fn()
  }))
}));

// Mock Winston logger
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    printf: jest.fn(),
    colorize: jest.fn(),
    json: jest.fn()
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn()
  }
}));

// Global test utilities
global.testUtils = {
  // Create mock market data
  createMockMarketData: (symbol = 'AAPL', price = 150.00) => ({
    symbol,
    price,
    volume: 1000000,
    timestamp: new Date().toISOString(),
    high: price * 1.02,
    low: price * 0.98,
    open: price * 0.99,
    close: price
  }),

  // Create mock trade signal
  createMockSignal: (action = 'BUY', confidence = 0.8) => ({
    symbol: 'AAPL',
    action,
    confidence,
    timestamp: new Date().toISOString(),
    source: 'test',
    reason: 'Mock signal for testing'
  }),

  // Create mock portfolio
  createMockPortfolio: (balance = 10000, positions = []) => ({
    balance,
    totalValue: balance + positions.reduce((sum, pos) => sum + (pos.quantity * pos.currentPrice), 0),
    positions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }),

  // Create mock trade
  createMockTrade: (symbol = 'AAPL', action = 'BUY', quantity = 10, price = 150.00) => ({
    id: Math.random().toString(36).substr(2, 9),
    symbol,
    action,
    quantity,
    price,
    totalValue: quantity * price,
    timestamp: new Date().toISOString(),
    status: 'completed'
  }),

  // Wait for promises to resolve
  flushPromises: () => new Promise(resolve => setTimeout(resolve, 0)),

  // Sleep utility for testing timing
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('Global test setup complete');
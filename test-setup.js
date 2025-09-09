/**
 * Global test setup for AI Trading System
 * Minimal setup for our test suite
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PAPER_TRADING = 'true';
process.env.STARTING_BALANCE = '1000';
process.env.RISK_LIMIT = '0.01';
process.env.MAX_DAILY_RISK = '0.02';

// Global test timeout
jest.setTimeout(10000);

// Mock console to reduce test noise
const originalConsole = console;
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: originalConsole.warn,
  error: originalConsole.error
};

// Mock fetch for HTTP requests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('')
  })
);

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
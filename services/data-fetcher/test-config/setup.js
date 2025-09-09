/**
 * Data Fetcher Test Setup
 * Service-specific test configuration and utilities
 */

// Data Fetcher specific test utilities
global.dataFetcherTestUtils = {
  // Create mock API response
  createMockApiResponse: (symbol = 'AAPL') => ({
    data: {
      'Time Series (1min)': {
        '2024-01-01 16:00:00': {
          '1. open': '150.00',
          '2. high': '152.00', 
          '3. low': '149.50',
          '4. close': '151.75',
          '5. volume': '1000000'
        }
      },
      'Meta Data': {
        '1. Information': 'Intraday (1min) open, high, low, close prices and volume',
        '2. Symbol': symbol
      }
    }
  }),

  // Create mock data fetcher configuration
  createMockDataFetcherConfig: () => ({
    apiKeys: {
      alphaVantage: 'test-api-key',
      polygon: 'test-polygon-key'
    },
    symbols: ['AAPL', 'GOOGL', 'MSFT'],
    fetchInterval: 60000,
    retryAttempts: 3,
    requestDelay: 1000
  }),

  // Create mock data store
  createMockDataStore: () => ({
    saveMarketData: jest.fn().mockResolvedValue(true),
    getLatestData: jest.fn().mockResolvedValue(global.testUtils.createMockMarketData()),
    getHistoricalData: jest.fn().mockResolvedValue([
      global.testUtils.createMockMarketData('AAPL', 150.00),
      global.testUtils.createMockMarketData('AAPL', 151.00)
    ]),
    updateDataQuality: jest.fn().mockResolvedValue(true)
  }),

  // Create mock API client
  createMockApiClient: () => ({
    fetchRealTimeData: jest.fn().mockResolvedValue(global.testUtils.createMockMarketData()),
    fetchHistoricalData: jest.fn().mockResolvedValue([]),
    validateResponse: jest.fn().mockReturnValue(true),
    handleRateLimit: jest.fn().mockResolvedValue(true)
  }),

  // Mock network error
  createNetworkError: (message = 'Network Error') => {
    const error = new Error(message);
    error.code = 'ECONNREFUSED';
    error.response = { status: 500 };
    return error;
  },

  // Mock API rate limit error
  createRateLimitError: () => {
    const error = new Error('Rate limit exceeded');
    error.response = { status: 429, headers: { 'retry-after': '60' } };
    return error;
  }
};

// Mock external API clients
jest.mock('axios');

console.log('Data Fetcher test setup complete');
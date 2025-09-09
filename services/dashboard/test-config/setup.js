/**
 * Dashboard Test Setup
 * Service-specific test configuration and utilities
 */

// Dashboard specific test utilities
global.dashboardTestUtils = {
  // Create mock dashboard configuration
  createMockDashboardConfig: () => ({
    refreshInterval: 5000,
    chartTypes: ['candlestick', 'line', 'volume'],
    defaultTimeframe: '1D',
    maxDataPoints: 1000,
    realTimeUpdates: true
  }),

  // Create mock chart data
  createMockChartData: (symbol = 'AAPL', points = 10) => {
    const data = [];
    const basePrice = 150.00;
    const baseTime = Date.now();
    
    for (let i = 0; i < points; i++) {
      data.push({
        timestamp: baseTime - (points - i) * 60000, // 1 minute intervals
        open: basePrice + Math.random() * 2 - 1,
        high: basePrice + Math.random() * 3,
        low: basePrice - Math.random() * 2,
        close: basePrice + Math.random() * 2 - 1,
        volume: Math.floor(Math.random() * 1000000)
      });
    }
    return data;
  },

  // Create mock dashboard metrics
  createMockDashboardMetrics: () => ({
    portfolio: {
      totalValue: 11250.00,
      dayChange: 250.00,
      dayChangePercent: 2.27,
      totalReturn: 1250.00,
      totalReturnPercent: 12.50
    },
    positions: [
      { symbol: 'AAPL', quantity: 50, currentPrice: 152.00, dayChange: 1.50 },
      { symbol: 'GOOGL', quantity: 25, currentPrice: 2800.00, dayChange: -15.00 }
    ],
    trades: [
      global.testUtils.createMockTrade('AAPL', 'BUY', 50, 150.50),
      global.testUtils.createMockTrade('GOOGL', 'SELL', 10, 2815.00)
    ],
    alerts: [
      { type: 'INFO', message: 'Portfolio rebalanced', timestamp: new Date().toISOString() },
      { type: 'WARNING', message: 'High volatility detected', timestamp: new Date().toISOString() }
    ]
  }),

  // Create mock WebSocket connection
  createMockWebSocket: () => ({
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    readyState: 1, // OPEN
    url: 'ws://localhost:8080/ws',
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null
  }),

  // Create mock user preferences
  createMockUserPreferences: () => ({
    theme: 'dark',
    chartType: 'candlestick',
    defaultTimeframe: '1D',
    autoRefresh: true,
    soundAlerts: false,
    watchlist: ['AAPL', 'GOOGL', 'MSFT', 'TSLA'],
    layout: {
      grid: [
        { component: 'Portfolio', x: 0, y: 0, w: 6, h: 4 },
        { component: 'Chart', x: 6, y: 0, w: 6, h: 8 },
        { component: 'Trades', x: 0, y: 4, w: 6, h: 4 }
      ]
    }
  }),

  // Create mock notification
  createMockNotification: (type = 'info') => ({
    id: Math.random().toString(36).substr(2, 9),
    type, // success, error, warning, info
    title: 'Test Notification',
    message: 'This is a test notification',
    timestamp: new Date().toISOString(),
    read: false,
    actions: [
      { label: 'View Details', action: 'VIEW_DETAILS' },
      { label: 'Dismiss', action: 'DISMISS' }
    ]
  }),

  // Create mock API response
  createMockApiResponse: (data) => ({
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId: Math.random().toString(36).substr(2, 9)
  }),

  // Create mock error response
  createMockErrorResponse: (message = 'Test error') => ({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    requestId: Math.random().toString(36).substr(2, 9)
  })
};

// Mock DOM environment for React components
import { configure } from '@testing-library/react';

configure({
  testIdAttribute: 'data-testid'
});

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver for chart components
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver for responsive charts
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

console.log('Dashboard test setup complete');
/**
 * Backtester Test Setup
 * Service-specific test configuration and utilities
 */

// Backtester specific test utilities
global.backtesterTestUtils = {
  // Create mock backtesting configuration
  createMockBacktestConfig: () => ({
    strategy: 'enhancedRSI',
    symbol: 'AAPL',
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    initialCapital: 10000,
    commission: 0.001, // 0.1%
    slippage: 0.0005, // 0.05%
    maxPositionSize: 0.10,
    stopLoss: 0.02,
    takeProfit: 0.05
  }),

  // Create mock historical data
  createMockHistoricalData: (symbol = 'AAPL', days = 30) => {
    const data = [];
    const basePrice = 150.00;
    const startDate = new Date('2023-01-01');
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const price = basePrice + (Math.random() - 0.5) * 10; // Random walk
      data.push({
        symbol,
        timestamp: date.toISOString(),
        open: price + (Math.random() - 0.5),
        high: price + Math.random() * 2,
        low: price - Math.random() * 2,
        close: price,
        volume: Math.floor(Math.random() * 1000000) + 500000
      });
    }
    
    return data;
  },

  // Create mock backtest results
  createMockBacktestResults: () => ({
    summary: {
      totalTrades: 25,
      winningTrades: 15,
      losingTrades: 10,
      winRate: 0.60,
      totalReturn: 0.125, // 12.5%
      annualizedReturn: 0.142,
      maxDrawdown: 0.085,
      sharpeRatio: 1.35,
      sortinoRatio: 1.68,
      calmarRatio: 1.67,
      volatility: 0.18,
      alpha: 0.025,
      beta: 0.95
    },
    performance: {
      initialCapital: 10000,
      finalValue: 11250,
      totalProfit: 1250,
      totalLoss: -850,
      netProfit: 400,
      profitFactor: 1.47,
      averageWin: 83.33,
      averageLoss: -85.00,
      largestWin: 285.50,
      largestLoss: -198.75,
      consecutiveWins: 5,
      consecutiveLosses: 3
    },
    trades: [
      {
        entryDate: '2023-01-15',
        exitDate: '2023-01-20',
        symbol: 'AAPL',
        action: 'BUY',
        entryPrice: 148.50,
        exitPrice: 152.25,
        quantity: 50,
        profit: 187.50,
        profitPercent: 2.53,
        holdingPeriod: 5,
        reason: 'RSI oversold signal'
      }
    ],
    equity: [
      { date: '2023-01-01', value: 10000 },
      { date: '2023-01-31', value: 10150 },
      { date: '2023-02-28', value: 10285 }
    ],
    drawdown: [
      { date: '2023-01-01', value: 0 },
      { date: '2023-03-15', value: -0.025 },
      { date: '2023-05-10', value: -0.085 }
    ]
  }),

  // Create mock strategy for backtesting
  createMockBacktestStrategy: () => ({
    name: 'TestStrategy',
    parameters: {
      rsiPeriod: 14,
      oversoldLevel: 30,
      overboughtLevel: 70,
      stopLoss: 0.02,
      takeProfit: 0.05
    },
    analyze: jest.fn().mockImplementation((data) => {
      // Mock strategy logic - random signals for testing
      const signal = Math.random() > 0.7 ? 'BUY' : Math.random() < 0.3 ? 'SELL' : 'HOLD';
      return {
        signal,
        confidence: Math.random(),
        indicators: {
          rsi: Math.random() * 100,
          price: data.close,
          volume: data.volume
        },
        reason: `Mock ${signal} signal based on test conditions`
      };
    }),
    initialize: jest.fn().mockResolvedValue(true),
    reset: jest.fn()
  }),

  // Create mock portfolio state during backtest
  createMockBacktestPortfolio: (cash = 10000, positions = []) => ({
    cash,
    positions,
    totalValue: cash + positions.reduce((sum, pos) => sum + (pos.quantity * pos.currentPrice), 0),
    metrics: {
      totalReturn: 0.125,
      sharpeRatio: 1.35,
      maxDrawdown: 0.085,
      winRate: 0.60
    }
  }),

  // Create mock benchmark data
  createMockBenchmarkData: (symbol = 'SPY', days = 252) => {
    return global.backtesterTestUtils.createMockHistoricalData(symbol, days);
  },

  // Create performance comparison
  createMockPerformanceComparison: () => ({
    strategy: {
      name: 'Enhanced RSI',
      totalReturn: 0.125,
      annualizedReturn: 0.142,
      sharpeRatio: 1.35,
      maxDrawdown: 0.085,
      volatility: 0.18
    },
    benchmark: {
      name: 'S&P 500',
      totalReturn: 0.089,
      annualizedReturn: 0.096,
      sharpeRatio: 0.95,
      maxDrawdown: 0.125,
      volatility: 0.22
    },
    outperformance: {
      totalReturn: 0.036,
      annualizedReturn: 0.046,
      informationRatio: 0.48,
      trackingError: 0.075,
      upCapture: 1.15,
      downCapture: 0.85
    }
  }),

  // Create optimization results
  createMockOptimizationResults: () => ({
    bestParameters: {
      rsiPeriod: 12,
      oversoldLevel: 28,
      overboughtLevel: 72,
      stopLoss: 0.018,
      takeProfit: 0.055
    },
    bestResult: {
      totalReturn: 0.158,
      sharpeRatio: 1.52,
      maxDrawdown: 0.068
    },
    parameterSweep: [
      { rsiPeriod: 10, oversoldLevel: 25, totalReturn: 0.098, sharpeRatio: 1.12 },
      { rsiPeriod: 14, oversoldLevel: 30, totalReturn: 0.125, sharpeRatio: 1.35 },
      { rsiPeriod: 20, oversoldLevel: 35, totalReturn: 0.087, sharpeRatio: 0.95 }
    ]
  })
};

// Mock data providers
global.mockDataProviders = {
  historialDataProvider: {
    getData: jest.fn(),
    getSymbols: jest.fn().mockReturnValue(['AAPL', 'GOOGL', 'MSFT']),
    validateData: jest.fn().mockReturnValue(true)
  },
  
  benchmarkProvider: {
    getBenchmarkData: jest.fn(),
    comparePerformance: jest.fn()
  }
};

console.log('Backtester test setup complete');
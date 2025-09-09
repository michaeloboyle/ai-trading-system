/**
 * Risk Manager Test Setup
 * Service-specific test configuration and utilities
 */

// Risk Manager specific test utilities
global.riskManagerTestUtils = {
  // Create mock risk configuration
  createMockRiskConfig: () => ({
    maxPortfolioRisk: 0.05,
    maxPositionSize: 0.10,
    stopLossPercent: 0.02,
    maxDrawdown: 0.15,
    volatilityThreshold: 0.30,
    correlationLimit: 0.70
  }),

  // Create mock position for risk analysis
  createMockPosition: (symbol = 'AAPL', quantity = 100, currentPrice = 150.00, entryPrice = 148.00) => ({
    symbol,
    quantity,
    currentPrice,
    entryPrice,
    marketValue: quantity * currentPrice,
    unrealizedPnL: quantity * (currentPrice - entryPrice),
    unrealizedPnLPercent: ((currentPrice - entryPrice) / entryPrice) * 100
  }),

  // Create mock risk metrics
  createMockRiskMetrics: () => ({
    portfolioRisk: 0.03,
    var95: 500.00,
    sharpeRatio: 1.2,
    maxDrawdown: 0.08,
    beta: 1.1,
    correlation: {
      'AAPL-GOOGL': 0.65,
      'AAPL-MSFT': 0.72
    },
    volatility: {
      'AAPL': 0.25,
      'GOOGL': 0.28,
      'MSFT': 0.22
    }
  }),

  // Create mock market conditions
  createMockMarketConditions: (volatilityLevel = 'NORMAL') => ({
    volatilityLevel, // LOW, NORMAL, HIGH, EXTREME
    trendDirection: 'BULLISH', // BULLISH, BEARISH, SIDEWAYS
    marketSentiment: 0.6, // -1 to 1
    vix: 18.5,
    economicIndicators: {
      inflationRate: 0.025,
      unemploymentRate: 0.037,
      gdpGrowth: 0.021
    }
  }),

  // Create risk assessment result
  createMockRiskAssessment: (approved = true) => ({
    approved,
    riskLevel: approved ? 'LOW' : 'HIGH',
    maxQuantity: approved ? 100 : 0,
    stopLoss: 147.00,
    takeProfit: 155.00,
    positionSize: approved ? 0.05 : 0,
    warnings: approved ? [] : ['Exceeds risk limits'],
    recommendations: [
      'Set stop loss at $147.00',
      'Monitor volatility closely'
    ]
  }),

  // Create mock correlation matrix
  createMockCorrelationMatrix: () => ({
    'AAPL': { 'AAPL': 1.0, 'GOOGL': 0.65, 'MSFT': 0.72 },
    'GOOGL': { 'AAPL': 0.65, 'GOOGL': 1.0, 'MSFT': 0.68 },
    'MSFT': { 'AAPL': 0.72, 'GOOGL': 0.68, 'MSFT': 1.0 }
  }),

  // Create emergency stop scenario
  createEmergencyScenario: (type = 'MARKET_CRASH') => ({
    type, // MARKET_CRASH, VOLATILITY_SPIKE, LIQUIDITY_CRISIS
    severity: 'HIGH',
    triggeredAt: new Date().toISOString(),
    marketDrop: -0.15, // 15% market drop
    actions: [
      'HALT_NEW_POSITIONS',
      'REDUCE_EXISTING_POSITIONS',
      'INCREASE_CASH_ALLOCATION'
    ]
  })
};

// Mock risk calculation functions
global.riskCalculations = {
  calculateVaR: jest.fn().mockReturnValue(500.00),
  calculateSharpe: jest.fn().mockReturnValue(1.2),
  calculateBeta: jest.fn().mockReturnValue(1.1),
  calculateCorrelation: jest.fn().mockReturnValue(0.65),
  calculateVolatility: jest.fn().mockReturnValue(0.25)
};

console.log('Risk Manager test setup complete');
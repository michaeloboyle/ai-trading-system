/**
 * Risk Management Tests
 * Comprehensive test suite for position sizing, stop losses, and risk limits
 */

const { describe, it, expect, beforeEach } = require('@jest/globals');

class RiskManager {
  constructor(config = {}) {
    this.balance = config.startingBalance || 1000;
    this.maxLossPerTrade = config.maxLossPerTrade || 10; // $10
    this.maxDailyLoss = config.maxDailyLoss || 20; // $20
    this.maxPositionSize = config.maxPositionSize || 0.2; // 20% of balance
    this.reserveFund = config.reserveFund || 0.2; // 20% emergency reserve
    this.dailyLoss = 0;
    this.openPositions = [];
    this.tradeHistory = [];
  }

  calculatePositionSize(opportunity) {
    // Check daily loss limit
    if (this.dailyLoss >= this.maxDailyLoss) {
      return {
        size: 0,
        reason: 'Daily loss limit reached',
        allowed: false
      };
    }

    // Calculate available capital (excluding reserve)
    const availableCapital = this.balance * (1 - this.reserveFund);
    
    // Calculate max position based on risk
    const maxByRisk = this.maxLossPerTrade / (opportunity.stopLoss || 0.01);
    const maxByCapital = availableCapital * this.maxPositionSize;
    const maxByBalance = availableCapital;

    // Take the minimum of all constraints
    const positionSize = Math.min(maxByRisk, maxByCapital, maxByBalance);

    // Check if position is viable
    if (positionSize < 1) {
      return {
        size: 0,
        reason: 'Position too small',
        allowed: false
      };
    }

    return {
      size: Math.floor(positionSize),
      maxRisk: this.maxLossPerTrade,
      availableCapital,
      allowed: true
    };
  }

  validateTrade(trade) {
    const errors = [];

    // Check position size
    if (trade.value > this.balance * this.maxPositionSize) {
      errors.push('Position size exceeds maximum');
    }

    // Check daily loss
    if (this.dailyLoss >= this.maxDailyLoss) {
      errors.push('Daily loss limit reached');
    }

    // Check reserve fund
    const balanceAfterTrade = this.balance - trade.value;
    if (balanceAfterTrade < this.balance * this.reserveFund) {
      errors.push('Would breach reserve fund');
    }

    // Check stop loss
    if (!trade.stopLoss || trade.stopLoss > 0.02) {
      errors.push('Stop loss not set or too high');
    }

    // Check open positions
    if (this.openPositions.length >= 5) {
      errors.push('Too many open positions');
    }

    return {
      valid: errors.length === 0,
      errors,
      riskScore: this.calculateRiskScore(trade)
    };
  }

  calculateRiskScore(trade) {
    let score = 0;

    // Position size risk (0-30 points)
    const positionRatio = trade.value / this.balance;
    score += Math.min(30, positionRatio * 150);

    // Daily loss risk (0-30 points)
    const dailyLossRatio = this.dailyLoss / this.maxDailyLoss;
    score += Math.min(30, dailyLossRatio * 30);

    // Open positions risk (0-20 points)
    score += this.openPositions.length * 4;

    // Volatility risk (0-20 points)
    score += (trade.volatility || 0.1) * 200;

    return Math.min(100, score); // Cap at 100
  }

  executeTrade(trade) {
    const validation = this.validateTrade(trade);
    
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        trade: null
      };
    }

    // Execute trade
    const executedTrade = {
      ...trade,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      status: 'open'
    };

    this.openPositions.push(executedTrade);
    this.balance -= trade.value;

    return {
      success: true,
      trade: executedTrade,
      newBalance: this.balance,
      riskScore: validation.riskScore
    };
  }

  closeTrade(tradeId, exitPrice) {
    const tradeIndex = this.openPositions.findIndex(t => t.id === tradeId);
    
    if (tradeIndex === -1) {
      return {
        success: false,
        error: 'Trade not found'
      };
    }

    const trade = this.openPositions[tradeIndex];
    const profit = (exitPrice - trade.entryPrice) * trade.quantity;
    
    // Update daily loss if negative
    if (profit < 0) {
      this.dailyLoss += Math.abs(profit);
    }

    // Update balance
    this.balance += trade.value + profit;

    // Move to history
    this.openPositions.splice(tradeIndex, 1);
    this.tradeHistory.push({
      ...trade,
      exitPrice,
      profit,
      status: 'closed',
      closedAt: Date.now()
    });

    return {
      success: true,
      profit,
      newBalance: this.balance,
      dailyLoss: this.dailyLoss
    };
  }

  resetDailyLimits() {
    this.dailyLoss = 0;
  }

  getPortfolioRisk() {
    const totalExposure = this.openPositions.reduce((sum, pos) => sum + pos.value, 0);
    const exposureRatio = totalExposure / (this.balance + totalExposure);
    
    return {
      totalExposure,
      exposureRatio,
      openPositions: this.openPositions.length,
      dailyLossUsed: this.dailyLoss / this.maxDailyLoss,
      reserveIntact: this.balance >= this.balance * this.reserveFund,
      riskLevel: this.calculateOverallRiskLevel(exposureRatio)
    };
  }

  calculateOverallRiskLevel(exposureRatio) {
    if (exposureRatio < 0.2) return 'LOW';
    if (exposureRatio < 0.5) return 'MEDIUM';
    if (exposureRatio < 0.8) return 'HIGH';
    return 'CRITICAL';
  }

  emergencyStop() {
    const closedTrades = [];
    
    // Close all positions at market
    for (const position of this.openPositions) {
      closedTrades.push({
        ...position,
        status: 'emergency_closed',
        closedAt: Date.now()
      });
      this.balance += position.value * 0.98; // 2% emergency slippage
    }

    this.openPositions = [];
    this.tradeHistory.push(...closedTrades);

    return {
      closedPositions: closedTrades.length,
      finalBalance: this.balance,
      safeMode: true
    };
  }
}

describe('Risk Management', () => {
  let riskManager;

  beforeEach(() => {
    riskManager = new RiskManager({
      startingBalance: 1000,
      maxLossPerTrade: 10,
      maxDailyLoss: 20,
      maxPositionSize: 0.2,
      reserveFund: 0.2
    });
  });

  describe('Position Sizing', () => {
    it('should calculate correct position size within limits', () => {
      const opportunity = {
        expectedProfit: 0.02,
        stopLoss: 0.01,
        confidence: 0.8
      };

      const position = riskManager.calculatePositionSize(opportunity);

      expect(position.allowed).toBe(true);
      expect(position.size).toBeLessThanOrEqual(200); // 20% of $1000
      expect(position.size).toBeGreaterThan(0);
    });

    it('should reject position when daily loss limit reached', () => {
      riskManager.dailyLoss = 20; // Max daily loss

      const opportunity = {
        expectedProfit: 0.02,
        stopLoss: 0.01
      };

      const position = riskManager.calculatePositionSize(opportunity);

      expect(position.allowed).toBe(false);
      expect(position.reason).toBe('Daily loss limit reached');
      expect(position.size).toBe(0);
    });

    it('should respect reserve fund requirement', () => {
      const opportunity = {
        expectedProfit: 0.02,
        stopLoss: 0.01
      };

      const position = riskManager.calculatePositionSize(opportunity);
      const availableCapital = 1000 * 0.8; // 80% available (20% reserve)

      expect(position.availableCapital).toBe(availableCapital);
      expect(position.size).toBeLessThanOrEqual(availableCapital * 0.2);
    });

    it('should scale position based on stop loss', () => {
      const tightStop = {
        expectedProfit: 0.02,
        stopLoss: 0.005 // 0.5% stop
      };

      const wideStop = {
        expectedProfit: 0.02,
        stopLoss: 0.02 // 2% stop
      };

      const tightPosition = riskManager.calculatePositionSize(tightStop);
      const widePosition = riskManager.calculatePositionSize(wideStop);

      expect(tightPosition.size).toBeGreaterThan(widePosition.size);
    });
  });

  describe('Trade Validation', () => {
    it('should validate proper trades', () => {
      const trade = {
        symbol: 'BTCUSDT',
        value: 150,
        quantity: 0.005,
        entryPrice: 30000,
        stopLoss: 0.01,
        takeProfit: 0.02
      };

      const validation = riskManager.validateTrade(trade);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.riskScore).toBeLessThan(50);
    });

    it('should reject oversized positions', () => {
      const trade = {
        symbol: 'BTCUSDT',
        value: 300, // 30% of balance (max is 20%)
        stopLoss: 0.01
      };

      const validation = riskManager.validateTrade(trade);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Position size exceeds maximum');
    });

    it('should reject trades without stop loss', () => {
      const trade = {
        symbol: 'BTCUSDT',
        value: 100
        // No stop loss
      };

      const validation = riskManager.validateTrade(trade);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Stop loss not set or too high');
    });

    it('should reject trades breaching reserve fund', () => {
      const trade = {
        symbol: 'BTCUSDT',
        value: 850, // Would leave only $150 (less than 20% reserve)
        stopLoss: 0.01
      };

      const validation = riskManager.validateTrade(trade);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Would breach reserve fund');
    });

    it('should limit concurrent positions', () => {
      // Add 5 open positions
      for (let i = 0; i < 5; i++) {
        riskManager.openPositions.push({
          id: `trade${i}`,
          value: 30
        });
      }

      const trade = {
        symbol: 'BTCUSDT',
        value: 50,
        stopLoss: 0.01
      };

      const validation = riskManager.validateTrade(trade);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Too many open positions');
    });
  });

  describe('Trade Execution', () => {
    it('should execute valid trades', () => {
      const trade = {
        symbol: 'BTCUSDT',
        value: 100,
        quantity: 0.003,
        entryPrice: 33333,
        stopLoss: 0.01
      };

      const result = riskManager.executeTrade(trade);

      expect(result.success).toBe(true);
      expect(result.trade).toBeDefined();
      expect(result.newBalance).toBe(900);
      expect(riskManager.openPositions).toHaveLength(1);
    });

    it('should track multiple open positions', () => {
      const trades = [
        { symbol: 'BTCUSDT', value: 50, stopLoss: 0.01 },
        { symbol: 'ETHUSDT', value: 50, stopLoss: 0.01 },
        { symbol: 'ADAUSDT', value: 50, stopLoss: 0.01 }
      ];

      trades.forEach(trade => {
        const result = riskManager.executeTrade(trade);
        expect(result.success).toBe(true);
      });

      expect(riskManager.openPositions).toHaveLength(3);
      expect(riskManager.balance).toBe(850);
    });
  });

  describe('Trade Closing', () => {
    it('should close trades with profit', () => {
      const trade = {
        symbol: 'BTCUSDT',
        value: 100,
        quantity: 0.003,
        entryPrice: 33333,
        stopLoss: 0.01
      };

      const executed = riskManager.executeTrade(trade);
      const result = riskManager.closeTrade(executed.trade.id, 34000);

      expect(result.success).toBe(true);
      expect(result.profit).toBeCloseTo(2.001, 2); // 0.003 * (34000 - 33333)
      expect(result.newBalance).toBeGreaterThan(1000);
      expect(riskManager.openPositions).toHaveLength(0);
    });

    it('should update daily loss on losing trades', () => {
      const trade = {
        symbol: 'BTCUSDT',
        value: 100,
        quantity: 0.003,
        entryPrice: 33333,
        stopLoss: 0.01
      };

      const executed = riskManager.executeTrade(trade);
      const result = riskManager.closeTrade(executed.trade.id, 33000);

      expect(result.success).toBe(true);
      expect(result.profit).toBeLessThan(0);
      expect(riskManager.dailyLoss).toBeGreaterThan(0);
    });
  });

  describe('Portfolio Risk Assessment', () => {
    it('should calculate portfolio risk correctly', () => {
      // Add some positions
      riskManager.executeTrade({ symbol: 'BTC', value: 100, stopLoss: 0.01 });
      riskManager.executeTrade({ symbol: 'ETH', value: 100, stopLoss: 0.01 });

      const risk = riskManager.getPortfolioRisk();

      expect(risk.totalExposure).toBe(200);
      expect(risk.exposureRatio).toBeCloseTo(0.2, 2);
      expect(risk.openPositions).toBe(2);
      expect(risk.riskLevel).toBe('LOW');
      expect(risk.reserveIntact).toBe(true);
    });

    it('should identify high risk situations', () => {
      // Max out positions
      for (let i = 0; i < 4; i++) {
        riskManager.executeTrade({
          symbol: `COIN${i}`,
          value: 150,
          stopLoss: 0.01
        });
      }

      const risk = riskManager.getPortfolioRisk();

      expect(risk.exposureRatio).toBeGreaterThan(0.5);
      expect(risk.riskLevel).toBe('HIGH');
    });
  });

  describe('Emergency Stop', () => {
    it('should close all positions in emergency', () => {
      // Add positions
      riskManager.executeTrade({ symbol: 'BTC', value: 100, stopLoss: 0.01 });
      riskManager.executeTrade({ symbol: 'ETH', value: 100, stopLoss: 0.01 });
      riskManager.executeTrade({ symbol: 'ADA', value: 100, stopLoss: 0.01 });

      const result = riskManager.emergencyStop();

      expect(result.closedPositions).toBe(3);
      expect(riskManager.openPositions).toHaveLength(0);
      expect(result.safeMode).toBe(true);
      expect(result.finalBalance).toBeLessThan(1000); // Some slippage
    });
  });

  describe('Daily Reset', () => {
    it('should reset daily loss counter', () => {
      riskManager.dailyLoss = 15;
      
      riskManager.resetDailyLimits();
      
      expect(riskManager.dailyLoss).toBe(0);
    });
  });

  describe('Risk Score Calculation', () => {
    it('should calculate low risk score for conservative trades', () => {
      const trade = {
        value: 50, // 5% of balance
        stopLoss: 0.005,
        volatility: 0.01
      };

      const validation = riskManager.validateTrade(trade);
      
      expect(validation.riskScore).toBeLessThan(30);
    });

    it('should calculate high risk score for aggressive trades', () => {
      riskManager.dailyLoss = 15; // Already lost $15
      
      const trade = {
        value: 190, // 19% of balance
        stopLoss: 0.02,
        volatility: 0.05
      };

      const validation = riskManager.validateTrade(trade);
      
      expect(validation.riskScore).toBeGreaterThan(60);
    });
  });
});

module.exports = { RiskManager };
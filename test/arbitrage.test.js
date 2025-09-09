/**
 * Arbitrage Detection Tests
 * Test suite for triangular arbitrage opportunity detection
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

// Mock arbitrage detector module
class ArbitrageDetector {
  constructor(config = {}) {
    this.profitThreshold = config.profitThreshold || 0.001; // 0.1% default
    this.maxPositionSize = config.maxPositionSize || 200;
    this.fees = config.fees || 0.001; // 0.1% trading fees
  }

  calculateTriangularArbitrage(prices) {
    const { pair1, pair2, pair3 } = prices;
    
    // Calculate cross-rate through triangular path
    const crossRate = pair1 * pair2 * pair3;
    const arbitrageProfit = crossRate - 1;
    const profitAfterFees = arbitrageProfit - (this.fees * 3); // 3 trades
    
    return {
      crossRate,
      grossProfit: arbitrageProfit,
      netProfit: profitAfterFees,
      isProfitable: profitAfterFees > this.profitThreshold,
      confidence: this.calculateConfidence(profitAfterFees)
    };
  }

  calculateConfidence(profit) {
    if (profit <= 0) return 0;
    if (profit >= 0.01) return 0.95; // 1% profit = 95% confidence
    return Math.min(0.95, profit * 100); // Linear scale
  }

  detectOpportunity(marketData) {
    const prices = this.extractPrices(marketData);
    const arbitrage = this.calculateTriangularArbitrage(prices);
    
    if (arbitrage.isProfitable) {
      return {
        type: 'triangular',
        profit: arbitrage.netProfit,
        confidence: arbitrage.confidence,
        action: 'EXECUTE',
        positionSize: this.calculatePositionSize(arbitrage.netProfit)
      };
    }
    
    return {
      type: 'triangular',
      profit: arbitrage.netProfit,
      confidence: 0,
      action: 'MONITOR',
      reason: 'Below profit threshold'
    };
  }

  extractPrices(marketData) {
    return {
      pair1: marketData['USDC/USDT'] || 1.0,
      pair2: marketData['USDT/DAI'] || 1.0,
      pair3: marketData['DAI/USDC'] || 1.0
    };
  }

  calculatePositionSize(profitPercentage) {
    const baseSize = this.maxPositionSize;
    const riskAdjustment = Math.min(1, profitPercentage * 10); // Scale by profit
    return Math.floor(baseSize * riskAdjustment);
  }
}

describe('Arbitrage Detection', () => {
  let detector;

  beforeEach(() => {
    detector = new ArbitrageDetector({
      profitThreshold: 0.001, // 0.1%
      maxPositionSize: 200,
      fees: 0.001
    });
  });

  describe('Triangular Arbitrage Calculation', () => {
    it('should detect profitable arbitrage opportunity', () => {
      const prices = {
        pair1: 1.003,  // USDC/USDT premium
        pair2: 0.998,  // USDT/DAI discount
        pair3: 1.002   // DAI/USDC premium
      };

      const result = detector.calculateTriangularArbitrage(prices);

      expect(result.isProfitable).toBe(true);
      expect(result.crossRate).toBeCloseTo(1.003006, 6);
      expect(result.grossProfit).toBeCloseTo(0.003006, 6);
      expect(result.netProfit).toBeCloseTo(0.000006, 6); // After fees
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should reject unprofitable arbitrage', () => {
      const prices = {
        pair1: 1.0001,  // Minimal spread
        pair2: 1.0000,
        pair3: 1.0001
      };

      const result = detector.calculateTriangularArbitrage(prices);

      expect(result.isProfitable).toBe(false);
      expect(result.netProfit).toBeLessThan(0); // Negative after fees
      expect(result.confidence).toBe(0);
    });

    it('should handle perfect parity (no arbitrage)', () => {
      const prices = {
        pair1: 1.0,
        pair2: 1.0,
        pair3: 1.0
      };

      const result = detector.calculateTriangularArbitrage(prices);

      expect(result.crossRate).toBe(1.0);
      expect(result.grossProfit).toBe(0);
      expect(result.netProfit).toBe(-0.003); // Only fees
      expect(result.isProfitable).toBe(false);
    });
  });

  describe('Opportunity Detection', () => {
    it('should return EXECUTE action for profitable opportunity', () => {
      const marketData = {
        'USDC/USDT': 1.005,
        'USDT/DAI': 1.002,
        'DAI/USDC': 1.001
      };

      const opportunity = detector.detectOpportunity(marketData);

      expect(opportunity.action).toBe('EXECUTE');
      expect(opportunity.type).toBe('triangular');
      expect(opportunity.profit).toBeGreaterThan(0.001);
      expect(opportunity.confidence).toBeGreaterThan(0.5);
      expect(opportunity.positionSize).toBeGreaterThan(0);
    });

    it('should return MONITOR action for unprofitable opportunity', () => {
      const marketData = {
        'USDC/USDT': 1.0001,
        'USDT/DAI': 1.0001,
        'DAI/USDC': 1.0001
      };

      const opportunity = detector.detectOpportunity(marketData);

      expect(opportunity.action).toBe('MONITOR');
      expect(opportunity.reason).toBe('Below profit threshold');
      expect(opportunity.confidence).toBe(0);
    });

    it('should handle missing market data gracefully', () => {
      const marketData = {
        'USDC/USDT': 1.002
        // Missing other pairs
      };

      const opportunity = detector.detectOpportunity(marketData);

      expect(opportunity.action).toBe('MONITOR');
      expect(opportunity.profit).toBeLessThan(0); // Default to 1.0 for missing
    });
  });

  describe('Position Sizing', () => {
    it('should scale position size based on profit', () => {
      const smallProfit = detector.calculatePositionSize(0.001); // 0.1%
      const mediumProfit = detector.calculatePositionSize(0.005); // 0.5%
      const largeProfit = detector.calculatePositionSize(0.01); // 1%

      expect(smallProfit).toBeLessThan(mediumProfit);
      expect(mediumProfit).toBeLessThan(largeProfit);
      expect(largeProfit).toBeLessThanOrEqual(200); // Max position
    });

    it('should never exceed maximum position size', () => {
      const hugeProfit = detector.calculatePositionSize(0.1); // 10%
      
      expect(hugeProfit).toBeLessThanOrEqual(200);
    });

    it('should return 0 for negative profit', () => {
      const negativeProfit = detector.calculatePositionSize(-0.001);
      
      expect(negativeProfit).toBe(0);
    });
  });

  describe('Confidence Calculation', () => {
    it('should scale confidence with profit magnitude', () => {
      const lowConf = detector.calculateConfidence(0.0001);
      const medConf = detector.calculateConfidence(0.005);
      const highConf = detector.calculateConfidence(0.01);

      expect(lowConf).toBeLessThan(medConf);
      expect(medConf).toBeLessThan(highConf);
      expect(highConf).toBeLessThanOrEqual(0.95);
    });

    it('should return 0 confidence for losses', () => {
      expect(detector.calculateConfidence(-0.001)).toBe(0);
      expect(detector.calculateConfidence(0)).toBe(0);
    });

    it('should cap confidence at 95%', () => {
      expect(detector.calculateConfidence(1.0)).toBe(0.95);
    });
  });

  describe('Fee Impact', () => {
    it('should correctly account for trading fees', () => {
      const detectorNoFees = new ArbitrageDetector({ fees: 0 });
      const detectorWithFees = new ArbitrageDetector({ fees: 0.001 });

      const prices = {
        pair1: 1.002,
        pair2: 1.001,
        pair3: 1.001
      };

      const noFees = detectorNoFees.calculateTriangularArbitrage(prices);
      const withFees = detectorWithFees.calculateTriangularArbitrage(prices);

      expect(noFees.netProfit).toBeGreaterThan(withFees.netProfit);
      expect(withFees.netProfit).toBeCloseTo(noFees.netProfit - 0.003, 6);
    });
  });

  describe('Real Market Scenarios', () => {
    it('should handle Binance.US typical spreads', () => {
      const binanceData = {
        'USDC/USDT': 0.9999, // Typical 0.01% spread
        'USDT/BUSD': 1.0001,
        'BUSD/USDC': 1.0000
      };

      const opportunity = detector.detectOpportunity(binanceData);
      
      expect(opportunity.action).toBe('MONITOR');
      expect(opportunity.profit).toBeLessThan(0); // Too small for profit after fees
    });

    it('should detect volatile market opportunity', () => {
      const volatileData = {
        'USDC/USDT': 1.008, // 0.8% premium (high volatility)
        'USDT/DAI': 0.995,  // 0.5% discount
        'DAI/USDC': 1.003   // 0.3% premium
      };

      const opportunity = detector.detectOpportunity(volatileData);
      
      expect(opportunity.action).toBe('EXECUTE');
      expect(opportunity.profit).toBeGreaterThan(0.003); // >0.3% profit
      expect(opportunity.confidence).toBeGreaterThan(0.8);
    });
  });
});

describe('Arbitrage Detection Performance', () => {
  let detector;

  beforeEach(() => {
    detector = new ArbitrageDetector();
  });

  it('should process 1000 calculations in under 100ms', () => {
    const startTime = Date.now();
    
    for (let i = 0; i < 1000; i++) {
      const prices = {
        pair1: 1 + Math.random() * 0.01,
        pair2: 1 + Math.random() * 0.01,
        pair3: 1 + Math.random() * 0.01
      };
      detector.calculateTriangularArbitrage(prices);
    }
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(100);
  });
});

module.exports = { ArbitrageDetector };
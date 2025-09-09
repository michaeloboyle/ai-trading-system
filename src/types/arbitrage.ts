/**
 * Type definitions for arbitrage trading system
 */

export interface ScanParams {
  pairs: string[];
  minProfit: number;
  maxPositionSize: number;
}

export interface ArbitrageOpportunity {
  id: string;
  profit: number;
  estimatedGain: number;
  positionSize: number;
  confidence: number;
  path: string[];
  timestamp: number;
}
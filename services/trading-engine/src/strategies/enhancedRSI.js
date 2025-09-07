/**
 * Enhanced RSI Trading Strategy
 * Based on Flow Nexus Neural Trading mastery with advanced optimizations
 */

const { calculateRSI, calculateMACD, calculateBollingerBands } = require('../indicators');
const { logger } = require('../utils/logger');

class EnhancedRSIStrategy {
    constructor(config = {}) {
        this.name = 'Enhanced RSI';
        this.config = {
            rsiPeriod: config.rsiPeriod || 14,
            rsiBuyThreshold: config.rsiBuyThreshold || 30,
            rsiSellThreshold: config.rsiSellThreshold || 70,
            volumeMultiplier: config.volumeMultiplier || 1.5,
            confirmationPeriod: config.confirmationPeriod || 3,
            stopLossPercent: config.stopLossPercent || 0.02,
            takeProfitRatio: config.takeProfitRatio || 2.5,
            ...config
        };
        
        this.signals = [];
        this.lastSignal = null;
    }

    /**
     * Analyze market data and generate trading signals
     * @param {Object} marketData - Current market data
     * @param {Array} historicalData - Historical price data
     * @returns {Object} Trading signal with confidence and metadata
     */
    analyze(marketData, historicalData) {
        try {
            if (!this.validateData(marketData, historicalData)) {
                return this.createSignal('HOLD', 0, 'Insufficient data');
            }

            // Calculate technical indicators
            const indicators = this.calculateIndicators(historicalData);
            
            // Generate base signal from RSI
            const rsiSignal = this.generateRSISignal(indicators.rsi, marketData);
            
            // Apply volume confirmation
            const volumeConfirmed = this.confirmWithVolume(rsiSignal, marketData, indicators.avgVolume);
            
            // Multi-timeframe confirmation
            const confirmed = this.applyConfirmation(volumeConfirmed, indicators);
            
            // Calculate position sizing and risk management
            const enhancedSignal = this.enhanceWithRiskManagement(confirmed, marketData);
            
            // Store signal history
            this.updateSignalHistory(enhancedSignal);
            
            logger.info(`Enhanced RSI Signal: ${enhancedSignal.action} (${enhancedSignal.confidence})`);
            
            return enhancedSignal;
            
        } catch (error) {
            logger.error('Enhanced RSI Strategy Error:', error);
            return this.createSignal('HOLD', 0, 'Analysis error');
        }
    }

    /**
     * Calculate all technical indicators needed for strategy
     */
    calculateIndicators(historicalData) {
        const prices = historicalData.map(d => d.close);
        const volumes = historicalData.map(d => d.volume);
        const highs = historicalData.map(d => d.high);
        const lows = historicalData.map(d => d.low);

        return {
            rsi: calculateRSI(prices, this.config.rsiPeriod),
            macd: calculateMACD(prices),
            bollinger: calculateBollingerBands(prices, 20, 2),
            avgVolume: this.calculateMovingAverage(volumes, 20),
            priceMA20: this.calculateMovingAverage(prices, 20),
            priceMA50: this.calculateMovingAverage(prices, 50)
        };
    }

    /**
     * Generate RSI-based signal
     */
    generateRSISignal(rsiValues, marketData) {
        const currentRSI = rsiValues[rsiValues.length - 1];
        const previousRSI = rsiValues[rsiValues.length - 2];
        
        let signal = 'HOLD';
        let confidence = 0;
        let reason = 'No clear signal';

        // Oversold condition - potential buy
        if (currentRSI < this.config.rsiBuyThreshold) {
            signal = 'BUY';
            confidence = this.calculateBuyConfidence(currentRSI, previousRSI);
            reason = `RSI oversold: ${currentRSI.toFixed(2)}`;
        }
        // Overbought condition - potential sell
        else if (currentRSI > this.config.rsiSellThreshold) {
            signal = 'SELL';
            confidence = this.calculateSellConfidence(currentRSI, previousRSI);
            reason = `RSI overbought: ${currentRSI.toFixed(2)}`;
        }
        // Divergence detection
        else if (this.detectDivergence(rsiValues, marketData)) {
            const divergence = this.detectDivergence(rsiValues, marketData);
            signal = divergence.type;
            confidence = divergence.confidence;
            reason = `RSI divergence detected: ${divergence.description}`;
        }

        return this.createSignal(signal, confidence, reason, { rsi: currentRSI });
    }

    /**
     * Confirm signal with volume analysis
     */
    confirmWithVolume(signal, marketData, avgVolume) {
        const currentVolume = marketData.volume;
        const volumeRatio = currentVolume / avgVolume;
        
        // Volume confirmation factors
        let volumeConfidence = 1.0;
        
        if (signal.action === 'BUY' && volumeRatio > this.config.volumeMultiplier) {
            volumeConfidence = Math.min(1.5, 1 + (volumeRatio - this.config.volumeMultiplier) * 0.2);
        } else if (signal.action === 'SELL' && volumeRatio > 1.2) {
            volumeConfidence = Math.min(1.3, 1 + (volumeRatio - 1.2) * 0.15);
        } else if (volumeRatio < 0.5) {
            // Low volume reduces confidence
            volumeConfidence = 0.5;
        }

        return {
            ...signal,
            confidence: Math.min(1.0, signal.confidence * volumeConfidence),
            metadata: {
                ...signal.metadata,
                volume: currentVolume,
                avgVolume: avgVolume,
                volumeRatio: volumeRatio,
                volumeConfidence: volumeConfidence
            }
        };
    }

    /**
     * Apply multi-indicator confirmation
     */
    applyConfirmation(signal, indicators) {
        if (signal.action === 'HOLD') return signal;

        let confirmationFactors = [];
        
        // MACD confirmation
        const macd = indicators.macd;
        if (macd && macd.length > 1) {
            const currentMACD = macd[macd.length - 1];
            const previousMACD = macd[macd.length - 2];
            
            if (signal.action === 'BUY' && currentMACD.histogram > previousMACD.histogram) {
                confirmationFactors.push({ name: 'MACD', factor: 1.1 });
            } else if (signal.action === 'SELL' && currentMACD.histogram < previousMACD.histogram) {
                confirmationFactors.push({ name: 'MACD', factor: 1.1 });
            }
        }

        // Moving Average confirmation
        if (indicators.priceMA20 && indicators.priceMA50) {
            const ma20 = indicators.priceMA20[indicators.priceMA20.length - 1];
            const ma50 = indicators.priceMA50[indicators.priceMA50.length - 1];
            
            if (signal.action === 'BUY' && ma20 > ma50) {
                confirmationFactors.push({ name: 'MA_Trend', factor: 1.05 });
            } else if (signal.action === 'SELL' && ma20 < ma50) {
                confirmationFactors.push({ name: 'MA_Trend', factor: 1.05 });
            }
        }

        // Apply confirmation factors
        const totalConfirmation = confirmationFactors.reduce((acc, factor) => acc * factor.factor, 1.0);
        
        return {
            ...signal,
            confidence: Math.min(1.0, signal.confidence * totalConfirmation),
            metadata: {
                ...signal.metadata,
                confirmations: confirmationFactors
            }
        };
    }

    /**
     * Enhance signal with risk management parameters
     */
    enhanceWithRiskManagement(signal, marketData) {
        if (signal.action === 'HOLD') return signal;

        const price = marketData.close || marketData.price;
        
        // Calculate stop loss and take profit
        let stopLoss, takeProfit;
        
        if (signal.action === 'BUY') {
            stopLoss = price * (1 - this.config.stopLossPercent);
            takeProfit = price * (1 + this.config.stopLossPercent * this.config.takeProfitRatio);
        } else if (signal.action === 'SELL') {
            stopLoss = price * (1 + this.config.stopLossPercent);
            takeProfit = price * (1 - this.config.stopLossPercent * this.config.takeProfitRatio);
        }

        // Position sizing based on confidence
        const basePositionSize = 0.05; // 5% of portfolio
        const confidenceMultiplier = Math.max(0.2, signal.confidence);
        const positionSize = basePositionSize * confidenceMultiplier;

        return {
            ...signal,
            positionSize: positionSize,
            stopLoss: stopLoss,
            takeProfit: takeProfit,
            riskRewardRatio: this.config.takeProfitRatio,
            metadata: {
                ...signal.metadata,
                price: price,
                maxRisk: this.config.stopLossPercent * positionSize
            }
        };
    }

    /**
     * Detect RSI divergence patterns
     */
    detectDivergence(rsiValues, marketData) {
        // Simplified divergence detection
        // In production, this would be more sophisticated
        const lookback = 10;
        if (rsiValues.length < lookback) return null;

        // Look for bullish divergence: price makes lower lows, RSI makes higher lows
        // Look for bearish divergence: price makes higher highs, RSI makes lower highs
        
        // This is a placeholder for more complex divergence detection
        return null;
    }

    /**
     * Calculate confidence for buy signals
     */
    calculateBuyConfidence(currentRSI, previousRSI) {
        // Higher confidence for lower RSI values and improving momentum
        const rsiConfidence = Math.max(0, (30 - currentRSI) / 30);
        const momentumBonus = currentRSI > previousRSI ? 0.1 : 0;
        return Math.min(1.0, rsiConfidence + momentumBonus);
    }

    /**
     * Calculate confidence for sell signals
     */
    calculateSellConfidence(currentRSI, previousRSI) {
        // Higher confidence for higher RSI values and declining momentum
        const rsiConfidence = Math.max(0, (currentRSI - 70) / 30);
        const momentumBonus = currentRSI < previousRSI ? 0.1 : 0;
        return Math.min(1.0, rsiConfidence + momentumBonus);
    }

    /**
     * Validate input data
     */
    validateData(marketData, historicalData) {
        return marketData && 
               historicalData && 
               historicalData.length >= this.config.rsiPeriod + 10 &&
               marketData.close && 
               marketData.volume;
    }

    /**
     * Create standardized signal object
     */
    createSignal(action, confidence, reason, additionalData = {}) {
        return {
            strategy: this.name,
            action: action,
            confidence: Math.max(0, Math.min(1, confidence)),
            reason: reason,
            timestamp: new Date().toISOString(),
            metadata: additionalData
        };
    }

    /**
     * Update signal history
     */
    updateSignalHistory(signal) {
        this.signals.push(signal);
        if (this.signals.length > 1000) {
            this.signals = this.signals.slice(-500); // Keep last 500 signals
        }
        this.lastSignal = signal;
    }

    /**
     * Calculate simple moving average
     */
    calculateMovingAverage(values, period) {
        if (values.length < period) return [];
        
        const result = [];
        for (let i = period - 1; i < values.length; i++) {
            const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / period);
        }
        return result;
    }

    /**
     * Get strategy performance metrics
     */
    getPerformanceMetrics() {
        const recentSignals = this.signals.slice(-100);
        
        return {
            totalSignals: this.signals.length,
            recentSignals: recentSignals.length,
            avgConfidence: recentSignals.reduce((acc, s) => acc + s.confidence, 0) / recentSignals.length,
            signalDistribution: {
                buy: recentSignals.filter(s => s.action === 'BUY').length,
                sell: recentSignals.filter(s => s.action === 'SELL').length,
                hold: recentSignals.filter(s => s.action === 'HOLD').length
            },
            lastSignalTime: this.lastSignal?.timestamp
        };
    }
}

module.exports = EnhancedRSIStrategy;
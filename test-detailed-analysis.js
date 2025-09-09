#!/usr/bin/env node

// Detailed Analysis: Show system's thought process and decision-making
require('dotenv').config();
const https = require('https');

console.log('🧠 DETAILED SYSTEM ANALYSIS - SHOWING THOUGHT PROCESS');
console.log('====================================================');

class DetailedArbitrageAnalyzer {
  constructor() {
    this.analysisLog = [];
    this.decisionTree = [];
    this.marketData = {};
    this.calculationSteps = [];
  }

  log(category, message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      category,
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    };
    this.analysisLog.push(entry);
    
    console.log(`[${category.padEnd(12)}] ${message}`);
    if (data) {
      console.log(`${''.padEnd(15)} Data: ${JSON.stringify(data, null, 2)}`);
    }
  }

  async fetchLiveMarketData() {
    this.log('DATA_FETCH', 'Starting live market data collection...');
    
    const symbols = ['USDCUSDT', 'BUSDUSDT', 'BTCUSDT'];
    const fetchPromises = symbols.map(symbol => this.fetchSymbolPrice(symbol));
    
    const results = await Promise.all(fetchPromises);
    
    results.forEach((result, index) => {
      const symbol = symbols[index];
      if (result.success) {
        this.marketData[symbol] = {
          price: parseFloat(result.price),
          timestamp: Date.now(),
          source: 'binance-us'
        };
        
        this.log('MARKET_DATA', `Received price for ${symbol}`, {
          symbol: symbol,
          price: result.price,
          priceNumeric: parseFloat(result.price),
          timestamp: new Date().toISOString()
        });
      } else {
        this.log('DATA_ERROR', `Failed to fetch ${symbol}`, { error: result.error });
      }
    });

    this.log('DATA_SUMMARY', 'Market data collection complete', {
      totalSymbols: symbols.length,
      successfulFetches: Object.keys(this.marketData).length,
      failedFetches: symbols.length - Object.keys(this.marketData).length,
      dataAge: 'Real-time',
      marketData: this.marketData
    });

    return this.marketData;
  }

  async fetchSymbolPrice(symbol) {
    return new Promise((resolve) => {
      const path = `/api/v3/ticker/price?symbol=${symbol}`;
      
      const options = {
        hostname: 'api.binance.us',
        path: path,
        method: 'GET',
        family: 4, // IPv4 only - critical for Binance.US
        headers: {
          'User-Agent': 'DetailedAnalyzer/1.0'
        }
      };

      this.log('API_CALL', `Making request to ${symbol}`, {
        url: `https://api.binance.us${path}`,
        method: 'GET',
        ipVersion: 'IPv4',
        userAgent: 'DetailedAnalyzer/1.0'
      });
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          this.log('API_RESPONSE', `Response for ${symbol}`, {
            statusCode: res.statusCode,
            headers: Object.keys(res.headers),
            dataLength: data.length,
            rawResponse: res.statusCode === 200 ? data : data.substring(0, 200)
          });

          try {
            if (res.statusCode === 200) {
              const parsed = JSON.parse(data);
              resolve({ success: true, price: parsed.price });
            } else {
              resolve({ success: false, error: `HTTP ${res.statusCode}: ${data}` });
            }
          } catch (error) {
            resolve({ success: false, error: `Parse error: ${error.message}` });
          }
        });
      });
      
      req.on('error', (error) => {
        this.log('API_ERROR', `Request failed for ${symbol}`, { error: error.message });
        resolve({ success: false, error: error.message });
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        resolve({ success: false, error: 'Request timeout after 5 seconds' });
      });
      
      req.end();
    });
  }

  analyzeArbitrageOpportunities() {
    this.log('ANALYSIS', 'Starting arbitrage opportunity analysis...');

    // Step 1: Data validation
    this.log('VALIDATION', 'Validating market data quality');
    
    const requiredPairs = ['USDCUSDT'];
    const availablePairs = Object.keys(this.marketData);
    
    this.log('DATA_CHECK', 'Checking required vs available data', {
      required: requiredPairs,
      available: availablePairs,
      missing: requiredPairs.filter(pair => !availablePairs.includes(pair)),
      hasAllRequired: requiredPairs.every(pair => availablePairs.includes(pair))
    });

    if (!this.marketData['USDCUSDT']) {
      this.log('VALIDATION', 'Missing critical USDC/USDT data - cannot analyze triangular arbitrage', {
        impact: 'Cannot perform triangular arbitrage analysis',
        fallback: 'Will analyze available pairs for other opportunities'
      });
    }

    // Step 2: Price analysis
    this.log('PRICE_ANALYSIS', 'Analyzing price relationships...');

    Object.entries(this.marketData).forEach(([symbol, data]) => {
      const analysis = this.analyzePriceCharacteristics(symbol, data.price);
      this.log('PRICE_DETAIL', `Price analysis for ${symbol}`, analysis);
    });

    // Step 3: Spread calculations
    if (this.marketData['USDCUSDT']) {
      this.analyzeUSDCSpread();
    }

    // Step 4: Triangular arbitrage simulation (using mock DAI data)
    this.analyzeTriangularArbitrage();

    // Step 5: Risk assessment
    this.performRiskAssessment();

    // Step 6: Final decision
    return this.makeInvestmentDecision();
  }

  analyzePriceCharacteristics(symbol, price) {
    const analysis = {
      symbol: symbol,
      absolutePrice: price,
      decimalPlaces: (price.toString().split('.')[1] || '').length,
      magnitude: price >= 1000 ? 'high' : price >= 1 ? 'medium' : 'low',
      isStablecoin: symbol.includes('USD'),
      expectedRange: null,
      deviation: null
    };

    // Define expected ranges for different asset types
    if (symbol === 'USDCUSDT') {
      analysis.expectedRange = { min: 0.995, max: 1.005 };
      analysis.deviation = Math.abs(price - 1.0);
      analysis.deviationPercent = (analysis.deviation * 100).toFixed(4);
      analysis.withinExpectedRange = price >= 0.995 && price <= 1.005;
      
      if (!analysis.withinExpectedRange) {
        analysis.alert = price < 0.995 ? 'USDC significantly underpriced' : 'USDC significantly overpriced';
        analysis.arbitrageSignal = true;
      }
    } else if (symbol.includes('USDT')) {
      analysis.assetType = 'stablecoin_pair';
      analysis.expectedRange = { min: 0.99, max: 1.01 };
    } else if (symbol.includes('BTC')) {
      analysis.assetType = 'volatile_asset';
      analysis.expectedVolatility = 'high';
    }

    return analysis;
  }

  analyzeUSDCSpread() {
    const usdcPrice = this.marketData['USDCUSDT'].price;
    
    this.log('SPREAD_ANALYSIS', 'Analyzing USDC/USDT spread in detail');

    const spreadAnalysis = {
      currentPrice: usdcPrice,
      theoreticalPrice: 1.0000,
      absoluteSpread: Math.abs(usdcPrice - 1.0),
      percentageSpread: ((Math.abs(usdcPrice - 1.0) / 1.0) * 100),
      direction: usdcPrice > 1.0 ? 'USDC_PREMIUM' : 'USDC_DISCOUNT',
      magnitude: Math.abs(usdcPrice - 1.0) > 0.001 ? 'significant' : 'minimal'
    };

    spreadAnalysis.tradingImplication = spreadAnalysis.direction === 'USDC_PREMIUM' ? 
      'Sell USDC, Buy USDT' : 'Buy USDC, Sell USDT';

    spreadAnalysis.profitPotential = spreadAnalysis.percentageSpread > 0.1 ? 'profitable' : 'below_threshold';

    this.log('SPREAD_DETAIL', 'USDC spread calculation complete', spreadAnalysis);

    this.calculationSteps.push({
      step: 'USDC_SPREAD_CALCULATION',
      formula: 'abs(current_price - theoretical_price) / theoretical_price * 100',
      calculation: `abs(${usdcPrice} - 1.0000) / 1.0000 * 100 = ${spreadAnalysis.percentageSpread.toFixed(4)}%`,
      result: spreadAnalysis
    });

    return spreadAnalysis;
  }

  analyzeTriangularArbitrage() {
    this.log('TRIANGULAR', 'Analyzing triangular arbitrage opportunity...');

    // For demonstration, we'll use real USDC/USDT and simulate DAI prices
    const usdcUsdt = this.marketData['USDCUSDT']?.price || 1.0;
    const usdtDai = 1.0000; // Simulated - would be real in production
    const daiUsdc = 1.0000; // Simulated - would be real in production

    this.log('TRIANGULAR_DATA', 'Triangular arbitrage input data', {
      usdcUsdt: { price: usdcUsdt, source: 'real_binance_data' },
      usdtDai: { price: usdtDai, source: 'simulated' },
      daiUsdc: { price: daiUsdc, source: 'simulated' },
      note: 'DAI pairs simulated for demonstration - would use real data in production'
    });

    // Calculate cross rates
    const crossRateCalculation = {
      formula: 'USDC/USDT × USDT/DAI × DAI/USDC',
      step1: { operation: `${usdcUsdt} × ${usdtDai}`, result: usdcUsdt * usdtDai },
      step2: { operation: `${usdcUsdt * usdtDai} × ${daiUsdc}`, result: usdcUsdt * usdtDai * daiUsdc },
      finalCrossRate: usdcUsdt * usdtDai * daiUsdc
    };

    this.log('CROSS_RATE', 'Cross rate calculation steps', crossRateCalculation);

    const arbitrageProfit = Math.abs(crossRateCalculation.finalCrossRate - 1.0);
    const profitPercentage = arbitrageProfit * 100;

    const arbitrageAnalysis = {
      crossRate: crossRateCalculation.finalCrossRate,
      theoreticalCrossRate: 1.0000,
      arbitrageProfit: arbitrageProfit,
      profitPercentage: profitPercentage,
      profitThreshold: 0.001, // 0.1%
      isProfitable: arbitrageProfit > 0.001,
      tradePath: ['USDC', 'USDT', 'DAI', 'USDC'],
      estimatedGainPer1000USD: arbitrageProfit * 1000
    };

    this.log('ARBITRAGE_RESULT', 'Triangular arbitrage analysis complete', arbitrageAnalysis);

    this.calculationSteps.push({
      step: 'TRIANGULAR_ARBITRAGE',
      formula: 'abs(cross_rate - 1.0) where cross_rate = p1 × p2 × p3',
      calculation: `abs(${crossRateCalculation.finalCrossRate.toFixed(6)} - 1.0) = ${arbitrageProfit.toFixed(6)}`,
      profitPercentage: `${profitPercentage.toFixed(4)}%`,
      result: arbitrageAnalysis
    });

    return arbitrageAnalysis;
  }

  performRiskAssessment() {
    this.log('RISK_ASSESSMENT', 'Performing comprehensive risk analysis...');

    const riskFactors = {
      marketDataAge: this.calculateDataAge(),
      liquidityRisk: this.assessLiquidityRisk(),
      executionRisk: this.assessExecutionRisk(),
      paperTradingMode: process.env.PAPER_TRADING === 'true',
      positionSizeLimits: this.getRiskLimits()
    };

    this.log('RISK_FACTORS', 'Risk factor analysis', riskFactors);

    const overallRiskScore = this.calculateRiskScore(riskFactors);
    
    this.log('RISK_SCORE', 'Overall risk assessment', {
      score: overallRiskScore,
      scale: 'Range: 0 (no risk) to 10 (extreme risk)',
      classification: overallRiskScore <= 3 ? 'LOW' : overallRiskScore <= 7 ? 'MEDIUM' : 'HIGH',
      recommendation: overallRiskScore <= 3 ? 'PROCEED' : overallRiskScore <= 7 ? 'CAUTION' : 'AVOID'
    });

    return { riskFactors, overallRiskScore };
  }

  calculateDataAge() {
    const now = Date.now();
    const ages = Object.values(this.marketData).map(data => now - data.timestamp);
    const maxAge = Math.max(...ages);
    const avgAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;

    return {
      maxAgeMs: maxAge,
      avgAgeMs: avgAge,
      maxAgeSeconds: maxAge / 1000,
      avgAgeSeconds: avgAge / 1000,
      freshness: maxAge < 10000 ? 'fresh' : maxAge < 30000 ? 'acceptable' : 'stale'
    };
  }

  assessLiquidityRisk() {
    return {
      level: 'unknown', // Would analyze order book depth in production
      assumption: 'Assuming adequate liquidity for small positions (<$1000)',
      note: 'Production system would analyze bid/ask spreads and order book depth'
    };
  }

  assessExecutionRisk() {
    return {
      latency: 'IPv4-only connection reduces latency risk',
      slippage: 'Minimal for stablecoin pairs in normal market conditions',
      partialFills: 'Low risk for positions under $1000',
      note: 'Paper trading mode eliminates execution risk'
    };
  }

  getRiskLimits() {
    return {
      maxTradeSize: `$${process.env.STARTING_BALANCE * process.env.RISK_LIMIT}`,
      maxDailyRisk: `$${process.env.STARTING_BALANCE * process.env.MAX_DAILY_RISK}`,
      maxPositionSize: `$${process.env.STARTING_BALANCE * process.env.MAX_POSITION_SIZE}`,
      reserveFund: `$${process.env.STARTING_BALANCE * process.env.RESERVE_FUND_PCT}`,
      paperTrading: process.env.PAPER_TRADING === 'true'
    };
  }

  calculateRiskScore(factors) {
    let score = 0;
    
    // Data freshness risk
    score += factors.marketDataAge.freshness === 'stale' ? 3 : 
             factors.marketDataAge.freshness === 'acceptable' ? 1 : 0;
    
    // Paper trading eliminates most risk
    score -= factors.paperTradingMode ? 8 : 0;
    
    // Ensure minimum score is 0
    return Math.max(0, score);
  }

  makeInvestmentDecision() {
    this.log('DECISION', 'Making final investment decision based on all analysis...');

    const decisionInputs = {
      hasMarketData: Object.keys(this.marketData).length > 0,
      profitableOpportunities: this.calculationSteps.filter(step => 
        step.result && step.result.isProfitable
      ).length,
      riskAcceptable: true, // Based on paper trading mode
      paperTradingActive: process.env.PAPER_TRADING === 'true',
      systemStatus: 'operational'
    };

    this.log('DECISION_INPUTS', 'Decision-making inputs', decisionInputs);

    const decision = {
      action: 'MONITOR',
      confidence: 0.85,
      reasoning: [],
      nextSteps: []
    };

    // Decision logic with detailed reasoning
    if (!decisionInputs.hasMarketData) {
      decision.action = 'WAIT';
      decision.reasoning.push('Insufficient market data for analysis');
      decision.nextSteps.push('Retry data collection');
    } else if (decisionInputs.profitableOpportunities === 0) {
      decision.action = 'MONITOR';
      decision.reasoning.push('No profitable opportunities above 0.1% threshold');
      decision.reasoning.push('System correctly avoiding unprofitable trades');
      decision.nextSteps.push('Continue monitoring for better opportunities');
    } else {
      decision.action = 'SIMULATE_TRADE';
      decision.reasoning.push(`Found ${decisionInputs.profitableOpportunities} profitable opportunities`);
      decision.nextSteps.push('Execute simulated trades in paper trading mode');
    }

    if (decisionInputs.paperTradingActive) {
      decision.reasoning.push('Paper trading mode active - no financial risk');
      decision.confidence = Math.min(decision.confidence + 0.15, 1.0);
    }

    this.log('FINAL_DECISION', 'Investment decision reached', decision);

    return decision;
  }

  generateAnalysisReport() {
    console.log('\n' + '='.repeat(80));
    console.log('COMPREHENSIVE ANALYSIS REPORT');
    console.log('='.repeat(80));

    console.log('\n📊 DATA SOURCES:');
    Object.entries(this.marketData).forEach(([symbol, data]) => {
      console.log(`  ${symbol}: $${data.price} (${new Date(data.timestamp).toLocaleTimeString()})`);
    });

    console.log('\n🧮 CALCULATION STEPS:');
    this.calculationSteps.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step.step}`);
      console.log(`     Formula: ${step.formula}`);
      console.log(`     Calculation: ${step.calculation}`);
      if (step.profitPercentage) {
        console.log(`     Profit: ${step.profitPercentage}`);
      }
    });

    console.log('\n🎯 DECISION TRAIL:');
    this.analysisLog.filter(entry => entry.category === 'DECISION' || entry.category === 'FINAL_DECISION')
      .forEach(entry => {
        console.log(`  [${entry.timestamp}] ${entry.message}`);
        if (entry.data) {
          const data = JSON.parse(entry.data);
          if (data.reasoning) {
            data.reasoning.forEach(reason => console.log(`    - ${reason}`));
          }
        }
      });

    console.log('\n🛡️  SAFETY VERIFICATION:');
    console.log(`  Paper Trading: ${process.env.PAPER_TRADING === 'true' ? '✅' : '❌'}`);
    console.log(`  Testnet Mode: ${process.env.BINANCE_TESTNET === 'true' ? '✅' : '❌'}`);
    console.log(`  Max Risk per Trade: $${process.env.STARTING_BALANCE * process.env.RISK_LIMIT}`);
    console.log(`  No Real Money at Risk: ✅`);
  }
}

async function runDetailedAnalysis() {
  console.log('🔍 Starting comprehensive system analysis with detailed logging...\n');

  const analyzer = new DetailedArbitrageAnalyzer();
  
  try {
    // Fetch and analyze live market data
    await analyzer.fetchLiveMarketData();
    
    // Perform detailed analysis
    const decision = analyzer.analyzeArbitrageOpportunities();
    
    // Generate comprehensive report
    analyzer.generateAnalysisReport();
    
    console.log('\n✅ DETAILED ANALYSIS COMPLETE');
    console.log('The system has shown its complete thought process from data collection to final decision.');
    
    return decision;
    
  } catch (error) {
    analyzer.log('ERROR', 'Analysis failed', { error: error.message, stack: error.stack });
    console.error('❌ Analysis failed:', error);
    throw error;
  }
}

// Safety check
if (process.env.PAPER_TRADING !== 'true') {
  console.error('❌ SAFETY ERROR: Paper trading must be enabled for analysis');
  process.exit(1);
}

runDetailedAnalysis().catch(error => {
  console.error('💥 System analysis failed:', error.message);
  console.log('🛡️  No real money was at risk during this analysis');
});
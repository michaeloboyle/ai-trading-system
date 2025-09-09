#!/usr/bin/env node

// Analyze available arbitrage opportunities and currency pairs
require('dotenv').config();
const https = require('https');

console.log('🔍 ARBITRAGE OPPORTUNITY ANALYSIS');
console.log('=================================');

class ArbitrageOpportunityAnalyzer {
  constructor() {
    this.availablePairs = [];
    this.stablecoins = [];
    this.majorCryptos = [];
    this.arbitrageTypes = [];
  }

  async fetchBinanceUSExchangeInfo() {
    console.log('📡 Fetching all available trading pairs from Binance.US...\n');
    
    return new Promise((resolve) => {
      const options = {
        hostname: 'api.binance.us',
        path: '/api/v3/exchangeInfo',
        method: 'GET',
        family: 4 // IPv4 only
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const exchangeInfo = JSON.parse(data);
            resolve(exchangeInfo);
          } catch (error) {
            console.error('Error parsing exchange info:', error);
            resolve(null);
          }
        });
      });

      req.on('error', (error) => {
        console.error('Error fetching exchange info:', error);
        resolve(null);
      });

      req.end();
    });
  }

  analyzeAvailablePairs(exchangeInfo) {
    if (!exchangeInfo || !exchangeInfo.symbols) {
      console.log('❌ Could not fetch exchange info - using known pairs for analysis\n');
      this.useKnownPairs();
      return;
    }

    console.log(`📊 Found ${exchangeInfo.symbols.length} total trading pairs on Binance.US\n`);

    // Filter active trading pairs
    const activePairs = exchangeInfo.symbols.filter(symbol => 
      symbol.status === 'TRADING' && 
      symbol.permissions.includes('SPOT')
    );

    console.log(`✅ ${activePairs.length} active spot trading pairs available\n`);

    // Categorize pairs
    this.categorizePairs(activePairs);
  }

  categorizePairs(pairs) {
    const stablecoinSymbols = ['USDT', 'USDC', 'BUSD', 'DAI', 'FRAX', 'TUSD'];
    const majorCryptoSymbols = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'MATIC', 'AVAX', 'DOT'];

    // Find stablecoin pairs
    const stablecoinPairs = pairs.filter(pair => {
      const base = pair.baseAsset;
      const quote = pair.quoteAsset;
      return stablecoinSymbols.includes(base) && stablecoinSymbols.includes(quote);
    });

    // Find major crypto pairs with USD stablecoins
    const cryptoStablePairs = pairs.filter(pair => {
      const base = pair.baseAsset;
      const quote = pair.quoteAsset;
      return majorCryptoSymbols.includes(base) && 
             (quote === 'USDT' || quote === 'USDC' || quote === 'BUSD');
    });

    console.log('🪙 STABLECOIN ARBITRAGE OPPORTUNITIES:');
    console.log('=====================================');
    
    if (stablecoinPairs.length > 0) {
      stablecoinPairs.forEach(pair => {
        console.log(`   ${pair.symbol}: ${pair.baseAsset} ↔ ${pair.quoteAsset}`);
      });
      
      console.log(`\n📈 Triangular Arbitrage Possibilities:`);
      this.findTriangularPaths(stablecoinPairs);
    } else {
      console.log('   ⚠️  Limited stablecoin pairs available on Binance.US');
      console.log('   💡 Will use USDC/USDT as primary pair with simulated DAI');
    }

    console.log('\n₿ MAJOR CRYPTOCURRENCY OPPORTUNITIES:');
    console.log('=====================================');
    
    const topCryptoPairs = cryptoStablePairs.slice(0, 10);
    topCryptoPairs.forEach(pair => {
      console.log(`   ${pair.symbol}: ${pair.baseAsset} priced in ${pair.quoteAsset}`);
    });

    this.identifyArbitrageStrategies(stablecoinPairs, cryptoStablePairs);
  }

  findTriangularPaths(stablecoinPairs) {
    const triangularPaths = [
      {
        path: 'USDC → USDT → BUSD → USDC',
        pairs: ['USDCUSDT', 'USDTBUSD', 'BUSDUCDC'],
        description: 'Classic stablecoin triangular arbitrage'
      },
      {
        path: 'USDC → USDT → DAI → USDC', 
        pairs: ['USDCUSDT', 'USDTDAI', 'DAIUSDC'],
        description: 'Our current strategy (DAI simulated)'
      },
      {
        path: 'USDT → BUSD → USDC → USDT',
        pairs: ['USDTBUSD', 'BUSDUCDC', 'USDCUSDT'],
        description: 'Alternative triangular path'
      }
    ];

    triangularPaths.forEach(triangle => {
      const available = triangle.pairs.every(pairSymbol => 
        stablecoinPairs.some(pair => pair.symbol === pairSymbol)
      );
      
      const status = available ? '✅ Available' : '⚠️  Partially available';
      console.log(`   ${triangle.path}`);
      console.log(`      Status: ${status}`);
      console.log(`      Pairs needed: ${triangle.pairs.join(', ')}`);
      console.log(`      ${triangle.description}\n`);
    });
  }

  identifyArbitrageStrategies(stablePairs, cryptoPairs) {
    console.log('\n🎯 RECOMMENDED ARBITRAGE STRATEGIES:');
    console.log('====================================');

    const strategies = [
      {
        name: 'Stablecoin Triangular Arbitrage',
        risk: 'VERY LOW',
        frequency: 'Rare but consistent',
        profitTarget: '0.1% - 0.5%',
        timeWindow: '5-30 seconds',
        description: 'Exploit price differences between USDT, USDC, BUSD',
        currentImplementation: '✅ Active',
        pairs: ['USDCUSDT', 'USDTBUSD', 'BUSDUCDC']
      },
      {
        name: 'Cross-Exchange Arbitrage',
        risk: 'LOW-MEDIUM',
        frequency: 'Occasional',
        profitTarget: '0.2% - 1.0%',
        timeWindow: '30 seconds - 2 minutes',
        description: 'Same asset different prices on different exchanges',
        currentImplementation: '🔄 Future enhancement',
        pairs: ['BTC on Binance.US vs Coinbase Advanced Trade']
      },
      {
        name: 'Crypto-Stablecoin Statistical Arbitrage',
        risk: 'MEDIUM',
        frequency: 'Frequent',
        profitTarget: '0.5% - 2.0%',
        timeWindow: '1-10 minutes',
        description: 'Exploit temporary deviations from fair value',
        currentImplementation: '📋 Planned for Phase 3',
        pairs: ['BTCUSDT', 'BTCUSDC', 'ETHUSDT', 'ETHUSDC']
      },
      {
        name: 'Funding Rate Arbitrage',
        risk: 'MEDIUM-HIGH',
        frequency: 'Daily',
        profitTarget: '0.01% - 0.1% daily',
        timeWindow: 'Hold for funding periods',
        description: 'Earn funding payments on futures positions',
        currentImplementation: '🔮 Advanced strategy',
        pairs: ['Spot vs Perpetual futures']
      }
    ];

    strategies.forEach((strategy, index) => {
      console.log(`${index + 1}. ${strategy.name}`);
      console.log(`   Risk Level: ${strategy.risk}`);
      console.log(`   Frequency: ${strategy.frequency}`);
      console.log(`   Profit Target: ${strategy.profitTarget}`);
      console.log(`   Time Window: ${strategy.timeWindow}`);
      console.log(`   Description: ${strategy.description}`);
      console.log(`   Implementation: ${strategy.currentImplementation}`);
      console.log(`   Key Pairs: ${Array.isArray(strategy.pairs) ? strategy.pairs.join(', ') : strategy.pairs}`);
      console.log('');
    });
  }

  analyzeCurrentImplementation() {
    console.log('🔧 CURRENT SYSTEM ANALYSIS:');
    console.log('============================');

    console.log('Currently Implemented:');
    console.log('✅ Stablecoin triangular arbitrage (USDC/USDT/DAI)');
    console.log('✅ Real-time price fetching from Binance.US');
    console.log('✅ Risk management and position sizing');
    console.log('✅ Paper trading safety controls');
    console.log('✅ IPv4-only API optimization');

    console.log('\nCurrent Limitations:');
    console.log('⚠️  DAI pairs simulated (limited DAI liquidity on Binance.US)');
    console.log('⚠️  Single exchange focus (missing cross-exchange opportunities)');
    console.log('⚠️  Only stablecoin arbitrage (missing crypto opportunities)');
    console.log('⚠️  No futures integration (missing funding rate arbitrage)');

    console.log('\nImmediate Improvements Possible:');
    console.log('💡 Add BUSD pairs for real triangular arbitrage');
    console.log('💡 Implement statistical arbitrage on BTC/ETH pairs');
    console.log('💡 Add Coinbase Advanced Trade for cross-exchange');
    console.log('💡 Monitor more stablecoin pairs simultaneously');
  }

  recommendNextSteps() {
    console.log('\n🚀 RECOMMENDED NEXT STEPS:');
    console.log('==========================');

    const nextSteps = [
      {
        priority: 'HIGH',
        task: 'Implement BUSD triangular arbitrage',
        description: 'Replace simulated DAI with real BUSD pairs',
        impact: 'Real triangular arbitrage opportunities',
        effort: 'LOW (modify existing code)',
        timeframe: '1-2 days'
      },
      {
        priority: 'HIGH', 
        task: 'Add multiple stablecoin monitoring',
        description: 'Monitor USDC/USDT, USDT/BUSD, BUSD/USDC simultaneously',
        impact: 'Increased opportunity detection',
        effort: 'MEDIUM (parallel scanning)',
        timeframe: '3-5 days'
      },
      {
        priority: 'MEDIUM',
        task: 'Implement BTC/ETH statistical arbitrage',
        description: 'Exploit BTCUSDT vs BTCUSDC price differences',
        impact: 'More frequent trading opportunities', 
        effort: 'MEDIUM (new strategy type)',
        timeframe: '1-2 weeks'
      },
      {
        priority: 'MEDIUM',
        task: 'Add Coinbase Advanced Trade integration',
        description: 'Cross-exchange arbitrage opportunities',
        impact: 'Larger profit margins (0.5-2%)',
        effort: 'HIGH (new exchange integration)',
        timeframe: '2-3 weeks'
      },
      {
        priority: 'LOW',
        task: 'Futures and funding rate arbitrage',
        description: 'Advanced strategies with leverage',
        impact: 'Consistent daily income stream',
        effort: 'HIGH (complex risk management)',
        timeframe: '1-2 months'
      }
    ];

    nextSteps.forEach((step, index) => {
      console.log(`${index + 1}. [${step.priority}] ${step.task}`);
      console.log(`   Description: ${step.description}`);
      console.log(`   Impact: ${step.impact}`);
      console.log(`   Effort: ${step.effort}`);
      console.log(`   Timeframe: ${step.timeframe}`);
      console.log('');
    });
  }

  useKnownPairs() {
    // Fallback if we can't fetch live exchange info
    console.log('Using known Binance.US pairs for analysis:\n');
    
    const knownPairs = [
      'USDCUSDT', 'BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT',
      'MATICUSDT', 'AVAXUSDT', 'DOTUSDT', 'BTCUSDC', 'ETHUSDC'
    ];

    knownPairs.forEach(pair => {
      console.log(`   ${pair}`);
    });
    console.log('');
  }
}

async function analyzeOpportunities() {
  const analyzer = new ArbitrageOpportunityAnalyzer();
  
  try {
    // Fetch live exchange information
    const exchangeInfo = await analyzer.fetchBinanceUSExchangeInfo();
    
    // Analyze available pairs
    analyzer.analyzeAvailablePairs(exchangeInfo);
    
    // Analyze current implementation
    analyzer.analyzeCurrentImplementation();
    
    // Recommend next steps
    analyzer.recommendNextSteps();
    
    console.log('✅ ARBITRAGE ANALYSIS COMPLETE');
    console.log('\n💡 Key Insight: Current system is well-designed but can be expanded');
    console.log('🎯 Priority: Add BUSD pairs for real triangular arbitrage opportunities');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

if (process.env.PAPER_TRADING !== 'true') {
  console.error('❌ SAFETY ERROR: Paper trading must be enabled');
  process.exit(1);
}

analyzeOpportunities();
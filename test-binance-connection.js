#!/usr/bin/env node

// Test Binance.US API connection with real keys
require('dotenv').config();
const https = require('https');
const crypto = require('crypto');

class BinanceUSTest {
  constructor() {
    this.apiKey = process.env.BINANCE_API_KEY;
    this.secretKey = process.env.BINANCE_SECRET_KEY;
    this.baseURL = 'api.binance.us';
    
    if (!this.apiKey || !this.secretKey) {
      throw new Error('Missing API keys in .env file');
    }
  }
  
  // Create signature for authenticated requests
  createSignature(queryString) {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(queryString)
      .digest('hex');
  }
  
  // Make HTTPS request
  makeRequest(path, headers = {}) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseURL,
        path: path,
        method: 'GET',
        headers: headers
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch (error) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });
      
      req.on('error', reject);
      req.end();
    });
  }
  
  // Test public endpoint
  async testPublicEndpoint() {
    try {
      console.log('🔍 Testing public endpoint (server time)...');
      const response = await this.makeRequest('/api/v3/time');
      
      if (response.status === 200) {
        console.log('✅ Public endpoint success');
        return true;
      } else {
        console.error('❌ Public endpoint failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Public endpoint failed:', error.message);
      return false;
    }
  }
  
  // Test API authentication
  async testAPIKeyAuth() {
    try {
      console.log('🔑 Testing API key authentication...');
      
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.createSignature(queryString);
      const path = `/api/v3/account?${queryString}&signature=${signature}`;
      
      const response = await this.makeRequest(path, {
        'X-MBX-APIKEY': this.apiKey
      });
      
      if (response.status === 200) {
        console.log('✅ API authentication success');
        console.log('📊 Account type:', response.data.accountType);
        console.log('🔒 Can trade:', response.data.canTrade);
        console.log('🔒 Can withdraw:', response.data.canWithdraw);
        
        return response.data;
      } else {
        console.error('❌ API authentication failed:', response.status, response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ API authentication failed:', error.message);
      return false;
    }
  }
  
  // Check account balances
  async checkBalances(accountData) {
    try {
      console.log('\n💰 Account Balances:');
      const balances = accountData.balances.filter(balance => 
        parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
      );
      
      if (balances.length === 0) {
        console.log('⚠️  No balances found - USDC transfer may still be pending');
        return false;
      }
      
      balances.forEach(balance => {
        const free = parseFloat(balance.free);
        const locked = parseFloat(balance.locked);
        const total = free + locked;
        
        if (total > 0.001) { // Only show meaningful balances
          console.log(`${balance.asset}: ${total.toFixed(6)} (${free.toFixed(6)} free)`);
        }
      });
      
      // Check specifically for USDC
      const usdc = balances.find(b => b.asset === 'USDC');
      if (usdc && parseFloat(usdc.free) > 0) {
        const usdcAmount = parseFloat(usdc.free);
        console.log(`\n🎯 USDC Balance: $${usdcAmount.toFixed(2)} (ready for trading)`);
        
        if (usdcAmount >= 800) {
          console.log('✅ Sufficient balance for trading system');
          return true;
        } else {
          console.log(`⚠️  Balance below recommended $800 for full system`);
          return true; // Still can trade, just with smaller amounts
        }
      } else {
        console.log('⏳ USDC not found or zero balance - transfer may still be processing');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Balance check failed:', error.message);
      return false;
    }
  }
  
  // Test market data access
  async testMarketData() {
    try {
      console.log('\n📈 Testing market data access...');
      
      const response = await this.makeRequest('/api/v3/ticker/price?symbol=BTCUSDC');
      
      if (response.status === 200) {
        console.log('✅ Market data access successful');
        console.log(`📊 BTC/USDC Price: $${parseFloat(response.data.price).toLocaleString()}`);
        return true;
      } else {
        console.error('❌ Market data failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Market data test failed:', error.message);
      return false;
    }
  }
  
  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Binance.US API Connection Tests\n');
    
    const results = {
      publicEndpoint: await this.testPublicEndpoint(),
      apiAuth: false,
      balances: false,
      marketData: await this.testMarketData()
    };
    
    // Test API authentication
    const authResult = await this.testAPIKeyAuth();
    results.apiAuth = !!authResult;
    
    // If auth worked, check balances
    if (authResult) {
      results.balances = await this.checkBalances(authResult);
    }
    
    console.log('\n📋 Test Results Summary:');
    console.log('==========================================');
    console.log(`Public Endpoint: ${results.publicEndpoint ? '✅' : '❌'}`);
    console.log(`API Authentication: ${results.apiAuth ? '✅' : '❌'}`);
    console.log(`Balance Access: ${results.balances ? '✅' : '⏳'}`);
    console.log(`Market Data: ${results.marketData ? '✅' : '❌'}`);
    
    const readyForTrading = results.publicEndpoint && results.apiAuth && results.balances && results.marketData;
    
    console.log('\n🎯 Trading System Status:');
    if (readyForTrading) {
      console.log('✅ READY FOR TRADING - All systems operational!');
    } else if (results.publicEndpoint && results.apiAuth && results.marketData) {
      console.log('⏳ WAITING FOR USDC - System ready, waiting for deposit');
    } else {
      console.log('❌ NOT READY - Check API keys and connection');
    }
    
    return readyForTrading;
  }
}

// Run the test
if (require.main === module) {
  const tester = new BinanceUSTest();
  tester.runAllTests()
    .then(ready => {
      process.exit(ready ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = BinanceUSTest;
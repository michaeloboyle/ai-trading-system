#!/usr/bin/env node

// Debug Binance authentication with detailed logging
require('dotenv').config();
const https = require('https');
const crypto = require('crypto');

class BinanceDebugger {
  constructor() {
    this.apiKey = process.env.BINANCE_API_KEY;
    this.secretKey = process.env.BINANCE_SECRET_KEY;
    this.baseURL = 'api.binance.us';
    
    console.log('🔍 API Key starts with:', this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'NOT FOUND');
    console.log('🔍 Secret Key starts with:', this.secretKey ? this.secretKey.substring(0, 8) + '...' : 'NOT FOUND');
  }
  
  createSignature(queryString) {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(queryString)
      .digest('hex');
  }
  
  makeRequest(path, headers = {}) {
    return new Promise((resolve, reject) => {
      console.log('📡 Making request to:', `https://${this.baseURL}${path}`);
      console.log('📡 Headers:', headers);
      
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
          console.log('📡 Response status:', res.statusCode);
          console.log('📡 Response headers:', res.headers);
          
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch (error) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('📡 Request error:', error);
        reject(error);
      });
      req.end();
    });
  }
  
  async testAuthentication() {
    try {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.createSignature(queryString);
      
      console.log('🔑 Timestamp:', timestamp);
      console.log('🔑 Query string:', queryString);
      console.log('🔑 Signature:', signature);
      
      const path = `/api/v3/account?${queryString}&signature=${signature}`;
      
      const response = await this.makeRequest(path, {
        'X-MBX-APIKEY': this.apiKey
      });
      
      if (response.status === 200) {
        console.log('✅ Authentication successful!');
        return response.data;
      } else {
        console.log('❌ Authentication failed with detailed response:');
        console.log('Status:', response.status);
        console.log('Data:', response.data);
        return false;
      }
    } catch (error) {
      console.error('💥 Error during authentication:', error);
      return false;
    }
  }
  
  async testServerTime() {
    try {
      console.log('\n⏰ Testing server time synchronization...');
      const serverTimeResponse = await this.makeRequest('/api/v3/time');
      const serverTime = serverTimeResponse.data.serverTime;
      const localTime = Date.now();
      const timeDiff = Math.abs(serverTime - localTime);
      
      console.log('Server time:', new Date(serverTime));
      console.log('Local time:', new Date(localTime));
      console.log('Time difference:', timeDiff, 'ms');
      
      if (timeDiff > 5000) {
        console.log('⚠️  WARNING: Time difference > 5 seconds. This can cause auth failures.');
        return false;
      } else {
        console.log('✅ Time synchronization OK');
        return true;
      }
    } catch (error) {
      console.error('❌ Server time test failed:', error);
      return false;
    }
  }
}

// Run debug test
async function runDebugTest() {
  console.log('🚀 Starting Binance Authentication Debug\n');
  
  const binanceDebugger = new BinanceDebugger();
  
  // Test server time first
  const timeOK = await binanceDebugger.testServerTime();
  
  // Test authentication
  console.log('\n🔑 Testing API authentication...');
  const authResult = await binanceDebugger.testAuthentication();
  
  console.log('\n📋 Debug Summary:');
  console.log('==================');
  console.log(`Time Sync: ${timeOK ? '✅' : '❌'}`);
  console.log(`Authentication: ${authResult ? '✅' : '❌'}`);
}

runDebugTest().catch(console.error);
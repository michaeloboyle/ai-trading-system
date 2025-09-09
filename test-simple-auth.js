#!/usr/bin/env node

// Simplest possible Binance.US authentication test
require('dotenv').config();
const https = require('https');
const crypto = require('crypto');

const apiKey = process.env.BINANCE_API_KEY;
const secretKey = process.env.BINANCE_SECRET_KEY;

if (!apiKey || !secretKey) {
  console.error('❌ Missing API keys in .env file');
  process.exit(1);
}

console.log('🔑 Testing with API key starting:', apiKey.substring(0, 8) + '...');

// Test system status endpoint (different auth method)
function testSystemStatus() {
  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}`;
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(queryString)
    .digest('hex');
    
  const path = `/api/v3/exchangeInfo?${queryString}&signature=${signature}`;
  
  const options = {
    hostname: 'api.binance.us',
    path: path,
    method: 'GET',
    headers: {
      'X-MBX-APIKEY': apiKey
    }
  };
  
  console.log('📡 Testing exchange info endpoint...');
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Response status:', res.statusCode);
      if (res.statusCode === 200) {
        const parsed = JSON.parse(data);
        console.log('✅ SUCCESS! Exchange info retrieved');
        console.log('Timezone:', parsed.timezone);
        console.log('Server time:', new Date(parsed.serverTime));
      } else {
        console.log('❌ Failed:', data);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error('❌ Request error:', e);
  });
  
  req.end();
}

// Test API key restrictions endpoint
function testApiRestrictions() {
  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}`;
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(queryString)
    .digest('hex');
    
  const path = `/sapi/v1/account/apiRestrictions?${queryString}&signature=${signature}`;
  
  const options = {
    hostname: 'api.binance.us',
    path: path,
    method: 'GET',
    headers: {
      'X-MBX-APIKEY': apiKey
    }
  };
  
  console.log('\n📡 Testing API restrictions endpoint...');
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Response status:', res.statusCode);
      if (res.statusCode === 200) {
        const parsed = JSON.parse(data);
        console.log('✅ API Key Info:', parsed);
      } else {
        console.log('❌ Failed:', data);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error('❌ Request error:', e);
  });
  
  req.end();
}

// Run tests
testSystemStatus();
setTimeout(() => testApiRestrictions(), 2000);
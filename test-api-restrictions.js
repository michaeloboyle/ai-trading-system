#!/usr/bin/env node

// Test API key restrictions to diagnose permission issues
require('dotenv').config();
const https = require('https');
const crypto = require('crypto');

const apiKey = process.env.BINANCE_API_KEY;
const secretKey = process.env.BINANCE_SECRET_KEY;

if (!apiKey || !secretKey) {
  console.error('❌ Missing API keys in .env file');
  process.exit(1);
}

console.log('🔑 API key starts with:', apiKey.substring(0, 8) + '...');

// Test API key restrictions endpoint (different auth approach)
function testApiKeyRestrictions() {
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
      'X-MBX-APIKEY': apiKey,
      'User-Agent': 'Mozilla/5.0'
    }
  };
  
  console.log('📡 Testing API restrictions endpoint...');
  console.log('Full URL:', `https://api.binance.us${path}`);
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Headers:', res.headers);
      
      if (res.statusCode === 200) {
        const parsed = JSON.parse(data);
        console.log('✅ API Key Restrictions:', JSON.stringify(parsed, null, 2));
        
        // Test a simpler endpoint after success
        setTimeout(() => testAccountStatus(), 1000);
      } else {
        console.log('❌ API restrictions failed:', data);
        
        // Try the account status endpoint with different signature
        setTimeout(() => testAccountStatus(), 1000);
      }
    });
  });
  
  req.on('error', (e) => console.error('❌ Error:', e));
  req.end();
}

// Test account status with minimal parameters
function testAccountStatus() {
  console.log('\n📡 Testing account status with minimal params...');
  
  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}`;
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(queryString)
    .digest('hex');
    
  const path = `/sapi/v1/account/status?${queryString}&signature=${signature}`;
  
  const options = {
    hostname: 'api.binance.us',
    path: path,
    method: 'GET',
    headers: {
      'X-MBX-APIKEY': apiKey,
      'User-Agent': 'Mozilla/5.0'
    }
  };
  
  console.log('Full URL:', `https://api.binance.us${path}`);
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      
      if (res.statusCode === 200) {
        const parsed = JSON.parse(data);
        console.log('✅ Account Status:', JSON.stringify(parsed, null, 2));
      } else {
        console.log('❌ Account status failed:', data);
      }
    });
  });
  
  req.on('error', (e) => console.error('❌ Error:', e));
  req.end();
}

// Start test
testApiKeyRestrictions();
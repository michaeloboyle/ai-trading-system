#!/usr/bin/env node

// Final Binance.US authentication test
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

// Test WITHOUT signature first (public endpoint)
function testPublic() {
  const options = {
    hostname: 'api.binance.us',
    path: '/api/v3/exchangeInfo',
    method: 'GET'
  };
  
  console.log('📡 Testing public endpoint (no auth)...');
  
  const req = https.request(options, (res) => {
    console.log('Status:', res.statusCode);
    if (res.statusCode === 200) {
      console.log('✅ Public endpoint works\n');
      testPrivate();
    }
  });
  
  req.on('error', (e) => console.error('❌ Error:', e));
  req.end();
}

// Test account endpoint with correct parameters
function testPrivate() {
  const timestamp = Date.now();
  const params = `timestamp=${timestamp}`;
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(params)
    .digest('hex');
    
  const path = `/api/v3/account?${params}&signature=${signature}`;
  
  const options = {
    hostname: 'api.binance.us',
    path: path,
    method: 'GET',
    headers: {
      'X-MBX-APIKEY': apiKey,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };
  
  console.log('📡 Testing account endpoint with auth...');
  console.log('Timestamp:', timestamp);
  console.log('Signature:', signature);
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      
      if (res.statusCode === 200) {
        const account = JSON.parse(data);
        console.log('✅ AUTHENTICATION SUCCESS!');
        console.log('Account type:', account.accountType);
        console.log('Can trade:', account.canTrade);
        console.log('Can deposit:', account.canDeposit);
        
        // Check balances
        const balances = account.balances.filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0);
        if (balances.length > 0) {
          console.log('\n💰 Balances:');
          balances.forEach(b => {
            const total = parseFloat(b.free) + parseFloat(b.locked);
            if (total > 0.001) {
              console.log(`${b.asset}: ${total}`);
            }
          });
        } else {
          console.log('\n⏳ No balances yet (USDC transfer pending?)');
        }
      } else {
        console.log('❌ Authentication failed:', data);
        
        // Additional debugging
        if (res.statusCode === 401) {
          console.log('\n🔍 Troubleshooting tips:');
          console.log('1. In Binance.US, click "Edit" on your API key');
          console.log('2. Make sure "Enable Reading" is checked');
          console.log('3. Make sure "Enable Spot Trading" is checked');
          console.log('4. Save the changes');
          console.log('5. Wait 1-2 minutes and try again');
        }
      }
    });
  });
  
  req.on('error', (e) => console.error('❌ Error:', e));
  req.end();
}

// Start tests
testPublic();
#!/usr/bin/env node

// Test Binance.US API with IPv4-only connection
require('dotenv').config();
const https = require('https');
const crypto = require('crypto');
const dns = require('dns');

// Force IPv4 resolution
dns.setDefaultResultOrder('ipv4first');

const apiKey = process.env.BINANCE_API_KEY;
const secretKey = process.env.BINANCE_SECRET_KEY;

console.log('🔑 Testing with IPv4-only connection...');
console.log('API key starts with:', apiKey.substring(0, 8) + '...');

// Test with IPv4-only connection
function testWithIPv4Only() {
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
    family: 4, // Force IPv4
    headers: {
      'X-MBX-APIKEY': apiKey,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };
  
  console.log('📡 Making IPv4-only request...');
  console.log('Timestamp:', timestamp);
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      
      if (res.statusCode === 200) {
        const account = JSON.parse(data);
        console.log('✅ SUCCESS with IPv4-only!');
        console.log('Account type:', account.accountType);
        console.log('Can trade:', account.canTrade);
        
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
        }
      } else {
        console.log('❌ Still failed with IPv4-only:', data);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error('❌ Error:', e);
  });
  
  req.end();
}

testWithIPv4Only();
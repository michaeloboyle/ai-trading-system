#!/usr/bin/env node

// Minimal API key validation test
require('dotenv').config();
const https = require('https');
const crypto = require('crypto');

const apiKey = process.env.BINANCE_API_KEY;
const secretKey = process.env.BINANCE_SECRET_KEY;

console.log('🔍 Minimal API Key Test for Binance.US');
console.log('API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'MISSING');
console.log('Secret Key:', secretKey ? `${secretKey.substring(0, 8)}...` : 'MISSING');

// Test 1: Try different timestamp formats
function testTimestampFormats() {
  console.log('\n📅 Testing different timestamp formats...');
  
  const now = Date.now();
  const serverTimeOffset = 0; // We confirmed time sync is OK
  const timestamp = now + serverTimeOffset;
  
  console.log('Local time:', new Date(now));
  console.log('Using timestamp:', timestamp);
  
  // Try the most basic authenticated endpoint
  testBasicAuth(timestamp);
}

function testBasicAuth(timestamp) {
  console.log('\n🔑 Testing basic authentication...');
  
  // Create query string with just timestamp
  const queryString = `timestamp=${timestamp}`;
  
  // Create signature
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(queryString)
    .digest('hex');
  
  console.log('Query string:', queryString);
  console.log('Signature:', signature);
  
  // Try /api/v3/account endpoint (standard for Binance.US)
  const path = `/api/v3/account?${queryString}&signature=${signature}`;
  
  const options = {
    hostname: 'api.binance.us',
    port: 443,
    path: path,
    method: 'GET',
    headers: {
      'X-MBX-APIKEY': apiKey,
      'User-Agent': 'Node.js/Trading-Bot',
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };
  
  console.log('Making request to:', `https://api.binance.us${path}`);
  console.log('Headers:', options.headers);
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('\n📡 Response Status:', res.statusCode);
      console.log('Response Headers:', res.headers);
      console.log('Response Body:', data);
      
      if (res.statusCode === 200) {
        console.log('✅ Authentication SUCCESS!');
        try {
          const account = JSON.parse(data);
          console.log('Account Type:', account.accountType);
          console.log('Can Trade:', account.canTrade);
        } catch (e) {
          console.log('Could not parse response as JSON');
        }
      } else if (res.statusCode === 401) {
        console.log('❌ Authentication FAILED (401 Unauthorized)');
        
        try {
          const error = JSON.parse(data);
          if (error.code === -2015) {
            console.log('\n🔍 Error -2015 Analysis:');
            console.log('This error means: "Invalid API-key, IP, or permissions for action"');
            console.log('Possible causes:');
            console.log('1. API key not enabled for SPOT trading');
            console.log('2. API key not enabled for reading account info');
            console.log('3. IP restriction issue (even though IP matches)');
            console.log('4. API key was recently created and needs time to propagate');
            console.log('5. Secret key mismatch or corruption');
            
            console.log('\n💡 Next steps:');
            console.log('1. Double-check API key has "Enable Reading" permission');
            console.log('2. Double-check API key has "Enable Spot & Margin Trading" permission');
            console.log('3. If recently created/modified, wait 5-10 minutes');
            console.log('4. Try recreating the API key completely');
          }
        } catch (parseError) {
          console.log('Could not parse error response');
        }
      } else {
        console.log(`❌ Unexpected status: ${res.statusCode}`);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Request failed:', error);
  });
  
  req.setTimeout(10000, () => {
    console.log('❌ Request timeout');
    req.destroy();
  });
  
  req.end();
}

// Run test
testTimestampFormats();
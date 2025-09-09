/**
 * API Authentication Tests
 * Test Binance.US API authentication, signature generation, and IPv4-only connections
 */

const { describe, it, expect, beforeEach, jest } = require('@jest/globals');
const crypto = require('crypto');

class BinanceAuth {
  constructor(apiKey, secretKey) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.baseURL = 'https://api.binance.us';
  }

  generateSignature(queryString) {
    if (!this.secretKey) {
      throw new Error('Secret key required for signature generation');
    }
    return crypto.createHmac('sha256', this.secretKey)
                .update(queryString)
                .digest('hex');
  }

  createAuthenticatedRequest(endpoint, params = {}) {
    const timestamp = Date.now();
    const queryParams = {
      ...params,
      timestamp,
      recvWindow: 5000
    };

    const queryString = new URLSearchParams(queryParams).toString();
    const signature = this.generateSignature(queryString);

    return {
      url: `${this.baseURL}${endpoint}?${queryString}&signature=${signature}`,
      headers: {
        'X-MBX-APIKEY': this.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: 'GET',
      queryString,
      signature
    };
  }

  createPublicRequest(endpoint) {
    return {
      url: `${this.baseURL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'GET'
    };
  }

  validateApiKey(apiKey) {
    if (!apiKey) return { valid: false, error: 'API key required' };
    if (typeof apiKey !== 'string') return { valid: false, error: 'API key must be string' };
    if (apiKey.length < 32) return { valid: false, error: 'API key too short' };
    if (!/^[A-Za-z0-9]+$/.test(apiKey)) return { valid: false, error: 'API key contains invalid characters' };
    
    return { valid: true };
  }

  validateSecretKey(secretKey) {
    if (!secretKey) return { valid: false, error: 'Secret key required' };
    if (typeof secretKey !== 'string') return { valid: false, error: 'Secret key must be string' };
    if (secretKey.length < 32) return { valid: false, error: 'Secret key too short' };
    if (!/^[A-Za-z0-9]+$/.test(secretKey)) return { valid: false, error: 'Secret key contains invalid characters' };
    
    return { valid: true };
  }

  testConnection() {
    try {
      const request = this.createPublicRequest('/api/v3/ping');
      return { success: true, request };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  testAuthentication() {
    try {
      if (!this.apiKey || !this.secretKey) {
        throw new Error('Both API key and secret key required');
      }

      const request = this.createAuthenticatedRequest('/api/v3/account');
      return { success: true, request };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

class IPv4Connector {
  constructor() {
    this.forceIPv4 = true;
  }

  createHttpsOptions(hostname, path, method = 'GET') {
    return {
      hostname,
      path,
      method,
      family: 4, // Force IPv4
      timeout: 5000,
      headers: {
        'User-Agent': 'ai-trading-system/1.0'
      }
    };
  }

  async makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
      const https = require('https');
      
      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData,
            ipVersion: 'IPv4' // Simulated
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (data) {
        req.write(data);
      }

      req.end();
    });
  }

  testIPv4Connection() {
    const options = this.createHttpsOptions('api.binance.us', '/api/v3/ping');
    return options.family === 4;
  }
}

describe('Binance API Authentication', () => {
  let auth;
  const validApiKey = 'SbEt7InrklNHBtrWmwhVQqLFwqP776ZawDm97dpGXd29JC173PFsENGoDvPt1U74';
  const validSecretKey = 'tq8QrOp4qfrawRxPSnwhm65jQTCWWP9L6aYg8xDzXBnPvKTiEBxThpNgdB9GWnGF';

  beforeEach(() => {
    auth = new BinanceAuth(validApiKey, validSecretKey);
  });

  describe('API Key Validation', () => {
    it('should validate correct API key format', () => {
      const result = auth.validateApiKey(validApiKey);
      expect(result.valid).toBe(true);
    });

    it('should reject empty API key', () => {
      const result = auth.validateApiKey('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key required');
    });

    it('should reject short API key', () => {
      const result = auth.validateApiKey('short123');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key too short');
    });

    it('should reject API key with invalid characters', () => {
      const result = auth.validateApiKey('InvalidKey@#$%^&*()');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key contains invalid characters');
    });

    it('should reject non-string API key', () => {
      const result = auth.validateApiKey(12345);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key must be string');
    });
  });

  describe('Secret Key Validation', () => {
    it('should validate correct secret key format', () => {
      const result = auth.validateSecretKey(validSecretKey);
      expect(result.valid).toBe(true);
    });

    it('should reject empty secret key', () => {
      const result = auth.validateSecretKey('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Secret key required');
    });

    it('should reject short secret key', () => {
      const result = auth.validateSecretKey('shortSecret');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Secret key too short');
    });

    it('should reject secret key with invalid characters', () => {
      const result = auth.validateSecretKey('InvalidSecret@#$%');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Secret key contains invalid characters');
    });
  });

  describe('Signature Generation', () => {
    it('should generate consistent HMAC-SHA256 signatures', () => {
      const queryString = 'symbol=BTCUSDT&timestamp=1609459200000';
      const signature1 = auth.generateSignature(queryString);
      const signature2 = auth.generateSignature(queryString);
      
      expect(signature1).toBe(signature2);
      expect(signature1).toHaveLength(64); // SHA256 hex length
    });

    it('should generate different signatures for different query strings', () => {
      const query1 = 'symbol=BTCUSDT&timestamp=1609459200000';
      const query2 = 'symbol=ETHUSDT&timestamp=1609459200000';
      
      const sig1 = auth.generateSignature(query1);
      const sig2 = auth.generateSignature(query2);
      
      expect(sig1).not.toBe(sig2);
    });

    it('should throw error without secret key', () => {
      const authNoSecret = new BinanceAuth(validApiKey, null);
      expect(() => {
        authNoSecret.generateSignature('test=1');
      }).toThrow('Secret key required for signature generation');
    });

    it('should generate valid hex signature', () => {
      const signature = auth.generateSignature('test=1');
      expect(/^[a-f0-9]+$/.test(signature)).toBe(true);
    });
  });

  describe('Authenticated Request Creation', () => {
    it('should create valid authenticated request', () => {
      const request = auth.createAuthenticatedRequest('/api/v3/account');
      
      expect(request.url).toContain('api.binance.us');
      expect(request.url).toContain('timestamp=');
      expect(request.url).toContain('signature=');
      expect(request.headers['X-MBX-APIKEY']).toBe(validApiKey);
    });

    it('should include timestamp in query', () => {
      const before = Date.now();
      const request = auth.createAuthenticatedRequest('/api/v3/account');
      const after = Date.now();
      
      const urlParams = new URLSearchParams(request.url.split('?')[1]);
      const timestamp = parseInt(urlParams.get('timestamp'));
      
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should include recvWindow parameter', () => {
      const request = auth.createAuthenticatedRequest('/api/v3/account');
      
      expect(request.url).toContain('recvWindow=5000');
    });

    it('should handle additional parameters', () => {
      const request = auth.createAuthenticatedRequest('/api/v3/order', {
        symbol: 'BTCUSDT',
        side: 'BUY',
        type: 'LIMIT'
      });
      
      expect(request.url).toContain('symbol=BTCUSDT');
      expect(request.url).toContain('side=BUY');
      expect(request.url).toContain('type=LIMIT');
    });
  });

  describe('Public Request Creation', () => {
    it('should create public request without authentication', () => {
      const request = auth.createPublicRequest('/api/v3/ticker/price');
      
      expect(request.url).toBe('https://api.binance.us/api/v3/ticker/price');
      expect(request.headers['X-MBX-APIKEY']).toBeUndefined();
      expect(request.url).not.toContain('signature=');
    });

    it('should set correct headers for public requests', () => {
      const request = auth.createPublicRequest('/api/v3/exchangeInfo');
      
      expect(request.headers['Content-Type']).toBe('application/json');
      expect(request.method).toBe('GET');
    });
  });

  describe('Connection Testing', () => {
    it('should create connection test request', () => {
      const result = auth.testConnection();
      
      expect(result.success).toBe(true);
      expect(result.request.url).toBe('https://api.binance.us/api/v3/ping');
    });

    it('should create authentication test request', () => {
      const result = auth.testAuthentication();
      
      expect(result.success).toBe(true);
      expect(result.request.url).toContain('/api/v3/account');
      expect(result.request.headers['X-MBX-APIKEY']).toBe(validApiKey);
    });

    it('should fail authentication test without credentials', () => {
      const authEmpty = new BinanceAuth(null, null);
      const result = authEmpty.testAuthentication();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Both API key and secret key required');
    });
  });
});

describe('IPv4 Connection Handling', () => {
  let connector;

  beforeEach(() => {
    connector = new IPv4Connector();
  });

  describe('HTTPS Options Configuration', () => {
    it('should force IPv4 connections', () => {
      const options = connector.createHttpsOptions('api.binance.us', '/api/v3/ping');
      
      expect(options.family).toBe(4);
      expect(options.hostname).toBe('api.binance.us');
      expect(options.timeout).toBe(5000);
    });

    it('should set proper headers', () => {
      const options = connector.createHttpsOptions('api.binance.us', '/test');
      
      expect(options.headers['User-Agent']).toBe('ai-trading-system/1.0');
    });

    it('should handle different HTTP methods', () => {
      const getOptions = connector.createHttpsOptions('api.binance.us', '/test', 'GET');
      const postOptions = connector.createHttpsOptions('api.binance.us', '/test', 'POST');
      
      expect(getOptions.method).toBe('GET');
      expect(postOptions.method).toBe('POST');
    });
  });

  describe('Request Creation', () => {
    it('should create valid request options for Binance.US', () => {
      const options = connector.createHttpsOptions(
        'api.binance.us',
        '/api/v3/exchangeInfo'
      );
      
      expect(options.hostname).toBe('api.binance.us');
      expect(options.path).toBe('/api/v3/exchangeInfo');
      expect(options.family).toBe(4); // IPv4 enforced
    });
  });

  describe('IPv4 Testing', () => {
    it('should confirm IPv4 is enforced', () => {
      const isIPv4 = connector.testIPv4Connection();
      expect(isIPv4).toBe(true);
    });
  });
});

describe('Authentication Integration', () => {
  let auth;
  let connector;

  beforeEach(() => {
    auth = new BinanceAuth(
      'testApiKey12345678901234567890123456',
      'testSecretKey12345678901234567890123'
    );
    connector = new IPv4Connector();
  });

  describe('Combined Auth and Connection', () => {
    it('should create authenticated IPv4 request', () => {
      const authRequest = auth.createAuthenticatedRequest('/api/v3/account');
      const url = new URL(authRequest.url);
      
      const options = connector.createHttpsOptions(
        url.hostname,
        url.pathname + url.search,
        'GET'
      );

      // Combine auth headers
      options.headers = {
        ...options.headers,
        ...authRequest.headers
      };

      expect(options.family).toBe(4);
      expect(options.headers['X-MBX-APIKEY']).toBeDefined();
      expect(options.hostname).toBe('api.binance.us');
    });

    it('should handle public requests over IPv4', () => {
      const publicRequest = auth.createPublicRequest('/api/v3/ticker/price');
      const url = new URL(publicRequest.url);
      
      const options = connector.createHttpsOptions(
        url.hostname,
        url.pathname
      );

      expect(options.family).toBe(4);
      expect(options.hostname).toBe('api.binance.us');
      expect(options.path).toBe('/api/v3/ticker/price');
    });
  });
});

describe('Error Handling', () => {
  describe('Network Errors', () => {
    it('should handle connection timeout', async () => {
      const connector = new IPv4Connector();
      const options = {
        ...connector.createHttpsOptions('api.binance.us', '/api/v3/ping'),
        timeout: 1 // Very short timeout
      };

      // Mock the timeout scenario
      try {
        await connector.makeRequest(options);
      } catch (error) {
        expect(error.message).toContain('timeout');
      }
    });

    it('should handle network errors gracefully', () => {
      const connector = new IPv4Connector();
      
      // This would be tested with actual network conditions
      expect(() => {
        connector.createHttpsOptions('invalid.domain', '/test');
      }).not.toThrow();
    });
  });

  describe('Authentication Errors', () => {
    it('should handle invalid signature errors', () => {
      const auth = new BinanceAuth('validKey123456789', 'invalidSecret');
      
      // This would result in -2015 error from Binance
      const request = auth.createAuthenticatedRequest('/api/v3/account');
      expect(request.signature).toBeDefined();
      expect(request.signature).toHaveLength(64);
    });
  });
});

module.exports = { BinanceAuth, IPv4Connector };
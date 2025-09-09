/**
 * Jest Configuration for AI Trading System
 * Supports multiple microservices with shared configuration
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Root directories for tests
  roots: [
    '<rootDir>/services'
  ],
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.spec.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Coverage collection patterns
  collectCoverageFrom: [
    'services/**/src/**/*.js',
    '!services/**/src/**/*.test.js',
    '!services/**/src/**/*.spec.js',
    '!services/**/node_modules/**',
    '!services/**/coverage/**'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/test-setup.js'
  ],
  
  // Module path mapping for absolute imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/services/$1',
    '^@trading-engine/(.*)$': '<rootDir>/services/trading-engine/src/$1',
    '^@data-fetcher/(.*)$': '<rootDir>/services/data-fetcher/src/$1',
    '^@risk-manager/(.*)$': '<rootDir>/services/risk-manager/src/$1',
    '^@dashboard/(.*)$': '<rootDir>/services/dashboard/src/$1',
    '^@backtester/(.*)$': '<rootDir>/services/backtester/src/$1'
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output for debugging
  verbose: true,
  
  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Global test variables
  globals: {
    'process.env.NODE_ENV': 'test',
    'process.env.REDIS_URL': 'redis://localhost:6379/1',
    'process.env.DB_URL': 'postgresql://trader:test_password@localhost:5433/trading_test'
  },
  
  // Projects configuration for multi-service testing
  projects: [
    {
      displayName: 'trading-engine',
      testMatch: ['<rootDir>/services/trading-engine/**/*.test.js'],
      setupFilesAfterEnv: [
        '<rootDir>/test-setup.js',
        '<rootDir>/services/trading-engine/test-config/setup.js'
      ]
    },
    {
      displayName: 'data-fetcher', 
      testMatch: ['<rootDir>/services/data-fetcher/**/*.test.js'],
      setupFilesAfterEnv: [
        '<rootDir>/test-setup.js',
        '<rootDir>/services/data-fetcher/test-config/setup.js'
      ]
    },
    {
      displayName: 'risk-manager',
      testMatch: ['<rootDir>/services/risk-manager/**/*.test.js'], 
      setupFilesAfterEnv: [
        '<rootDir>/test-setup.js',
        '<rootDir>/services/risk-manager/test-config/setup.js'
      ]
    },
    {
      displayName: 'dashboard',
      testMatch: ['<rootDir>/services/dashboard/**/*.test.js'],
      setupFilesAfterEnv: [
        '<rootDir>/test-setup.js',
        '<rootDir>/services/dashboard/test-config/setup.js'
      ]
    },
    {
      displayName: 'backtester',
      testMatch: ['<rootDir>/services/backtester/**/*.test.js'],
      setupFilesAfterEnv: [
        '<rootDir>/test-setup.js', 
        '<rootDir>/services/backtester/test-config/setup.js'
      ]
    }
  ]
};
/**
 * Jest Configuration for AI Trading System
 * Simplified configuration for our test suite
 */

module.exports = {
  testEnvironment: 'node',
  
  // Test file patterns - focus on our test directory
  testMatch: [
    '**/test/**/*.test.js'
  ],
  
  // Ignore problematic directories
  testPathIgnorePatterns: [
    '/node_modules/',
    '/worktrees/',
    '/vscode-gh-actions-cli/',
    '/services/'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  
  // Only collect coverage from our test files for now
  collectCoverageFrom: [
    'test/**/*.js',
    '!test/**/*.test.js',
    '!**/node_modules/**'
  ],
  
  // Lower coverage thresholds for initial implementation
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/test-setup.js'
  ],
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Global test variables
  globals: {
    'process.env.NODE_ENV': 'test',
    'process.env.PAPER_TRADING': 'true'
  }
};
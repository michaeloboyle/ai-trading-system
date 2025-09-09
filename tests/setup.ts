/**
 * Jest test setup for TDD development
 */

// Extend Jest matchers
import 'jest';

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveLength: {
        greaterThan(expected: number): R;
      };
    }
  }
}

// Custom matcher for array length comparisons
expect.extend({
  toHaveLength: {
    greaterThan(received: any[], expected: number) {
      const pass = Array.isArray(received) && received.length > expected;
      return {
        message: () => 
          `expected array to have length greater than ${expected}, but got ${received?.length || 'not an array'}`,
        pass,
      };
    }
  }
});

// Mock environment variables for testing
process.env.BINANCE_API_KEY = 'test_api_key';
process.env.BINANCE_SECRET_KEY = 'test_secret_key';
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(30000);
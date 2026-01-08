/**
 * Test setup file for vitest
 * Sets up environment variables and mocks for testing
 */

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.CLERK_PUBLISHABLE_KEY = 'pk_test_123456789abcdef';
process.env.CLERK_SECRET_KEY = 'sk_test_123456789abcdef';

// Mock crypto.randomUUID for consistent testing
if (!globalThis.crypto) {
  globalThis.crypto = {
    randomUUID: () => 'test-uuid-123',
  } as any;
}
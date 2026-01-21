// import { vi } from 'vitest'; // Commented out for now - will be used when testing is implemented
import type { Context } from 'hono';

/**
 * Mock authentication helpers for testing
 * TODO: Uncomment and implement when testing framework is set up
 */

// Mock user context for testing
export const mockUser = {
  userId: 'test-user-123',
  firstName: 'Test',
  lastName: 'User',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
  primaryEmailAddressId: 'email-123',
};

// Mock the clerk middleware functions
export const mockClerkMiddleware = () => {
  // Mock requireAuth middleware - just pass through
  const requireAuth = async (c: Context, next: () => Promise<void>) => {
    // Set mock user context
    c.set('user', mockUser);
    await next();
  };

  // Mock getUserContext - return mock user
  const getUserContext = () => mockUser;

  // Mock requireUserContext - return mock user
  const requireUserContext = () => mockUser;

  return {
    requireAuth,
    getUserContext,
    requireUserContext,
  };
};

/**
 * Setup mock authentication for testing
 * TODO: Uncomment when testing framework is set up
 */
export const setupMockAuth = () => {
  // vi.doMock('../middleware/clerk', () => mockClerkMiddleware());
  // vi.resetModules();
  console.log('Mock auth setup (placeholder)');
};

/**
 * Reset authentication mocks
 * TODO: Uncomment when testing framework is set up
 */
export const resetMockAuth = () => {
  // vi.doUnmock('../middleware/clerk');
  // vi.resetModules();
  console.log('Mock auth reset (placeholder)');
};

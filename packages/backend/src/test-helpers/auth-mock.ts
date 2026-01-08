import { vi } from 'vitest';
import type { Context } from 'hono';

/**
 * Mock authentication helpers for testing
 */

// Mock user context for testing
export const mockUser = {
  userId: 'test-user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  imageUrl: 'https://example.com/avatar.jpg',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
  primaryEmailAddressId: 'email-123',
};

// Mock the clerk middleware functions
export const mockClerkMiddleware = () => {
  // Mock requireAuth middleware - just pass through
  const requireAuth = vi.fn().mockImplementation(async (c: Context, next: () => Promise<void>) => {
    // Set mock user context
    c.set('user', mockUser);
    await next();
  });

  // Mock getUserContext - return mock user
  const getUserContext = vi.fn().mockReturnValue(mockUser);

  // Mock requireUserContext - return mock user
  const requireUserContext = vi.fn().mockReturnValue(mockUser);

  return {
    requireAuth,
    getUserContext,
    requireUserContext,
  };
};

// Helper to create a test app with mocked authentication
export const createTestAppWithAuth = async () => {
  const { Hono } = await import('hono');
  
  // Mock the clerk middleware module before importing API routes
  vi.doMock('../middleware/clerk', () => mockClerkMiddleware());
  
  // Clear module cache to ensure fresh import
  vi.resetModules();
  
  // Import API routes after mocking
  const { default: api } = await import('../routes/api');
  
  const app = new Hono();
  app.route('/api', api);
  
  return app;
};

// Helper to create a test app without authentication (for testing 401 responses)
export const createTestAppWithoutAuth = async () => {
  const { Hono } = await import('hono');
  
  // Don't mock the clerk middleware - use real implementation
  vi.doUnmock('../middleware/clerk');
  vi.resetModules();
  
  const { default: api } = await import('../routes/api');
  
  const app = new Hono();
  app.route('/api', api);
  
  return app;
};
/**
 * Test utilities for authentication testing
 */

import type { UserContext } from '@clever/shared';

/**
 * Mock user context for testing
 */
export const mockUserContext: UserContext = {
  userId: 'test-user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  userType: 'User',
  sessionId: 'test-session-123',
  isAuthenticated: true,
};

/**
 * Mock admin user context for testing
 */
export const mockAdminContext: UserContext = {
  userId: 'test-admin-123',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  userType: 'Admin',
  sessionId: 'test-admin-session-123',
  isAuthenticated: true,
};

/**
 * Create a mock Hono context with authenticated user
 */
export function createMockAuthContext(user: UserContext = mockUserContext) {
  return {
    get: (key: string) => {
      if (key === 'user') return user;
      return undefined;
    },
    set: () => {},
    env: {
      CLERK_PUBLISHABLE_KEY: 'pk_test_123456789abcdef',
      CLERK_SECRET_KEY: 'sk_test_123456789abcdef',
    },
  };
}

/**
 * Mock JWT token for testing (not a real JWT, just for test purposes)
 */
export const mockJwtToken = 'Bearer test-jwt-token-123';

/**
 * Create mock request headers with authentication
 */
export function createAuthHeaders(token: string = mockJwtToken) {
  return {
    'Authorization': token,
    'Content-Type': 'application/json',
  };
}
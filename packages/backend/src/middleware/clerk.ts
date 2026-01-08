/**
 * Clerk authentication middleware for JWT verification
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { clerkMiddleware, getAuth } from '@hono/clerk-auth';
import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';
import type { UserContext, ApiResponse, UserType } from '@clever/shared';

/**
 * Clerk JWT verification middleware
 * Validates authentication tokens and extracts user information
 * Requirements: 3.1
 */
export const clerkAuth = clerkMiddleware();

/**
 * User context extraction middleware
 * Creates UserContext from authenticated Clerk user
 * Requirements: 3.2, 3.4, 2.2
 */
export const extractUserContext = createMiddleware(async (c, next) => {
  const auth = getAuth(c);
  
  // Check if user is authenticated
  // Requirements: 3.3 - Return 401 for invalid/missing tokens
  if (!auth?.userId) {
    const response: ApiResponse = {
      success: false,
      error: 'Authentication required. Please sign in to access this resource.',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 401);
  }

  try {
    // Extract user information from Clerk auth object
    // Requirements: 3.2, 3.4 - Create complete UserContext
    // Requirements: 2.2 - Extract user type from Clerk metadata
    const userContext: UserContext = {
      userId: auth.userId,
      email: (auth as any).claims?.email || '',
      firstName: (auth as any).claims?.given_name || '',
      lastName: (auth as any).claims?.family_name || '',
      userType: ((auth as any).claims?.metadata?.userType as 'Admin' | 'User') || 'User',
      sessionId: auth.sessionId || '',
      isAuthenticated: true,
    };

    // Make user context available to route handlers
    // Requirements: 3.5
    c.set('user', userContext);
    
    await next();
  } catch (error) {
    console.error('Error extracting user context:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Authentication failed. Invalid or expired token.',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 401);
  }
});

/**
 * Combined authentication middleware
 * Applies both Clerk JWT verification and user context extraction
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export const requireAuth = createMiddleware(async (c, next) => {
  try {
    // First apply Clerk JWT verification
    await clerkAuth(c, async () => {
      // Then extract user context
      await extractUserContext(c, next);
    });
  } catch (error) {
    console.error('Authentication middleware error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Authentication failed. Please sign in and try again.',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 401);
  }
});

/**
 * Helper function to get user context from Hono context
 * Requirements: 3.5
 */
export function getUserContext(c: Context): UserContext | null {
  return c.get('user') || null;
}

/**
 * Helper function to check if user is authenticated
 * Requirements: 3.1
 */
export function isAuthenticated(c: Context): boolean {
  const user = getUserContext(c);
  return user?.isAuthenticated || false;
}

/**
 * Helper function to check if user is admin
 * Requirements: 2.1, 2.2
 */
export function isAdmin(c: Context): boolean {
  const user = getUserContext(c);
  return user?.userType === 'Admin' || false;
}

/**
 * Helper function to require authenticated user context
 * Throws error if user is not authenticated
 * Requirements: 3.5
 */
export function requireUserContext(c: Context): UserContext {
  const user = getUserContext(c);
  if (!user || !user.isAuthenticated) {
    throw new Error('User context not available - authentication required');
  }
  return user;
}

/**
 * Helper function to get user type from context
 * Requirements: 2.4
 */
export function getUserType(c: Context): UserType | null {
  const user = getUserContext(c);
  return user?.userType || null;
}

/**
 * Helper function to check if user has specific type
 * Requirements: 2.1, 2.2, 2.4
 */
export function hasUserType(c: Context, requiredType: UserType): boolean {
  const user = getUserContext(c);
  return user?.userType === requiredType || false;
}

/**
 * Helper function to require admin user
 * Throws error if user is not admin
 * Requirements: 2.1, 2.2
 */
export function requireAdmin(c: Context): UserContext {
  const user = requireUserContext(c);
  if (user.userType !== 'Admin') {
    throw new Error('Admin access required');
  }
  return user;
}

/**
 * Middleware to require admin access
 * Requirements: 2.1, 2.2
 */
export const requireAdminAccess = createMiddleware(async (c, next) => {
  try {
    requireAdmin(c);
    await next();
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Admin access required. Insufficient permissions.',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 403);
  }
});
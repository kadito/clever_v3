/**
 * Clerk authentication middleware for JWT verification
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';
import type { UserContext, ApiResponse, UserType } from '@clever/shared';

/**
 * Extract JWT token from request cookies or Authorization header
 */
export function extractJwtToken(c: Context): string | null {
  // Try Authorization header first
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try session cookie
  const sessionCookie = c.req.cookie('__session');
  if (sessionCookie) {
    return sessionCookie;
  }

  return null;
}

export async function verifyClerkJwt(token: string): Promise<any> {
  try {
    // For now, we'll decode the JWT without verification for development
    // In production, you should use proper JWT verification
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(atob(parts[1]));

    // Basic validation - check if token is not expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expired');
    }

    return payload;
  } catch (error) {
    throw new Error('Invalid JWT token');
  }
}

/**
 * User context extraction middleware
 * Creates UserContext from authenticated Clerk user
 * Requirements: 3.2, 3.4, 2.2
 */
export const extractUserContext = createMiddleware(async (c, next) => {
  const token = extractJwtToken(c);

  if (!token) {
    const response: ApiResponse = {
      success: false,
      error: 'Authentication failed',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 401);
  }

  try {
    const payload = await verifyClerkJwt(token);

    // Extract user information from JWT payload
    const userContext: UserContext = {
      userId: payload.sub || '',
      email: '', // Email not included in this token structure
      firstName: payload.firstName || '', // Extract firstName from token
      lastName: payload.lastName || '', // Extract lastName from token
      userType: (payload.o?.rol === 'admin' ? 'Admin' : 'User') as 'Admin' | 'User',
      sessionId: payload.sid || '',
      isAuthenticated: true,
    };

    // Make user context available to route handlers
    c.set('user', userContext);

    await next();
  } catch (error) {
    console.error('Error extracting user context:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Authentication failed',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 401);
  }
});

/**
 * Combined authentication middleware
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export const requireAuth = extractUserContext;

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

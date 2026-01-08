/**
 * Tests for Clerk authentication middleware
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 2.1, 2.2, 2.4
 */

import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import { 
  getUserContext, 
  isAuthenticated, 
  isAdmin, 
  requireUserContext,
  getUserType,
  hasUserType,
  requireAdmin,
  requireAdminAccess
} from './clerk';
import { mockUserContext, mockAdminContext, createMockAuthContext } from '../test-utils/auth';

describe('Clerk Authentication Middleware', () => {
  describe('getUserContext', () => {
    it('should return user context when available', () => {
      const mockContext = createMockAuthContext(mockUserContext);
      const result = getUserContext(mockContext as any);
      
      expect(result).toEqual(mockUserContext);
    });

    it('should return null when user context is not available', () => {
      const mockContext = {
        get: () => null,
      };
      const result = getUserContext(mockContext as any);
      
      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true for authenticated user', () => {
      const mockContext = createMockAuthContext(mockUserContext);
      const result = isAuthenticated(mockContext as any);
      
      expect(result).toBe(true);
    });

    it('should return false when user context is not available', () => {
      const mockContext = {
        get: () => null,
      };
      const result = isAuthenticated(mockContext as any);
      
      expect(result).toBe(false);
    });

    it('should return false when user is not authenticated', () => {
      const unauthenticatedUser = { ...mockUserContext, isAuthenticated: false };
      const mockContext = createMockAuthContext(unauthenticatedUser);
      const result = isAuthenticated(mockContext as any);
      
      expect(result).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', () => {
      const mockContext = createMockAuthContext(mockAdminContext);
      const result = isAdmin(mockContext as any);
      
      expect(result).toBe(true);
    });

    it('should return false for regular user', () => {
      const mockContext = createMockAuthContext(mockUserContext);
      const result = isAdmin(mockContext as any);
      
      expect(result).toBe(false);
    });

    it('should return false when user context is not available', () => {
      const mockContext = {
        get: () => null,
      };
      const result = isAdmin(mockContext as any);
      
      expect(result).toBe(false);
    });
  });

  describe('requireUserContext', () => {
    it('should return user context for authenticated user', () => {
      const mockContext = createMockAuthContext(mockUserContext);
      const result = requireUserContext(mockContext as any);
      
      expect(result).toEqual(mockUserContext);
    });

    it('should throw error when user context is not available', () => {
      const mockContext = {
        get: () => null,
      };
      
      expect(() => requireUserContext(mockContext as any)).toThrow(
        'User context not available - authentication required'
      );
    });

    it('should throw error when user is not authenticated', () => {
      const unauthenticatedUser = { ...mockUserContext, isAuthenticated: false };
      const mockContext = createMockAuthContext(unauthenticatedUser);
      
      expect(() => requireUserContext(mockContext as any)).toThrow(
        'User context not available - authentication required'
      );
    });
  });

  describe('getUserType', () => {
    it('should return user type for authenticated user', () => {
      const mockContext = createMockAuthContext(mockUserContext);
      const result = getUserType(mockContext as any);
      
      expect(result).toBe('User');
    });

    it('should return admin type for admin user', () => {
      const mockContext = createMockAuthContext(mockAdminContext);
      const result = getUserType(mockContext as any);
      
      expect(result).toBe('Admin');
    });

    it('should return null when user context is not available', () => {
      const mockContext = {
        get: () => null,
      };
      const result = getUserType(mockContext as any);
      
      expect(result).toBeNull();
    });
  });

  describe('hasUserType', () => {
    it('should return true when user has required type', () => {
      const mockContext = createMockAuthContext(mockUserContext);
      const result = hasUserType(mockContext as any, 'User');
      
      expect(result).toBe(true);
    });

    it('should return false when user does not have required type', () => {
      const mockContext = createMockAuthContext(mockUserContext);
      const result = hasUserType(mockContext as any, 'Admin');
      
      expect(result).toBe(false);
    });

    it('should return false when user context is not available', () => {
      const mockContext = {
        get: () => null,
      };
      const result = hasUserType(mockContext as any, 'Admin');
      
      expect(result).toBe(false);
    });
  });

  describe('requireAdmin', () => {
    it('should return user context for admin user', () => {
      const mockContext = createMockAuthContext(mockAdminContext);
      const result = requireAdmin(mockContext as any);
      
      expect(result).toEqual(mockAdminContext);
    });

    it('should throw error for regular user', () => {
      const mockContext = createMockAuthContext(mockUserContext);
      
      expect(() => requireAdmin(mockContext as any)).toThrow(
        'Admin access required'
      );
    });

    it('should throw error when user context is not available', () => {
      const mockContext = {
        get: () => null,
      };
      
      expect(() => requireAdmin(mockContext as any)).toThrow(
        'User context not available - authentication required'
      );
    });
  });

  describe('requireAdminAccess middleware', () => {
    it('should allow access for admin user', async () => {
      const app = new Hono();
      const mockContext = createMockAuthContext(mockAdminContext);
      
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
        return Promise.resolve();
      };

      // Mock the context methods
      Object.assign(mockContext, {
        json: vi.fn(),
      });

      await requireAdminAccess(mockContext as any, next);
      
      expect(nextCalled).toBe(true);
      expect(mockContext.json).not.toHaveBeenCalled();
    });

    it('should deny access for regular user', async () => {
      const app = new Hono();
      const mockContext = createMockAuthContext(mockUserContext);
      
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
        return Promise.resolve();
      };

      const jsonSpy = vi.fn();
      Object.assign(mockContext, {
        json: jsonSpy,
      });

      await requireAdminAccess(mockContext as any, next);
      
      expect(nextCalled).toBe(false);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Admin access required. Insufficient permissions.',
        }),
        403
      );
    });
  });
});
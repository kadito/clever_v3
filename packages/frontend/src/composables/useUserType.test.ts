import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import type { UserContext } from '@clever/shared';
import { useUserType } from './useUserType';

// Mock the useAuth composable
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from './useAuth';

describe('useUserType', () => {
  const mockUseAuth = useAuth as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('with admin user', () => {
    beforeEach(() => {
      const adminUser: UserContext = {
        userId: 'admin-123',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        userType: 'Admin',
        sessionId: 'session-123',
        isAuthenticated: true,
      };

      mockUseAuth.mockReturnValue({
        user: ref(adminUser),
      });
    });

    it('should return correct user type', () => {
      const { userType } = useUserType();
      expect(userType.value).toBe('Admin');
    });

    it('should return correct display name in Portuguese', () => {
      const { userTypeDisplayName } = useUserType();
      expect(userTypeDisplayName.value).toBe('Administrador');
    });

    it('should identify admin user correctly', () => {
      const { isAdmin, isUser } = useUserType();
      expect(isAdmin.value).toBe(true);
      expect(isUser.value).toBe(false);
    });

    it('should allow admin features access', () => {
      const { canAccessAdminFeatures } = useUserType();
      expect(canAccessAdminFeatures.value).toBe(true);
    });

    it('should correctly check user type', () => {
      const { hasUserType } = useUserType();
      expect(hasUserType('Admin')).toBe(true);
      expect(hasUserType('User')).toBe(false);
    });
  });

  describe('with regular user', () => {
    beforeEach(() => {
      const regularUser: UserContext = {
        userId: 'user-123',
        email: 'user@example.com',
        firstName: 'Regular',
        lastName: 'User',
        userType: 'User',
        sessionId: 'session-123',
        isAuthenticated: true,
      };

      mockUseAuth.mockReturnValue({
        user: ref(regularUser),
      });
    });

    it('should return correct user type', () => {
      const { userType } = useUserType();
      expect(userType.value).toBe('User');
    });

    it('should return correct display name in Portuguese', () => {
      const { userTypeDisplayName } = useUserType();
      expect(userTypeDisplayName.value).toBe('Utilizador');
    });

    it('should identify regular user correctly', () => {
      const { isAdmin, isUser } = useUserType();
      expect(isAdmin.value).toBe(false);
      expect(isUser.value).toBe(true);
    });

    it('should not allow admin features access', () => {
      const { canAccessAdminFeatures } = useUserType();
      expect(canAccessAdminFeatures.value).toBe(false);
    });

    it('should correctly check user type', () => {
      const { hasUserType } = useUserType();
      expect(hasUserType('Admin')).toBe(false);
      expect(hasUserType('User')).toBe(true);
    });
  });

  describe('with no user', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: ref(null),
      });
    });

    it('should return null user type', () => {
      const { userType } = useUserType();
      expect(userType.value).toBeNull();
    });

    it('should return empty display name', () => {
      const { userTypeDisplayName } = useUserType();
      expect(userTypeDisplayName.value).toBe('');
    });

    it('should not identify as any user type', () => {
      const { isAdmin, isUser } = useUserType();
      expect(isAdmin.value).toBe(false);
      expect(isUser.value).toBe(false);
    });

    it('should not allow admin features access', () => {
      const { canAccessAdminFeatures } = useUserType();
      expect(canAccessAdminFeatures.value).toBe(false);
    });

    it('should return false for any user type check', () => {
      const { hasUserType } = useUserType();
      expect(hasUserType('Admin')).toBe(false);
      expect(hasUserType('User')).toBe(false);
    });
  });
});
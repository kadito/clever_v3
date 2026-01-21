import { describe, it, expect } from 'vitest';
import {
  getUserTypeDisplayName,
  isAdminUserType,
  isRegularUserType,
  getAllUserTypes,
  getUserTypeOptions,
} from './user-type-utils';
import type { UserType } from './types';

describe('User Type Utilities', () => {
  describe('getUserTypeDisplayName', () => {
    it('should return correct Portuguese display name for Admin', () => {
      const result = getUserTypeDisplayName('Admin');
      expect(result).toBe('Administrador');
    });

    it('should return correct Portuguese display name for User', () => {
      const result = getUserTypeDisplayName('User');
      expect(result).toBe('Utilizador');
    });
  });

  describe('isAdminUserType', () => {
    it('should return true for Admin user type', () => {
      const result = isAdminUserType('Admin');
      expect(result).toBe(true);
    });

    it('should return false for User user type', () => {
      const result = isAdminUserType('User');
      expect(result).toBe(false);
    });
  });

  describe('isRegularUserType', () => {
    it('should return true for User user type', () => {
      const result = isRegularUserType('User');
      expect(result).toBe(true);
    });

    it('should return false for Admin user type', () => {
      const result = isRegularUserType('Admin');
      expect(result).toBe(false);
    });
  });

  describe('getAllUserTypes', () => {
    it('should return all available user types', () => {
      const result = getAllUserTypes();
      expect(result).toEqual(['Admin', 'User']);
      expect(result).toHaveLength(2);
    });

    it('should return array with correct types', () => {
      const result = getAllUserTypes();
      result.forEach(type => {
        expect(['Admin', 'User']).toContain(type);
      });
    });
  });

  describe('getUserTypeOptions', () => {
    it('should return options with correct structure', () => {
      const result = getUserTypeOptions();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('value');
      expect(result[0]).toHaveProperty('label');
      expect(result[1]).toHaveProperty('value');
      expect(result[1]).toHaveProperty('label');
    });

    it('should return Admin option with correct Portuguese label', () => {
      const result = getUserTypeOptions();
      const adminOption = result.find(option => option.value === 'Admin');

      expect(adminOption).toBeDefined();
      expect(adminOption?.label).toBe('Administrador');
    });

    it('should return User option with correct Portuguese label', () => {
      const result = getUserTypeOptions();
      const userOption = result.find(option => option.value === 'User');

      expect(userOption).toBeDefined();
      expect(userOption?.label).toBe('Utilizador');
    });

    it('should return options for all user types', () => {
      const result = getUserTypeOptions();
      const values = result.map(option => option.value);

      expect(values).toContain('Admin');
      expect(values).toContain('User');
    });
  });

  describe('Type safety', () => {
    it('should work with UserType type', () => {
      const adminType: UserType = 'Admin';
      const userType: UserType = 'User';

      expect(getUserTypeDisplayName(adminType)).toBe('Administrador');
      expect(getUserTypeDisplayName(userType)).toBe('Utilizador');
      expect(isAdminUserType(adminType)).toBe(true);
      expect(isRegularUserType(userType)).toBe(true);
    });
  });
});

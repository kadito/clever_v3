import { describe, it, expect } from 'vitest';
import {
  isRelationError,
  isResolvedRelation,
  getResolvedRelation,
  getRelationError,
  hasResolvedRelations,
  hasRelationErrors,
  getResolvedRelations,
  getRelationErrors,
  getRelationSummary
} from './relation-type-guards.js';
import type { ContentWithRelations, ResolvedRelation, RelationError } from './types.js';

describe('Relation Type Guards', () => {
  const mockResolvedRelation: ResolvedRelation = {
    uuid: 'client-123',
    contentType: 'clients',
    nomeEmpresa: 'Test Company',
    contribuinte: '123456789'
  };

  const mockRelationError: RelationError = {
    type: 'error',
    code: 404,
    message: 'Not found'
  };

  const mockContentWithRelations: ContentWithRelations<{ clientId: string }> = {
    uuid: 'license-123',
    contentType: 'licenses',
    createdAt: '2024-01-10T10:00:00Z',
    createdBy: 'user-123',
    updatedAt: '2024-01-10T10:00:00Z',
    updatedBy: 'user-123',
    version: 1,
    isDeleted: false,
    data: { clientId: 'client-123' },
    relations: {
      client: mockResolvedRelation
    }
  };

  describe('isRelationError', () => {
    it('should return true for relation errors', () => {
      expect(isRelationError(mockRelationError)).toBe(true);
    });

    it('should return false for resolved relations', () => {
      expect(isRelationError(mockResolvedRelation)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isRelationError(null as any)).toBe(false);
      expect(isRelationError(undefined as any)).toBe(false);
    });
  });

  describe('isResolvedRelation', () => {
    it('should return true for resolved relations', () => {
      expect(isResolvedRelation(mockResolvedRelation)).toBe(true);
    });

    it('should return false for relation errors', () => {
      expect(isResolvedRelation(mockRelationError)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isResolvedRelation(null as any)).toBe(false);
      expect(isResolvedRelation(undefined as any)).toBe(false);
    });
  });

  describe('getResolvedRelation', () => {
    it('should return resolved relation for valid data', () => {
      const result = getResolvedRelation(mockResolvedRelation);
      expect(result).toEqual(mockResolvedRelation);
    });

    it('should return null for relation errors', () => {
      const result = getResolvedRelation(mockRelationError);
      expect(result).toBeNull();
    });

    it('should return null for undefined', () => {
      const result = getResolvedRelation(undefined);
      expect(result).toBeNull();
    });
  });

  describe('getRelationError', () => {
    it('should return relation error for error data', () => {
      const result = getRelationError(mockRelationError);
      expect(result).toEqual(mockRelationError);
    });

    it('should return null for resolved relations', () => {
      const result = getRelationError(mockResolvedRelation);
      expect(result).toBeNull();
    });

    it('should return null for undefined', () => {
      const result = getRelationError(undefined);
      expect(result).toBeNull();
    });
  });

  describe('hasResolvedRelations', () => {
    it('should return true when content has resolved relations', () => {
      expect(hasResolvedRelations(mockContentWithRelations)).toBe(true);
    });

    it('should return false when content has only errors', () => {
      const contentWithErrors: ContentWithRelations<{ clientId: string }> = {
        ...mockContentWithRelations,
        relations: {
          client: mockRelationError
        }
      };
      expect(hasResolvedRelations(contentWithErrors)).toBe(false);
    });

    it('should return false when content has no relations', () => {
      const contentWithoutRelations: ContentWithRelations<{ clientId: string }> = {
        ...mockContentWithRelations,
        relations: {}
      };
      expect(hasResolvedRelations(contentWithoutRelations)).toBe(false);
    });
  });

  describe('hasRelationErrors', () => {
    it('should return true when content has relation errors', () => {
      const contentWithErrors: ContentWithRelations<{ clientId: string }> = {
        ...mockContentWithRelations,
        relations: {
          client: mockRelationError
        }
      };
      expect(hasRelationErrors(contentWithErrors)).toBe(true);
    });

    it('should return false when content has only resolved relations', () => {
      expect(hasRelationErrors(mockContentWithRelations)).toBe(false);
    });

    it('should return false when content has no relations', () => {
      const contentWithoutRelations: ContentWithRelations<{ clientId: string }> = {
        ...mockContentWithRelations,
        relations: {}
      };
      expect(hasRelationErrors(contentWithoutRelations)).toBe(false);
    });
  });

  describe('getResolvedRelations', () => {
    it('should return only resolved relations', () => {
      const contentWithMixed: ContentWithRelations<{ clientId: string; contractId: string }> = {
        ...mockContentWithRelations,
        data: { clientId: 'client-123', contractId: 'contract-456' },
        relations: {
          client: mockResolvedRelation,
          contract: mockRelationError
        }
      };

      const result = getResolvedRelations(contentWithMixed);
      expect(result).toEqual({
        client: mockResolvedRelation
      });
    });

    it('should return empty object when no resolved relations', () => {
      const contentWithErrors: ContentWithRelations<{ clientId: string }> = {
        ...mockContentWithRelations,
        relations: {
          client: mockRelationError
        }
      };

      const result = getResolvedRelations(contentWithErrors);
      expect(result).toEqual({});
    });
  });

  describe('getRelationErrors', () => {
    it('should return only relation errors', () => {
      const contentWithMixed: ContentWithRelations<{ clientId: string; contractId: string }> = {
        ...mockContentWithRelations,
        data: { clientId: 'client-123', contractId: 'contract-456' },
        relations: {
          client: mockResolvedRelation,
          contract: mockRelationError
        }
      };

      const result = getRelationErrors(contentWithMixed);
      expect(result).toEqual({
        contract: mockRelationError
      });
    });

    it('should return empty object when no relation errors', () => {
      const result = getRelationErrors(mockContentWithRelations);
      expect(result).toEqual({});
    });
  });

  describe('getRelationSummary', () => {
    it('should provide accurate summary for mixed relations', () => {
      const serverError: RelationError = {
        type: 'error',
        code: 500,
        message: 'Internal Server Error'
      };

      const contentWithMixed: ContentWithRelations<{ clientId: string; contractId: string; licenseId: string }> = {
        ...mockContentWithRelations,
        data: { clientId: 'client-123', contractId: 'contract-456', licenseId: 'license-789' },
        relations: {
          client: mockResolvedRelation,
          contract: mockRelationError,
          license: serverError
        }
      };

      const result = getRelationSummary(contentWithMixed);
      expect(result).toEqual({
        total: 3,
        resolved: 1,
        errors: 2,
        errorCodes: {
          404: 1,
          500: 1
        }
      });
    });

    it('should handle content with no relations', () => {
      const contentWithoutRelations: ContentWithRelations<{ clientId: string }> = {
        ...mockContentWithRelations,
        relations: {}
      };

      const result = getRelationSummary(contentWithoutRelations);
      expect(result).toEqual({
        total: 0,
        resolved: 0,
        errors: 0,
        errorCodes: {}
      });
    });

    it('should handle content with only resolved relations', () => {
      const result = getRelationSummary(mockContentWithRelations);
      expect(result).toEqual({
        total: 1,
        resolved: 1,
        errors: 0,
        errorCodes: {}
      });
    });
  });
});
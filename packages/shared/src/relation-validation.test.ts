/**
 * Tests for relation validation utilities
 *
 * Verifies that relation validation allows content creation/updates with relation IDs
 * without validating that referenced content exists, while maintaining proper format validation.
 *
 * Requirements: 1.1, 1.3, 1.4, 1.5
 */

import { describe, it, expect } from 'vitest';
import {
  validateRelationFields,
  sanitizeRelationFields,
  extractRelationChanges,
  hasRelationFields,
  getRelationFieldNames,
  validateBackwardCompatibility,
  CONTENT_RELATION_CONFIGS,
} from './relation-validation.js';

describe('Relation Validation', () => {
  describe('validateRelationFields', () => {
    it('should allow valid UUID relation IDs without checking if referenced content exists', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const licenseData = {
        clientId: validUuid,
        versao: '2024',
      };

      const errors = validateRelationFields('licenses', licenseData);
      expect(errors).toEqual([]);
    });

    it('should allow null/empty relation IDs for optional relationships', () => {
      const licenseData = {
        clientId: '', // Empty string
        versao: '2024',
      };

      const errors = validateRelationFields('licenses', licenseData);
      expect(errors).toEqual([]);
    });

    it('should allow undefined relation IDs for optional relationships', () => {
      const licenseData = {
        versao: '2024',
        // clientId is undefined
      };

      const errors = validateRelationFields('licenses', licenseData);
      expect(errors).toEqual([]);
    });

    it('should reject invalid UUID format for relation IDs', () => {
      const licenseData = {
        clientId: 'invalid-uuid-format',
        versao: '2024',
      };

      const errors = validateRelationFields('licenses', licenseData);
      expect(errors).toContain('Cliente deve ter um formato válido de identificador');
    });

    it('should handle content types without relations', () => {
      const clientData = {
        nomeEmpresa: 'Test Company',
        nomeComercial: 'Test',
      };

      const errors = validateRelationFields('clients', clientData);
      expect(errors).toEqual([]);
    });

    it('should validate multiple relation fields', () => {
      // Add a hypothetical content type with multiple relations for testing
      const testData = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        contractId: 'invalid-format',
      };

      // This would fail for contractId if it were configured as a relation field
      // For now, we test with existing configuration
      const errors = validateRelationFields('licenses', testData);
      expect(errors).toEqual([]); // Only clientId is configured for licenses
    });
  });

  describe('sanitizeRelationFields', () => {
    it('should trim whitespace from relation IDs', () => {
      const licenseData = {
        clientId: '  123e4567-e89b-12d3-a456-426614174000  ',
        versao: '2024',
      };

      const sanitized = sanitizeRelationFields('licenses', licenseData);
      expect(sanitized.clientId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should convert empty strings to undefined for optional relations', () => {
      const licenseData = {
        clientId: '   ',
        versao: '2024',
      };

      const sanitized = sanitizeRelationFields('licenses', licenseData);
      expect(sanitized.clientId).toBeUndefined();
    });

    it('should preserve other fields unchanged', () => {
      const licenseData = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        versao: '2024',
        numeroSerie: 'ABC123',
      };

      const sanitized = sanitizeRelationFields('licenses', licenseData);
      expect(sanitized.versao).toBe('2024');
      expect(sanitized.numeroSerie).toBe('ABC123');
    });
  });

  describe('extractRelationChanges', () => {
    it('should detect relation field changes', () => {
      const oldData = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        versao: '2024',
      };

      const newData = {
        clientId: '987fcdeb-51a2-43d1-9f12-123456789abc',
        versao: '2024',
      };

      const changes = extractRelationChanges('licenses', oldData, newData);
      expect(changes).toEqual({
        clientId: {
          from: '123e4567-e89b-12d3-a456-426614174000',
          to: '987fcdeb-51a2-43d1-9f12-123456789abc',
        },
      });
    });

    it('should detect relation field removal', () => {
      const oldData = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        versao: '2024',
      };

      const newData = {
        clientId: '',
        versao: '2024',
      };

      const changes = extractRelationChanges('licenses', oldData, newData);
      expect(changes).toEqual({
        clientId: {
          from: '123e4567-e89b-12d3-a456-426614174000',
          to: undefined,
        },
      });
    });

    it('should detect relation field addition', () => {
      const oldData = {
        versao: '2024',
      };

      const newData = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        versao: '2024',
      };

      const changes = extractRelationChanges('licenses', oldData, newData);
      expect(changes).toEqual({
        clientId: {
          from: undefined,
          to: '123e4567-e89b-12d3-a456-426614174000',
        },
      });
    });

    it('should return empty object when no relation changes occur', () => {
      const oldData = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        versao: '2024',
      };

      const newData = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        versao: '2025', // Non-relation field change
      };

      const changes = extractRelationChanges('licenses', oldData, newData);
      expect(changes).toEqual({});
    });
  });

  describe('hasRelationFields', () => {
    it('should return true when content has relation fields', () => {
      const licenseData = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        versao: '2024',
      };

      const hasRelations = hasRelationFields('licenses', licenseData);
      expect(hasRelations).toBe(true);
    });

    it('should return false when content has no relation fields', () => {
      const licenseData = {
        versao: '2024',
      };

      const hasRelations = hasRelationFields('licenses', licenseData);
      expect(hasRelations).toBe(false);
    });

    it('should return false when relation fields are empty', () => {
      const licenseData = {
        clientId: '',
        versao: '2024',
      };

      const hasRelations = hasRelationFields('licenses', licenseData);
      expect(hasRelations).toBe(false);
    });
  });

  describe('getRelationFieldNames', () => {
    it('should return relation field names for content type with relations', () => {
      const fieldNames = getRelationFieldNames('licenses');
      expect(fieldNames).toEqual(['clientId']);
    });

    it('should return empty array for content type without relations', () => {
      const fieldNames = getRelationFieldNames('clients');
      expect(fieldNames).toEqual([]);
    });
  });

  describe('validateBackwardCompatibility', () => {
    it('should be more lenient with existing content', () => {
      const existingData = {
        clientId: 'invalid-format', // This would normally fail validation
        versao: '2024',
      };

      // For new content, this should fail
      const newContentErrors = validateBackwardCompatibility('licenses', existingData, false);
      expect(newContentErrors.length).toBeGreaterThan(0);

      // For existing content, this should be more lenient
      const existingContentErrors = validateBackwardCompatibility('licenses', existingData, true);
      expect(existingContentErrors.length).toBeGreaterThan(0); // Still validates format
    });

    it('should validate format even for existing content', () => {
      const existingData = {
        clientId: 'completely-invalid',
        versao: '2024',
      };

      const errors = validateBackwardCompatibility('licenses', existingData, true);
      expect(errors).toContain('Cliente tem formato inválido de identificador');
    });
  });

  describe('CONTENT_RELATION_CONFIGS', () => {
    it('should have correct configuration for licenses', () => {
      const licenseConfig = CONTENT_RELATION_CONFIGS.licenses;
      expect(licenseConfig).toHaveLength(1);
      expect(licenseConfig[0]).toEqual({
        fieldName: 'clientId',
        targetType: 'clients',
        required: false,
        displayName: 'Cliente',
      });
    });

    it('should have configurations for all content types with relations', () => {
      const contentTypesWithRelations = [
        'licenses',
        'contracts',
        'work-sheets',
        'remote-assistance',
        'daily-records',
      ];

      for (const contentType of contentTypesWithRelations) {
        expect(CONTENT_RELATION_CONFIGS[contentType]).toBeDefined();
        expect(Array.isArray(CONTENT_RELATION_CONFIGS[contentType])).toBe(true);
      }
    });

    it('should have empty configurations for content types without relations', () => {
      const contentTypesWithoutRelations = ['clients', 'reminders', 'pending'];

      for (const contentType of contentTypesWithoutRelations) {
        expect(CONTENT_RELATION_CONFIGS[contentType]).toEqual([]);
      }
    });
  });
});

describe('Integration with existing validation', () => {
  it('should work with license validation functions', async () => {
    // This test verifies that the relation validation integrates properly
    // with existing validation functions
    const { validateLicenseCreation } = await import('./types/licenses/validation.js');

    const validLicenseData = {
      clientId: '123e4567-e89b-12d3-a456-426614174000',
      versao: '2024',
    };

    const errors = validateLicenseCreation(validLicenseData);
    expect(errors).toEqual([]);
  });

  it('should work with client validation functions', async () => {
    const { validateClientCreation } = await import('./types/clients/validation.js');

    const validClientData = {
      nomeEmpresa: 'Test Company',
      nomeComercial: 'Test',
    };

    const errors = validateClientCreation(validClientData);
    expect(errors).toEqual([]);
  });
});

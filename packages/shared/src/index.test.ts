import { describe, it, expect } from 'vitest';
import * as SharedModule from './index.js';

describe('Shared module exports', () => {
  it('should export all utilities from utils.ts', () => {
    // Test that all expected utilities are exported
    const expectedExports = [
      'detectRelationFields',
      'getContentTypeFromRelation',
      'RELATION_TYPE_MAPPING',
    ];

    // Check that the module has exports
    expect(typeof SharedModule).toBe('object');
    expect(SharedModule).toBeDefined();

    // Check that relation utilities are exported
    expect(SharedModule.detectRelationFields).toBeDefined();
    expect(SharedModule.getContentTypeFromRelation).toBeDefined();
    expect(SharedModule.RELATION_TYPE_MAPPING).toBeDefined();
  });

  it('should export BaseContent type (via type import)', () => {
    // We can't directly test type exports at runtime, but we can test
    // that the module structure is correct and imports work

    // Import the types to ensure they're available
    import('./types.js').then(typesModule => {
      expect(typesModule).toBeDefined();
    });
  });

  it('should export relation utilities', () => {
    expect(typeof SharedModule.detectRelationFields).toBe('function');
    expect(typeof SharedModule.getContentTypeFromRelation).toBe('function');
    expect(typeof SharedModule.RELATION_TYPE_MAPPING).toBe('object');
  });

  it('should have proper module structure', () => {
    // Ensure the module exports are structured correctly
    expect(SharedModule).toHaveProperty('detectRelationFields');
    expect(SharedModule).toHaveProperty('getContentTypeFromRelation');
    expect(SharedModule).toHaveProperty('RELATION_TYPE_MAPPING');
  });
});

describe('Type imports work correctly', () => {
  it('should allow importing utilities from the main module', async () => {
    // Test that we can import utilities through the main index
    const { detectRelationFields, getContentTypeFromRelation, RELATION_TYPE_MAPPING } =
      await import('./index.js');
    expect(detectRelationFields).toBeDefined();
    expect(getContentTypeFromRelation).toBeDefined();
    expect(RELATION_TYPE_MAPPING).toBeDefined();
  });

  it('should allow importing types directly', async () => {
    // Test direct type imports work
    const typesModule = await import('./types.js');
    expect(typesModule).toBeDefined();
  });
});

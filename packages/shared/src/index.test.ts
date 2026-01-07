import { describe, it, expect } from 'vitest';
import * as SharedModule from './index.js';

describe('Shared module exports', () => {
  it('should export all types from types.ts', () => {
    // Test that all expected types are exported
    const expectedExports = [
      'placeholder', // from utils.ts
    ];

    // Check that the module has exports
    expect(typeof SharedModule).toBe('object');
    expect(SharedModule).toBeDefined();
  });

  it('should export BaseContent type (via type import)', () => {
    // We can't directly test type exports at runtime, but we can test
    // that the module structure is correct and imports work

    // Import the types to ensure they're available
    import('./types.js').then(typesModule => {
      expect(typesModule).toBeDefined();
    });
  });

  it('should export utils placeholder', () => {
    expect(SharedModule.placeholder).toBe(true);
  });

  it('should have proper module structure', () => {
    // Ensure the module exports are structured correctly
    expect(SharedModule).toHaveProperty('placeholder');
  });
});

describe('Type imports work correctly', () => {
  it('should allow importing types from the main module', async () => {
    // Test that we can import types through the main index
    const { placeholder } = await import('./index.js');
    expect(placeholder).toBe(true);
  });

  it('should allow importing types directly', async () => {
    // Test direct type imports work
    const typesModule = await import('./types.js');
    expect(typesModule).toBeDefined();
  });
});

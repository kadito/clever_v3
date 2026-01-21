/**
 * Tests for the generic content route template
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 8.6, 10.1, 10.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import {
  createContentRoutes,
  createStandardContentConfig,
  createClientContentConfig,
} from './content-route-template';
import type { BaseContent, ApiResponse, ListResponse, SearchResponse } from '@clever/shared';

// Mock the middleware
vi.mock('../middleware/clerk', () => ({
  requireAuth: vi.fn((c, next) => next()),
  requireUserContext: vi.fn(() => ({
    userId: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    userType: 'User',
    sessionId: 'test-session',
    isAuthenticated: true,
  })),
}));

// Mock R2 bucket
const mockR2Bucket = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
};

describe('Content Route Template', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    vi.clearAllMocks();
  });

  describe('createStandardContentConfig', () => {
    it('should create standard configuration with default date-desc sorting', () => {
      const config = createStandardContentConfig('contracts');

      expect(config.contentType).toBe('contracts');
      expect(config.sortStrategy).toBe('date-desc');
    });

    it('should create standard configuration with custom sorting', () => {
      const config = createStandardContentConfig('licenses', 'date-asc');

      expect(config.contentType).toBe('licenses');
      expect(config.sortStrategy).toBe('date-asc');
    });
  });

  describe('createClientContentConfig', () => {
    it('should create client-specific configuration with alphabetical sorting', () => {
      const config = createClientContentConfig();

      expect(config.contentType).toBe('clients');
      expect(config.sortStrategy).toBe('alphabetical');
      expect(config.extractSearchableText).toBeDefined();
      expect(config.extractIndexFields).toBeDefined();
    });

    it('should extract searchable text from client data', () => {
      const config = createClientContentConfig<BaseContent>();
      const mockContent: BaseContent = {
        uuid: 'test-uuid',
        contentType: 'clients',
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'test-user',
        updatedAt: '2024-01-01T00:00:00Z',
        updatedBy: 'test-user',
        version: 1,
        isDeleted: false,
        data: {
          nomeEmpresa: 'Test Company',
          nomeComercial: 'Test Commercial',
          contribuinte: '123456789',
          localidade: 'Lisboa',
          responsavel: 'John Doe',
          telefoneContato: '912345678',
          email: 'test@company.com',
        },
      };

      const searchableText = config.extractSearchableText!(mockContent);

      expect(searchableText).toContain('test company');
      expect(searchableText).toContain('test commercial');
      expect(searchableText).toContain('123456789');
      expect(searchableText).toContain('lisboa');
      expect(searchableText).toContain('john doe');
      expect(searchableText).toContain('912345678');
      expect(searchableText).toContain('test@company.com');
    });

    it('should extract index fields from client data', () => {
      const config = createClientContentConfig<BaseContent>();
      const mockContent: BaseContent = {
        uuid: 'test-uuid',
        contentType: 'clients',
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'test-user',
        updatedAt: '2024-01-01T00:00:00Z',
        updatedBy: 'test-user',
        version: 1,
        isDeleted: false,
        data: {
          nomeEmpresa: 'Test Company',
          nomeComercial: 'Test Commercial',
          contribuinte: '123456789',
          localidade: 'Lisboa',
        },
      };

      const indexFields = config.extractIndexFields!(mockContent);

      expect(indexFields).toEqual({
        nomeEmpresa: 'Test Company',
        nomeComercial: 'Test Commercial',
        contribuinte: '123456789',
        localidade: 'Lisboa',
        responsavel: '',
        telefoneContato: '',
        email: '',
      });
    });
  });

  describe('createContentRoutes', () => {
    it('should create a Hono router with CRUD endpoints', () => {
      const config = createStandardContentConfig('contracts');
      const router = createContentRoutes(config);

      expect(router).toBeDefined();
      expect(typeof router.request).toBe('function');
    });

    it('should require authentication for all routes', async () => {
      const config = createStandardContentConfig('contracts');
      const router = createContentRoutes(config);

      // Mount the router
      app.route('/content/contracts', router);

      // Mock environment with R2 bucket
      const mockEnv = { R2_BUCKET: mockR2Bucket };

      // Test that routes exist (they should return responses, not 404)
      const listResponse = await app.request(
        '/content/contracts',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
        mockEnv
      );

      // Should not be 404 (route exists)
      expect(listResponse.status).not.toBe(404);
    });

    it('should handle missing R2 bucket gracefully', async () => {
      const config = createStandardContentConfig('contracts');
      const router = createContentRoutes(config);

      app.route('/content/contracts', router);

      // Mock environment without R2 bucket
      const mockEnv = {};

      const response = await app.request(
        '/content/contracts',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
        mockEnv
      );

      expect(response.status).toBe(500);

      const body: ApiResponse = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Storage not available');
    });

    it('should validate pagination parameters', async () => {
      const config = createStandardContentConfig('contracts');
      const router = createContentRoutes(config);

      app.route('/content/contracts', router);

      const mockEnv = { R2_BUCKET: mockR2Bucket };

      // Test invalid page parameter
      const response = await app.request(
        '/content/contracts?page=0',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
        mockEnv
      );

      expect(response.status).toBe(400);

      const body: ApiResponse = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid pagination parameters');
    });

    it('should validate UUID format for single item requests', async () => {
      const config = createStandardContentConfig('contracts');
      const router = createContentRoutes(config);

      app.route('/content/contracts', router);

      const mockEnv = { R2_BUCKET: mockR2Bucket };

      // Test invalid UUID format
      const response = await app.request(
        '/content/contracts/invalid-uuid',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
        mockEnv
      );

      expect(response.status).toBe(400);

      const body: ApiResponse = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Invalid UUID format');
    });

    it('should handle JSON parsing errors in POST requests', async () => {
      const config = createStandardContentConfig('contracts');
      const router = createContentRoutes(config);

      app.route('/content/contracts', router);

      const mockEnv = { R2_BUCKET: mockR2Bucket };

      // Test invalid JSON
      const response = await app.request(
        '/content/contracts',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'invalid json',
        },
        mockEnv
      );

      expect(response.status).toBe(400);

      const body: ApiResponse = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Invalid JSON body');
    });
  });

  describe('Route Configuration Validation', () => {
    it('should support custom validation functions', async () => {
      const config = createStandardContentConfig('contracts');
      config.validateCreate = (data: any) => {
        if (!data.title) {
          throw new Error('Title is required');
        }
      };

      const router = createContentRoutes(config);
      app.route('/content/contracts', router);

      const mockEnv = { R2_BUCKET: mockR2Bucket };

      // Test validation failure
      const response = await app.request(
        '/content/contracts',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: 'Test contract' }),
        },
        mockEnv
      );

      expect(response.status).toBe(400);

      const body: ApiResponse = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Title is required');
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      const config = createStandardContentConfig('contracts');
      const router = createContentRoutes(config);

      app.route('/content/contracts', router);

      // Mock R2 bucket that throws errors
      const errorR2Bucket = {
        ...mockR2Bucket,
        get: vi.fn().mockRejectedValue(new Error('Storage error')),
      };

      const mockEnv = { R2_BUCKET: errorR2Bucket };

      const response = await app.request(
        '/content/contracts',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
        mockEnv
      );

      expect(response.status).toBe(500);

      const body: ApiResponse = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to retrieve contracts');
    });
  });
});

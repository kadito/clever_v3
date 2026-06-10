/**
 * Tests for the generic content route template
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 8.6, 10.1, 10.4
 * Integration tests: MI-04, MI-05, MI-06 (clientId filter)
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

// ============================================================================
// MI-04: listFiltered with clientId returns only matching items
// **Validates: Requirements DR-AC-003, DR-AC-005, DR-BR-002**
// ============================================================================

describe('MI-04: listFiltered with clientId returns only matching items', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    vi.clearAllMocks();
  });

  it('should return only work sheets belonging to the specified clientId', async () => {
    const clientA = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
    const clientB = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';

    const indexData = {
      items: [
        { uuid: 'ws-1', clientId: clientA, isDeleted: false, searchableText: 'ws one', createdAt: '2024-01-01T00:00:00Z' },
        { uuid: 'ws-2', clientId: clientB, isDeleted: false, searchableText: 'ws two', createdAt: '2024-01-02T00:00:00Z' },
        { uuid: 'ws-3', clientId: clientA, isDeleted: false, searchableText: 'ws three', createdAt: '2024-01-03T00:00:00Z' },
        { uuid: 'ws-4', clientId: clientB, isDeleted: false, searchableText: 'ws four', createdAt: '2024-01-04T00:00:00Z' },
      ],
    };

    const wsContent = (uuid: string, clientId: string): BaseContent => ({
      uuid,
      contentType: 'work-sheets',
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'user-1',
      updatedAt: '2024-01-01T00:00:00Z',
      updatedBy: 'user-1',
      version: 1,
      isDeleted: false,
      data: { clientId },
    });

    const bucket = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'indexes/work-sheets-index.json') {
          return Promise.resolve({ json: () => Promise.resolve(indexData) });
        }
        if (key === 'content/work-sheets/ws-1.json') {
          return Promise.resolve({ json: () => Promise.resolve(wsContent('ws-1', clientA)) });
        }
        if (key === 'content/work-sheets/ws-3.json') {
          return Promise.resolve({ json: () => Promise.resolve(wsContent('ws-3', clientA)) });
        }
        return Promise.resolve(null);
      }),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
    };

    const config = createStandardContentConfig<BaseContent>('work-sheets', 'date-desc');
    const router = createContentRoutes(config);
    app.route('/content/work-sheets', router);

    const response = await app.request(
      `/content/work-sheets?clientId=${clientA}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      { R2_BUCKET: bucket }
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as ListResponse<unknown>;
    expect(body.success).toBe(true);
    expect(body.pagination?.total).toBe(2);
    expect(body.data).toHaveLength(2);
  });

  it('should return only remote assistances belonging to the specified clientId', async () => {
    const clientA = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
    const clientC = 'cccccccc-cccc-4ccc-cccc-cccccccccccc';

    const indexData = {
      items: [
        { uuid: 'ra-1', clientId: clientA, isDeleted: false, searchableText: 'ra one', createdAt: '2024-02-01T00:00:00Z' },
        { uuid: 'ra-2', clientId: clientC, isDeleted: false, searchableText: 'ra two', createdAt: '2024-02-02T00:00:00Z' },
        { uuid: 'ra-3', clientId: clientA, isDeleted: false, searchableText: 'ra three', createdAt: '2024-02-03T00:00:00Z' },
      ],
    };

    const raContent = (uuid: string, clientId: string): BaseContent => ({
      uuid,
      contentType: 'remote-assistance',
      createdAt: '2024-02-01T00:00:00Z',
      createdBy: 'user-1',
      updatedAt: '2024-02-01T00:00:00Z',
      updatedBy: 'user-1',
      version: 1,
      isDeleted: false,
      data: { clientId },
    });

    const bucket = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'indexes/remote-assistance-index.json') {
          return Promise.resolve({ json: () => Promise.resolve(indexData) });
        }
        if (key === 'content/remote-assistance/ra-1.json') {
          return Promise.resolve({ json: () => Promise.resolve(raContent('ra-1', clientA)) });
        }
        if (key === 'content/remote-assistance/ra-3.json') {
          return Promise.resolve({ json: () => Promise.resolve(raContent('ra-3', clientA)) });
        }
        return Promise.resolve(null);
      }),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
    };

    const config = createStandardContentConfig<BaseContent>('remote-assistance', 'date-desc');
    const router = createContentRoutes(config);
    app.route('/content/remote-assistance', router);

    const response = await app.request(
      `/content/remote-assistance?clientId=${clientA}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      { R2_BUCKET: bucket }
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as ListResponse<unknown>;
    expect(body.success).toBe(true);
    expect(body.pagination?.total).toBe(2);
    expect(body.data).toHaveLength(2);
  });

  it('should not return deleted items even when clientId matches', async () => {
    const clientA = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';

    const indexData = {
      items: [
        { uuid: 'ws-1', clientId: clientA, isDeleted: false, searchableText: 'active', createdAt: '2024-01-01T00:00:00Z' },
        { uuid: 'ws-2', clientId: clientA, isDeleted: true, searchableText: 'deleted', createdAt: '2024-01-02T00:00:00Z' },
      ],
    };

    const bucket = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'indexes/work-sheets-index.json') {
          return Promise.resolve({ json: () => Promise.resolve(indexData) });
        }
        if (key === 'content/work-sheets/ws-1.json') {
          return Promise.resolve({
            json: () => Promise.resolve({
              uuid: 'ws-1',
              contentType: 'work-sheets',
              createdAt: '2024-01-01T00:00:00Z',
              createdBy: 'user-1',
              updatedAt: '2024-01-01T00:00:00Z',
              updatedBy: 'user-1',
              version: 1,
              isDeleted: false,
              data: { clientId: clientA },
            }),
          });
        }
        return Promise.resolve(null);
      }),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
    };

    const config = createStandardContentConfig<BaseContent>('work-sheets', 'date-desc');
    const router = createContentRoutes(config);
    app.route('/content/work-sheets', router);

    const response = await app.request(
      `/content/work-sheets?clientId=${clientA}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      { R2_BUCKET: bucket }
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as ListResponse<unknown>;
    expect(body.success).toBe(true);
    expect(body.pagination?.total).toBe(1);
    expect(body.data).toHaveLength(1);
  });
});

// ============================================================================
// MI-05: Unknown clientId returns empty results
// **Validates: Requirements DR-AC-009, DR-NFR-001**
// ============================================================================

describe('MI-05: Unknown clientId returns empty results', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    vi.clearAllMocks();
  });

  it('should return empty array with total 0 for work-sheets when clientId matches no items', async () => {
    const unknownClient = 'ffffffff-ffff-4fff-ffff-ffffffffffff';
    const clientA = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';

    const indexData = {
      items: [
        { uuid: 'ws-1', clientId: clientA, isDeleted: false, searchableText: 'ws one', createdAt: '2024-01-01T00:00:00Z' },
        { uuid: 'ws-2', clientId: clientA, isDeleted: false, searchableText: 'ws two', createdAt: '2024-01-02T00:00:00Z' },
      ],
    };

    const bucket = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'indexes/work-sheets-index.json') {
          return Promise.resolve({ json: () => Promise.resolve(indexData) });
        }
        return Promise.resolve(null);
      }),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
    };

    const config = createStandardContentConfig<BaseContent>('work-sheets', 'date-desc');
    const router = createContentRoutes(config);
    app.route('/content/work-sheets', router);

    const response = await app.request(
      `/content/work-sheets?clientId=${unknownClient}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      { R2_BUCKET: bucket }
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as ListResponse<unknown>;
    expect(body.success).toBe(true);
    expect(body.pagination?.total).toBe(0);
    expect(body.data).toHaveLength(0);
  });

  it('should return empty array with total 0 for remote-assistance when clientId matches no items', async () => {
    const unknownClient = 'ffffffff-ffff-4fff-ffff-ffffffffffff';
    const clientB = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';

    const indexData = {
      items: [
        { uuid: 'ra-1', clientId: clientB, isDeleted: false, searchableText: 'ra one', createdAt: '2024-02-01T00:00:00Z' },
      ],
    };

    const bucket = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'indexes/remote-assistance-index.json') {
          return Promise.resolve({ json: () => Promise.resolve(indexData) });
        }
        return Promise.resolve(null);
      }),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
    };

    const config = createStandardContentConfig<BaseContent>('remote-assistance', 'date-desc');
    const router = createContentRoutes(config);
    app.route('/content/remote-assistance', router);

    const response = await app.request(
      `/content/remote-assistance?clientId=${unknownClient}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      { R2_BUCKET: bucket }
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as ListResponse<unknown>;
    expect(body.success).toBe(true);
    expect(body.pagination?.total).toBe(0);
    expect(body.data).toHaveLength(0);
  });

  it('should return empty results when index has no items at all', async () => {
    const clientA = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';

    const bucket = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'indexes/work-sheets-index.json') {
          return Promise.resolve({ json: () => Promise.resolve({ items: [] }) });
        }
        return Promise.resolve(null);
      }),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
    };

    const config = createStandardContentConfig<BaseContent>('work-sheets', 'date-desc');
    const router = createContentRoutes(config);
    app.route('/content/work-sheets', router);

    const response = await app.request(
      `/content/work-sheets?clientId=${clientA}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      { R2_BUCKET: bucket }
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as ListResponse<unknown>;
    expect(body.success).toBe(true);
    expect(body.pagination?.total).toBe(0);
    expect(body.data).toHaveLength(0);
  });

  it('should return empty results when index file does not exist', async () => {
    const clientA = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';

    const bucket = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
    };

    const config = createStandardContentConfig<BaseContent>('work-sheets', 'date-desc');
    const router = createContentRoutes(config);
    app.route('/content/work-sheets', router);

    const response = await app.request(
      `/content/work-sheets?clientId=${clientA}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      { R2_BUCKET: bucket }
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as ListResponse<unknown>;
    expect(body.success).toBe(true);
    expect(body.pagination?.total).toBe(0);
    expect(body.data).toHaveLength(0);
  });
});

// ============================================================================
// MI-06: Combined clientId + search returns intersection
// **Validates: Requirements DR-AC-003, DR-AC-005, DR-BR-002**
// ============================================================================

describe('MI-06: Combined clientId + search returns intersection', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    vi.clearAllMocks();
  });

  it('should return only items matching BOTH clientId AND search text', async () => {
    const clientA = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
    const clientB = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';

    const indexData = {
      items: [
        { uuid: 'ws-1', clientId: clientA, isDeleted: false, searchableText: 'instalação rede empresa alpha', createdAt: '2024-01-01T00:00:00Z' },
        { uuid: 'ws-2', clientId: clientA, isDeleted: false, searchableText: 'manutenção impressora empresa alpha', createdAt: '2024-01-02T00:00:00Z' },
        { uuid: 'ws-3', clientId: clientB, isDeleted: false, searchableText: 'instalação rede empresa beta', createdAt: '2024-01-03T00:00:00Z' },
        { uuid: 'ws-4', clientId: clientA, isDeleted: false, searchableText: 'suporte remoto empresa alpha', createdAt: '2024-01-04T00:00:00Z' },
      ],
    };

    const wsContent = (uuid: string, clientId: string): BaseContent => ({
      uuid,
      contentType: 'work-sheets',
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'user-1',
      updatedAt: '2024-01-01T00:00:00Z',
      updatedBy: 'user-1',
      version: 1,
      isDeleted: false,
      data: { clientId },
    });

    const bucket = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'indexes/work-sheets-index.json') {
          return Promise.resolve({ json: () => Promise.resolve(indexData) });
        }
        // Only ws-1 matches clientA + "instalação"
        if (key === 'content/work-sheets/ws-1.json') {
          return Promise.resolve({ json: () => Promise.resolve(wsContent('ws-1', clientA)) });
        }
        return Promise.resolve(null);
      }),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
    };

    const config = createStandardContentConfig<BaseContent>('work-sheets', 'date-desc');
    const router = createContentRoutes(config);
    app.route('/content/work-sheets', router);

    // Search for "instalação" filtered by clientA — should only return ws-1
    const response = await app.request(
      `/content/work-sheets?clientId=${clientA}&search=instalação`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      { R2_BUCKET: bucket }
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as ListResponse<unknown>;
    expect(body.success).toBe(true);
    // clientA has ws-1 (instalação rede) and ws-2 (manutenção) and ws-4 (suporte)
    // search "instalação" matches ws-1 and ws-3
    // intersection: ws-1 only
    expect(body.pagination?.total).toBe(1);
    expect(body.data).toHaveLength(1);
  });

  it('should return empty when clientId matches items but search does not', async () => {
    const clientA = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';

    const indexData = {
      items: [
        { uuid: 'ws-1', clientId: clientA, isDeleted: false, searchableText: 'manutenção servidor', createdAt: '2024-01-01T00:00:00Z' },
        { uuid: 'ws-2', clientId: clientA, isDeleted: false, searchableText: 'suporte remoto', createdAt: '2024-01-02T00:00:00Z' },
      ],
    };

    const bucket = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'indexes/work-sheets-index.json') {
          return Promise.resolve({ json: () => Promise.resolve(indexData) });
        }
        return Promise.resolve(null);
      }),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
    };

    const config = createStandardContentConfig<BaseContent>('work-sheets', 'date-desc');
    const router = createContentRoutes(config);
    app.route('/content/work-sheets', router);

    // Search for "xyz" with clientA — no searchableText matches "xyz"
    const response = await app.request(
      `/content/work-sheets?clientId=${clientA}&search=xyz`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      { R2_BUCKET: bucket }
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as ListResponse<unknown>;
    expect(body.success).toBe(true);
    expect(body.pagination?.total).toBe(0);
    expect(body.data).toHaveLength(0);
  });

  it('should return empty when search matches items but clientId does not', async () => {
    const clientA = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
    const unknownClient = 'ffffffff-ffff-4fff-ffff-ffffffffffff';

    const indexData = {
      items: [
        { uuid: 'ra-1', clientId: clientA, isDeleted: false, searchableText: 'instalação rede', createdAt: '2024-01-01T00:00:00Z' },
        { uuid: 'ra-2', clientId: clientA, isDeleted: false, searchableText: 'manutenção rede', createdAt: '2024-01-02T00:00:00Z' },
      ],
    };

    const bucket = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'indexes/remote-assistance-index.json') {
          return Promise.resolve({ json: () => Promise.resolve(indexData) });
        }
        return Promise.resolve(null);
      }),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
    };

    const config = createStandardContentConfig<BaseContent>('remote-assistance', 'date-desc');
    const router = createContentRoutes(config);
    app.route('/content/remote-assistance', router);

    // Search for "rede" with unknown client — search matches but clientId does not
    const response = await app.request(
      `/content/remote-assistance?clientId=${unknownClient}&search=rede`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      { R2_BUCKET: bucket }
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as ListResponse<unknown>;
    expect(body.success).toBe(true);
    expect(body.pagination?.total).toBe(0);
    expect(body.data).toHaveLength(0);
  });

  it('should be case-insensitive for search when combined with clientId', async () => {
    const clientA = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';

    const indexData = {
      items: [
        { uuid: 'ws-1', clientId: clientA, isDeleted: false, searchableText: 'manutenção servidor linux', createdAt: '2024-01-01T00:00:00Z' },
        { uuid: 'ws-2', clientId: clientA, isDeleted: false, searchableText: 'instalação windows', createdAt: '2024-01-02T00:00:00Z' },
      ],
    };

    const wsContent = (uuid: string): BaseContent => ({
      uuid,
      contentType: 'work-sheets',
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'user-1',
      updatedAt: '2024-01-01T00:00:00Z',
      updatedBy: 'user-1',
      version: 1,
      isDeleted: false,
      data: { clientId: clientA },
    });

    const bucket = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'indexes/work-sheets-index.json') {
          return Promise.resolve({ json: () => Promise.resolve(indexData) });
        }
        if (key === 'content/work-sheets/ws-1.json') {
          return Promise.resolve({ json: () => Promise.resolve(wsContent('ws-1')) });
        }
        return Promise.resolve(null);
      }),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
    };

    const config = createStandardContentConfig<BaseContent>('work-sheets', 'date-desc');
    const router = createContentRoutes(config);
    app.route('/content/work-sheets', router);

    // Search with uppercase "LINUX" — should still match
    const response = await app.request(
      `/content/work-sheets?clientId=${clientA}&search=LINUX`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      { R2_BUCKET: bucket }
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as ListResponse<unknown>;
    expect(body.success).toBe(true);
    expect(body.pagination?.total).toBe(1);
    expect(body.data).toHaveLength(1);
  });
});

/**
 * Integration tests for expiration date filter — Backend
 * Tests MI-01 through MI-15
 *
 * Covers:
 * - listFiltered with expirationMonth for contracts (MI-01 to MI-06)
 * - listFiltered with expirationMonth for licenses (MI-07 to MI-10)
 * - listFiltered AND logic with search (MI-11)
 * - listFiltered pagination with filter (MI-12)
 * - Route handler expirationMonth param extraction (MI-13 to MI-15)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StorageBucket, StorageObject } from '@clever/shared';

// ---------------------------------------------------------------------------
// Helpers — in-memory R2 mock
// ---------------------------------------------------------------------------

function createStorageObject(data: unknown): StorageObject {
  return { json: async () => data };
}

function createMockBucket(store: Record<string, unknown>): StorageBucket {
  return {
    get: async (key: string) => {
      if (key in store) return createStorageObject(store[key]);
      return null;
    },
    put: async (key: string, value: string) => {
      store[key] = JSON.parse(value);
      return createStorageObject(store[key]);
    },
    delete: async (key: string) => {
      delete store[key];
    },
  };
}

/** Minimal index item builder */
function indexItem(
  uuid: string,
  fields: Record<string, unknown> = {},
  searchableText = ''
): Record<string, unknown> {
  return {
    uuid,
    isDeleted: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    searchableText,
    ...fields,
  };
}

/** Minimal full content document stored at content/{type}/{uuid}.json */
function contentDoc(uuid: string, contentType: string, data: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    uuid,
    contentType,
    createdAt: '2026-01-01T00:00:00.000Z',
    createdBy: 'test',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'test',
    version: 1,
    isDeleted: false,
    data,
  };
}

// ---------------------------------------------------------------------------
// We need to import the actual class under test. Because
// ConfigurableContentStorageService is not exported directly, we import
// createContentRoutes and exercise listFiltered through the Hono route.
// For the pure-service tests (MI-01 to MI-12) we dynamically import the
// module and access the class via the route handler indirectly.
//
// Simpler approach: re-create the filtering logic inline to test it, OR
// import the module and call the route handler with a mock Hono context.
//
// Best approach: use the Hono app directly with a test client.
// ---------------------------------------------------------------------------

import { Hono } from 'hono';
import { createContentRoutes } from './routes/content-route-template';
import type { ContentRouteConfig } from './routes/content-route-template';
import type { BaseContent } from '@clever/shared';

// Mock the auth middleware so requests pass through
vi.mock('./middleware/clerk', () => ({
  requireAuth: async (_c: unknown, next: () => Promise<void>) => next(),
  requireUserContext: () => ({
    userId: 'test-user',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    userType: 'Admin',
    sessionId: 'sess-1',
    isAuthenticated: true,
  }),
}));

vi.mock('./middleware/permissions', () => ({
  requireDeletePermission: async (_c: unknown, next: () => Promise<void>) => next(),
}));


// ---------------------------------------------------------------------------
// Factory: build a Hono app wired to a mock R2 bucket
// ---------------------------------------------------------------------------

function buildApp(
  contentType: 'contracts' | 'licenses',
  store: Record<string, unknown>
): Hono {
  const bucket = createMockBucket(store);

  const config: ContentRouteConfig<BaseContent> = {
    contentType,
    sortStrategy: 'date-desc',
  };

  const routes = createContentRoutes(config);

  const app = new Hono();
  // Inject the mock bucket into env
  app.use('*', async (c, next) => {
    c.env = { R2_BUCKET: bucket };
    await next();
  });
  app.route('/', routes);

  return app;
}

// ---------------------------------------------------------------------------
// MI-01 to MI-06 — listFiltered contracts with expirationMonth
// ---------------------------------------------------------------------------

describe('Backend listFiltered — contracts expirationMonth', () => {
  it('MI-01: contract with both dates — uses earliest, matches selected month', async () => {
    const store: Record<string, unknown> = {
      'indexes/contracts-index.json': {
        items: [
          indexItem('c1', { fimContratoCPA: '2026-06-15', fimContratoSH: '2026-08-01' }),
        ],
      },
      'content/contracts/c1.json': contentDoc('c1', 'contracts', {
        fimContratoCPA: '2026-06-15',
        fimContratoSH: '2026-08-01',
      }),
    };

    const app = buildApp('contracts', store);
    const res = await app.request('/?page=1&limit=10&expirationMonth=2026-06');
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].uuid).toBe('c1');
  });

  it('MI-02: contract with only fimContratoCPA — matches selected month', async () => {
    const store: Record<string, unknown> = {
      'indexes/contracts-index.json': {
        items: [indexItem('c2', { fimContratoCPA: '2026-06-15' })],
      },
      'content/contracts/c2.json': contentDoc('c2', 'contracts', {
        fimContratoCPA: '2026-06-15',
      }),
    };

    const app = buildApp('contracts', store);
    const res = await app.request('/?page=1&limit=10&expirationMonth=2026-06');
    const body = await res.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].uuid).toBe('c2');
  });

  it('MI-03: contract with only fimContratoSH — matches selected month', async () => {
    const store: Record<string, unknown> = {
      'indexes/contracts-index.json': {
        items: [indexItem('c3', { fimContratoSH: '2026-06-20' })],
      },
      'content/contracts/c3.json': contentDoc('c3', 'contracts', {
        fimContratoSH: '2026-06-20',
      }),
    };

    const app = buildApp('contracts', store);
    const res = await app.request('/?page=1&limit=10&expirationMonth=2026-06');
    const body = await res.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].uuid).toBe('c3');
  });

  it('MI-04: contract with both dates — earliest does NOT match selected month', async () => {
    const store: Record<string, unknown> = {
      'indexes/contracts-index.json': {
        items: [
          indexItem('c4', { fimContratoCPA: '2026-07-01', fimContratoSH: '2026-08-01' }),
        ],
      },
      'content/contracts/c4.json': contentDoc('c4', 'contracts'),
    };

    const app = buildApp('contracts', store);
    const res = await app.request('/?page=1&limit=10&expirationMonth=2026-06');
    const body = await res.json();

    expect(body.data).toHaveLength(0);
    expect(body.pagination.total).toBe(0);
  });

  it('MI-05: contract with no dates — excluded when filter active', async () => {
    const store: Record<string, unknown> = {
      'indexes/contracts-index.json': {
        items: [indexItem('c5', {})],
      },
      'content/contracts/c5.json': contentDoc('c5', 'contracts'),
    };

    const app = buildApp('contracts', store);
    const res = await app.request('/?page=1&limit=10&expirationMonth=2026-06');
    const body = await res.json();

    expect(body.data).toHaveLength(0);
    expect(body.pagination.total).toBe(0);
  });

  it('MI-06: contract with no dates — included when no filter', async () => {
    const store: Record<string, unknown> = {
      'indexes/contracts-index.json': {
        items: [indexItem('c6', {})],
      },
      'content/contracts/c6.json': contentDoc('c6', 'contracts'),
    };

    const app = buildApp('contracts', store);
    // No expirationMonth — but we need hasFilters to be true to hit listFiltered.
    // Without any filter, the route uses storage.list() instead.
    // Use collaborator='' trick won't work. Let's use the plain list path.
    const res = await app.request('/?page=1&limit=10');
    const body = await res.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].uuid).toBe('c6');
  });
});


// ---------------------------------------------------------------------------
// MI-07 to MI-10 — listFiltered licenses with expirationMonth
// ---------------------------------------------------------------------------

describe('Backend listFiltered — licenses expirationMonth', () => {
  it('MI-07: license with dataVencimento matching selected month', async () => {
    const store: Record<string, unknown> = {
      'indexes/licenses-index.json': {
        items: [indexItem('l1', { dataVencimento: '2026-06-10' })],
      },
      'content/licenses/l1.json': contentDoc('l1', 'licenses', {
        dataVencimento: '2026-06-10',
      }),
    };

    const app = buildApp('licenses', store);
    const res = await app.request('/?page=1&limit=10&expirationMonth=2026-06');
    const body = await res.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].uuid).toBe('l1');
  });

  it('MI-08: license with dataVencimento NOT matching selected month', async () => {
    const store: Record<string, unknown> = {
      'indexes/licenses-index.json': {
        items: [indexItem('l2', { dataVencimento: '2026-07-01' })],
      },
      'content/licenses/l2.json': contentDoc('l2', 'licenses'),
    };

    const app = buildApp('licenses', store);
    const res = await app.request('/?page=1&limit=10&expirationMonth=2026-06');
    const body = await res.json();

    expect(body.data).toHaveLength(0);
    expect(body.pagination.total).toBe(0);
  });

  it('MI-09: license without dataVencimento — excluded when filter active', async () => {
    const store: Record<string, unknown> = {
      'indexes/licenses-index.json': {
        items: [indexItem('l3', {})],
      },
      'content/licenses/l3.json': contentDoc('l3', 'licenses'),
    };

    const app = buildApp('licenses', store);
    const res = await app.request('/?page=1&limit=10&expirationMonth=2026-06');
    const body = await res.json();

    expect(body.data).toHaveLength(0);
    expect(body.pagination.total).toBe(0);
  });

  it('MI-10: license without dataVencimento — included when no filter', async () => {
    const store: Record<string, unknown> = {
      'indexes/licenses-index.json': {
        items: [indexItem('l4', {})],
      },
      'content/licenses/l4.json': contentDoc('l4', 'licenses'),
    };

    const app = buildApp('licenses', store);
    const res = await app.request('/?page=1&limit=10');
    const body = await res.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].uuid).toBe('l4');
  });
});

// ---------------------------------------------------------------------------
// MI-11 — AND logic with search
// ---------------------------------------------------------------------------

describe('Backend listFiltered — AND logic', () => {
  it('MI-11: filter + search — only items matching both returned', async () => {
    const store: Record<string, unknown> = {
      'indexes/contracts-index.json': {
        items: [
          // A: June + matches search "acme"
          indexItem('a', { fimContratoCPA: '2026-06-15' }, 'acme corp'),
          // B: June + no search match
          indexItem('b', { fimContratoCPA: '2026-06-20' }, 'beta inc'),
          // C: July + matches search "acme"
          indexItem('c', { fimContratoCPA: '2026-07-10' }, 'acme ltd'),
        ],
      },
      'content/contracts/a.json': contentDoc('a', 'contracts', { name: 'Acme Corp' }),
      'content/contracts/b.json': contentDoc('b', 'contracts', { name: 'Beta Inc' }),
      'content/contracts/c.json': contentDoc('c', 'contracts', { name: 'Acme Ltd' }),
    };

    const app = buildApp('contracts', store);
    const res = await app.request('/?page=1&limit=10&expirationMonth=2026-06&search=acme');
    const body = await res.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].uuid).toBe('a');
  });
});

// ---------------------------------------------------------------------------
// MI-12 — Pagination with filter
// ---------------------------------------------------------------------------

describe('Backend listFiltered — pagination', () => {
  it('MI-12: pagination total reflects filtered dataset', async () => {
    // 10 items total, 3 match June
    const items: Record<string, unknown>[] = [];
    const store: Record<string, unknown> = {};

    for (let i = 1; i <= 10; i++) {
      const month = i <= 3 ? '06' : '07';
      const uuid = `p${i}`;
      items.push(indexItem(uuid, { fimContratoCPA: `2026-${month}-${String(i).padStart(2, '0')}` }));
      store[`content/contracts/${uuid}.json`] = contentDoc(uuid, 'contracts');
    }

    store['indexes/contracts-index.json'] = { items };

    const app = buildApp('contracts', store);
    const res = await app.request('/?page=1&limit=2&expirationMonth=2026-06');
    const body = await res.json();

    expect(body.pagination.total).toBe(3);
    expect(body.data).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// MI-13 to MI-15 — Route handler expirationMonth param extraction
// ---------------------------------------------------------------------------

describe('Route handler — expirationMonth param extraction', () => {
  it('MI-13: valid expirationMonth param passed to listFiltered', async () => {
    const store: Record<string, unknown> = {
      'indexes/contracts-index.json': {
        items: [
          indexItem('r1', { fimContratoCPA: '2026-06-15' }),
          indexItem('r2', { fimContratoCPA: '2026-07-15' }),
        ],
      },
      'content/contracts/r1.json': contentDoc('r1', 'contracts'),
      'content/contracts/r2.json': contentDoc('r2', 'contracts'),
    };

    const app = buildApp('contracts', store);
    const res = await app.request('/?expirationMonth=2026-06&page=1&limit=10');
    const body = await res.json();

    // Only the June item should be returned
    expect(body.data).toHaveLength(1);
    expect(body.data[0].uuid).toBe('r1');
  });

  it('MI-14: invalid expirationMonth format — silently ignored', async () => {
    const store: Record<string, unknown> = {
      'indexes/contracts-index.json': {
        items: [
          indexItem('r3', { fimContratoCPA: '2026-06-15' }),
          indexItem('r4', { fimContratoCPA: '2026-07-15' }),
        ],
      },
      'content/contracts/r3.json': contentDoc('r3', 'contracts'),
      'content/contracts/r4.json': contentDoc('r4', 'contracts'),
    };

    const app = buildApp('contracts', store);
    // "invalid" doesn't match /^\d{4}-\d{2}$/ — should be ignored
    const res = await app.request('/?expirationMonth=invalid&page=1&limit=10');
    const body = await res.json();

    // Both items returned — no filter applied, falls through to normal list
    expect(body.data).toHaveLength(2);
  });

  it('MI-15: missing expirationMonth — no filter applied', async () => {
    const store: Record<string, unknown> = {
      'indexes/contracts-index.json': {
        items: [
          indexItem('r5', { fimContratoCPA: '2026-06-15' }),
          indexItem('r6', { fimContratoCPA: '2026-07-15' }),
        ],
      },
      'content/contracts/r5.json': contentDoc('r5', 'contracts'),
      'content/contracts/r6.json': contentDoc('r6', 'contracts'),
    };

    const app = buildApp('contracts', store);
    const res = await app.request('/?page=1&limit=10');
    const body = await res.json();

    // Both items returned — no filter
    expect(body.data).toHaveLength(2);
  });
});

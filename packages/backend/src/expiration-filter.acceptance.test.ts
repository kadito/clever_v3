/**
 * Acceptance tests for expiration date filter — Backend
 * Tests MA-08 through MA-14, MA-17, MA-19 through MA-27
 *
 * End-to-end acceptance tests exercising the full Hono route handler
 * with mock R2 bucket, covering filter parameter behavior, contracts/licenses
 * filtering, clear filter, empty results, items without expiration, and
 * coexistence with search and pagination.
 */

import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import { createContentRoutes } from './routes/content-route-template';
import type { ContentRouteConfig } from './routes/content-route-template';
import type { BaseContent, StorageBucket, StorageObject } from '@clever/shared';

// ---------------------------------------------------------------------------
// Mock auth middleware
// ---------------------------------------------------------------------------

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
// Helpers
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

function contentDoc(
  uuid: string,
  contentType: string,
  data: Record<string, unknown> = {}
): Record<string, unknown> {
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
  app.use('*', async (c, next) => {
    c.env = { R2_BUCKET: bucket };
    await next();
  });
  app.route('/', routes);
  return app;
}


// ---------------------------------------------------------------------------
// MA-08 — Backend filter parameter: request includes expirationMonth
// ---------------------------------------------------------------------------

describe('MA — Backend filter parameter behavior', () => {
  it('MA-08: request with expirationMonth=2026-06 filters results to June items only', async () => {
    const store: Record<string, unknown> = {
      'indexes/contracts-index.json': {
        items: [
          indexItem('c1', { fimContratoCPA: '2026-06-15' }),
          indexItem('c2', { fimContratoCPA: '2026-07-10' }),
          indexItem('c3', { fimContratoSH: '2026-06-28' }),
        ],
      },
      'content/contracts/c1.json': contentDoc('c1', 'contracts'),
      'content/contracts/c2.json': contentDoc('c2', 'contracts'),
      'content/contracts/c3.json': contentDoc('c3', 'contracts'),
    };

    const app = buildApp('contracts', store);
    const res = await app.request('/?page=1&limit=10&expirationMonth=2026-06');
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    // Only c1 and c3 match June 2026
    expect(body.data).toHaveLength(2);
    const uuids = body.data.map((d: { uuid: string }) => d.uuid);
    expect(uuids).toContain('c1');
    expect(uuids).toContain('c3');
  });

  it('MA-09: backend filters index before pagination', async () => {
    // 6 items total, 3 match June. With limit=2, page 1 should have 2 items, total=3
    const items: Record<string, unknown>[] = [];
    const store: Record<string, unknown> = {};

    for (let i = 1; i <= 6; i++) {
      const month = i <= 3 ? '06' : '08';
      const uuid = `f${i}`;
      items.push(indexItem(uuid, { fimContratoCPA: `2026-${month}-${String(i + 10).padStart(2, '0')}` }));
      store[`content/contracts/${uuid}.json`] = contentDoc(uuid, 'contracts');
    }
    store['indexes/contracts-index.json'] = { items };

    const app = buildApp('contracts', store);
    const res = await app.request('/?page=1&limit=2&expirationMonth=2026-06');
    const body = await res.json();

    expect(body.data).toHaveLength(2);
    expect(body.pagination.total).toBe(3);
  });

  it('MA-10: pagination total reflects filtered count (5 out of 100)', async () => {
    const items: Record<string, unknown>[] = [];
    const store: Record<string, unknown> = {};

    for (let i = 1; i <= 100; i++) {
      const month = i <= 5 ? '06' : '09';
      const uuid = `p${i}`;
      items.push(indexItem(uuid, { fimContratoCPA: `2026-${month}-15` }));
      store[`content/contracts/${uuid}.json`] = contentDoc(uuid, 'contracts');
    }
    store['indexes/contracts-index.json'] = { items };

    const app = buildApp('contracts', store);
    const res = await app.request('/?page=1&limit=10&expirationMonth=2026-06');
    const body = await res.json();

    expect(body.pagination.total).toBe(5);
  });

  it('MA-11: search + expirationMonth — AND logic, only items matching both returned', async () => {
    const store: Record<string, unknown> = {
      'indexes/contracts-index.json': {
        items: [
          indexItem('a', { fimContratoCPA: '2026-06-15' }, 'abc corp'),
          indexItem('b', { fimContratoCPA: '2026-06-20' }, 'xyz inc'),
          indexItem('c', { fimContratoCPA: '2026-07-10' }, 'abc ltd'),
          indexItem('d', { fimContratoCPA: '2026-07-05' }, 'xyz co'),
        ],
      },
      'content/contracts/a.json': contentDoc('a', 'contracts'),
      'content/contracts/b.json': contentDoc('b', 'contracts'),
      'content/contracts/c.json': contentDoc('c', 'contracts'),
      'content/contracts/d.json': contentDoc('d', 'contracts'),
    };

    const app = buildApp('contracts', store);
    const res = await app.request('/?page=1&limit=10&expirationMonth=2026-06&search=abc');
    const body = await res.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].uuid).toBe('a');
  });
});


// ---------------------------------------------------------------------------
// MA-12 to MA-14 — Contracts filtering behavior
// ---------------------------------------------------------------------------

describe('MA — Contracts filtering behavior', () => {
  it('MA-12: contract with both dates — earliest (June) used for match', async () => {
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

    expect(body.data).toHaveLength(1);
    expect(body.data[0].uuid).toBe('c1');
  });

  it('MA-13: contract with only fimContratoSH=2026-06-20 — included for June', async () => {
    const store: Record<string, unknown> = {
      'indexes/contracts-index.json': {
        items: [indexItem('c2', { fimContratoSH: '2026-06-20' })],
      },
      'content/contracts/c2.json': contentDoc('c2', 'contracts', {
        fimContratoSH: '2026-06-20',
      }),
    };

    const app = buildApp('contracts', store);
    const res = await app.request('/?page=1&limit=10&expirationMonth=2026-06');
    const body = await res.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].uuid).toBe('c2');
  });

  it('MA-14: contract expiring July 2026 — NOT included when filtering June', async () => {
    const store: Record<string, unknown> = {
      'indexes/contracts-index.json': {
        items: [indexItem('c3', { fimContratoCPA: '2026-07-01', fimContratoSH: '2026-09-01' })],
      },
      'content/contracts/c3.json': contentDoc('c3', 'contracts'),
    };

    const app = buildApp('contracts', store);
    const res = await app.request('/?page=1&limit=10&expirationMonth=2026-06');
    const body = await res.json();

    expect(body.data).toHaveLength(0);
    expect(body.pagination.total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// MA-15 to MA-16 — Licenses filtering behavior (backend side)
// ---------------------------------------------------------------------------

describe('MA — Licenses filtering behavior', () => {
  it('MA-15: license with dataVencimento=2026-06-10 — included for June', async () => {
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

  it('MA-16: license with dataVencimento=2026-07-01 — NOT included for June', async () => {
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
});


// ---------------------------------------------------------------------------
// MA-17, MA-19 — Clear filter behavior (backend perspective)
// ---------------------------------------------------------------------------

describe('MA — Clear filter behavior (backend)', () => {
  it('MA-17: without expirationMonth param — all items returned (paginated)', async () => {
    const store: Record<string, unknown> = {
      'indexes/contracts-index.json': {
        items: [
          indexItem('c1', { fimContratoCPA: '2026-06-15' }),
          indexItem('c2', { fimContratoCPA: '2026-07-10' }),
          indexItem('c3', {}),
        ],
      },
      'content/contracts/c1.json': contentDoc('c1', 'contracts'),
      'content/contracts/c2.json': contentDoc('c2', 'contracts'),
      'content/contracts/c3.json': contentDoc('c3', 'contracts'),
    };

    const app = buildApp('contracts', store);
    // No expirationMonth — full list
    const res = await app.request('/?page=1&limit=10');
    const body = await res.json();

    expect(body.data).toHaveLength(3);
    expect(body.pagination.total).toBe(3);
  });

  it('MA-19: request without expirationMonth does not include filter param', async () => {
    const store: Record<string, unknown> = {
      'indexes/contracts-index.json': {
        items: [
          indexItem('c1', { fimContratoCPA: '2026-06-15' }),
          indexItem('c2', {}),
        ],
      },
      'content/contracts/c1.json': contentDoc('c1', 'contracts'),
      'content/contracts/c2.json': contentDoc('c2', 'contracts'),
    };

    const app = buildApp('contracts', store);
    // First: filter active — only c1 returned
    const filteredRes = await app.request('/?page=1&limit=10&expirationMonth=2026-06');
    const filteredBody = await filteredRes.json();
    expect(filteredBody.data).toHaveLength(1);

    // Then: filter cleared — both returned
    const clearedRes = await app.request('/?page=1&limit=10');
    const clearedBody = await clearedRes.json();
    expect(clearedBody.data).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// MA-20 to MA-21 — Empty results
// ---------------------------------------------------------------------------

describe('MA — Empty results', () => {
  it('MA-20: no items match selected month — empty data array', async () => {
    const store: Record<string, unknown> = {
      'indexes/contracts-index.json': {
        items: [
          indexItem('c1', { fimContratoCPA: '2026-09-15' }),
          indexItem('c2', { fimContratoCPA: '2026-10-20' }),
        ],
      },
      'content/contracts/c1.json': contentDoc('c1', 'contracts'),
      'content/contracts/c2.json': contentDoc('c2', 'contracts'),
    };

    const app = buildApp('contracts', store);
    const res = await app.request('/?page=1&limit=10&expirationMonth=2026-06');
    const body = await res.json();

    expect(body.data).toHaveLength(0);
  });

  it('MA-21: no items match — pagination total is zero', async () => {
    const store: Record<string, unknown> = {
      'indexes/licenses-index.json': {
        items: [
          indexItem('l1', { dataVencimento: '2026-09-15' }),
        ],
      },
      'content/licenses/l1.json': contentDoc('l1', 'licenses'),
    };

    const app = buildApp('licenses', store);
    const res = await app.request('/?page=1&limit=10&expirationMonth=2026-06');
    const body = await res.json();

    expect(body.pagination.total).toBe(0);
    expect(body.data).toHaveLength(0);
  });
});


// ---------------------------------------------------------------------------
// MA-22 to MA-23 — Items without expiration date
// ---------------------------------------------------------------------------

describe('MA — Items without expiration date', () => {
  it('MA-22: items without expiration excluded when filter active', async () => {
    const store: Record<string, unknown> = {
      'indexes/contracts-index.json': {
        items: [
          indexItem('c1', { fimContratoCPA: '2026-06-15' }),
          indexItem('c2', {}), // no expiration
          indexItem('c3', { fimContratoSH: '2026-06-20' }),
        ],
      },
      'content/contracts/c1.json': contentDoc('c1', 'contracts'),
      'content/contracts/c2.json': contentDoc('c2', 'contracts'),
      'content/contracts/c3.json': contentDoc('c3', 'contracts'),
    };

    const app = buildApp('contracts', store);
    const res = await app.request('/?page=1&limit=10&expirationMonth=2026-06');
    const body = await res.json();

    expect(body.data).toHaveLength(2);
    const uuids = body.data.map((d: { uuid: string }) => d.uuid);
    expect(uuids).not.toContain('c2');
  });

  it('MA-23: items without expiration included when no filter active', async () => {
    const store: Record<string, unknown> = {
      'indexes/contracts-index.json': {
        items: [
          indexItem('c1', { fimContratoCPA: '2026-06-15' }),
          indexItem('c2', {}), // no expiration
        ],
      },
      'content/contracts/c1.json': contentDoc('c1', 'contracts'),
      'content/contracts/c2.json': contentDoc('c2', 'contracts'),
    };

    const app = buildApp('contracts', store);
    const res = await app.request('/?page=1&limit=10');
    const body = await res.json();

    expect(body.data).toHaveLength(2);
    const uuids = body.data.map((d: { uuid: string }) => d.uuid);
    expect(uuids).toContain('c2');
  });
});

// ---------------------------------------------------------------------------
// MA-24 to MA-27 — Coexistence with search and pagination
// ---------------------------------------------------------------------------

describe('MA — Coexistence with search and pagination', () => {
  it('MA-24: search + expiration filter apply simultaneously', async () => {
    const store: Record<string, unknown> = {
      'indexes/licenses-index.json': {
        items: [
          indexItem('l1', { dataVencimento: '2026-06-10' }, 'acme software'),
          indexItem('l2', { dataVencimento: '2026-06-20' }, 'beta tools'),
          indexItem('l3', { dataVencimento: '2026-07-15' }, 'acme cloud'),
        ],
      },
      'content/licenses/l1.json': contentDoc('l1', 'licenses'),
      'content/licenses/l2.json': contentDoc('l2', 'licenses'),
      'content/licenses/l3.json': contentDoc('l3', 'licenses'),
    };

    const app = buildApp('licenses', store);
    const res = await app.request('/?page=1&limit=10&expirationMonth=2026-06&search=acme');
    const body = await res.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].uuid).toBe('l1');
  });

  it('MA-25: search + filter — only items matching both criteria shown', async () => {
    const store: Record<string, unknown> = {
      'indexes/contracts-index.json': {
        items: [
          indexItem('a', { fimContratoCPA: '2026-06-15' }, 'alpha corp'),
          indexItem('b', { fimContratoCPA: '2026-06-20' }, 'beta inc'),
          indexItem('c', { fimContratoCPA: '2026-07-10' }, 'alpha ltd'),
          indexItem('d', { fimContratoCPA: '2026-08-05' }, 'gamma co'),
        ],
      },
      'content/contracts/a.json': contentDoc('a', 'contracts'),
      'content/contracts/b.json': contentDoc('b', 'contracts'),
      'content/contracts/c.json': contentDoc('c', 'contracts'),
      'content/contracts/d.json': contentDoc('d', 'contracts'),
    };

    const app = buildApp('contracts', store);
    const res = await app.request('/?page=1&limit=10&expirationMonth=2026-06&search=alpha');
    const body = await res.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].uuid).toBe('a');
    expect(body.pagination.total).toBe(1);
  });

  it('MA-26: expiration filter active — page 2 of filtered dataset', async () => {
    // 15 items match June, limit=10 → page 2 should have 5 items
    const items: Record<string, unknown>[] = [];
    const store: Record<string, unknown> = {};

    for (let i = 1; i <= 15; i++) {
      const uuid = `j${i}`;
      items.push(
        indexItem(uuid, { fimContratoCPA: `2026-06-${String(i).padStart(2, '0')}` })
      );
      store[`content/contracts/${uuid}.json`] = contentDoc(uuid, 'contracts');
    }
    // Add 5 non-matching items
    for (let i = 16; i <= 20; i++) {
      const uuid = `j${i}`;
      items.push(indexItem(uuid, { fimContratoCPA: `2026-09-01` }));
      store[`content/contracts/${uuid}.json`] = contentDoc(uuid, 'contracts');
    }
    store['indexes/contracts-index.json'] = { items };

    const app = buildApp('contracts', store);
    const res = await app.request('/?page=2&limit=10&expirationMonth=2026-06');
    const body = await res.json();

    expect(body.pagination.total).toBe(15);
    expect(body.data).toHaveLength(5);
  });

  it('MA-27: selecting filter resets to page 1 — page 1 of filtered results', async () => {
    // Simulate: user was on page 3 unfiltered, then applies filter → page 1
    const items: Record<string, unknown>[] = [];
    const store: Record<string, unknown> = {};

    for (let i = 1; i <= 30; i++) {
      const uuid = `r${i}`;
      const month = i <= 4 ? '06' : '08';
      items.push(indexItem(uuid, { fimContratoCPA: `2026-${month}-15` }));
      store[`content/contracts/${uuid}.json`] = contentDoc(uuid, 'contracts');
    }
    store['indexes/contracts-index.json'] = { items };

    const app = buildApp('contracts', store);

    // Unfiltered page 3 (limit=10)
    const unfilteredRes = await app.request('/?page=3&limit=10');
    const unfilteredBody = await unfilteredRes.json();
    expect(unfilteredBody.pagination.total).toBe(30);
    expect(unfilteredBody.data).toHaveLength(10);

    // Apply filter → page 1
    const filteredRes = await app.request('/?page=1&limit=10&expirationMonth=2026-06');
    const filteredBody = await filteredRes.json();
    expect(filteredBody.pagination.page).toBe(1);
    expect(filteredBody.pagination.total).toBe(4);
    expect(filteredBody.data).toHaveLength(4);
  });
});

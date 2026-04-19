/**
 * Integration tests for file upload, download, and deletion endpoints.
 * Tests MI-IT-01 to MI-IT-11
 *
 * Covers:
 * - Upload valid files (MI-IT-01, MI-IT-02)
 * - Reject invalid MIME type (MI-IT-03)
 * - Reject oversized file (MI-IT-04)
 * - Content not found on upload (MI-IT-05)
 * - R2 key prefix correctness (MI-IT-06)
 * - Content data updated with FileReference (MI-IT-07)
 * - Download existing file (MI-IT-08)
 * - Download non-existent file (MI-IT-09)
 * - Delete existing file (MI-IT-10)
 * - Delete non-existent file (MI-IT-11)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import fileRoutes from '../routes/file-routes';
import {
  createContentRoutes,
  createStandardContentConfig,
} from '../routes/content-route-template';
import type { BaseContent } from '@clever/shared';

// Mock auth middleware
vi.mock('../middleware/clerk', () => ({
  requireAuth: async (_c: unknown, next: () => Promise<void>) => next(),
  requireUserContext: () => ({
    userId: 'test-user',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    userType: 'Admin' as const,
    sessionId: 'sess-1',
    isAuthenticated: true,
  }),
}));

// Mock permissions middleware (needed for content DELETE route)
vi.mock('../middleware/permissions', () => ({
  requireDeletePermission: async (_c: unknown, next: () => Promise<void>) => next(),
}));

// ---------------------------------------------------------------------------
// In-memory R2 mock that supports both string (JSON) and ArrayBuffer (files)
// ---------------------------------------------------------------------------

interface StoredObject {
  body: ArrayBuffer | string;
  httpMetadata?: { contentType?: string };
}

function createMockR2(store: Map<string, StoredObject> = new Map()) {
  return {
    store,
    get: async (key: string) => {
      const obj = store.get(key);
      if (!obj) return null;
      const body =
        typeof obj.body === 'string'
          ? new TextEncoder().encode(obj.body).buffer
          : obj.body;
      return {
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(body as ArrayBuffer));
            controller.close();
          },
        }),
        httpMetadata: obj.httpMetadata,
        json: async () => JSON.parse(typeof obj.body === 'string' ? obj.body : new TextDecoder().decode(obj.body as ArrayBuffer)),
      };
    },
    put: async (
      key: string,
      value: ArrayBuffer | string,
      options?: { httpMetadata?: { contentType?: string } }
    ) => {
      store.set(key, { body: value, httpMetadata: options?.httpMetadata });
      return {};
    },
    delete: async (key: string) => {
      store.delete(key);
    },
    list: async (opts: { prefix: string }) => {
      const objects = [...store.keys()]
        .filter((k) => k.startsWith(opts.prefix))
        .map((key) => ({ key }));
      return { objects };
    },
  };
}

// ---------------------------------------------------------------------------
// Helper: build Hono app with mock R2
// ---------------------------------------------------------------------------

function buildApp(r2: ReturnType<typeof createMockR2>): Hono {
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.env = { R2_BUCKET: r2 };
    await next();
  });
  app.route('/content', fileRoutes);
  return app;
}

/** Seed a content record in the mock store */
function seedContent(
  r2: ReturnType<typeof createMockR2>,
  type: string,
  uuid: string,
  data: Record<string, unknown> = {}
): void {
  const content = {
    uuid,
    contentType: type,
    createdAt: '2025-01-01T00:00:00.000Z',
    createdBy: 'seed',
    updatedAt: '2025-01-01T00:00:00.000Z',
    updatedBy: 'seed',
    version: 1,
    isDeleted: false,
    data,
  };
  r2.store.set(
    `content/${type}/${uuid}.json`,
    { body: JSON.stringify(content, null, 2) }
  );
}

/** Create a multipart FormData body with files */
function buildFormData(
  files: { name: string; type: string; content: Uint8Array }[],
  fieldName: string
): FormData {
  const fd = new FormData();
  fd.append('fieldName', fieldName);
  for (const f of files) {
    fd.append('files', new File([f.content], f.name, { type: f.type }));
  }
  return fd;
}

/** Small helper to make a 2 MB buffer */
function makeBuffer(sizeBytes: number): Uint8Array {
  return new Uint8Array(sizeBytes);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const TEST_UUID = '11111111-1111-1111-1111-111111111111';
const TYPE = 'installations-programming';

describe('File endpoints — upload', () => {
  let r2: ReturnType<typeof createMockR2>;
  let app: Hono;

  beforeEach(() => {
    r2 = createMockR2();
    app = buildApp(r2);
  });

  it('MI-IT-01: upload valid image file returns FileReference[]', async () => {
    seedContent(r2, TYPE, TEST_UUID, { fotos_instalacao: [] });

    const fd = buildFormData(
      [{ name: 'photo.jpg', type: 'image/jpeg', content: makeBuffer(2_000_000) }],
      'fotos_instalacao'
    );

    const res = await app.request(
      `/content/${TYPE}/${TEST_UUID}/files`,
      { method: 'POST', body: fd }
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean; data: FileReference[] };
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);

    const ref = json.data[0];
    expect(ref.key).toMatch(/^files\/installations-programming\/.*\.jpg$/);
    expect(ref.name).toBe('photo.jpg');
    expect(ref.mimeType).toBe('image/jpeg');
    expect(ref.size).toBe(2_000_000);
  });

  it('MI-IT-02: upload multiple valid files returns array of 3 FileReferences', async () => {
    seedContent(r2, TYPE, TEST_UUID, { fotos_instalacao: [] });

    const fd = buildFormData(
      [
        { name: 'a.jpg', type: 'image/jpeg', content: makeBuffer(1000) },
        { name: 'b.png', type: 'image/png', content: makeBuffer(2000) },
        { name: 'c.pdf', type: 'application/pdf', content: makeBuffer(3000) },
      ],
      'fotos_instalacao'
    );

    const res = await app.request(
      `/content/${TYPE}/${TEST_UUID}/files`,
      { method: 'POST', body: fd }
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean; data: FileReference[] };
    expect(json.data).toHaveLength(3);
    expect(json.data[0].mimeType).toBe('image/jpeg');
    expect(json.data[1].mimeType).toBe('image/png');
    expect(json.data[2].mimeType).toBe('application/pdf');
  });

  it('MI-IT-03: reject unsupported MIME type', async () => {
    seedContent(r2, TYPE, TEST_UUID, {});

    const fd = buildFormData(
      [{ name: 'virus.exe', type: 'application/x-msdownload', content: makeBuffer(100) }],
      'fotos_instalacao'
    );

    const res = await app.request(
      `/content/${TYPE}/${TEST_UUID}/files`,
      { method: 'POST', body: fd }
    );

    expect(res.status).toBe(400);
    const json = (await res.json()) as { success: boolean; error: { message: string } };
    expect(json.error.message).toContain('Tipo de ficheiro não suportado');
    expect(json.error.message).toContain('application/x-msdownload');
  });

  it('MI-IT-04: reject file exceeding 10 MB', async () => {
    seedContent(r2, TYPE, TEST_UUID, {});

    const fd = buildFormData(
      [{ name: 'huge.jpg', type: 'image/jpeg', content: makeBuffer(15_000_000) }],
      'fotos_instalacao'
    );

    const res = await app.request(
      `/content/${TYPE}/${TEST_UUID}/files`,
      { method: 'POST', body: fd }
    );

    expect(res.status).toBe(400);
    const json = (await res.json()) as { success: boolean; error: { message: string } };
    expect(json.error.message).toContain('tamanho máximo de 10 MB');
  });

  it('MI-IT-05: content not found returns 404', async () => {
    // No content seeded
    const fd = buildFormData(
      [{ name: 'a.jpg', type: 'image/jpeg', content: makeBuffer(100) }],
      'fotos_instalacao'
    );

    const res = await app.request(
      `/content/${TYPE}/${TEST_UUID}/files`,
      { method: 'POST', body: fd }
    );

    expect(res.status).toBe(404);
    const json = (await res.json()) as { success: boolean; error: { message: string } };
    expect(json.error.message).toBe('Conteúdo não encontrado');
  });

  it('MI-IT-06: file stored with correct R2 key prefix', async () => {
    seedContent(r2, TYPE, TEST_UUID, { ficheiros: [] });

    const fd = buildFormData(
      [{ name: 'doc.pdf', type: 'application/pdf', content: makeBuffer(500) }],
      'ficheiros'
    );

    await app.request(
      `/content/${TYPE}/${TEST_UUID}/files`,
      { method: 'POST', body: fd }
    );

    // Find the file key in the store
    const fileKeys = [...r2.store.keys()].filter((k) => k.startsWith('files/'));
    expect(fileKeys).toHaveLength(1);
    expect(fileKeys[0]).toMatch(
      new RegExp(`^files/${TYPE}/${TEST_UUID}/[0-9a-f-]+\\.pdf$`)
    );
  });

  it('MI-IT-07: content data updated with FileReference in indicated field', async () => {
    seedContent(r2, TYPE, TEST_UUID, { ficheiros: [] });

    const fd = buildFormData(
      [{ name: 'img.png', type: 'image/png', content: makeBuffer(800) }],
      'ficheiros'
    );

    await app.request(
      `/content/${TYPE}/${TEST_UUID}/files`,
      { method: 'POST', body: fd }
    );

    // Read content back from store
    const stored = r2.store.get(`content/${TYPE}/${TEST_UUID}.json`);
    expect(stored).toBeDefined();
    const content = JSON.parse(stored!.body as string) as {
      data: { ficheiros: FileReference[] };
      version: number;
    };
    expect(content.data.ficheiros).toHaveLength(1);
    expect(content.data.ficheiros[0].name).toBe('img.png');
    expect(content.version).toBe(2);
  });

  it('MI-IT-07d: dot-notation fieldName sets nested field correctly', async () => {
    seedContent(r2, TYPE, TEST_UUID, { phase5: { dumpLido: true, fotoURL: null } });

    const fd = buildFormData(
      [{ name: 'photo.jpg', type: 'image/jpeg', content: makeBuffer(500) }],
      'phase5.fotoURL'
    );

    const res = await app.request(
      `/content/${TYPE}/${TEST_UUID}/files`,
      { method: 'POST', body: fd }
    );

    expect(res.status).toBe(200);

    // Read content back from store
    const stored = r2.store.get(`content/${TYPE}/${TEST_UUID}.json`);
    expect(stored).toBeDefined();
    const content = JSON.parse(stored!.body as string) as {
      data: { phase5: { dumpLido: boolean; fotoURL: FileReference } };
    };
    // Should be nested inside phase5, NOT a literal "phase5.fotoURL" key
    expect(content.data.phase5.fotoURL).toBeDefined();
    expect(content.data.phase5.fotoURL.name).toBe('photo.jpg');
    expect(content.data.phase5.dumpLido).toBe(true);
    // Should NOT have a literal "phase5.fotoURL" key at top level
    expect((content.data as Record<string, unknown>)['phase5.fotoURL']).toBeUndefined();
  });

  it('MI-IT-07b: rejects upload when fieldName is missing', async () => {
    seedContent(r2, TYPE, TEST_UUID, {});

    const fd = new FormData();
    fd.append('files', new File([makeBuffer(100)], 'a.jpg', { type: 'image/jpeg' }));
    // No fieldName

    const res = await app.request(
      `/content/${TYPE}/${TEST_UUID}/files`,
      { method: 'POST', body: fd }
    );

    expect(res.status).toBe(400);
    const json = (await res.json()) as { success: boolean; error: { message: string } };
    expect(json.error.message).toContain("Campo 'fieldName' é obrigatório");
  });

  it('MI-IT-07c: rejects upload when no files sent', async () => {
    seedContent(r2, TYPE, TEST_UUID, {});

    const fd = new FormData();
    fd.append('fieldName', 'ficheiros');
    // No files

    const res = await app.request(
      `/content/${TYPE}/${TEST_UUID}/files`,
      { method: 'POST', body: fd }
    );

    expect(res.status).toBe(400);
    const json = (await res.json()) as { success: boolean; error: { message: string } };
    expect(json.error.message).toContain('Nenhum ficheiro enviado');
  });
});

describe('File endpoints — download', () => {
  let r2: ReturnType<typeof createMockR2>;
  let app: Hono;

  beforeEach(() => {
    r2 = createMockR2();
    app = buildApp(r2);
  });

  it('MI-IT-08: download existing file returns binary with correct Content-Type', async () => {
    // Seed a file directly in R2
    const fileContent = new TextEncoder().encode('hello world');
    r2.store.set(`files/${TYPE}/${TEST_UUID}/abc.jpg`, {
      body: fileContent.buffer as ArrayBuffer,
      httpMetadata: { contentType: 'image/jpeg' },
    });

    const res = await app.request(
      `/content/${TYPE}/${TEST_UUID}/files/abc.jpg`,
      { method: 'GET' }
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/jpeg');
    const body = await res.arrayBuffer();
    expect(new Uint8Array(body)).toEqual(fileContent);
  });

  it('MI-IT-09: download non-existent file returns 404', async () => {
    const res = await app.request(
      `/content/${TYPE}/${TEST_UUID}/files/nonexistent.jpg`,
      { method: 'GET' }
    );

    expect(res.status).toBe(404);
    const json = (await res.json()) as { success: boolean; error: { message: string } };
    expect(json.error.message).toBe('Ficheiro não encontrado');
  });
});

describe('File endpoints — delete', () => {
  let r2: ReturnType<typeof createMockR2>;
  let app: Hono;

  beforeEach(() => {
    r2 = createMockR2();
    app = buildApp(r2);
  });

  it('MI-IT-10: delete existing file removes from R2 and content data', async () => {
    const fileKey = 'abc-def.jpg';
    const r2Key = `files/${TYPE}/${TEST_UUID}/${fileKey}`;

    // Seed file in R2
    r2.store.set(r2Key, {
      body: new Uint8Array(100).buffer as ArrayBuffer,
      httpMetadata: { contentType: 'image/jpeg' },
    });

    // Seed content with reference to the file
    const fileRef: FileReference = {
      key: r2Key,
      name: 'photo.jpg',
      mimeType: 'image/jpeg',
      size: 100,
    };
    seedContent(r2, TYPE, TEST_UUID, { fotos_instalacao: [fileRef] });

    const res = await app.request(
      `/content/${TYPE}/${TEST_UUID}/files/${fileKey}`,
      { method: 'DELETE' }
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean };
    expect(json.success).toBe(true);

    // File removed from R2
    expect(r2.store.has(r2Key)).toBe(false);

    // Reference removed from content data
    const stored = r2.store.get(`content/${TYPE}/${TEST_UUID}.json`);
    const content = JSON.parse(stored!.body as string) as {
      data: { fotos_instalacao: FileReference[] };
    };
    expect(content.data.fotos_instalacao).toHaveLength(0);
  });

  it('MI-IT-11: delete non-existent file returns 404', async () => {
    const res = await app.request(
      `/content/${TYPE}/${TEST_UUID}/files/nonexistent.jpg`,
      { method: 'DELETE' }
    );

    expect(res.status).toBe(404);
    const json = (await res.json()) as { success: boolean; error: { message: string } };
    expect(json.error.message).toBe('Ficheiro não encontrado');
  });
});


// ---------------------------------------------------------------------------
// MI-IT-12: Content deletion with best-effort file cleanup
// Uses createContentRoutes (content-route-template) DELETE endpoint
// ---------------------------------------------------------------------------

interface FileReference {
  key: string;
  name: string;
  mimeType: string;
  size: number;
}

const VALID_UUID = '11111111-1111-4111-a111-111111111111';

function buildContentApp(r2: ReturnType<typeof createMockR2>): Hono {
  const contentRouter = createContentRoutes(
    createStandardContentConfig(TYPE as any)
  );
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.env = { R2_BUCKET: r2 };
    await next();
  });
  app.route(`/${TYPE}`, contentRouter);
  return app;
}

/** Seed content + index so ContentStorageService.delete works */
function seedContentWithIndex(
  r2: ReturnType<typeof createMockR2>,
  type: string,
  uuid: string,
  data: Record<string, unknown> = {}
): void {
  const content = {
    uuid,
    contentType: type,
    createdAt: '2025-01-01T00:00:00.000Z',
    createdBy: 'seed',
    updatedAt: '2025-01-01T00:00:00.000Z',
    updatedBy: 'seed',
    version: 1,
    isDeleted: false,
    data,
  };
  r2.store.set(`content/${type}/${uuid}.json`, {
    body: JSON.stringify(content, null, 2),
  });

  // Seed index so soft delete can update it
  const index = {
    contentType: type,
    lastUpdated: '2025-01-01T00:00:00.000Z',
    items: [
      {
        uuid,
        contentType: type,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        isDeleted: false,
        searchableText: '',
      },
    ],
  };
  r2.store.set(`indexes/${type}-index.json`, {
    body: JSON.stringify(index, null, 2),
  });
}

describe('Content deletion — best-effort file cleanup (MI-IT-12)', () => {
  let r2: ReturnType<typeof createMockR2>;
  let app: Hono;

  beforeEach(() => {
    r2 = createMockR2();
    app = buildContentApp(r2);
  });

  it('MI-IT-12a: deleting content removes associated files from R2', async () => {
    seedContentWithIndex(r2, TYPE, VALID_UUID, { fotos_instalacao: [] });

    // Seed 2 files under files/{type}/{uuid}/
    r2.store.set(`files/${TYPE}/${VALID_UUID}/photo1.jpg`, {
      body: new Uint8Array(100).buffer as ArrayBuffer,
      httpMetadata: { contentType: 'image/jpeg' },
    });
    r2.store.set(`files/${TYPE}/${VALID_UUID}/photo2.png`, {
      body: new Uint8Array(200).buffer as ArrayBuffer,
      httpMetadata: { contentType: 'image/png' },
    });

    const res = await app.request(`/${TYPE}/${VALID_UUID}`, { method: 'DELETE' });

    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean };
    expect(json.success).toBe(true);

    // Content is soft-deleted (still in store but isDeleted=true)
    const stored = r2.store.get(`content/${TYPE}/${VALID_UUID}.json`);
    expect(stored).toBeDefined();
    const content = JSON.parse(stored!.body as string) as { isDeleted: boolean };
    expect(content.isDeleted).toBe(true);

    // Files should be cleaned up
    expect(r2.store.has(`files/${TYPE}/${VALID_UUID}/photo1.jpg`)).toBe(false);
    expect(r2.store.has(`files/${TYPE}/${VALID_UUID}/photo2.png`)).toBe(false);
  });

  it('MI-IT-12b: file deletion failure does not block content deletion', async () => {
    seedContentWithIndex(r2, TYPE, VALID_UUID, { fotos_instalacao: [] });

    // Seed a file
    r2.store.set(`files/${TYPE}/${VALID_UUID}/photo.jpg`, {
      body: new Uint8Array(100).buffer as ArrayBuffer,
      httpMetadata: { contentType: 'image/jpeg' },
    });

    // Override delete to throw for file keys (simulating R2 failure)
    const originalDelete = r2.delete.bind(r2);
    r2.delete = async (key: string) => {
      if (key.startsWith('files/')) {
        throw new Error('Simulated R2 delete failure');
      }
      return originalDelete(key);
    };

    const res = await app.request(`/${TYPE}/${VALID_UUID}`, { method: 'DELETE' });

    // Content deletion still succeeds
    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean };
    expect(json.success).toBe(true);

    // Content is soft-deleted
    const stored = r2.store.get(`content/${TYPE}/${VALID_UUID}.json`);
    const content = JSON.parse(stored!.body as string) as { isDeleted: boolean };
    expect(content.isDeleted).toBe(true);
  });

  it('MI-IT-12c: content with no files deletes cleanly', async () => {
    seedContentWithIndex(r2, TYPE, VALID_UUID, { fotos_instalacao: [] });

    // No files seeded — just content

    const res = await app.request(`/${TYPE}/${VALID_UUID}`, { method: 'DELETE' });

    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean };
    expect(json.success).toBe(true);

    const stored = r2.store.get(`content/${TYPE}/${VALID_UUID}.json`);
    const content = JSON.parse(stored!.body as string) as { isDeleted: boolean };
    expect(content.isDeleted).toBe(true);
  });
});

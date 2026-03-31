import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import {
  readKvValue,
  transformRecord,
  migrateContracts,
} from './migrate-contracts';

// Mock fs/promises at module level — must return proper promises for .catch() chaining
vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

// --- Helpers ---

const ACCOUNT = 'test-account';
const NAMESPACE = 'test-namespace';
const BUCKET = 'test-bucket';
const TOKEN = 'test-token';

function mockResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  } as Response;
}

function makeLegacyRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'uuid-1',
    clienteId: 'client-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
    hasCPAContract: true,
    hasSHContract: false,
    modeloCPA: 'ModelX',
    numeroSerieCPA: 'SN-001',
    planIdCPA: 'plan-cpa-1',
    distanceCPA: 'under180km',
    modalidadePagamentoCPA: 'MENSAL',
    inicioContratoCPA: '2024-01-01',
    fimContratoCPA: '2025-01-01',
    horasAssistenciaAnual: 10,
    deslocacoesPorAno: 5,
    manutencoesPorAno: 3,
    ...overrides,
  };
}

function setEnvVars() {
  process.env.CF_API_TOKEN = TOKEN;
  process.env.CF_ACCOUNT_ID = ACCOUNT;
  process.env.R2_BUCKET_NAME = BUCKET;
  process.env.KV_NAMESPACE_ID = NAMESPACE;
}

function clearEnvVars() {
  delete process.env.CF_API_TOKEN;
  delete process.env.CF_ACCOUNT_ID;
  delete process.env.R2_BUCKET_NAME;
  delete process.env.KV_NAMESPACE_ID;
}

async function getWriteFileSpy() {
  const fs = await import('fs/promises');
  return fs.writeFile as Mock;
}

// --- Setup ---

beforeEach(async () => {
  vi.restoreAllMocks();
  // Re-apply fs/promises mock implementations after restoreAllMocks resets them
  const fs = await import('fs/promises');
  (fs.mkdir as Mock).mockResolvedValue(undefined);
  (fs.writeFile as Mock).mockResolvedValue(undefined);
});

afterEach(() => {
  clearEnvVars();
});


// ============================================================
// MA-AT-01 & MA-AT-02: Key retrieval (CA-01.1, CA-01.2)
// ============================================================

describe('CA-01: Key retrieval', () => {
  it('MA-AT-01: CA-01.1 — KV has 5 records, all 5 keys retrieved before transformation', async () => {
    setEnvVars();

    const records: Record<string, Record<string, unknown>> = {};
    for (let i = 0; i < 5; i++) {
      records[`contratos-${i}`] = makeLegacyRecord({ id: `uuid-${i}`, clienteId: `cli-${i}` });
    }

    const keysRetrieved: string[] = [];
    const transformCalls: string[] = [];

    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      if (url.includes('/keys?')) {
        const keys = Object.keys(records).map((name) => ({ name }));
        keysRetrieved.push(...keys.map((k) => k.name));
        return mockResponse({ result: keys, result_info: { count: keys.length, cursor: '' } });
      }
      for (const [key, value] of Object.entries(records)) {
        if (url.includes(`/values/${key}`)) {
          transformCalls.push(key);
          return mockResponse(value);
        }
      }
      if (opts?.method === 'PUT') return mockResponse({ success: true });
      if (url.includes('content/clients/')) {
        return mockResponse({ uuid: 'cli-0', data: { contractId: '' }, updatedAt: '2024-01-01T00:00:00Z' });
      }
      if (url.includes('indexes/')) return mockResponse({}, 404);
      return mockResponse({}, 404);
    }));

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await migrateContracts();

    expect(keysRetrieved).toHaveLength(5);
    expect(transformCalls).toHaveLength(5);
  });

  it('MA-AT-02: CA-01.2 — KV has no contract keys, script completes with 0/0', async () => {
    setEnvVars();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({
      result: [],
      result_info: { count: 0, cursor: '' },
    })));

    vi.spyOn(console, 'log').mockImplementation(() => {});

    await migrateContracts();

    const writeFileSpy = await getWriteFileSpy();
    const successCall = writeFileSpy.mock.calls.find((c: unknown[]) => (c[0] as string).includes('migration-success.json'));
    const errorCall = writeFileSpy.mock.calls.find((c: unknown[]) => (c[0] as string).includes('migration-errors.json'));
    expect(JSON.parse(successCall![1] as string)).toEqual([]);
    expect(JSON.parse(errorCall![1] as string)).toEqual([]);
  });
});

// ============================================================
// MA-AT-03 & MA-AT-04: Record reading (CA-02.1, CA-02.2)
// ============================================================

describe('CA-02: Record reading', () => {
  it('MA-AT-03: CA-02.1 — Valid contract key, full JSON object returned', async () => {
    const record = makeLegacyRecord();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(record)));

    const result = await readKvValue(ACCOUNT, NAMESPACE, 'contratos-1', TOKEN);
    expect(result).toEqual(record);
    expect(result.id).toBe('uuid-1');
    expect(result.clienteId).toBe('client-1');
  });

  it('MA-AT-04: CA-02.2 — Key with invalid JSON, record added to errors, processing continues', async () => {
    setEnvVars();

    const validRecord = makeLegacyRecord({ id: 'uuid-valid', clienteId: 'cli-valid' });

    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      if (url.includes('/keys?')) {
        return mockResponse({
          result: [{ name: 'contratos-bad' }, { name: 'contratos-good' }],
          result_info: { count: 2, cursor: '' },
        });
      }
      if (url.includes('/values/contratos-bad')) {
        return { ok: true, status: 200, text: () => Promise.resolve('not valid json {{{') } as Response;
      }
      if (url.includes('/values/contratos-good')) return mockResponse(validRecord);
      if (opts?.method === 'PUT') return mockResponse({ success: true });
      if (url.includes('content/clients/')) {
        return mockResponse({ uuid: 'cli-valid', data: { contractId: '' }, updatedAt: '2024-01-01T00:00:00Z' });
      }
      if (url.includes('indexes/')) return mockResponse({}, 404);
      return mockResponse({}, 404);
    }));

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await migrateContracts();

    const writeFileSpy = await getWriteFileSpy();
    const successCall = writeFileSpy.mock.calls.find((c: unknown[]) => (c[0] as string).includes('migration-success.json'));
    const errorCall = writeFileSpy.mock.calls.find((c: unknown[]) => (c[0] as string).includes('migration-errors.json'));

    const successes = JSON.parse(successCall![1] as string);
    const errors = JSON.parse(errorCall![1] as string);

    expect(successes).toHaveLength(1);
    expect(successes[0].uuid).toBe('uuid-valid');
    expect(errors.some((e: any) => e.reason.startsWith('invalid JSON:'))).toBe(true);
  });
});


// ============================================================
// MA-AT-05 through MA-AT-17: Transformation (CA-03.x)
// ============================================================

describe('CA-03: Transformation', () => {
  it('MA-AT-05: CA-03.1 — Legacy record id maps to uuid', () => {
    const result = transformRecord(makeLegacyRecord({ id: 'abc-123' }));
    expect(result.uuid).toBe('abc-123');
  });

  it('MA-AT-06: CA-03.2 — Timestamps preserved', () => {
    const result = transformRecord(makeLegacyRecord({
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-06-01T00:00:00Z',
    }));
    expect(result.createdAt).toBe('2024-01-01T00:00:00Z');
    expect(result.updatedAt).toBe('2024-06-01T00:00:00Z');
  });

  it('MA-AT-07: CA-03.3 — clienteId maps to data.clientId', () => {
    const result = transformRecord(makeLegacyRecord({ clienteId: 'cli-1' }));
    expect(result.data.clientId).toBe('cli-1');
  });

  it('MA-AT-08: CA-03.4 — CPA equipment with non-empty fields creates single-item array', () => {
    const result = transformRecord(makeLegacyRecord({
      hasCPAContract: true,
      modeloCPA: 'M1',
      numeroSerieCPA: 'S1',
    }));
    expect(result.data.cpaEquipments).toHaveLength(1);
    expect(result.data.cpaEquipments[0].modelo).toBe('M1');
    expect(result.data.cpaEquipments[0].numeroSerie).toBe('S1');
    expect(result.data.cpaEquipments[0].id).toBeDefined();
    expect(result.data.cpaEquipments[0].desconto).toBe(0);
    expect(result.data.cpaEquipments[0].observacoes).toBe('');
  });

  it('MA-AT-09: CA-03.5 — No CPA contract, cpaEquipments = []', () => {
    const result = transformRecord(makeLegacyRecord({
      hasCPAContract: false,
      hasSHContract: true,
      modeloPSO: 'M',
      numeroSeriePSO: 'S',
    }));
    expect(result.data.cpaEquipments).toEqual([]);
  });

  it('MA-AT-10: CA-03.6 — S&H equipment with non-empty fields creates single-item array', () => {
    const result = transformRecord(makeLegacyRecord({
      hasCPAContract: false,
      hasSHContract: true,
      modeloPSO: 'M2',
      numeroSeriePSO: 'S2',
      softwarePSO: 'SW1',
    }));
    expect(result.data.shEquipments).toHaveLength(1);
    expect(result.data.shEquipments[0].modelo).toBe('M2');
    expect(result.data.shEquipments[0].numeroSerie).toBe('S2');
    expect(result.data.shEquipments[0].software).toBe('SW1');
    expect(result.data.shEquipments[0].id).toBeDefined();
    expect(result.data.shEquipments[0].observacoes).toBe('');
  });

  it('MA-AT-11: CA-03.7 — No S&H contract, shEquipments = []', () => {
    const result = transformRecord(makeLegacyRecord({ hasCPAContract: true, hasSHContract: false }));
    expect(result.data.shEquipments).toEqual([]);
  });

  it('MA-AT-12: CA-03.8 — S&H-only, shared service details mapped to S&H fields', () => {
    const result = transformRecord(makeLegacyRecord({
      hasCPAContract: false,
      hasSHContract: true,
      modeloCPA: '',
      numeroSerieCPA: '',
      modeloPSO: 'M',
      numeroSeriePSO: 'S',
      horasAssistenciaAnual: 10,
      deslocacoesPorAno: 5,
      manutencoesPorAno: 3,
    }));
    expect(result.data.horasAssistenciaAnualSH).toBe(10);
    expect(result.data.deslocacoesPorAnoSH).toBe(5);
    expect(result.data.manutencoesPorAnoSH).toBe(3);
    expect(result.data.horasAssistenciaAnualCPA).toBe(0);
    expect(result.data.deslocacoesPorAnoCPA).toBe(0);
    expect(result.data.manutencoesPorAnoCPA).toBe(0);
  });

  it('MA-AT-13: CA-03.9 — CPA-only, shared service details mapped to CPA fields', () => {
    const result = transformRecord(makeLegacyRecord({
      hasCPAContract: true,
      hasSHContract: false,
      horasAssistenciaAnual: 10,
      deslocacoesPorAno: 5,
      manutencoesPorAno: 3,
    }));
    expect(result.data.horasAssistenciaAnualCPA).toBe(10);
    expect(result.data.deslocacoesPorAnoCPA).toBe(5);
    expect(result.data.manutencoesPorAnoCPA).toBe(3);
    expect(result.data.horasAssistenciaAnualSH).toBe(0);
    expect(result.data.deslocacoesPorAnoSH).toBe(0);
    expect(result.data.manutencoesPorAnoSH).toBe(0);
  });

  it('MA-AT-14: CA-03.10 — Both active, shared details go to S&H, CPA = 0', () => {
    const result = transformRecord(makeLegacyRecord({
      hasCPAContract: true,
      hasSHContract: true,
      modeloPSO: 'M',
      numeroSeriePSO: 'S',
      deslocacoesPorAno: 5,
      horasAssistenciaAnual: 10,
      manutencoesPorAno: 3,
    }));
    expect(result.data.deslocacoesPorAnoSH).toBe(5);
    expect(result.data.horasAssistenciaAnualSH).toBe(10);
    expect(result.data.manutencoesPorAnoSH).toBe(3);
    expect(result.data.deslocacoesPorAnoCPA).toBe(0);
    expect(result.data.horasAssistenciaAnualCPA).toBe(0);
    expect(result.data.manutencoesPorAnoCPA).toBe(0);
  });

  it('MA-AT-15: CA-03.11 — BaseContent wrapper fields set correctly', () => {
    const result = transformRecord(makeLegacyRecord());
    expect(result.contentType).toBe('contracts');
    expect(result.version).toBe(1);
    expect(result.isDeleted).toBe(false);
    expect(result.createdBy).toBe('migration');
    expect(result.updatedBy).toBe('migration');
  });

  it('MA-AT-16: CA-03.12 — temCPA fallback for hasCPAContract', () => {
    const legacy = makeLegacyRecord({ temCPA: true, modeloCPA: 'M', numeroSerieCPA: 'S' });
    delete (legacy as Record<string, unknown>).hasCPAContract;
    const result = transformRecord(legacy);
    expect(result.data.hasCPAContract).toBe(true);
  });

  it('MA-AT-17: CA-03.13 — Empty string optional fields preserved', () => {
    const result = transformRecord(makeLegacyRecord({
      distanceCPA: '',
      modalidadePagamentoCPA: '',
    }));
    expect(result.data.distanceCPA).toBe('');
    expect(result.data.modalidadePagamentoCPA).toBe('');
  });
});


// ============================================================
// MA-AT-18 & MA-AT-19: R2 write (CA-04.1, CA-04.2)
// ============================================================

describe('CA-04: R2 write', () => {
  it('MA-AT-18: CA-04.1 — Transformed record stored at correct R2 key', async () => {
    setEnvVars();

    const record = makeLegacyRecord({ id: 'abc-123', clienteId: 'cli-abc' });
    const putUrls: string[] = [];

    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      if (url.includes('/keys?')) {
        return mockResponse({ result: [{ name: 'contratos-abc' }], result_info: { count: 1, cursor: '' } });
      }
      if (url.includes('/values/contratos-abc')) return mockResponse(record);
      if (opts?.method === 'PUT') {
        putUrls.push(url);
        return mockResponse({ success: true });
      }
      if (url.includes('content/clients/')) {
        return mockResponse({ uuid: 'cli-abc', data: { contractId: '' }, updatedAt: '2024-01-01T00:00:00Z' });
      }
      if (url.includes('indexes/')) return mockResponse({}, 404);
      return mockResponse({}, 404);
    }));

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await migrateContracts();

    expect(putUrls.some((u) => u.includes('content/contracts/abc-123.json'))).toBe(true);
  });

  it('MA-AT-19: CA-04.2 — R2 write fails, record added to errors, processing continues', async () => {
    setEnvVars();

    const record1 = makeLegacyRecord({ id: 'uuid-fail', clienteId: 'cli-fail' });
    const record2 = makeLegacyRecord({ id: 'uuid-ok', clienteId: 'cli-ok' });

    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      if (url.includes('/keys?')) {
        return mockResponse({
          result: [{ name: 'contratos-fail' }, { name: 'contratos-ok' }],
          result_info: { count: 2, cursor: '' },
        });
      }
      if (url.includes('/values/contratos-fail')) return mockResponse(record1);
      if (url.includes('/values/contratos-ok')) return mockResponse(record2);
      if (opts?.method === 'PUT') {
        if (url.includes('content/contracts/uuid-fail.json')) return mockResponse({}, 500);
        return mockResponse({ success: true });
      }
      if (url.includes('content/clients/')) {
        return mockResponse({ uuid: 'cli-ok', data: { contractId: '' }, updatedAt: '2024-01-01T00:00:00Z' });
      }
      if (url.includes('indexes/')) return mockResponse({}, 404);
      return mockResponse({}, 404);
    }));

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await migrateContracts();

    const writeFileSpy = await getWriteFileSpy();
    const successCall = writeFileSpy.mock.calls.find((c: unknown[]) => (c[0] as string).includes('migration-success.json'));
    const errorCall = writeFileSpy.mock.calls.find((c: unknown[]) => (c[0] as string).includes('migration-errors.json'));

    const successes = JSON.parse(successCall![1] as string);
    const errors = JSON.parse(errorCall![1] as string);

    expect(successes).toHaveLength(1);
    expect(successes[0].uuid).toBe('uuid-ok');
    expect(errors.some((e: any) => e.reason.includes('write failed'))).toBe(true);
  });
});

// ============================================================
// MA-AT-20 & MA-AT-21: Index update (CA-05.1, CA-05.2)
// ============================================================

describe('CA-05: Index update', () => {
  it('MA-AT-20: CA-05.1 — 3 contracts migrated, index contains those 3', async () => {
    setEnvVars();

    const records = [
      makeLegacyRecord({ id: 'u1', clienteId: 'c1' }),
      makeLegacyRecord({ id: 'u2', clienteId: 'c2' }),
      makeLegacyRecord({ id: 'u3', clienteId: 'c3' }),
    ];

    let indexWriteBody: any = null;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      if (url.includes('/keys?')) {
        return mockResponse({
          result: [{ name: 'contratos-1' }, { name: 'contratos-2' }, { name: 'contratos-3' }],
          result_info: { count: 3, cursor: '' },
        });
      }
      if (url.includes('/values/contratos-1')) return mockResponse(records[0]);
      if (url.includes('/values/contratos-2')) return mockResponse(records[1]);
      if (url.includes('/values/contratos-3')) return mockResponse(records[2]);
      if (opts?.method === 'PUT') {
        if (url.includes('indexes/contracts-index.json')) {
          indexWriteBody = JSON.parse(opts.body as string);
        }
        return mockResponse({ success: true });
      }
      if (url.includes('content/clients/')) {
        return mockResponse({ uuid: 'c1', data: { contractId: '' }, updatedAt: '2024-01-01T00:00:00Z' });
      }
      if (url.includes('indexes/')) return mockResponse({}, 404);
      return mockResponse({}, 404);
    }));

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await migrateContracts();

    expect(indexWriteBody).not.toBeNull();
    expect(indexWriteBody.items).toHaveLength(3);
    const uuids = indexWriteBody.items.map((i: any) => i.uuid);
    expect(uuids).toContain('u1');
    expect(uuids).toContain('u2');
    expect(uuids).toContain('u3');
  });

  it('MA-AT-21: CA-05.2 — Index update fails, operator notified, output files still written', async () => {
    setEnvVars();

    const record = makeLegacyRecord({ id: 'u1', clienteId: 'c1' });

    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      if (url.includes('/keys?')) {
        return mockResponse({ result: [{ name: 'contratos-1' }], result_info: { count: 1, cursor: '' } });
      }
      if (url.includes('/values/contratos-1')) return mockResponse(record);
      if (opts?.method === 'PUT') {
        if (url.includes('indexes/contracts-index.json')) return mockResponse({}, 500);
        return mockResponse({ success: true });
      }
      if (url.includes('content/clients/')) {
        return mockResponse({ uuid: 'c1', data: { contractId: '' }, updatedAt: '2024-01-01T00:00:00Z' });
      }
      if (url.includes('indexes/')) return mockResponse({}, 404);
      return mockResponse({}, 404);
    }));

    vi.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await migrateContracts();

    const errorOutput = errorSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(errorOutput).toContain('Index write failed');

    const writeFileSpy = await getWriteFileSpy();
    const successCall = writeFileSpy.mock.calls.find((c: unknown[]) => (c[0] as string).includes('migration-success.json'));
    const errorCall = writeFileSpy.mock.calls.find((c: unknown[]) => (c[0] as string).includes('migration-errors.json'));
    expect(successCall).toBeDefined();
    expect(errorCall).toBeDefined();
  });
});


// ============================================================
// MA-AT-22 through MA-AT-24: Client update (CA-06.x)
// ============================================================

describe('CA-06: Client update', () => {
  it('MA-AT-22: CA-06.1 — Client updated with contractId and refreshed updatedAt', async () => {
    setEnvVars();

    const record = makeLegacyRecord({ id: 'c1', clienteId: 'cli-1' });
    const clientRecord = { uuid: 'cli-1', data: { contractId: '' }, updatedAt: '2024-01-01T00:00:00Z' };

    let writtenClient: any = null;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      if (url.includes('/keys?')) {
        return mockResponse({ result: [{ name: 'contratos-1' }], result_info: { count: 1, cursor: '' } });
      }
      if (url.includes('/values/contratos-1')) return mockResponse(record);
      if (opts?.method === 'PUT') {
        if (url.includes('content/clients/')) writtenClient = JSON.parse(opts.body as string);
        return mockResponse({ success: true });
      }
      if (url.includes('content/clients/')) return mockResponse(clientRecord);
      if (url.includes('indexes/')) return mockResponse({}, 404);
      return mockResponse({}, 404);
    }));

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await migrateContracts();

    expect(writtenClient).not.toBeNull();
    expect(writtenClient.data.contractId).toBe('c1');
    expect(writtenClient.updatedAt).not.toBe('2024-01-01T00:00:00Z');
  });

  it('MA-AT-23: CA-06.2 — clientId points to non-existent client, failure logged, contract still success', async () => {
    setEnvVars();

    const record = makeLegacyRecord({ id: 'uuid-ok', clienteId: 'missing-client' });

    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      if (url.includes('/keys?')) {
        return mockResponse({ result: [{ name: 'contratos-1' }], result_info: { count: 1, cursor: '' } });
      }
      if (url.includes('/values/contratos-1')) return mockResponse(record);
      if (opts?.method === 'PUT') {
        if (url.includes('content/contracts/')) return mockResponse({ success: true });
        return mockResponse({ success: true });
      }
      if (url.includes('content/clients/missing-client')) return mockResponse({}, 404);
      if (url.includes('indexes/')) return mockResponse({}, 404);
      return mockResponse({}, 404);
    }));

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await migrateContracts();

    const writeFileSpy = await getWriteFileSpy();
    const successCall = writeFileSpy.mock.calls.find((c: unknown[]) => (c[0] as string).includes('migration-success.json'));
    const errorCall = writeFileSpy.mock.calls.find((c: unknown[]) => (c[0] as string).includes('migration-errors.json'));

    const successes = JSON.parse(successCall![1] as string);
    const errors = JSON.parse(errorCall![1] as string);

    expect(successes).toHaveLength(1);
    expect(successes[0].uuid).toBe('uuid-ok');
    expect(errors.some((e: any) => e.reason.includes('client update failed'))).toBe(true);
  });

  it('MA-AT-24: CA-06.3 — Client update write fails, failure logged, contract still success', async () => {
    setEnvVars();

    const record = makeLegacyRecord({ id: 'uuid-ok', clienteId: 'cli-1' });
    const clientRecord = { uuid: 'cli-1', data: { contractId: '' }, updatedAt: '2024-01-01T00:00:00Z' };

    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      if (url.includes('/keys?')) {
        return mockResponse({ result: [{ name: 'contratos-1' }], result_info: { count: 1, cursor: '' } });
      }
      if (url.includes('/values/contratos-1')) return mockResponse(record);
      if (opts?.method === 'PUT') {
        if (url.includes('content/contracts/')) return mockResponse({ success: true });
        if (url.includes('content/clients/')) return mockResponse({}, 500);
        return mockResponse({ success: true });
      }
      if (url.includes('content/clients/')) return mockResponse(clientRecord);
      if (url.includes('indexes/')) return mockResponse({}, 404);
      return mockResponse({}, 404);
    }));

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await migrateContracts();

    const writeFileSpy = await getWriteFileSpy();
    const successCall = writeFileSpy.mock.calls.find((c: unknown[]) => (c[0] as string).includes('migration-success.json'));
    const errorCall = writeFileSpy.mock.calls.find((c: unknown[]) => (c[0] as string).includes('migration-errors.json'));

    const successes = JSON.parse(successCall![1] as string);
    const errors = JSON.parse(errorCall![1] as string);

    expect(successes).toHaveLength(1);
    expect(successes[0].uuid).toBe('uuid-ok');
    expect(errors.some((e: any) => e.reason.includes('client update failed'))).toBe(true);
  });
});


// ============================================================
// MA-AT-25 & MA-AT-26: Success output file (CA-07.1, CA-07.2)
// ============================================================

describe('CA-07: Success output file', () => {
  it('MA-AT-25: CA-07.1 — 3 contracts migrated, success file has 3 objects', async () => {
    setEnvVars();

    const records = [
      makeLegacyRecord({ id: 'u1', clienteId: 'c1' }),
      makeLegacyRecord({ id: 'u2', clienteId: 'c2' }),
      makeLegacyRecord({ id: 'u3', clienteId: 'c3' }),
    ];

    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      if (url.includes('/keys?')) {
        return mockResponse({
          result: [{ name: 'contratos-1' }, { name: 'contratos-2' }, { name: 'contratos-3' }],
          result_info: { count: 3, cursor: '' },
        });
      }
      if (url.includes('/values/contratos-1')) return mockResponse(records[0]);
      if (url.includes('/values/contratos-2')) return mockResponse(records[1]);
      if (url.includes('/values/contratos-3')) return mockResponse(records[2]);
      if (opts?.method === 'PUT') return mockResponse({ success: true });
      if (url.includes('content/clients/')) {
        return mockResponse({ uuid: 'c1', data: { contractId: '' }, updatedAt: '2024-01-01T00:00:00Z' });
      }
      if (url.includes('indexes/')) return mockResponse({}, 404);
      return mockResponse({}, 404);
    }));

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await migrateContracts();

    const writeFileSpy = await getWriteFileSpy();
    const successCall = writeFileSpy.mock.calls.find((c: unknown[]) => (c[0] as string).includes('migration-success.json'));
    const successes = JSON.parse(successCall![1] as string);

    expect(successes).toHaveLength(3);
    expect(successes[0]).toHaveProperty('uuid');
    expect(successes[0]).toHaveProperty('clientId');
    expect(successes[0]).toHaveProperty('hasCPAContract');
    expect(successes[0]).toHaveProperty('hasSHContract');
  });

  it('MA-AT-26: CA-07.2 — 0 contracts migrated, success file has empty array', async () => {
    setEnvVars();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({
      result: [],
      result_info: { count: 0, cursor: '' },
    })));

    vi.spyOn(console, 'log').mockImplementation(() => {});

    await migrateContracts();

    const writeFileSpy = await getWriteFileSpy();
    const successCall = writeFileSpy.mock.calls.find((c: unknown[]) => (c[0] as string).includes('migration-success.json'));
    expect(JSON.parse(successCall![1] as string)).toEqual([]);
  });
});

// ============================================================
// MA-AT-27 & MA-AT-28: Error output file (CA-08.1, CA-08.2)
// ============================================================

describe('CA-08: Error output file', () => {
  it('MA-AT-27: CA-08.1 — 2 records failed, error file has 2 objects', async () => {
    setEnvVars();

    const invalidRecord1 = { name: 'no-id-1' };
    const invalidRecord2 = { id: 'has-id-no-client' };

    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      if (url.includes('/keys?')) {
        return mockResponse({
          result: [{ name: 'contratos-bad1' }, { name: 'contratos-bad2' }],
          result_info: { count: 2, cursor: '' },
        });
      }
      if (url.includes('/values/contratos-bad1')) return mockResponse(invalidRecord1);
      if (url.includes('/values/contratos-bad2')) return mockResponse(invalidRecord2);
      if (opts?.method === 'PUT') return mockResponse({ success: true });
      if (url.includes('indexes/')) return mockResponse({}, 404);
      return mockResponse({}, 404);
    }));

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await migrateContracts();

    const writeFileSpy = await getWriteFileSpy();
    const errorCall = writeFileSpy.mock.calls.find((c: unknown[]) => (c[0] as string).includes('migration-errors.json'));
    const errors = JSON.parse(errorCall![1] as string);

    expect(errors).toHaveLength(2);
    expect(errors[0]).toHaveProperty('id');
    expect(errors[0]).toHaveProperty('reason');
    expect(errors[1]).toHaveProperty('id');
    expect(errors[1]).toHaveProperty('reason');
  });

  it('MA-AT-28: CA-08.2 — 0 records failed, error file has empty array', async () => {
    setEnvVars();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({
      result: [],
      result_info: { count: 0, cursor: '' },
    })));

    vi.spyOn(console, 'log').mockImplementation(() => {});

    await migrateContracts();

    const writeFileSpy = await getWriteFileSpy();
    const errorCall = writeFileSpy.mock.calls.find((c: unknown[]) => (c[0] as string).includes('migration-errors.json'));
    expect(JSON.parse(errorCall![1] as string)).toEqual([]);
  });
});

// ============================================================
// MA-AT-29: Summary (CA-09.1)
// ============================================================

describe('CA-09: Summary', () => {
  it('MA-AT-29: CA-09.1 — Script completes with mixed results, all counters shown in summary', async () => {
    setEnvVars();

    const validRecords = [
      makeLegacyRecord({ id: 'u1', clienteId: 'c1' }),
      makeLegacyRecord({ id: 'u2', clienteId: 'c2' }),
      makeLegacyRecord({ id: 'u3', clienteId: 'c3' }),
    ];
    const invalidRecord1 = { name: 'no-id-1' };
    const invalidRecord2 = { name: 'no-id-2' };

    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      if (url.includes('/keys?')) {
        return mockResponse({
          result: [
            { name: 'contratos-1' },
            { name: 'contratos-2' },
            { name: 'contratos-3' },
            { name: 'contratos-bad1' },
            { name: 'contratos-bad2' },
          ],
          result_info: { count: 5, cursor: '' },
        });
      }
      if (url.includes('/values/contratos-1')) return mockResponse(validRecords[0]);
      if (url.includes('/values/contratos-2')) return mockResponse(validRecords[1]);
      if (url.includes('/values/contratos-3')) return mockResponse(validRecords[2]);
      if (url.includes('/values/contratos-bad1')) return mockResponse(invalidRecord1);
      if (url.includes('/values/contratos-bad2')) return mockResponse(invalidRecord2);
      if (opts?.method === 'PUT') return mockResponse({ success: true });
      if (url.includes('content/clients/')) {
        return mockResponse({ uuid: 'c1', data: { contractId: '' }, updatedAt: '2024-01-01T00:00:00Z' });
      }
      if (url.includes('indexes/')) return mockResponse({}, 404);
      return mockResponse({}, 404);
    }));

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await migrateContracts();

    const output = logSpy.mock.calls.map((c) => c[0]).join('\n');

    expect(output).toContain('=== Migration Summary ===');
    expect(output).toContain('Total records found: 5');
    expect(output).toContain('Successfully migrated: 3');
    expect(output).toContain('Errors: 2');
    expect(output).toContain('Client updates: 3');
    expect(output).toContain('migration-success.json');
    expect(output).toContain('migration-errors.json');
  });
});

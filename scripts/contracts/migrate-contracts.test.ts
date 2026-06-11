import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import * as fc from 'fast-check';
import {
  listKvKeys,
  readKvValue,
  writeR2Object,
  readR2Object,
  transformRecord,
  buildContractSearchText,
  buildIndexItem,
  updateContractIndex,
  updateClientContractId,
  writeOutputFiles,
  printSummary,
  migrateContracts,
} from './migrate-contracts';

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

// --- Setup ---

beforeEach(() => {
  vi.restoreAllMocks();
});

// ============================================================
// MI-IT-01 through MI-IT-04: listKvKeys()
// ============================================================

describe('listKvKeys()', () => {
  it('MI-IT-01: single page of keys returned', async () => {
    const keys = Array.from({ length: 5 }, (_, i) => ({ name: `contratos-${i}` }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({
      result: keys,
      result_info: { count: 5, cursor: '' },
    })));

    const result = await listKvKeys(ACCOUNT, NAMESPACE, TOKEN);
    expect(result).toHaveLength(5);
    expect(result).toEqual(keys.map((k) => k.name));
  });

  it('MI-IT-02: paginated keys — two pages', async () => {
    const page1Keys = Array.from({ length: 1000 }, (_, i) => ({ name: `contratos-${i}` }));
    const page2Keys = Array.from({ length: 3 }, (_, i) => ({ name: `contratos-${1000 + i}` }));

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(mockResponse({
        result: page1Keys,
        result_info: { count: 1000, cursor: 'cursor-abc' },
      }))
      .mockResolvedValueOnce(mockResponse({
        result: page2Keys,
        result_info: { count: 3, cursor: '' },
      }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await listKvKeys(ACCOUNT, NAMESPACE, TOKEN);
    expect(result).toHaveLength(1003);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('MI-IT-03: empty namespace', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({
      result: [],
      result_info: { count: 0, cursor: '' },
    })));

    const result = await listKvKeys(ACCOUNT, NAMESPACE, TOKEN);
    expect(result).toEqual([]);
  });

  it('MI-IT-04: KV API returns non-200 — throws error (fatal)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({}, 403)));

    await expect(listKvKeys(ACCOUNT, NAMESPACE, TOKEN)).rejects.toThrow('KV namespace not accessible: HTTP 403');
  });
});


// ============================================================
// MI-IT-05 through MI-IT-07: readKvValue()
// ============================================================

describe('readKvValue()', () => {
  it('MI-IT-05: valid JSON record', async () => {
    const record = { id: 'abc', clienteId: 'cli-1' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(record)));

    const result = await readKvValue(ACCOUNT, NAMESPACE, 'contratos-abc', TOKEN);
    expect(result).toEqual(record);
  });

  it('MI-IT-06: invalid JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('not valid json {{{'),
    } as Response));

    const result = await readKvValue(ACCOUNT, NAMESPACE, 'contratos-bad', TOKEN);
    expect(result.error).toBe(true);
    expect(result.reason).toMatch(/^invalid JSON:/);
  });

  it('MI-IT-07: read failure (HTTP error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({}, 500)));

    const result = await readKvValue(ACCOUNT, NAMESPACE, 'contratos-fail', TOKEN);
    expect(result.error).toBe(true);
    expect(result.reason).toBe('read failed: HTTP 500');
  });
});


// ============================================================
// MI-IT-08 through MI-IT-17: transformRecord()
// ============================================================

describe('transformRecord()', () => {
  it('MI-IT-08: nominal CPA-only record', () => {
    const legacy = makeLegacyRecord();
    const result = transformRecord(legacy);
    expect(result.error).toBeUndefined();
    expect(result.uuid).toBe('uuid-1');
    expect(result.data.clientId).toBe('client-1');
    expect(result.data.hasCPAContract).toBe(true);
    expect(result.data.hasSHContract).toBe(false);
    expect(result.data.cpaEquipments).toHaveLength(1);
    expect(result.data.cpaEquipments[0].modelo).toBe('ModelX');
    expect(result.data.cpaEquipments[0].numeroSerie).toBe('SN-001');
    expect(result.data.cpaEquipments[0].desconto).toBe(0);
    expect(result.data.cpaEquipments[0].observacoes).toBe('');
    expect(result.data.horasAssistenciaAnualCPA).toBe(10);
    expect(result.data.deslocacoesPorAnoCPA).toBe(5);
    expect(result.data.manutencoesPorAnoCPA).toBe(3);
    expect(result.data.horasAssistenciaAnualSH).toBe(0);
    expect(result.data.deslocacoesPorAnoSH).toBe(0);
    expect(result.data.manutencoesPorAnoSH).toBe(0);
  });

  it('MI-IT-09: nominal S&H-only record', () => {
    const legacy = makeLegacyRecord({
      hasCPAContract: false,
      hasSHContract: true,
      modeloCPA: '',
      numeroSerieCPA: '',
      modeloPSO: 'PSO-Model',
      numeroSeriePSO: 'PSO-SN',
      softwarePSO: 'SW-1',
      planIdSH: 'plan-sh-1',
      distanceSH: 'over180km',
      modalidadePagamentoSH: 'ANUAL',
      inicioContratoSH: '2024-02-01',
      fimContratoSH: '2025-02-01',
    });
    const result = transformRecord(legacy);
    expect(result.error).toBeUndefined();
    expect(result.data.hasSHContract).toBe(true);
    expect(result.data.hasCPAContract).toBe(false);
    expect(result.data.shEquipments).toHaveLength(1);
    expect(result.data.shEquipments[0].modelo).toBe('PSO-Model');
    expect(result.data.shEquipments[0].software).toBe('SW-1');
    expect(result.data.cpaEquipments).toHaveLength(0);
    expect(result.data.horasAssistenciaAnualSH).toBe(10);
    expect(result.data.deslocacoesPorAnoSH).toBe(5);
    expect(result.data.manutencoesPorAnoSH).toBe(3);
    expect(result.data.horasAssistenciaAnualCPA).toBe(0);
  });

  it('MI-IT-10: both contract types active — shared details go to S&H', () => {
    const legacy = makeLegacyRecord({
      hasCPAContract: true,
      hasSHContract: true,
      modeloPSO: 'PSO-M',
      numeroSeriePSO: 'PSO-S',
      softwarePSO: 'SW',
    });
    const result = transformRecord(legacy);
    expect(result.data.hasCPAContract).toBe(true);
    expect(result.data.hasSHContract).toBe(true);
    // S&H is primary — gets shared details
    expect(result.data.horasAssistenciaAnualSH).toBe(10);
    expect(result.data.deslocacoesPorAnoSH).toBe(5);
    expect(result.data.manutencoesPorAnoSH).toBe(3);
    // CPA gets 0
    expect(result.data.horasAssistenciaAnualCPA).toBe(0);
    expect(result.data.deslocacoesPorAnoCPA).toBe(0);
    expect(result.data.manutencoesPorAnoCPA).toBe(0);
  });

  it('MI-IT-11: temCPA fallback', () => {
    const legacy = makeLegacyRecord({ temCPA: true });
    // Remove hasCPAContract so temCPA is used as fallback
    delete (legacy as Record<string, unknown>).hasCPAContract;
    const result = transformRecord(legacy);
    expect(result.data.hasCPAContract).toBe(true);
  });

  it('MI-IT-12: empty equipment fields — cpaEquipments = []', () => {
    const legacy = makeLegacyRecord({
      modeloCPA: '',
      numeroSerieCPA: '',
    });
    const result = transformRecord(legacy);
    expect(result.data.cpaEquipments).toEqual([]);
  });

  it('MI-IT-13: missing required field id', () => {
    const legacy = makeLegacyRecord({ id: '' });
    const result = transformRecord(legacy);
    expect(result.error).toBe(true);
    expect(result.reason).toBe('required field missing: id');
  });

  it('MI-IT-14: missing required field clienteId', () => {
    const legacy = makeLegacyRecord({ clienteId: '' });
    const result = transformRecord(legacy);
    expect(result.error).toBe(true);
    expect(result.reason).toBe('required field missing: clienteId');
  });

  it('MI-IT-15: no active contract type', () => {
    const legacy = makeLegacyRecord({ hasCPAContract: false, hasSHContract: false });
    const result = transformRecord(legacy);
    expect(result.error).toBe(true);
    expect(result.reason).toBe('no active contract type');
  });

  it('MI-IT-16: default values for absent optional fields', () => {
    const legacy = {
      id: 'uuid-defaults',
      clienteId: 'cli-defaults',
      hasCPAContract: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      // All optional fields absent
    };
    const result = transformRecord(legacy);
    expect(result.error).toBeUndefined();
    expect(result.data.planIdCPA).toBe('');
    expect(result.data.distanceCPA).toBe('');
    expect(result.data.modalidadePagamentoCPA).toBe('');
    expect(result.data.inicioContratoCPA).toBe('');
    expect(result.data.fimContratoCPA).toBe('');
    expect(result.data.planIdSH).toBe('');
    expect(result.data.horasAssistenciaAnualCPA).toBe(0);
    expect(result.data.deslocacoesPorAnoCPA).toBe(0);
    expect(result.data.manutencoesPorAnoCPA).toBe(0);
    expect(result.data.metodoPagamento).toBe('');
  });

  it('MI-IT-17: BaseContent wrapper fields', () => {
    const legacy = makeLegacyRecord();
    const result = transformRecord(legacy);
    expect(result.contentType).toBe('contracts');
    expect(result.version).toBe(1);
    expect(result.isDeleted).toBe(false);
    expect(result.createdBy).toBe('migration');
    expect(result.updatedBy).toBe('migration');
    expect(result.createdAt).toBe('2024-01-01T00:00:00Z');
    expect(result.updatedAt).toBe('2024-06-01T00:00:00Z');
  });

  // --- Property-based tests on transformRecord() using fast-check ---

  describe('property-based tests', () => {
    // Safe ISO date string generator — avoids Invalid Date issues with fc.date()
    const isoDateArb = fc.integer({ min: 946684800000, max: 1924905600000 }).map((ms) => new Date(ms).toISOString());

    /**
     * Validates: Requirements 3.11
     * All valid records produce correct BaseContent wrapper fields
     */
    it('PBT: all valid records produce correct BaseContent wrapper fields', () => {
      const legacyRecordArb = fc.record({
        id: fc.uuid(),
        clienteId: fc.uuid(),
        createdAt: isoDateArb,
        updatedAt: isoDateArb,
        hasCPAContract: fc.boolean(),
        hasSHContract: fc.boolean(),
        modeloCPA: fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 20 })),
        numeroSerieCPA: fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 20 })),
        modeloPSO: fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 20 })),
        numeroSeriePSO: fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 20 })),
        softwarePSO: fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 20 })),
        horasAssistenciaAnual: fc.nat({ max: 100 }),
        deslocacoesPorAno: fc.nat({ max: 100 }),
        manutencoesPorAno: fc.nat({ max: 100 }),
      }).filter((r) => r.hasCPAContract || r.hasSHContract); // At least one active

      fc.assert(
        fc.property(legacyRecordArb, (legacy) => {
          const result = transformRecord(legacy);
          expect(result.error).toBeUndefined();
          expect(result.contentType).toBe('contracts');
          expect(result.version).toBe(1);
          expect(result.isDeleted).toBe(false);
          expect(result.createdBy).toBe('migration');
          expect(result.updatedBy).toBe('migration');
          expect(result.uuid).toBe(legacy.id);
        }),
        { numRuns: 100 },
      );
    });

    /**
     * Validates: Requirements 3.4, 3.5, 3.6, 3.7
     * Equipment arrays are correctly constructed based on contract type flags
     */
    it('PBT: equipment arrays correctly constructed based on contract type flags', () => {
      const legacyRecordArb = fc.record({
        id: fc.uuid(),
        clienteId: fc.uuid(),
        createdAt: isoDateArb,
        updatedAt: isoDateArb,
        hasCPAContract: fc.boolean(),
        hasSHContract: fc.boolean(),
        modeloCPA: fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 20 })),
        numeroSerieCPA: fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 20 })),
        modeloPSO: fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 20 })),
        numeroSeriePSO: fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 20 })),
        softwarePSO: fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 20 })),
        horasAssistenciaAnual: fc.nat({ max: 100 }),
        deslocacoesPorAno: fc.nat({ max: 100 }),
        manutencoesPorAno: fc.nat({ max: 100 }),
      }).filter((r) => r.hasCPAContract || r.hasSHContract);

      fc.assert(
        fc.property(legacyRecordArb, (legacy) => {
          const result = transformRecord(legacy);
          if (result.error) return; // skip invalid

          const hasCpaEquip = legacy.modeloCPA !== '' || legacy.numeroSerieCPA !== '';
          if (legacy.hasCPAContract && hasCpaEquip) {
            expect(result.data.cpaEquipments).toHaveLength(1);
            expect(result.data.cpaEquipments[0].modelo).toBe(legacy.modeloCPA);
            expect(result.data.cpaEquipments[0].numeroSerie).toBe(legacy.numeroSerieCPA);
          } else {
            expect(result.data.cpaEquipments).toHaveLength(0);
          }

          const hasShEquip = legacy.modeloPSO !== '' || legacy.numeroSeriePSO !== '';
          if (legacy.hasSHContract && hasShEquip) {
            expect(result.data.shEquipments).toHaveLength(1);
            expect(result.data.shEquipments[0].modelo).toBe(legacy.modeloPSO);
          } else {
            expect(result.data.shEquipments).toHaveLength(0);
          }
        }),
        { numRuns: 100 },
      );
    });

    /**
     * Validates: Requirements 3.8, 3.9, 3.10
     * Shared service details are correctly assigned based on active contract type
     */
    it('PBT: shared service details correctly assigned based on active contract type', () => {
      const legacyRecordArb = fc.record({
        id: fc.uuid(),
        clienteId: fc.uuid(),
        createdAt: isoDateArb,
        updatedAt: isoDateArb,
        hasCPAContract: fc.boolean(),
        hasSHContract: fc.boolean(),
        modeloCPA: fc.constant('M'),
        numeroSerieCPA: fc.constant('S'),
        modeloPSO: fc.constant('M'),
        numeroSeriePSO: fc.constant('S'),
        softwarePSO: fc.constant('SW'),
        horasAssistenciaAnual: fc.nat({ max: 1000 }),
        deslocacoesPorAno: fc.nat({ max: 1000 }),
        manutencoesPorAno: fc.nat({ max: 1000 }),
      }).filter((r) => r.hasCPAContract || r.hasSHContract);

      fc.assert(
        fc.property(legacyRecordArb, (legacy) => {
          const result = transformRecord(legacy);
          if (result.error) return;

          const h = legacy.horasAssistenciaAnual;
          const d = legacy.deslocacoesPorAno;
          const m = legacy.manutencoesPorAno;

          if (legacy.hasSHContract) {
            // S&H is primary — gets shared details
            expect(result.data.horasAssistenciaAnualSH).toBe(h);
            expect(result.data.deslocacoesPorAnoSH).toBe(d);
            expect(result.data.manutencoesPorAnoSH).toBe(m);
            expect(result.data.horasAssistenciaAnualCPA).toBe(0);
            expect(result.data.deslocacoesPorAnoCPA).toBe(0);
            expect(result.data.manutencoesPorAnoCPA).toBe(0);
          } else {
            // CPA only
            expect(result.data.horasAssistenciaAnualCPA).toBe(h);
            expect(result.data.deslocacoesPorAnoCPA).toBe(d);
            expect(result.data.manutencoesPorAnoCPA).toBe(m);
            expect(result.data.horasAssistenciaAnualSH).toBe(0);
            expect(result.data.deslocacoesPorAnoSH).toBe(0);
            expect(result.data.manutencoesPorAnoSH).toBe(0);
          }
        }),
        { numRuns: 100 },
      );
    });

    /**
     * Validates: Requirements 3.1, 3.2, 3.3
     * Required field validation always catches missing id/clienteId/no active type
     */
    it('PBT: required field validation catches missing id/clienteId/no active type', () => {
      // Missing id
      fc.assert(
        fc.property(fc.uuid(), fc.boolean(), fc.boolean(), (clienteId, hasCPA, hasSH) => {
          const legacy = { clienteId, hasCPAContract: hasCPA, hasSHContract: hasSH };
          const result = transformRecord(legacy);
          expect(result.error).toBe(true);
          expect(result.reason).toBe('required field missing: id');
        }),
        { numRuns: 100 },
      );

      // Missing clienteId
      fc.assert(
        fc.property(fc.uuid(), fc.boolean(), fc.boolean(), (id, hasCPA, hasSH) => {
          const legacy = { id, hasCPAContract: hasCPA, hasSHContract: hasSH };
          const result = transformRecord(legacy);
          expect(result.error).toBe(true);
          expect(result.reason).toBe('required field missing: clienteId');
        }),
        { numRuns: 100 },
      );

      // No active contract type
      fc.assert(
        fc.property(fc.uuid(), fc.uuid(), (id, clienteId) => {
          const legacy = { id, clienteId, hasCPAContract: false, hasSHContract: false };
          const result = transformRecord(legacy);
          expect(result.error).toBe(true);
          expect(result.reason).toBe('no active contract type');
        }),
        { numRuns: 100 },
      );
    });
  });
});


// ============================================================
// MI-IT-18 through MI-IT-19: writeR2Object()
// ============================================================

describe('writeR2Object()', () => {
  it('MI-IT-18: successful write', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({ success: true })));

    const result = await writeR2Object(ACCOUNT, BUCKET, 'content/contracts/uuid-1.json', { test: true }, TOKEN);
    expect((result as { success: true }).success).toBe(true);

    const call = (fetch as Mock).mock.calls[0];
    expect(call[0]).toContain('content/contracts/uuid-1.json');
    expect(call[1].method).toBe('PUT');
  });

  it('MI-IT-19: write failure (HTTP 500)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({}, 500)));

    const result = await writeR2Object(ACCOUNT, BUCKET, 'content/contracts/uuid-1.json', { test: true }, TOKEN);
    expect((result as { error: true; reason: string }).error).toBe(true);
    expect((result as { error: true; reason: string }).reason).toBe('write failed: HTTP 500');
  });
});

// ============================================================
// MI-IT-20 through MI-IT-22: buildContractIndex / updateContractIndex
// ============================================================

describe('updateContractIndex()', () => {
  it('MI-IT-20: build index items from migrated records', () => {
    const records = [
      { uuid: 'r1', createdAt: '2024-03-01', updatedAt: '2024-03-01', data: { clientId: 'c1', hasCPAContract: true, hasSHContract: false, cpaEquipments: [{ modelo: 'M1', numeroSerie: 'S1' }], shEquipments: [], planIdCPA: 'p1', planIdSH: '' } },
      { uuid: 'r2', createdAt: '2024-02-01', updatedAt: '2024-02-01', data: { clientId: 'c2', hasCPAContract: false, hasSHContract: true, cpaEquipments: [], shEquipments: [{ modelo: 'M2', numeroSerie: 'S2' }], planIdCPA: '', planIdSH: 'p2' } },
      { uuid: 'r3', createdAt: '2024-01-01', updatedAt: '2024-01-01', data: { clientId: 'c3', hasCPAContract: true, hasSHContract: true, cpaEquipments: [], shEquipments: [], planIdCPA: 'p3', planIdSH: 'p4' } },
    ];

    const items = records.map((r) => buildIndexItem(r));
    expect(items).toHaveLength(3);
    expect(items[0].uuid).toBe('r1');
    expect(items[0].contentType).toBe('contracts');
    expect(items[0].clientId).toBe('c1');
    expect(items[0].searchableText).toContain('cpa');
    expect(items[1].searchableText).toContain('s&h');
    expect(items[2].planIdCPA).toBe('p3');
    expect(items[2].planIdSH).toBe('p4');
  });

  it('MI-IT-21: merge with existing index — deduplication and sort', async () => {
    const existingIndex = {
      items: [
        { uuid: 'existing-1', createdAt: '2024-04-01', updatedAt: '2024-04-01' },
        { uuid: 'r1', createdAt: '2023-01-01', updatedAt: '2023-01-01' }, // will be replaced
      ],
    };

    const migratedRecords = [
      { uuid: 'r1', createdAt: '2024-03-01', updatedAt: '2024-03-01', data: { clientId: 'c1', hasCPAContract: true, hasSHContract: false, cpaEquipments: [], shEquipments: [], planIdCPA: '', planIdSH: '' } },
      { uuid: 'r2', createdAt: '2024-02-01', updatedAt: '2024-02-01', data: { clientId: 'c2', hasCPAContract: false, hasSHContract: true, cpaEquipments: [], shEquipments: [], planIdCPA: '', planIdSH: '' } },
      { uuid: 'r3', createdAt: '2024-01-01', updatedAt: '2024-01-01', data: { clientId: 'c3', hasCPAContract: true, hasSHContract: true, cpaEquipments: [], shEquipments: [], planIdCPA: '', planIdSH: '' } },
    ];

    let writtenData: Record<string, unknown> | null = null;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      if (opts?.method === 'PUT') {
        writtenData = JSON.parse(opts.body as string);
        return mockResponse({ success: true });
      }
      // GET — return existing index
      return mockResponse(existingIndex);
    }));

    await updateContractIndex(ACCOUNT, BUCKET, migratedRecords, TOKEN);

    expect(writtenData).not.toBeNull();
    const items = (writtenData as Record<string, unknown>).items as Array<Record<string, unknown>>;
    // existing-1 + r1 (replaced) + r2 + r3 = 4 items
    expect(items).toHaveLength(4);
    // Sorted by createdAt desc
    expect(items[0].uuid).toBe('existing-1'); // 2024-04-01
    expect(items[1].uuid).toBe('r1'); // 2024-03-01
  });

  it('MI-IT-22: existing index not found (404) — start with empty', async () => {
    const migratedRecords = [
      { uuid: 'r1', createdAt: '2024-01-01', updatedAt: '2024-01-01', data: { clientId: 'c1', hasCPAContract: true, hasSHContract: false, cpaEquipments: [], shEquipments: [], planIdCPA: '', planIdSH: '' } },
    ];

    let writtenData: Record<string, unknown> | null = null;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      if (opts?.method === 'PUT') {
        writtenData = JSON.parse(opts.body as string);
        return mockResponse({ success: true });
      }
      // GET returns 404
      return mockResponse({}, 404);
    }));

    await updateContractIndex(ACCOUNT, BUCKET, migratedRecords, TOKEN);

    expect(writtenData).not.toBeNull();
    const items = (writtenData as Record<string, unknown>).items as Array<Record<string, unknown>>;
    expect(items).toHaveLength(1);
    expect(items[0].uuid).toBe('r1');
  });
});


// ============================================================
// MI-IT-23 through MI-IT-25: updateClientContractId()
// ============================================================

describe('updateClientContractId()', () => {
  it('MI-IT-23: successful client update', async () => {
    const clientRecord = {
      uuid: 'client-1',
      data: { contractId: '' },
      updatedAt: '2024-01-01T00:00:00Z',
    };

    let writtenClient: Record<string, unknown> | null = null;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      if (opts?.method === 'PUT') {
        writtenClient = JSON.parse(opts.body as string);
        return mockResponse({ success: true });
      }
      return mockResponse(clientRecord);
    }));

    const result = await updateClientContractId(ACCOUNT, BUCKET, 'client-1', 'contract-uuid-1', TOKEN);
    expect(result).toBeNull(); // null = success
    expect(writtenClient).not.toBeNull();
    expect((writtenClient as Record<string, unknown>).data).toHaveProperty('contractId', 'contract-uuid-1');
    // updatedAt should be refreshed
    expect((writtenClient as Record<string, unknown>).updatedAt).not.toBe('2024-01-01T00:00:00Z');
  });

  it('MI-IT-24: client not found (R2 404)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({}, 404)));

    const result = await updateClientContractId(ACCOUNT, BUCKET, 'missing-client', 'contract-uuid-1', TOKEN);
    expect(result).toMatch(/client update failed/);
    expect(result).toMatch(/not found/);
  });

  it('MI-IT-25: client update write fails', async () => {
    const clientRecord = {
      uuid: 'client-1',
      data: { contractId: '' },
      updatedAt: '2024-01-01T00:00:00Z',
    };

    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      if (opts?.method === 'PUT') {
        return mockResponse({}, 500);
      }
      return mockResponse(clientRecord);
    }));

    const result = await updateClientContractId(ACCOUNT, BUCKET, 'client-1', 'contract-uuid-1', TOKEN);
    expect(result).toMatch(/client update failed/);
    expect(result).toMatch(/write failed: HTTP 500/);
  });
});

// ============================================================
// MI-IT-26 through MI-IT-29: writeOutputFiles()
// ============================================================

describe('writeOutputFiles()', () => {
  it('MI-IT-26: success file with records', async () => {
    const mockMkdir = vi.fn().mockResolvedValue(undefined);
    const mockWriteFile = vi.fn().mockResolvedValue(undefined);
    vi.doMock('fs/promises', () => ({ mkdir: mockMkdir, writeFile: mockWriteFile }));

    // Re-import to pick up mock — but since writeOutputFiles uses dynamic import,
    // we need to mock at the module level
    const fs = await import('fs/promises');
    vi.spyOn(fs, 'mkdir').mockResolvedValue(undefined as unknown as string);
    vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

    const successList = [
      { uuid: 'u1', clientId: 'c1', hasCPAContract: true, hasSHContract: false },
      { uuid: 'u2', clientId: 'c2', hasCPAContract: false, hasSHContract: true },
      { uuid: 'u3', clientId: 'c3', hasCPAContract: true, hasSHContract: true },
    ];

    await writeOutputFiles(successList, []);

    const writeFileCalls = (fs.writeFile as Mock).mock.calls;
    const successCall = writeFileCalls.find((c: unknown[]) => (c[0] as string).includes('migration-success.json'));
    expect(successCall).toBeDefined();
    const parsed = JSON.parse(successCall![1] as string);
    expect(parsed).toHaveLength(3);
    expect(parsed[0].uuid).toBe('u1');
  });

  it('MI-IT-27: empty success file', async () => {
    const fs = await import('fs/promises');
    vi.spyOn(fs, 'mkdir').mockResolvedValue(undefined as unknown as string);
    vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

    await writeOutputFiles([], []);

    const writeFileCalls = (fs.writeFile as Mock).mock.calls;
    const successCall = writeFileCalls.find((c: unknown[]) => (c[0] as string).includes('migration-success.json'));
    expect(successCall).toBeDefined();
    expect(JSON.parse(successCall![1] as string)).toEqual([]);
  });

  it('MI-IT-28: error file with records', async () => {
    const fs = await import('fs/promises');
    vi.spyOn(fs, 'mkdir').mockResolvedValue(undefined as unknown as string);
    vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

    const errorList = [
      { id: 'e1', reason: 'read failed', type: 'error' },
      { id: 'e2', reason: 'no active contract type', type: 'error' },
    ];

    await writeOutputFiles([], errorList);

    const writeFileCalls = (fs.writeFile as Mock).mock.calls;
    const errorCall = writeFileCalls.find((c: unknown[]) => (c[0] as string).includes('migration-errors.json'));
    expect(errorCall).toBeDefined();
    const parsed = JSON.parse(errorCall![1] as string);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].id).toBe('e1');
  });

  it('MI-IT-29: empty error file', async () => {
    const fs = await import('fs/promises');
    vi.spyOn(fs, 'mkdir').mockResolvedValue(undefined as unknown as string);
    vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

    await writeOutputFiles([], []);

    const writeFileCalls = (fs.writeFile as Mock).mock.calls;
    const errorCall = writeFileCalls.find((c: unknown[]) => (c[0] as string).includes('migration-errors.json'));
    expect(errorCall).toBeDefined();
    expect(JSON.parse(errorCall![1] as string)).toEqual([]);
  });
});

// ============================================================
// MI-IT-30: printSummary()
// ============================================================

describe('printSummary()', () => {
  it('MI-IT-30: full summary output', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    printSummary(10, 8, 2, 7);

    const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('=== Migration Summary ===');
    expect(output).toContain('Total records found: 10');
    expect(output).toContain('Successfully migrated: 8');
    expect(output).toContain('Errors: 2');
    expect(output).toContain('Client updates: 7');
    expect(output).toContain('migration-success.json');
    expect(output).toContain('migration-errors.json');
  });
});


// ============================================================
// MI-IT-31 through MI-IT-33: migrateContracts() orchestrator
// ============================================================

describe('migrateContracts()', () => {
  it('MI-IT-31: missing env var — exits immediately', async () => {
    // Ensure env vars are NOT set
    delete process.env.CF_API_TOKEN;
    delete process.env.CF_ACCOUNT_ID;
    delete process.env.R2_BUCKET_NAME;
    delete process.env.KV_NAMESPACE_ID;

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(migrateContracts()).rejects.toThrow('process.exit called');
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith('Missing required env var: CF_API_TOKEN');
  });

  it('MI-IT-32: end-to-end with mixed results — 2 successes, 1 error', async () => {
    // Set env vars
    process.env.CF_API_TOKEN = TOKEN;
    process.env.CF_ACCOUNT_ID = ACCOUNT;
    process.env.R2_BUCKET_NAME = BUCKET;
    process.env.KV_NAMESPACE_ID = NAMESPACE;

    const validCPA = {
      id: 'uuid-cpa',
      clienteId: 'cli-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-06-01T00:00:00Z',
      hasCPAContract: true,
      hasSHContract: false,
      modeloCPA: 'M1',
      numeroSerieCPA: 'S1',
      horasAssistenciaAnual: 10,
      deslocacoesPorAno: 5,
      manutencoesPorAno: 3,
    };

    const validSH = {
      id: 'uuid-sh',
      clienteId: 'cli-2',
      createdAt: '2024-02-01T00:00:00Z',
      updatedAt: '2024-07-01T00:00:00Z',
      hasCPAContract: false,
      hasSHContract: true,
      modeloPSO: 'PSO-M',
      numeroSeriePSO: 'PSO-S',
      softwarePSO: 'SW',
    };

    const invalidRecord = { name: 'no-id-record' }; // missing id

    const clientRecord = {
      uuid: 'cli-1',
      data: { contractId: '' },
      updatedAt: '2024-01-01T00:00:00Z',
    };

    // Track calls to understand flow
    const fetchCallIndex = 0;
    const fetchMock = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      const urlStr = url as string;

      // listKvKeys
      if (urlStr.includes('/keys?')) {
        return mockResponse({
          result: [
            { name: 'contratos-1' },
            { name: 'contratos-2' },
            { name: 'contratos-3' },
          ],
          result_info: { count: 3, cursor: '' },
        });
      }

      // readKvValue — return different records based on key
      if (urlStr.includes('/values/contratos-1')) {
        return mockResponse(validCPA);
      }
      if (urlStr.includes('/values/contratos-2')) {
        return mockResponse(validSH);
      }
      if (urlStr.includes('/values/contratos-3')) {
        return mockResponse(invalidRecord);
      }

      // writeR2Object (PUT)
      if (opts?.method === 'PUT') {
        return mockResponse({ success: true });
      }

      // readR2Object — for client reads and index reads
      if (urlStr.includes('content/clients/')) {
        return mockResponse(clientRecord);
      }
      if (urlStr.includes('indexes/contracts-index.json')) {
        return mockResponse({}, 404); // no existing index
      }

      return mockResponse({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock);

    // Mock fs/promises
    const fs = await import('fs/promises');
    vi.spyOn(fs, 'mkdir').mockResolvedValue(undefined as unknown as string);
    const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

    // Mock console
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await migrateContracts();

    // Check output files were written
    const successCall = writeFileSpy.mock.calls.find((c) => (c[0] as string).includes('migration-success.json'));
    const errorCall = writeFileSpy.mock.calls.find((c) => (c[0] as string).includes('migration-errors.json'));

    expect(successCall).toBeDefined();
    expect(errorCall).toBeDefined();

    const successes = JSON.parse(successCall![1] as string);
    const errors = JSON.parse(errorCall![1] as string);

    expect(successes).toHaveLength(2);
    expect(successes[0].uuid).toBe('uuid-cpa');
    expect(successes[1].uuid).toBe('uuid-sh');

    expect(errors).toHaveLength(1);
    expect(errors[0].reason).toBe('required field missing: id');

    // Cleanup env
    delete process.env.CF_API_TOKEN;
    delete process.env.CF_ACCOUNT_ID;
    delete process.env.R2_BUCKET_NAME;
    delete process.env.KV_NAMESPACE_ID;
  });

  it('MI-IT-33: zero records found — empty output files', async () => {
    process.env.CF_API_TOKEN = TOKEN;
    process.env.CF_ACCOUNT_ID = ACCOUNT;
    process.env.R2_BUCKET_NAME = BUCKET;
    process.env.KV_NAMESPACE_ID = NAMESPACE;

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({
      result: [],
      result_info: { count: 0, cursor: '' },
    })));

    const fs = await import('fs/promises');
    vi.spyOn(fs, 'mkdir').mockResolvedValue(undefined as unknown as string);
    const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await migrateContracts();

    const successCall = writeFileSpy.mock.calls.find((c) => (c[0] as string).includes('migration-success.json'));
    const errorCall = writeFileSpy.mock.calls.find((c) => (c[0] as string).includes('migration-errors.json'));

    expect(successCall).toBeDefined();
    expect(errorCall).toBeDefined();
    expect(JSON.parse(successCall![1] as string)).toEqual([]);
    expect(JSON.parse(errorCall![1] as string)).toEqual([]);

    // Cleanup env
    delete process.env.CF_API_TOKEN;
    delete process.env.CF_ACCOUNT_ID;
    delete process.env.R2_BUCKET_NAME;
    delete process.env.KV_NAMESPACE_ID;
  });
});

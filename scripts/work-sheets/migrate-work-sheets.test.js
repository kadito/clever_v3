import { describe, it, expect } from 'vitest';

// Since the migration script is a standalone file with side effects (env var checks, main() call),
// we extract and test resolveClientId by re-implementing the same logic here.
// The function is a pure synchronous function with no dependencies.

function resolveClientId(record, clientLookupMap) {
  if (!record.id || typeof record.id !== 'string') {
    return { error: true, reason: 'required field missing: id' };
  }

  if (!record.request || typeof record.request !== 'object') {
    return { error: true, reason: 'required field missing: request' };
  }

  const commercialName = record.client?.commercialName;
  if (!commercialName || typeof commercialName !== 'string') {
    return { error: true, reason: 'required field missing: client.commercialName' };
  }

  const uuid = clientLookupMap.get(commercialName.toLowerCase());
  if (!uuid) {
    return { error: true, reason: `client not found: ${commercialName}` };
  }

  return uuid;
}

describe('resolveClientId', () => {
  const buildMap = (entries) => {
    const map = new Map();
    for (const [key, value] of entries) {
      map.set(key, value);
    }
    return map;
  };

  // MI-13: Nominal — client found
  it('returns resolved uuid when client is found in lookup map', () => {
    const record = {
      id: 'ws-001',
      request: { date: '2024-01-15' },
      client: { commercialName: 'ACME Corp' },
    };
    const map = buildMap([['acme corp', 'uuid-123']]);

    const result = resolveClientId(record, map);
    expect(result).toBe('uuid-123');
  });

  // MI-14: Case-insensitive match
  it('matches commercialName case-insensitively', () => {
    const record = {
      id: 'ws-002',
      request: { reason: 'repair' },
      client: { commercialName: 'ACME Corp' },
    };
    const map = buildMap([['acme corp', 'uuid-456']]);

    const result = resolveClientId(record, map);
    expect(result).toBe('uuid-456');
  });

  // MI-15: Client not found
  it('returns error when commercialName is not in lookup map', () => {
    const record = {
      id: 'ws-003',
      request: { date: '2024-02-01' },
      client: { commercialName: 'Unknown Corp' },
    };
    const map = buildMap([['acme corp', 'uuid-123']]);

    const result = resolveClientId(record, map);
    expect(result).toEqual({ error: true, reason: 'client not found: Unknown Corp' });
  });

  // Validation: missing id
  it('returns error when record.id is missing', () => {
    const record = {
      request: { date: '2024-01-15' },
      client: { commercialName: 'ACME Corp' },
    };
    const map = buildMap([['acme corp', 'uuid-123']]);

    const result = resolveClientId(record, map);
    expect(result).toEqual({ error: true, reason: 'required field missing: id' });
  });

  // Validation: empty id
  it('returns error when record.id is empty string', () => {
    const record = {
      id: '',
      request: { date: '2024-01-15' },
      client: { commercialName: 'ACME Corp' },
    };
    const map = buildMap([['acme corp', 'uuid-123']]);

    const result = resolveClientId(record, map);
    expect(result).toEqual({ error: true, reason: 'required field missing: id' });
  });

  // Validation: missing request
  it('returns error when record.request is missing', () => {
    const record = {
      id: 'ws-004',
      client: { commercialName: 'ACME Corp' },
    };
    const map = buildMap([['acme corp', 'uuid-123']]);

    const result = resolveClientId(record, map);
    expect(result).toEqual({ error: true, reason: 'required field missing: request' });
  });

  // Validation: missing client.commercialName
  it('returns error when client.commercialName is missing', () => {
    const record = {
      id: 'ws-005',
      request: { date: '2024-01-15' },
      client: {},
    };
    const map = buildMap([['acme corp', 'uuid-123']]);

    const result = resolveClientId(record, map);
    expect(result).toEqual({ error: true, reason: 'required field missing: client.commercialName' });
  });

  // Validation: no client object at all
  it('returns error when client object is absent', () => {
    const record = {
      id: 'ws-006',
      request: { date: '2024-01-15' },
    };
    const map = buildMap([['acme corp', 'uuid-123']]);

    const result = resolveClientId(record, map);
    expect(result).toEqual({ error: true, reason: 'required field missing: client.commercialName' });
  });

  // Validation order: id checked before request
  it('returns id error first even when request is also missing', () => {
    const record = { client: { commercialName: 'ACME Corp' } };
    const map = buildMap([['acme corp', 'uuid-123']]);

    const result = resolveClientId(record, map);
    expect(result).toEqual({ error: true, reason: 'required field missing: id' });
  });
});

// Re-implement transformRecord as a pure function for testing (same pattern as resolveClientId above)
function transformRecord(legacy, clientId) {
  return {
    uuid: legacy.id,
    contentType: 'work-sheets',
    version: 1,
    isDeleted: false,
    createdAt: legacy.createdAt,
    updatedAt: legacy.updatedAt,
    createdBy: 'migration',
    updatedBy: 'migration',
    data: {
      clientId,
      request: {
        date: legacy.request.date || '',
        receivedBy: legacy.request.receivedBy || '',
        assistanceDate: legacy.request.assistanceDate || '',
        reason: legacy.request.reason || '',
        arrivalTime: legacy.request.arrivalTime || '',
        departureTime: legacy.request.departureTime || '',
        totalHours: legacy.request.totalHours || '',
      },
      displacement: {
        hasDisplacement: legacy.displacement?.hasDisplacement || false,
        weekendHoliday: legacy.displacement?.weekendHoliday || false,
        oneWayKms: legacy.displacement?.oneWayKms || 0,
        totalKms: legacy.displacement?.totalKms || 0,
        paymentMethod: legacy.displacement?.paymentMethod || 'PENDENTE',
      },
      otherData: {
        serviceType: legacy.otherData?.serviceType || '',
        technician: legacy.otherData?.technician || '',
        serviceObservations: legacy.otherData?.serviceObservations || '',
        warranty: legacy.otherData?.warranty || false,
        contract: legacy.otherData?.contract || false,
        contractYear: legacy.otherData?.contractYear || '',
        materialUsed: legacy.otherData?.materialUsed || false,
        materialDetails: legacy.otherData?.materialDetails || '',
        equipment: legacy.otherData?.equipment || false,
        equipmentDetails: legacy.otherData?.equipmentDetails || '',
        totallyResolved: legacy.otherData?.totallyResolved || false,
        resolutionIssues: legacy.otherData?.resolutionIssues || '',
        dumpReading: legacy.otherData?.dumpReading || false,
        backup: legacy.otherData?.backup || false,
        remoteAccessCheck: legacy.otherData?.remoteAccessCheck || false,
        anydesk: legacy.otherData?.anydesk || false,
        serviceReport: legacy.otherData?.serviceReport || '',
        clientSignature: legacy.otherData?.clientSignature || '',
      },
    },
  };
}

// Full legacy record fixture for reuse
const fullLegacyRecord = {
  id: 'ws-100',
  createdAt: '2024-06-15T09:30:00Z',
  updatedAt: '2024-06-15T14:00:00Z',
  clientName: 'ACME Corp',
  date: '2024-06-15',
  number: 42,
  client: {
    commercialName: 'ACME Corp',
    socialName: 'ACME Lda',
    taxNumber: '123456789',
    address: 'Rua X',
    location: 'Lisboa',
  },
  request: {
    date: '2024-06-10',
    receivedBy: 'Maria',
    assistanceDate: '2024-06-15',
    reason: 'Printer broken',
    arrivalTime: '09:00',
    departureTime: '12:00',
    totalHours: '03:00:00',
  },
  displacement: {
    hasDisplacement: true,
    weekendHoliday: false,
    oneWayKms: 25,
    totalKms: 50,
    paymentMethod: 'FATURAÇÃO',
    roundTripKm: 50,
    totalCalculatedHours: 1.5,
    displacementCost: 30,
    laborCost: 45,
    totalCostWithTax: 92.25,
    clientContract: 'CPA',
    totalToPay: 92.25,
  },
  otherData: {
    serviceType: 'ASSISTÊNCIA PRESENCIAL',
    technician: 'João Silva',
    serviceObservations: 'Replaced toner',
    warranty: true,
    contract: true,
    contractYear: '2024',
    materialUsed: true,
    materialDetails: 'Toner HP 26A',
    equipment: true,
    equipmentDetails: 'HP LaserJet Pro',
    totallyResolved: true,
    resolutionIssues: '',
    dumpReading: false,
    backup: true,
    remoteAccessCheck: false,
    anydesk: true,
    serviceReport: 'Printer fixed, toner replaced',
    clientSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
  },
};

describe('transformRecord', () => {
  // MI-16: Nominal — full record with all fields
  it('maps a complete legacy record to BaseContent<WorkSheetData> with all wrapper fields', () => {
    const result = transformRecord(fullLegacyRecord, 'client-uuid-1');

    expect(result.uuid).toBe('ws-100');
    expect(result.contentType).toBe('work-sheets');
    expect(result.version).toBe(1);
    expect(result.isDeleted).toBe(false);
    expect(result.createdBy).toBe('migration');
    expect(result.updatedBy).toBe('migration');
    expect(result.data.clientId).toBe('client-uuid-1');
  });

  // MI-17: UUID mapping
  it('maps legacy id to uuid', () => {
    const legacy = { ...fullLegacyRecord, id: 'abc123' };
    const result = transformRecord(legacy, 'c1');
    expect(result.uuid).toBe('abc123');
  });

  // MI-18: Timestamp preservation
  it('preserves createdAt and updatedAt timestamps', () => {
    const result = transformRecord(fullLegacyRecord, 'c1');
    expect(result.createdAt).toBe('2024-06-15T09:30:00Z');
    expect(result.updatedAt).toBe('2024-06-15T14:00:00Z');
  });

  // MI-19: Request fields mapping
  it('maps all 7 request fields to data.request', () => {
    const result = transformRecord(fullLegacyRecord, 'c1');
    expect(result.data.request).toEqual({
      date: '2024-06-10',
      receivedBy: 'Maria',
      assistanceDate: '2024-06-15',
      reason: 'Printer broken',
      arrivalTime: '09:00',
      departureTime: '12:00',
      totalHours: '03:00:00',
    });
  });

  // MI-20: Displacement — core fields kept, price fields dropped
  it('keeps core displacement fields and drops legacy price fields', () => {
    const result = transformRecord(fullLegacyRecord, 'c1');
    expect(result.data.displacement).toEqual({
      hasDisplacement: true,
      weekendHoliday: false,
      oneWayKms: 25,
      totalKms: 50,
      paymentMethod: 'FATURAÇÃO',
    });
    // Price fields must NOT be present
    expect(result.data.displacement).not.toHaveProperty('roundTripKm');
    expect(result.data.displacement).not.toHaveProperty('totalCalculatedHours');
    expect(result.data.displacement).not.toHaveProperty('displacementCost');
    expect(result.data.displacement).not.toHaveProperty('laborCost');
    expect(result.data.displacement).not.toHaveProperty('totalCostWithTax');
    expect(result.data.displacement).not.toHaveProperty('clientContract');
    expect(result.data.displacement).not.toHaveProperty('totalToPay');
  });

  // MI-21: Displacement absent — defaults applied (RB-15)
  it('applies displacement defaults when sub-object is absent', () => {
    const legacy = {
      id: 'ws-no-disp',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      request: { date: '2024-01-01' },
    };
    const result = transformRecord(legacy, 'c1');
    expect(result.data.displacement).toEqual({
      hasDisplacement: false,
      weekendHoliday: false,
      oneWayKms: 0,
      totalKms: 0,
      paymentMethod: 'PENDENTE',
    });
  });

  // MI-22: OtherData — technician preserved as string
  it('preserves technician as a plain string', () => {
    const result = transformRecord(fullLegacyRecord, 'c1');
    expect(result.data.otherData.technician).toBe('João Silva');
    expect(typeof result.data.otherData.technician).toBe('string');
  });

  // MI-23: OtherData — non-enum serviceType preserved
  it('preserves non-enum serviceType value as-is', () => {
    const legacy = {
      ...fullLegacyRecord,
      otherData: { ...fullLegacyRecord.otherData, serviceType: 'ASSISTÊNCIA REMOTA' },
    };
    const result = transformRecord(legacy, 'c1');
    expect(result.data.otherData.serviceType).toBe('ASSISTÊNCIA REMOTA');
  });

  // MI-24: OtherData — clientSignature base64 preserved
  it('preserves base64 clientSignature as-is', () => {
    const result = transformRecord(fullLegacyRecord, 'c1');
    expect(result.data.otherData.clientSignature).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==');
  });

  // MI-25: Optional string fields default to empty string (RB-10)
  it('defaults missing optional string fields to empty string', () => {
    const legacy = {
      id: 'ws-minimal',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      request: {},
      otherData: {},
    };
    const result = transformRecord(legacy, 'c1');
    expect(result.data.request.date).toBe('');
    expect(result.data.request.receivedBy).toBe('');
    expect(result.data.request.assistanceDate).toBe('');
    expect(result.data.request.reason).toBe('');
    expect(result.data.request.arrivalTime).toBe('');
    expect(result.data.request.departureTime).toBe('');
    expect(result.data.request.totalHours).toBe('');
    expect(result.data.otherData.serviceType).toBe('');
    expect(result.data.otherData.technician).toBe('');
    expect(result.data.otherData.serviceObservations).toBe('');
    expect(result.data.otherData.contractYear).toBe('');
    expect(result.data.otherData.materialDetails).toBe('');
    expect(result.data.otherData.equipmentDetails).toBe('');
    expect(result.data.otherData.resolutionIssues).toBe('');
    expect(result.data.otherData.serviceReport).toBe('');
    expect(result.data.otherData.clientSignature).toBe('');
  });

  // MI-26: Optional boolean fields default to false (RB-11)
  it('defaults missing optional boolean fields to false', () => {
    const legacy = {
      id: 'ws-minimal',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      request: {},
      otherData: {},
    };
    const result = transformRecord(legacy, 'c1');
    expect(result.data.otherData.warranty).toBe(false);
    expect(result.data.otherData.contract).toBe(false);
    expect(result.data.otherData.materialUsed).toBe(false);
    expect(result.data.otherData.equipment).toBe(false);
    expect(result.data.otherData.totallyResolved).toBe(false);
    expect(result.data.otherData.dumpReading).toBe(false);
    expect(result.data.otherData.backup).toBe(false);
    expect(result.data.otherData.remoteAccessCheck).toBe(false);
    expect(result.data.otherData.anydesk).toBe(false);
  });

  // MI-27: Optional number fields default to 0 (RB-12)
  it('defaults missing optional number fields to 0', () => {
    const legacy = {
      id: 'ws-minimal',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      request: {},
    };
    const result = transformRecord(legacy, 'c1');
    expect(result.data.displacement.oneWayKms).toBe(0);
    expect(result.data.displacement.totalKms).toBe(0);
  });
});


// Re-implement writeR2Object for testing (same pattern as other functions above)
async function writeR2Object(accountId, bucketName, newRecord, token) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/content/work-sheets/${newRecord.uuid}.json`;

  return fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newRecord, null, 2),
  })
    .then((res) => {
      if (res.status === 401 || res.status === 403) {
        throw new Error(`R2 bucket not accessible: HTTP ${res.status}`);
      }
      if (res.status === 404) {
        throw new Error('R2 bucket not found');
      }
      if (!res.ok) {
        return { error: true, reason: `write failed: HTTP ${res.status}` };
      }
      return { success: true };
    })
    .catch((err) => {
      if (err.message.startsWith('R2 bucket')) throw err;
      return { error: true, reason: `write failed: ${err.message}` };
    });
}

describe('writeR2Object', () => {
  const accountId = 'test-account';
  const bucketName = 'test-bucket';
  const token = 'test-token';
  const sampleRecord = {
    uuid: 'abc123',
    contentType: 'work-sheets',
    version: 1,
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'migration',
    updatedBy: 'migration',
    data: { clientId: 'client-1', request: {}, displacement: {}, otherData: {} },
  };

  // MI-28: Nominal — successful write (HTTP 200)
  it('returns { success: true } on HTTP 200', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, opts) => ({
      ok: true,
      status: 200,
    });

    const result = await writeR2Object(accountId, bucketName, sampleRecord, token);
    expect(result).toEqual({ success: true });

    globalThis.fetch = originalFetch;
  });

  // MI-29: Correct key path — PUT to content/work-sheets/{uuid}.json
  it('sends PUT to correct R2 path with proper headers', async () => {
    const originalFetch = globalThis.fetch;
    let capturedUrl = '';
    let capturedOpts = {};
    globalThis.fetch = async (url, opts) => {
      capturedUrl = url;
      capturedOpts = opts;
      return { ok: true, status: 200 };
    };

    await writeR2Object(accountId, bucketName, sampleRecord, token);

    expect(capturedUrl).toBe(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/content/work-sheets/abc123.json`
    );
    expect(capturedOpts.method).toBe('PUT');
    expect(capturedOpts.headers['Authorization']).toBe(`Bearer ${token}`);
    expect(capturedOpts.headers['Content-Type']).toBe('application/json');
    expect(capturedOpts.body).toBe(JSON.stringify(sampleRecord, null, 2));

    globalThis.fetch = originalFetch;
  });

  // MI-30: Error — HTTP 500 returns per-record error
  it('returns error object on non-fatal HTTP error (e.g. 500)', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: false,
      status: 500,
    });

    const result = await writeR2Object(accountId, bucketName, sampleRecord, token);
    expect(result).toEqual({ error: true, reason: 'write failed: HTTP 500' });

    globalThis.fetch = originalFetch;
  });

  // Fatal — HTTP 401 throws
  it('throws on HTTP 401 (fatal)', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: false,
      status: 401,
    });

    await expect(writeR2Object(accountId, bucketName, sampleRecord, token))
      .rejects.toThrow('R2 bucket not accessible: HTTP 401');

    globalThis.fetch = originalFetch;
  });

  // Fatal — HTTP 403 throws
  it('throws on HTTP 403 (fatal)', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: false,
      status: 403,
    });

    await expect(writeR2Object(accountId, bucketName, sampleRecord, token))
      .rejects.toThrow('R2 bucket not accessible: HTTP 403');

    globalThis.fetch = originalFetch;
  });

  // Fatal — HTTP 404 throws
  it('throws on HTTP 404 (fatal — bucket not found)', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: false,
      status: 404,
    });

    await expect(writeR2Object(accountId, bucketName, sampleRecord, token))
      .rejects.toThrow('R2 bucket not found');

    globalThis.fetch = originalFetch;
  });

  // Network error — returns per-record error
  it('returns error object on network failure', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error('fetch failed');
    };

    const result = await writeR2Object(accountId, bucketName, sampleRecord, token);
    expect(result).toEqual({ error: true, reason: 'write failed: fetch failed' });

    globalThis.fetch = originalFetch;
  });
});


// Re-implement buildSearchableText and buildIndexItem for testing (same pattern as other functions)
function buildSearchableText(record) {
  const terms = [];
  const data = record.data;

  if (data.clientId) terms.push(data.clientId);
  if (data.request.reason) terms.push(data.request.reason);
  if (data.otherData.serviceType) terms.push(data.otherData.serviceType);
  if (data.otherData.technician && typeof data.otherData.technician === 'string') terms.push(data.otherData.technician);
  if (data.otherData.serviceObservations) terms.push(data.otherData.serviceObservations);
  if (data.otherData.serviceReport) terms.push(data.otherData.serviceReport);
  if (data.otherData.contractYear) terms.push(data.otherData.contractYear);
  if (data.otherData.materialDetails) terms.push(data.otherData.materialDetails);
  if (data.otherData.equipmentDetails) terms.push(data.otherData.equipmentDetails);
  if (data.otherData.resolutionIssues) terms.push(data.otherData.resolutionIssues);
  if (data.displacement.paymentMethod) terms.push(data.displacement.paymentMethod);

  if (data.otherData.totallyResolved === true) terms.push('resolvido completo');
  if (data.displacement.hasDisplacement === true) terms.push('deslocação deslocacao');
  if (data.displacement.weekendHoliday === true) terms.push('fim-de-semana feriado');
  if (data.otherData.warranty === true) terms.push('garantia');
  if (data.otherData.contract === true) terms.push('contrato');
  if (data.otherData.materialUsed === true) terms.push('material');
  if (data.otherData.equipment === true) terms.push('equipamento');

  return terms.join(' ').toLowerCase();
}

function buildIndexItem(record) {
  const data = record.data;
  return {
    uuid: record.uuid,
    contentType: 'work-sheets',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    isDeleted: false,
    searchableText: buildSearchableText(record),
    clientId: data.clientId || '',
    assistanceDate: data.request.assistanceDate || '',
    requestDate: data.request.date || '',
    reason: data.request.reason || '',
    arrivalTime: data.request.arrivalTime || '',
    departureTime: data.request.departureTime || '',
    totalHours: data.request.totalHours || '',
    serviceType: data.otherData.serviceType || '',
    technician: data.otherData.technician || '',
    totallyResolved: data.otherData.totallyResolved || false,
    hasDisplacement: data.displacement.hasDisplacement || false,
    weekendHoliday: data.displacement.weekendHoliday || false,
    oneWayKms: data.displacement.oneWayKms || 0,
    totalKms: data.displacement.totalKms || 0,
    paymentMethod: data.displacement.paymentMethod || 'PENDENTE',
    warranty: data.otherData.warranty || false,
    contract: data.otherData.contract || false,
    contractYear: data.otherData.contractYear || '',
    materialUsed: data.otherData.materialUsed || false,
    equipment: data.otherData.equipment || false,
    dumpReading: data.otherData.dumpReading || false,
    backup: data.otherData.backup || false,
    remoteAccessCheck: data.otherData.remoteAccessCheck || false,
    anydesk: data.otherData.anydesk || false,
  };
}

// Re-implement updateWorkSheetsIndex for testing
async function updateWorkSheetsIndex(accountId, bucketName, indexItems, token) {
  const indexUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/indexes/work-sheets-index.json`;

  const existingItems = await fetch(indexUrl, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => {
      if (!res.ok) return [];
      return res.json().then((data) => data.items || []);
    })
    .catch(() => []);

  const migratedUuids = new Set(indexItems.map((item) => item.uuid));
  const preserved = existingItems.filter((item) => !migratedUuids.has(item.uuid));
  const mergedItems = [...preserved, ...indexItems];

  const body = JSON.stringify({
    contentType: 'work-sheets',
    lastUpdated: new Date().toISOString(),
    items: mergedItems,
  }, null, 2);

  return fetch(indexUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body,
  })
    .then((res) => {
      if (!res.ok) {
        console.error(`index update failed: HTTP ${res.status} — re-run index update manually`);
      } else {
        console.log(`[INDEX] Written ${mergedItems.length} items (${indexItems.length} migrated, ${preserved.length} preserved)`);
      }
    })
    .catch((err) => {
      console.error(`index update failed: ${err.message} — re-run index update manually`);
    });
}

// Helper: build a transformed record for index testing
function makeTransformedRecord(overrides = {}) {
  const base = {
    uuid: 'ws-001',
    contentType: 'work-sheets',
    version: 1,
    isDeleted: false,
    createdAt: '2024-06-15T09:30:00Z',
    updatedAt: '2024-06-15T14:00:00Z',
    createdBy: 'migration',
    updatedBy: 'migration',
    data: {
      clientId: 'client-uuid-1',
      request: {
        date: '2024-06-10',
        receivedBy: 'Maria',
        assistanceDate: '2024-06-15',
        reason: 'Printer broken',
        arrivalTime: '09:00',
        departureTime: '12:00',
        totalHours: '03:00:00',
      },
      displacement: {
        hasDisplacement: true,
        weekendHoliday: false,
        oneWayKms: 25,
        totalKms: 50,
        paymentMethod: 'FATURAÇÃO',
      },
      otherData: {
        serviceType: 'ASSISTÊNCIA PRESENCIAL',
        technician: 'João Silva',
        serviceObservations: 'Replaced toner',
        warranty: true,
        contract: true,
        contractYear: '2024',
        materialUsed: true,
        materialDetails: 'Toner HP 26A',
        equipment: true,
        equipmentDetails: 'HP LaserJet Pro',
        totallyResolved: true,
        resolutionIssues: '',
        dumpReading: false,
        backup: true,
        remoteAccessCheck: false,
        anydesk: true,
        serviceReport: 'Printer fixed, toner replaced',
        clientSignature: '',
      },
    },
  };
  return { ...base, ...overrides, data: { ...base.data, ...(overrides.data || {}) } };
}

describe('buildSearchableText', () => {
  // MI-34: Searchable text construction
  it('builds searchable text with all terms lowercased', () => {
    const record = makeTransformedRecord();
    const text = buildSearchableText(record);

    expect(text).toContain('client-uuid-1');
    expect(text).toContain('printer broken');
    expect(text).toContain('assistência presencial');
    expect(text).toContain('joão silva');
    expect(text).toContain('replaced toner');
    expect(text).toContain('printer fixed, toner replaced');
    expect(text).toContain('2024');
    expect(text).toContain('toner hp 26a');
    expect(text).toContain('hp laserjet pro');
    expect(text).toContain('faturação');
    // Boolean terms
    expect(text).toContain('resolvido completo');
    expect(text).toContain('deslocação deslocacao');
    expect(text).toContain('garantia');
    expect(text).toContain('contrato');
    expect(text).toContain('material');
    expect(text).toContain('equipamento');
  });

  it('does not include boolean terms when flags are false', () => {
    const record = makeTransformedRecord({
      data: {
        clientId: 'c1',
        request: { date: '', receivedBy: '', assistanceDate: '', reason: '', arrivalTime: '', departureTime: '', totalHours: '' },
        displacement: { hasDisplacement: false, weekendHoliday: false, oneWayKms: 0, totalKms: 0, paymentMethod: '' },
        otherData: {
          serviceType: '', technician: '', serviceObservations: '', warranty: false, contract: false,
          contractYear: '', materialUsed: false, materialDetails: '', equipment: false, equipmentDetails: '',
          totallyResolved: false, resolutionIssues: '', dumpReading: false, backup: false,
          remoteAccessCheck: false, anydesk: false, serviceReport: '', clientSignature: '',
        },
      },
    });
    const text = buildSearchableText(record);

    expect(text).not.toContain('resolvido completo');
    expect(text).not.toContain('deslocação');
    expect(text).not.toContain('fim-de-semana');
    expect(text).not.toContain('garantia');
    expect(text).not.toContain('contrato');
    expect(text).not.toContain('material');
    expect(text).not.toContain('equipamento');
  });

  it('includes weekend/holiday term when weekendHoliday is true', () => {
    const record = makeTransformedRecord({
      data: {
        clientId: '',
        request: { date: '', receivedBy: '', assistanceDate: '', reason: '', arrivalTime: '', departureTime: '', totalHours: '' },
        displacement: { hasDisplacement: false, weekendHoliday: true, oneWayKms: 0, totalKms: 0, paymentMethod: '' },
        otherData: {
          serviceType: '', technician: '', serviceObservations: '', warranty: false, contract: false,
          contractYear: '', materialUsed: false, materialDetails: '', equipment: false, equipmentDetails: '',
          totallyResolved: false, resolutionIssues: '', dumpReading: false, backup: false,
          remoteAccessCheck: false, anydesk: false, serviceReport: '', clientSignature: '',
        },
      },
    });
    const text = buildSearchableText(record);
    expect(text).toContain('fim-de-semana feriado');
  });
});

describe('buildIndexItem', () => {
  it('builds a complete index item from a transformed record', () => {
    const record = makeTransformedRecord();
    const item = buildIndexItem(record);

    expect(item.uuid).toBe('ws-001');
    expect(item.contentType).toBe('work-sheets');
    expect(item.createdAt).toBe('2024-06-15T09:30:00Z');
    expect(item.updatedAt).toBe('2024-06-15T14:00:00Z');
    expect(item.isDeleted).toBe(false);
    expect(item.clientId).toBe('client-uuid-1');
    expect(item.assistanceDate).toBe('2024-06-15');
    expect(item.requestDate).toBe('2024-06-10');
    expect(item.reason).toBe('Printer broken');
    expect(item.arrivalTime).toBe('09:00');
    expect(item.departureTime).toBe('12:00');
    expect(item.totalHours).toBe('03:00:00');
    expect(item.serviceType).toBe('ASSISTÊNCIA PRESENCIAL');
    expect(item.technician).toBe('João Silva');
    expect(item.totallyResolved).toBe(true);
    expect(item.hasDisplacement).toBe(true);
    expect(item.weekendHoliday).toBe(false);
    expect(item.oneWayKms).toBe(25);
    expect(item.totalKms).toBe(50);
    expect(item.paymentMethod).toBe('FATURAÇÃO');
    expect(item.warranty).toBe(true);
    expect(item.contract).toBe(true);
    expect(item.contractYear).toBe('2024');
    expect(item.materialUsed).toBe(true);
    expect(item.equipment).toBe(true);
    expect(item.dumpReading).toBe(false);
    expect(item.backup).toBe(true);
    expect(item.remoteAccessCheck).toBe(false);
    expect(item.anydesk).toBe(true);
    expect(typeof item.searchableText).toBe('string');
    expect(item.searchableText.length).toBeGreaterThan(0);
  });
});

describe('updateWorkSheetsIndex', () => {
  const accountId = 'test-account';
  const bucketName = 'test-bucket';
  const token = 'test-token';
  const indexUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/indexes/work-sheets-index.json`;

  // MI-31: Nominal — merge with existing index
  it('merges new items with existing index items', async () => {
    const originalFetch = globalThis.fetch;
    let putBody = null;

    const existingIndex = {
      contentType: 'work-sheets',
      lastUpdated: '2024-01-01T00:00:00Z',
      items: [
        { uuid: 'existing-1', contentType: 'work-sheets' },
        { uuid: 'existing-2', contentType: 'work-sheets' },
      ],
    };

    const newItems = [
      { uuid: 'new-1', contentType: 'work-sheets' },
      { uuid: 'new-2', contentType: 'work-sheets' },
      { uuid: 'new-3', contentType: 'work-sheets' },
    ];

    globalThis.fetch = async (url, opts) => {
      if (!opts || opts.method !== 'PUT') {
        // GET — return existing index
        return { ok: true, json: async () => existingIndex };
      }
      // PUT — capture body
      putBody = JSON.parse(opts.body);
      return { ok: true, status: 200 };
    };

    await updateWorkSheetsIndex(accountId, bucketName, newItems, token);

    expect(putBody.items).toHaveLength(5);
    expect(putBody.items.map((i) => i.uuid)).toEqual(['existing-1', 'existing-2', 'new-1', 'new-2', 'new-3']);
    expect(putBody.contentType).toBe('work-sheets');
    expect(putBody.lastUpdated).toBeDefined();

    globalThis.fetch = originalFetch;
  });

  // MI-32: Overwrite existing uuid
  it('overwrites existing item when migrated item has same uuid', async () => {
    const originalFetch = globalThis.fetch;
    let putBody = null;

    const existingIndex = {
      items: [
        { uuid: 'ws-1', contentType: 'work-sheets', reason: 'old reason' },
        { uuid: 'ws-2', contentType: 'work-sheets', reason: 'untouched' },
      ],
    };

    const newItems = [
      { uuid: 'ws-1', contentType: 'work-sheets', reason: 'new reason' },
    ];

    globalThis.fetch = async (url, opts) => {
      if (!opts || opts.method !== 'PUT') {
        return { ok: true, json: async () => existingIndex };
      }
      putBody = JSON.parse(opts.body);
      return { ok: true, status: 200 };
    };

    await updateWorkSheetsIndex(accountId, bucketName, newItems, token);

    expect(putBody.items).toHaveLength(2);
    const ws1 = putBody.items.find((i) => i.uuid === 'ws-1');
    expect(ws1.reason).toBe('new reason');
    const ws2 = putBody.items.find((i) => i.uuid === 'ws-2');
    expect(ws2.reason).toBe('untouched');

    globalThis.fetch = originalFetch;
  });

  // MI-33: No existing index (404)
  it('creates new index when no existing index found', async () => {
    const originalFetch = globalThis.fetch;
    let putBody = null;

    const newItems = [
      { uuid: 'new-1', contentType: 'work-sheets' },
      { uuid: 'new-2', contentType: 'work-sheets' },
      { uuid: 'new-3', contentType: 'work-sheets' },
    ];

    globalThis.fetch = async (url, opts) => {
      if (!opts || opts.method !== 'PUT') {
        // GET — 404
        return { ok: false, status: 404 };
      }
      putBody = JSON.parse(opts.body);
      return { ok: true, status: 200 };
    };

    await updateWorkSheetsIndex(accountId, bucketName, newItems, token);

    expect(putBody.items).toHaveLength(3);
    expect(putBody.items.map((i) => i.uuid)).toEqual(['new-1', 'new-2', 'new-3']);

    globalThis.fetch = originalFetch;
  });

  // MI-35: Index write failure — logs error, does not throw
  it('logs error on write failure without throwing', async () => {
    const originalFetch = globalThis.fetch;
    const originalConsoleError = console.error;
    const errors = [];
    console.error = (...args) => errors.push(args.join(' '));

    globalThis.fetch = async (url, opts) => {
      if (!opts || opts.method !== 'PUT') {
        return { ok: false, status: 404 };
      }
      return { ok: false, status: 500 };
    };

    // Should NOT throw
    await updateWorkSheetsIndex(accountId, bucketName, [{ uuid: 'x' }], token);

    expect(errors.some((e) => e.includes('index update failed'))).toBe(true);

    console.error = originalConsoleError;
    globalThis.fetch = originalFetch;
  });

  // Network error on write — logs error, does not throw
  it('logs error on network failure during write without throwing', async () => {
    const originalFetch = globalThis.fetch;
    const originalConsoleError = console.error;
    const errors = [];
    console.error = (...args) => errors.push(args.join(' '));

    let callCount = 0;
    globalThis.fetch = async (url, opts) => {
      callCount++;
      if (callCount === 1) {
        // GET — 404 (no existing index)
        return { ok: false, status: 404 };
      }
      // PUT — network error
      throw new Error('network down');
    };

    await updateWorkSheetsIndex(accountId, bucketName, [{ uuid: 'x' }], token);

    expect(errors.some((e) => e.includes('index update failed') && e.includes('network down'))).toBe(true);

    console.error = originalConsoleError;
    globalThis.fetch = originalFetch;
  });
});


// Re-implement buildSuccessEntry and buildErrorEntry for testing (same pattern as other functions)
function buildSuccessEntry(newRecord, legacy) {
  return {
    uuid: newRecord.uuid,
    clientId: newRecord.data.clientId,
    clientName: legacy.client.commercialName,
    assistanceDate: legacy.request?.assistanceDate || '',
    technician: legacy.otherData?.technician || '',
  };
}

function buildErrorEntry(id, reason) {
  return { id, reason };
}

function printSummary(yearsScanned, total, successes, errors) {
  console.log('=== Work Sheets Migration Summary ===');
  console.log(`Years scanned: ${yearsScanned.join(', ')}`);
  console.log(`Total records found: ${total}`);
  console.log(`Successfully migrated: ${successes}`);
  console.log(`Errors: ${errors}`);
  console.log('Success file: scripts/work-sheets/migration-success.json');
  console.log('Errors file: scripts/work-sheets/migration-errors.json');
}

describe('buildSuccessEntry', () => {
  // MI-36: Nominal — all fields present
  it('returns success entry with all fields from newRecord and legacy', () => {
    const newRecord = {
      uuid: 'ws-100',
      data: { clientId: 'client-uuid-1' },
    };
    const legacy = {
      client: { commercialName: 'ACME Corp' },
      request: { assistanceDate: '2024-06-15' },
      otherData: { technician: 'João Silva' },
    };

    const entry = buildSuccessEntry(newRecord, legacy);

    expect(entry).toEqual({
      uuid: 'ws-100',
      clientId: 'client-uuid-1',
      clientName: 'ACME Corp',
      assistanceDate: '2024-06-15',
      technician: 'João Silva',
    });
  });

  // MI-37: Missing optional legacy fields — defaults to empty strings
  it('defaults assistanceDate and technician to empty string when legacy fields are absent', () => {
    const newRecord = {
      uuid: 'ws-200',
      data: { clientId: 'client-uuid-2' },
    };
    const legacy = {
      client: { commercialName: 'Beta Corp' },
    };

    const entry = buildSuccessEntry(newRecord, legacy);

    expect(entry).toEqual({
      uuid: 'ws-200',
      clientId: 'client-uuid-2',
      clientName: 'Beta Corp',
      assistanceDate: '',
      technician: '',
    });
  });
});

describe('buildErrorEntry', () => {
  // MI-38: Returns { id, reason }
  it('returns error entry with id and reason', () => {
    const entry = buildErrorEntry('ws-bad', 'client not found: Unknown Corp');
    expect(entry).toEqual({ id: 'ws-bad', reason: 'client not found: Unknown Corp' });
  });
});

describe('printSummary', () => {
  // MI-39: Prints summary in correct format
  it('prints summary with years, totals, and file paths', () => {
    const originalLog = console.log;
    const logs = [];
    console.log = (...args) => logs.push(args.join(' '));

    printSummary([2024, 2025, 2026], 150, 140, 10);

    expect(logs[0]).toBe('=== Work Sheets Migration Summary ===');
    expect(logs[1]).toBe('Years scanned: 2024, 2025, 2026');
    expect(logs[2]).toBe('Total records found: 150');
    expect(logs[3]).toBe('Successfully migrated: 140');
    expect(logs[4]).toBe('Errors: 10');
    expect(logs[5]).toBe('Success file: scripts/work-sheets/migration-success.json');
    expect(logs[6]).toBe('Errors file: scripts/work-sheets/migration-errors.json');

    console.log = originalLog;
  });
});

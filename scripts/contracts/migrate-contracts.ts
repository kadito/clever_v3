#!/usr/bin/env tsx

// ============================================================
// KV → R2 Contracts Migration Script
// Run: npx tsx scripts/contracts/migrate-contracts.ts
// Requires: CF_API_TOKEN, CF_ACCOUNT_ID, R2_BUCKET_NAME, KV_NAMESPACE_ID
// ============================================================

// --- KV API helpers ---

export async function listKvKeys(accountId: string, namespaceId: string, token: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor: string | null = null;

  const fetchPage = (url: string) =>
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          throw new Error(`KV namespace not accessible: HTTP ${res.status}`);
        }
        if (res.status === 404) {
          throw new Error('KV namespace not found');
        }
        if (!res.ok) {
          throw new Error(`KV namespace not accessible: HTTP ${res.status}`);
        }
        return res.json();
      })
      .catch((err: Error) => {
        if (err.message.startsWith('KV namespace')) throw err;
        throw new Error(`Network error listing KV keys: ${err.message}`);
      });

  const fetchNext = (): Promise<string[]> => {
    const params = new URLSearchParams({ prefix: 'contratos-', limit: '1000' });
    if (cursor) params.set('cursor', cursor);
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/keys?${params}`;

    return fetchPage(url).then((data: any) => {
      for (const item of data.result) {
        keys.push(item.name);
      }
      if (data.result_info.count < 1000) {
        return keys;
      }
      cursor = data.result_info.cursor;
      return fetchNext();
    });
  };

  return fetchNext();
}

// --- KV value reader ---

export async function readKvValue(accountId: string, namespaceId: string, keyName: string, token: string): Promise<any> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${keyName}`;

  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => {
      if (!res.ok) {
        return { error: true, reason: `read failed: HTTP ${res.status}` };
      }
      return res.text().then((text) => {
        try {
          return JSON.parse(text);
        } catch (parseError: any) {
          return { error: true, reason: `invalid JSON: ${parseError.message}` };
        }
      });
    })
    .catch((err: Error) => {
      return { error: true, reason: `read failed: ${err.message}` };
    });
}

// --- R2 API helpers ---

export async function writeR2Object(
  accountId: string,
  bucketName: string,
  key: string,
  data: unknown,
  token: string,
): Promise<{ success: true } | { error: true; reason: string }> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${key}`;

  return fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data, null, 2),
  })
    .then((res) => {
      if (res.status === 401 || res.status === 403) {
        throw new Error(`R2 bucket not accessible: HTTP ${res.status}`);
      }
      if (res.status === 404) {
        throw new Error('R2 bucket not found');
      }
      if (!res.ok) {
        return { error: true as const, reason: `write failed: HTTP ${res.status}` };
      }
      return { success: true as const };
    })
    .catch((err: Error) => {
      if (err.message.startsWith('R2 bucket')) throw err;
      return { error: true as const, reason: `write failed: ${err.message}` };
    });
}

export async function readR2Object(
  accountId: string,
  bucketName: string,
  key: string,
  token: string,
): Promise<any | { error: true; reason: string }> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${key}`;

  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => {
      if (res.status === 404) {
        return { error: true, reason: 'not found' };
      }
      if (!res.ok) {
        return { error: true, reason: `read failed: HTTP ${res.status}` };
      }
      return res.text().then((text) => JSON.parse(text));
    })
    .catch((err: Error) => {
      return { error: true, reason: `read failed: ${err.message}` };
    });
}

// --- Record transformation ---

export function transformRecord(
  legacy: Record<string, any>,
): { error: true; id: string | null; reason: string } | Record<string, any> {
  // 1. Validate id
  if (!legacy.id) {
    return { error: true, id: null, reason: 'required field missing: id' };
  }

  // 2. Validate clienteId
  if (!legacy.clienteId) {
    return { error: true, id: legacy.id, reason: 'required field missing: clienteId' };
  }

  // 3. Resolve hasCPAContract with temCPA fallback
  const hasCPAContract =
    'hasCPAContract' in legacy
      ? Boolean(legacy.hasCPAContract)
      : 'temCPA' in legacy
        ? Boolean(legacy.temCPA)
        : false;

  // 4. Resolve hasSHContract
  const hasSHContract = 'hasSHContract' in legacy ? Boolean(legacy.hasSHContract) : false;

  // 5. Validate at least one active contract type
  if (!hasCPAContract && !hasSHContract) {
    return { error: true, id: legacy.id, reason: 'no active contract type' };
  }

  // Equipment arrays
  const cpaEquipments =
    hasCPAContract && (typeof legacy.modeloCPA === 'string' && legacy.modeloCPA !== '' || typeof legacy.numeroSerieCPA === 'string' && legacy.numeroSerieCPA !== '')
      ? [{ id: crypto.randomUUID(), modelo: legacy.modeloCPA || '', numeroSerie: legacy.numeroSerieCPA || '', desconto: 0, observacoes: '' }]
      : [];

  const shEquipments =
    hasSHContract && (typeof legacy.modeloPSO === 'string' && legacy.modeloPSO !== '' || typeof legacy.numeroSeriePSO === 'string' && legacy.numeroSeriePSO !== '')
      ? [{ id: crypto.randomUUID(), modelo: legacy.modeloPSO || '', numeroSerie: legacy.numeroSeriePSO || '', software: legacy.softwarePSO || '', observacoes: '' }]
      : [];

  // Shared service details — S&H is primary when both active
  const horasAssistenciaAnual = Number(legacy.horasAssistenciaAnual) || 0;
  const deslocacoesPorAno = Number(legacy.deslocacoesPorAno) || 0;
  const manutencoesPorAno = Number(legacy.manutencoesPorAno) || 0;

  const shGetsShared = hasSHContract;
  const cpaGetsShared = hasCPAContract && !hasSHContract;

  return {
    uuid: legacy.id,
    contentType: 'contracts',
    version: 1,
    isDeleted: false,
    createdAt: legacy.createdAt,
    updatedAt: legacy.updatedAt,
    createdBy: 'migration',
    updatedBy: 'migration',
    data: {
      clientId: legacy.clienteId,
      hasCPAContract,
      hasSHContract,
      cpaContractType: '',
      hasPOSPackage: false,
      planIdCPA: legacy.planIdCPA || '',
      distanceCPA: legacy.distanceCPA || '',
      modalidadePagamentoCPA: legacy.modalidadePagamentoCPA || '',
      inicioContratoCPA: legacy.inicioContratoCPA || '',
      fimContratoCPA: legacy.fimContratoCPA || '',
      cpaEquipments,
      horasAssistenciaAnualCPA: cpaGetsShared ? horasAssistenciaAnual : 0,
      deslocacoesPorAnoCPA: cpaGetsShared ? deslocacoesPorAno : 0,
      manutencoesPorAnoCPA: cpaGetsShared ? manutencoesPorAno : 0,
      planIdSH: legacy.planIdSH || '',
      distanceSH: legacy.distanceSH || '',
      modalidadePagamentoSH: legacy.modalidadePagamentoSH || '',
      inicioContratoSH: legacy.inicioContratoSH || '',
      fimContratoSH: legacy.fimContratoSH || '',
      shEquipments,
      horasAssistenciaAnualSH: shGetsShared ? horasAssistenciaAnual : 0,
      deslocacoesPorAnoSH: shGetsShared ? deslocacoesPorAno : 0,
      manutencoesPorAnoSH: shGetsShared ? manutencoesPorAno : 0,
      metodoPagamento: '',
    },
  };
}

// --- Index build and merge ---

export function buildContractSearchText(data: Record<string, any>): string {
  const fields: string[] = [
    data.hasCPAContract ? 'CPA' : '',
    data.hasSHContract ? 'S&H' : '',
    ...(data.cpaEquipments || []).map((e: any) => e.modelo),
    ...(data.cpaEquipments || []).map((e: any) => e.numeroSerie),
    ...(data.shEquipments || []).map((e: any) => e.modelo),
    ...(data.shEquipments || []).map((e: any) => e.numeroSerie),
    data.planIdCPA || '',
    data.planIdSH || '',
  ];
  return fields
    .filter((f) => f && typeof f === 'string')
    .join(' ')
    .toLowerCase()
    .trim();
}

export function buildIndexItem(record: Record<string, any>): Record<string, any> {
  return {
    uuid: record.uuid,
    contentType: 'contracts',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    isDeleted: false,
    searchableText: buildContractSearchText(record.data),
    clientId: record.data.clientId,
    hasCPAContract: record.data.hasCPAContract,
    hasSHContract: record.data.hasSHContract,
    planIdCPA: record.data.planIdCPA || '',
    planIdSH: record.data.planIdSH || '',
    inicioContratoCPA: record.data.inicioContratoCPA || '',
    fimContratoCPA: record.data.fimContratoCPA || '',
    inicioContratoSH: record.data.inicioContratoSH || '',
    fimContratoSH: record.data.fimContratoSH || '',
  };
}

export async function updateContractIndex(
  accountId: string,
  bucketName: string,
  migratedRecords: Record<string, any>[],
  token: string,
): Promise<void> {
  const indexKey = 'indexes/contracts-index.json';

  const existing = await readR2Object(accountId, bucketName, indexKey, token).then((result: any) => {
    if (result?.error && result.reason === 'not found') {
      return [];
    }
    if (result?.error) {
      console.error(`Failed to read existing index: ${result.reason} — starting with empty index`);
      return [];
    }
    return result?.items || [];
  });

  const migratedUuids = new Set(migratedRecords.map((r) => r.uuid));
  const filtered = existing.filter((item: any) => !migratedUuids.has(item.uuid));
  const newItems = migratedRecords.map((r) => buildIndexItem(r));
  const merged = [...filtered, ...newItems].sort((a: any, b: any) => {
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  const indexData = {
    contentType: 'contracts',
    lastUpdated: new Date().toISOString(),
    items: merged,
  };

  await writeR2Object(accountId, bucketName, indexKey, indexData, token)
    .then((result: any) => {
      if (result?.error) {
        console.error(`Index write failed: ${result.reason} — re-run index update manually`);
      }
    })
    .catch((err: Error) => {
      console.error(`Index write failed: ${err.message} — re-run index update manually`);
    });
}

// --- Client sync — contractId update ---

export async function updateClientContractId(
  accountId: string,
  bucketName: string,
  clientId: string,
  contractUuid: string,
  token: string,
): Promise<string | null> {
  const clientKey = `content/clients/${clientId}.json`;

  const client = await readR2Object(accountId, bucketName, clientKey, token).catch((err: Error) => {
    return { error: true, reason: `read failed: ${err.message}` };
  });

  if (client?.error) {
    return `client update failed: ${client.reason}`;
  }

  client.data.contractId = contractUuid;
  client.updatedAt = new Date().toISOString();

  return await writeR2Object(accountId, bucketName, clientKey, client, token)
    .then((result: any) => {
      if (result?.error) {
        return `client update failed: ${result.reason}`;
      }
      return null;
    })
    .catch((err: Error) => {
      return `client update failed: ${err.message}`;
    });
}

// --- Output file writers and console summary ---

export async function writeOutputFiles(successList: Record<string, any>[], errorList: Record<string, any>[]): Promise<void> {
  const fs = await import('fs/promises');

  await fs.mkdir('scripts/contracts', { recursive: true }).catch(() => {});

  await fs.writeFile('scripts/contracts/migration-success.json', JSON.stringify(successList, null, 2))
    .catch((err: Error) => console.error(`Failed to write migration-success.json: ${err.message}`));

  await fs.writeFile('scripts/contracts/migration-errors.json', JSON.stringify(errorList, null, 2))
    .catch((err: Error) => console.error(`Failed to write migration-errors.json: ${err.message}`));
}

export function printSummary(total: number, successes: number, errors: number, clientUpdates: number): void {
  console.log('=== Migration Summary ===');
  console.log(`Total records found: ${total}`);
  console.log(`Successfully migrated: ${successes}`);
  console.log(`Errors: ${errors}`);
  console.log(`Client updates: ${clientUpdates}`);
  console.log('Output files:');
  console.log('  - scripts/contracts/migration-success.json');
  console.log('  - scripts/contracts/migration-errors.json');
}

// --- Main orchestrator ---

export async function migrateContracts(): Promise<void> {
  // --- Environment validation (inside function so imports don't fail) ---
  const token = process.env.CF_API_TOKEN;
  if (!token) {
    console.error('Missing required env var: CF_API_TOKEN');
    process.exit(1);
  }

  const accountId = process.env.CF_ACCOUNT_ID;
  if (!accountId) {
    console.error('Missing required env var: CF_ACCOUNT_ID');
    process.exit(1);
  }

  const bucketName = process.env.R2_BUCKET_NAME;
  if (!bucketName) {
    console.error('Missing required env var: R2_BUCKET_NAME');
    process.exit(1);
  }

  const namespaceId = process.env.KV_NAMESPACE_ID;
  if (!namespaceId) {
    console.error('Missing required env var: KV_NAMESPACE_ID');
    process.exit(1);
  }

  console.log('[START] Contracts migration started');
  console.log(`  Account: ${accountId}`);
  console.log(`  KV Namespace: ${namespaceId}`);
  console.log(`  R2 Bucket: ${bucketName}`);

  // Step 1: List all KV keys with prefix contratos-
  console.log('\n[LIST] Fetching all contratos- keys from KV...');
  const keys = await listKvKeys(accountId, namespaceId, token);
  // Note: listKvKeys throws on fatal errors — let it propagate and crash
  console.log(`[LIST] Found ${keys.length} keys`);

  if (keys.length === 0) {
    console.log('[DONE] No records to migrate');
    await writeOutputFiles([], []);
    printSummary(0, 0, 0, 0);
    return;
  }

  const successList: Record<string, any>[] = [];
  const errorList: Record<string, any>[] = [];
  const migratedRecords: Record<string, any>[] = [];
  let clientUpdates = 0;

  // Steps 2-8: For each key: read → transform → write → update client
  for (let i = 0; i < keys.length; i++) {
    const keyName = keys[i];
    console.log(`\n[${i + 1}/${keys.length}] Processing: ${keyName}`);

    // Read KV value
    const valueResult = await readKvValue(accountId, namespaceId, keyName, token);
    if (valueResult?.error) {
      console.log(`  ✗ Read failed: ${valueResult.reason}`);
      errorList.push({ id: keyName, reason: valueResult.reason, type: 'error' });
      continue;
    }

    // Transform record
    const transformed = transformRecord(valueResult);
    if (transformed.error) {
      console.log(`  ✗ Transform failed: ${transformed.reason}`);
      errorList.push({ id: transformed.id || keyName, reason: transformed.reason, type: 'error' });
      continue;
    }

    // Write to R2
    const writeKey = `content/contracts/${transformed.uuid}.json`;
    const writeResult = await writeR2Object(accountId, bucketName, writeKey, transformed, token);
    // Note: writeR2Object throws on fatal errors (401/403/404) — let it propagate
    if (writeResult?.error) {
      console.log(`  ✗ Write failed: ${writeResult.reason}`);
      errorList.push({ id: transformed.uuid, reason: writeResult.reason, type: 'error' });
      continue;
    }

    console.log(`  ✓ Migrated → ${writeKey}`);

    // Add to success list and migrated records for index
    successList.push({
      uuid: transformed.uuid,
      clientId: transformed.data.clientId,
      hasCPAContract: transformed.data.hasCPAContract,
      hasSHContract: transformed.data.hasSHContract,
    });
    migratedRecords.push(transformed);

    // Update client contractId
    const clientWarning = await updateClientContractId(accountId, bucketName, transformed.data.clientId, transformed.uuid, token);
    if (clientWarning) {
      console.log(`  ⚠ ${clientWarning}`);
      errorList.push({ id: transformed.uuid, reason: clientWarning, type: 'warning' });
    } else {
      clientUpdates++;
    }
  }

  // Step 9: Update contracts index
  console.log(`\n[INDEX] Updating index with ${migratedRecords.length} records...`);
  await updateContractIndex(accountId, bucketName, migratedRecords, token);

  // Step 10: Write output files
  console.log('[FILES] Writing output files...');
  await writeOutputFiles(successList, errorList);

  // Step 11: Print summary
  console.log('');
  printSummary(keys.length, successList.length, errorList.length, clientUpdates);
  console.log('[DONE] Migration finished');
}

// Only run when executed directly (not when imported for testing)
const isMainModule = process.argv[1]?.endsWith('migrate-contracts.ts');
if (isMainModule) {
  migrateContracts();
}

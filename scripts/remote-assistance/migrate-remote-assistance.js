#!/usr/bin/env node

// Validate required environment variables
const CF_API_TOKEN = process.env.CF_API_TOKEN;
if (!CF_API_TOKEN) {
  console.error('Missing required env var: CF_API_TOKEN');
  process.exit(1);
}

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
if (!CF_ACCOUNT_ID) {
  console.error('Missing required env var: CF_ACCOUNT_ID');
  process.exit(1);
}

const CF_KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
if (!CF_KV_NAMESPACE_ID) {
  console.error('Missing required env var: CF_KV_NAMESPACE_ID');
  process.exit(1);
}

const CF_R2_BUCKET_NAME = process.env.CF_R2_BUCKET_NAME;
if (!CF_R2_BUCKET_NAME) {
  console.error('Missing required env var: CF_R2_BUCKET_NAME');
  process.exit(1);
}

async function buildClientLookupMap(accountId, bucketName, token) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/indexes/clients-index.json`;

  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => {
      if (!res.ok) {
        console.error(`Failed to read clients index: HTTP ${res.status}`);
        process.exit(1);
      }
      return res.json();
    })
    .then((data) => {
      const items = data.items || [];
      const map = new Map();

      for (const item of items) {
        const comercial = item.data?.nomeComercial;
        const empresa = item.data?.nomeEmpresa;

        const registerName = (name) => {
          if (!name || typeof name !== 'string') return;
          const key = name.toLowerCase().trim();
          if (!key) return;
          if (map.has(key)) {
            console.warn(`Warning: duplicate client name '${name}' — using first match (uuid: ${map.get(key)})`);
            return;
          }
          map.set(key, item.uuid);
        };

        registerName(comercial);
        registerName(empresa);
      }

      console.log(`[CLIENTS] Built lookup map with ${map.size} entries from ${items.length} clients`);
      return map;
    })
    .catch((err) => {
      console.error(`Failed to read clients index: ${err.message}`);
      process.exit(1);
    });
}

async function listKvKeys(accountId, namespaceId, token) {
  const currentYear = new Date().getFullYear();
  const keys = [];
  const yearsScanned = [];

  const fetchPage = (url) =>
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          throw new Error('API token invalid or insufficient permissions');
        }
        if (res.status === 404) {
          throw new Error('KV namespace not found');
        }
        if (!res.ok) {
          throw new Error(`KV list failed: HTTP ${res.status}`);
        }
        return res.json();
      })
      .catch((err) => {
        if (
          err.message === 'API token invalid or insufficient permissions' ||
          err.message === 'KV namespace not found' ||
          err.message.startsWith('KV list failed')
        ) {
          throw err;
        }
        throw new Error(`Network error listing KV keys: ${err.message}`);
      });

  const fetchAllForPrefix = (prefix) => {
    let cursor = null;

    const fetchNext = () => {
      const params = new URLSearchParams({ prefix, limit: '1000' });
      if (cursor) params.set('cursor', cursor);
      const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/keys?${params}`;

      return fetchPage(url).then((data) => {
        for (const item of data.result) {
          keys.push(item.name);
        }
        if (data.result_info.count < 1000) {
          return;
        }
        cursor = data.result_info.cursor;
        return fetchNext();
      });
    };

    return fetchNext();
  };

  for (let year = 2024; year <= currentYear; year++) {
    yearsScanned.push(year);
    const prefix = `assistencias-remotas-${year}-`;
    console.log(`[LIST] Fetching keys with prefix: ${prefix}`);
    await fetchAllForPrefix(prefix);
  }

  return { keys, yearsScanned };
}

async function readKvValue(accountId, namespaceId, keyName, token) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${keyName}`;

  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => {
      if (!res.ok) {
        return { error: true, reason: `read failed: HTTP ${res.status}` };
      }
      return res.text().then((text) => {
        try {
          return JSON.parse(text);
        } catch (parseError) {
          return { error: true, reason: `invalid JSON: ${parseError.message}` };
        }
      });
    })
    .catch((err) => {
      return { error: true, reason: `read failed: ${err.message}` };
    });
}

function resolveClientId(record, clientLookupMap) {
  if (!record.cliente || typeof record.cliente !== 'string') {
    return { error: true, reason: 'required field missing: cliente' };
  }

  const key = record.cliente.toLowerCase().trim();
  const uuid = clientLookupMap.get(key);
  if (!uuid) {
    return { error: true, reason: `client not found: ${record.cliente}` };
  }

  return uuid;
}

const VALID_TIPO_ASSISTENCIA = ['REMOTA', 'TELEFÓNICA', 'TELEMÓVEL'];

function derivePaymentMethod(legacy) {
  if (legacy.contrato === true) return 'Contrato';
  if (legacy.garantia === true) return 'Garantia';
  return 'Faturação';
}

function parseTecnicoResponsavel(tecnicoStr) {
  const str = typeof tecnicoStr === 'string' ? tecnicoStr : '';
  const parts = str.trim().split(/\s+/);
  return {
    userId: 'migration',
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
    userType: 'Admin',
  };
}

function transformRecord(legacy, clientId) {
  const tipoRaw = legacy.tipoAssistencia;
  const tipoAssistencia = VALID_TIPO_ASSISTENCIA.includes(tipoRaw) ? tipoRaw : '';

  return {
    uuid: legacy.id,
    contentType: 'remote-assistance',
    version: 1,
    isDeleted: false,
    createdAt: legacy.createdAt,
    updatedAt: legacy.updatedAt,
    createdBy: 'migration',
    updatedBy: 'migration',
    data: {
      clientId,
      clienteName: legacy.cliente,
      tipoAssistencia,
      tecnicoResponsavel: parseTecnicoResponsavel(legacy.tecnicoResponsavel),
      dataPedido: legacy.dataPedido || '',
      dataAssistencia: legacy.dataAssistencia || '',
      inicioAssistencia: legacy.inicioAssistencia || '',
      fimAssistencia: legacy.fimAssistencia || '',
      motivoPedido: legacy.motivoPedido || '',
      relatorioAssistencia: legacy.relatorioAssistencia || '',
      valorAssist: legacy.valorAssist ?? 0,
      paymentMethod: derivePaymentMethod(legacy),
      resolvido: legacy.resolvido ?? false,
      relatorio: legacy.relatorio || '',
      anexos: legacy.anexos || '',
    },
  };
}

async function writeR2Object(accountId, bucketName, newRecord, token) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/content/remote-assistance/${newRecord.uuid}.json`;

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

function buildSearchableText(record) {
  const d = record.data;
  const terms = [];

  if (d.clientId) terms.push(d.clientId);
  if (d.clienteName) terms.push(d.clienteName);
  if (d.tipoAssistencia) terms.push(d.tipoAssistencia);
  if (d.tecnicoResponsavel) {
    if (d.tecnicoResponsavel.firstName) terms.push(d.tecnicoResponsavel.firstName);
    if (d.tecnicoResponsavel.lastName) terms.push(d.tecnicoResponsavel.lastName);
    const full = `${d.tecnicoResponsavel.firstName} ${d.tecnicoResponsavel.lastName}`.trim();
    if (full) terms.push(full);
  }
  if (d.motivoPedido) terms.push(d.motivoPedido);
  if (d.relatorioAssistencia) terms.push(d.relatorioAssistencia);
  if (d.paymentMethod) terms.push(d.paymentMethod);

  return terms.join(' ').toLowerCase();
}

function buildIndexItem(record) {
  const d = record.data;
  return {
    uuid: record.uuid,
    contentType: 'remote-assistance',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    isDeleted: false,
    searchableText: buildSearchableText(record),
    clientId: d.clientId,
    clienteName: d.clienteName,
    tipoAssistencia: d.tipoAssistencia,
    tecnicoResponsavel: d.tecnicoResponsavel,
    dataPedido: d.dataPedido,
    dataAssistencia: d.dataAssistencia,
    inicioAssistencia: d.inicioAssistencia,
    fimAssistencia: d.fimAssistencia,
    valorAssist: d.valorAssist,
    paymentMethod: d.paymentMethod,
    resolvido: d.resolvido,
    motivoPedido: d.motivoPedido,
  };
}

async function updateRemoteAssistanceIndex(accountId, bucketName, indexItems, token) {
  const indexUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/indexes/remote-assistance-index.json`;

  // Step 1: Read existing index from R2
  const existingItems = await fetch(indexUrl, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => {
      if (!res.ok) return [];
      return res.json().then((data) => data.items || []);
    })
    .catch(() => []);

  // Step 2: Merge — migrated items overwrite existing on same uuid, preserve untouched
  const migratedUuids = new Set(indexItems.map((item) => item.uuid));
  const preserved = existingItems.filter((item) => !migratedUuids.has(item.uuid));
  const mergedItems = [...preserved, ...indexItems];

  // Step 3: Write merged index back to R2
  const body = JSON.stringify(
    {
      contentType: 'remote-assistance',
      lastUpdated: new Date().toISOString(),
      items: mergedItems,
    },
    null,
    2,
  );

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

function buildSuccessEntry(newRecord, legacy) {
  return {
    uuid: newRecord.uuid,
    cliente: legacy.cliente,
    tipoAssistencia: newRecord.data.tipoAssistencia,
    dataAssistencia: newRecord.data.dataAssistencia,
  };
}

function buildErrorEntry(id, cliente, reason) {
  return { id, cliente: cliente || null, reason };
}

async function writeOutputFiles(successList, errorList) {
  const fs = await import('fs/promises');
  const { fileURLToPath } = await import('url');
  const path = await import('path');

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));

  await fs.writeFile(path.resolve(scriptDir, 'migration-success.json'), JSON.stringify(successList, null, 2))
    .catch((err) => console.error(`Failed to write migration-success.json: ${err.message}`));

  await fs.writeFile(path.resolve(scriptDir, 'migration-errors.json'), JSON.stringify(errorList, null, 2))
    .catch((err) => console.error(`Failed to write migration-errors.json: ${err.message}`));
}

function printSummary(yearsScanned, total, successes, errors) {
  console.log('\nMigration complete.');
  console.log(`Years scanned: ${yearsScanned.join(', ')}`);
  console.log(`Total records found: ${total}`);
  console.log(`Successes: ${successes}`);
  console.log(`Errors: ${errors}`);
  console.log('Success file: scripts/remote-assistance/migration-success.json');
  console.log('Error file: scripts/remote-assistance/migration-errors.json');
}

// --- Main orchestration ---

async function main() {
  const accountId = CF_ACCOUNT_ID;
  const namespaceId = CF_KV_NAMESPACE_ID;
  const bucketName = CF_R2_BUCKET_NAME;
  const token = CF_API_TOKEN;

  console.log('[START] Remote Assistance Migration started');
  console.log(`  Account: ${accountId}`);
  console.log(`  KV Namespace: ${namespaceId}`);
  console.log(`  R2 Bucket: ${bucketName}`);

  // Step 1: Env vars already validated at top level

  // Step 2: Read clients index from R2 and build lookup map
  const clientLookupMap = await buildClientLookupMap(accountId, bucketName, token);

  // Step 3: List all KV keys for years 2024..current
  console.log('\n[LIST] Fetching all assistencias-remotas- keys from KV...');
  const { keys, yearsScanned } = await listKvKeys(accountId, namespaceId, token);
  console.log(`[LIST] Found ${keys.length} keys`);

  // Step 4: If no keys found, write empty output files and exit
  if (keys.length === 0) {
    console.log('[DONE] No records to migrate');
    await writeOutputFiles([], []);
    printSummary(yearsScanned, 0, 0, 0);
    return;
  }

  const successList = [];
  const errorList = [];
  const indexAccumulator = [];

  // Steps 5–10: For each key: read → resolve client → transform → write → accumulate
  try {
    for (let i = 0; i < keys.length; i++) {
      const keyName = keys[i];
      console.log(`\n[${i + 1}/${keys.length}] Processing: ${keyName}`);

      // Read KV value
      const valueResult = await readKvValue(accountId, namespaceId, keyName, token);
      if (valueResult && valueResult.error) {
        console.log(`  ✗ Read failed: ${valueResult.reason}`);
        errorList.push(buildErrorEntry(keyName, null, valueResult.reason));
        continue;
      }

      const legacy = valueResult;

      // Resolve clientId
      const resolveResult = resolveClientId(legacy, clientLookupMap);
      if (resolveResult && typeof resolveResult === 'object' && resolveResult.error) {
        console.log(`  ✗ Resolve failed: ${resolveResult.reason}`);
        errorList.push(buildErrorEntry(legacy.id || keyName, legacy.cliente, resolveResult.reason));
        continue;
      }

      const clientId = resolveResult;

      // Transform
      const transformed = transformRecord(legacy, clientId);

      // Write to R2
      const writeResult = await writeR2Object(accountId, bucketName, transformed, token);
      if (writeResult && writeResult.error) {
        console.log(`  ✗ Write failed: ${writeResult.reason}`);
        errorList.push(buildErrorEntry(transformed.uuid, legacy.cliente, writeResult.reason));
        continue;
      }

      console.log(`  ✓ Migrated → content/remote-assistance/${transformed.uuid}.json`);
      successList.push(buildSuccessEntry(transformed, legacy));
      indexAccumulator.push(buildIndexItem(transformed));
    }
  } catch (err) {
    // Fatal error from writeR2Object (401/403/404) — exit gracefully
    console.error(`\n[FATAL] ${err.message}`);
    console.log('[FATAL] Writing output files before exit...');
    await writeOutputFiles(successList, errorList);
    printSummary(yearsScanned, keys.length, successList.length, errorList.length);
    return;
  }

  // Update remote-assistance index
  console.log(`\n[INDEX] Writing index with ${indexAccumulator.length} items...`);
  await updateRemoteAssistanceIndex(accountId, bucketName, indexAccumulator, token);

  // Write output files
  console.log('[FILES] Writing output files...');
  await writeOutputFiles(successList, errorList);

  // Print summary
  printSummary(yearsScanned, keys.length, successList.length, errorList.length);
  console.log('[DONE] Migration finished');
}

main();

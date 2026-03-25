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

// --- Function stubs (to be implemented in later tasks) ---

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
        const name = item.data?.nomeComercial;
        if (!name) continue;

        const key = name.toLowerCase();
        if (map.has(key)) {
          console.warn(`Duplicate commercialName (last wins): "${name}"`);
        }
        map.set(key, item.uuid);
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

  for (let year = 2021; year <= currentYear; year++) {
    yearsScanned.push(year);
    const prefix = `licencas-${year}-`;
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
  if (!record.id || typeof record.id !== 'string') {
    return { error: true, reason: 'required field missing: id' };
  }

  if (record.clientId && typeof record.clientId === 'string') {
    return record.clientId;
  }

  if (record.cliente && typeof record.cliente === 'string') {
    const uuid = clientLookupMap.get(record.cliente.toLowerCase());
    if (!uuid) {
      return { error: true, reason: `client not found: ${record.cliente}` };
    }
    return uuid;
  }

  return { error: true, reason: 'required field missing: clientId or cliente' };
}

function transformRecord(legacy, clientId) {
  return {
    uuid: legacy.id,
    contentType: 'licenses',
    version: 1,
    isDeleted: false,
    createdAt: legacy.createdAt,
    updatedAt: legacy.updatedAt,
    createdBy: 'migration',
    updatedBy: 'migration',
    data: {
      clientId,
      versao: legacy.versao || '',
      numeroSerie: legacy.numeroSerie || '',
      dataInicio: legacy.dataInicio || '',
      dataVencimento: legacy.dataVencimento || '',
      modalidade: legacy.modalidade || '',
      duracaoContrato: legacy.duracaoContrato || '',
      software: {
        name: legacy.software?.name || [],
        model: legacy.software?.model || '',
        product: legacy.software?.product || '',
        version: legacy.software?.version || '',
        licenseType: legacy.software?.licenseType || '',
        modules: legacy.software?.modules || [],
        nEquipamento: legacy.software?.nEquipamento || '',
        versaoLicenca: legacy.software?.versaoLicenca || '',
      },
      invoices: legacy.invoices || [],
    },
  };
}

async function writeR2Object(accountId, bucketName, newRecord, token) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/content/licenses/${newRecord.uuid}.json`;

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

function calculateLicenseStatus(dataVencimento) {
  if (!dataVencimento) return 'active';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expDate = new Date(dataVencimento);
  expDate.setHours(0, 0, 0, 0);

  if (expDate < today) return 'expired';

  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  if (expDate <= thirtyDaysFromNow) return 'expiring';

  return 'active';
}

function buildSearchableText(record, clientName) {
  const terms = [];
  const data = record.data;

  if (data.clientId) terms.push(data.clientId);
  if (clientName) terms.push(clientName);
  if (data.software.name && data.software.name.length > 0) terms.push(data.software.name.join(' '));
  if (data.versao) terms.push(data.versao);
  if (data.numeroSerie) terms.push(data.numeroSerie);
  if (data.modalidade) terms.push(data.modalidade);
  if (data.dataVencimento) terms.push(data.dataVencimento);

  return terms.join(' ').toLowerCase();
}

function buildIndexItem(record, clientName) {
  const data = record.data;
  return {
    uuid: record.uuid,
    contentType: 'licenses',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    isDeleted: false,
    searchableText: buildSearchableText(record, clientName),
    clientId: data.clientId || '',
    clientName: clientName || '',
    software: data.software.name || [],
    versao: data.versao || '',
    numeroSerie: data.numeroSerie || '',
    modalidade: data.modalidade || '',
    status: calculateLicenseStatus(data.dataVencimento),
  };
}

async function updateLicensesIndex(accountId, bucketName, indexItems, token) {
  const indexUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/indexes/licenses-index.json`;

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
  const body = JSON.stringify({
    contentType: 'licenses',
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

function buildSuccessEntry(newRecord, clientName) {
  return {
    uuid: newRecord.uuid,
    clientId: newRecord.data.clientId,
    clientName: clientName || '',
    software: newRecord.data.software.name || [],
    modalidade: newRecord.data.modalidade || '',
    dataVencimento: newRecord.data.dataVencimento || '',
  };
}

function buildErrorEntry(id, reason) {
  return { id, reason };
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
  console.log('=== Licenses Migration Summary ===');
  console.log(`Years scanned: ${yearsScanned.join(', ')}`);
  console.log(`Total records found: ${total}`);
  console.log(`Successfully migrated: ${successes}`);
  console.log(`Errors: ${errors}`);
  console.log('Success file: scripts/licenses/migration-success.json');
  console.log('Errors file: scripts/licenses/migration-errors.json');
}

// --- Main orchestration ---

async function main() {
  const accountId = CF_ACCOUNT_ID;
  const namespaceId = CF_KV_NAMESPACE_ID;
  const bucketName = CF_R2_BUCKET_NAME;
  const token = CF_API_TOKEN;

  console.log('[START] Licenses Migration started');
  console.log(`  Account: ${accountId}`);
  console.log(`  KV Namespace: ${namespaceId}`);
  console.log(`  R2 Bucket: ${bucketName}`);

  // Step 1: Env vars already validated at top level

  // Step 2: Read clients index from R2 and build lookup map
  const clientLookupMap = await buildClientLookupMap(accountId, bucketName, token);

  // Build reverse map (uuid → name) for resolving clientName on success/index entries
  const reverseClientMap = new Map();
  for (const [name, uuid] of clientLookupMap) {
    reverseClientMap.set(uuid, name);
  }

  // Step 3: List all KV keys for years 2021..current
  console.log('\n[LIST] Fetching all licencas- keys from KV...');
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

  // Step 5: For each key: read → resolve client → transform → write → accumulate
  try {
    for (let i = 0; i < keys.length; i++) {
      const keyName = keys[i];
      console.log(`\n[${i + 1}/${keys.length}] Processing: ${keyName}`);

      // 5a. Read KV value
      const valueResult = await readKvValue(accountId, namespaceId, keyName, token);

      // 5b. If read error → add to errorList, continue
      if (valueResult && valueResult.error) {
        console.log(`  ✗ Read failed: ${valueResult.reason}`);
        errorList.push(buildErrorEntry(keyName, valueResult.reason));
        continue;
      }

      const legacy = valueResult;

      // 5c. Resolve clientId
      const resolveResult = resolveClientId(legacy, clientLookupMap);

      // 5d. If resolve error → add to errorList, continue
      if (resolveResult && typeof resolveResult === 'object' && resolveResult.error) {
        console.log(`  ✗ Resolve failed: ${resolveResult.reason}`);
        errorList.push(buildErrorEntry(legacy.id || keyName, resolveResult.reason));
        continue;
      }

      const clientId = resolveResult;

      // 5e. Transform
      const transformed = transformRecord(legacy, clientId);

      // 5f. Write to R2
      const writeResult = await writeR2Object(accountId, bucketName, transformed, token);

      // 5g. If write error → add to errorList, continue
      if (writeResult && writeResult.error) {
        console.log(`  ✗ Write failed: ${writeResult.reason}`);
        errorList.push(buildErrorEntry(transformed.uuid, writeResult.reason));
        continue;
      }

      console.log(`  ✓ Migrated → content/licenses/${transformed.uuid}.json`);

      // Resolve clientName from reverse map or legacy cliente field
      const clientName = reverseClientMap.get(clientId) || legacy.cliente || '';

      // 5h. Add to successList
      successList.push(buildSuccessEntry(transformed, clientName));

      // 5i. Add to indexAccumulator
      indexAccumulator.push(buildIndexItem(transformed, clientName));
    }
  } catch (err) {
    // Fatal error from writeR2Object (401/403/404) — exit gracefully
    console.error(`\n[FATAL] ${err.message}`);
    console.log('[FATAL] Writing output files before exit...');
    await writeOutputFiles(successList, errorList);
    printSummary(yearsScanned, keys.length, successList.length, errorList.length);
    return;
  }

  // Step 6: Update licenses index
  console.log(`\n[INDEX] Writing index with ${indexAccumulator.length} items...`);
  await updateLicensesIndex(accountId, bucketName, indexAccumulator, token);

  // Step 7: Write output files
  console.log('[FILES] Writing output files...');
  await writeOutputFiles(successList, errorList);

  // Step 8: Print summary
  console.log('');
  printSummary(yearsScanned, keys.length, successList.length, errorList.length);
  console.log('[DONE] Migration finished');
}

main();

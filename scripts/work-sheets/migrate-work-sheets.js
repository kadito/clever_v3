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

  for (let year = 2024; year <= currentYear; year++) {
    yearsScanned.push(year);
    const prefix = `folhas-obra-${year}-`;
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

async function updateWorkSheetsIndex(accountId, bucketName, indexItems, token) {
  const indexUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/indexes/work-sheets-index.json`;

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
  console.log('=== Work Sheets Migration Summary ===');
  console.log(`Years scanned: ${yearsScanned.join(', ')}`);
  console.log(`Total records found: ${total}`);
  console.log(`Successfully migrated: ${successes}`);
  console.log(`Errors: ${errors}`);
  console.log('Success file: scripts/work-sheets/migration-success.json');
  console.log('Errors file: scripts/work-sheets/migration-errors.json');
}

// --- Main orchestration ---

async function main() {
  const accountId = CF_ACCOUNT_ID;
  const namespaceId = CF_KV_NAMESPACE_ID;
  const bucketName = CF_R2_BUCKET_NAME;
  const token = CF_API_TOKEN;

  console.log('[START] Work Sheets Migration started');
  console.log(`  Account: ${accountId}`);
  console.log(`  KV Namespace: ${namespaceId}`);
  console.log(`  R2 Bucket: ${bucketName}`);

  // Step 1: Env vars already validated at top level

  // Step 2: Read clients index from R2 and build lookup map
  const clientLookupMap = await buildClientLookupMap(accountId, bucketName, token);

  // Step 3: List all KV keys for years 2024..current
  console.log('\n[LIST] Fetching all folhas-obra- keys from KV...');
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

      console.log(`  ✓ Migrated → content/work-sheets/${transformed.uuid}.json`);

      // 5h. Add to successList
      successList.push(buildSuccessEntry(transformed, legacy));

      // 5i. Add to indexAccumulator
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

  // Step 6: Update work-sheets index
  console.log(`\n[INDEX] Writing index with ${indexAccumulator.length} items...`);
  await updateWorkSheetsIndex(accountId, bucketName, indexAccumulator, token);

  // Step 7: Write output files
  console.log('[FILES] Writing output files...');
  await writeOutputFiles(successList, errorList);

  // Step 8: Print summary
  console.log('');
  printSummary(yearsScanned, keys.length, successList.length, errorList.length);
  console.log('[DONE] Migration finished');
}

main();

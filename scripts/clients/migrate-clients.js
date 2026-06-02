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

async function listKvKeys(accountId, namespaceId, token) {
  const keys = [];
  let cursor = null;

  const fetchPage = (url) =>
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
      .catch((err) => {
        if (err.message.startsWith('KV namespace')) throw err;
        throw new Error(`Network error listing KV keys: ${err.message}`);
      });

  const fetchNext = () => {
    const params = new URLSearchParams({ prefix: 'clientes-', limit: '1000' });
    if (cursor) params.set('cursor', cursor);
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/keys?${params}`;

    return fetchPage(url).then((data) => {
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

async function writeR2Object(accountId, bucketName, newRecord, token) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/content/clients/${newRecord.uuid}.json`;

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

function transformRecord(legacy) {
  if (!legacy.id) {
    return { error: true, id: legacy.id || null, reason: 'required field missing: id' };
  }
  if (!legacy.nomeEmpresa) {
    return { error: true, id: legacy.id, reason: 'required field missing: nomeEmpresa' };
  }
  if (!legacy.nomeComercial) {
    return { error: true, id: legacy.id, reason: 'required field missing: nomeComercial' };
  }

  return {
    uuid: legacy.id,
    contentType: 'clients',
    createdAt: legacy.createdAt,
    createdBy: 'migration',
    updatedAt: legacy.updatedAt,
    updatedBy: 'migration',
    version: 1,
    isDeleted: false,
    data: {
      nomeEmpresa: legacy.nomeEmpresa,
      nomeComercial: legacy.nomeComercial,
      contribuinte: legacy.contribuinte,
      responsavel: legacy.responsavel,
      telefone: legacy.telefone,
      telefoneContato: legacy.telefoneContato,
      email: legacy.email,
      emailContato: legacy.emailContato,
      morada: legacy.morada,
      codigoPostal: legacy.codigoPostal,
      localidade: legacy.localidade,
      iban: legacy.iban,
      observacoes: legacy.observacoes,
      softwares: legacy.softwares || [],
      temAnydesk: legacy.temAnydesk !== undefined ? Boolean(legacy.temAnydesk) : false,
      manutencao: legacy.manutencao !== undefined ? Boolean(legacy.manutencao) : false,
      manutencao24: legacy.manutencao24 !== undefined ? Boolean(legacy.manutencao24) : false,
      dumps: legacy.dumps !== undefined ? Boolean(legacy.dumps) : false,
      atcud: legacy.atcud !== undefined ? Boolean(legacy.atcud) : false,
      vectronConnect: legacy.vectronConnect !== undefined ? Boolean(legacy.vectronConnect) : false,
      dumpsLink: legacy.dumpsLink,
      seriesDocumentos: legacy.seriesDocumentos,
      atUsername: legacy.atUsername,
      atPassword: legacy.atPassword,
      vectronAddress: legacy.vectronAddress,
      anydeskId: legacy.anydeskId,
      anydeskCPA: legacy.anydeskCPA,
      vectron: legacy.vectron !== undefined ? Boolean(legacy.vectron) : false,
      dreamSoft: legacy.dreamSoft !== undefined ? Boolean(legacy.dreamSoft) : false,
      ptcert: legacy.ptcert !== undefined ? Boolean(legacy.ptcert) : false,
      pix: legacy.pix !== undefined ? Boolean(legacy.pix) : false,
      zsrest: legacy.zsrest !== undefined ? Boolean(legacy.zsrest) : false,
      contasCertas: legacy.contasCertas !== undefined ? Boolean(legacy.contasCertas) : false,
      contrato: legacy.contrato !== undefined ? Boolean(legacy.contrato) : false,
      contratoCPA: legacy.contratoCPA !== undefined ? Boolean(legacy.contratoCPA) : false,
      contratoSoftware: legacy.contratoSoftware !== undefined ? Boolean(legacy.contratoSoftware) : false,
      dataInicio: legacy.dataInicio,
      dataTermino: legacy.dataTermino,
      atClient: legacy.atClient,
      anosPesquisa: legacy.anosPesquisa,
      quantMant: legacy.quantMant,
      dataAniversario: legacy.dataAniversario,
    },
  };
}

function createClientSearchText(data) {
  const fields = [
    data.nomeEmpresa,
    data.nomeComercial,
    data.contribuinte,
    data.responsavel,
    data.localidade,
    data.telefone,
    data.telefoneContato,
    data.email,
    data.emailContato,
    data.observacoes,
    ...(data.softwares || []).map(s => s.name),
    ...(data.softwares || []).map(s => s.product).filter(Boolean),
    ...(data.softwares || []).map(s => s.model).filter(Boolean),
  ];
  return fields
    .filter(field => field && typeof field === 'string')
    .join(' ')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildIndexItem(newRecord) {
  return {
    uuid: newRecord.uuid,
    contentType: 'clients',
    createdAt: newRecord.createdAt,
    updatedAt: newRecord.updatedAt,
    isDeleted: false,
    searchableText: createClientSearchText(newRecord.data),
    nomeEmpresa: newRecord.data.nomeEmpresa,
    nomeComercial: newRecord.data.nomeComercial,
    contribuinte: newRecord.data.contribuinte || '',
    localidade: newRecord.data.localidade || '',
    responsavel: newRecord.data.responsavel || '',
    telefoneContato: newRecord.data.telefoneContato || '',
    email: newRecord.data.email || '',
    emailContato: newRecord.data.emailContato || '',
    temAnydesk: newRecord.data.temAnydesk || false,
    manutencao: newRecord.data.manutencao || false,
    manutencao24: newRecord.data.manutencao24 || false,
    atcud: newRecord.data.atcud || false,
    dumps: newRecord.data.dumps || false,
    vectronConnect: newRecord.data.vectronConnect || false,
    softwareNames: (newRecord.data.softwares || []).map(s => s.name),
    softwareProducts: (newRecord.data.softwares || []).map(s => s.product).filter(Boolean),
  };
}

async function writeR2Index(accountId, bucketName, accumulator, token) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/indexes/clients-index.json`;
  const body = JSON.stringify({
    contentType: 'clients',
    lastUpdated: new Date().toISOString(),
    items: accumulator,
  }, null, 2);

  return fetch(url, {
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
      }
    })
    .catch((err) => {
      console.error(`index update failed: ${err.message} — re-run index update manually`);
    });
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

function printSummary(total, successes, errors) {
  console.log('Migration complete.');
  console.log(`Total records found: ${total}`);
  console.log(`Successes: ${successes}`);
  console.log(`Errors: ${errors}`);
  console.log('Success file: ./migration-success.json');
  console.log('Error file: ./migration-errors.json');
}

async function run() {
  const accountId = CF_ACCOUNT_ID;
  const namespaceId = CF_KV_NAMESPACE_ID;
  const bucketName = CF_R2_BUCKET_NAME;
  const token = CF_API_TOKEN;

  console.log('[START] Migration started');
  console.log(`  Account: ${accountId}`);
  console.log(`  KV Namespace: ${namespaceId}`);
  console.log(`  R2 Bucket: ${bucketName}`);

  // Step 2: List all KV keys with prefix clientes-
  console.log('\n[LIST] Fetching all clientes- keys from KV...');
  const keys = await listKvKeys(accountId, namespaceId, token);
  console.log(`[LIST] Found ${keys.length} keys`);

  if (keys.length === 0) {
    console.log('[DONE] No records to migrate');
    await writeOutputFiles([], []);
    printSummary(0, 0, 0);
    return;
  }

  const successList = [];
  const errorList = [];
  const indexAccumulator = [];

  // Steps 3–8: For each key, read → parse → transform → write → accumulate
  for (let i = 0; i < keys.length; i++) {
    const keyName = keys[i];
    console.log(`\n[${i + 1}/${keys.length}] Processing: ${keyName}`);

    const valueResult = await readKvValue(accountId, namespaceId, keyName, token);

    if (valueResult && valueResult.error) {
      console.log(`  ✗ Read failed: ${valueResult.reason}`);
      errorList.push({ id: keyName, reason: valueResult.reason });
      continue;
    }

    const legacy = valueResult;
    const transformed = transformRecord(legacy);

    if (transformed.error) {
      console.log(`  ✗ Transform failed: ${transformed.reason}`);
      errorList.push({ id: transformed.id || keyName, reason: transformed.reason });
      continue;
    }

    const writeResult = await writeR2Object(accountId, bucketName, transformed, token);

    if (writeResult && writeResult.error) {
      console.log(`  ✗ Write failed: ${writeResult.reason}`);
      errorList.push({ id: transformed.uuid, reason: writeResult.reason });
      continue;
    }

    console.log(`  ✓ Migrated → content/clients/${transformed.uuid}.json`);
    successList.push({
      uuid: transformed.uuid,
      nomeEmpresa: transformed.data.nomeEmpresa,
      nomeComercial: transformed.data.nomeComercial,
    });
    indexAccumulator.push(buildIndexItem(transformed));
  }

  // Step 9: Write index to R2
  console.log(`\n[INDEX] Writing index with ${indexAccumulator.length} items...`);
  await writeR2Index(accountId, bucketName, indexAccumulator, token);

  // Steps 10–11: Write output files
  console.log('[FILES] Writing output files...');
  await writeOutputFiles(successList, errorList);

  // Step 12: Print summary
  console.log('');
  printSummary(keys.length, successList.length, errorList.length);
  console.log('[DONE] Migration finished');
}

run();

#!/usr/bin/env node
/**
 * Back up every object from an R2 bucket to a local timestamped folder.
 *
 * Downloads each object preserving its key as the relative file path, and writes
 * a manifest.json listing every key + content type so the backup can be restored
 * exactly with restore-r2.mjs.
 *
 * Usage:
 *   node scripts/backup-r2.mjs                       (backs up clever-content-test)
 *   node scripts/backup-r2.mjs clever-content-prod   (explicit bucket)
 *   node scripts/backup-r2.mjs clever-content-test --out /path/to/dir
 *
 * Output layout:
 *   <out>/<bucket>-backup-<timestamp>/
 *     manifest.json
 *     objects/<original/key/path>
 *
 * Required env vars (from scripts/.env — git-ignored — or the shell):
 *   CF_ACCOUNT_ID, CF_API_TOKEN
 */

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Load scripts/.env if present
// ---------------------------------------------------------------------------
function loadDotEnv() {
  const envPath = join(__dirname, '.env');
  let raw;
  try {
    raw = readFileSync(envPath, 'utf8');
  } catch {
    return;
  }
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnv();

// ---------------------------------------------------------------------------
// Args + config
// ---------------------------------------------------------------------------
const rawArgs = process.argv.slice(2);
let bucket = 'clever-content-test';
let outRoot = __dirname; // default: scripts/

for (let i = 0; i < rawArgs.length; i += 1) {
  const a = rawArgs[i];
  if (a === '--out') {
    outRoot = rawArgs[i + 1];
    i += 1;
  } else if (!a.startsWith('--')) {
    bucket = a;
  }
}

const { CF_ACCOUNT_ID, CF_API_TOKEN } = process.env;
if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
  console.error('Missing env vars: CF_ACCOUNT_ID, CF_API_TOKEN (see scripts/.env).');
  process.exit(1);
}
if (!outRoot) {
  console.error('--out given without a directory.');
  process.exit(1);
}

const apiBase = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets`;
const authHeaders = { Authorization: `Bearer ${CF_API_TOKEN}` };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function listAllKeys(bucketName) {
  const keys = [];
  let cursor;
  do {
    const params = new URLSearchParams({ per_page: '1000' });
    if (cursor) params.set('cursor', cursor);
    const res = await fetch(`${apiBase}/${bucketName}/objects?${params}`, { headers: authHeaders }).then((r) =>
      r.json()
    );
    if (!res.success) throw new Error(`List failed: ${JSON.stringify(res.errors)}`);
    for (const o of res.result) keys.push(o.key);
    cursor = res.result_info?.cursor || undefined;
  } while (cursor);
  return keys;
}

async function getObject(bucketName, key) {
  const res = await fetch(`${apiBase}/${bucketName}/objects/${encodeURIComponent(key)}`, { headers: authHeaders });
  if (!res.ok) throw new Error(`GET ${key} failed: HTTP ${res.status}`);
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const body = Buffer.from(await res.arrayBuffer());
  return { body, contentType };
}

function timestamp() {
  // 2026-11-08T14-32-05
  return new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const backupDir = join(outRoot, `${bucket}-backup-${timestamp()}`);
  const objectsDir = join(backupDir, 'objects');

  console.log('===========================================');
  console.log(' CLEVER — R2 bucket backup');
  console.log('===========================================');
  console.log(`  Bucket: ${bucket}`);
  console.log(`  Output: ${backupDir}`);
  console.log('');

  console.log(`>>> Listing objects in ${bucket}...`);
  const keys = await listAllKeys(bucket);
  console.log(`    ${keys.length} objects found.`);
  console.log('');

  if (keys.length === 0) {
    console.error('Bucket is empty — nothing to back up.');
    process.exit(1);
  }

  mkdirSync(objectsDir, { recursive: true });

  console.log(`>>> Downloading ${keys.length} objects...`);
  const manifest = [];
  const failures = [];
  let done = 0;

  for (const key of keys) {
    try {
      const { body, contentType } = await getObject(bucket, key);
      const filePath = join(objectsDir, key);
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, body);
      manifest.push({ key, contentType, size: body.length });
      done += 1;
      if (done % 50 === 0 || done === keys.length) {
        process.stdout.write(`\r    downloaded ${done}/${keys.length}...`);
      }
    } catch (err) {
      failures.push({ key, error: err instanceof Error ? err.message : String(err) });
    }
  }
  process.stdout.write('\n');

  writeFileSync(
    join(backupDir, 'manifest.json'),
    JSON.stringify(
      {
        bucket,
        createdAt: new Date().toISOString(),
        objectCount: manifest.length,
        objects: manifest,
      },
      null,
      2
    )
  );

  console.log('');
  console.log('===========================================');
  console.log(` Backup complete. ${manifest.length}/${keys.length} objects saved.`);
  console.log(`  Location: ${backupDir}`);
  if (failures.length > 0) {
    console.log(` ${failures.length} failures:`);
    for (const f of failures.slice(0, 20)) console.log(`   - ${f.key}: ${f.error}`);
    if (failures.length > 20) console.log(`   ... and ${failures.length - 20} more.`);
    process.exitCode = 1;
  }
  console.log('===========================================');
  console.log('');
  console.log('To restore this backup into a bucket:');
  console.log(`  node scripts/restore-r2.mjs "${backupDir}" <target-bucket> --confirm`);
}

main().catch((err) => {
  console.error('\nFatal error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});

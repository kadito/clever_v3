#!/usr/bin/env node
/**
 * Restore a local R2 backup (made by backup-r2.mjs) into a target bucket.
 *
 * Reads <backup-dir>/manifest.json, then uploads every listed object from
 * <backup-dir>/objects/<key> into the target bucket, preserving keys and
 * content types.
 *
 * This is ADDITIVE by default — it does NOT purge the target first. Pass
 * --purge to wipe the target before restoring (so it matches the backup exactly).
 *
 * Usage:
 *   node scripts/restore-r2.mjs <backup-dir> <target-bucket> --confirm
 *   node scripts/restore-r2.mjs <backup-dir> <target-bucket> --confirm --purge
 *
 * Required env vars (from scripts/.env — git-ignored — or the shell):
 *   CF_ACCOUNT_ID, CF_API_TOKEN
 */

import { readFileSync } from 'node:fs';
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
const flags = new Set(rawArgs.filter((a) => a.startsWith('--')));
const positional = rawArgs.filter((a) => !a.startsWith('--'));

const backupDir = positional[0];
const targetBucket = positional[1];
const CONFIRMED = flags.has('--confirm');
const PURGE = flags.has('--purge');

const { CF_ACCOUNT_ID, CF_API_TOKEN } = process.env;

if (!backupDir || !targetBucket) {
  console.error('Usage: node scripts/restore-r2.mjs <backup-dir> <target-bucket> --confirm [--purge]');
  process.exit(1);
}
if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
  console.error('Missing env vars: CF_ACCOUNT_ID, CF_API_TOKEN (see scripts/.env).');
  process.exit(1);
}

// Safety: refuse to restore into a prod-looking bucket unless the backup is itself from prod.
const manifestPath = join(backupDir, 'manifest.json');
let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch (err) {
  console.error(`Could not read manifest at ${manifestPath}: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
}

if (/prod/i.test(targetBucket) && !/prod/i.test(manifest.bucket || '')) {
  console.error(
    `Refusing: target "${targetBucket}" looks like production but the backup is from "${manifest.bucket}".`
  );
  process.exit(1);
}

if (!CONFIRMED) {
  console.error(
    [
      '',
      `This will restore ${manifest.objectCount} objects into "${targetBucket}".`,
      PURGE ? '  The target will be PURGED first (exact restore).' : '  The restore is ADDITIVE (existing keys overwritten, others kept).',
      '',
      'Re-run with --confirm to proceed.',
      '',
    ].join('\n')
  );
  process.exit(1);
}

const apiBase = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets`;
const authHeaders = { Authorization: `Bearer ${CF_API_TOKEN}` };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function purgeBucket(bucket) {
  let deleted = 0;
  let cursor;
  do {
    const params = new URLSearchParams({ per_page: '500' });
    if (cursor) params.set('cursor', cursor);
    const listRes = await fetch(`${apiBase}/${bucket}/objects?${params}`, { headers: authHeaders }).then((r) =>
      r.json()
    );
    if (!listRes.success) throw new Error(`List failed: ${JSON.stringify(listRes.errors)}`);
    const keys = listRes.result.map((o) => o.key);
    if (keys.length === 0) break;
    const delRes = await fetch(`${apiBase}/${bucket}/objects`, {
      method: 'DELETE',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(keys),
    }).then((r) => r.json());
    if (!delRes.success) throw new Error(`Delete failed: ${JSON.stringify(delRes.errors)}`);
    deleted += keys.length;
    process.stdout.write(`\r  purged ${deleted}...`);
    cursor = listRes.result_info?.cursor || undefined;
  } while (cursor);
  process.stdout.write('\n');
  return deleted;
}

async function putObject(bucket, key, body, contentType) {
  const res = await fetch(`${apiBase}/${bucket}/objects/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { ...authHeaders, 'Content-Type': contentType },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PUT ${key} failed: HTTP ${res.status} ${text}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('===========================================');
  console.log(' CLEVER — R2 backup restore');
  console.log('===========================================');
  console.log(`  Backup:  ${backupDir} (from ${manifest.bucket}, ${manifest.objectCount} objects)`);
  console.log(`  Target:  ${targetBucket}`);
  console.log(`  Mode:    ${PURGE ? 'PURGE + restore (exact)' : 'additive (overwrite matching keys)'}`);
  console.log('');

  if (PURGE) {
    console.log(`>>> Purging ${targetBucket}...`);
    const purged = await purgeBucket(targetBucket);
    console.log(`    Purged ${purged} objects.`);
    console.log('');
  }

  console.log(`>>> Restoring ${manifest.objects.length} objects...`);
  const objectsDir = join(backupDir, 'objects');
  let restored = 0;
  const failures = [];

  for (const entry of manifest.objects) {
    try {
      const body = readFileSync(join(objectsDir, entry.key));
      await putObject(targetBucket, entry.key, body, entry.contentType || 'application/octet-stream');
      restored += 1;
      if (restored % 50 === 0 || restored === manifest.objects.length) {
        process.stdout.write(`\r    restored ${restored}/${manifest.objects.length}...`);
      }
    } catch (err) {
      failures.push({ key: entry.key, error: err instanceof Error ? err.message : String(err) });
    }
  }
  process.stdout.write('\n');

  console.log('');
  console.log('===========================================');
  console.log(` Restore complete. ${restored}/${manifest.objects.length} objects.`);
  if (failures.length > 0) {
    console.log(` ${failures.length} failures:`);
    for (const f of failures.slice(0, 20)) console.log(`   - ${f.key}: ${f.error}`);
    if (failures.length > 20) console.log(`   ... and ${failures.length - 20} more.`);
    process.exitCode = 1;
  }
  console.log('===========================================');
}

main().catch((err) => {
  console.error('\nFatal error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});

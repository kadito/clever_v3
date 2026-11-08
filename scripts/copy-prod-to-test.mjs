#!/usr/bin/env node
/**
 * Copy all objects from the PROD R2 bucket into the TEST R2 bucket.
 *
 * Flow:
 *   1. Purge the TEST bucket (clever-content-test)
 *   2. List every object in PROD (clever-content-prod)
 *   3. For each object: GET body from PROD, PUT into TEST (same key)
 *
 * This is a one-way clone: PROD -> TEST. It never writes to PROD.
 *
 * Usage:
 *   node scripts/copy-prod-to-test.mjs --confirm
 *   node scripts/copy-prod-to-test.mjs --confirm --dry-run    (list only, no writes)
 *
 * Required env vars (put them in scripts/.env — git-ignored — and source it,
 * or export them in your shell). NEVER hardcode the token in a tracked file.
 *   CF_ACCOUNT_ID   Cloudflare account id
 *   CF_API_TOKEN    API token with R2 read+write on both buckets
 *
 * Optional overrides:
 *   PROD_BUCKET  (default: clever-content-prod)
 *   TEST_BUCKET  (default: clever-content-test)
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Load scripts/.env if present (simple KEY=VALUE parser, no dependency)
// ---------------------------------------------------------------------------
function loadDotEnv() {
  const envPath = join(__dirname, '.env');
  let raw;
  try {
    raw = readFileSync(envPath, 'utf8');
  } catch {
    return; // no .env — rely on real env vars
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
const args = new Set(process.argv.slice(2));
const CONFIRMED = args.has('--confirm');
const DRY_RUN = args.has('--dry-run');

const { CF_ACCOUNT_ID, CF_API_TOKEN } = process.env;
const PROD_BUCKET = process.env.PROD_BUCKET || 'clever-content-prod';
const TEST_BUCKET = process.env.TEST_BUCKET || 'clever-content-test';

if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
  console.error('Missing env vars: CF_ACCOUNT_ID, CF_API_TOKEN (see scripts/.env).');
  process.exit(1);
}

if (!CONFIRMED) {
  console.error(
    [
      '',
      'This will PURGE the TEST bucket and overwrite it with PROD data.',
      '',
      `  Source (read-only):  ${PROD_BUCKET}`,
      `  Target (wiped):      ${TEST_BUCKET}`,
      '',
      'Re-run with --confirm to proceed, or add --dry-run to preview only:',
      '  node scripts/copy-prod-to-test.mjs --confirm',
      '  node scripts/copy-prod-to-test.mjs --confirm --dry-run',
      '',
    ].join('\n')
  );
  process.exit(1);
}

// Safety guard: never let the target be the prod bucket.
if (TEST_BUCKET === PROD_BUCKET) {
  console.error(`Refusing to run: TEST_BUCKET and PROD_BUCKET are both "${TEST_BUCKET}".`);
  process.exit(1);
}
if (/prod/i.test(TEST_BUCKET)) {
  console.error(`Refusing to run: target bucket "${TEST_BUCKET}" looks like a production bucket.`);
  process.exit(1);
}

const apiBase = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets`;
const authHeaders = { Authorization: `Bearer ${CF_API_TOKEN}` };

// ---------------------------------------------------------------------------
// R2 REST helpers
// ---------------------------------------------------------------------------

/** List all object keys in a bucket (paginated). */
async function listAllKeys(bucket) {
  const keys = [];
  let cursor;
  do {
    const params = new URLSearchParams({ per_page: '1000' });
    if (cursor) params.set('cursor', cursor);

    const res = await fetch(`${apiBase}/${bucket}/objects?${params}`, { headers: authHeaders }).then((r) =>
      r.json()
    );
    if (!res.success) {
      throw new Error(`List failed for ${bucket}: ${JSON.stringify(res.errors)}`);
    }
    for (const o of res.result) keys.push(o.key);
    cursor = res.result_info?.cursor || undefined;
  } while (cursor);
  return keys;
}

/** Delete all objects in a bucket (paginated, batched). */
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
    process.stdout.write(`\r  purged ${deleted} objects...`);
    cursor = listRes.result_info?.cursor || undefined;
  } while (cursor);

  process.stdout.write('\n');
  return deleted;
}

/** Fetch a single object's body (ArrayBuffer) and content type from a bucket. */
async function getObject(bucket, key) {
  const res = await fetch(`${apiBase}/${bucket}/objects/${encodeURIComponent(key)}`, { headers: authHeaders });
  if (!res.ok) {
    throw new Error(`GET ${bucket}/${key} failed: HTTP ${res.status}`);
  }
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const body = await res.arrayBuffer();
  return { body, contentType };
}

/** Write a single object into a bucket. */
async function putObject(bucket, key, body, contentType) {
  const res = await fetch(`${apiBase}/${bucket}/objects/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { ...authHeaders, 'Content-Type': contentType },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PUT ${bucket}/${key} failed: HTTP ${res.status} ${text}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('===========================================');
  console.log(' CLEVER — Clone PROD → TEST R2 bucket');
  console.log('===========================================');
  console.log(`  Source (read-only): ${PROD_BUCKET}`);
  console.log(`  Target (wiped):     ${TEST_BUCKET}`);
  console.log(`  Mode:               ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log('');

  // 1. List prod objects first (fail early if prod is unreachable)
  console.log(`>>> Listing objects in ${PROD_BUCKET}...`);
  const prodKeys = await listAllKeys(PROD_BUCKET);
  console.log(`    ${prodKeys.length} objects found in ${PROD_BUCKET}.`);
  console.log('');

  if (prodKeys.length === 0) {
    console.error('PROD bucket is empty — aborting so TEST is not wiped for nothing.');
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log('Dry run — would purge TEST and copy the following key prefixes:');
    const prefixes = new Map();
    for (const k of prodKeys) {
      const prefix = k.split('/').slice(0, 2).join('/');
      prefixes.set(prefix, (prefixes.get(prefix) || 0) + 1);
    }
    for (const [prefix, count] of [...prefixes.entries()].sort()) {
      console.log(`    ${prefix}/  (${count})`);
    }
    console.log('\nDry run complete. No changes made.');
    return;
  }

  // 2. Purge test bucket
  console.log(`>>> Purging ${TEST_BUCKET}...`);
  const purged = await purgeBucket(TEST_BUCKET);
  console.log(`    Purged ${purged} objects from ${TEST_BUCKET}.`);
  console.log('');

  // 3. Copy each object prod -> test
  console.log(`>>> Copying ${prodKeys.length} objects ${PROD_BUCKET} -> ${TEST_BUCKET}...`);
  let copied = 0;
  const failures = [];

  for (const key of prodKeys) {
    try {
      const { body, contentType } = await getObject(PROD_BUCKET, key);
      await putObject(TEST_BUCKET, key, body, contentType);
      copied += 1;
      if (copied % 50 === 0 || copied === prodKeys.length) {
        process.stdout.write(`\r    copied ${copied}/${prodKeys.length}...`);
      }
    } catch (err) {
      failures.push({ key, error: err instanceof Error ? err.message : String(err) });
    }
  }
  process.stdout.write('\n');
  console.log('');

  console.log('===========================================');
  console.log(` Done. Copied ${copied}/${prodKeys.length} objects.`);
  if (failures.length > 0) {
    console.log(` ${failures.length} failures:`);
    for (const f of failures.slice(0, 20)) {
      console.log(`   - ${f.key}: ${f.error}`);
    }
    if (failures.length > 20) console.log(`   ... and ${failures.length - 20} more.`);
    process.exitCode = 1;
  }
  console.log('===========================================');
}

main().catch((err) => {
  console.error('\nFatal error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});

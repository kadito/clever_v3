#!/usr/bin/env node
/**
 * Run the Saldo migration one client at a time.
 *
 * The /admin/migrate-saldo endpoint runs inside the Worker, which has per-invocation
 * CPU and subrequest limits. An all-clients run can exceed those, so this script
 * reads every client that has a contract (from the contracts index) and calls the
 * endpoint once per client — each invocation stays small and independent.
 *
 * Usage:
 *   node scripts/migrate-saldo-loop.mjs --dry-run          (preview every client, no writes)
 *   node scripts/migrate-saldo-loop.mjs                    (live rebuild, per client)
 *   node scripts/migrate-saldo-loop.mjs --client <uuid>    (single client only)
 *
 * Options:
 *   --dry-run            Pass dryRun=true to the endpoint (no wipe, no writes)
 *   --client <uuid>      Only this client (skips reading the contracts index)
 *   --base <url>         Worker base URL (default: http://localhost:8787)
 *   --bucket <name>      R2 bucket to read the contracts index from
 *                        (default: clever-content-test)
 *   --delay <ms>         Pause between client calls (default: 200)
 *
 * Required env vars (from scripts/.env — git-ignored — or the shell):
 *   CF_ACCOUNT_ID         Cloudflare account id (to read the contracts index)
 *   CF_API_TOKEN          R2 read token (to read the contracts index)
 *   ADMIN_MIGRATION_TOKEN Value of the X-Admin-Token header the endpoint expects
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
// Args
// ---------------------------------------------------------------------------
const rawArgs = process.argv.slice(2);
function getFlag(name) {
  return rawArgs.includes(name);
}
function getValue(name, fallback) {
  const i = rawArgs.indexOf(name);
  return i !== -1 && rawArgs[i + 1] ? rawArgs[i + 1] : fallback;
}

const DRY_RUN = getFlag('--dry-run');
const SINGLE_CLIENT = getValue('--client', null);
const BASE_URL = getValue('--base', 'http://localhost:8787');
const BUCKET = getValue('--bucket', 'clever-content-test');
const DELAY_MS = parseInt(getValue('--delay', '200'), 10);

const { CF_ACCOUNT_ID, CF_API_TOKEN, ADMIN_MIGRATION_TOKEN } = process.env;

if (!ADMIN_MIGRATION_TOKEN) {
  console.error('Missing env var: ADMIN_MIGRATION_TOKEN (the X-Admin-Token the endpoint expects).');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Read the set of client UUIDs that have a contract
// ---------------------------------------------------------------------------
async function readClientIdsWithContracts() {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    console.error('Missing env vars: CF_ACCOUNT_ID, CF_API_TOKEN (needed to read the contracts index).');
    process.exit(1);
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets/${BUCKET}/objects/indexes/contracts-index.json`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${CF_API_TOKEN}` } });
  if (!res.ok) {
    console.error(`Failed to read contracts index (HTTP ${res.status}) from bucket ${BUCKET}.`);
    process.exit(1);
  }

  const data = await res.json();
  const items = data.items || [];
  const clientIds = new Set();
  for (const item of items) {
    if (item.isDeleted) continue;
    if (item.clientId) clientIds.add(item.clientId);
  }
  return [...clientIds];
}

// ---------------------------------------------------------------------------
// Call the migration endpoint for one client
// ---------------------------------------------------------------------------
async function migrateClient(clientId) {
  const params = new URLSearchParams({ clientId });
  if (DRY_RUN) params.set('dryRun', 'true');

  const url = `${BASE_URL}/admin/migrate-saldo?${params}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'X-Admin-Token': ADMIN_MIGRATION_TOKEN },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    return { ok: false, clientId, status: res.status, body: json };
  }
  // The endpoint returns a report with one entry under data.clients
  const clientReport = json.data?.clients?.[0] ?? null;
  return { ok: true, clientId, report: clientReport, errors: json.data?.errors ?? [] };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('===========================================');
  console.log(` CLEVER — Saldo migration loop ${DRY_RUN ? '(DRY RUN)' : '(LIVE)'}`);
  console.log('===========================================');
  console.log(`  Worker:  ${BASE_URL}`);
  console.log(`  Bucket:  ${BUCKET}`);
  console.log('');

  const clientIds = SINGLE_CLIENT ? [SINGLE_CLIENT] : await readClientIdsWithContracts();
  console.log(`  ${clientIds.length} client(s) to process.`);
  console.log('');

  let ok = 0;
  let failed = 0;
  const totals = { consumed: 0, debt: 0 };
  const failures = [];

  for (let i = 0; i < clientIds.length; i += 1) {
    const clientId = clientIds[i];
    const prefix = `[${i + 1}/${clientIds.length}] ${clientId}`;

    const result = await migrateClient(clientId);

    if (!result.ok) {
      failed += 1;
      failures.push(result);
      console.log(`${prefix}  FAILED (HTTP ${result.status}) ${JSON.stringify(result.body)}`);
    } else {
      ok += 1;
      const r = result.report;
      if (r) {
        const wsC = r.workSheets?.consumed ?? 0;
        const wsD = r.workSheets?.debt ?? 0;
        const raC = r.remoteAssistances?.consumed ?? 0;
        const raD = r.remoteAssistances?.debt ?? 0;
        totals.consumed += wsC + raC;
        totals.debt += wsD + raD;
        console.log(
          `${prefix}  ok  periods[CPA:${r.cpaPeriod ? 'y' : 'n'} SH:${r.shPeriod ? 'y' : 'n'}]  ` +
            `WS[consumed:${wsC} debt:${wsD}]  RA[consumed:${raC} debt:${raD}]` +
            (r.errors?.length ? `  errors:${r.errors.length}` : '')
        );
      } else {
        console.log(`${prefix}  ok  (no contract to rebuild)`);
      }
    }

    if (i < clientIds.length - 1 && DELAY_MS > 0) await sleep(DELAY_MS);
  }

  console.log('');
  console.log('===========================================');
  console.log(` Done. ${ok} ok, ${failed} failed, of ${clientIds.length} client(s).`);
  console.log(` Totals — resource consumptions: ${totals.consumed}, euro-debt records: ${totals.debt}`);
  if (failures.length > 0) {
    console.log(' Failed clients:');
    for (const f of failures) console.log(`   - ${f.clientId} (HTTP ${f.status})`);
    process.exitCode = 1;
  }
  console.log('===========================================');
}

main().catch((err) => {
  console.error('\nFatal error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});

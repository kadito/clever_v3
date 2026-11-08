#!/usr/bin/env tsx
/**
 * Export Contract Changes to CSV
 *
 * Reads the audit output (contract-issues-{env}.json) produced by
 * audit-contract-benefits.ts, resolves client names + contract numbers from R2,
 * and emits a client-facing CSV of every benefit value that changed.
 *
 * READ-ONLY against R2. Does not modify any contract.
 *
 * Prerequisite: run the audit first so contract-issues-{env}.json exists.
 *
 * Usage:
 *   pnpm tsx scripts/export-contract-changes-csv.ts --env production
 *   pnpm tsx scripts/export-contract-changes-csv.ts --env test
 *   pnpm tsx scripts/export-contract-changes-csv.ts --env production --group   # one row per contract
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

interface ContractIssue {
  uuid: string;
  clientId: string;
  type: 'CPA' | 'S&H';
  planId: string;
  planName: string;
  current: { horasAssistenciaAnual: number; deslocacoesPorAno: number; manutencoesPorAno: number };
  expected: { horasAssistenciaAnual: number; deslocacoesPorAno: number; manutencoesPorAno: number };
  issues: string[];
}

function getR2Object(bucket: string, key: string, env: string): string {
  const envFlag = env === 'production' ? '--env production' : '';
  const cmd = `pnpm wrangler r2 object get ${bucket}/${key} ${envFlag} --pipe 2>/dev/null`;
  return execSync(cmd, { encoding: 'utf-8' });
}

/** Wrap a CSV field: double internal quotes, wrap in quotes if it contains , " or newline. */
function csvField(value: string | number): string {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const env = args.includes('--env')
    ? args[args.indexOf('--env') + 1]
    : 'test';
  const groupPerContract = args.includes('--group');

  const bucket = env === 'production' ? 'clever-content-prod' : 'clever-content-test';
  const issuesFile = `contract-issues-${env}.json`;

  console.log(`📄 Exporting contract changes — ${env.toUpperCase()}`);
  console.log(`📥 Reading ${issuesFile}...`);

  const issues: ContractIssue[] = JSON.parse(readFileSync(issuesFile, 'utf-8'));
  console.log(`✅ ${issues.length} issue rows loaded\n`);

  // Resolve client names (cached per clientId, read-only).
  // Note: contract records carry no human-readable contract number (numeroContrato
  // is unpopulated in prod), so the client identifies rows by Cliente + Tipo + Plano.
  const clientNameCache = new Map<string, string>();

  function resolveClientName(clientId: string): string {
    if (clientNameCache.has(clientId)) return clientNameCache.get(clientId)!;
    let name = clientId;
    try {
      const data = JSON.parse(getR2Object(bucket, `content/clients/${clientId}.json`, env));
      name = data.data?.nomeComercial || data.data?.nomeEmpresa || clientId;
    } catch {
      console.warn(`⚠️  Could not resolve client ${clientId} — using id`);
    }
    clientNameCache.set(clientId, name);
    return name;
  }

  const lines: string[] = [];

  if (groupPerContract) {
    // One row per contract issue, all changes joined in one cell.
    lines.push(['Cliente', 'Tipo', 'Plano', 'Alterações'].map(csvField).join(','));
    for (const issue of issues) {
      const row = [
        resolveClientName(issue.clientId),
        issue.type,
        issue.planName,
        issue.issues.join('; '),
      ];
      lines.push(row.map(csvField).join(','));
    }
  } else {
    // One row per individual changed parameter (clearest for a client notification).
    lines.push(
      ['Cliente', 'Tipo', 'Plano', 'Parâmetro', 'Valor anterior', 'Novo valor']
        .map(csvField)
        .join(','),
    );
    for (const issue of issues) {
      const clientName = resolveClientName(issue.clientId);
      for (const change of issue.issues) {
        // issue strings look like "Deslocações: 0 → 3"
        const match = change.match(/^(.+?):\s*(.+?)\s*→\s*(.+)$/);
        const parametro = match ? match[1].trim() : change;
        const anterior = match ? match[2].trim() : '';
        const novo = match ? match[3].trim() : '';
        lines.push(
          [clientName, issue.type, issue.planName, parametro, anterior, novo]
            .map(csvField)
            .join(','),
        );
      }
    }
  }

  // BOM so Excel opens UTF-8 (ç, õ, ã) correctly.
  const outFile = `contract-changes-${env}.csv`;
  writeFileSync(outFile, '\uFEFF' + lines.join('\r\n') + '\r\n', 'utf-8');

  console.log(`\n✅ Wrote ${lines.length - 1} rows to ${outFile}`);
}

main().catch((err) => {
  console.error('❌ Export failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});

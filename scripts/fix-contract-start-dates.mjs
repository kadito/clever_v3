#!/usr/bin/env node
/**
 * Dry run: shows which contract section gets which start date (inicioContrato*).
 * Reads the local test backup only. Needs no Cloudflare credentials and writes nothing.
 *
 * Usage:
 *   node scripts/fix-contract-start-dates.mjs [backup-dir]
 *
 * Dates are written as date-only ISO strings (YYYY-MM-DD), the format already used
 * by contracts that have a start date. fimContrato* and modalidadePagamento* are never touched.
 *
 * shortcut: no --apply yet. Add it (patch version/updatedAt, write to R2) once the owner approves the dry run.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backupDir = process.argv[2] || join(__dirname, 'clever-content-test-backup-2026-11-08T14-40-54');
const contentDir = join(backupDir, 'objects', 'content');

// client (nomeComercial) | legal name (nomeEmpresa) | section | plan | payment the client states | start DD/MM/YYYY
const rows = [
  ['Pão Quente Volta de Mar', 'Ying Shan, Unipessoal Lda', 'CPA', 'cpa_premium', 'Trimestral', '23/08/2026'],
  ['Pão Quente Volta de Mar', 'Ying Shan, Unipessoal Lda', 'SH', 'sh_simple', 'Trimestral', '23/08/2026'],
  ['Pastelaria Doces Suspiros', 'Doces Suspiros Unipessoal, lda.', 'CPA', 'cpa_premium', 'MENSAL', '03/08/2026'],
  ['Pastelaria Doces Suspiros', 'Doces Suspiros Unipessoal, lda.', 'SH', 'sh_simple', 'MENSAL', '03/08/2026'],
  ['Pastelaria Horizonte', 'Hernani Emanuel Rodrigues Silva Joao', 'CPA', 'cpa_premium', 'MENSAL', '05/12/2025'],
  ['Pastelaria Horizonte', 'Hernani Emanuel Rodrigues Silva Joao', 'SH', 'sh_simple', 'MENSAL', '05/12/2025'],
  ['Pastelaria Manos do 8', 'Pastelaria Manos do 8 Lda', 'CPA', 'cpa_premium', 'Semestral', '08/09/2026'],
  ['Pastelaria Manos do 8', 'Pastelaria Manos do 8 Lda', 'SH', 'sh_simple', 'Semestral', '08/09/2026'],
  ['Pastelaria Princesa', 'Rainha dos Bytes - Panificação, Lda.', 'CPA', 'cpa_professional', 'ANUAL', '10/05/2026'],
  ['Quotidiano Cordato - LDA', 'Quotidiano Cordato - LDA', 'CPA', 'cpa_essential', 'Semestral', '01/10/2026'],
  ['Restaurante O Carvoeiro', 'Ementa Certa - Restauração, Lda', 'SH', 'sh_silver', 'MENSAL', '26/12/2026'],
  ["Taberna D'Vila", 'Almargem Praias Lda', 'CPA', 'cpa_premium', 'MENSAL', '16/04/2025'],
  ["Taberna D'Vila", 'Almargem Praias Lda', 'SH', 'sh_simple', 'MENSAL', '16/04/2026'],
  ['Via Rápida', 'Fernandes e Alexandre - Restaurantes, Lda.', 'CPA', 'cpa_premium', 'Semestral', '12/09/2026'],
  ['Via Rápida', 'Fernandes e Alexandre - Restaurantes, Lda.', 'SH', 'sh_simple', 'Semestral', '12/09/2026'],
];

function readJsonFolder(folder) {
  const dir = join(contentDir, folder);
  return readdirSync(dir)
    .filter(file => file.endsWith('.json'))
    .map(file => JSON.parse(readFileSync(join(dir, file), 'utf8')));
}

function normalize(text) {
  // \s also covers the non-breaking space found in the Hernani legal name.
  return String(text).replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();
}

function toIsoDate(ptDate) {
  const [day, month, year] = ptDate.split('/');
  return `${year}-${month}-${day}`;
}

const clients = readJsonFolder('clients').filter(client => !client.isDeleted);
const contracts = readJsonFolder('contracts').filter(contract => !contract.isDeleted);

console.log(`Dry run. Backup: ${backupDir}`);
console.log(`Contracts: ${contracts.length}, clients: ${clients.length}. Nothing is written.\n`);

let problems = 0;

for (const [clientName, legalName, section, plan, clientPayment, startPt] of rows) {
  const clientIds = clients
    .filter(c => normalize(c.data.nomeComercial) === normalize(clientName) && normalize(c.data.nomeEmpresa) === normalize(legalName))
    .map(c => c.uuid);

  const matches = contracts.filter(
    c => clientIds.includes(c.data.clientId) && c.data[`has${section}Contract`] && c.data[`planId${section}`] === plan
  );

  const label = `${clientName} | ${section} ${plan}`;
  if (matches.length !== 1) {
    problems += 1;
    console.log(`${label}\n  PROBLEM: ${matches.length} matching contracts (clients found: ${clientIds.length})\n`);
    continue;
  }

  const data = matches[0].data;
  const current = data[`inicioContrato${section}`] || '(empty)';
  const payment = data[`modalidadePagamento${section}`];
  const paymentNote = normalize(payment) === normalize(clientPayment) ? 'same' : `DIFFERENT (client says ${clientPayment})`;
  const newStart = toIsoDate(startPt);
  const futureNote = newStart > new Date().toISOString().slice(0, 10) ? ' [FUTURE DATE]' : '';

  console.log(label);
  console.log(`  contract: ${matches[0].uuid}`);
  console.log(`  inicioContrato${section}: ${current} -> ${newStart}${futureNote}`);
  console.log(`  fimContrato${section}: ${data[`fimContrato${section}`] || '(empty)'} (not changed)`);
  console.log(`  modalidadePagamento${section}: ${payment} (not changed), ${paymentNote}\n`);
}

console.log(`Rows: ${rows.length}, problems: ${problems}`);

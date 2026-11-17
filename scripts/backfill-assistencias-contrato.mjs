#!/usr/bin/env node
// Local dry run: backfills pricingSnapshot + horasTotais on contract-paid remote assistances
// migrated from the old app. Reads the local backup, writes patched copies to OUT_DIR.
// Never touches R2 or the backup folder.
// Run: node_modules/.bin/tsx scripts/backfill-assistencias-contrato.mjs (tsx because shared/dist has extensionless imports)
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  calculateRemoteAssistancePricing,
  calculateRoundedTotalHours,
  REMOTE_ASSISTANCE_CONSTANTS,
} from '../packages/shared/src/types/remote-assistance/index.ts';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = join(scriptDir, 'clever-content-test-backup-2026-11-08T14-40-54/objects');
const OUT_DIR = '/Users/kadito/.kiro/crew/workspace/exports/backfill-assistencias-test/objects';
const REFERENCE_CSV = '/Users/kadito/.kiro/crew/workspace/exports/dryrun-valor-assistencias-contrato.csv';
const KEY_DIR = 'content/remote-assistance';
const UPDATED_BY = 'backfill-2026-11-17';
const CREATED_BEFORE = '2026-09-10';

const PERIODS = [
  { name: '25/45 (before 2025-12-15)', from: '0000-00-00', priceBusinessHours: 25, priceAfterHours: 45 },
  { name: '30/45 (2025-12-15 to 2026-09-09)', from: '2025-12-15', priceBusinessHours: 30, priceAfterHours: 45 },
];

const C = REMOTE_ASSISTANCE_CONSTANTS;
const lisbon = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Lisbon',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  weekday: 'short',
});

function lisbonParts(iso) {
  const parts = Object.fromEntries(lisbon.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
    isWeekend: parts.weekday === 'Sat' || parts.weekday === 'Sun',
  };
}

function findPeriod(date) {
  return PERIODS.filter((p) => date >= p.from).at(-1);
}

function readCsv(path) {
  const rows = readFileSync(path, 'utf8').trim().split('\n').slice(1).map((l) => l.split(','));
  const byUuid = new Map();
  for (const [uuid, , horas, regime, valor, origem] of rows) {
    if (origem.trim() === 'migrado') byUuid.set(uuid, { horas, regime, valor: Number(valor) });
  }
  return byUuid;
}

const reference = readCsv(REFERENCE_CSV);
const files = readdirSync(join(BACKUP_DIR, KEY_DIR)).filter((f) => f.endsWith('.json'));
const manifest = [];
const skipped = [];
const differences = [];
const totalsByPeriod = {};
const samples = [];

for (const file of files) {
  const record = JSON.parse(readFileSync(join(BACKUP_DIR, KEY_DIR, file), 'utf8'));
  const data = record.data;
  if (record.isDeleted || data.paymentMethod !== 'Contrato') continue;
  if (data.valorAssist !== 0 || data.pricingSnapshot || record.createdAt >= CREATED_BEFORE) {
    skipped.push({ uuid: record.uuid, reason: 'not matching rules (value/snapshot/createdAt)' });
    continue;
  }

  const start = lisbonParts(data.inicioAssistencia);
  const end = lisbonParts(data.fimAssistencia);
  const assistanceDate = lisbonParts(data.dataAssistencia).date;
  const period = findPeriod(assistanceDate);
  const rates = {
    priceBusinessHours: period.priceBusinessHours,
    priceAfterHours: period.priceAfterHours,
    billingIncrementMinutes: C.BILLING_INCREMENT_MINUTES,
    businessHoursMorningStart: C.BUSINESS_HOURS_MORNING_START,
    businessHoursMorningEnd: C.BUSINESS_HOURS_MORNING_END,
    businessHoursAfternoonStart: C.BUSINESS_HOURS_AFTERNOON_START,
    businessHoursAfternoonEnd: C.BUSINESS_HOURS_AFTERNOON_END,
  };
  const result = calculateRemoteAssistancePricing({
    startTime: start.time,
    endTime: end.time,
    isWeekendOrHoliday: start.isWeekend,
    paymentMethod: 'Contrato',
    rateOverrides: rates,
  });
  if (!(result.totalValue > 0) || !result.isZeroCost) {
    skipped.push({ uuid: record.uuid, reason: `pricing gave ${result.totalValue} (start ${start.time}, end ${end.time})` });
    continue;
  }

  // Same shape as createRemoteAssistancePricingSnapshot
  const pricingSnapshot = {
    rates,
    calculated: {
      totalValue: result.totalValue,
      businessHoursValue: result.businessHoursValue,
      offHoursValue: result.offHoursValue,
      totalMinutes: result.totalMinutes,
      billingMinutes: result.billingMinutes,
      businessMinutes: result.businessMinutes,
      offHoursMinutes: result.offHoursMinutes,
      isZeroCost: result.isZeroCost,
    },
  };
  // The app writes horasTotais with calculateRoundedTotalHours (HH:MM, zero-padded)
  const horasTotais = calculateRoundedTotalHours(start.time, end.time);

  const patched = {
    ...record,
    updatedAt: new Date().toISOString(),
    updatedBy: UPDATED_BY,
    version: record.version + 1,
    data: { ...data, horasTotais, pricingSnapshot },
  };
  const key = `${KEY_DIR}/${record.uuid}.json`;
  mkdirSync(join(OUT_DIR, KEY_DIR), { recursive: true });
  writeFileSync(join(OUT_DIR, key), JSON.stringify(patched, null, 2) + '\n');
  manifest.push({ uuid: record.uuid, key, oldValorAssist: data.valorAssist, newTotalValue: result.totalValue, horasTotais });

  totalsByPeriod[period.name] ??= { count: 0, total: 0 };
  totalsByPeriod[period.name].count += 1;
  totalsByPeriod[period.name].total = Math.round((totalsByPeriod[period.name].total + result.totalValue) * 100) / 100;

  const ref = reference.get(record.uuid);
  const hours = (result.billingMinutes / 60).toFixed(2);
  if (!ref) {
    differences.push(`${record.uuid}: not in reference CSV (computed ${result.totalValue})`);
  } else if (ref.valor !== result.totalValue || ref.horas !== hours) {
    differences.push(`${record.uuid}: ref ${ref.horas}h ${ref.regime} ${ref.valor} vs new ${hours}h ${period.name} ${result.totalValue} (${data.inicioAssistencia} -> ${data.fimAssistencia}, weekend=${start.isWeekend})`);
  }
  if (samples.length < 3) samples.push({ uuid: record.uuid, before: record, after: patched });
}

writeFileSync(join(OUT_DIR, '..', 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

const grandTotal = Math.round(manifest.reduce((sum, m) => sum + m.newTotalValue, 0) * 100) / 100;
const referenceTotal = Math.round([...reference.values()].reduce((sum, r) => sum + r.valor, 0) * 100) / 100;
console.log(`Records patched: ${manifest.length} (reference rows: ${reference.size})`);
console.log(`Total EUR: ${grandTotal} (reference ${referenceTotal})`);
console.log('By rate period:', JSON.stringify(totalsByPeriod, null, 2));
console.log(`Differences vs reference: ${differences.length}`);
differences.forEach((d) => console.log('  ' + d));
console.log(`Skipped Contrato records: ${skipped.length}`);
skipped.forEach((s) => console.log(`  ${s.uuid}: ${s.reason}`));
for (const s of samples) {
  console.log(`\nSample ${s.uuid}`);
  console.log('  before:', JSON.stringify({ version: s.before.version, updatedBy: s.before.updatedBy, valorAssist: s.before.data.valorAssist, horasTotais: s.before.data.horasTotais }));
  console.log('  after: ', JSON.stringify({ version: s.after.version, updatedBy: s.after.updatedBy, valorAssist: s.after.data.valorAssist, horasTotais: s.after.data.horasTotais, pricingSnapshot: s.after.data.pricingSnapshot }));
}

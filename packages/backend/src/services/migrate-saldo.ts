/**
 * Saldo migration — wipe + deterministic rebuild.
 *
 * Deletes all existing balance/ data for every client, then rebuilds periods and
 * transactions from the current contracts, work sheets, and remote assistances.
 *
 * Invoked via the dev-only POST /admin/migrate-saldo route in index.ts.
 */

import type {
  StorageBucket,
  Contract,
  WorkSheet,
  RemoteAssistance,
  ContractPeriod,
  ContractPeriodResources,
  TransactionChanges,
} from '@clever/shared';
import {
  getSectionForServiceType,
  extractWorkSheetDebtTransaction,
  extractRemoteAssistanceDebtTransaction,
  hasTransactionChanges,
  computeCurrentPeriodWindow,
} from '@clever/shared';
import { createBalancePeriodService } from './balance-service';

const MIGRATION_USER = 'migration';

/** Build an in-memory ContractPeriod for dry-run simulation (not persisted). */
function makeSimPeriod(
  clientId: string,
  contractId: string,
  section: 'CPA' | 'SH',
  resources: ContractPeriodResources,
  periodStart: string,
  periodEnd: string,
  isActive: boolean
): ContractPeriod {
  return {
    uuid: `sim-${contractId}-${section}`,
    clientId,
    contractId,
    section,
    periodStart,
    periodEnd,
    status: isActive ? 'active' : 'closed',
    originalResources: { ...resources },
    remainingResources: { ...resources },
    openedAt: new Date().toISOString(),
    openedBy: MIGRATION_USER,
  };
}

interface ClientReport {
  clientId: string;
  cpaPeriod: boolean;
  shPeriod: boolean;
  workSheets: { consumed: number; debt: number };
  remoteAssistances: { consumed: number; debt: number };
  errors: string[];
}

interface MigrationReport {
  clientsProcessed: number;
  clients: ClientReport[];
  errors: string[];
}

/**
 * List all keys under a prefix, paginating through R2.
 */
async function listKeys(r2: StorageBucket, prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor: string | undefined;
  do {
    const list = await r2.list({ prefix, cursor });
    for (const o of list.objects) keys.push(o.key);
    cursor = list.truncated ? list.cursor : undefined;
  } while (cursor);
  return keys;
}

async function readJson<T>(r2: StorageBucket, key: string): Promise<T | null> {
  const obj = await r2.get(key).catch(() => null);
  if (!obj) return null;
  return (await obj.json()) as T;
}

/**
 * Wipe all balance data for a client.
 */
async function wipeClientBalance(r2: StorageBucket, clientId: string): Promise<void> {
  const keys = await listKeys(r2, `balance/${clientId}/`);
  await Promise.all(keys.map((k) => r2.delete(k).catch(() => undefined)));
  // Old single-index key (may not be under the listed prefix depending on R2)
  await r2.delete(`balance/${clientId}/index.json`).catch(() => undefined);
}

interface ContentIndexItem {
  uuid: string;
  clientId?: string;
  isDeleted?: boolean;
}

/**
 * Collect non-deleted content of a type, keyed by clientId.
 *
 * When `onlyClientId` is given, this uses the content index
 * (indexes/{type}-index.json) to find just that client's content UUIDs and
 * fetches only those objects — so a single-client rebuild never parses the
 * whole dataset. This keeps per-invocation CPU low on the deployed Worker.
 *
 * When `onlyClientId` is omitted, it lists and parses every object (full run).
 */
async function loadContentByClient<T extends { data: { clientId?: string }; isDeleted?: boolean }>(
  r2: StorageBucket,
  contentType: string,
  onlyClientId?: string
): Promise<Map<string, T[]>> {
  const byClient = new Map<string, T[]>();

  // Scoped path: read the index, fetch only this client's content objects.
  if (onlyClientId) {
    const index = await readJson<{ items?: ContentIndexItem[] }>(
      r2,
      `indexes/${contentType}-index.json`
    );
    const items = index?.items ?? [];
    const uuids = items
      .filter((it) => !it.isDeleted && it.clientId === onlyClientId)
      .map((it) => it.uuid);

    for (const uuid of uuids) {
      const item = await readJson<T>(r2, `content/${contentType}/${uuid}.json`);
      if (!item || item.isDeleted) continue;
      if (item.data.clientId !== onlyClientId) continue;
      const arr = byClient.get(onlyClientId) ?? [];
      arr.push(item);
      byClient.set(onlyClientId, arr);
    }

    return byClient;
  }

  // Full path: list and parse every object of this type.
  const keys = await listKeys(r2, `content/${contentType}/`);
  for (const key of keys) {
    // Skip file-attachment sub-keys — only read top-level {uuid}.json
    const rest = key.slice(`content/${contentType}/`.length);
    if (rest.includes('/')) continue;
    if (!rest.endsWith('.json')) continue;

    const item = await readJson<T>(r2, key);
    if (!item || item.isDeleted) continue;
    const clientId = item.data.clientId;
    if (!clientId) continue;

    const arr = byClient.get(clientId) ?? [];
    arr.push(item);
    byClient.set(clientId, arr);
  }

  return byClient;
}

export interface MigrateSaldoOptions {
  /** Restrict the rebuild to a single client (its UUID). Omit to process all clients. */
  clientId?: string;
  /**
   * When true, nothing is written or wiped — the report shows what WOULD happen.
   * Dry run needs read access only.
   */
  dryRun?: boolean;
}

export async function migrateSaldo(
  r2: StorageBucket,
  options: MigrateSaldoOptions = {}
): Promise<MigrationReport> {
  const { clientId: onlyClientId, dryRun = false } = options;

  const report: MigrationReport = { clientsProcessed: 0, clients: [], errors: [] };
  const periodService = createBalancePeriodService(r2);

  // Load content grouped by client. When scoped to one client, only that
  // client's records are read (via the content index) — not the whole dataset.
  const contractsByClient = await loadContentByClient<Contract>(r2, 'contracts', onlyClientId);
  const workSheetsByClient = await loadContentByClient<WorkSheet>(r2, 'work-sheets', onlyClientId);
  const remoteByClient = await loadContentByClient<RemoteAssistance>(r2, 'remote-assistance', onlyClientId);

  // Every client that has a contract gets a rebuild, unless scoped to one.
  let clientIds = new Set<string>([...contractsByClient.keys()]);
  if (onlyClientId) {
    if (!clientIds.has(onlyClientId)) {
      report.errors.push(`client ${onlyClientId} has no contract — nothing to rebuild`);
      return report;
    }
    clientIds = new Set<string>([onlyClientId]);
  }

  for (const clientId of clientIds) {
    const clientReport: ClientReport = {
      clientId,
      cpaPeriod: false,
      shPeriod: false,
      workSheets: { consumed: 0, debt: 0 },
      remoteAssistances: { consumed: 0, debt: 0 },
      errors: [],
    };

    // In-memory period simulation for dry run, so D8/D9 counts stay accurate
    // without writing anything to R2.
    const simPeriods: ContractPeriod[] = [];

    const findSimPeriod = (contractId: string | undefined, section: 'CPA' | 'SH', date: string) => {
      if (!contractId) return null;
      return (
        simPeriods.find(
          (p) =>
            p.contractId === contractId &&
            p.section === section &&
            p.status === 'active' &&
            p.periodStart <= date &&
            date <= p.periodEnd
        ) ?? null
      );
    };

    const applySimConsumption = (period: ContractPeriod | null, changes: TransactionChanges) => {
      if (!period || !changes.contractUsageChanges) return;
      const u = changes.contractUsageChanges;
      const r = period.remainingResources;
      if (u.manutencoesPorAno !== undefined && r.manutencoesPorAno !== -1) r.manutencoesPorAno += u.manutencoesPorAno;
      if (u.deslocacoesPorAno !== undefined && r.deslocacoesPorAno !== -1) r.deslocacoesPorAno += u.deslocacoesPorAno;
      if (u.horasAssistenciaAnuais !== undefined && r.horasAssistenciaAnuais !== -1) r.horasAssistenciaAnuais += u.horasAssistenciaAnuais;
    };

    try {
      // 1. Wipe (skipped on dry run)
      if (!dryRun) {
        await wipeClientBalance(r2, clientId);
      }

      // 2. Open the CURRENT 1-year period for each active contract section.
      // Periods are always exactly 1 year, anchored on inicioContrato; we open
      // the yearly slice that contains today, bounded by fimContrato. If the
      // contract has already expired, we still record the last valid slice so
      // the UI can show it, but mark it inactive (no consumption lands on it).
      const contracts = contractsByClient.get(clientId) ?? [];
      for (const contract of contracts) {
        if (contract.data.hasCPAContract) {
          const win = computeCurrentPeriodWindow(
            contract.data.inicioContratoCPA,
            contract.data.fimContratoCPA
          );
          if (win) {
            const resources = {
              manutencoesPorAno: contract.data.manutencoesPorAnoCPA ?? 0,
              deslocacoesPorAno: contract.data.deslocacoesPorAnoCPA ?? 0,
              horasAssistenciaAnuais: contract.data.horasAssistenciaAnualCPA ?? 0,
            };
            if (dryRun) {
              simPeriods.push(makeSimPeriod(clientId, contract.uuid, 'CPA', resources, win.periodStart, win.periodEnd, win.isActive));
            } else {
              await periodService.openPeriod(clientId, contract.uuid, 'CPA', resources, win.periodStart, win.periodEnd, MIGRATION_USER, undefined, win.isActive);
            }
            clientReport.cpaPeriod = true;
          }
        }
        if (contract.data.hasSHContract) {
          const win = computeCurrentPeriodWindow(
            contract.data.inicioContratoSH,
            contract.data.fimContratoSH
          );
          if (win) {
            const resources = {
              manutencoesPorAno: contract.data.manutencoesPorAnoSH ?? 0,
              deslocacoesPorAno: contract.data.deslocacoesPorAnoSH ?? 0,
              horasAssistenciaAnuais: contract.data.horasAssistenciaAnualSH ?? 0,
            };
            if (dryRun) {
              simPeriods.push(makeSimPeriod(clientId, contract.uuid, 'SH', resources, win.periodStart, win.periodEnd, win.isActive));
            } else {
              await periodService.openPeriod(clientId, contract.uuid, 'SH', resources, win.periodStart, win.periodEnd, MIGRATION_USER, undefined, win.isActive);
            }
            clientReport.shPeriod = true;
          }
        }
      }

      // 3. Replay work sheets, sorted by request.date ascending
      const workSheets = (workSheetsByClient.get(clientId) ?? [])
        .filter((ws) => ws.data.displacement?.paymentMethod === 'CONTRATO')
        .sort((a, b) => (a.data.request.date || '').localeCompare(b.data.request.date || ''));

      for (const ws of workSheets) {
        const section = getSectionForServiceType(ws.data.otherData.serviceType);
        if (!section) continue; // INSTALAÇÃO

        const contractId = ws.data.contractId;
        const activePeriod = dryRun
          ? findSimPeriod(contractId, section, ws.data.request.date)
          : contractId
            ? await periodService.getActivePeriodForDate(clientId, contractId, section, ws.data.request.date)
            : null;

        const changes = extractWorkSheetDebtTransaction(ws, activePeriod);
        if (!hasTransactionChanges(changes)) continue;

        if (dryRun) {
          applySimConsumption(activePeriod, changes);
        } else {
          const periodId = activePeriod?.uuid ?? 'no-period';
          const resolvedContractId = activePeriod?.contractId ?? contractId ?? 'unknown';
          await periodService.createDebtTransaction(
            clientId, resolvedContractId, periodId, ws.uuid, 'work-sheet', changes, MIGRATION_USER,
            { paymentMethod: 'CONTRATO', section, serviceDetails: { serviceType: ws.data.otherData.serviceType } }
          );
        }

        if (changes.balanceChange) clientReport.workSheets.debt++;
        else clientReport.workSheets.consumed++;
      }

      // 4. Replay remote assistances, sorted by dataPedido ascending
      const remotes = (remoteByClient.get(clientId) ?? [])
        .filter((ra) => ra.data.paymentMethod === 'Contrato')
        .sort((a, b) => (a.data.dataPedido || '').localeCompare(b.data.dataPedido || ''));

      for (const ra of remotes) {
        const contractId = ra.data.contractId;
        const activePeriod = dryRun
          ? findSimPeriod(contractId, 'SH', ra.data.dataPedido)
          : contractId
            ? await periodService.getActivePeriodForDate(clientId, contractId, 'SH', ra.data.dataPedido)
            : null;

        const changes = extractRemoteAssistanceDebtTransaction(ra, activePeriod);
        if (!hasTransactionChanges(changes)) continue;

        if (dryRun) {
          applySimConsumption(activePeriod, changes);
        } else {
          const periodId = activePeriod?.uuid ?? 'no-period';
          const resolvedContractId = activePeriod?.contractId ?? contractId ?? 'unknown';
          await periodService.createDebtTransaction(
            clientId, resolvedContractId, periodId, ra.uuid, 'remote-assistance', changes, MIGRATION_USER,
            { paymentMethod: 'Contrato', section: 'SH', serviceDetails: { horasTotais: ra.data.horasTotais } }
          );
        }

        if (changes.balanceChange) clientReport.remoteAssistances.debt++;
        else clientReport.remoteAssistances.consumed++;
      }

      console.log('[migrate]', dryRun ? '(dry-run)' : '(live)', 'client', clientId, JSON.stringify({
        cpa: clientReport.cpaPeriod, sh: clientReport.shPeriod,
        ws: clientReport.workSheets, ra: clientReport.remoteAssistances,
      }));
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      clientReport.errors.push(msg);
      report.errors.push(`client ${clientId}: ${msg}`);
      console.error('[migrate] error for client', clientId, msg);
    }

    report.clients.push(clientReport);
    report.clientsProcessed++;
  }

  return report;
}

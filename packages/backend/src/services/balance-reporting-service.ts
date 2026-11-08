import type {
  StorageBucket,
  ContractPeriod,
  PeriodsIndexEntry,
  TransactionsIndexEntry,
  BalanceTransaction,
  Contract,
} from '@clever/shared';
import { computeCurrentPeriodWindow } from '@clever/shared';

export interface BalanceSummary {
  totalClients: number;
  totalActivePeriods: number;
  periodsExhausted: number; // periods where any resource counter is at 0
}

interface ClientIndexItem {
  uuid: string;
  nomeComercial?: string;
  nomeEmpresa?: string;
}

export class BalanceReportingService {
  constructor(private r2Bucket: StorageBucket) {}

  /**
   * List all active periods across all clients by scanning the balance/ prefix
   * for periods-index.json files.
   */
  async getAllActivePeriods(): Promise<ContractPeriod[]> {
    const periods: ContractPeriod[] = [];
    let cursor: string | undefined;

    // Paginate through all balance/ keys
    do {
      const list = await this.r2Bucket.list({ prefix: 'balance/', cursor });

      for (const object of list.objects) {
        if (!object.key.endsWith('/periods-index.json')) continue;

        const data = await this.r2Bucket.get(object.key);
        if (!data) continue;

        const index = (await data.json()) as PeriodsIndexEntry[];
        const clientId = object.key.split('/')[1]; // balance/{clientId}/periods-index.json

        for (const entry of index) {
          if (entry.status !== 'active') continue;
          const periodObj = await this.r2Bucket.get(`balance/${clientId}/periods/${entry.periodId}.json`);
          if (!periodObj) continue;
          periods.push((await periodObj.json()) as ContractPeriod);
        }
      }

      cursor = list.truncated ? list.cursor : undefined;
    } while (cursor);

    return periods;
  }

  async getSummaryStatistics(): Promise<BalanceSummary> {
    const periods = await this.getAllActivePeriods();
    const clientIds = new Set(periods.map(p => p.clientId));
    const exhausted = periods.filter(p => this.isExhausted(p)).length;

    return {
      totalClients: clientIds.size,
      totalActivePeriods: periods.length,
      periodsExhausted: exhausted,
    };
  }

  async exportToCSV(): Promise<string> {
    const periods = await this.getAllActivePeriods();

    const header = [
      'Client ID',
      'Contract ID',
      'Section',
      'Period Start',
      'Period End',
      'Manutenções (rem/orig)',
      'Deslocações (rem/orig)',
      'Horas (rem/orig)',
    ].join(',');

    const rows = periods.map(p => {
      const fmt = (rem: number, orig: number) =>
        `${rem === -1 ? 'Ilimitado' : rem}/${orig === -1 ? 'Ilimitado' : orig}`;
      return [
        p.clientId,
        p.contractId,
        p.section,
        p.periodStart,
        p.periodEnd,
        fmt(p.remainingResources.manutencoesPorAno, p.originalResources.manutencoesPorAno),
        fmt(p.remainingResources.deslocacoesPorAno, p.originalResources.deslocacoesPorAno),
        fmt(p.remainingResources.horasAssistenciaAnuais, p.originalResources.horasAssistenciaAnuais),
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }

  /**
   * Export a one-row-per-client summary CSV.
   *
   * Contract-driven: every non-deleted contract produces a row, so expired and
   * blank-date contracts are included (not just those with an active period).
   * Each section carries a status:
   *   Ativo     — the current 1-year period contains today
   *   Expirado  — the contract has ended; shows the last valid period
   *   Sem datas — the contract has no inicio/fim dates
   */
  async exportClientSummaryCSV(): Promise<string> {
    const contracts = await this.loadContracts();
    const names = await this.loadClientNames();
    const periods = await this.getAllPeriods(); // active + closed, for remaining resources

    // Index stored periods by contractId+section so we can read remaining resources.
    const periodByKey = new Map<string, ContractPeriod>();
    for (const p of periods) {
      periodByKey.set(`${p.contractId}:${p.section}`, p);
    }

    const header = [
      'Client ID',
      'Cliente',
      'Dívida (€)',
      'CPA Estado',
      'CPA Período',
      'CPA Manutenções (rem/orig)',
      'CPA Deslocações (rem/orig)',
      'CPA Horas (rem/orig)',
      'SH Estado',
      'SH Período',
      'SH Manutenções (rem/orig)',
      'SH Deslocações (rem/orig)',
      'SH Horas (rem/orig)',
    ].join(',');

    const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const fmt = (rem: number, orig: number) =>
      `${rem === -1 ? 'Ilimitado' : rem}/${orig === -1 ? 'Ilimitado' : orig}`;

    // Build the three cells (estado, período, resources) for one section.
    const sectionCells = (
      contract: Contract,
      section: 'CPA' | 'SH'
    ): string[] => {
      const active = section === 'CPA' ? contract.data.hasCPAContract : contract.data.hasSHContract;
      if (!active) return ['-', '-', '-', '-', '-'];

      const inicio = section === 'CPA' ? contract.data.inicioContratoCPA : contract.data.inicioContratoSH;
      const fim = section === 'CPA' ? contract.data.fimContratoCPA : contract.data.fimContratoSH;

      const window = computeCurrentPeriodWindow(inicio, fim);
      const stored = periodByKey.get(`${contract.uuid}:${section}`);

      // Original resources straight from the contract (fallback when no stored period).
      const orig =
        section === 'CPA'
          ? {
              m: contract.data.manutencoesPorAnoCPA ?? 0,
              d: contract.data.deslocacoesPorAnoCPA ?? 0,
              h: contract.data.horasAssistenciaAnualCPA ?? 0,
            }
          : {
              m: contract.data.manutencoesPorAnoSH ?? 0,
              d: contract.data.deslocacoesPorAnoSH ?? 0,
              h: contract.data.horasAssistenciaAnualSH ?? 0,
            };

      if (!window) {
        return ['Sem datas', '-', fmt(orig.m, orig.m), fmt(orig.d, orig.d), fmt(orig.h, orig.h)];
      }

      const estado = window.isActive ? 'Ativo' : 'Expirado';
      const periodo = `${window.periodStart} a ${window.periodEnd}`;

      // Prefer the stored period's remaining resources; fall back to contract originals.
      const rem = stored
        ? stored.remainingResources
        : { manutencoesPorAno: orig.m, deslocacoesPorAno: orig.d, horasAssistenciaAnuais: orig.h };
      const og = stored ? stored.originalResources : { manutencoesPorAno: orig.m, deslocacoesPorAno: orig.d, horasAssistenciaAnuais: orig.h };

      return [
        estado,
        periodo,
        fmt(rem.manutencoesPorAno, og.manutencoesPorAno),
        fmt(rem.deslocacoesPorAno, og.deslocacoesPorAno),
        fmt(rem.horasAssistenciaAnuais, og.horasAssistenciaAnuais),
      ];
    };

    const rows: string[] = [];
    for (const contract of contracts) {
      const clientId = contract.data.clientId;
      if (!clientId) continue;

      const debt = await this.getClientEuroDebt(clientId);
      const name = names.get(clientId) ?? '';

      rows.push(
        [
          clientId,
          csvCell(name),
          debt.toFixed(2),
          ...sectionCells(contract, 'CPA'),
          ...sectionCells(contract, 'SH'),
        ].join(',')
      );
    }

    return [header, ...rows].join('\n');
  }

  /** Load all non-deleted contracts via the contracts index. */
  private async loadContracts(): Promise<Contract[]> {
    const idxObj = await this.r2Bucket.get('indexes/contracts-index.json').catch(() => null);
    if (!idxObj) return [];
    const data = (await idxObj.json()) as { items?: { uuid: string; isDeleted?: boolean }[] };
    const items = (data.items ?? []).filter((it) => !it.isDeleted);

    const contracts: Contract[] = [];
    for (const it of items) {
      const obj = await this.r2Bucket.get(`content/contracts/${it.uuid}.json`).catch(() => null);
      if (!obj) continue;
      const c = (await obj.json()) as Contract;
      if (c.isDeleted) continue;
      contracts.push(c);
    }
    return contracts;
  }

  /** All periods (active + closed) across all clients. */
  private async getAllPeriods(): Promise<ContractPeriod[]> {
    const periods: ContractPeriod[] = [];
    let cursor: string | undefined;
    do {
      const list = await this.r2Bucket.list({ prefix: 'balance/', cursor });
      for (const object of list.objects) {
        if (!object.key.endsWith('/periods-index.json')) continue;
        const data = await this.r2Bucket.get(object.key);
        if (!data) continue;
        const index = (await data.json()) as PeriodsIndexEntry[];
        const clientId = object.key.split('/')[1];
        for (const entry of index) {
          const periodObj = await this.r2Bucket.get(`balance/${clientId}/periods/${entry.periodId}.json`);
          if (!periodObj) continue;
          periods.push((await periodObj.json()) as ContractPeriod);
        }
      }
      cursor = list.truncated ? list.cursor : undefined;
    } while (cursor);
    return periods;
  }

  /** Map clientId -> display name, from the clients index. */
  private async loadClientNames(): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    const obj = await this.r2Bucket.get('indexes/clients-index.json').catch(() => null);
    if (!obj) return map;
    const data = (await obj.json()) as { items?: ClientIndexItem[] };
    for (const item of data.items ?? []) {
      const name = item.nomeComercial || item.nomeEmpresa || '';
      map.set(item.uuid, name);
    }
    return map;
  }

  /** Sum euro debt for a client from its DEBT transactions. */
  private async getClientEuroDebt(clientId: string): Promise<number> {
    const idxObj = await this.r2Bucket
      .get(`balance/${clientId}/transactions-index.json`)
      .catch(() => null);
    if (!idxObj) return 0;

    const index = (await idxObj.json()) as TransactionsIndexEntry[];
    const debtEntries = index.filter((e) => e.type === 'DEBT');

    let total = 0;
    for (const entry of debtEntries) {
      const txObj = await this.r2Bucket
        .get(`balance/${clientId}/transactions/${entry.uuid}.json`)
        .catch(() => null);
      if (!txObj) continue;
      const tx = (await txObj.json()) as BalanceTransaction;
      total += tx.changes?.balanceChange ?? 0;
    }
    return total;
  }

  private isExhausted(period: ContractPeriod): boolean {
    const r = period.remainingResources;
    const o = period.originalResources;
    // A resource is "exhausted" if the original was > 0 (not unlimited) and remaining is <= 0
    return (
      (o.manutencoesPorAno > 0 && r.manutencoesPorAno <= 0) ||
      (o.deslocacoesPorAno > 0 && r.deslocacoesPorAno <= 0) ||
      (o.horasAssistenciaAnuais > 0 && r.horasAssistenciaAnuais <= 0)
    );
  }
}

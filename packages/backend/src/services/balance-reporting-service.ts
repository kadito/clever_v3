import type {
  StorageBucket,
  ContractPeriod,
  PeriodsIndexEntry,
  TransactionsIndexEntry,
  BalanceTransaction,
} from '@clever/shared';

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
   * Columns: client id, name, euro debt, and per-section remaining/original resources.
   */
  async exportClientSummaryCSV(): Promise<string> {
    const periods = await this.getAllActivePeriods();

    // Client names from the clients index
    const names = await this.loadClientNames();

    // Group active periods by client, then by section
    const byClient = new Map<string, { CPA?: ContractPeriod; SH?: ContractPeriod }>();
    for (const p of periods) {
      const entry = byClient.get(p.clientId) ?? {};
      entry[p.section] = p;
      byClient.set(p.clientId, entry);
    }

    const header = [
      'Client ID',
      'Cliente',
      'Dívida (€)',
      'CPA Período',
      'CPA Manutenções (rem/orig)',
      'CPA Deslocações (rem/orig)',
      'CPA Horas (rem/orig)',
      'SH Período',
      'SH Manutenções (rem/orig)',
      'SH Deslocações (rem/orig)',
      'SH Horas (rem/orig)',
    ].join(',');

    const fmt = (rem: number, orig: number) =>
      `${rem === -1 ? 'Ilimitado' : rem}/${orig === -1 ? 'Ilimitado' : orig}`;
    const win = (p?: ContractPeriod) => (p ? `${p.periodStart} a ${p.periodEnd}` : '-');
    const res = (p: ContractPeriod | undefined, key: keyof ContractPeriod['remainingResources']) =>
      p ? fmt(p.remainingResources[key], p.originalResources[key]) : '-';
    const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

    const rows: string[] = [];
    for (const [clientId, sections] of byClient.entries()) {
      const debt = await this.getClientEuroDebt(clientId);
      const name = names.get(clientId) ?? '';
      rows.push(
        [
          clientId,
          csvCell(name),
          debt.toFixed(2),
          win(sections.CPA),
          res(sections.CPA, 'manutencoesPorAno'),
          res(sections.CPA, 'deslocacoesPorAno'),
          res(sections.CPA, 'horasAssistenciaAnuais'),
          win(sections.SH),
          res(sections.SH, 'manutencoesPorAno'),
          res(sections.SH, 'deslocacoesPorAno'),
          res(sections.SH, 'horasAssistenciaAnuais'),
        ].join(',')
      );
    }

    return [header, ...rows].join('\n');
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

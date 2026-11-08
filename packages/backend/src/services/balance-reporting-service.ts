import type { StorageBucket, ContractPeriod, PeriodsIndexEntry } from '@clever/shared';

export interface BalanceSummary {
  totalClients: number;
  totalActivePeriods: number;
  periodsExhausted: number; // periods where any resource counter is at 0
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

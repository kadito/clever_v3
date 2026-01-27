import type { R2Bucket } from '@cloudflare/workers-types';
import type { BalanceIndex } from '@clever/shared';

export interface BalanceReportFilters {
  minDebt?: number;
  maxDebt?: number;
  lowUsageThreshold?: number; // Percentage (e.g., 20 for 20%)
}

export interface BalanceSummary {
  totalClients: number;
  clientsWithDebt: number;
  totalDebt: number;
  averageDebt: number;
  clientsWithLowUsage: number;
}

export interface ClientBalanceReport {
  clientId: string;
  balance: number;
  contracts: {
    manutencoesPorAno: number;
    deslocacoesPorAno: number;
    horasAssistenciaAnuais: number;
  };
  hasLowUsage: boolean;
  lastUpdated: string;
}

export class BalanceReportingService {
  constructor(private r2Bucket: R2Bucket) {}

  /**
   * Get all client balances with optional filtering.
   * 
   * @param filters - Optional filters for debt amount and usage
   * @returns Array of client balance reports
   */
  async getAllBalances(filters?: BalanceReportFilters): Promise<ClientBalanceReport[]> {
    try {
      console.log('Fetching all balances with filters:', JSON.stringify(filters, null, 2));
      
      // List all balance indexes
      const list = await this.r2Bucket.list({ prefix: 'balance/' });
      const balances: ClientBalanceReport[] = [];

      for (const object of list.objects) {
        // Only process index.json files
        if (!object.key.endsWith('/index.json')) {
          continue;
        }

        const data = await this.r2Bucket.get(object.key);
        if (!data) {
          continue;
        }

        const balanceIndex = (await data.json()) as BalanceIndex;
        
        // Apply filters
        if (filters) {
          // Filter by debt amount
          if (filters.minDebt !== undefined && balanceIndex.balance < filters.minDebt) {
            continue;
          }
          if (filters.maxDebt !== undefined && balanceIndex.balance > filters.maxDebt) {
            continue;
          }

          // Filter by low usage
          if (filters.lowUsageThreshold !== undefined) {
            const hasLowUsage = this.checkLowUsage(balanceIndex, filters.lowUsageThreshold);
            if (!hasLowUsage) {
              continue;
            }
          }
        }

        const report: ClientBalanceReport = {
          clientId: balanceIndex.clientId,
          balance: balanceIndex.balance,
          contracts: balanceIndex.contracts,
          hasLowUsage: this.checkLowUsage(balanceIndex, 20), // Default 20% threshold
          lastUpdated: balanceIndex.lastUpdated,
        };

        balances.push(report);
      }

      console.log('Retrieved balances:', JSON.stringify({
        count: balances.length,
        filters,
      }, null, 2));

      return balances;
    } catch (error) {
      console.error('Error fetching all balances:', JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }, null, 2));
      throw error;
    }
  }

  /**
   * Calculate summary statistics for all client balances.
   * 
   * @param filters - Optional filters to apply before calculating summary
   * @returns Summary statistics
   */
  async getSummaryStatistics(filters?: BalanceReportFilters): Promise<BalanceSummary> {
    const balances = await this.getAllBalances(filters);

    const clientsWithDebt = balances.filter(b => b.balance > 0).length;
    const totalDebt = balances.reduce((sum, b) => sum + b.balance, 0);
    const averageDebt = clientsWithDebt > 0 ? totalDebt / clientsWithDebt : 0;
    const clientsWithLowUsage = balances.filter(b => b.hasLowUsage).length;

    return {
      totalClients: balances.length,
      clientsWithDebt,
      totalDebt,
      averageDebt,
      clientsWithLowUsage,
    };
  }

  /**
   * Export balance data to CSV format.
   * 
   * @param filters - Optional filters to apply
   * @returns CSV string
   */
  async exportToCSV(filters?: BalanceReportFilters): Promise<string> {
    const balances = await this.getAllBalances(filters);

    // CSV header
    const header = [
      'Client ID',
      'Debt (EUR)',
      'Maintenance Visits',
      'Displacements',
      'Assistance Hours',
      'Low Usage',
      'Last Updated',
    ].join(',');

    // CSV rows
    const rows = balances.map(b => {
      return [
        b.clientId,
        b.balance.toFixed(2),
        b.contracts.manutencoesPorAno === -1 ? 'Unlimited' : b.contracts.manutencoesPorAno,
        b.contracts.deslocacoesPorAno === -1 ? 'Unlimited' : b.contracts.deslocacoesPorAno,
        b.contracts.horasAssistenciaAnuais === -1 ? 'Unlimited' : b.contracts.horasAssistenciaAnuais,
        b.hasLowUsage ? 'Yes' : 'No',
        b.lastUpdated,
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }

  /**
   * Check if a balance has low contract usage.
   * 
   * @param balance - Balance index to check
   * @param threshold - Percentage threshold (e.g., 20 for 20%)
   * @returns True if any contract resource is below threshold
   */
  private checkLowUsage(balance: BalanceIndex, threshold: number): boolean {
    const { contracts } = balance;

    // Check each contract resource
    const resources = [
      contracts.manutencoesPorAno,
      contracts.deslocacoesPorAno,
      contracts.horasAssistenciaAnuais,
    ];

    for (const resource of resources) {
      // Skip unlimited values (-1)
      if (resource === -1) {
        continue;
      }

      // Skip zero values (no contract resources)
      if (resource === 0) {
        continue;
      }

      // For simplicity, we consider any non-zero, non-unlimited value as potentially low
      // In a real implementation, you would need to track initial values to calculate percentage
      // This is a simplified check that assumes low usage if value is less than threshold
      if (resource > 0 && resource < threshold) {
        return true;
      }
    }

    return false;
  }
}

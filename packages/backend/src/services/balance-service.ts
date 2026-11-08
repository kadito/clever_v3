/**
 * BalancePeriodService — R2 operations for the period-based Saldo system.
 *
 * R2 key patterns:
 *   balance/{clientId}/periods/{periodId}.json
 *   balance/{clientId}/periods-index.json
 *   balance/{clientId}/transactions/{uuid}.json
 *   balance/{clientId}/transactions-index.json
 */

import type { StorageBucket } from '@clever/shared';
import type {
  ContractPeriod,
  ContractPeriodResources,
  PeriodsIndexEntry,
  BalanceTransaction,
  TransactionsIndexEntry,
  TransactionChanges,
  TransactionSource,
  TransactionMetadata,
} from '@clever/shared';

function generateUUID(): string {
  return crypto.randomUUID();
}

// ============================================================================
// Helpers — unlimited-safe arithmetic
// ============================================================================

function applyResourceChange(current: number, change: number): number {
  if (current === -1) return -1; // unlimited stays unlimited
  return current + change;
}

function applyResourceChanges(
  resources: ContractPeriodResources,
  changes: TransactionChanges['contractUsageChanges']
): ContractPeriodResources {
  if (!changes) return { ...resources };
  return {
    manutencoesPorAno:
      changes.manutencoesPorAno !== undefined
        ? applyResourceChange(resources.manutencoesPorAno, changes.manutencoesPorAno)
        : resources.manutencoesPorAno,
    deslocacoesPorAno:
      changes.deslocacoesPorAno !== undefined
        ? applyResourceChange(resources.deslocacoesPorAno, changes.deslocacoesPorAno)
        : resources.deslocacoesPorAno,
    horasAssistenciaAnuais:
      changes.horasAssistenciaAnuais !== undefined
        ? applyResourceChange(resources.horasAssistenciaAnuais, changes.horasAssistenciaAnuais)
        : resources.horasAssistenciaAnuais,
  };
}

// ============================================================================
// BalancePeriodService
// ============================================================================

export class BalancePeriodService {
  constructor(private r2: StorageBucket) {}

  // --------------------------------------------------------------------------
  // Periods index
  // --------------------------------------------------------------------------

  async getPeriodsIndex(clientId: string): Promise<PeriodsIndexEntry[]> {
    const key = `balance/${clientId}/periods-index.json`;
    const obj = await this.r2.get(key).catch(() => null);
    if (!obj) return [];
    return (await obj.json()) as PeriodsIndexEntry[];
  }

  private async writePeriodsIndex(
    clientId: string,
    entries: PeriodsIndexEntry[]
  ): Promise<void> {
    await this.r2.put(
      `balance/${clientId}/periods-index.json`,
      JSON.stringify(entries),
      { httpMetadata: { contentType: 'application/json' } }
    );
  }

  // --------------------------------------------------------------------------
  // Period documents
  // --------------------------------------------------------------------------

  async getPeriod(clientId: string, periodId: string): Promise<ContractPeriod | null> {
    const obj = await this.r2.get(`balance/${clientId}/periods/${periodId}.json`).catch(() => null);
    if (!obj) return null;
    return (await obj.json()) as ContractPeriod;
  }

  private async writePeriod(period: ContractPeriod): Promise<void> {
    await this.r2.put(
      `balance/${period.clientId}/periods/${period.uuid}.json`,
      JSON.stringify(period),
      { httpMetadata: { contentType: 'application/json' } }
    );
  }

  /**
   * Find the active period for a contract section on a given date.
   * Date comparison is string-based (ISO date YYYY-MM-DD, inclusive on both ends).
   */
  async getActivePeriodForDate(
    clientId: string,
    contractId: string,
    section: 'CPA' | 'SH',
    date: string
  ): Promise<ContractPeriod | null> {
    const index = await this.getPeriodsIndex(clientId);
    const candidates = index.filter(
      e =>
        e.contractId === contractId &&
        e.section === section &&
        e.status === 'active' &&
        e.periodStart <= date &&
        date <= e.periodEnd
    );
    if (candidates.length === 0) return null;
    return this.getPeriod(clientId, candidates[0].periodId);
  }

  /**
   * Open a new period. Checks that no active period already exists for the section.
   * Creates the period document, appends to index, and writes an ADD transaction.
   */
  async openPeriod(
    clientId: string,
    contractId: string,
    section: 'CPA' | 'SH',
    resources: ContractPeriodResources,
    periodStart: string,
    periodEnd: string,
    userId: string,
    previousPeriodId?: string,
    isActive: boolean = true
  ): Promise<ContractPeriod> {
    // Guard: at most one active period per section
    const index = await this.getPeriodsIndex(clientId);
    const alreadyActive = index.some(
      e => e.contractId === contractId && e.section === section && e.status === 'active'
    );
    if (alreadyActive) {
      console.warn(
        'BalancePeriodService: active period already exists, skipping open:',
        JSON.stringify({ clientId, contractId, section }, null, 2)
      );
      // Return the existing active period
      const existing = index.find(
        e => e.contractId === contractId && e.section === section && e.status === 'active'
      )!;
      return (await this.getPeriod(clientId, existing.periodId))!;
    }

    const periodId = generateUUID();
    const now = new Date().toISOString();

    const status: 'active' | 'closed' = isActive ? 'active' : 'closed';

    const period: ContractPeriod = {
      uuid: periodId,
      clientId,
      contractId,
      section,
      periodStart,
      periodEnd,
      status,
      originalResources: { ...resources },
      remainingResources: { ...resources },
      openedAt: now,
      openedBy: userId,
      previousPeriodId,
    };

    await this.writePeriod(period);

    // Append to index
    const newEntry: PeriodsIndexEntry = {
      periodId,
      contractId,
      section,
      status,
      periodStart,
      periodEnd,
    };
    await this.writePeriodsIndex(clientId, [...index, newEntry]);

    // Write ADD / contract-period-open transaction
    await this.writeTransaction(clientId, {
      uuid: generateUUID(),
      clientId,
      contractId,
      periodId,
      type: 'ADD',
      source: 'contract-period-open',
      sourceId: contractId,
      timestamp: now,
      createdBy: userId,
      changes: {
        contractUsageChanges: {
          manutencoesPorAno: resources.manutencoesPorAno,
          deslocacoesPorAno: resources.deslocacoesPorAno,
          horasAssistenciaAnuais: resources.horasAssistenciaAnuais,
        },
      },
      metadata: { section },
    });

    console.log(
      'BalancePeriodService: period opened:',
      JSON.stringify({ clientId, contractId, section, periodId, periodStart, periodEnd }, null, 2)
    );

    return period;
  }

  /**
   * Close an active period (called by RENOVAR).
   * Sets status to closed, writes an ADD / contract-period-close transaction.
   */
  async closePeriod(
    clientId: string,
    periodId: string,
    userId: string
  ): Promise<ContractPeriod> {
    const period = await this.getPeriod(clientId, periodId);
    if (!period) throw new Error(`Period not found: ${periodId}`);

    const now = new Date().toISOString();
    const closed: ContractPeriod = { ...period, status: 'closed', closedAt: now, closedBy: userId };

    await this.writePeriod(closed);

    // Update periods-index entry
    const index = await this.getPeriodsIndex(clientId);
    const updated = index.map(e =>
      e.periodId === periodId ? { ...e, status: 'closed' as const } : e
    );
    await this.writePeriodsIndex(clientId, updated);

    // Write ADD / contract-period-close transaction (snapshot of remaining resources)
    await this.writeTransaction(clientId, {
      uuid: generateUUID(),
      clientId,
      contractId: period.contractId,
      periodId,
      type: 'ADD',
      source: 'contract-period-close',
      sourceId: period.contractId,
      timestamp: now,
      createdBy: userId,
      changes: {
        contractUsageChanges: {
          manutencoesPorAno: period.remainingResources.manutencoesPorAno,
          deslocacoesPorAno: period.remainingResources.deslocacoesPorAno,
          horasAssistenciaAnuais: period.remainingResources.horasAssistenciaAnuais,
        },
      },
      metadata: { section: period.section },
    });

    console.log(
      'BalancePeriodService: period closed:',
      JSON.stringify({ clientId, periodId, section: period.section }, null, 2)
    );

    return closed;
  }

  /**
   * Update the remainingResources on a period after a consumption transaction.
   */
  async updatePeriodRemainingResources(
    clientId: string,
    periodId: string,
    changes: TransactionChanges['contractUsageChanges']
  ): Promise<void> {
    const period = await this.getPeriod(clientId, periodId);
    if (!period) {
      console.warn('updatePeriodRemainingResources: period not found:', JSON.stringify({ clientId, periodId }, null, 2));
      return;
    }
    const updated: ContractPeriod = {
      ...period,
      remainingResources: applyResourceChanges(period.remainingResources, changes),
    };
    await this.writePeriod(updated);
  }

  // --------------------------------------------------------------------------
  // Transactions
  // --------------------------------------------------------------------------

  async getTransactionsIndex(clientId: string): Promise<TransactionsIndexEntry[]> {
    const obj = await this.r2.get(`balance/${clientId}/transactions-index.json`).catch(() => null);
    if (!obj) return [];
    return (await obj.json()) as TransactionsIndexEntry[];
  }

  private async writeTransactionsIndex(
    clientId: string,
    entries: TransactionsIndexEntry[]
  ): Promise<void> {
    await this.r2.put(
      `balance/${clientId}/transactions-index.json`,
      JSON.stringify(entries),
      { httpMetadata: { contentType: 'application/json' } }
    );
  }

  async writeTransaction(clientId: string, transaction: BalanceTransaction): Promise<void> {
    await this.r2.put(
      `balance/${clientId}/transactions/${transaction.uuid}.json`,
      JSON.stringify(transaction),
      { httpMetadata: { contentType: 'application/json' } }
    );

    // Append to index
    const index = await this.getTransactionsIndex(clientId);
    const entry: TransactionsIndexEntry = {
      uuid: transaction.uuid,
      periodId: transaction.periodId,
      contractId: transaction.contractId,
      source: transaction.source,
      type: transaction.type,
      timestamp: transaction.timestamp,
    };
    await this.writeTransactionsIndex(clientId, [...index, entry]);
  }

  async getTransaction(clientId: string, uuid: string): Promise<BalanceTransaction | null> {
    const obj = await this.r2.get(`balance/${clientId}/transactions/${uuid}.json`).catch(() => null);
    if (!obj) return null;
    return (await obj.json()) as BalanceTransaction;
  }

  /**
   * Read transactions, filtered and paginated.
   * Reads the index first, applies filters, then fetches only matching documents.
   */
  async getTransactions(
    clientId: string,
    options: {
      type?: 'ADD' | 'DEBT';
      startDate?: string;
      endDate?: string;
      periodId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<BalanceTransaction[]> {
    let index = await this.getTransactionsIndex(clientId);

    if (options.type) {
      index = index.filter(e => e.type === options.type);
    }
    if (options.startDate) {
      index = index.filter(e => e.timestamp >= options.startDate!);
    }
    if (options.endDate) {
      index = index.filter(e => e.timestamp <= options.endDate!);
    }
    if (options.periodId) {
      index = index.filter(e => e.periodId === options.periodId);
    }

    // Sort by timestamp descending (newest first)
    index.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    // Pagination
    const offset = options.offset ?? 0;
    const limit = options.limit ?? 50;
    const page = index.slice(offset, offset + limit);

    const results = await Promise.all(
      page.map(e => this.getTransaction(clientId, e.uuid))
    );

    return results.filter((t): t is BalanceTransaction => t !== null);
  }

  /**
   * Create a DEBT transaction for a work sheet or remote assistance,
   * and update the period's remaining resources if this was a consumption.
   */
  async createDebtTransaction(
    clientId: string,
    contractId: string,
    periodId: string,
    sourceId: string,
    source: TransactionSource,
    changes: TransactionChanges,
    userId: string,
    metadata: TransactionMetadata
  ): Promise<BalanceTransaction> {
    const transaction: BalanceTransaction = {
      uuid: generateUUID(),
      clientId,
      contractId,
      periodId,
      type: 'DEBT',
      source,
      sourceId,
      timestamp: new Date().toISOString(),
      createdBy: userId,
      changes,
      metadata,
    };

    await this.writeTransaction(clientId, transaction);

    // If this was a consumption (contractUsageChanges), update remaining resources
    if (changes.contractUsageChanges) {
      await this.updatePeriodRemainingResources(clientId, periodId, changes.contractUsageChanges);
    }

    return transaction;
  }
}

export function createBalancePeriodService(r2Bucket: StorageBucket): BalancePeriodService {
  return new BalancePeriodService(r2Bucket);
}

/**
 * Kept for validation error signalling in route handlers.
 * Used by routes to distinguish business-rule errors from system errors.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Saldo por Período — Core Types
 *
 * Models the contract-period balance system. Each active contract section (CPA / SH)
 * has exactly one active ContractPeriod at a time. Resources are tracked per period
 * and reset on RENOVAR. Transactions are immutable and indexed for efficient listing.
 */

// ============================================================================
// Contract Period Resources
// ============================================================================

/**
 * Resources available within a contract period.
 * -1 = unlimited for any field.
 */
export interface ContractPeriodResources {
  manutencoesPorAno: number;      // -1 = unlimited
  deslocacoesPorAno: number;      // -1 = unlimited
  horasAssistenciaAnuais: number; // -1 = unlimited (S&H; 0 for CPA unless AP CPA + horasExtra)
}

// ============================================================================
// Contract Period
// ============================================================================

/**
 * Represents one period of a contract section (CPA or SH).
 * R2 key: balance/{clientId}/periods/{uuid}.json
 */
export interface ContractPeriod {
  uuid: string;
  clientId: string;
  contractId: string;
  section: 'CPA' | 'SH';
  /** ISO date string (inclusive) — from inicioContratoCPA/SH */
  periodStart: string;
  /** ISO date string (inclusive) — from fimContratoCPA/SH */
  periodEnd: string;
  status: 'active' | 'closed';
  /** Frozen at period-open time — never mutated */
  originalResources: ContractPeriodResources;
  /** Decremented by consumption transactions */
  remainingResources: ContractPeriodResources;
  openedAt: string;   // ISO timestamp
  openedBy: string;   // userId
  closedAt?: string;
  closedBy?: string;
  /** UUID of the period this replaced (set on renewal) */
  previousPeriodId?: string;
}

// ============================================================================
// Index Types (lightweight entries stored in index files)
// ============================================================================

/**
 * Lightweight entry stored in balance/{clientId}/periods-index.json
 */
export interface PeriodsIndexEntry {
  periodId: string;
  contractId: string;
  section: 'CPA' | 'SH';
  status: 'active' | 'closed';
  periodStart: string;
  periodEnd: string;
}

/**
 * Lightweight entry stored in balance/{clientId}/transactions-index.json
 */
export interface TransactionsIndexEntry {
  uuid: string;
  periodId: string;
  contractId: string;
  source: TransactionSource;
  type: TransactionType;
  timestamp: string;
}

// ============================================================================
// Transactions
// ============================================================================

/**
 * ADD: adds resources (period open) or records period close snapshot.
 * DEBT: consumes contract resources or records euro debt.
 */
export type TransactionType = 'ADD' | 'DEBT';

/**
 * Source content type that triggered the transaction.
 */
export type TransactionSource =
  | 'contract-period-open'
  | 'contract-period-close'
  | 'work-sheet'
  | 'remote-assistance';

/**
 * Describes the changes applied by a transaction.
 */
export interface TransactionChanges {
  /** Euro amount added to debt (positive — for euro-debt DEBT transactions) */
  balanceChange?: number;
  /** Changes to contract resource counters */
  contractUsageChanges?: {
    manutencoesPorAno?: number;
    deslocacoesPorAno?: number;
    horasAssistenciaAnuais?: number;
  };
}

/**
 * Additional context — does not affect calculations.
 */
export interface TransactionMetadata {
  paymentMethod?: string;
  serviceDetails?: Record<string, unknown>;
  contractType?: string;
  section?: 'CPA' | 'SH';
}

/**
 * Immutable record of a balance change.
 * R2 key: balance/{clientId}/transactions/{uuid}.json
 */
export interface BalanceTransaction {
  uuid: string;
  clientId: string;
  /** Which contract this transaction belongs to */
  contractId: string;
  /** Which period this transaction belongs to */
  periodId: string;
  type: TransactionType;
  source: TransactionSource;
  sourceId: string;
  timestamp: string;
  createdBy: string;
  changes: TransactionChanges;
  metadata: TransactionMetadata;
}

// ============================================================================
// Validation
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ============================================================================
// Type Guards
// ============================================================================

export function isTransactionType(value: unknown): value is TransactionType {
  return value === 'ADD' || value === 'DEBT';
}

export function isTransactionSource(value: unknown): value is TransactionSource {
  return (
    value === 'contract-period-open' ||
    value === 'contract-period-close' ||
    value === 'work-sheet' ||
    value === 'remote-assistance'
  );
}

export function isContractPeriod(value: unknown): value is ContractPeriod {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ContractPeriod).uuid === 'string' &&
    typeof (value as ContractPeriod).clientId === 'string' &&
    typeof (value as ContractPeriod).contractId === 'string' &&
    ((value as ContractPeriod).section === 'CPA' || (value as ContractPeriod).section === 'SH') &&
    ((value as ContractPeriod).status === 'active' || (value as ContractPeriod).status === 'closed')
  );
}

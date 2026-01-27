/**
 * Cliente Balance System - Core Types and Interfaces
 * 
 * This module defines all TypeScript interfaces for the balance system,
 * which tracks client debts and contract resource consumption.
 * 
 * Design Principles:
 * - Immutable transaction ledger for complete audit trail
 * - Derived balance state cached in balance indexes
 * - Type-safe interfaces with strict TypeScript mode
 */

// ============================================================================
// Balance Index - Current Financial State
// ============================================================================

/**
 * Represents the current financial state for a client.
 * This is a materialized view derived from transaction history.
 * 
 * Validates: Requirements 1.1, 1.2, 1.3
 */
export interface BalanceIndex {
  /** Client UUID */
  clientId: string;
  
  /** Current debt amount in euros (always >= 0) */
  balance: number;
  
  /** Current contract resource usage */
  contracts: ContractUsage;
  
  /** ISO timestamp of last update */
  lastUpdated: string;
  
  /** UUID of last processed transaction */
  lastTransactionId: string;
  
  /** Version number for optimistic locking */
  version: number;
}

/**
 * Contract resource usage tracking.
 * Values can be -1 to represent unlimited resources.
 * 
 * Validates: Requirements 1.2, 1.3
 */
export interface ContractUsage {
  /** Maintenance visits remaining per year (-1 for unlimited) */
  manutencoesPorAno: number;
  
  /** Displacements remaining per year (-1 for unlimited) */
  deslocacoesPorAno: number;
  
  /** Assistance hours remaining per year (-1 for unlimited) */
  horasAssistenciaAnuais: number;
}

// ============================================================================
// Transaction Records - Immutable Audit Trail
// ============================================================================

/**
 * Transaction type enumeration.
 * ADD: Adds resources (from contracts)
 * DEBT: Consumes resources or adds debt (from work sheets, remote assistance)
 * 
 * Validates: Requirements 2.2
 */
export type TransactionType = 'ADD' | 'DEBT';

/**
 * Transaction source type enumeration.
 * Identifies which content type triggered the transaction.
 * 
 * Validates: Requirements 2.3
 */
export type TransactionSource = 
  | 'contract' 
  | 'contract-renovation' 
  | 'work-sheet' 
  | 'remote-assistance';

/**
 * Immutable record of a balance change.
 * Once created, transactions cannot be modified or deleted.
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11
 */
export interface BalanceTransaction {
  /** Unique transaction identifier */
  uuid: string;
  
  /** Client UUID this transaction belongs to */
  clientId: string;
  
  /** Transaction type (ADD or DEBT) */
  type: TransactionType;
  
  /** Source content type that triggered this transaction */
  source: TransactionSource;
  
  /** UUID of source content */
  sourceId: string;
  
  /** ISO timestamp when transaction was created */
  timestamp: string;
  
  /** User ID who created the source content */
  createdBy: string;
  
  /** Changes applied by this transaction */
  changes: TransactionChanges;
  
  /** Balance snapshot after applying this transaction */
  balanceAfter: BalanceSnapshot;
  
  /** Additional context and metadata */
  metadata: TransactionMetadata;
}

/**
 * Describes the changes applied by a transaction.
 * For ADD transactions: positive values (adding resources)
 * For DEBT transactions: negative values (consuming resources) or positive balance (adding debt)
 * 
 * Validates: Requirements 2.7
 */
export interface TransactionChanges {
  /** Euro amount added to debt (positive for DEBT transactions) */
  balanceChange?: number;
  
  /** Changes to contract resource usage */
  contractUsageChanges?: {
    /** Change in maintenance visits (positive for ADD, negative for DEBT) */
    manutencoesPorAno?: number;
    
    /** Change in displacements (positive for ADD, negative for DEBT) */
    deslocacoesPorAno?: number;
    
    /** Change in assistance hours (positive for ADD, negative for DEBT) */
    horasAssistenciaAnuais?: number;
  };
}

/**
 * Point-in-time snapshot of balance state.
 * Stored with each transaction for verification and audit purposes.
 * 
 * Validates: Requirements 2.8
 */
export interface BalanceSnapshot {
  /** Balance amount at this point in time */
  balance: number;
  
  /** Contract usage at this point in time */
  contracts: ContractUsage;
}

/**
 * Additional context for a transaction.
 * Provides business context without affecting balance calculations.
 * 
 * Validates: Requirements 2.9
 */
export interface TransactionMetadata {
  /** Payment method for work sheets and remote assistance */
  paymentMethod?: string;
  
  /** Additional service details */
  serviceDetails?: Record<string, any>;
  
  /** Contract type for contract transactions */
  contractType?: string;
  
  /** Renovation period for contract renovations */
  renovationPeriod?: string;
}

// ============================================================================
// Query and Filtering
// ============================================================================

/**
 * Options for querying transaction history.
 * Supports filtering by type, date range, and pagination.
 * 
 * Validates: Requirements 9.6, 9.7, 15.2, 15.3
 */
export interface QueryOptions {
  /** Filter by transaction type */
  type?: TransactionType;
  
  /** Filter by start date (ISO timestamp) */
  startDate?: string;
  
  /** Filter by end date (ISO timestamp) */
  endDate?: string;
  
  /** Maximum number of results to return */
  limit?: number;
  
  /** Number of results to skip (for pagination) */
  offset?: number;
}

// ============================================================================
// Validation and Error Handling
// ============================================================================

/**
 * Result of a validation operation.
 * 
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  
  /** List of validation error messages (Portuguese) */
  errors: string[];
}

/**
 * Structured error information for balance operations.
 * Distinguishes between validation errors (not retryable) and system errors (retryable).
 * 
 * Validates: Requirements 13.1, 13.2
 */
export interface BalanceError {
  /** Error code for programmatic handling */
  code: string;
  
  /** Human-readable error message (Portuguese) */
  message: string;
  
  /** Additional error details */
  details?: Record<string, any>;
  
  /** Whether this error can be retried */
  retryable: boolean;
}

// ============================================================================
// Failed Transaction Recovery
// ============================================================================

/**
 * Record of a failed transaction for administrative recovery.
 * 
 * Validates: Requirements 13.3
 */
export interface FailedTransaction {
  /** Transaction UUID that failed */
  transactionId: string;
  
  /** Client UUID */
  clientId: string;
  
  /** Source content UUID */
  sourceId: string;
  
  /** Source content type */
  sourceType: string;
  
  /** Reason for failure */
  failureReason: string;
  
  /** ISO timestamp when failure occurred */
  failureTimestamp: string;
  
  /** Number of retry attempts */
  retryCount: number;
  
  /** ISO timestamp of last retry attempt */
  lastRetryTimestamp?: string;
}

// ============================================================================
// Balance Reporting
// ============================================================================

/**
 * Summary statistics for balance reporting.
 * 
 * Validates: Requirements 15.4
 */
export interface BalanceSummary {
  /** Total debt across all clients */
  totalDebt: number;
  
  /** Average debt per client */
  averageDebt: number;
  
  /** Number of clients with outstanding debt */
  clientsWithDebt: number;
  
  /** Total number of clients */
  totalClients: number;
}

/**
 * Client balance with warning indicators.
 * Used for reporting and display purposes.
 * 
 * Validates: Requirements 8.5
 */
export interface ClientBalanceReport {
  /** Client UUID */
  clientId: string;
  
  /** Client name for display */
  clientName: string;
  
  /** Current balance */
  balance: BalanceIndex;
  
  /** Whether client has outstanding debt */
  hasDebt: boolean;
  
  /** Whether any contract usage is below 20% threshold */
  hasLowUsage: boolean;
  
  /** Warning message if applicable */
  warningMessage?: string;
}

// ============================================================================
// Type Guards and Utilities
// ============================================================================

/**
 * Type guard to check if a value is a valid TransactionType.
 */
export function isTransactionType(value: any): value is TransactionType {
  return value === 'ADD' || value === 'DEBT';
}

/**
 * Type guard to check if a value is a valid TransactionSource.
 */
export function isTransactionSource(value: any): value is TransactionSource {
  return (
    value === 'contract' ||
    value === 'contract-renovation' ||
    value === 'work-sheet' ||
    value === 'remote-assistance'
  );
}

/**
 * Type guard to check if a value is a valid BalanceIndex.
 */
export function isBalanceIndex(value: any): value is BalanceIndex {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.clientId === 'string' &&
    typeof value.balance === 'number' &&
    value.balance >= 0 &&
    typeof value.contracts === 'object' &&
    typeof value.lastUpdated === 'string' &&
    typeof value.lastTransactionId === 'string' &&
    typeof value.version === 'number'
  );
}

/**
 * Type guard to check if a value is a valid BalanceTransaction.
 */
export function isBalanceTransaction(value: any): value is BalanceTransaction {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.uuid === 'string' &&
    typeof value.clientId === 'string' &&
    isTransactionType(value.type) &&
    isTransactionSource(value.source) &&
    typeof value.sourceId === 'string' &&
    typeof value.timestamp === 'string' &&
    typeof value.createdBy === 'string' &&
    typeof value.changes === 'object' &&
    typeof value.balanceAfter === 'object' &&
    typeof value.metadata === 'object'
  );
}

/**
 * Type guard to check if contract usage value is unlimited.
 */
export function isUnlimitedUsage(value: number): boolean {
  return value === -1;
}

/**
 * Type guard to check if contract usage value is valid.
 * Valid values are -1 (unlimited) or >= 0.
 */
export function isValidUsageValue(value: number): boolean {
  return value === -1 || value >= 0;
}

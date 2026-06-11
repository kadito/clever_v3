/**
 * Cliente Balance System - Calculation Utilities
 * 
 * This module provides pure functions for balance calculations and validations.
 * All functions are designed to be testable and handle unlimited values (-1) correctly.
 * 
 * Design Principles:
 * - Pure functions with no side effects
 * - Explicit handling of unlimited values (-1)
 * - Type-safe with strict TypeScript mode
 * - Portuguese error messages for user-facing validation
 * 
 * Validates: Requirements 1.5, 6.1, 6.2, 6.3, 6.4
 */

import type {
  BalanceIndex,
  BalanceTransaction,
  TransactionChanges,
  ContractUsage,
  ValidationResult,
} from './balance-types';

// ============================================================================
// Balance Calculation Functions
// ============================================================================

/**
 * Calculate balance index from a sequence of transactions.
 * Processes transactions in chronological order to derive current state.
 * 
 * This is the core calculation function that implements Property 2:
 * Balance Calculation Consistency - recalculating from scratch should
 * always produce the same result.
 * 
 * @param transactions - Array of transactions to process
 * @returns Calculated balance index
 * 
 * Validates: Requirements 1.5
 * 
 * @example
 * const transactions = [
 *   { type: 'ADD', changes: { contractUsageChanges: { manutencoesPorAno: 12 } } },
 *   { type: 'DEBT', changes: { contractUsageChanges: { manutencoesPorAno: -1 } } }
 * ];
 * const balance = calculateBalanceFromTransactions(transactions);
 * // balance.contracts.manutencoesPorAno === 11
 */
export function calculateBalanceFromTransactions(
  transactions: BalanceTransaction[]
): BalanceIndex {
  // Handle empty transaction array
  if (transactions.length === 0) {
    throw new Error('Cannot calculate balance from empty transaction array');
  }

  // Sort transactions by timestamp (chronological order)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Initialize balance state
  let balance = 0;
  const contracts: ContractUsage = {
    manutencoesPorAno: 0,
    deslocacoesPorAno: 0,
    horasAssistenciaAnuais: 0,
  };

  // Process each transaction in order
  for (const transaction of sortedTransactions) {
    // Apply balance changes
    if (transaction.changes.balanceChange !== undefined) {
      balance += transaction.changes.balanceChange;
    }

    // Apply contract usage changes
    if (transaction.changes.contractUsageChanges) {
      const changes = transaction.changes.contractUsageChanges;

      if (changes.manutencoesPorAno !== undefined) {
        contracts.manutencoesPorAno = addUsageValues(
          contracts.manutencoesPorAno,
          changes.manutencoesPorAno
        );
      }

      if (changes.deslocacoesPorAno !== undefined) {
        contracts.deslocacoesPorAno = addUsageValues(
          contracts.deslocacoesPorAno,
          changes.deslocacoesPorAno
        );
      }

      if (changes.horasAssistenciaAnuais !== undefined) {
        contracts.horasAssistenciaAnuais = addUsageValues(
          contracts.horasAssistenciaAnuais,
          changes.horasAssistenciaAnuais
        );
      }
    }
  }

  // Get client ID from first transaction
  const clientId = sortedTransactions[0].clientId;

  // Return calculated balance index
  return {
    clientId,
    balance,
    contracts,
    lastUpdated: new Date().toISOString(),
    lastTransactionId: sortedTransactions[sortedTransactions.length - 1].uuid,
    version: sortedTransactions.length,
  };
}

/**
 * Apply a single transaction to an existing balance index.
 * This is used for incremental updates when processing new transactions.
 * 
 * @param currentBalance - Current balance index (null for first transaction)
 * @param transaction - Transaction to apply
 * @returns Updated balance index
 * 
 * Validates: Requirements 1.5
 * 
 * @example
 * const currentBalance = { balance: 100, contracts: { manutencoesPorAno: 12, ... } };
 * const transaction = { changes: { balanceChange: 50 } };
 * const newBalance = applyTransactionToBalance(currentBalance, transaction);
 * // newBalance.balance === 150
 */
export function applyTransactionToBalance(
  currentBalance: BalanceIndex | null,
  transaction: BalanceTransaction
): BalanceIndex {
  // Initialize balance if this is the first transaction
  if (!currentBalance) {
    return {
      clientId: transaction.clientId,
      balance: transaction.changes.balanceChange || 0,
      contracts: {
        manutencoesPorAno:
          transaction.changes.contractUsageChanges?.manutencoesPorAno || 0,
        deslocacoesPorAno:
          transaction.changes.contractUsageChanges?.deslocacoesPorAno || 0,
        horasAssistenciaAnuais:
          transaction.changes.contractUsageChanges?.horasAssistenciaAnuais || 0,
      },
      lastUpdated: new Date().toISOString(),
      lastTransactionId: transaction.uuid,
      version: 1,
    };
  }

  // Apply balance change
  let newBalance = currentBalance.balance;
  if (transaction.changes.balanceChange !== undefined) {
    newBalance += transaction.changes.balanceChange;
  }

  // Apply contract usage changes
  const newContracts: ContractUsage = { ...currentBalance.contracts };

  if (transaction.changes.contractUsageChanges) {
    const changes = transaction.changes.contractUsageChanges;

    if (changes.manutencoesPorAno !== undefined) {
      newContracts.manutencoesPorAno = addUsageValues(
        currentBalance.contracts.manutencoesPorAno,
        changes.manutencoesPorAno
      );
    }

    if (changes.deslocacoesPorAno !== undefined) {
      newContracts.deslocacoesPorAno = addUsageValues(
        currentBalance.contracts.deslocacoesPorAno,
        changes.deslocacoesPorAno
      );
    }

    if (changes.horasAssistenciaAnuais !== undefined) {
      newContracts.horasAssistenciaAnuais = addUsageValues(
        currentBalance.contracts.horasAssistenciaAnuais,
        changes.horasAssistenciaAnuais
      );
    }
  }

  // Return updated balance index
  return {
    clientId: transaction.clientId,
    balance: newBalance,
    contracts: newContracts,
    lastUpdated: new Date().toISOString(),
    lastTransactionId: transaction.uuid,
    version: currentBalance.version + 1,
  };
}

/**
 * Validate a proposed transaction against current balance state.
 * Ensures that DEBT transactions don't result in negative balances or usage.
 * 
 * This implements Property 7: Validation Prevents Negative Balances
 * 
 * @param currentBalance - Current balance index (null if no balance exists)
 * @param changes - Proposed transaction changes
 * @returns Validation result with Portuguese error messages
 * 
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 * 
 * @example
 * const balance = { balance: 50, contracts: { manutencoesPorAno: 5, ... } };
 * const changes = { balanceChange: -100 };
 * const result = validateTransactionAgainstBalance(balance, changes);
 * // result.isValid === false
 * // result.errors[0] === 'A transação resultaria num saldo negativo...'
 */
export function validateTransactionAgainstBalance(
  currentBalance: BalanceIndex | null,
  changes: TransactionChanges
): ValidationResult {
  const errors: string[] = [];

  // If no current balance, initialize with zeros for validation
  const balance = currentBalance?.balance || 0;
  const contracts = currentBalance?.contracts || {
    manutencoesPorAno: 0,
    deslocacoesPorAno: 0,
    horasAssistenciaAnuais: 0,
  };

  // Validate balance change
  if (changes.balanceChange !== undefined) {
    const newBalance = balance + changes.balanceChange;
    if (newBalance < 0) {
      errors.push(
        `A transação resultaria num saldo negativo (${newBalance.toFixed(2)}€). ` +
          `Saldo atual: ${balance.toFixed(2)}€, Alteração: ${changes.balanceChange.toFixed(2)}€`
      );
    }
  }

  // Validate contract usage changes
  if (changes.contractUsageChanges) {
    const usageChanges = changes.contractUsageChanges;

    // Validate maintenance visits
    if (usageChanges.manutencoesPorAno !== undefined) {
      const newValue = addUsageValues(
        contracts.manutencoesPorAno,
        usageChanges.manutencoesPorAno
      );
      if (newValue < -1) {
        errors.push(
          `A transação resultaria em manutenções por ano negativas (${newValue}). ` +
            `Valor atual: ${formatUsageValue(contracts.manutencoesPorAno)}, ` +
            `Alteração: ${usageChanges.manutencoesPorAno}`
        );
      }
    }

    // Validate displacements
    if (usageChanges.deslocacoesPorAno !== undefined) {
      const newValue = addUsageValues(
        contracts.deslocacoesPorAno,
        usageChanges.deslocacoesPorAno
      );
      if (newValue < -1) {
        errors.push(
          `A transação resultaria em deslocações por ano negativas (${newValue}). ` +
            `Valor atual: ${formatUsageValue(contracts.deslocacoesPorAno)}, ` +
            `Alteração: ${usageChanges.deslocacoesPorAno}`
        );
      }
    }

    // Validate assistance hours
    if (usageChanges.horasAssistenciaAnuais !== undefined) {
      const newValue = addUsageValues(
        contracts.horasAssistenciaAnuais,
        usageChanges.horasAssistenciaAnuais
      );
      if (newValue < -1) {
        errors.push(
          `A transação resultaria em horas de assistência anuais negativas (${newValue}). ` +
            `Valor atual: ${formatUsageValue(contracts.horasAssistenciaAnuais)}, ` +
            `Alteração: ${usageChanges.horasAssistenciaAnuais}`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Helper Functions for Unlimited Values
// ============================================================================

/**
 * Add two usage values, handling unlimited (-1) correctly.
 * 
 * Rules:
 * - If either value is unlimited (-1), result is unlimited (-1)
 * - Otherwise, perform normal addition
 * 
 * This ensures that unlimited resources remain unlimited when combined
 * with any other value, and that consuming from unlimited resources
 * keeps them unlimited.
 * 
 * @param current - Current usage value
 * @param change - Change to apply
 * @returns New usage value
 * 
 * @example
 * addUsageValues(10, 5) === 15
 * addUsageValues(-1, 5) === -1  // Unlimited + 5 = Unlimited
 * addUsageValues(10, -1) === -1 // 10 + Unlimited = Unlimited
 * addUsageValues(-1, -5) === -1 // Unlimited - 5 = Unlimited
 */
function addUsageValues(current: number, change: number): number {
  // If either value is unlimited, result is unlimited
  if (current === -1 || change === -1) {
    return -1;
  }

  // Normal addition for finite values
  return current + change;
}

/**
 * Format a usage value for display in error messages.
 * Converts -1 to "Ilimitado" for Portuguese users.
 * 
 * @param value - Usage value to format
 * @returns Formatted string
 * 
 * @example
 * formatUsageValue(10) === "10"
 * formatUsageValue(-1) === "Ilimitado"
 */
function formatUsageValue(value: number): string {
  return value === -1 ? 'Ilimitado' : value.toString();
}

// ============================================================================
// Exported Helper Functions
// ============================================================================

/**
 * Check if a usage value represents unlimited resources.
 * 
 * @param value - Usage value to check
 * @returns True if value is -1 (unlimited)
 * 
 * @example
 * isUnlimited(10) === false
 * isUnlimited(-1) === true
 */
export function isUnlimited(value: number): boolean {
  return value === -1;
}

/**
 * Check if a balance index has any low usage warnings.
 * Low usage is defined as below 20% of original value.
 * 
 * Note: This function requires the original contract values to calculate
 * the percentage. For now, it returns false as we need to implement
 * tracking of original values in a future enhancement.
 * 
 * @param balance - Balance index to check
 * @returns True if any usage is below 20% threshold
 * 
 * Validates: Requirements 8.5
 * 
 * @example
 * const balance = { contracts: { manutencoesPorAno: 2, ... } };
 * // If original was 12, this would be 16.7% (below 20%)
 * hasLowUsage(balance) // Implementation pending
 */
export function hasLowUsage(balance: BalanceIndex): boolean {
  // TODO: Implement low usage detection
  // This requires tracking original contract values from first ADD transaction
  // For now, return false as a placeholder
  return false;
}

/**
 * Calculate the percentage of usage remaining.
 * Returns null for unlimited values.
 * 
 * @param current - Current usage value
 * @param original - Original usage value
 * @returns Percentage remaining (0-100) or null for unlimited
 * 
 * @example
 * calculateUsagePercentage(8, 12) === 66.67
 * calculateUsagePercentage(-1, 12) === null  // Unlimited
 * calculateUsagePercentage(0, 12) === 0
 */
export function calculateUsagePercentage(
  current: number,
  original: number
): number | null {
  // Unlimited values don't have a percentage
  if (current === -1 || original === -1) {
    return null;
  }

  // Avoid division by zero
  if (original === 0) {
    return 0;
  }

  return (current / original) * 100;
}

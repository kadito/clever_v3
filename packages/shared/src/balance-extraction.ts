/**
 * Cliente Balance System - Transaction Extraction Logic
 * 
 * This module provides functions to extract transaction data from source content
 * (contracts, work sheets, remote assistance) and convert them into TransactionChanges
 * that can be applied to client balances.
 * 
 * Design Principles:
 * - Extraction logic is centralized and testable
 * - Handles both CPA and S&H contracts
 * - Negative values for DEBT transactions (consumption)
 * - Positive values for ADD transactions (addition)
 * - Garantia payment method results in no transaction
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5
 */

import type { TransactionChanges } from './balance-types';
import type { Contract } from './types/contracts/types';
import type { WorkSheet } from './types/work-sheets/types';
import type { RemoteAssistance } from './types/remote-assistance/types';
import { calculateWorkSheetTotals } from './types/work-sheets/validation';

// ============================================================================
// Contract ADD Transaction Extraction
// ============================================================================

/**
 * Extract ADD transaction from contract creation or renovation.
 * 
 * Handles both CPA and S&H contract sections:
 * - CPA contracts: Extract maintenance, displacements, and hours from CPA fields
 * - S&H contracts: Extract maintenance, displacements, and hours from S&H fields
 * - Both: Sum values from both sections
 * 
 * All values are positive (adding resources to client balance).
 * 
 * @param contract - Contract content with CPA and/or S&H sections
 * @returns TransactionChanges with positive contract usage values
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */
export function extractContractAddTransaction(contract: Contract): TransactionChanges {
  const changes: TransactionChanges = {
    contractUsageChanges: {
      manutencoesPorAno: 0,
      deslocacoesPorAno: 0,
      horasAssistenciaAnuais: 0,
    },
  };

  // Extract from CPA contract if present
  if (contract.data.hasCPAContract) {
    // Add maintenance visits from CPA
    changes.contractUsageChanges!.manutencoesPorAno! += 
      contract.data.manutencoesPorAnoCPA || 0;
    
    // Add displacements from CPA
    changes.contractUsageChanges!.deslocacoesPorAno! += 
      contract.data.deslocacoesPorAnoCPA || 0;
    
    // Add assistance hours from CPA
    changes.contractUsageChanges!.horasAssistenciaAnuais! += 
      contract.data.horasAssistenciaAnualCPA || 0;
  }

  // Extract from S&H contract if present
  if (contract.data.hasSHContract) {
    // Add maintenance visits from S&H
    changes.contractUsageChanges!.manutencoesPorAno! += 
      contract.data.manutencoesPorAnoSH || 0;
    
    // Add displacements from S&H
    changes.contractUsageChanges!.deslocacoesPorAno! += 
      contract.data.deslocacoesPorAnoSH || 0;
    
    // Add assistance hours from S&H
    changes.contractUsageChanges!.horasAssistenciaAnuais! += 
      contract.data.horasAssistenciaAnualSH || 0;
  }

  return changes;
}

// ============================================================================
// Work Sheet DEBT Transaction Extraction
// ============================================================================

/**
 * Extract DEBT transaction from work sheet creation.
 * 
 * Warranty and payment method determine transaction type:
 * - Warranty work (otherData.warranty = true): No transaction (warranty work, no cost to client)
 * - "CONTRATO" payment: Consume contract resources (maintenance visit + displacements)
 * - Other payment methods: Add to client debt (totalValue calculated from hours and displacement)
 * 
 * For contract payment:
 * - Consumes 1 maintenance visit (manutencoesPorAno: -1)
 * - Consumes displacements if applicable (deslocacoesPorAno: negative value)
 * - Note: Work sheets don't consume assistance hours (those are for remote assistance)
 * 
 * For other payment methods:
 * - Adds totalValue to client debt (balanceChange: positive value)
 * - totalValue should be calculated from hours worked and displacement costs
 * 
 * @param workSheet - Work sheet content with payment method and service details
 * @returns TransactionChanges with negative contract usage or positive balance change
 * 
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */
export function extractWorkSheetDebtTransaction(workSheet: WorkSheet): TransactionChanges {
  // Warranty work - no transaction
  if (workSheet.data.otherData.warranty) {
    return { contractUsageChanges: {} };
  }

  const paymentMethod = workSheet.data.displacement.paymentMethod;

  // Contract payment - consume contract resources
  if (paymentMethod === 'CONTRATO') {
    const changes: TransactionChanges = {
      contractUsageChanges: {
        // Consume 1 maintenance visit
        manutencoesPorAno: -1,
      },
    };

    // Consume displacements if there was a displacement
    if (workSheet.data.displacement.hasDisplacement) {
      // For work sheets, we consume 1 displacement per visit
      // (regardless of actual kilometers - that's the business rule)
      changes.contractUsageChanges!.deslocacoesPorAno = -1;
    }

    return changes;
  }

  // Other payment methods - add to debt
  // Calculate total value from hours worked and displacement costs
  const totals = calculateWorkSheetTotals(workSheet.data);

  return {
    balanceChange: totals.totalPrice,
  };
}

// ============================================================================
// Remote Assistance DEBT Transaction Extraction
// ============================================================================

/**
 * Extract DEBT transaction from remote assistance creation.
 * 
 * Payment method determines transaction type:
 * - "Garantia": No transaction (warranty work, no cost to client)
 * - "Contrato": Consume contract assistance hours
 * - Other methods: Add to client debt (valorAssist field)
 * 
 * For contract payment:
 * - Consumes assistance hours based on duration (horasAssistenciaAnuais: negative value)
 * - Duration is calculated from inicioAssistencia and fimAssistencia
 * - Hours are rounded to nearest 15-minute interval
 * 
 * For other payment methods:
 * - Adds valorAssist to client debt (balanceChange: positive value)
 * - valorAssist is calculated based on business hours vs after-hours rates
 * 
 * @param remoteAssistance - Remote assistance content with payment method and duration
 * @returns TransactionChanges with negative assistance hours or positive balance change
 * 
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */
export function extractRemoteAssistanceDebtTransaction(
  remoteAssistance: RemoteAssistance
): TransactionChanges {
  const paymentMethod = remoteAssistance.data.paymentMethod;

  // Garantia - no transaction (warranty work)
  if (paymentMethod === 'Garantia') {
    return { contractUsageChanges: {} };
  }

  // Contract payment - consume assistance hours
  if (paymentMethod === 'Contrato') {
    // Calculate duration in hours from horasTotais field
    // horasTotais is in format "HH:MM"
    const horasTotais = remoteAssistance.data.horasTotais || '0:00';
    const [hours, minutes] = horasTotais.split(':').map(Number);
    const totalHours = hours + (minutes / 60);

    return {
      contractUsageChanges: {
        // Consume assistance hours (negative value)
        horasAssistenciaAnuais: -totalHours,
      },
    };
  }

  // Other payment methods - add to debt
  // valorAssist is already calculated in the remote assistance data
  return {
    balanceChange: remoteAssistance.data.valorAssist || 0,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a transaction has any changes.
 * Used to determine if a transaction should be created.
 * 
 * @param changes - TransactionChanges to check
 * @returns true if there are any changes, false otherwise
 */
export function hasTransactionChanges(changes: TransactionChanges): boolean {
  // Check balance change
  if (changes.balanceChange && changes.balanceChange !== 0) {
    return true;
  }

  // Check contract usage changes
  if (changes.contractUsageChanges) {
    const usage = changes.contractUsageChanges;
    if (
      (usage.manutencoesPorAno && usage.manutencoesPorAno !== 0) ||
      (usage.deslocacoesPorAno && usage.deslocacoesPorAno !== 0) ||
      (usage.horasAssistenciaAnuais && usage.horasAssistenciaAnuais !== 0)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Validate that ADD transaction changes are non-negative.
 * ADD transactions should only add resources, never consume them.
 * 
 * @param changes - TransactionChanges to validate
 * @returns true if all changes are non-negative, false otherwise
 */
export function validateAddTransactionChanges(changes: TransactionChanges): boolean {
  // Balance changes should not be present in ADD transactions
  if (changes.balanceChange !== undefined) {
    return false;
  }

  // Contract usage changes should be non-negative
  if (changes.contractUsageChanges) {
    const usage = changes.contractUsageChanges;
    
    if (usage.manutencoesPorAno !== undefined && usage.manutencoesPorAno < 0) {
      return false;
    }
    
    if (usage.deslocacoesPorAno !== undefined && usage.deslocacoesPorAno < 0) {
      return false;
    }
    
    if (usage.horasAssistenciaAnuais !== undefined && usage.horasAssistenciaAnuais < 0) {
      return false;
    }
  }

  return true;
}

/**
 * Validate that DEBT transaction changes are appropriate.
 * DEBT transactions should either:
 * - Add to balance (positive balanceChange), OR
 * - Consume contract resources (negative contractUsageChanges)
 * But not both.
 * 
 * @param changes - TransactionChanges to validate
 * @returns true if changes are valid for DEBT transaction, false otherwise
 */
export function validateDebtTransactionChanges(changes: TransactionChanges): boolean {
  const hasBalanceChange = changes.balanceChange !== undefined && changes.balanceChange > 0;
  const hasUsageChanges = changes.contractUsageChanges && 
    Object.values(changes.contractUsageChanges).some(v => v !== undefined && v !== 0);

  // Must have either balance change or usage changes, but not both
  // (This is a business rule - either pay with money or pay with contract resources)
  if (hasBalanceChange && hasUsageChanges) {
    return false;
  }

  if (!hasBalanceChange && !hasUsageChanges) {
    return false;
  }

  // If using contract resources, all changes should be negative
  if (hasUsageChanges && changes.contractUsageChanges) {
    const usage = changes.contractUsageChanges;
    
    if (usage.manutencoesPorAno !== undefined && usage.manutencoesPorAno > 0) {
      return false;
    }
    
    if (usage.deslocacoesPorAno !== undefined && usage.deslocacoesPorAno > 0) {
      return false;
    }
    
    if (usage.horasAssistenciaAnuais !== undefined && usage.horasAssistenciaAnuais > 0) {
      return false;
    }
  }

  return true;
}

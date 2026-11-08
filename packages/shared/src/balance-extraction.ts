/**
 * Balance Extraction — Period-Aware Transaction Logic
 *
 * Extracts TransactionChanges from content records, respecting the active period:
 *
 * D8: No active period on request date → euro debt (not contract consumption)
 * D9: Period active but resource exhausted (=== 0) → euro debt
 * D10: User can always select CONTRATO; balance can go negative (debt tracked as balanceChange)
 *
 * All functions require an `activePeriod` parameter. Pass `null` when no period
 * was found for the relevant section on the request date.
 */

import type { TransactionChanges, ContractPeriod, ContractPeriodResources } from './balance-types';
import type { Contract } from './types/contracts/types';
import type { WorkSheet } from './types/work-sheets/types';
import type { RemoteAssistance } from './types/remote-assistance/types';
import { calculateWorkSheetTotals } from './types/work-sheets/validation';

// ============================================================================
// Section Routing Helper
// ============================================================================

/**
 * Maps a work-sheet serviceType to a contract section (CPA or SH).
 * Returns null for types that do not consume any contract resources.
 */
export function getSectionForServiceType(
  serviceType: string
): 'CPA' | 'SH' | null {
  if (serviceType === 'MANUTENÇÃO' || serviceType === 'ASSISTÊNCIA PRESENCIAL CPA') {
    return 'CPA';
  }
  if (serviceType === 'ASSISTÊNCIA PRESENCIAL SOFTWARE') {
    return 'SH';
  }
  return null; // INSTALAÇÃO or empty — no contract consumption
}

// ============================================================================
// Contract ADD Transaction Extraction
// ============================================================================

/**
 * Extract resources from a contract section for a period-open transaction.
 * Called when opening a CPA or SH period.
 */
export function extractContractSectionResources(
  contract: Contract,
  section: 'CPA' | 'SH'
): ContractPeriodResources {
  if (section === 'CPA') {
    return {
      manutencoesPorAno: contract.data.manutencoesPorAnoCPA ?? 0,
      deslocacoesPorAno: contract.data.deslocacoesPorAnoCPA ?? 0,
      horasAssistenciaAnuais: contract.data.horasAssistenciaAnualCPA ?? 0,
    };
  }
  return {
    manutencoesPorAno: contract.data.manutencoesPorAnoSH ?? 0,
    deslocacoesPorAno: contract.data.deslocacoesPorAnoSH ?? 0,
    horasAssistenciaAnuais: contract.data.horasAssistenciaAnualSH ?? 0,
  };
}

// ============================================================================
// Work Sheet DEBT Transaction Extraction
// ============================================================================

/**
 * Extract DEBT transaction changes from a work sheet.
 *
 * @param workSheet - Work sheet content
 * @param activePeriod - Active period for the relevant section on request.date, or null
 */
export function extractWorkSheetDebtTransaction(
  workSheet: WorkSheet,
  activePeriod: ContractPeriod | null
): TransactionChanges {
  // Warranty work — no transaction
  if (workSheet.data.otherData.warranty) {
    return { contractUsageChanges: {} };
  }

  const paymentMethod = workSheet.data.displacement.paymentMethod;
  const serviceType = workSheet.data.otherData.serviceType;

  // Non-contract payment — add to euro debt
  if (paymentMethod !== 'CONTRATO') {
    const snapshotPrice = workSheet.data.pricingSnapshot?.calculated.totalPrice;
    const totalPrice =
      snapshotPrice != null && Number.isFinite(snapshotPrice)
        ? snapshotPrice
        : calculateWorkSheetTotals(workSheet.data).totalPrice;
    return { balanceChange: totalPrice };
  }

  // CONTRATO payment — consume resources by service type
  const snapshotPrice = workSheet.data.pricingSnapshot?.calculated.totalPrice;
  const fallbackPrice =
    snapshotPrice != null && Number.isFinite(snapshotPrice)
      ? snapshotPrice
      : calculateWorkSheetTotals(workSheet.data).totalPrice;

  switch (serviceType) {
    case 'MANUTENÇÃO': {
      // D8: no active period → euro debt
      if (!activePeriod) return { balanceChange: fallbackPrice };
      // D9: manutenção or deslocação exhausted → euro debt
      const r = activePeriod.remainingResources;
      if (isExhausted(r.manutencoesPorAno) || isExhausted(r.deslocacoesPorAno)) {
        return { balanceChange: fallbackPrice };
      }
      return {
        contractUsageChanges: {
          manutencoesPorAno: -1,
          deslocacoesPorAno: -1,
        },
      };
    }

    case 'ASSISTÊNCIA PRESENCIAL CPA': {
      // D8: no active period → euro debt
      if (!activePeriod) return { balanceChange: fallbackPrice };
      const r = activePeriod.remainingResources;
      // D9: deslocação exhausted → euro debt
      if (isExhausted(r.deslocacoesPorAno)) return { balanceChange: fallbackPrice };

      const changes: TransactionChanges = {
        contractUsageChanges: { deslocacoesPorAno: -1 },
      };

      // horasExtra: also consume assistance hours
      if (workSheet.data.otherData.horasExtra) {
        const horasTotais = workSheet.data.request.totalHours || '0:00';
        const [h, m] = horasTotais.split(':').map(Number);
        const totalHours = (h || 0) + ((m || 0) / 60);
        if (totalHours > 0) {
          changes.contractUsageChanges!.horasAssistenciaAnuais = -totalHours;
        }
      }
      return changes;
    }

    case 'ASSISTÊNCIA PRESENCIAL SOFTWARE': {
      // D8: no active period → euro debt
      if (!activePeriod) return { balanceChange: fallbackPrice };
      const r = activePeriod.remainingResources;
      // D9: deslocação exhausted → euro debt
      if (isExhausted(r.deslocacoesPorAno)) return { balanceChange: fallbackPrice };
      return {
        contractUsageChanges: { deslocacoesPorAno: -1 },
      };
    }

    case 'INSTALAÇÃO':
    case '':
    default:
      return { contractUsageChanges: {} };
  }
}

// ============================================================================
// Remote Assistance DEBT Transaction Extraction
// ============================================================================

/**
 * Extract DEBT transaction changes from a remote assistance.
 *
 * @param remoteAssistance - Remote assistance content
 * @param activePeriod - Active SH period on dataPedido, or null
 */
export function extractRemoteAssistanceDebtTransaction(
  remoteAssistance: RemoteAssistance,
  activePeriod: ContractPeriod | null
): TransactionChanges {
  const paymentMethod = remoteAssistance.data.paymentMethod;

  // Garantia — no transaction
  if (paymentMethod === 'Garantia') {
    return { contractUsageChanges: {} };
  }

  // Non-contract payment — add to euro debt
  if (paymentMethod !== 'Contrato') {
    return { balanceChange: remoteAssistance.data.valorAssist || 0 };
  }

  // Contrato payment — consume SH assistance hours
  const fallbackPrice = remoteAssistance.data.valorAssist || 0;

  // D8: no active period → euro debt
  if (!activePeriod) return { balanceChange: fallbackPrice };

  const r = activePeriod.remainingResources;
  // D9: hours exhausted → euro debt
  if (isExhausted(r.horasAssistenciaAnuais)) return { balanceChange: fallbackPrice };

  // Calculate duration in decimal hours from horasTotais (HH:MM)
  const horasTotais = remoteAssistance.data.horasTotais || '0:00';
  const [h, m] = horasTotais.split(':').map(Number);
  const totalHours = (h || 0) + ((m || 0) / 60);

  if (totalHours <= 0) {
    return { contractUsageChanges: {} };
  }

  return {
    contractUsageChanges: {
      horasAssistenciaAnuais: -totalHours,
    },
  };
}

// ============================================================================
// Utility
// ============================================================================

/**
 * A resource counter is exhausted when it is exactly 0.
 * -1 (unlimited) is never exhausted.
 * Negative values (over-consumed) are treated as exhausted.
 */
function isExhausted(value: number): boolean {
  return value !== -1 && value <= 0;
}

/**
 * Check if a TransactionChanges object contains any meaningful change.
 */
export function hasTransactionChanges(changes: TransactionChanges): boolean {
  if (changes.balanceChange && changes.balanceChange !== 0) return true;
  if (changes.contractUsageChanges) {
    const u = changes.contractUsageChanges;
    if (
      (u.manutencoesPorAno !== undefined && u.manutencoesPorAno !== 0) ||
      (u.deslocacoesPorAno !== undefined && u.deslocacoesPorAno !== 0) ||
      (u.horasAssistenciaAnuais !== undefined && u.horasAssistenciaAnuais !== 0)
    ) {
      return true;
    }
  }
  return false;
}

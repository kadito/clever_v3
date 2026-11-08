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
// Contract Period Window Helper
// ============================================================================

/**
 * A single 1-year contract period window, with a flag for whether it is the
 * currently-active slice (contains `today`) vs. an expired contract's last slice.
 */
export interface PeriodWindow {
  periodStart: string; // ISO date (inclusive)
  periodEnd: string;   // ISO date (exclusive end = start + 1 year)
  /** True when `today` falls inside [periodStart, periodEnd) and within the contract. */
  isActive: boolean;
}

/**
 * Add exactly one year to an ISO date string (YYYY-MM-DD), preserving the day.
 * Feb 29 + 1y lands on Mar 1 of a non-leap year (JS Date overflow) — acceptable.
 */
function addOneYear(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Compute the 1-year period window for a contract section.
 *
 * Rule:
 * - Periods are exactly 1 year, anchored on `inicioContrato`.
 * - The returned window is the yearly slice containing `today`.
 * - **No end date (`fim` empty):** the contract is open-ended and active. The slice
 *   containing today is returned as active, with no upper bound.
 * - **With an end date:** the window is bounded by `fim`. If the contract has expired
 *   (no slice contains today within the contract), the LAST valid slice is returned
 *   with `isActive: false`.
 *
 * Returns null only when `inicio` is missing (cannot anchor the periods).
 *
 * @param inicio  inicioContratoCPA/SH (ISO date) — required
 * @param fim     fimContratoCPA/SH (ISO date) — optional; empty = open-ended
 * @param today   reference date (ISO date), defaults to now
 */
export function computeCurrentPeriodWindow(
  inicio: string,
  fim: string,
  today: string = new Date().toISOString().slice(0, 10)
): PeriodWindow | null {
  // A start date is mandatory to anchor the yearly slices.
  if (!inicio) return null;

  const MAX_SLICES = 100;

  // Open-ended contract (no end date): walk yearly slices from inicio and return
  // the one containing today as active. No upper bound.
  if (!fim) {
    let sliceStart = inicio;
    for (let i = 0; i < MAX_SLICES; i += 1) {
      const sliceEnd = addOneYear(sliceStart);
      if (sliceStart <= today && today < sliceEnd) {
        return { periodStart: sliceStart, periodEnd: sliceEnd, isActive: true };
      }
      // today is before the contract start → first slice, inactive
      if (today < sliceStart) {
        return { periodStart: sliceStart, periodEnd: sliceEnd, isActive: false };
      }
      sliceStart = sliceEnd;
    }
    // Fallback (today absurdly far in the future): last computed slice.
    return { periodStart: sliceStart, periodEnd: addOneYear(sliceStart), isActive: true };
  }

  if (inicio >= fim) {
    // Degenerate range — treat the whole thing as a single inactive slice.
    return { periodStart: inicio, periodEnd: addOneYear(inicio), isActive: false };
  }

  // Bounded contract: walk yearly slices from inicio until a slice starts on/after fim.
  let sliceStart = inicio;
  let lastValidStart = inicio;

  for (let i = 0; i < MAX_SLICES; i += 1) {
    const sliceEnd = addOneYear(sliceStart);

    const containsToday = sliceStart <= today && today < sliceEnd;
    const withinContract = sliceStart < fim;

    if (containsToday && withinContract) {
      // Active slice — cap its end at fim so it never runs past the contract.
      return {
        periodStart: sliceStart,
        periodEnd: sliceEnd > fim ? fim : sliceEnd,
        isActive: true,
      };
    }

    if (withinContract) {
      lastValidStart = sliceStart;
    }

    const nextStart = sliceEnd;
    if (nextStart >= fim) {
      break;
    }
    sliceStart = nextStart;
  }

  // No active slice contained today → contract expired (or today is before inicio).
  const lastEnd = addOneYear(lastValidStart);
  return {
    periodStart: lastValidStart,
    periodEnd: lastEnd > fim ? fim : lastEnd,
    isActive: false,
  };
}

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

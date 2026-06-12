import contractPlansConfig from '../config/contract-plans.json';
import type { ContractPlanConfig, CPAPlan, SHPlan } from '@clever/shared';

export type ContractType = 'CPA' | 'S&H';

const config = contractPlansConfig as unknown as ContractPlanConfig;

/**
 * Gets available plans for a specific contract type
 */
export function getAvailablePlans(contractType: ContractType | ''): CPAPlan[] | SHPlan[] {
  if (!contractType || !config[contractType]) {
    return [];
  }
  return config[contractType].plans;
}

/**
 * Determines if a contract type requires distance selection for pricing.
 * CPA has flat pricing — only S&H requires distance.
 */
export function requiresDistance(contractType: string): boolean {
  return contractType === 'S&H';
}

/**
 * Determines if the price table should be displayed.
 * CPA always shows prices when a plan is selected (flat pricing, no distance needed).
 * S&H requires both a plan and a distance selection.
 */
export function shouldShowPriceTable(
  contractType: string,
  planId: string,
  distance?: string
): boolean {
  if (!planId) return false;
  if (contractType === 'CPA') return true;
  if (contractType === 'S&H') return !!distance;
  return false;
}

/**
 * Gets detailed information for a specific plan
 */
export function getPlanDetails(
  contractType: ContractType | '',
  planId: string
): CPAPlan | SHPlan | null {
  if (!contractType) return null;
  const plans = getAvailablePlans(contractType);
  return plans.find(p => p.id === planId) || null;
}

/**
 * Gets formatted plan options for select dropdowns.
 * CPA returns 3 options, S&H returns 6 options.
 */
export function getPlanOptions(
  contractType: ContractType | ''
): Array<{ value: string; label: string }> {
  const plans = getAvailablePlans(contractType);
  return plans.map(plan => ({ value: plan.id, label: plan.name }));
}

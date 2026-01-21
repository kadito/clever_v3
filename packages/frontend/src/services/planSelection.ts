import contractPlansConfig from '../config/contract-plans.json';
import type { ContractPlan, ContractPlanConfig } from '@clever/shared';

export type ContractType = 'CPA' | 'CPA_1500' | 'S&H';

const config = contractPlansConfig as ContractPlanConfig;

/**
 * Gets available plans for a specific contract type
 */
export function getAvailablePlans(contractType: ContractType | ''): ContractPlan[] {
  if (!contractType || !config[contractType]) {
    return [];
  }
  return config[contractType].plans;
}

/**
 * Determines if a contract type requires distance selection for pricing
 */
export function requiresDistance(contractType: string): boolean {
  return contractType === 'CPA' || contractType === 'S&H';
}

/**
 * Determines if the price table should be displayed
 */
export function shouldShowPriceTable(
  contractType: string,
  planId: string,
  distance?: string
): boolean {
  if (!planId) return false;
  if (contractType === 'CPA_1500') return true;
  return (contractType === 'CPA' || contractType === 'S&H') && !!distance;
}

/**
 * Gets detailed information for a specific plan
 */
export function getPlanDetails(contractType: ContractType, planId: string): ContractPlan | null {
  const plans = getAvailablePlans(contractType);
  return plans.find(p => p.id === planId) || null;
}

/**
 * Gets formatted plan options for select dropdowns
 */
export function getPlanOptions(
  contractType: ContractType | ''
): Array<{ value: string; label: string }> {
  const plans = getAvailablePlans(contractType);
  return plans.map(plan => ({ value: plan.id, label: plan.name }));
}

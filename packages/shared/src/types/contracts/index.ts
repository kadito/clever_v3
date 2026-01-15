/**
 * Contracts Types and Validation
 * 
 * This module provides TypeScript interfaces and validation functions for the contracts content type.
 * Based on analysis of legacy components:
 * - old_src/views/contratos/ContratoDetail.vue
 * - old_src/views/contratos/ContratoForm.vue
 */

// Export all types
export type {
  ContractEquipment,
  ContractData,
  Contract,
  ContractCreationData,
  ContractUpdateData,
  ContractDisplayData,
  ContractSearchFilters,
  ContractPlan,
  ContractPlanConfig
} from './types';

// Export all validation functions
export {
  validateContractEquipment,
  validateContractCreation,
  validateContractUpdate,
  validateContractForDisplay,
  hasActiveContract,
  getContractSummary
} from './validation';

// Content type constant
export const CONTRACTS_CONTENT_TYPE = 'contracts' as const;
/**
 * Work Sheets Types and Validation
 *
 * This module provides TypeScript interfaces and validation functions for the work-sheets content type.
 * Based on analysis of legacy components:
 * - old_src/views/folhas-obra/FolhasObraDetail.vue
 * - old_src/views/folhas-obra/FolhaObraForm.vue
 */

// Export all types
export type {
  WorkSheetRequestData,
  WorkSheetDisplacementData,
  WorkSheetOtherData,
  WorkSheetData,
  WorkSheet,
  WorkSheetCreationData,
  WorkSheetUpdateData,
  WorkSheetDisplayData,
  WorkSheetSearchFilters,
} from './types';

// Export constants
export { WORK_SHEET_CONSTANTS } from './types';

// Export all validation functions
export {
  validateWorkSheetCreation,
  validateWorkSheetUpdate,
  validateWorkSheetForDisplay,
  calculateWorkSheetTotals,
  calculateWorkSheetPricing,
  getWorkSheetSummary,
} from './validation';

// Export pricing interfaces
export type { WorkSheetPricingInput, WorkSheetPricingResult } from './validation';

// Content type constant
export const WORK_SHEETS_CONTENT_TYPE = 'work-sheets' as const;

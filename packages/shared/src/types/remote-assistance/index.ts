/**
 * Remote Assistance Types and Validation
 *
 * This module provides TypeScript interfaces and validation functions for the remote-assistance content type.
 * Based on analysis of legacy components:
 * - old_src/views/assistencias-remotas/AssistenciasRemotasDetail.vue
 * - old_src/views/assistencias-remotas/AssistenciasRemotasForm.vue
 * - old_src/views/assistencias-remotas/AssistenciasRemotasList.vue
 *
 * Requirements: 7.3, 7.4, 7.5
 */

// Export all types
export type {
  RemoteAssistanceData,
  RemoteAssistance,
  RemoteAssistanceCreationData,
  RemoteAssistanceUpdateData,
  RemoteAssistanceDisplayData,
  RemoteAssistanceSearchFilters,
  TimeValidationResult,
  ValueCalculationResult,
  AssistanceType,
  ValidMinute,
} from './types';

// Export constants
export { REMOTE_ASSISTANCE_CONSTANTS } from './types';

// Export all validation functions
export {
  validateAndFormatTime,
  validateTimeSequence,
  calculateTotalHours,
  isBusinessHours,
  calculateAssistanceValue,
  validateRemoteAssistanceCreation,
  validateRemoteAssistanceUpdate,
  validateRemoteAssistanceForDisplay,
  generateAssistanceNumber,
  getYearFromAssistanceDate,
  getRemoteAssistanceSummary,
  hasBillableValue,
  formatTimeForDisplay,
  formatDateForDisplay,
  formatDateTimeForDisplay,
} from './validation';

// Content type constant
export const REMOTE_ASSISTANCE_CONTENT_TYPE = 'remote-assistance' as const;

/**
 * Daily Activity Records Types and Validation
 *
 * This module provides TypeScript interfaces and validation functions for the daily-records content type.
 * Supports date-based activity tracking with time calculations and optional relations to work sheets
 * and remote assistance records.
 */

// Export all types
export type {
  Activity,
  DailyRecordData,
  DailyRecord,
  DailyRecordCreationData,
  DailyRecordUpdateData,
  DailyRecordWithRelations,
  DailyRecordDisplayData,
  DailyRecordSearchFilters,
} from './types';

// Export validation functions
export {
  validateDailyRecordCreation,
  validateDailyRecordUpdate,
  validateActivity,
  calculateActivityTotalHours,
  isValidTimeFormat,
  timeToMinutes,
  minutesToTime,
} from './validation';

// Content type constant
export const DAILY_RECORDS_CONTENT_TYPE = 'daily-records' as const;

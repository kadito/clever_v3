/**
 * Generic content validation utilities for content types with relations
 * 
 * This module provides validation functions for content types that have relation fields
 * but don't have their own specific validation modules yet.
 * 
 * Requirements: 1.1, 1.3, 1.4, 1.5
 */

import { validateRelationFields, sanitizeRelationFields } from './relation-validation.js';

/**
 * Generic validation for content creation
 * Validates relation fields without checking referential integrity
 * 
 * @param contentType The type of content being validated
 * @param data The content data to validate
 * @returns Array of validation error messages in Portuguese
 */
export function validateGenericContentCreation(contentType: string, data: Record<string, any>): string[] {
  const errors: string[] = [];

  // Validate relation fields without checking referential integrity
  // This allows content creation with any relation ID values, including non-existent references
  // Requirements: 1.1, 1.3 - Allow creation without validating referenced content exists
  const relationErrors = validateRelationFields(contentType, data);
  errors.push(...relationErrors);

  // Add any content-type specific validation here in the future
  // For now, we only validate relation fields

  return errors;
}

/**
 * Generic validation for content updates
 * Validates relation fields without checking referential integrity
 * 
 * @param contentType The type of content being validated
 * @param data The content data to validate
 * @returns Array of validation error messages in Portuguese
 */
export function validateGenericContentUpdate(contentType: string, data: Record<string, any>): string[] {
  const errors: string[] = [];

  // Validate relation fields without checking referential integrity
  // This allows content updates with any relation ID values, including non-existent references
  // Requirements: 1.1, 1.3 - Allow updates without validating referenced content exists
  const relationErrors = validateRelationFields(contentType, data);
  errors.push(...relationErrors);

  // Add any content-type specific validation here in the future
  // For now, we only validate relation fields

  return errors;
}

/**
 * Generic sanitization for content data
 * Sanitizes relation fields and basic string fields
 * 
 * @param contentType The type of content being sanitized
 * @param data The content data to sanitize
 * @returns Sanitized content data
 */
export function sanitizeGenericContentData(contentType: string, data: Record<string, any>): Record<string, any> {
  // First sanitize relation fields using the centralized utility
  // Requirements: 1.4 - Allow null/empty relation IDs for optional relationships
  const sanitizedRelations = sanitizeRelationFields(contentType, data);

  // Basic string field sanitization
  const sanitizedData: Record<string, any> = { ...sanitizedRelations };

  // Trim all string fields
  for (const [key, value] of Object.entries(sanitizedData)) {
    if (typeof value === 'string') {
      sanitizedData[key] = value.trim() || undefined;
    }
  }

  return sanitizedData;
}

/**
 * Validation functions for specific content types with relations
 */

// Contracts validation
export function validateContractCreation(data: Record<string, any>): string[] {
  return validateGenericContentCreation('contracts', data);
}

export function validateContractUpdate(data: Record<string, any>): string[] {
  return validateGenericContentUpdate('contracts', data);
}

export function sanitizeContractData(data: Record<string, any>): Record<string, any> {
  return sanitizeGenericContentData('contracts', data);
}

// Work Sheets validation
export function validateWorkSheetCreation(data: Record<string, any>): string[] {
  return validateGenericContentCreation('work-sheets', data);
}

export function validateWorkSheetUpdate(data: Record<string, any>): string[] {
  return validateGenericContentUpdate('work-sheets', data);
}

export function sanitizeWorkSheetData(data: Record<string, any>): Record<string, any> {
  return sanitizeGenericContentData('work-sheets', data);
}

// Remote Assistance validation
export function validateRemoteAssistanceCreation(data: Record<string, any>): string[] {
  return validateGenericContentCreation('remote-assistance', data);
}

export function validateRemoteAssistanceUpdate(data: Record<string, any>): string[] {
  return validateGenericContentUpdate('remote-assistance', data);
}

export function sanitizeRemoteAssistanceData(data: Record<string, any>): Record<string, any> {
  return sanitizeGenericContentData('remote-assistance', data);
}

// Daily Records validation
export function validateDailyRecordCreation(data: Record<string, any>): string[] {
  return validateGenericContentCreation('daily-records', data);
}

export function validateDailyRecordUpdate(data: Record<string, any>): string[] {
  return validateGenericContentUpdate('daily-records', data);
}

export function sanitizeDailyRecordData(data: Record<string, any>): Record<string, any> {
  return sanitizeGenericContentData('daily-records', data);
}

// Content types without relations (for completeness)
export function validateReminderCreation(data: Record<string, any>): string[] {
  return validateGenericContentCreation('reminders', data);
}

export function validateReminderUpdate(data: Record<string, any>): string[] {
  return validateGenericContentUpdate('reminders', data);
}

export function sanitizeReminderData(data: Record<string, any>): Record<string, any> {
  return sanitizeGenericContentData('reminders', data);
}

export function validatePendingCreation(data: Record<string, any>): string[] {
  return validateGenericContentCreation('pending', data);
}

export function validatePendingUpdate(data: Record<string, any>): string[] {
  return validateGenericContentUpdate('pending', data);
}

export function sanitizePendingData(data: Record<string, any>): Record<string, any> {
  return sanitizeGenericContentData('pending', data);
}
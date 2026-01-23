/**
 * Relation validation utilities for content operations
 *
 * This module implements the relation validation strategy for the content relations system.
 * Key principles:
 * - Relation IDs can be stored without validating referenced content exists
 * - Null/empty relation IDs are allowed for optional relationships
 * - Validation happens at display-time, not storage-time
 * - Audit trail is maintained for all relation changes
 * - Backward compatibility is preserved with existing content
 *
 * Requirements: 1.1, 1.3, 1.4, 1.5
 */

import type { BaseContent } from './types.js';

/**
 * Relation field configuration for different content types
 * Maps content types to their relation fields and validation rules
 */
export interface RelationFieldConfig {
  /** The field name that stores the relation ID (e.g., 'clientId') */
  fieldName: string;
  /** The target content type this relation points to */
  targetType: string;
  /** Whether this relation is required or optional */
  required: boolean;
  /** Display name for error messages */
  displayName: string;
}

/**
 * Content type relation configurations
 * Defines which fields are relation IDs for each content type
 */
export const CONTENT_RELATION_CONFIGS: Record<string, RelationFieldConfig[]> = {
  licenses: [
    {
      fieldName: 'clientId',
      targetType: 'clients',
      required: false, // Optional - licenses can exist without client reference
      displayName: 'Cliente',
    },
  ],
  contracts: [
    {
      fieldName: 'clientId',
      targetType: 'clients',
      required: false, // Optional - contracts can exist without client reference
      displayName: 'Cliente',
    },
  ],
  'work-sheets': [
    {
      fieldName: 'clientId',
      targetType: 'clients',
      required: false, // Optional - work sheets can exist without client reference
      displayName: 'Cliente',
    },
    {
      fieldName: 'contractId',
      targetType: 'contracts',
      required: false, // Optional - only required when payment method is "CONTRATO"
      displayName: 'Contrato',
    },
  ],
  'remote-assistance': [
    {
      fieldName: 'clientId',
      targetType: 'clients',
      required: false, // Optional - remote assistance can exist without client reference
      displayName: 'Cliente',
    },
    {
      fieldName: 'contractId',
      targetType: 'contracts',
      required: false, // Optional - only required when paymentMethod is "Contrato"
      displayName: 'Contrato',
    },
  ],
  'daily-records': [
    {
      fieldName: 'clientId',
      targetType: 'clients',
      required: false, // Optional - daily records can exist without client reference
      displayName: 'Cliente',
    },
  ],
  // Clients don't have relations to other content types currently
  clients: [],
  // Other content types don't have relations currently
  reminders: [],
  pending: [],
};

/**
 * Validates relation fields in content data without checking referential integrity
 *
 * This function validates the format and presence of relation IDs but does NOT
 * validate that the referenced content actually exists. This is by design:
 * - Allows content creation without requiring referenced content to exist first
 * - Enables bulk imports and migrations
 * - Supports eventual consistency patterns
 * - Relation resolution happens at display-time, not storage-time
 *
 * Requirements: 1.1, 1.3 - Allow creation without validating referenced content exists
 *
 * @param contentType The type of content being validated
 * @param data The content data containing potential relation fields
 * @returns Array of validation error messages in Portuguese
 */
export function validateRelationFields(contentType: string, data: Record<string, any>): string[] {
  const errors: string[] = [];
  const relationConfigs = CONTENT_RELATION_CONFIGS[contentType] || [];

  for (const config of relationConfigs) {
    const relationValue = data[config.fieldName];

    // Check if required relation is missing
    if (config.required && (!relationValue || !relationValue.toString().trim())) {
      errors.push(`${config.displayName} é obrigatório`);
      continue;
    }

    // If relation value is provided, validate format (UUID)
    if (relationValue && relationValue.toString().trim()) {
      const relationId = relationValue.toString().trim();

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(relationId)) {
        errors.push(`${config.displayName} deve ter um formato válido de identificador`);
      }
    }

    // Note: We explicitly DO NOT validate that the referenced content exists
    // This allows for:
    // - Content creation before referenced content exists
    // - Bulk imports and data migrations
    // - Eventual consistency patterns
    // - Relation resolution at display-time rather than storage-time
  }

  return errors;
}

/**
 * Sanitizes relation fields in content data
 *
 * Cleans up relation ID values by trimming whitespace and normalizing format
 * Allows null/empty values for optional relationships
 *
 * Requirements: 1.4 - Allow null/empty relation IDs for optional relationships
 *
 * @param contentType The type of content being sanitized
 * @param data The content data containing potential relation fields
 * @returns Sanitized data with cleaned relation fields
 */
export function sanitizeRelationFields(
  contentType: string,
  data: Record<string, any>
): Record<string, any> {
  const sanitizedData = { ...data };
  const relationConfigs = CONTENT_RELATION_CONFIGS[contentType] || [];

  for (const config of relationConfigs) {
    const relationValue = sanitizedData[config.fieldName];

    if (relationValue !== undefined) {
      // Convert to string and trim
      const trimmedValue = relationValue?.toString().trim();

      // Set to undefined if empty (allows null/empty for optional relationships)
      sanitizedData[config.fieldName] = trimmedValue || undefined;
    }
  }

  return sanitizedData;
}

/**
 * Extracts relation changes for audit trail
 *
 * Compares old and new content data to identify relation field changes
 * Used for maintaining audit trail of relation modifications
 *
 * Requirements: 1.5 - Maintain audit trail for relation changes
 *
 * @param contentType The type of content being updated
 * @param oldData The previous content data
 * @param newData The new content data
 * @returns Object describing relation changes
 */
export function extractRelationChanges(
  contentType: string,
  oldData: Record<string, any>,
  newData: Record<string, any>
): Record<string, { from: string | undefined; to: string | undefined }> {
  const changes: Record<string, { from: string | undefined; to: string | undefined }> = {};
  const relationConfigs = CONTENT_RELATION_CONFIGS[contentType] || [];

  for (const config of relationConfigs) {
    const oldValue = oldData[config.fieldName];
    const newValue = newData[config.fieldName];

    // Normalize values for comparison
    const oldNormalized = oldValue?.toString().trim() || undefined;
    const newNormalized = newValue?.toString().trim() || undefined;

    // Record change if values are different
    if (oldNormalized !== newNormalized) {
      changes[config.fieldName] = {
        from: oldNormalized,
        to: newNormalized,
      };
    }
  }

  return changes;
}

/**
 * Checks if content data contains any relation fields
 *
 * @param contentType The type of content to check
 * @param data The content data to examine
 * @returns True if the content has any relation fields defined
 */
export function hasRelationFields(contentType: string, data: Record<string, any>): boolean {
  const relationConfigs = CONTENT_RELATION_CONFIGS[contentType] || [];

  return relationConfigs.some(
    config =>
      data[config.fieldName] !== undefined &&
      data[config.fieldName] !== null &&
      data[config.fieldName].toString().trim() !== ''
  );
}

/**
 * Gets all relation field names for a content type
 *
 * @param contentType The content type to get relation fields for
 * @returns Array of relation field names
 */
export function getRelationFieldNames(contentType: string): string[] {
  const relationConfigs = CONTENT_RELATION_CONFIGS[contentType] || [];
  return relationConfigs.map(config => config.fieldName);
}

/**
 * Validates backward compatibility with existing content
 *
 * Ensures that existing content with relation fields continues to work
 * even if the relation validation rules change
 *
 * Requirements: 1.6 - Ensure backward compatibility with existing content
 *
 * @param contentType The type of content being validated
 * @param data The content data to validate
 * @param isExistingContent Whether this is existing content (vs new content)
 * @returns Array of validation error messages in Portuguese
 */
export function validateBackwardCompatibility(
  contentType: string,
  data: Record<string, any>,
  isExistingContent: boolean = false
): string[] {
  // For existing content, we're more lenient with validation
  if (isExistingContent) {
    // Only validate format, not presence of required fields
    // This ensures existing content continues to work
    const errors: string[] = [];
    const relationConfigs = CONTENT_RELATION_CONFIGS[contentType] || [];

    for (const config of relationConfigs) {
      const relationValue = data[config.fieldName];

      // Only validate format if value is provided
      if (relationValue && relationValue.toString().trim()) {
        const relationId = relationValue.toString().trim();

        // Validate UUID format
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(relationId)) {
          errors.push(`${config.displayName} tem formato inválido de identificador`);
        }
      }
    }

    return errors;
  }

  // For new content, use standard validation
  return validateRelationFields(contentType, data);
}

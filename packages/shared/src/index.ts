// Shared types and utilities for CLEVER dashboard
// This file will be populated in subsequent tasks

export * from './types';
export * from './utils';
export * from './user-type-utils';
export * from './storage';
export * from './relation-type-guards';
export * from './permissions';
export * from './balance-types';
export * from './balance-utils';
export * from './balance-extraction';
export * from './file-validation';

// Content type exports
export * from './types/clients';
export * from './types/contracts';
export * from './types/licenses';
export * from './types/work-sheets';
export * from './types/remote-assistance';
export * from './types/daily-records';
export * from './types/installations-programming';

// Re-export specific utilities for convenience
export { resolveContentRelations, type ContentFetcher } from './utils';

// Re-export relation system utilities for explicit access
export {
  detectRelationFields,
  getContentTypeFromRelation,
  extractBasicFields,
  RELATION_TYPE_MAPPING,
  BASIC_FIELD_DEFINITIONS,
  COMMON_FALLBACK_FIELDS,
} from './utils';

// Re-export relation validation utilities for explicit access
export {
  validateRelationFields,
  sanitizeRelationFields,
  extractRelationChanges,
  hasRelationFields,
  getRelationFieldNames,
  validateBackwardCompatibility,
  CONTENT_RELATION_CONFIGS,
  type RelationFieldConfig,
} from './relation-validation';

// Re-export relation type guards for type safety
export {
  isRelationError,
  isResolvedRelation,
  getResolvedRelation,
  getRelationError,
  hasResolvedRelations,
  hasRelationErrors,
  getResolvedRelations,
  getRelationErrors,
  getRelationSummary,
} from './relation-type-guards';

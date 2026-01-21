/**
 * Type guards and utility functions for relation system type safety
 *
 * These utilities help frontend and backend code safely work with relation results
 * by providing type-safe ways to check if relations are resolved or contain errors.
 *
 * Requirements: 7.3, 7.4, 8.1 - Ensure type safety across frontend and backend
 */

import type {
  RelationResult,
  ResolvedRelation,
  RelationError,
  ContentWithRelations,
} from './types.js';

/**
 * Type guard to check if a relation result is an error
 *
 * @param relation - The relation result to check
 * @returns True if the relation is an error, false if it's resolved data
 *
 * @example
 * ```typescript
 * if (isRelationError(license.relations.client)) {
 *   console.error('Client error:', license.relations.client.message);
 * } else {
 *   console.log('Client name:', license.relations.client.nomeEmpresa);
 * }
 * ```
 */
export function isRelationError(relation: RelationResult): relation is RelationError {
  return (
    typeof relation === 'object' &&
    relation !== null &&
    'type' in relation &&
    relation.type === 'error'
  );
}

/**
 * Type guard to check if a relation result is successfully resolved
 *
 * @param relation - The relation result to check
 * @returns True if the relation is resolved data, false if it's an error
 *
 * @example
 * ```typescript
 * if (isResolvedRelation(license.relations.client)) {
 *   console.log('Client UUID:', license.relations.client.uuid);
 *   console.log('Client name:', license.relations.client.nomeEmpresa);
 * }
 * ```
 */
export function isResolvedRelation(relation: RelationResult): relation is ResolvedRelation {
  return (
    typeof relation === 'object' &&
    relation !== null &&
    'uuid' in relation &&
    'contentType' in relation
  );
}

/**
 * Safely gets a resolved relation or returns null if it's an error
 *
 * @param relation - The relation result to extract
 * @returns The resolved relation data or null if it's an error
 *
 * @example
 * ```typescript
 * const client = getResolvedRelation(license.relations.client);
 * if (client) {
 *   console.log('Client name:', client.nomeEmpresa);
 * }
 * ```
 */
export function getResolvedRelation(relation: RelationResult | undefined): ResolvedRelation | null {
  if (!relation || isRelationError(relation)) {
    return null;
  }
  return relation;
}

/**
 * Safely gets a relation error or returns null if it's resolved data
 *
 * @param relation - The relation result to extract
 * @returns The relation error or null if it's resolved data
 *
 * @example
 * ```typescript
 * const error = getRelationError(license.relations.client);
 * if (error) {
 *   console.error('Client error:', error.message, 'Code:', error.code);
 * }
 * ```
 */
export function getRelationError(relation: RelationResult | undefined): RelationError | null {
  if (!relation || !isRelationError(relation)) {
    return null;
  }
  return relation;
}

/**
 * Checks if content has any resolved relations (non-error relations)
 *
 * @param content - The content with relations to check
 * @returns True if the content has at least one successfully resolved relation
 *
 * @example
 * ```typescript
 * if (hasResolvedRelations(license)) {
 *   console.log('License has resolved relations');
 * }
 * ```
 */
export function hasResolvedRelations<T extends Record<string, any>>(
  content: ContentWithRelations<T>
): boolean {
  return Object.values(content.relations).some(relation => isResolvedRelation(relation));
}

/**
 * Checks if content has any relation errors
 *
 * @param content - The content with relations to check
 * @returns True if the content has at least one relation error
 *
 * @example
 * ```typescript
 * if (hasRelationErrors(license)) {
 *   console.warn('License has relation errors');
 * }
 * ```
 */
export function hasRelationErrors<T extends Record<string, any>>(
  content: ContentWithRelations<T>
): boolean {
  return Object.values(content.relations).some(relation => isRelationError(relation));
}

/**
 * Gets all resolved relations from content, filtering out errors
 *
 * @param content - The content with relations to extract from
 * @returns Object containing only successfully resolved relations
 *
 * @example
 * ```typescript
 * const resolvedRelations = getResolvedRelations(license);
 * Object.entries(resolvedRelations).forEach(([key, relation]) => {
 *   console.log(`${key}:`, relation.uuid);
 * });
 * ```
 */
export function getResolvedRelations<T extends Record<string, any>>(
  content: ContentWithRelations<T>
): Record<string, ResolvedRelation> {
  const resolved: Record<string, ResolvedRelation> = {};

  Object.entries(content.relations).forEach(([key, relation]) => {
    if (isResolvedRelation(relation)) {
      resolved[key] = relation;
    }
  });

  return resolved;
}

/**
 * Gets all relation errors from content, filtering out resolved relations
 *
 * @param content - The content with relations to extract from
 * @returns Object containing only relation errors
 *
 * @example
 * ```typescript
 * const relationErrors = getRelationErrors(license);
 * Object.entries(relationErrors).forEach(([key, error]) => {
 *   console.error(`${key} error:`, error.message);
 * });
 * ```
 */
export function getRelationErrors<T extends Record<string, any>>(
  content: ContentWithRelations<T>
): Record<string, RelationError> {
  const errors: Record<string, RelationError> = {};

  Object.entries(content.relations).forEach(([key, relation]) => {
    if (isRelationError(relation)) {
      errors[key] = relation;
    }
  });

  return errors;
}

/**
 * Creates a summary of relation status for debugging or logging
 *
 * @param content - The content with relations to summarize
 * @returns Summary object with counts and details
 *
 * @example
 * ```typescript
 * const summary = getRelationSummary(license);
 * console.log(`Relations: ${summary.resolved} resolved, ${summary.errors} errors`);
 * ```
 */
export function getRelationSummary<T extends Record<string, any>>(
  content: ContentWithRelations<T>
): {
  total: number;
  resolved: number;
  errors: number;
  errorCodes: Record<number, number>;
} {
  const summary = {
    total: 0,
    resolved: 0,
    errors: 0,
    errorCodes: {} as Record<number, number>,
  };

  Object.values(content.relations).forEach(relation => {
    summary.total++;

    if (isRelationError(relation)) {
      summary.errors++;
      summary.errorCodes[relation.code] = (summary.errorCodes[relation.code] || 0) + 1;
    } else {
      summary.resolved++;
    }
  });

  return summary;
}

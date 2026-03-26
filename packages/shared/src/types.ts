// Type definitions will be added in subsequent tasks
export interface BaseContent {
  uuid: string;
  contentType: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  data: Record<string, any>;
}

// Authentication types
/**
 * User context interface containing authenticated user information
 * Requirements: 3.2, 3.4
 */
export interface UserContext {
  /** Unique user identifier from Clerk */
  userId: string;
  /** User's primary email address */
  email: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** User type from Clerk metadata */
  userType: 'Admin' | 'User';
  /** Session identifier */
  sessionId: string;
  /** Authentication status */
  isAuthenticated: boolean;
}

/**
 * Extended context with user information for authenticated requests
 */
export interface AuthenticatedContext {
  user: UserContext;
  [key: string]: any; // Index signature for framework compatibility
}

/**
 * User type enumeration for type safety
 * Requirements: 2.1, 2.2
 */
export type UserType = 'Admin' | 'User';

/**
 * User type display names in Portuguese
 * Requirements: 2.4
 */
export const USER_TYPE_DISPLAY_NAMES: Record<UserType, string> = {
  Admin: 'Administrador',
  User: 'Utilizador',
} as const;

/**
 * Technician User Interface
 * Represents a technician user with complete user information for automatic assignment
 * Requirements: 1.1, 1.2, 1.3
 */
export interface TechnicianUser {
  /** Unique user identifier from Clerk */
  userId: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** User type from Clerk metadata */
  userType: 'Admin' | 'User';
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ListResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface SearchResponse<T> extends ApiResponse<T[]> {
  query: string;
  count: number;
}

// Content type definitions
export type ContentType =
  | 'clients'
  | 'contracts'
  | 'licenses'
  | 'work-sheets'
  | 'daily-records'
  | 'remote-assistance'
  | 'reminders'
  | 'pending'
  | 'installations-programming';

// Request types
export type CreateContentRequest<T extends BaseContent> = Omit<
  T,
  'uuid' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'version' | 'isDeleted'
>;

export type UpdateContentRequest<T extends BaseContent> = Partial<Pick<T, 'data'>>;

// Relation system types
/**
 * Represents successfully resolved relation data
 * Contains the UUID, content type, and basic fields from the related content
 *
 * Requirements: 2.5, 7.3, 7.4, 8.1
 */
export interface ResolvedRelation {
  /** UUID of the related content item */
  uuid: string;
  /** Content type of the related content */
  contentType: string;
  /** Basic data fields from the related content (varies by content type) */
  [key: string]: any; // Basic data fields
}

/**
 * Represents a relation resolution error
 * Used when referenced content cannot be found or accessed
 *
 * Requirements: 2.5, 8.1, 8.2
 */
export interface RelationError {
  /** Always 'error' to distinguish from resolved relations */
  type: 'error';
  /** HTTP-style error code (404 for not found, 500 for server error) */
  code: 404 | 500;
  /** Human-readable error message */
  message: string;
}

/**
 * Union type representing either a successfully resolved relation or an error
 * Used in the relations field of ContentWithRelations
 *
 * Requirements: 2.5, 8.1, 8.2
 */
export type RelationResult = ResolvedRelation | RelationError;

/**
 * Enhanced content interface that includes resolved relations
 * All API responses use this structure to provide relation data alongside content
 *
 * Requirements: 2.1, 2.2, 2.3, 2.5, 7.3, 7.4
 */
export interface ContentWithRelations<T extends Record<string, any> = any> extends BaseContent {
  /** The content-specific data */
  data: T;
  /**
   * Resolved relations keyed by relation name (e.g., 'client' for clientId)
   * Each relation is either successfully resolved data or an error object
   */
  relations: Record<string, RelationResult>;
}

// Re-export relation validation utilities
export {
  validateRelationFields,
  sanitizeRelationFields,
  extractRelationChanges,
  hasRelationFields,
  getRelationFieldNames,
  validateBackwardCompatibility,
  CONTENT_RELATION_CONFIGS,
  type RelationFieldConfig,
} from './relation-validation.js';

// Re-export content type modules
export * from './types/clients';
export * from './types/licenses';
export * from './types/contracts';
export * from './types/work-sheets';
export * from './types/remote-assistance';
export * from './types/daily-records';
export * from './types/installations-programming';

// Validation functions are now exported from their specific modules
// e.g., from './types/clients/validation', './types/contracts/validation', etc.

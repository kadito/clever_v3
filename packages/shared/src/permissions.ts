/**
 * User Permissions System
 * 
 * Provides role-based access control (RBAC) for the CLEVER dashboard.
 * Supports two user roles: Admin (full access) and User/Employee (restricted access).
 */

import type { UserType } from './types';

export interface Permissions {
  canDelete: boolean;
  canViewAuditTrail: boolean;
}

/**
 * Check if user type is Admin
 */
export function isAdmin(userType: UserType | null | undefined): boolean {
  return userType === 'Admin';
}

/**
 * Check if user can delete content
 * Only Admins can delete content
 */
export function canDelete(userType: UserType | null | undefined): boolean {
  return isAdmin(userType);
}

/**
 * Check if user can view audit trail
 * Only Admins can view audit trail
 */
export function canViewAuditTrail(userType: UserType | null | undefined): boolean {
  return isAdmin(userType);
}

/**
 * Get all permissions for a user type
 * Returns an object with all permission flags
 */
export function getPermissions(userType: UserType | null | undefined): Permissions {
  const admin = isAdmin(userType);
  
  return {
    canDelete: admin,
    canViewAuditTrail: admin,
  };
}

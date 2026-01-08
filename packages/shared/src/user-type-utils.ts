import type { UserType } from './types';
import { USER_TYPE_DISPLAY_NAMES } from './types';

/**
 * Utility functions for user type management
 * Requirements: 2.1, 2.2, 2.4
 */

/**
 * Get display name for user type in Portuguese
 * Requirements: 2.4
 */
export function getUserTypeDisplayName(userType: UserType): string {
  return USER_TYPE_DISPLAY_NAMES[userType];
}

/**
 * Check if user type is admin
 * Requirements: 2.1, 2.2
 */
export function isAdminUserType(userType: UserType): boolean {
  return userType === 'Admin';
}

/**
 * Check if user type is regular user
 * Requirements: 2.1, 2.2
 */
export function isRegularUserType(userType: UserType): boolean {
  return userType === 'User';
}

/**
 * Get all available user types
 * Requirements: 2.1, 2.2
 */
export function getAllUserTypes(): UserType[] {
  return ['Admin', 'User'];
}

/**
 * Get user type options for forms/dropdowns
 * Requirements: 2.1, 2.2, 2.4
 */
export function getUserTypeOptions(): Array<{ value: UserType; label: string }> {
  return getAllUserTypes().map(type => ({
    value: type,
    label: getUserTypeDisplayName(type),
  }));
}
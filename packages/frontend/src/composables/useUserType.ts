import { computed } from 'vue';
import { useAuth } from './useAuth';
import type { UserType } from '@clever/shared';
import { USER_TYPE_DISPLAY_NAMES } from '@clever/shared';

/**
 * Composable for user type management and access control
 * Requirements: 2.1, 2.2, 2.4
 */
export function useUserType() {
  const { user } = useAuth();

  // Get current user type
  const userType = computed(() => user.value?.userType || null);

  // Check if user is admin
  const isAdmin = computed(() => user.value?.userType === 'Admin');

  // Check if user is regular user
  const isUser = computed(() => user.value?.userType === 'User');

  // Check if user has specific type
  const hasUserType = (requiredType: UserType): boolean => {
    return user.value?.userType === requiredType || false;
  };

  // Get user type display name in Portuguese
  const userTypeDisplayName = computed(() => {
    const type = user.value?.userType;
    return type ? USER_TYPE_DISPLAY_NAMES[type] : '';
  });

  // Check if user can access admin features
  const canAccessAdminFeatures = computed(() => isAdmin.value);

  return {
    // User type information
    userType,
    userTypeDisplayName,
    
    // Type checking functions
    isAdmin,
    isUser,
    hasUserType,
    
    // Access control
    canAccessAdminFeatures,
  };
}
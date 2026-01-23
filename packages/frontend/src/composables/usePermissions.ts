import { computed } from 'vue';
import { useAuth } from './useAuth';
import { getPermissions } from '@clever/shared';
import type { UserType, Permissions } from '@clever/shared';

/**
 * Composable for reactive permission checking
 * Provides Vue-integrated access to user permissions based on authentication state
 */
export function usePermissions() {
  const { user, isAuthenticated } = useAuth();
  
  // Extract userType from authenticated user
  const userType = computed<UserType | null | undefined>(() => {
    try {
      if (!isAuthenticated.value || !user.value) {
        return null;
      }
      return user.value.userType || null;
    } catch (error) {
      console.error('Error getting user type:', JSON.stringify(error, null, 2));
      return null; // Fail closed
    }
  });
  
  // Compute all permissions using shared utility
  const permissions = computed<Permissions>(() => {
    try {
      return getPermissions(userType.value);
    } catch (error) {
      console.error('Error computing permissions:', JSON.stringify(error, null, 2));
      // Fail closed - deny all permissions
      return {
        canDelete: false,
        canViewAuditTrail: false,
      };
    }
  });
  
  return {
    userType,
    permissions,
    isAuthenticated,
  };
}

import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { Clerk } from '@clerk/clerk-js';

// Global Clerk instance (set in main.ts)
declare global {
  interface Window {
    Clerk?: Clerk;
  }
}

/**
 * Authentication composable that provides authentication state management
 * using Clerk and shared UserContext types
 * Requirements: 4.2, 4.3
 */
export function useAuth() {
  // Pinia store
  const authStore = useAuthStore();

  // Sign out function that clears state
  const handleSignOut = async () => {
    try {
      if (window.Clerk) {
        await window.Clerk.signOut();
      }
      authStore.clearAuthState();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return {
    // Authentication state from store
    isLoaded: computed(() => authStore.isLoaded),
    isSignedIn: computed(() => authStore.isSignedIn),
    user: computed(() => authStore.user),
    
    // Authentication actions
    signOut: handleSignOut,
    
    // Computed helpers from store
    isAuthenticated: computed(() => authStore.isAuthenticated),
    userType: computed(() => authStore.userType),
    userName: computed(() => authStore.userName),
  };
}
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserContext } from '@clever/shared';

/**
 * Authentication store for managing user authentication state
 * Requirements: 4.2, 4.3
 */
export const useAuthStore = defineStore('auth', () => {
  // State
  const isLoaded = ref(true); // Initialize as loaded for better UX
  const isSignedIn = ref(false);
  const user = ref<UserContext | null>(null);

  // Getters
  const isAuthenticated = computed(() => isSignedIn.value && user.value?.isAuthenticated === true);
  const userType = computed(() => user.value?.userType || null);
  const userName = computed(() => {
    if (!user.value) return '';
    return `${user.value.firstName} ${user.value.lastName}`.trim() || user.value.email;
  });

  // Actions
  function setAuthState(loaded: boolean, signedIn: boolean, userContext: UserContext | null) {
    isLoaded.value = loaded;
    isSignedIn.value = signedIn;
    user.value = userContext;
  }

  function clearAuthState() {
    isLoaded.value = true; // Keep loaded as true after clearing
    isSignedIn.value = false;
    user.value = null;
  }

  function updateUser(userContext: UserContext) {
    user.value = userContext;
    isSignedIn.value = true;
  }

  return {
    // State
    isLoaded,
    isSignedIn,
    user,

    // Getters
    isAuthenticated,
    userType,
    userName,

    // Actions
    setAuthState,
    clearAuthState,
    updateUser,
  };
});

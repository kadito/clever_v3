import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useAuth } from './useAuth';
import { createPinia, setActivePinia } from 'pinia';

// Mock Clerk Vue
vi.mock('@clerk/vue', () => ({
  useAuth: vi.fn(() => ({
    isLoaded: ref(true),
    isSignedIn: ref(false),
    signOut: vi.fn(),
  })),
  useUser: vi.fn(() => ({
    user: ref(null),
  })),
}));

describe('useAuth', () => {
  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia());
  });

  it('should initialize with default state', () => {
    const auth = useAuth();
    
    expect(auth.isLoaded.value).toBe(true);
    expect(auth.isSignedIn.value).toBe(false);
    expect(auth.user.value).toBe(null);
    expect(auth.isAuthenticated.value).toBe(false);
    expect(auth.userType.value).toBe(null);
    expect(auth.userName.value).toBe('');
  });

  it('should provide sign out functionality', () => {
    const auth = useAuth();
    
    expect(typeof auth.signOut).toBe('function');
  });
});
import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from './auth';
import type { UserContext } from '@clever/shared';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia());
  });

  it('should initialize with default state', () => {
    const store = useAuthStore();
    
    expect(store.isLoaded).toBe(true); // Changed to true for better UX
    expect(store.isSignedIn).toBe(false);
    expect(store.user).toBe(null);
    expect(store.isAuthenticated).toBe(false);
    expect(store.userType).toBe(null);
    expect(store.userName).toBe('');
  });

  it('should update auth state correctly', () => {
    const store = useAuthStore();
    const mockUser: UserContext = {
      userId: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      userType: 'Admin',
      sessionId: 'test-session',
      isAuthenticated: true,
    };

    store.setAuthState(true, true, mockUser);

    expect(store.isLoaded).toBe(true);
    expect(store.isSignedIn).toBe(true);
    expect(store.user).toEqual(mockUser);
    expect(store.isAuthenticated).toBe(true);
    expect(store.userType).toBe('Admin');
    expect(store.userName).toBe('Test User');
  });

  it('should clear auth state correctly', () => {
    const store = useAuthStore();
    const mockUser: UserContext = {
      userId: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      userType: 'User',
      sessionId: 'test-session',
      isAuthenticated: true,
    };

    // Set initial state
    store.setAuthState(true, true, mockUser);
    expect(store.isAuthenticated).toBe(true);

    // Clear state
    store.clearAuthState();
    
    expect(store.isLoaded).toBe(true); // Should remain true
    expect(store.isSignedIn).toBe(false);
    expect(store.user).toBe(null);
    expect(store.isAuthenticated).toBe(false);
    expect(store.userType).toBe(null);
    expect(store.userName).toBe('');
  });

  it('should handle user with only email', () => {
    const store = useAuthStore();
    const mockUser: UserContext = {
      userId: 'test-user-id',
      email: 'test@example.com',
      firstName: '',
      lastName: '',
      userType: 'User',
      sessionId: 'test-session',
      isAuthenticated: true,
    };

    store.setAuthState(true, true, mockUser);

    expect(store.userName).toBe('test@example.com');
  });
});
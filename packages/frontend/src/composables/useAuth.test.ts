import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

// Mock window.Clerk
Object.defineProperty(window, 'Clerk', {
  value: {
    signOut: vi.fn(),
  },
  writable: true,
});

describe('useAuth', () => {
  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should initialize with default state', async () => {
    // Import after setting up Pinia
    const { useAuth } = await import('./useAuth');
    const auth = useAuth();

    expect(auth.isLoaded.value).toBe(true);
    expect(auth.isSignedIn.value).toBe(false);
    expect(auth.user.value).toBe(null);
    expect(auth.isAuthenticated.value).toBe(false);
    expect(auth.userType.value).toBe(null);
    expect(auth.userName.value).toBe('');
  });

  it('should provide sign out functionality', async () => {
    // Import after setting up Pinia
    const { useAuth } = await import('./useAuth');
    const auth = useAuth();

    expect(typeof auth.signOut).toBe('function');

    // Test sign out functionality
    await auth.signOut();
    expect(window.Clerk.signOut).toHaveBeenCalled();
  });
});

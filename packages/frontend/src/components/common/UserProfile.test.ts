import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import type { UserContext } from '@clever/shared';
import UserProfile from './UserProfile.vue';

// Mock the auth composable
const mockSignOut = vi.fn();
vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    signOut: mockSignOut,
  }),
}));

// Mock the useUserType composable
const mockUserTypeDisplayName = vi.fn();
const mockUserType = vi.fn();
const mockIsAdmin = vi.fn();
const mockIsUser = vi.fn();
const mockHasUserType = vi.fn();
const mockCanAccessAdminFeatures = vi.fn();

vi.mock('@/composables/useUserType', () => ({
  useUserType: () => ({
    userTypeDisplayName: { value: mockUserTypeDisplayName() },
    userType: { value: mockUserType() },
    isAdmin: { value: mockIsAdmin() },
    isUser: { value: mockIsUser() },
    hasUserType: mockHasUserType,
    canAccessAdminFeatures: { value: mockCanAccessAdminFeatures() },
  }),
}));

describe('UserProfile', () => {
  const mockUser: UserContext = {
    userId: '123',
    email: 'test@example.com',
    firstName: 'João',
    lastName: 'Silva',
    userType: 'Admin',
    sessionId: 'session-123',
    isAuthenticated: true,
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Set default mock values for Admin user
    mockUserTypeDisplayName.mockReturnValue('Administrador');
    mockUserType.mockReturnValue('Admin');
    mockIsAdmin.mockReturnValue(true);
    mockIsUser.mockReturnValue(false);
    mockCanAccessAdminFeatures.mockReturnValue(true);
  });

  const createWrapper = (props = {}) => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/entrar', component: { template: '<div>SignIn</div>' } },
      ],
    });

    return mount(UserProfile, {
      props: {
        user: mockUser,
        ...props,
      },
      global: {
        plugins: [router],
        stubs: {
          UserAvatar: {
            name: 'UserAvatar',
            template: '<div data-testid="user-avatar">Avatar</div>',
          },
        },
      },
    });
  };

  it('renders user information correctly', async () => {
    const wrapper = createWrapper();
    
    // Check that user name is displayed
    expect(wrapper.text()).toContain('João Silva');
    
    // Click to open dropdown to see email
    const button = wrapper.find('button');
    await button.trigger('click');
    
    // Now email should be visible in the dropdown
    expect(wrapper.text()).toContain('test@example.com');
  });

  it('displays correct user type in Portuguese', async () => {
    const wrapper = createWrapper();
    
    // Click to open dropdown to see user type
    const button = wrapper.find('button');
    await button.trigger('click');
    
    // Admin should show as "Administrador"
    expect(wrapper.text()).toContain('Administrador');
  });

  it('displays User type correctly in Portuguese', async () => {
    // Mock for User type
    mockUserTypeDisplayName.mockReturnValue('Utilizador');
    mockUserType.mockReturnValue('User');
    mockIsAdmin.mockReturnValue(false);
    mockIsUser.mockReturnValue(true);
    mockCanAccessAdminFeatures.mockReturnValue(false);
    
    const userTypeUser: UserContext = {
      ...mockUser,
      userType: 'User',
    };
    
    const wrapper = createWrapper({ user: userTypeUser });
    
    // Click to open dropdown to see user type
    const button = wrapper.find('button');
    await button.trigger('click');
    
    // User should show as "Utilizador"
    expect(wrapper.text()).toContain('Utilizador');
  });

  it('shows sign out button', async () => {
    const wrapper = createWrapper();
    
    // Click to open dropdown to see sign out button
    const button = wrapper.find('button');
    await button.trigger('click');
    
    expect(wrapper.text()).toContain('Sair');
  });

  it('handles mobile layout correctly', () => {
    const wrapper = createWrapper({ isMobile: true });
    
    // Should render mobile-specific elements
    expect(wrapper.find('.touch-target').exists()).toBe(true);
  });

  it('toggles dropdown when clicked', async () => {
    const wrapper = createWrapper();
    
    // Initially dropdown should be closed
    expect(wrapper.vm.isDropdownOpen).toBe(false);
    
    // Click the button to open dropdown
    const button = wrapper.find('button');
    await button.trigger('click');
    
    expect(wrapper.vm.isDropdownOpen).toBe(true);
  });

  it('falls back to email when no name is provided', () => {
    const userWithoutName: UserContext = {
      ...mockUser,
      firstName: '',
      lastName: '',
    };
    
    const wrapper = createWrapper({ user: userWithoutName });
    
    // Should display email as the name
    expect(wrapper.text()).toContain('test@example.com');
  });
});
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { createPinia } from 'pinia';
import SignInView from './SignInView.vue';

// Mock Clerk components
vi.mock('@clerk/vue', () => ({
  SignIn: {
    name: 'SignIn',
    template: '<div data-testid="clerk-signin">Clerk SignIn Component</div>',
    props: ['appearance', 'redirect-url'],
  },
  useAuth: () => ({
    isLoaded: { value: true },
    isSignedIn: { value: false },
  }),
  useUser: () => ({
    user: { value: null },
  }),
}));

// Mock the auth composable
vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    isLoaded: { value: true },
    isSignedIn: { value: false },
    user: { value: null },
  }),
}));

describe('SignInView', () => {
  const createWrapper = () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/entrar', component: SignInView },
      ],
    });

    const pinia = createPinia();

    return mount(SignInView, {
      global: {
        plugins: [router, pinia],
        stubs: {
          SignIn: {
            name: 'SignIn',
            template: '<div data-testid="clerk-signin">Clerk SignIn Component</div>',
          },
        },
      },
    });
  };

  it('renders the sign in page', () => {
    const wrapper = createWrapper();
    
    // Check that the page title is present
    expect(wrapper.text()).toContain('CLEVER');
    expect(wrapper.text()).toContain('Entrar na sua conta');
  });

  it('shows the Clerk SignIn component', () => {
    const wrapper = createWrapper();
    
    // Check that the Clerk SignIn component is rendered
    const clerkSignIn = wrapper.find('[data-testid="clerk-signin"]');
    expect(clerkSignIn.exists()).toBe(true);
  });

  it('displays the correct Portuguese labels', () => {
    const wrapper = createWrapper();
    
    // Check Portuguese text
    expect(wrapper.text()).toContain('Entrar na sua conta');
    expect(wrapper.text()).toContain('Aceda ao seu dashboard CLEVER');
  });

  it('has mobile-friendly styling', () => {
    const wrapper = createWrapper();
    
    // Check that the main container has mobile-first classes
    const container = wrapper.find('.min-h-screen');
    expect(container.exists()).toBe(true);
    expect(container.classes()).toContain('bg-gray-50');
  });
});
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { Clerk } from '@clerk/clerk-js';
import App from './App.vue';
import router from './router';

// Import global styles
import './assets/main.css';

// Get Clerk publishable key from environment (baked in during build)
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Get current domain info for Clerk configuration
const currentDomain = window.location.hostname;
const isLocalhost = currentDomain === 'localhost' || currentDomain === '127.0.0.1';
const isWorkersSubdomain = currentDomain.includes('.workers.dev');

// Initialize Clerk manually to avoid external script loading
const initializeApp = async () => {
  try {
    // Create Vue app instance
    const app = createApp(App);

    // Install Pinia first
    const pinia = createPinia();
    app.use(pinia);

    // Initialize Clerk with domain configuration for Workers deployment
    const clerk = new Clerk(clerkPublishableKey);

    // Configure Clerk options based on environment
    const clerkOptions: any = {
      appearance: {
        variables: {
          colorPrimary: '#75AE93',
          colorText: '#1f2937',
          colorTextSecondary: '#6b7280',
          colorBackground: '#ffffff',
          colorInputBackground: '#ffffff',
          colorInputText: '#1f2937',
          borderRadius: '0.375rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        },
        elements: {
          card: 'shadow-none border-none',
          headerTitle: 'hidden',
          headerSubtitle: 'hidden',
        },
      },
    };

    // For Workers subdomain, configure domain handling
    if (isWorkersSubdomain) {
      // Configure URLs for proper redirect handling
      clerkOptions.signInUrl = '/sign-in';
      clerkOptions.signUpUrl = '/sign-up';
      clerkOptions.afterSignInUrl = '/';
      clerkOptions.afterSignUpUrl = '/';

      // Allow current origin for redirects
      clerkOptions.allowedRedirectOrigins = [window.location.origin];
    }

    await clerk.load(clerkOptions);

    // Make Clerk available globally
    window.Clerk = clerk;

    // Initialize auth store with Clerk state
    const { useAuthStore } = await import('@/stores/auth');
    const authStore = useAuthStore();

    // Set initial auth state
    const updateAuthState = () => {
      const user = clerk.user;
      const isSignedIn = !!user;

      if (user && isSignedIn) {
        // Try to get userType from multiple sources
        let userType: 'Admin' | 'User' = 'User';
        
        // 1. Check publicMetadata first
        if (user.publicMetadata?.userType) {
          userType = user.publicMetadata.userType as 'Admin' | 'User';
        }
        // 2. Check organization membership role
        else if (user.organizationMemberships && user.organizationMemberships.length > 0) {
          const orgMembership = user.organizationMemberships[0];
          if (orgMembership.role === 'admin' || orgMembership.role === 'org:admin') {
            userType = 'Admin';
          }
        }
        // 3. Check unsafeMetadata as fallback
        else if (user.unsafeMetadata?.userType) {
          userType = user.unsafeMetadata.userType as 'Admin' | 'User';
        }

        const userContext = {
          userId: user.id,
          email: user.primaryEmailAddress?.emailAddress || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          userType: userType,
          sessionId: user.id,
          isAuthenticated: true,
        };
        authStore.setAuthState(true, true, userContext);
      } else {
        authStore.setAuthState(true, false, null);
      }
    };

    // Set initial state
    updateAuthState();

    // Listen for Clerk state changes
    clerk.addListener(updateAuthState);

    // Install router and mount app
    app.use(router);
    app.mount('#app');
  } catch (error) {
    console.error('Failed to initialize app:', error);

    // Create a minimal app to show error state
    const app = createApp(App);
    app.use(createPinia());
    app.use(router);
    app.mount('#app');
  }
};

// Initialize the app
initializeApp();

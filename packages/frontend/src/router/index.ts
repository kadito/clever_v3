import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// Content types based on the CLEVER system modules (English for API, Portuguese for UI)
const contentTypes = [
  'clients',
  'contracts', 
  'licenses',
  'work-sheets',
  'daily-records',
  'remote-assistance',
  'reminders',
  'pending',
] as const;

// Generate routes following the 4-view pattern for each content type
const generateContentRoutes = (): RouteRecordRaw[] => {
  const routes: RouteRecordRaw[] = [];

  contentTypes.forEach(contentType => {
    const routeBase = `/${contentType}`;
    const componentBase = contentType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    routes.push(
      // List view - search/filter interface
      {
        path: routeBase,
        name: `${contentType}-list`,
        component: () => import(`../views/content/ContentListView.vue`),
        meta: {
          contentType,
          title: `${componentBase} - Lista`,
          requiresAuth: true,
        },
      },
      // Detail view - full content display
      {
        path: `${routeBase}/:id`,
        name: `${contentType}-detail`,
        component: () => import(`../views/content/ContentDetailView.vue`),
        meta: {
          contentType,
          title: `${componentBase} - Detalhes`,
          requiresAuth: true,
        },
      },
      // Create view - new content form
      {
        path: `${routeBase}/novo`,
        name: `${contentType}-create`,
        component: () => import(`../views/content/ContentFormView.vue`),
        meta: {
          contentType,
          title: `${componentBase} - Criar`,
          mode: 'create',
          requiresAuth: true,
        },
      },
      // Edit view - edit existing content
      {
        path: `${routeBase}/:id/editar`,
        name: `${contentType}-edit`,
        component: () => import(`../views/content/ContentFormView.vue`),
        meta: {
          contentType,
          title: `${componentBase} - Editar`,
          mode: 'edit',
          requiresAuth: true,
        },
      }
    );
  });

  return routes;
};

// Main router configuration with mobile-friendly settings
const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Authentication routes
    {
      path: '/entrar',
      name: 'signin',
      component: () => import('../views/SignInView.vue'),
      meta: {
        title: 'Entrar',
        requiresAuth: false,
        hideLayout: true, // Don't show the main layout for auth pages
      },
    },

    // Dashboard home - central navigation hub
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: {
        title: 'CLEVER Dashboard',
        requiresAuth: true,
      },
    },

    // Generate all content type routes
    ...generateContentRoutes(),

    // Catch-all route for 404 handling
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: {
        title: 'Página não encontrada',
      },
    },
  ],

  // Mobile-friendly scroll behavior
  scrollBehavior(to, from, savedPosition) {
    // If there's a saved position (back/forward navigation), use it
    if (savedPosition) {
      return savedPosition;
    }

    // If navigating to an anchor, scroll to it
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      };
    }

    // Otherwise, scroll to top
    return { top: 0, behavior: 'smooth' };
  },
});

// Navigation guards for authentication and mobile-optimized transitions
router.beforeEach(async (to, from, next) => {
  // Set page title
  if (to.meta.title) {
    document.title = `${to.meta.title} | CLEVER`;
  }

  // Get auth store - fail fast if not available
  const authStore = useAuthStore();
  if (!authStore) {
    throw new Error('Auth store not available in router guard');
  }

  // Wait for auth state to be loaded
  if (!authStore.isLoaded) {
    // Wait for auth to be loaded (with timeout)
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    
    while (!authStore.isLoaded && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    // If still not loaded after timeout, proceed anyway
    if (!authStore.isLoaded) {
      console.warn('Auth state not loaded after timeout, proceeding with navigation');
    }
  }

  // Check if route requires authentication
  const requiresAuth = to.meta.requiresAuth !== false; // Default to true unless explicitly false
  
  // If route doesn't require auth (like SignIn page), allow access
  if (!requiresAuth) {
    // If user is already authenticated and trying to access SignIn, redirect to home
    if (to.name === 'signin' && authStore.isAuthenticated) {
      next({ name: 'home' });
      return;
    }
    next();
    return;
  }

  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    // Store the intended destination for redirect after login
    const redirectPath = to.fullPath !== '/entrar' ? to.fullPath : '/';
    
    // Redirect to SignIn page with return path
    next({
      name: 'signin',
      query: { redirect: redirectPath }
    });
    return;
  }

  // User is authenticated, allow access
  next();
});

// After navigation cleanup
router.afterEach((to, from) => {
  // Remove any loading states
  // Close mobile menus if open
  // This will be expanded when layout components are implemented
});

export default router;

// Export content types for use in other components
export { contentTypes };

// Helper function to get content type display name
export const getContentTypeDisplayName = (contentType: string): string => {
  const displayNames: Record<string, string> = {
    clients: 'Clientes',
    contracts: 'Contratos',
    licenses: 'Licenças',
    'work-sheets': 'Folhas de Obra',
    'daily-records': 'Registo Diário',
    'remote-assistance': 'Assistências Remotas',
    reminders: 'Lembretes',
    pending: 'Pendentes',
  };

  return displayNames[contentType] || contentType;
};

// Helper function to get content type icon (will be used in dashboard tiles)
export const getContentTypeIcon = (contentType: string): string => {
  const icons: Record<string, string> = {
    clients: '👥',
    contracts: '📋',
    licenses: '🔑',
    'work-sheets': '📝',
    'daily-records': '📅',
    'remote-assistance': '🔧',
    reminders: '💭',
    pending: '⏳',
  };

  return icons[contentType] || '📄';
};

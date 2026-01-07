import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

// Content types based on the CLEVER system modules
const contentTypes = [
  'clientes',
  'contratos',
  'licencas',
  'folhas-obra',
  'registo-diario',
  'assistencias-remotas',
  'agendamentos',
  'equipa',
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
          requiresAuth: false, // Will be implemented later
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
          requiresAuth: false,
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
          requiresAuth: false,
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
          requiresAuth: false,
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
    // Dashboard home - central navigation hub
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: {
        title: 'CLEVER Dashboard',
        requiresAuth: false,
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

// Navigation guards for mobile-optimized transitions
router.beforeEach((to, from, next) => {
  // Set page title
  if (to.meta.title) {
    document.title = `${to.meta.title} | CLEVER`;
  }

  // Add loading state for mobile (will be implemented with stores)
  // This helps with perceived performance on slower mobile connections

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
    clientes: 'Clientes',
    contratos: 'Contratos',
    licencas: 'Licenças',
    'folhas-obra': 'Folhas de Obra',
    'registo-diario': 'Registo Diário',
    'assistencias-remotas': 'Assistências Remotas',
    agendamentos: 'Agendamentos',
    equipa: 'Equipa',
  };

  return displayNames[contentType] || contentType;
};

// Helper function to get content type icon (will be used in dashboard tiles)
export const getContentTypeIcon = (contentType: string): string => {
  const icons: Record<string, string> = {
    clientes: '👥',
    contratos: '📋',
    licencas: '🔑',
    'folhas-obra': '📝',
    'registo-diario': '📅',
    'assistencias-remotas': '🔧',
    agendamentos: '⏰',
    equipa: '👨‍💼',
  };

  return icons[contentType] || '📄';
};

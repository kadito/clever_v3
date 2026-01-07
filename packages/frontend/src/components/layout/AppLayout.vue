<template>
  <div class="app-layout min-h-screen bg-light">
    <!-- Mobile header with hamburger menu -->
    <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo and title -->
          <div class="flex items-center">
            <router-link to="/" class="flex items-center">
              <h1 class="text-xl font-bold text-primary-600">CLEVER</h1>
            </router-link>
          </div>

          <!-- Mobile menu button -->
          <button
            @click="toggleMobileMenu"
            class="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 touch-target"
            aria-label="Abrir menu"
          >
            <svg
              class="w-6 h-6"
              :class="{ hidden: isMobileMenuOpen, block: !isMobileMenuOpen }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            <svg
              class="w-6 h-6"
              :class="{ block: isMobileMenuOpen, hidden: !isMobileMenuOpen }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <!-- Desktop navigation -->
          <nav class="hidden md:flex space-x-8">
            <router-link
              to="/"
              class="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
              :class="{ 'text-primary-600 font-semibold': $route.name === 'home' }"
            >
              Dashboard
            </router-link>
          </nav>
        </div>
      </div>

      <!-- Mobile navigation menu -->
      <div class="md:hidden" :class="{ block: isMobileMenuOpen, hidden: !isMobileMenuOpen }">
        <div class="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
          <AppNavigation :is-mobile="true" @navigate="closeMobileMenu" />
        </div>
      </div>
    </header>

    <!-- Main content area -->
    <main class="flex-1">
      <!-- Desktop sidebar -->
      <div class="hidden md:flex">
        <!-- Sidebar -->
        <aside class="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <div class="p-4">
            <AppNavigation :is-mobile="false" />
          </div>
        </aside>

        <!-- Main content -->
        <div class="flex-1">
          <slot />
        </div>
      </div>

      <!-- Mobile content (full width) -->
      <div class="md:hidden">
        <slot />
      </div>
    </main>

    <!-- Mobile overlay when menu is open -->
    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 z-40 bg-black bg-opacity-25 md:hidden"
      @click="closeMobileMenu"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import AppNavigation from './AppNavigation.vue';

const route = useRoute();
const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

// Close mobile menu when route changes
const handleRouteChange = () => {
  closeMobileMenu();
};

// Close mobile menu on escape key
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeMobileMenu();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});

// Watch for route changes to close mobile menu
import { watch } from 'vue';
watch(() => route.path, handleRouteChange);
</script>

<style scoped>
.app-layout {
  /* Ensure proper mobile viewport handling */
  min-height: 100vh;
  min-height: 100dvh; /* Dynamic viewport height for mobile browsers */
}

/* Smooth transitions for mobile menu */
.md\:hidden > div {
  transition: all 0.3s ease-in-out;
}

/* Ensure touch targets are properly sized */
button,
a {
  min-height: 44px;
  min-width: 44px;
}

/* Prevent body scroll when mobile menu is open */
.mobile-menu-open {
  overflow: hidden;
}
</style>

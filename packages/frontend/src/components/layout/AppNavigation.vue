<template>
  <nav class="navigation">
    <!-- Dashboard link -->
    <router-link
      to="/"
      :class="['nav-item', { active: $route.name === 'home' }, { 'mobile-nav-item': isMobile }]"
      @click="handleNavigate"
    >
      <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"
        />
      </svg>
      Dashboard
    </router-link>

    <!-- Mobile-specific footer -->
    <div v-if="isMobile" class="mt-6 pt-6 border-t border-gray-200">
      <div class="px-4 text-xs text-gray-500">CLEVER Dashboard v3.0</div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

interface Props {
  isMobile?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isMobile: false,
});

const emit = defineEmits<{
  navigate: [];
}>();

const handleNavigate = () => {
  emit('navigate');
};
</script>

<style scoped>
.navigation {
  @apply space-y-1;
}

.nav-item {
  @apply flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors duration-200 rounded-lg mx-2;
  min-height: 44px; /* Touch-friendly height */
}

.nav-item.active {
  @apply bg-primary-100 text-primary-700;
  position: relative;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background-color: theme('colors.primary.500');
  border-radius: 0 2px 2px 0;
}

.mobile-nav-item {
  @apply mx-0 rounded-none border-b border-gray-100 last:border-b-0;
}

.mobile-nav-item:hover {
  @apply bg-gray-50;
}

.mobile-nav-item.active {
  @apply bg-primary-50 border-primary-200;
}

.mobile-nav-item.active::before {
  display: none;
}

/* Touch-friendly spacing for mobile */
@media (max-width: 767px) {
  .nav-item {
    @apply py-4 text-base;
    min-height: 56px;
  }
}

/* Smooth hover transitions */
.nav-item {
  transition: all 0.2s ease-in-out;
}

.nav-item:hover {
  transform: translateX(2px);
}

.mobile-nav-item:hover {
  transform: none;
}
</style>

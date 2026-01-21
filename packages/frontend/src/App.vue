<template>
  <!-- Show layout for most pages, but not for auth pages -->
  <AppLayout v-if="!hideLayout">
    <RouterView />
    <ErrorNotification />
  </AppLayout>

  <!-- Direct view for auth pages -->
  <div v-else>
    <RouterView />
    <ErrorNotification />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppLayout from './components/layout/AppLayout.vue';
import ErrorNotification from './components/common/ErrorNotification.vue';

const route = useRoute();

// Hide layout for auth pages
const hideLayout = computed(() => {
  return route.meta.hideLayout === true;
});
</script>

<style scoped>
/* App-specific styles handled by AppLayout */
</style>

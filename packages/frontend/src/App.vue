<template>
  <AppLayout>
    <RouterView />
    <ErrorNotification />
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from './components/layout/AppLayout.vue'
import ErrorNotification from './components/common/ErrorNotification.vue'
</script>

<style scoped>
/* App-specific styles handled by AppLayout */
</style>
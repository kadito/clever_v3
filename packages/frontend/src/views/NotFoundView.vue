<template>
  <div class="min-h-screen bg-light flex items-center justify-center p-4">
    <div class="text-center max-w-md mx-auto">
      <div class="text-6xl mb-4">🔍</div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">
        Página não encontrada
      </h1>
      <p class="text-gray-600 mb-6">
        A página que procura não existe ou foi movida.
      </p>
      <router-link 
        to="/" 
        class="btn-primary inline-flex items-center"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar ao Dashboard
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
// 404 Not Found page with mobile-friendly design
</script>
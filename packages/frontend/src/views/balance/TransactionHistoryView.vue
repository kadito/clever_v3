<template>
  <div class="transaction-history-view">
    <!-- Header -->
    <div class="view-header">
      <button
        class="back-button"
        @click="handleBack"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span>Voltar</span>
      </button>
      
      <div class="header-content">
        <h1 class="view-title">
          Histórico de Transações
        </h1>
        <p
          v-if="clientName"
          class="view-subtitle"
        >
          {{ clientName }}
        </p>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-if="error"
      class="error-container"
    >
      <div class="error-content">
        <svg
          class="error-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p class="error-message">
          {{ error }}
        </p>
        <button
          class="retry-button"
          @click="loadClientInfo"
        >
          Tentar Novamente
        </button>
      </div>
    </div>

    <!-- Transaction History Component -->
    <div
      v-else
      class="history-container"
    >
      <TransactionHistoryDisplay :client-id="clientId" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TransactionHistoryDisplay from '@/components/balance/TransactionHistoryDisplay.vue';

const route = useRoute();
const router = useRouter();

const clientId = ref<string>('');
const clientName = ref<string>('');
const error = ref<string | null>(null);

const handleBack = () => {
  router.push(`/clients/${clientId.value}`);
};

const loadClientInfo = async () => {
  const id = route.params.clientId as string;
  
  if (!id) {
    error.value = 'ID do cliente não fornecido';
    return;
  }

  clientId.value = id;
  error.value = null;

  // Load client name for display
  await fetch(`/api/content/clients/${id}`)
    .then(async response => {
      if (!response.ok) {
        throw new Error('Erro ao carregar informação do cliente');
      }
      return response.json();
    })
    .then(data => {
      if (data && data.data) {
        clientName.value = data.data.nomeComercial || data.data.nomeEmpresa || 'Cliente';
      }
    })
    .catch(err => {
      console.error('Error loading client info:', JSON.stringify(err, null, 2));
      // Don't set error here - we can still show transactions without client name
      clientName.value = 'Cliente';
    });
};

onMounted(() => {
  loadClientInfo();
});
</script>

<style scoped>
.transaction-history-view {
  min-height: 100vh;
  background-color: #f9fafb;
}

/* Header */
.view-header {
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

@media (min-width: 768px) {
  .view-header {
    padding: 1.5rem 2rem;
  }
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.5rem;
  margin-bottom: 1rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
  min-height: 44px;
  min-width: 44px;
}

.back-button:hover {
  color: #374151;
  background-color: #f3f4f6;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.view-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

@media (min-width: 768px) {
  .view-title {
    font-size: 1.875rem;
  }
}

.view-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Error Container */
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 2rem;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  max-width: 400px;
  text-align: center;
}

.error-icon {
  width: 3rem;
  height: 3rem;
  color: #dc2626;
}

.error-message {
  color: #dc2626;
  font-size: 1rem;
}

.retry-button {
  padding: 0.75rem 1.5rem;
  background-color: #75AE93;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background-color: #5a8a73;
}

/* History Container */
.history-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

@media (min-width: 768px) {
  .history-container {
    padding: 2rem;
  }
}
</style>

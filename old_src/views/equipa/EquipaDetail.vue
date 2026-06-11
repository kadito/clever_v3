<template>
  <div class="collaborator-detail-container">
    <!-- Header -->
    <div class="detail-header">
      <BackButton
        to="/equipa/list"
        variant="inline"
      />
      <div class="header-content">
        <h1>{{ collaborator?.name || 'Colaborador' }}</h1>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-edit"
          @click="navigateToEdit"
        >
          ✏️ Editar
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="loading-state"
    >
      <p>A carregar colaborador...</p>
    </div>

    <!-- Error State -->
    <div
      v-if="error"
      class="error-alert"
    >
      <p>{{ error }}</p>
      <button
        class="close-btn"
        @click="clearError"
      >
        ×
      </button>
    </div>

    <!-- Collaborator Details -->
    <div
      v-if="!loading && collaborator"
      class="detail-content"
    >
      <!-- Basic Information Section -->
      <section class="detail-section">
        <h3>INFORMAÇÃO BÁSICA</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>NOME</label>
            <span>{{ collaborator.name }}</span>
          </div>
          <div
            v-if="collaborator.createdAt"
            class="detail-item"
          >
            <label>DATA DE CRIAÇÃO</label>
            <span>{{ formatDate(collaborator.createdAt) }}</span>
          </div>
          <div
            v-if="collaborator.updatedAt"
            class="detail-item"
          >
            <label>ÚLTIMA ATUALIZAÇÃO</label>
            <span>{{ formatDate(collaborator.updatedAt) }}</span>
          </div>
        </div>
      </section>
    </div>

    <!-- Not Found State -->
    <div
      v-if="!loading && !error && !collaborator"
      class="not-found-state"
    >
      <h2>Colaborador não encontrado</h2>
      <p>O colaborador pode ainda não estar disponível no sistema. Tentar novamente?</p>
      <div class="retry-actions">
        <button
          class="btn btn-primary"
          :disabled="loading"
          @click="retryLoad"
        >
          {{ loading ? 'A carregar...' : 'Tentar novamente' }}
        </button>
        <BackButton
          to="/equipa/list"
          variant="full-width"
        />
      </div>
      <p
        v-if="autoRetryCountdown > 0"
        class="auto-retry-info"
      >
        Tentativa automática em {{ autoRetryCountdown }}s...
      </p>
    </div>

    <!-- Action Buttons -->
    <div
      v-if="!loading && collaborator"
      class="action-buttons"
    >
      <button
        class="btn btn-primary"
        @click="navigateToEdit"
      >
        ✏️ Editar Colaborador
      </button>
      <button
        class="btn btn-secondary"
        @click="navigateToList"
      >
        📋 Lista de Colaboradores
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import BackButton from '@/components/BackButton.vue';
import { useEquipaStore } from '@/stores/equipa.js';

// Router
const route = useRoute();
const router = useRouter();

// Store
const store = useEquipaStore();
const { loading, error, selectedCollaborator } = storeToRefs(store);
const { fetchCollaboratorById, clearError } = store;

// Computed
const collaborator = computed(() => selectedCollaborator.value);

// Auto-retry state
const autoRetryCountdown = ref(0);
const userInteractionCancelled = ref(false);
const retryTimeoutId = ref(null);

// Methods
const formatDate = dateString => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const navigateToEdit = () => {
  router.push(`/equipa/${route.params.id}/edit`);
};

const navigateToList = () => {
  router.push('/equipa/list');
};

const retryLoad = () => {
  userInteractionCancelled.value = true;
  cancelAutoRetry();
  loadCollaborator();
};

const startAutoRetry = () => {
  cancelAutoRetry();
  autoRetryCountdown.value = 10;

  const updateCountdown = () => {
    if (autoRetryCountdown.value > 0 && !userInteractionCancelled.value) {
      autoRetryCountdown.value--;
      retryTimeoutId.value = setTimeout(updateCountdown, 1000);
    } else if (autoRetryCountdown.value === 0 && !userInteractionCancelled.value) {
      // Auto-retry after countdown
      loadCollaborator();
    }
  };

  retryTimeoutId.value = setTimeout(updateCountdown, 1000);
};

const cancelAutoRetry = () => {
  if (retryTimeoutId.value) {
    clearTimeout(retryTimeoutId.value);
    retryTimeoutId.value = null;
  }
  autoRetryCountdown.value = 0;
};

const handleUserInteraction = () => {
  userInteractionCancelled.value = true;
  cancelAutoRetry();
};

const loadCollaborator = async () => {
  const id = route.params.id;
  if (!id) {
    router.push('/equipa/list');
    return;
  }

  try {
    clearError();
    await fetchCollaboratorById(id);
    // If successful, cancel any pending retries
    cancelAutoRetry();
  } catch (err) {
    console.error('Error loading collaborator:', err);
    // Check if it's a 404 or "not found" error
    const isNotFound =
      err.message?.toLowerCase().includes('not found') ||
      error.value?.toLowerCase().includes('not found');

    if (isNotFound && !userInteractionCancelled.value) {
      // Start auto-retry countdown
      startAutoRetry();
    }
  }
};

// Watch for successful data load to cancel retries
watch(
  () => collaborator.value?.id,
  newId => {
    if (newId) {
      cancelAutoRetry();
      userInteractionCancelled.value = false;
    }
  }
);

// Lifecycle
onMounted(async () => {
  // Add event listeners for user interaction
  window.addEventListener('click', handleUserInteraction);
  window.addEventListener('scroll', handleUserInteraction);
  window.addEventListener('keydown', handleUserInteraction);

  await loadCollaborator();
});

onBeforeUnmount(() => {
  cancelAutoRetry();
  window.removeEventListener('click', handleUserInteraction);
  window.removeEventListener('scroll', handleUserInteraction);
  window.removeEventListener('keydown', handleUserInteraction);
});
</script>

<style scoped>
.collaborator-detail-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
  background: #f5f5f5;
  min-height: 100vh;
}

.detail-header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-content h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-edit {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
}

.btn-edit:hover {
  background: white;
  color: var(--primary-color);
}

.loading-state {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.error-alert {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-alert p {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #721c24;
}

.detail-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.detail-section {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.detail-section:last-child {
  border-bottom: none;
}

.detail-section h3 {
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--primary-color);
  padding-bottom: 0.5rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-item span {
  font-size: 1rem;
  color: #2c3e50;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.not-found-state {
  background: white;
  padding: 3rem 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.not-found-state h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.not-found-state p {
  color: #666;
  margin-bottom: 2rem;
}

.retry-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.retry-actions .btn {
  min-width: 180px;
}

.retry-actions .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auto-retry-info {
  color: #666;
  font-size: 0.9rem;
  font-style: italic;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .detail-header {
    padding: 1.5rem;
    flex-direction: column;
    align-items: flex-start;
  }

  .header-content h1 {
    font-size: 1.5rem;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>

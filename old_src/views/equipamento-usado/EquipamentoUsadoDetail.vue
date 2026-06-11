<template>
  <div class="detail-container">
    <div class="detail-header">
      <BackButton :to="backRoute" />
      <div class="detail-title">
        <h1>{{ equipamento ? getEquipamentoSummary(equipamento) : 'Equipamento' }}</h1>
        <div
          v-if="equipamento"
          class="status-badge"
          :class="getEquipamentoStatus(equipamento).status"
        >
          {{ getEquipamentoStatus(equipamento).label }}
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="loading-state"
    >
      <p>A carregar equipamento...</p>
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

    <!-- Equipment Details -->
    <div
      v-if="equipamento && !loading"
      class="detail-content"
    >
      <!-- Equipment Information -->
      <section class="detail-section">
        <h2>📦 INFORMAÇÕES DO EQUIPAMENTO</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">TIPO DE EQUIPAMENTO:</span>
            <span class="value">{{ equipamento.tipoEquipamento || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="label">MARCA:</span>
            <span class="value">{{ equipamento.marca || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="label">MODELO:</span>
            <span class="value">{{ equipamento.modelo || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="label">NÚMERO DE SÉRIE:</span>
            <span class="value">{{ equipamento.numeroSerie || 'N/A' }}</span>
          </div>
        </div>
      </section>

      <!-- Loan Information -->
      <section class="detail-section">
        <h2>📤 INFORMAÇÕES DO EMPRÉSTIMO</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">CLIENTE:</span>
            <span class="value">{{ equipamento.clienteEmprestimo || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="label">DATA DE EMPRÉSTIMO:</span>
            <span class="value">{{ formatDate(equipamento.dataEmprestimo) || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="label">DATA DE TÉRMINO DO EMPRÉSTIMO:</span>
            <span class="value">{{ formatDate(equipamento.dataRetorno) || 'N/A' }}</span>
          </div>
        </div>
      </section>

      <!-- Condition Assessment -->
      <section class="detail-section">
        <h2>🔍 AVALIAÇÃO DO ESTADO</h2>
        <div class="condition-grid">
          <div class="condition-item">
            <span class="condition-label">VISOR:</span>
            <span
              class="condition-value"
              :class="getConditionClass(equipamento.visor)"
            >
              {{ equipamento.visor || 'N/A' }}
            </span>
          </div>
          <div class="condition-item">
            <span class="condition-label">CORPO DO EQUIPAMENTO:</span>
            <span
              class="condition-value"
              :class="getConditionClass(equipamento.corpoEquipamento)"
            >
              {{ equipamento.corpoEquipamento || 'N/A' }}
            </span>
          </div>
          <div class="condition-item">
            <span class="condition-label">TRANSFORMADOR E CABOS:</span>
            <span
              class="condition-value"
              :class="getConditionClass(equipamento.transformadorCabos)"
            >
              {{ equipamento.transformadorCabos || 'N/A' }}
            </span>
          </div>
          <div class="condition-item overall">
            <span class="condition-label">ESTADO GERAL:</span>
            <span
              class="condition-value"
              :class="getConditionClass(equipamento.estadoGeral)"
            >
              {{ equipamento.estadoGeral || 'N/A' }}
            </span>
          </div>
        </div>
      </section>

      <!-- Notes -->
      <section class="detail-section">
        <h2>📝 NOTAS TÉCNICAS</h2>
        <div class="notes-content">
          <pre>{{ equipamento.notas || 'N/A' }}</pre>
        </div>
      </section>

      <!-- Timestamps -->
      <section class="detail-section timestamps">
        <h2>🕒 Informações do Sistema</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Criado em:</span>
            <span class="value">{{ formatDateTime(equipamento.createdAt) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Última atualização:</span>
            <span class="value">{{ formatDateTime(equipamento.updatedAt) }}</span>
          </div>
        </div>
      </section>

      <!-- Actions -->
      <div class="detail-actions">
        <button
          class="btn btn-primary"
          @click="goToEdit"
        >
          ✏️ Editar Equipamento
        </button>
        <button
          class="btn btn-danger"
          @click="confirmDelete"
        >
          🗑️ Eliminar
        </button>
      </div>
    </div>

    <!-- Not Found State -->
    <div
      v-if="!loading && !error && !equipamento"
      class="not-found-state"
    >
      <h2>Equipamento não encontrado</h2>
      <p>O equipamento pode ainda não estar disponível no sistema. Tentar novamente?</p>
      <div class="retry-actions">
        <button
          class="btn btn-primary"
          :disabled="loading"
          @click="retryLoad"
        >
          {{ loading ? 'A carregar...' : 'Tentar novamente' }}
        </button>
        <BackButton
          :to="backRoute"
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

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="modal-overlay"
      @click="showDeleteModal = false"
    >
      <div
        class="modal-content"
        @click.stop
      >
        <h3>Confirmar Eliminação</h3>
        <p>Tem a certeza que pretende eliminar este equipamento?</p>
        <p>
          <strong>{{ equipamento ? getEquipamentoSummary(equipamento) : '' }}</strong>
        </p>
        <div class="modal-actions">
          <button
            class="btn btn-secondary"
            @click="showDeleteModal = false"
          >
            Cancelar
          </button>
          <button
            class="btn btn-danger"
            :disabled="loading"
            @click="handleDelete"
          >
            {{ loading ? 'A eliminar...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import BackButton from '@/components/BackButton.vue';
import { useEquipamentoUsadoStore } from '@/stores/equipamento-usado';

const router = useRouter();
const route = useRoute();
const equipamentoUsadoStore = useEquipamentoUsadoStore();

// Local state
const showDeleteModal = ref(false);

// Auto-retry state
const autoRetryCountdown = ref(0);
const userInteractionCancelled = ref(false);
const retryTimeoutId = ref(null);

// Store refs
const { selectedEquipamento: equipamento, loading, error } = storeToRefs(equipamentoUsadoStore);

// Store actions
const {
  fetchEquipamentoById,
  deleteEquipamento,
  clearError,
  getEquipamentoSummary,
  getEquipamentoStatus,
  isEquipamentoEmprestado,
  formatDate,
  formatDateTime,
  getDaysOnLoan,
} = equipamentoUsadoStore;

// Computed
const backRoute = computed(() => {
  const from = route.query.from;
  if (from === 'list') {
    return '/equipamento-usado/list';
  } else {
    return '/equipamento-usado';
  }
});

// Methods
const getConditionClass = condition => {
  if (!condition) return '';

  const conditionLower = condition.toLowerCase();
  if (conditionLower.includes('ótimas') || conditionLower.includes('otimas')) {
    return 'excellent';
  } else if (conditionLower.includes('boas')) {
    return 'good';
  } else if (conditionLower.includes('necessita') || conditionLower.includes('avariado')) {
    return 'poor';
  }
  return '';
};

const goToEdit = () => {
  const year = route.params.year;
  const id = route.params.id;
  router.push(`/equipamento-usado/${year}/${id}/edit?from=detail`);
};

const confirmDelete = () => {
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  try {
    const year = route.params.year;
    const id = route.params.id;

    await deleteEquipamento(year, id);

    showDeleteModal.value = false;
    router.push('/equipamento-usado/list');
  } catch (err) {
    console.error('Delete error:', err);
    showDeleteModal.value = false;
  }
};

const retryLoad = () => {
  userInteractionCancelled.value = true;
  cancelAutoRetry();
  loadEquipamento();
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
      loadEquipamento();
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

const loadEquipamento = async () => {
  const year = route.params.year;
  const id = route.params.id;

  if (!year || !id) {
    return;
  }

  try {
    clearError();
    await fetchEquipamentoById(year, id);
    // If successful, cancel any pending retries
    cancelAutoRetry();
  } catch (err) {
    console.error('Error loading equipamento:', err);
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
  () => equipamento.value?.id,
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

  await loadEquipamento();
});

onBeforeUnmount(() => {
  cancelAutoRetry();
  window.removeEventListener('click', handleUserInteraction);
  window.removeEventListener('scroll', handleUserInteraction);
  window.removeEventListener('keydown', handleUserInteraction);
});
</script>

<style scoped>
.detail-container {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
}

.detail-title {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.detail-title h1 {
  margin: 0;
  color: var(--primary-dark);
  font-size: 1.8rem;
  flex: 1;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.disponivel {
  background: #d4edda;
  color: #155724;
}

.status-badge.emprestado {
  background: #fff3cd;
  color: #856404;
}

.status-badge.manutencao {
  background: #f8d7da;
  color: #721c24;
}

.loading-state {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.error-alert {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #721c24;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.detail-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.detail-section h2 {
  margin: 0 0 1rem 0;
  color: var(--primary-dark);
  font-size: 1.2rem;
  border-bottom: 2px solid var(--primary-light);
  padding-bottom: 0.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
  gap: 1rem;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  font-weight: 500;
  color: #6c757d;
  min-width: 150px;
}

.value {
  color: #2c3e50;
  text-align: right;
  flex: 1;
  word-break: break-word;
}

.condition-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.condition-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #dee2e6;
}

.condition-item.overall {
  background: #e9ecef;
  font-weight: 500;
}

.condition-label {
  color: #495057;
  font-weight: 500;
}

.condition-value {
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.9rem;
}

.condition-value.excellent {
  background: #d4edda;
  color: #155724;
}

.condition-value.good {
  background: #cce5ff;
  color: #004085;
}

.condition-value.poor {
  background: #f8d7da;
  color: #721c24;
}

.notes-content {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid var(--primary-color);
}

.notes-content pre {
  margin: 0;
  font-family: inherit;
  white-space: pre-wrap;
  word-break: break-word;
}

.loan-section {
  border-left: 4px solid #ffc107;
}

.loan-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.loan-alert {
  background: #fff3cd;
  color: #856404;
  padding: 1rem;
  border-radius: 6px;
  font-weight: 500;
  text-align: center;
}

.loan-notes h4 {
  margin: 0 0 0.5rem 0;
  color: #495057;
}

.loan-notes p {
  margin: 0;
  color: #6c757d;
}

.timestamps {
  background: #f8f9fa;
  border-left: 4px solid #6c757d;
}

.detail-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding: 2rem 0;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  min-width: 150px;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
  margin: 1rem;
}

.modal-content h3 {
  margin: 0 0 1rem 0;
  color: var(--primary-dark);
}

.modal-content p {
  margin-bottom: 1rem;
  color: #6c757d;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .detail-container {
    padding: 0.5rem;
  }

  .detail-header {
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-title {
    flex-direction: column;
    align-items: flex-start;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .label {
    min-width: auto;
  }

  .value {
    text-align: left;
  }

  .condition-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .detail-actions {
    flex-direction: column;
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>

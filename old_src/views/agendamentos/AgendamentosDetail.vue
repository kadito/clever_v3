<template>
  <div class="agendamentos-detail">
    <BackButton />

    <!-- Loading State -->
    <div
      v-if="loading"
      class="loading-container"
    >
      <div class="loading-spinner" />
      <p>Carregando agendamento...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="error-container"
    >
      <h2>Erro ao Carregar Agendamento</h2>
      <p>{{ error }}</p>
      <div class="error-actions">
        <BackButton variant="inline" />
        <button
          class="btn secondary"
          @click="retryLoad"
        >
          Tentar Novamente
        </button>
      </div>
    </div>

    <!-- Agendamento Details -->
    <div
      v-else-if="agendamento"
      class="agendamento-content"
    >
      <div class="agendamento-header">
        <div class="header-info">
          <h1>📅 {{ agendamento.nomeCliente }}</h1>
          <div class="header-meta">
            <span
              class="status-badge"
              :class="{
                completed: agendamento.tarefaConcluida,
                postponed: agendamento.houveAdiamento && !agendamento.tarefaConcluida,
                overdue: isTaskOverdue(agendamento) && !agendamento.tarefaConcluida,
                'due-today': isTaskDueToday(agendamento) && !agendamento.tarefaConcluida,
                pending:
                  !agendamento.tarefaConcluida &&
                  !agendamento.houveAdiamento &&
                  !isTaskOverdue(agendamento) &&
                  !isTaskDueToday(agendamento),
              }"
            >
              <span v-if="agendamento.tarefaConcluida">✅ Concluída</span>
              <span v-else-if="agendamento.houveAdiamento">📅 Adiada</span>
              <span v-else-if="isTaskOverdue(agendamento)">⏰ Atrasada</span>
              <span v-else-if="isTaskDueToday(agendamento)">🎯 Hoje</span>
              <span v-else>⏳ Pendente</span>
            </span>
            <span class="agendamento-id">ID: {{ agendamento.id }}</span>
          </div>
        </div>
        <div class="header-actions">
          <router-link
            :to="{ name: 'agendamentos-edit', params: { id: agendamento.id, year: currentYear } }"
            class="btn primary"
          >
            ✏️ Editar
          </router-link>
          <button
            class="btn danger"
            @click="confirmDelete"
          >
            🗑️ Eliminar
          </button>
        </div>
      </div>

      <div class="agendamento-sections">
        <!-- Basic Information -->
        <div class="section">
          <h3>📋 INFORMAÇÕES BÁSICAS</h3>
          <div class="section-content">
            <div class="info-grid">
              <div class="info-item">
                <label>NOME DO CLIENTE</label>
                <span>{{ agendamento.nomeCliente }}</span>
              </div>
              <div class="info-item">
                <label>DATA DO PEDIDO</label>
                <span>{{ formatDateTime(agendamento.dataPedido) }}</span>
              </div>
              <div class="info-item full-width">
                <label>MOTIVO</label>
                <span>{{ agendamento.motivo }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Schedule Information -->
        <div class="section">
          <h3>📅 INFORMAÇÕES DO AGENDAMENTO</h3>
          <div class="section-content">
            <div class="info-grid">
              <div class="info-item">
                <label>DATA PREVISTA PARA ASSISTÊNCIA</label>
                <span
                  :class="{
                    'text-danger': isTaskOverdue(agendamento) && !agendamento.tarefaConcluida,
                    'text-warning': isTaskDueToday(agendamento) && !agendamento.tarefaConcluida,
                  }"
                >
                  {{ formatDateTime(agendamento.dataPrevistaAssistencia) || 'N/A' }}
                </span>
              </div>
              <div class="info-item">
                <label>RESPONSÁVEL PELO AGENDAMENTO</label>
                <span>{{ agendamento.responsavelAgendamento || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <label>TÉCNICO</label>
                <span>{{ agendamento.tecnico || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <label>ASSUNTO</label>
                <span>{{ agendamento.assunto || 'N/A' }}</span>
              </div>
              <div
                v-if="agendamento.dataPrevistaAssistencia && !agendamento.tarefaConcluida"
                class="info-item"
              >
                <label>TEMPO RESTANTE</label>
                <span
                  :class="{
                    'text-danger': isTaskOverdue(agendamento),
                    'text-warning': isTaskDueToday(agendamento),
                  }"
                >
                  {{ calculateTimeRemaining(agendamento.dataPrevistaAssistencia) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Task Status -->
        <div class="section">
          <h3>📊 ESTADO DA TAREFA</h3>
          <div class="section-content">
            <div class="info-grid">
              <div class="info-item">
                <label>INSTALAÇÃO</label>
                <span
                  :class="{
                    'text-success': agendamento.instalacao,
                    'text-muted': !agendamento.instalacao,
                  }"
                >
                  {{ agendamento.instalacao ? '✅ Sim' : '❌ Não' }}
                </span>
              </div>
              <div class="info-item">
                <label>HOUVE ADIAMENTO</label>
                <span
                  :class="{
                    'text-warning': agendamento.houveAdiamento,
                    'text-muted': !agendamento.houveAdiamento,
                  }"
                >
                  {{ agendamento.houveAdiamento ? '📅 Sim' : '❌ Não' }}
                </span>
              </div>
              <div class="info-item">
                <label>TAREFA CONCLUÍDA</label>
                <span
                  :class="{
                    'text-success': agendamento.tarefaConcluida,
                    'text-muted': !agendamento.tarefaConcluida,
                  }"
                >
                  {{ agendamento.tarefaConcluida ? '✅ Sim' : '❌ Não' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Postponement Information -->
        <div
          v-if="agendamento.houveAdiamento"
          class="section"
        >
          <h3>📅 INFORMAÇÕES DO ADIAMENTO</h3>
          <div class="section-content">
            <div class="info-grid">
              <div class="info-item full-width">
                <label>MOTIVO DO ADIAMENTO</label>
                <span>{{ agendamento.motivoAdiamento || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <label>NOVA DATA</label>
                <span>{{ formatDateTime(agendamento.novaData) || 'N/A' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- References -->
        <div class="section">
          <h3>📄 REFERÊNCIAS</h3>
          <div class="section-content">
            <div class="info-grid">
              <div class="info-item">
                <label>FOLHA DE OBRA</label>
                <span
                  v-if="agendamento.folhaObra"
                  class="document-link"
                >
                  {{ agendamento.folhaObra }}
                </span>
                <span
                  v-else
                  class="text-muted"
                >N/A</span>
              </div>
              <div class="info-item">
                <label>ASSISTÊNCIA REMOTA</label>
                <span
                  v-if="agendamento.assistenciaRemota"
                  class="document-link"
                >
                  {{ agendamento.assistenciaRemota }}
                </span>
                <span
                  v-else
                  class="text-muted"
                >N/A</span>
              </div>
              <div class="info-item">
                <label>CONTRATO</label>
                <span
                  v-if="agendamento.contrato"
                  class="document-link"
                >
                  {{ agendamento.contrato }}
                </span>
                <span
                  v-else
                  class="text-muted"
                >N/A</span>
              </div>
            </div>
          </div>
        </div>

        <!-- System Information -->
        <div class="section">
          <h3>⚙️ INFORMAÇÕES DO SISTEMA</h3>
          <div class="section-content">
            <div class="info-grid">
              <div class="info-item">
                <label>DATA DE CRIAÇÃO</label>
                <span>{{ formatDateTime(agendamento.createdAt) }}</span>
              </div>
              <div class="info-item">
                <label>ÚLTIMA ATUALIZAÇÃO</label>
                <span>{{ formatDateTime(agendamento.updatedAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Not Found State -->
    <div
      v-else-if="!loading && !error && !agendamento"
      class="not-found-state"
    >
      <h2>Agendamento não encontrado</h2>
      <p>O agendamento pode ainda não estar disponível no sistema. Tentar novamente?</p>
      <div class="retry-actions">
        <button
          class="btn primary"
          :disabled="loading"
          @click="retryLoad"
        >
          {{ loading ? 'A carregar...' : 'Tentar novamente' }}
        </button>
        <BackButton variant="inline" />
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
      @click="cancelDelete"
    >
      <div
        class="modal"
        @click.stop
      >
        <h3>Confirmar Eliminação</h3>
        <p>
          Tem a certeza que pretende eliminar o agendamento de
          <strong>{{ agendamento?.nomeCliente }}</strong>?
        </p>
        <p class="warning">
          Esta ação não pode ser desfeita.
        </p>
        <div class="modal-actions">
          <button
            class="btn secondary"
            @click="cancelDelete"
          >
            Cancelar
          </button>
          <button
            class="btn danger"
            :disabled="deleting"
            @click="deleteAgendamento"
          >
            {{ deleting ? 'Eliminando...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAgendamentosStore } from '@/stores/agendamentos.js';
import { storeToRefs } from 'pinia';
import BackButton from '@/components/BackButton.vue';

// Router
const route = useRoute();
const router = useRouter();

// Store
const agendamentosStore = useAgendamentosStore();
const { selectedAgendamento: agendamento, loading, error } = storeToRefs(agendamentosStore);
const {
  fetchAgendamentoById,
  deleteAgendamento: deleteFromStore,
  clearError,
  clearSelectedAgendamento,
  isTaskOverdue,
  isTaskDueToday,
} = agendamentosStore;

// Local state
const showDeleteModal = ref(false);
const deleting = ref(false);

// Auto-retry state
const autoRetryCountdown = ref(0);
const userInteractionCancelled = ref(false);
const retryTimeoutId = ref(null);

// Computed
const currentYear = computed(() => route.params.year);
const agendamentoId = computed(() => route.params.id);

// Methods
const loadAgendamento = async () => {
  clearError();
  clearSelectedAgendamento();

  try {
    await fetchAgendamentoById(currentYear.value, agendamentoId.value);
    // If successful, cancel any pending retries
    cancelAutoRetry();
  } catch (err) {
    console.error('Error loading agendamento:', err);
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

const retryLoad = () => {
  userInteractionCancelled.value = true;
  cancelAutoRetry();
  loadAgendamento();
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
      loadAgendamento();
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

// Watch for successful data load to cancel retries
watch(
  () => agendamento.value?.id,
  newId => {
    if (newId) {
      cancelAutoRetry();
      userInteractionCancelled.value = false;
    }
  }
);

const confirmDelete = () => {
  showDeleteModal.value = true;
};

const cancelDelete = () => {
  showDeleteModal.value = false;
};

const deleteAgendamento = async () => {
  if (!agendamento.value) return;

  deleting.value = true;
  try {
    await deleteFromStore(currentYear.value, agendamento.value.id);
    router.push({ name: 'agendamentos' });
  } catch (err) {
    console.error('Error deleting agendamento:', err);
    // Error is already handled by the store
  } finally {
    deleting.value = false;
    showDeleteModal.value = false;
  }
};

const formatDate = dateString => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('pt-PT');
  } catch {
    return dateString;
  }
};

const formatDateTime = dateString => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleString('pt-PT');
  } catch {
    return dateString;
  }
};

const calculateTimeRemaining = targetDate => {
  if (!targetDate) return 'N/A';

  try {
    const target = new Date(targetDate);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Atrasado há ${Math.abs(diffDays)} dias`;
    } else if (diffDays === 0) {
      return 'Hoje';
    } else if (diffDays === 1) {
      return 'Amanhã';
    } else {
      return `${diffDays} dias restantes`;
    }
  } catch {
    return 'N/A';
  }
};

// Lifecycle
onMounted(() => {
  // Add event listeners for user interaction
  window.addEventListener('click', handleUserInteraction);
  window.addEventListener('scroll', handleUserInteraction);
  window.addEventListener('keydown', handleUserInteraction);

  loadAgendamento();
});

onBeforeUnmount(() => {
  cancelAutoRetry();
  window.removeEventListener('click', handleUserInteraction);
  window.removeEventListener('scroll', handleUserInteraction);
  window.removeEventListener('keydown', handleUserInteraction);
});
</script>

<style scoped>
.agendamentos-detail {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
}

.loading-container {
  text-align: center;
  padding: 3rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-container {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.error-container h2 {
  color: #dc3545;
  margin-bottom: 1rem;
}

.error-container p {
  color: #666;
  margin-bottom: 2rem;
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

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
}

.agendamento-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.agendamento-header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  color: white;
  padding: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-info h1 {
  margin: 0 0 1rem 0;
  font-size: 2rem;
}

.header-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.status-badge.postponed {
  background: #fff3cd;
  color: #856404;
}

.status-badge.overdue {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.due-today {
  background: #d1ecf1;
  color: #0c5460;
}

.status-badge.pending {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.agendamento-id {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-family: monospace;
}

.header-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.agendamento-sections {
  padding: 2rem;
}

.section {
  margin-bottom: 3rem;
}

.section:last-child {
  margin-bottom: 0;
}

.section h3 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #eee;
}

.section-content {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item label {
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item span {
  color: #2c3e50;
  font-size: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #dee2e6;
  min-height: 1.5rem;
  word-break: break-word;
}

.document-link {
  color: var(--primary-color) !important;
  font-weight: 600;
}

.text-muted {
  color: #6c757d !important;
  font-style: italic;
}

.text-danger {
  color: #dc3545 !important;
  font-weight: 600;
}

.text-warning {
  color: #ffc107 !important;
  font-weight: 600;
}

.text-success {
  color: #28a745 !important;
  font-weight: 600;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.primary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.btn.primary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.btn.danger {
  background: #dc3545;
  color: white;
}

.btn.danger:hover:not(:disabled) {
  background: #c82333;
}

.btn.secondary {
  background: #6c757d;
  color: white;
}

.btn.secondary:hover:not(:disabled) {
  background: #5a6268;
}

/* Modal Styles */
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

.modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.modal h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.modal p {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.modal .warning {
  color: #dc3545;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .agendamentos-detail {
    padding: 0.5rem;
  }

  .agendamento-header {
    padding: 1.5rem;
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }

  .header-info h1 {
    font-size: 1.75rem;
    margin-bottom: 1rem;
  }

  .header-meta {
    justify-content: center;
    flex-direction: column;
    gap: 0.5rem;
  }

  .header-actions {
    justify-content: center;
    margin-top: 1rem;
  }

  .agendamento-sections {
    padding: 1rem;
  }

  .section {
    margin-bottom: 2rem;
  }

  .section h3 {
    font-size: 1.1rem;
  }

  .section-content {
    padding: 1rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .modal {
    padding: 1.5rem;
  }

  .modal-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .error-actions {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 480px) {
  .agendamento-header {
    padding: 1rem;
  }

  .header-info h1 {
    font-size: 1.5rem;
  }

  .btn {
    padding: 0.75rem 1rem;
    font-size: 0.8rem;
  }

  .header-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>

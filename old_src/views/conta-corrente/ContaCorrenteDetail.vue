<template>
  <div class="conta-corrente-detail">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">💰</span>
          Detalhes da Conta Corrente
        </h1>
        <p class="page-subtitle">
          Informação detalhada do registo
        </p>
      </div>

      <div class="header-actions">
        <router-link
          :to="`/conta-corrente/${year}/${id}/edit`"
          class="btn btn-primary"
        >
          <span class="btn-icon">✏️</span>
          Editar
        </router-link>
        <button
          class="btn btn-danger"
          @click="confirmDelete"
        >
          <span class="btn-icon">🗑️</span>
          Eliminar
        </button>
      </div>
    </div>

    <div
      v-if="contaCorrente"
      class="detail-content"
    >
      <!-- Status Alert -->
      <div
        class="status-alert"
        :class="getInvoiceStatus(contaCorrente)"
      >
        <div class="alert-content">
          <span class="alert-icon">{{ getStatusIcon(contaCorrente) }}</span>
          <div class="alert-text">
            <strong>{{ getStatusLabel(contaCorrente) }}</strong>
            <p>{{ getStatusDescription(contaCorrente) }}</p>
          </div>
        </div>
      </div>

      <!-- Main Info Grid -->
      <div class="info-grid">
        <!-- Client Information -->
        <section class="info-section">
          <h2 class="section-title">
            <span class="section-icon">👤</span>
            INFORMAÇÃO DO CLIENTE
          </h2>
          <div class="info-content">
            <div class="info-item">
              <label>NOME DO CLIENTE</label>
              <div class="info-value primary">
                {{ contaCorrente.nomeCliente }}
              </div>
            </div>
          </div>
        </section>

        <!-- Invoice Information -->
        <section class="info-section">
          <h2 class="section-title">
            <span class="section-icon">📋</span>
            INFORMAÇÃO DA FATURA
          </h2>
          <div class="info-content">
            <div class="info-row">
              <div class="info-item">
                <label>TIPO DE FATURA</label>
                <div class="info-value">
                  <span
                    class="type-badge"
                    :class="contaCorrente.tipoFatura.toLowerCase()"
                  >
                    {{ contaCorrente.tipoFatura }}
                  </span>
                </div>
              </div>
              <div class="info-item">
                <label>NÚMERO DA FATURA</label>
                <div class="info-value">
                  {{ contaCorrente.numeroFatura || 'Não especificado' }}
                </div>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <label>VALOR DA FATURA (€)</label>
                <div class="info-value currency">
                  {{
                    contaCorrente.valorFatura
                      ? formatCurrency(contaCorrente.valorFatura)
                      : 'Não especificado'
                  }}
                </div>
              </div>
              <div class="info-item">
                <label>FORMA DE PAGAMENTO</label>
                <div class="info-value">
                  {{ contaCorrente.formaPagamento || 'Não especificado' }}
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Dates Information -->
        <section class="info-section">
          <h2 class="section-title">
            <span class="section-icon">📅</span>
            DATAS
          </h2>
          <div class="info-content">
            <div class="info-row">
              <div class="info-item">
                <label>DATA DA FATURA GERADA</label>
                <div class="info-value">
                  {{
                    contaCorrente.dataFaturaGerada
                      ? formatDate(contaCorrente.dataFaturaGerada)
                      : 'Não especificado'
                  }}
                </div>
              </div>
              <div class="info-item">
                <label>DATA DE VENCIMENTO</label>
                <div
                  class="info-value"
                  :class="getDueDateClass(contaCorrente)"
                >
                  {{
                    contaCorrente.dataVencimentoFatura
                      ? formatDate(contaCorrente.dataVencimentoFatura)
                      : 'Não especificado'
                  }}
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Work Information -->
        <section class="info-section">
          <h2 class="section-title">
            <span class="section-icon">⚙️</span>
            INFORMAÇÃO DO TRABALHO
          </h2>
          <div class="info-content">
            <div class="info-row">
              <div class="info-item">
                <label>HORAS GASTAS</label>
                <div class="info-value">
                  {{ contaCorrente.horasGastas || 'Não especificado' }}
                </div>
              </div>
              <div class="info-item">
                <label>ESTADO DO PAGAMENTO</label>
                <div class="info-value">
                  <span
                    class="payment-status"
                    :class="getPaymentStatusClass(contaCorrente)"
                  >
                    {{ getPaymentStatusText(contaCorrente) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <label>NÚMERO REMOTA</label>
                <div class="info-value">
                  {{ contaCorrente.numeroRemota || 'Não aplicável' }}
                </div>
              </div>
              <div class="info-item">
                <label>NÚMERO PRESENCIAL</label>
                <div class="info-value">
                  {{ contaCorrente.numeroPresencial || 'Não aplicável' }}
                </div>
              </div>
            </div>
            <div
              v-if="contaCorrente.motivoObs"
              class="info-item full-width"
            >
              <label>MOTIVO/OBSERVAÇÕES</label>
              <div class="info-value description">
                {{ contaCorrente.motivoObs }}
              </div>
            </div>
          </div>
        </section>

        <!-- System Information -->
        <section class="info-section">
          <h2 class="section-title">
            <span class="section-icon">ℹ️</span>
            INFORMAÇÃO DO SISTEMA
          </h2>
          <div class="info-content">
            <div class="info-row">
              <div class="info-item">
                <label>ID DO REGISTO</label>
                <div class="info-value">
                  {{ contaCorrente.id }}
                </div>
              </div>
              <div class="info-item">
                <label>ANO</label>
                <div class="info-value">
                  {{ year }}
                </div>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <label>CRIADO EM</label>
                <div class="info-value">
                  {{ formatDateTime(contaCorrente.createdAt) }}
                </div>
              </div>
              <div class="info-item">
                <label>ÚLTIMA ATUALIZAÇÃO</label>
                <div class="info-value">
                  {{ formatDateTime(contaCorrente.updatedAt) }}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Action Buttons -->
      <div class="action-section">
        <div class="action-buttons">
          <router-link
            to="/conta-corrente/list"
            class="btn btn-secondary"
          >
            <span class="btn-icon">⬅️</span>
            Voltar à Lista
          </router-link>
          <router-link
            :to="`/conta-corrente/${year}/${id}/edit`"
            class="btn btn-primary"
          >
            <span class="btn-icon">✏️</span>
            Editar Registo
          </router-link>
          <router-link
            to="/conta-corrente/new"
            class="btn btn-success"
          >
            <span class="btn-icon">+</span>
            Novo Registo
          </router-link>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-else-if="loading"
      class="loading-state"
    >
      <div class="loading-spinner" />
      <p>A carregar detalhes...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="error-state"
    >
      <div class="error-icon">
        ⚠️
      </div>
      <h3>Erro ao carregar</h3>
      <p>{{ error }}</p>
      <div class="error-actions">
        <button
          class="btn btn-primary"
          :disabled="loading"
          @click="retryLoad"
        >
          {{ loading ? 'A carregar...' : 'Tentar novamente' }}
        </button>
        <router-link
          to="/conta-corrente/list"
          class="btn btn-secondary"
        >
          Voltar à Lista
        </router-link>
      </div>
    </div>

    <!-- Not Found State -->
    <div
      v-else-if="!loading && !error && !contaCorrente"
      class="not-found-state"
    >
      <h2>Registo não encontrado</h2>
      <p>O registo pode ainda não estar disponível no sistema. Tentar novamente?</p>
      <div class="retry-actions">
        <button
          class="btn btn-primary"
          :disabled="loading"
          @click="retryLoad"
        >
          {{ loading ? 'A carregar...' : 'Tentar novamente' }}
        </button>
        <router-link
          to="/conta-corrente/list"
          class="btn btn-secondary"
        >
          Voltar à Lista
        </router-link>
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
        class="modal-content"
        @click.stop
      >
        <div class="modal-header">
          <h3>Confirmar Eliminação</h3>
        </div>
        <div class="modal-body">
          <p>Tem certeza que deseja eliminar este registo de conta corrente?</p>
          <div class="delete-item-info">
            <strong>{{ contaCorrente.nomeCliente }}</strong>
            <br>
            <span v-if="contaCorrente.numeroFatura">Fatura: {{ contaCorrente.numeroFatura }}</span>
            <span v-if="contaCorrente.valorFatura">
              - {{ formatCurrency(contaCorrente.valorFatura) }}</span>
          </div>
          <p class="warning-text">
            Esta ação não pode ser desfeita.
          </p>
        </div>
        <div class="modal-actions">
          <button
            class="btn btn-secondary"
            @click="cancelDelete"
          >
            Cancelar
          </button>
          <button
            class="btn btn-danger"
            :disabled="loading"
            @click="deleteContaCorrente"
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
import { useRoute, useRouter } from 'vue-router';
import { useContaCorrenteStore } from '@/stores/conta-corrente';

const route = useRoute();
const router = useRouter();
const store = useContaCorrenteStore();

// Route params
const year = route.params.year;
const id = route.params.id;

// Local state
const showDeleteModal = ref(false);

// Auto-retry state
const autoRetryCountdown = ref(0);
const userInteractionCancelled = ref(false);
const retryTimeoutId = ref(null);

// Computed properties from store
const {
  selectedContaCorrente: contaCorrente,
  loading,
  error,
  formatDate,
  formatCurrency,
  getInvoiceStatus,
  isInvoiceOverdue,
  isInvoiceDueToday,
  clearError,
} = store;

// Methods
async function loadContaCorrente() {
  try {
    clearError();
    await store.fetchContaCorrenteById(year, id);
    // If successful, cancel any pending retries
    cancelAutoRetry();
  } catch (err) {
    console.error('Error loading conta corrente:', err);
    // Check if it's a 404 or "not found" error
    const isNotFound =
      err.message?.toLowerCase().includes('not found') ||
      error.value?.toLowerCase().includes('not found');

    if (isNotFound && !userInteractionCancelled.value) {
      // Start auto-retry countdown
      startAutoRetry();
    }
  }
}

const retryLoad = () => {
  userInteractionCancelled.value = true;
  cancelAutoRetry();
  loadContaCorrente();
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
      loadContaCorrente();
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
  () => contaCorrente.value?.id,
  newId => {
    if (newId) {
      cancelAutoRetry();
      userInteractionCancelled.value = false;
    }
  }
);

function getStatusLabel(item) {
  const status = getInvoiceStatus(item);
  const labels = {
    paid: 'Pago',
    overdue: 'Vencido',
    due_today: 'Vence Hoje',
    due_soon: 'Vence em Breve',
    pending: 'Pendente',
  };
  return labels[status] || 'Desconhecido';
}

function getStatusIcon(item) {
  const status = getInvoiceStatus(item);
  const icons = {
    paid: '✅',
    overdue: '🚨',
    due_today: '⏰',
    due_soon: '⏳',
    pending: '🔄',
  };
  return icons[status] || '❓';
}

function getStatusDescription(item) {
  const status = getInvoiceStatus(item);
  const descriptions = {
    paid: 'Este registo está marcado como pago.',
    overdue: 'Esta fatura está vencida e requer atenção imediata.',
    due_today: 'Esta fatura vence hoje.',
    due_soon: 'Esta fatura vence em breve.',
    pending: 'Esta fatura está pendente de pagamento.',
  };
  return descriptions[status] || 'Estado desconhecido.';
}

function getDueDateClass(item) {
  if (item.pago === 'TRUE' || item.pago === 'true') return 'paid';
  if (isInvoiceOverdue(item)) return 'overdue';
  if (isInvoiceDueToday(item)) return 'due-today';
  return '';
}

function getPaymentStatusClass(item) {
  if (item.pago === 'TRUE' || item.pago === 'true') return 'paid';
  if (isInvoiceOverdue(item)) return 'overdue';
  return 'pending';
}

function getPaymentStatusText(item) {
  if (item.pago === 'TRUE' || item.pago === 'true') return 'Pago';
  if (item.pago === 'FALSE' || item.pago === 'false') return 'Não Pago';
  return 'Não especificado';
}

function formatDateTime(dateString) {
  if (!dateString) return 'Não disponível';
  const date = new Date(dateString);
  return date.toLocaleString('pt-PT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function confirmDelete() {
  showDeleteModal.value = true;
}

function cancelDelete() {
  showDeleteModal.value = false;
}

async function deleteContaCorrente() {
  try {
    await store.deleteContaCorrente(year, id);
    router.push('/conta-corrente/list');
  } catch (err) {
    console.error('Error deleting conta corrente:', err);
  }
}

// Lifecycle
onMounted(() => {
  // Add event listeners for user interaction
  window.addEventListener('click', handleUserInteraction);
  window.addEventListener('scroll', handleUserInteraction);
  window.addEventListener('keydown', handleUserInteraction);

  loadContaCorrente();
});

onBeforeUnmount(() => {
  cancelAutoRetry();
  window.removeEventListener('click', handleUserInteraction);
  window.removeEventListener('scroll', handleUserInteraction);
  window.removeEventListener('keydown', handleUserInteraction);
});
</script>

<style scoped>
.conta-corrente-detail {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.header-content h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.title-icon {
  font-size: 2rem;
}

.page-subtitle {
  color: var(--color-text-muted);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.status-alert {
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid;
  margin-bottom: 1rem;
}

.status-alert.paid {
  background: var(--color-success-light);
  border-color: var(--color-success);
  color: var(--color-success-dark);
}

.status-alert.overdue {
  background: var(--color-danger-light);
  border-color: var(--color-danger);
  color: var(--color-danger-dark);
}

.status-alert.due_today {
  background: var(--color-warning-light);
  border-color: var(--color-warning);
  color: var(--color-warning-dark);
}

.status-alert.due_soon {
  background: var(--color-info-light);
  border-color: var(--color-info);
  color: var(--color-info-dark);
}

.status-alert.pending {
  background: var(--color-background-muted);
  border-color: var(--color-border);
  color: var(--color-text-muted);
}

.alert-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.alert-icon {
  font-size: 1.5rem;
}

.alert-text strong {
  display: block;
  margin-bottom: 0.25rem;
}

.alert-text p {
  margin: 0;
  font-size: 0.875rem;
}

.info-grid {
  display: grid;
  gap: 2rem;
}

.info-section {
  background: var(--color-background-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.section-title {
  background: var(--color-background-muted);
  padding: 1rem 1.5rem;
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.section-icon {
  font-size: 1.25rem;
}

.info-content {
  padding: 1.5rem;
}

.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.info-row:last-child {
  margin-bottom: 0;
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
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 1rem;
  color: var(--color-text);
  font-weight: 500;
}

.info-value.primary {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary);
}

.info-value.currency {
  font-weight: 600;
  color: var(--color-success);
}

.info-value.description {
  line-height: 1.5;
  white-space: pre-wrap;
}

.info-value.paid {
  color: var(--color-success);
  font-weight: 600;
}

.info-value.overdue {
  color: var(--color-danger);
  font-weight: 600;
}

.info-value.due-today {
  color: var(--color-warning);
  font-weight: 600;
}

.type-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.type-badge.remota {
  background: var(--color-info-light);
  color: var(--color-info);
}

.type-badge.presencial {
  background: var(--color-success-light);
  color: var(--color-success);
}

.type-badge.outros {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.payment-status {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.payment-status.paid {
  background: var(--color-success-light);
  color: var(--color-success);
}

.payment-status.overdue {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.payment-status.pending {
  background: var(--color-background-muted);
  color: var(--color-text-muted);
}

.action-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  background: var(--color-background);
  color: var(--color-text);
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.btn-primary:hover {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.btn-secondary {
  background: var(--color-background-elevated);
  color: var(--color-text);
}

.btn-success {
  background: var(--color-success);
  color: white;
  border-color: var(--color-success);
}

.btn-success:hover {
  background: var(--color-success-dark);
  border-color: var(--color-success-dark);
}

.btn-danger {
  background: var(--color-danger);
  color: white;
  border-color: var(--color-danger);
}

.btn-danger:hover {
  background: var(--color-danger-dark);
  border-color: var(--color-danger-dark);
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-muted);
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

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top: 3px solid var(--color-primary);
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

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
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
  background: var(--color-background);
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  color: var(--color-text);
}

.modal-body {
  padding: 1rem 1.5rem;
}

.delete-item-info {
  background: var(--color-background-elevated);
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
  color: var(--color-text);
}

.warning-text {
  color: var(--color-danger);
  font-size: 0.875rem;
  margin-top: 1rem;
}

.modal-actions {
  padding: 1rem 1.5rem 1.5rem;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .conta-corrente-detail {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: stretch;
  }

  .info-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn {
    justify-content: center;
  }
}
</style>

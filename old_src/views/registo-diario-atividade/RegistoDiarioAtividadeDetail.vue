<template>
  <div class="registo-detail-container">
    <!-- Error message -->
    <div
      v-if="error"
      class="error-message"
    >
      <div class="error-content">
        <span class="error-text">{{ error }}</span>
        <button
          class="error-close"
          @click="clearError"
        >
          &times;
        </button>
      </div>
    </div>

    <!-- Loading overlay -->
    <div
      v-if="loading"
      class="loading-overlay"
    >
      <div class="loading-spinner" />
      <p>Carregando registo...</p>
    </div>

    <BackButton variant="inline" />

    <div
      v-if="registro"
      class="detail-container"
    >
      <!-- Header -->
      <div class="detail-header">
        <div class="header-content">
          <h1 class="page-title">
            📋 Registo Diário de Atividade
          </h1>
          <p class="page-subtitle">
            {{ formatDate(registro.dataRegistro) }} • {{ registro.cliente }}
          </p>
        </div>
        <div class="header-actions">
          <router-link
            :to="{
              name: 'registo-diario-atividade-edit',
              params: { year: $route.params.year, id: $route.params.id },
            }"
            class="btn btn-primary"
          >
            ✏️ Editar
          </router-link>
          <button
            class="btn btn-danger"
            @click="confirmDelete"
          >
            🗑️ Eliminar
          </button>
        </div>
      </div>

      <!-- Quick Info Cards -->
      <div class="quick-info-grid">
        <div class="info-card">
          <div class="info-card-icon">
            📅
          </div>
          <div class="info-card-content">
            <div class="info-card-label">
              Data do Registo
            </div>
            <div class="info-card-value">
              {{ formatDateTime(registro.dataRegistro) || 'N/A' }}
            </div>
          </div>
        </div>
        <div
          v-if="registro.totalHorasCalculado || registro.totalHoras"
          class="info-card"
        >
          <div class="info-card-icon">
            ⏱️
          </div>
          <div class="info-card-content">
            <div class="info-card-label">
              Total de Horas
            </div>
            <div class="info-card-value highlight">
              {{ registro.totalHorasCalculado || registro.totalHoras || 'N/A' }}
            </div>
          </div>
        </div>
        <div
          v-if="registro.respRegisto"
          class="info-card"
        >
          <div class="info-card-icon">
            👤
          </div>
          <div class="info-card-content">
            <div class="info-card-label">
              Responsável
            </div>
            <div class="info-card-value">
              {{ registro.respRegisto || 'N/A' }}
            </div>
          </div>
        </div>
        <div class="info-card">
          <div class="info-card-icon">
            {{ registro.internoOuExterno === 'INTERNO' ? '🏢' : '🚗' }}
          </div>
          <div class="info-card-content">
            <div class="info-card-label">
              Tipo
            </div>
            <div class="info-card-value">
              <span
                class="type-badge"
                :class="{
                  interno: registro.internoOuExterno === 'INTERNO',
                  externo: registro.internoOuExterno === 'EXTERNO',
                }"
              >
                {{ registro.internoOuExterno || 'N/A' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Primary Activity -->
      <div class="detail-section">
        <div class="section-header">
          <h2 class="section-title">
            🎯 Atividade Principal
          </h2>
        </div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-row">
              <div class="info-item">
                <label class="info-label">Cliente</label>
                <div class="info-value">
                  {{ registro.cliente || 'N/A' }}
                </div>
              </div>
              <div class="info-item">
                <label class="info-label">Tipo de Atividade</label>
                <div class="info-value">
                  <span
                    class="type-badge"
                    :class="{
                      interno: registro.internoOuExterno === 'INTERNO',
                      externo: registro.internoOuExterno === 'EXTERNO',
                    }"
                  >
                    {{ registro.internoOuExterno || 'N/A' }}
                  </span>
                </div>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <label class="info-label">Assunto</label>
                <div class="info-value">
                  {{ registro.assunto || 'N/A' }}
                </div>
              </div>
              <div class="info-item">
                <label class="info-label">Responsável</label>
                <div class="info-value">
                  {{ registro.respRegisto || 'N/A' }}
                </div>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <label class="info-label">Hora de Início</label>
                <div class="info-value">
                  {{ registro.horaInicio || 'N/A' }}
                </div>
              </div>
              <div class="info-item">
                <label class="info-label">Hora de Fim</label>
                <div class="info-value">
                  {{ registro.horaFim || 'N/A' }}
                </div>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <label class="info-label">Tempo de Pausa</label>
                <div class="info-value">
                  {{ registro.tempoPausa || 'N/A' }} min
                </div>
              </div>
              <div class="info-item highlight-item">
                <label class="info-label">Total de Horas (Calculado)</label>
                <div class="info-value highlight">
                  {{ registro.totalHorasCalculado || 'N/A' }}
                </div>
              </div>
            </div>
            <div
              v-if="registro.descricao"
              class="info-row full-width"
            >
              <div class="info-item">
                <label class="info-label">Descrição</label>
                <div class="description-text">
                  {{ registro.descricao || 'N/A' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Secondary Activities -->
      <div
        v-if="registro.teveCliente2 || registro.cliente2"
        class="detail-section"
      >
        <div class="section-header">
          <h2 class="section-title">
            👥 Atividades Secundárias
          </h2>
        </div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-row">
              <div class="info-item">
                <label class="info-label">Cliente 2</label>
                <div class="info-value">
                  {{ registro.cliente2 || 'N/A' }}
                </div>
              </div>
              <div class="info-item">
                <label class="info-label">Tipo de Atividade</label>
                <div class="info-value">
                  {{ registro.interOuExter2 || 'N/A' }}
                </div>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <label class="info-label">Assunto</label>
                <div class="info-value">
                  {{ registro.assunto2 || 'N/A' }}
                </div>
              </div>
              <div class="info-item">
                <label class="info-label">Total de Horas</label>
                <div class="info-value">
                  {{ registro.totalHoras2 || 'N/A' }}
                </div>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <label class="info-label">Responsável</label>
                <div class="info-value">
                  {{ registro.respRegisto2 || 'N/A' }}
                </div>
              </div>
              <div class="info-item">
                <label class="info-label">Folha de Obra</label>
                <div class="info-value">
                  {{ registro.folhaObra2 ? 'Sim' : 'Não' }}
                </div>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <label class="info-label">Assistência Remota</label>
                <div class="info-value">
                  {{ registro.assistRemota2 ? 'Sim' : 'Não' }}
                </div>
              </div>
            </div>
            <div
              v-if="registro.descricao2"
              class="info-row full-width"
            >
              <div class="info-item">
                <label class="info-label">Descrição</label>
                <div class="description-text">
                  {{ registro.descricao2 || 'N/A' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Distances and Displacements -->
      <div
        v-if="registro.internoOuExterno === 'EXTERNO' && (registro.kmsSaida || registro.kmsChegada)"
        class="detail-section"
      >
        <div class="section-header">
          <h2 class="section-title">
            🚗 Distâncias e Deslocações
          </h2>
        </div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-row">
              <div class="info-item">
                <label class="info-label">Kms Saída</label>
                <div class="info-value">
                  {{ registro.kmsSaidaSede || 'N/A' }}
                </div>
              </div>
              <div class="info-item">
                <label class="info-label">Kms Chegada</label>
                <div class="info-value">
                  {{ registro.kmsChegadaSede || 'N/A' }}
                </div>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <label class="info-label">Hora Saída</label>
                <div class="info-value">
                  {{ registro.horaSaida || 'N/A' }}
                </div>
              </div>
              <div class="info-item">
                <label class="info-label">Hora Chegada</label>
                <div class="info-value">
                  {{ registro.horaChegada || 'N/A' }}
                </div>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <label class="info-label">Kms Abastecimento</label>
                <div class="info-value">
                  {{ registro.kmsAbastecimento || 'N/A' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Activities -->
      <div
        v-if="registro.atividadesAdicionais && registro.atividadesAdicionais.length > 0"
        class="detail-section"
      >
        <div class="section-header">
          <h2 class="section-title">
            ➕ Atividades Adicionais
          </h2>
        </div>
        <div class="section-content">
          <div class="additional-activities-list">
            <div
              v-for="(atividade, index) in registro.atividadesAdicionais"
              :key="index"
              class="activity-card"
              :class="{
                'activity-folha-obra': atividade.tipo === 'FOLHA DE OBRA',
                'activity-assistencia-remota': atividade.tipo === 'ASSISTENCIA REMOTA',
              }"
            >
              <div class="activity-card-header">
                <div class="activity-header-left">
                  <h3 class="activity-title">
                    Atividade {{ index + 1 }}
                  </h3>
                </div>
                <span
                  class="activity-type-badge"
                  :class="{
                    'badge-folha-obra': atividade.tipo === 'FOLHA DE OBRA',
                    'badge-assistencia-remota': atividade.tipo === 'ASSISTENCIA REMOTA',
                  }"
                >
                  {{
                    atividade.tipo === 'FOLHA DE OBRA'
                      ? '📄 Folha de Obra'
                      : '💻 Assistência Remota'
                  }}
                </span>
              </div>
              <div class="info-grid">
                <div class="info-row">
                  <div class="info-item">
                    <label class="info-label">Referência</label>
                    <div class="info-value">
                      {{ atividade.referencia || 'N/A' }}
                    </div>
                  </div>
                  <div class="info-item">
                    <label class="info-label">Cliente</label>
                    <div class="info-value">
                      {{ atividade.cliente || 'N/A' }}
                    </div>
                  </div>
                </div>
                <div class="info-row">
                  <div class="info-item">
                    <label class="info-label">Tipo de Atividade</label>
                    <div class="info-value">
                      {{ atividade.tipoAtividade || 'N/A' }}
                    </div>
                  </div>
                  <div class="info-item">
                    <label class="info-label">Assunto</label>
                    <div class="info-value">
                      {{ atividade.assunto || 'N/A' }}
                    </div>
                  </div>
                </div>
                <div class="info-row">
                  <div class="info-item">
                    <label class="info-label">Hora de Início</label>
                    <div class="info-value">
                      {{ atividade.horaInicio || 'N/A' }}
                    </div>
                  </div>
                  <div class="info-item">
                    <label class="info-label">Hora de Fim</label>
                    <div class="info-value">
                      {{ atividade.horaFim || 'N/A' }}
                    </div>
                  </div>
                </div>
                <div class="info-row">
                  <div class="info-item">
                    <label class="info-label">Tempo de Pausa</label>
                    <div class="info-value">
                      {{ atividade.tempoPausa || 'N/A' }} min
                    </div>
                  </div>
                  <div class="info-item">
                    <label class="info-label">Total de Horas</label>
                    <div class="info-value">
                      {{ atividade.totalHoras || 'N/A' }}
                    </div>
                  </div>
                </div>
                <div class="info-row">
                  <div class="info-item">
                    <label class="info-label">Responsável</label>
                    <div class="info-value">
                      {{ atividade.responsavel || 'N/A' }}
                    </div>
                  </div>
                </div>
                <div
                  v-if="atividade.descricao"
                  class="info-row full-width"
                >
                  <div class="info-item">
                    <label class="info-label">Descrição</label>
                    <div class="description-text">
                      {{ atividade.descricao || 'N/A' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- System Information -->
      <div class="detail-section system-info">
        <div class="section-header">
          <h2 class="section-title">
            ℹ️ Informações do Sistema
          </h2>
        </div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-row">
              <div class="info-item">
                <label class="info-label">Criado em</label>
                <div class="info-value">
                  {{ formatDateTime(registro.createdAt) || 'N/A' }}
                </div>
              </div>
              <div class="info-item">
                <label class="info-label">Última Atualização</label>
                <div class="info-value">
                  {{ formatDateTime(registro.updatedAt) || 'N/A' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!loading"
      class="empty-state"
    >
      <div class="empty-icon">
        📋
      </div>
      <h3>Registo não encontrado</h3>
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
          :to="{ name: 'registo-diario-atividade-list' }"
          class="btn btn-secondary"
        >
          ← Voltar à Lista
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
        <h3>Confirmar Eliminação</h3>
        <p>
          Tem a certeza que pretende eliminar o registo de
          <strong>{{ registro?.cliente }}</strong>?
        </p>
        <p class="warning-text">
          Esta ação não pode ser desfeita.
        </p>
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
            @click="deleteRegistro"
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
import { useRegistoDiarioAtividadeStore } from '@/stores/registo-diario-atividade';
import BackButton from '@/components/BackButton.vue';

// Router
const route = useRoute();
const router = useRouter();

// Store
const store = useRegistoDiarioAtividadeStore();

// Local state
const showDeleteModal = ref(false);
const autoRetryCountdown = ref(0);
const userInteractionCancelled = ref(false);
const retryTimeoutId = ref(null);

// Computed properties
const registro = computed(() => store.selectedRegistro);
const loading = computed(() => store.loading);
const error = computed(() => store.error);

// Methods
const confirmDelete = () => {
  showDeleteModal.value = true;
};

const cancelDelete = () => {
  showDeleteModal.value = false;
};

const deleteRegistro = async () => {
  if (!registro.value) return;

  try {
    await store.deleteRegistro(route.params.year, registro.value.id);
    router.push({ name: 'registo-diario-atividade-list' });
  } catch (error) {
    console.error('Delete failed:', error);
    cancelDelete();
  }
};

const clearError = () => {
  store.clearError();
};

const formatDate = dateString => {
  return store.formatDate(dateString);
};

const formatDateTime = dateString => {
  return store.formatDateTime(dateString);
};

const retryLoad = () => {
  userInteractionCancelled.value = true;
  cancelAutoRetry();
  loadRegistro();
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
      loadRegistro();
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

// Lifecycle
onMounted(async () => {
  // Add event listeners for user interaction
  window.addEventListener('click', handleUserInteraction);
  window.addEventListener('scroll', handleUserInteraction);
  window.addEventListener('keydown', handleUserInteraction);

  await loadRegistro();
});

onBeforeUnmount(() => {
  cancelAutoRetry();
  window.removeEventListener('click', handleUserInteraction);
  window.removeEventListener('scroll', handleUserInteraction);
  window.removeEventListener('keydown', handleUserInteraction);
});

const loadRegistro = async () => {
  const { year, id } = route.params;

  try {
    store.clearError();
    await store.fetchRegistroById(year, id);
    // If successful, cancel any pending retries
    cancelAutoRetry();
  } catch (error) {
    console.error('Failed to fetch registro:', error);
    // Check if it's a 404 or "not found" error
    const isNotFound =
      error?.message?.toLowerCase().includes('not found') ||
      store.error?.toLowerCase().includes('not found');

    if (isNotFound && !userInteractionCancelled.value) {
      // Start auto-retry countdown
      startAutoRetry();
    }
  }
};

// Watch for successful data load to cancel retries
watch(
  () => registro.value?.id,
  newId => {
    if (newId) {
      cancelAutoRetry();
      userInteractionCancelled.value = false;
    }
  }
);
</script>

<style scoped>
:root {
  --color-primary: var(--primary-color);
  --color-primary-dark: var(--primary-hover);
  --color-secondary: #34495e;
  --color-background: #ffffff;
  --color-background-elevated: #f8fafa;
  --color-background-muted: #f1f5f5;
  --color-text: #2c3e50;
  --color-text-muted: #7f8c8d;
  --color-border: #e1e8ed;
  --color-success: #27ae60;
  --color-success-light: #d5f5e3;
  --color-warning: #f39c12;
  --color-warning-light: #fdf2e3;
  --color-danger: #e74c3c;
  --color-danger-light: #fadbd8;
  --color-info: #3498db;
  --color-info-light: #d6eaf8;
}

.registo-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  background: #f5f5f5;
  min-height: 100vh;
}

.detail-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-header {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  border: 1px solid var(--color-border);
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 1.5rem;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.page-subtitle {
  color: var(--color-text-muted);
  font-size: 0.95rem;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.quick-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.info-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.info-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.info-card-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.info-card-content {
  flex: 1;
}

.info-card-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.info-card-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.info-card-value.highlight {
  color: var(--color-primary);
  font-size: 1.1rem;
}

.type-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.type-badge.interno {
  background: var(--color-info-light);
  color: var(--color-info);
}

.type-badge.externo {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.detail-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--color-border);
}

.section-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--color-border);
}

.section-title {
  font-size: 1.25rem;
  color: var(--color-text);
  margin: 0;
  font-weight: 600;
}

.section-content {
  margin-top: 1rem;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.info-row.full-width {
  grid-template-columns: 1fr;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item.highlight-item .info-value {
  color: var(--color-primary);
  font-weight: 700;
  font-size: 1.1rem;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 1rem;
  color: var(--color-text);
  font-weight: 500;
}

.info-value.highlight {
  color: var(--color-primary);
  font-weight: 700;
  font-size: 1.1rem;
}

.description-text {
  background: var(--color-background-muted);
  padding: 1rem;
  border-radius: 8px;
  white-space: pre-wrap;
  line-height: 1.6;
  color: var(--color-text);
  margin-top: 0.5rem;
}

.activity-card {
  background: var(--color-background-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  transition: all 0.2s ease;
}

.activity-card.activity-folha-obra {
  border-left: 4px solid var(--color-success);
  background: rgba(39, 174, 96, 0.05);
}

.activity-card.activity-assistencia-remota {
  border-left: 4px solid var(--color-info);
  background: rgba(52, 152, 219, 0.05);
}

.activity-card-header {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.activity-header-left {
  flex: 1;
}

.activity-title {
  font-size: 1rem;
  color: var(--color-text);
  margin: 0;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.activity-type-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  color: #000000;
}

.activity-type-badge.badge-folha-obra {
  background: rgba(39, 174, 96, 0.2);
  border: 2px solid var(--color-success);
  color: #000000;
}

.activity-type-badge.badge-assistencia-remota {
  background: rgba(52, 152, 219, 0.2);
  border: 2px solid var(--color-info);
  color: #000000;
}

.additional-activities-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.system-info {
  background: var(--color-background-muted);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.875rem;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

.btn-danger {
  background: var(--color-danger);
  color: white;
  border-color: var(--color-danger);
}

.btn-danger:hover {
  background: #c0392b;
  border-color: #c0392b;
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--color-text-muted);
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 1rem 0;
  color: var(--color-text);
}

.empty-state p {
  margin: 0 0 2rem 0;
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
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-style: italic;
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
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.warning-text {
  color: #dc3545;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.modal-actions .btn {
  min-width: 100px;
  background: white;
  border: 1px solid #ddd;
}

.modal-actions .btn-secondary {
  background: #6c757d !important;
  color: white !important;
  border-color: #6c757d !important;
}

.modal-actions .btn-secondary:hover {
  background: #5a6268 !important;
  border-color: #5a6268 !important;
}

.modal-actions .btn-danger {
  background: #dc3545 !important;
  color: white !important;
  border-color: #dc3545 !important;
}

.modal-actions .btn-danger:hover {
  background: #c82333 !important;
  border-color: #c82333 !important;
}

.modal-actions .btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-message {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: var(--color-danger-light);
  border: 1px solid var(--color-danger);
  border-radius: 8px;
  padding: 1rem;
  max-width: 400px;
  z-index: 1000;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-text {
  flex: 1;
  color: var(--color-danger);
}

.error-close {
  background: none;
  border: none;
  color: var(--color-danger);
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1.25rem;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 1000;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .registo-detail-container {
    padding: 0.5rem;
  }

  .detail-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .header-actions .btn {
    width: 100%;
    justify-content: center;
  }

  .quick-info-grid {
    grid-template-columns: 1fr;
  }

  .info-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .info-card {
    flex-direction: column;
    text-align: center;
  }

  .info-card-icon {
    font-size: 2.5rem;
  }
}
</style>

<template>
  <ContentDetailTemplate
    :item="remoteAssistance"
    :is-loading="isLoading"
    :error="error"
    back-route="/remote-assistance"
    :show-edit-button="true"
    :show-delete-button="true"
    :show-meta-bar="true"
    :show-audit-trail="true"
    :show-mobile-actions="true"
    :get-title="getRemoteAssistanceTitle"
    :get-subtitle="getRemoteAssistanceSubtitle"
    :get-status="getRemoteAssistanceStatus"
    delete-button-text="Eliminar"
    confirm-delete-title="Confirmar Eliminação"
    :confirm-delete-message="confirmDeleteMessage"
    @edit="handleEdit"
    @delete="handleDelete"
    @back="handleBack"
    @clear-error="clearError"
  >
    <!-- Custom content sections -->
    <template #content="{ item }">
      <div v-if="item && item.data" class="space-y-6">
        <!-- Client Information Section -->
        <RelationInfoDisplay
          v-if="item.relations?.client"
          :relation-data="item.relations.client"
          relation-type="client"
          :relation-id="item.data.clientId"
          custom-display-name="Informação do Cliente"
        />

        <!-- Basic Information Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Informação Básica</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-grid">
                <div class="detail-item">
                  <label class="detail-label">Tipo de Assistência</label>
                  <div class="detail-value">
                    <span
                      class="assistance-type-badge"
                      :class="getAssistanceTypeClass(item.data.tipoAssistencia)"
                    >
                      {{ item.data.tipoAssistencia || '-' }}
                    </span>
                  </div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Técnico Responsável</label>
                  <div class="detail-value">{{ item.data.tecnicoResponsavel || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Quem Atendeu</label>
                  <div class="detail-value">{{ item.data.quemAtendeu || '-' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Date and Time Information Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Data e Horário</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-grid">
                <div class="detail-item">
                  <label class="detail-label">Data do Pedido</label>
                  <div class="detail-value">{{ formatDateForDisplay(item.data.dataPedido) }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Data da Assistência</label>
                  <div class="detail-value">
                    {{ formatDateForDisplay(item.data.dataAssistencia) }}
                  </div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Início da Assistência</label>
                  <div class="detail-value">
                    {{ formatTimeForDisplay(item.data.inicioAssistencia) }}
                  </div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Fim da Assistência</label>
                  <div class="detail-value">
                    {{ formatTimeForDisplay(item.data.fimAssistencia) }}
                  </div>
                </div>
                <div v-if="calculatedDuration" class="detail-item">
                  <label class="detail-label">Duração Total</label>
                  <div class="detail-value duration-display">
                    <svg
                      class="w-4 h-4 text-gray-400 inline mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {{ calculatedDuration }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Description Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Descrição</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="space-y-4">
                <div class="detail-item">
                  <label class="detail-label">Motivo do Pedido</label>
                  <div class="detail-value whitespace-pre-line">
                    {{ item.data.motivoPedido || '-' }}
                  </div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Relatório da Assistência</label>
                  <div class="detail-value whitespace-pre-line">
                    {{ item.data.relatorioAssistencia || '-' }}
                  </div>
                </div>
                <div v-if="item.data.resolvido && item.data.relatorio" class="detail-item">
                  <label class="detail-label">Relatório Final</label>
                  <div class="detail-value whitespace-pre-line">{{ item.data.relatorio }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Values and Pricing Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Valores</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="space-y-4">
                <!-- Main value display -->
                <div class="value-display-card">
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="detail-label">Valor da Assistência</label>
                      <div class="value-amount">
                        {{ formatCurrency(item.data.valorAssist || 0) }}
                        <span v-if="!hasBillableValue(item.data)" class="value-note"
                          >(sem custo)</span
                        >
                      </div>
                    </div>
                    <div class="value-status">
                      <span v-if="item.data.contrato" class="status-badge status-badge--contract">
                        Contrato
                      </span>
                      <span v-if="item.data.garantia" class="status-badge status-badge--warranty">
                        Garantia
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Pricing breakdown (if billable) -->
                <div
                  v-if="hasBillableValue(item.data) && pricingBreakdown"
                  class="pricing-breakdown"
                >
                  <h3 class="text-sm font-semibold text-gray-900 mb-3">Detalhamento do Valor</h3>
                  <div class="breakdown-grid">
                    <div v-if="pricingBreakdown.businessHours > 0" class="breakdown-item">
                      <label class="breakdown-label">Horário Comercial (09:00-18:00)</label>
                      <div class="breakdown-value">
                        {{ formatHours(pricingBreakdown.businessHours) }} ×
                        {{ formatCurrency(REMOTE_ASSISTANCE_CONSTANTS.PRICE_BUSINESS_HOURS) }}/h =
                        {{ formatCurrency(pricingBreakdown.businessHoursValue) }}
                      </div>
                    </div>
                    <div v-if="pricingBreakdown.afterHours > 0" class="breakdown-item">
                      <label class="breakdown-label">Fora do Horário Comercial</label>
                      <div class="breakdown-value">
                        {{ formatHours(pricingBreakdown.afterHours) }} ×
                        {{ formatCurrency(REMOTE_ASSISTANCE_CONSTANTS.PRICE_AFTER_HOURS) }}/h =
                        {{ formatCurrency(pricingBreakdown.afterHoursValue) }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Pricing note -->
                <div class="pricing-note">
                  <svg
                    class="w-4 h-4 text-blue-500 inline mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span class="text-sm text-gray-600">
                    Tarifário:
                    {{ formatCurrency(REMOTE_ASSISTANCE_CONSTANTS.PRICE_BUSINESS_HOURS) }}/hora
                    (horário comercial),
                    {{ formatCurrency(REMOTE_ASSISTANCE_CONSTANTS.PRICE_AFTER_HOURS) }}/hora (fora
                    do horário comercial)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Estado</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="status-grid">
                <div class="status-item">
                  <label class="status-label">Contrato</label>
                  <div class="status-value" :class="{ active: item.data.contrato }">
                    <svg
                      v-if="item.data.contrato"
                      class="w-4 h-4 text-green-500 inline mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <svg
                      v-else
                      class="w-4 h-4 text-gray-400 inline mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    {{ item.data.contrato ? 'Sim' : 'Não' }}
                  </div>
                </div>
                <div class="status-item">
                  <label class="status-label">Garantia</label>
                  <div class="status-value" :class="{ active: item.data.garantia }">
                    <svg
                      v-if="item.data.garantia"
                      class="w-4 h-4 text-green-500 inline mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <svg
                      v-else
                      class="w-4 h-4 text-gray-400 inline mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    {{ item.data.garantia ? 'Sim' : 'Não' }}
                  </div>
                </div>
                <div class="status-item">
                  <label class="status-label">Resolvido</label>
                  <div class="status-value" :class="{ active: item.data.resolvido }">
                    <svg
                      v-if="item.data.resolvido"
                      class="w-4 h-4 text-green-500 inline mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <svg
                      v-else
                      class="w-4 h-4 text-orange-500 inline mr-1"
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
                    {{ item.data.resolvido ? 'Sim' : 'Pendente' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Attachments Section -->
        <div v-if="item.data.anexos" class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Anexos</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-value whitespace-pre-line">{{ item.data.anexos }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </ContentDetailTemplate>

  <!-- Delete Confirmation Dialog -->
  <ConfirmationDialog
    :is-open="showDeleteConfirm"
    :title="confirmDeleteTitle"
    :message="confirmDeleteMessage"
    :is-loading="isDeleting"
    confirm-text="Confirmar"
    cancel-text="Cancelar"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
    @close="cancelDelete"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { RemoteAssistance, BaseContent } from '@clever/shared';
import ContentDetailTemplate from '@/components/common/ContentDetailTemplate.vue';
import RelationInfoDisplay from '@/components/common/RelationInfoDisplay.vue';
import ConfirmationDialog from '@/components/common/ConfirmationDialog.vue';
import { useApi } from '@/composables/useApi';
import { useErrorHandler } from '@/composables/useErrorHandler';
import {
  formatDateForDisplay,
  formatTimeForDisplay,
  calculateTotalHours,
  calculateAssistanceValue,
  hasBillableValue,
  REMOTE_ASSISTANCE_CONSTANTS,
} from '@clever/shared/types/remote-assistance/validation';

// Router
const route = useRoute();
const router = useRouter();

// Composables
const api = useApi<RemoteAssistance>('remote-assistance');
const errorHandler = useErrorHandler();

// State
const remoteAssistance = ref<RemoteAssistance | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Delete state
const isDeleting = ref(false);
const showDeleteConfirm = ref(false);
const confirmDeleteTitle = ref('Confirmar Eliminação');
const confirmDeleteMessage = ref('');

// Clear error function
const clearError = () => {
  error.value = null;
};

// Display functions for ContentDetailTemplate
const getRemoteAssistanceTitle = (item: BaseContent | null): string => {
  if (!item || !item.data) return 'Assistência Remota';
  const assistance = item as RemoteAssistance;

  // Generate assistance number based on date and UUID
  const year = assistance.data.dataAssistencia
    ? new Date(assistance.data.dataAssistencia).getFullYear()
    : new Date().getFullYear();
  const shortId = assistance.uuid.slice(0, 8).toUpperCase();

  return `AR-${year}-${shortId}`;
};

const getRemoteAssistanceSubtitle = (item: BaseContent | null): string => {
  if (!item || !item.data) return '';
  const assistance = item as RemoteAssistance;
  const parts = [];

  if (assistance.data.tipoAssistencia) {
    parts.push(assistance.data.tipoAssistencia);
  }

  if (assistance.data.dataAssistencia) {
    parts.push(formatDateForDisplay(assistance.data.dataAssistencia));
  }

  if (assistance.data.tecnicoResponsavel) {
    parts.push(assistance.data.tecnicoResponsavel);
  }

  return parts.join(' • ');
};

const getRemoteAssistanceStatus = (item: BaseContent | null): string => {
  if (!item || !item.data) return 'Assistência';
  const assistance = item as RemoteAssistance;
  const status = [];

  if (assistance.data.resolvido) {
    status.push('Resolvido');
  } else {
    status.push('Pendente');
  }

  if (assistance.data.contrato) {
    status.push('Contrato');
  } else if (assistance.data.garantia) {
    status.push('Garantia');
  } else {
    status.push('Faturável');
  }

  return status.join(' • ');
};

// Computed properties
const calculatedDuration = computed(() => {
  if (
    !remoteAssistance.value?.data.inicioAssistencia ||
    !remoteAssistance.value?.data.fimAssistencia
  ) {
    return null;
  }

  return calculateTotalHours(
    remoteAssistance.value.data.inicioAssistencia,
    remoteAssistance.value.data.fimAssistencia
  );
});

const pricingBreakdown = computed(() => {
  if (
    !remoteAssistance.value?.data.inicioAssistencia ||
    !remoteAssistance.value?.data.fimAssistencia
  ) {
    return null;
  }

  return calculateAssistanceValue(
    remoteAssistance.value.data.inicioAssistencia,
    remoteAssistance.value.data.fimAssistencia,
    remoteAssistance.value.data.contrato,
    remoteAssistance.value.data.garantia
  );
});

// Helper functions
const getAssistanceTypeClass = (type: string): string => {
  const typeClasses: Record<string, string> = {
    REMOTA: 'assistance-type-badge--remote',
    TELEFÓNICA: 'assistance-type-badge--phone',
    TELEMÓVEL: 'assistance-type-badge--mobile',
  };

  return typeClasses[type] || 'assistance-type-badge--default';
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatHours = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (minutes === 0) {
    return `${wholeHours}h`;
  }

  return `${wholeHours}h${minutes.toString().padStart(2, '0')}m`;
};

// Event handlers
const handleEdit = (item: BaseContent | null) => {
  if (!item) return;
  const assistance = item as RemoteAssistance;
  router.push(`/remote-assistance/${assistance.uuid}/editar`);
};

const handleBack = () => {
  router.push('/remote-assistance');
};

// Delete functionality
const getDeleteConfirmationMessage = (): string => {
  if (!remoteAssistance.value)
    return 'Tem a certeza que pretende eliminar esta assistência remota?';

  const assistanceId = getRemoteAssistanceTitle(remoteAssistance.value);
  const clientName =
    remoteAssistance.value.relations?.client &&
    typeof remoteAssistance.value.relations.client === 'object' &&
    'nomeEmpresa' in remoteAssistance.value.relations.client
      ? remoteAssistance.value.relations.client.nomeEmpresa
      : 'Cliente';

  return `Tem a certeza que pretende eliminar a assistência "${assistanceId}" para ${clientName}?`;
};

const handleDelete = () => {
  if (!remoteAssistance.value) return;

  confirmDeleteMessage.value = getDeleteConfirmationMessage();
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  if (!remoteAssistance.value) return;

  try {
    isDeleting.value = true;

    console.log(
      'Attempting to delete remote assistance:',
      JSON.stringify(
        {
          uuid: remoteAssistance.value.uuid,
          type: remoteAssistance.value.data.tipoAssistencia,
          client: remoteAssistance.value.data.clientId,
        },
        null,
        2
      )
    );

    const success = await api.remove(remoteAssistance.value.uuid);

    if (api.error.value) {
      console.error(
        'Delete operation failed with API error:',
        JSON.stringify(api.error.value, null, 2)
      );
      error.value =
        typeof api.error.value === 'string'
          ? api.error.value
          : api.error.value.message || 'Erro ao eliminar assistência remota';
      showDeleteConfirm.value = false;
      return;
    }

    if (success) {
      console.log('Remote assistance deleted successfully, navigating to list view');
      router.push('/remote-assistance');
    } else {
      console.error('Delete operation failed - useApi returned false');
      error.value = 'Não foi possível eliminar esta assistência remota.';
      showDeleteConfirm.value = false;
    }
  } catch (err) {
    console.error('Delete operation error:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao eliminar assistência remota';
    showDeleteConfirm.value = false;
  } finally {
    isDeleting.value = false;
  }
};

const cancelDelete = () => {
  showDeleteConfirm.value = false;
};

// Data loading
const loadRemoteAssistance = async () => {
  const assistanceId = route.params.uuid as string;

  if (!assistanceId) {
    error.value = 'ID da assistência remota não fornecido';
    return;
  }

  try {
    isLoading.value = true;
    clearError();

    console.log('Loading remote assistance:', JSON.stringify({ assistanceId }, null, 2));

    await api.fetchById(assistanceId);

    if (api.currentItem.value) {
      remoteAssistance.value = api.currentItem.value;
      console.log(
        'Remote assistance loaded successfully:',
        JSON.stringify(
          {
            uuid: remoteAssistance.value.uuid,
            type: remoteAssistance.value.data.tipoAssistencia,
            hasClientRelation: !!remoteAssistance.value.relations?.client,
          },
          null,
          2
        )
      );
    } else {
      throw new Error('Assistência remota não encontrada');
    }
  } catch (err) {
    console.error('Error loading remote assistance:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao carregar assistência remota';
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  loadRemoteAssistance();
});
</script>

<style scoped>
/* Remote assistance specific styling */
.assistance-type-badge {
  @apply px-2 py-1 rounded-full text-xs font-medium;
}

.assistance-type-badge--remote {
  @apply bg-blue-100 text-blue-800;
}

.assistance-type-badge--phone {
  @apply bg-green-100 text-green-800;
}

.assistance-type-badge--mobile {
  @apply bg-purple-100 text-purple-800;
}

.assistance-type-badge--default {
  @apply bg-gray-100 text-gray-800;
}

.duration-display {
  @apply flex items-center font-medium text-blue-600;
}

.value-display-card {
  @apply p-4 bg-gray-50 rounded-touch border border-gray-200;
}

.value-amount {
  @apply text-2xl font-bold text-gray-900;
}

.value-note {
  @apply text-sm font-normal text-gray-500 ml-2;
}

.value-status {
  @apply flex flex-col space-y-1;
}

.status-badge {
  @apply px-2 py-1 rounded text-xs font-medium;
}

.status-badge--contract {
  @apply bg-green-100 text-green-800;
}

.status-badge--warranty {
  @apply bg-blue-100 text-blue-800;
}

.pricing-breakdown {
  @apply p-4 bg-blue-50 rounded-touch border border-blue-200;
}

.breakdown-grid {
  @apply space-y-2;
}

.breakdown-item {
  @apply flex flex-col space-y-1;
}

.breakdown-label {
  @apply text-xs font-medium text-gray-600;
}

.breakdown-value {
  @apply text-sm text-gray-900 font-mono;
}

.pricing-note {
  @apply p-3 bg-blue-50 rounded-touch border border-blue-200;
}

.status-grid {
  @apply grid grid-cols-1 sm:grid-cols-3 gap-4;
}

.status-item {
  @apply flex flex-col space-y-1;
}

.status-label {
  @apply text-xs font-medium text-gray-500 uppercase tracking-wide;
}

.status-value {
  @apply text-sm font-medium text-gray-600 flex items-center;
}

.status-value.active {
  @apply text-green-600;
}

/* Detail grid responsive adjustments */
.detail-grid {
  @apply grid grid-cols-1 gap-4;
}

@media (min-width: 640px) {
  .detail-grid {
    @apply grid-cols-2;
  }
}

@media (min-width: 1024px) {
  .detail-grid {
    @apply grid-cols-3;
  }
}

.detail-item {
  @apply space-y-1;
}

.detail-item.col-span-full {
  grid-column: 1 / -1;
}

.detail-label {
  @apply text-xs font-medium text-gray-500 uppercase tracking-wide;
}

.detail-value {
  @apply text-sm text-gray-900 break-words;
}

/* Portuguese text optimization */
.detail-value,
.status-value,
.assistance-type-badge,
.status-badge {
  @apply text-portuguese;
}

/* Mobile-first responsive adjustments */
@media (max-width: 640px) {
  .status-grid {
    @apply grid-cols-1;
  }

  .value-display-card {
    @apply p-3;
  }

  .value-amount {
    @apply text-xl;
  }

  .pricing-breakdown {
    @apply p-3;
  }
}

/* Print styles */
@media print {
  .value-display-card,
  .pricing-breakdown,
  .pricing-note {
    @apply border border-gray-300 bg-white;
  }

  .assistance-type-badge,
  .status-badge {
    @apply border border-gray-300 bg-white text-black;
  }
}
</style>

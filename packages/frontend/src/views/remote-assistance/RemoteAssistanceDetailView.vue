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
        <ClientInfoSection :client-relation="remoteAssistance?.relations?.client" />

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
                  <div class="detail-value">{{ getTechnicianDisplayName(item.data.tecnicoResponsavel) }}</div>
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

        <!-- Contract Information Section (when payment method is Contrato) -->
        <div v-if="item.data.paymentMethod === 'Contrato'" class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200"
               :class="{
                 'border-red-200 bg-red-50': remoteAssistance?.relations?.contract && isRelationError(remoteAssistance.relations.contract),
                 'border-yellow-200 bg-yellow-50': !item.data.contractId
               }">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
              :class="{
                'border-red-200 bg-red-100': remoteAssistance?.relations?.contract && isRelationError(remoteAssistance.relations.contract),
                'border-yellow-200 bg-yellow-100': !item.data.contractId
              }"
            >
              <div class="flex items-center justify-between w-full">
                <div class="flex items-center flex-1 min-w-0">
                  <div class="flex-shrink-0 mr-3 text-gray-600"
                       :class="{
                         'text-red-600': remoteAssistance?.relations?.contract && isRelationError(remoteAssistance.relations.contract),
                         'text-yellow-600': !item.data.contractId
                       }">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h2 class="text-lg font-semibold text-gray-900"
                      :class="{
                        'text-red-900': remoteAssistance?.relations?.contract && isRelationError(remoteAssistance.relations.contract),
                        'text-yellow-900': !item.data.contractId
                      }">
                    Informação do Contrato
                  </h2>
                  <div v-if="remoteAssistance?.relations?.contract && isRelationError(remoteAssistance.relations.contract)" class="ml-2">
                    <svg
                      class="w-4 h-4 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                </div>
                
                <!-- Navigate to contract icon -->
                <button
                  v-if="remoteAssistance?.relations?.contract && !isRelationError(remoteAssistance.relations.contract)"
                  @click="navigateToContract"
                  class="flex-shrink-0 p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-full transition-colors"
                  style="min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center;"
                  title="Ver detalhes do contrato"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div class="p-4 sm:p-6">
              <!-- Contract not specified -->
              <div v-if="!item.data.contractId" class="text-center py-2">
                <p class="text-yellow-800 font-medium">Contrato não especificado</p>
              </div>
              
              <!-- Contract error -->
              <div v-else-if="remoteAssistance?.relations?.contract && isRelationError(remoteAssistance.relations.contract)" class="text-center py-2">
                <p class="text-red-800 font-medium mb-1">
                  {{ remoteAssistance.relations.contract.code === 404 ? 'Contrato não encontrado' : 'Erro ao carregar contrato' }}
                </p>
                <p class="text-red-600 text-sm">Código: {{ remoteAssistance.relations.contract.code }}</p>
              </div>
              
              <!-- Contract information -->
              <div v-else-if="remoteAssistance?.relations?.contract" class="detail-grid">
                <div class="detail-item col-span-full">
                  <label class="detail-label">Tipo de Contrato</label>
                  <div class="detail-value font-medium">
                    {{ getContractDisplayName(remoteAssistance.relations.contract) }}
                  </div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Período do Contrato</label>
                  <div class="detail-value">
                    {{ getContractDates(remoteAssistance.relations.contract) }}
                  </div>
                </div>
                <div v-if="remoteAssistance.relations.contract.paymentFrequency" class="detail-item">
                  <label class="detail-label">Frequência de Pagamento</label>
                  <div class="detail-value">
                    {{ remoteAssistance.relations.contract.paymentFrequency }}
                  </div>
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
import type { RemoteAssistance, BaseContent, TechnicianUser, ContentWithRelations } from '@clever/shared';
import { isRelationError } from '@clever/shared';
import ContentDetailTemplate from '@/components/common/ContentDetailTemplate.vue';
import ClientInfoSection from '@/components/common/ClientInfoSection.vue';
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
} from '@clever/shared';
import contractPlansConfig from '@/config/contract-plans.json';

// Router
const route = useRoute();
const router = useRouter();

// Composables
const api = useApi<ContentWithRelations<any>>('remote-assistance');
const errorHandler = useErrorHandler();

// State
const remoteAssistance = ref<ContentWithRelations<any> | null>(null);
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
  const assistance = item as ContentWithRelations<any>;

  // Generate assistance number based on date and UUID
  const year = assistance.data.dataAssistencia
    ? new Date(assistance.data.dataAssistencia).getFullYear()
    : new Date().getFullYear();
  const shortId = assistance.uuid.slice(0, 8).toUpperCase();

  return `AR-${year}-${shortId}`;
};

const getRemoteAssistanceSubtitle = (item: BaseContent | null): string => {
  if (!item || !item.data) return '';
  const assistance = item as ContentWithRelations<any>;
  const parts = [];

  if (assistance.data.tipoAssistencia) {
    parts.push(assistance.data.tipoAssistencia);
  }

  if (assistance.data.dataAssistencia) {
    parts.push(formatDateForDisplay(assistance.data.dataAssistencia));
  }

  if (assistance.data.tecnicoResponsavel) {
    parts.push(getTechnicianDisplayName(assistance.data.tecnicoResponsavel));
  }

  return parts.join(' • ');
};

const getRemoteAssistanceStatus = (item: BaseContent | null): string => {
  if (!item || !item.data) return 'Assistência';
  const assistance = item as ContentWithRelations<any>;
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

// Helper function to extract technician display name from TechnicianUser object
const getTechnicianDisplayName = (technician: TechnicianUser | string | undefined): string => {
  if (!technician) return '-';
  
  // Handle TechnicianUser object structure
  if (typeof technician === 'object' && technician.firstName && technician.lastName) {
    return `${technician.firstName} ${technician.lastName}`;
  }
  
  // Handle TechnicianUser object with only one name
  if (typeof technician === 'object') {
    if (technician.firstName) return technician.firstName;
    if (technician.lastName) return technician.lastName;
    // Fallback to userId if no names available
    if (technician.userId) return `User ${technician.userId.slice(-8)}`;
  }
  
  // Handle legacy string format (backward compatibility)
  if (typeof technician === 'string') {
    return technician;
  }
  
  return '-';
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

// Contract helper functions
const getPlanName = (contractType: string, planId: string): string => {
  const config = contractPlansConfig as any;
  const typeConfig = config[contractType];
  if (!typeConfig || !typeConfig.plans) return planId;
  
  const plan = typeConfig.plans.find((p: any) => p.id === planId);
  return plan?.name || planId;
};

const getContractDisplayName = (contract: any): string => {
  if (!contract || typeof contract !== 'object') return 'Contrato não especificado';
  
  const parts: string[] = [];
  
  // Add CPA contract info if exists
  if (contract.hasCPAContract && contract.cpaContractType && contract.planIdCPA) {
    const planName = getPlanName(contract.cpaContractType, contract.planIdCPA);
    parts.push(`CPA: ${planName}`);
  }
  
  // Add S&H contract info if exists
  if (contract.hasSHContract && contract.shContractType && contract.planIdSH) {
    const planName = getPlanName(contract.shContractType, contract.planIdSH);
    parts.push(`S&H: ${planName}`);
  }
  
  return parts.length > 0 ? parts.join(' | ') : 'Contrato não especificado';
};

const getContractDates = (contract: any): string => {
  if (!contract || typeof contract !== 'object') return '-';
  
  // Try CPA contract dates first
  if (contract.hasCPAContract && contract.inicioContratoCPA) {
    const startDate = formatDateForDisplay(contract.inicioContratoCPA);
    const endDate = contract.fimContratoCPA ? formatDateForDisplay(contract.fimContratoCPA) : '';
    
    if (startDate && endDate) {
      return `${startDate} - ${endDate}`;
    } else if (startDate) {
      return `Início: ${startDate}`;
    }
  }
  
  // Try S&H contract dates
  if (contract.hasSHContract && contract.inicioContratoSH) {
    const startDate = formatDateForDisplay(contract.inicioContratoSH);
    const endDate = contract.fimContratoSH ? formatDateForDisplay(contract.fimContratoSH) : '';
    
    if (startDate && endDate) {
      return `${startDate} - ${endDate}`;
    } else if (startDate) {
      return `Início: ${startDate}`;
    }
  }
  
  return '-';
};

// Navigation handler for contract button
const navigateToContract = () => {
  if (remoteAssistance.value?.data?.contractId) {
    router.push(`/contracts/${remoteAssistance.value.data.contractId}`);
  }
};

// Event handlers
const handleEdit = (item: BaseContent | null) => {
  if (!item) return;
  const assistance = item as ContentWithRelations<any>;
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

    await api.fetchById(assistanceId);

    if (api.currentItem.value) {
      remoteAssistance.value = api.currentItem.value;
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

<template>
  <div class="remote-assistance-update-container">
    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <p>A carregar assistência remota...</p>
    </div>

    <!-- Error state -->
    <ErrorComponent v-if="error" :error="error" @close="clearError" />

    <!-- Content -->
    <div v-if="!loading && remoteAssistance" class="update-content">
      <!-- Form -->
      <ContentUpdateTemplate
        :item="remoteAssistance"
        content-type="remote-assistance"
        :form-sections="remoteAssistanceFormSections"
        :initial-data="initialFormData"
        :custom-validator="validateUpdateForm"
        :is-saving="apiLoading.updating.value"
        :error="error"
        edit-title="Atualizar Assistência Remota"
        subtitle="Editar informações da assistência remota"
        :cancel-route="`/remote-assistance/${remoteAssistance?.uuid}`"
        @update="handleUpdate"
        @clear-error="clearError"
      >
        <!-- Custom field templates -->
        <template #field-clientId="{ formData, error, updateFieldValue }">
          <ClientSearchInput
            :model-value="formData?.clientId || ''"
            :selected-client="selectedClient"
            :has-error="!!error"
            @update:model-value="value => updateFieldValue('clientId', value)"
            @client-selected="handleClientSelected"
          />
          <p v-if="error" class="form-error text-red-600 text-sm mt-1">
            {{ error }}
          </p>
        </template>

        <!-- Custom payment method radio buttons -->
        <template #field-paymentMethod="{ formData, error, updateFieldValue }">
          <div class="payment-method-selector">
            <label class="payment-label">Método de Pagamento</label>
            <div class="payment-options">
              <label
                v-for="method in paymentMethods"
                :key="method.value"
                :class="[
                  'payment-option',
                  formData?.paymentMethod === method.value ? 'selected' : '',
                ]"
              >
                <input
                  type="radio"
                  :value="method.value"
                  :checked="formData?.paymentMethod === method.value"
                  name="paymentMethod"
                  @change="updateFieldValue('paymentMethod', method.value)"
                />
                <span>{{ method.label }}</span>
              </label>
            </div>
            <p v-if="error" class="form-error text-red-600 text-sm mt-1">
              {{ error }}
            </p>
          </div>
        </template>

        <!-- Contract auto-fetch display (conditional on paymentMethod === 'Contrato') -->
        <template #field-contractId="{ formData, error, updateFieldValue }">
          <div v-if="isLoadingContracts" class="text-sm text-gray-500 py-2">
            A carregar contratos...
          </div>
          <div v-else-if="clientContracts.length === 0" class="text-sm text-red-600 py-2">
            Nenhum contrato encontrado para este cliente.
          </div>
          <div v-else>
            <!-- Simple dropdown if multiple contracts -->
            <select
              v-if="clientContracts.length > 1"
              :value="formData?.contractId || ''"
              class="form-input mb-2"
              :class="{ 'border-red-500': !!error }"
              @change="(e: Event) => updateFieldValue('contractId', (e.target as HTMLSelectElement).value)"
            >
              <option value="">Selecionar contrato...</option>
              <option
                v-for="contract in clientContracts"
                :key="contract.uuid"
                :value="contract.uuid"
              >
                {{ getContractDisplayName(contract) }}
              </option>
            </select>
            <!-- Contract info display -->
            <div v-if="selectedContractForDisplay" class="bg-green-50 border border-green-200 rounded-lg p-3">
              <div class="text-sm font-medium text-green-800">{{ getContractDisplayName(selectedContractForDisplay) }}</div>
              <div v-if="getContractDates(selectedContractForDisplay)" class="text-xs text-green-600 mt-1">
                Período: {{ getContractDates(selectedContractForDisplay) }}
              </div>
            </div>
          </div>
          <p v-if="error" class="form-error text-red-600 text-sm mt-1">
            {{ error }}
          </p>
        </template>

        <!-- Time input fields with automatic formatting and validation -->
        <template #field-inicioAssistencia="{ formData, error, updateFieldValue }">
          <input
            type="text"
            :value="formData?.inicioAssistencia || ''"
            placeholder="09:00"
            maxlength="5"
            class="form-input"
            :class="{ 'border-red-500': !!error }"
            @input="e => handleTimeInput(e, 'inicioAssistencia', updateFieldValue)"
            @blur="e => handleTimeBlur(e, 'inicioAssistencia', updateFieldValue)"
          />
          <p v-if="error" class="form-error text-red-600 text-sm mt-1">
            {{ error }}
          </p>
          <p class="form-help text-xs text-gray-500 mt-1">
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Formato HH:MM. As horas totais serão arredondadas para intervalos de 15 minutos.
          </p>
        </template>

        <template #field-fimAssistencia="{ formData, error, updateFieldValue }">
          <input
            type="text"
            :value="formData?.fimAssistencia || ''"
            placeholder="10:00"
            maxlength="5"
            class="form-input"
            :class="{ 'border-red-500': !!error }"
            @input="e => handleTimeInput(e, 'fimAssistencia', updateFieldValue)"
            @blur="e => handleTimeBlur(e, 'fimAssistencia', updateFieldValue)"
          />
          <p v-if="error" class="form-error text-red-600 text-sm mt-1">
            {{ error }}
          </p>
          <p class="form-help text-xs text-gray-500 mt-1">
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Formato HH:MM. As horas totais serão arredondadas para intervalos de 15 minutos.
          </p>
        </template>

        <!-- Total hours display field -->
        <template #field-horasTotais="{ formData }">
          <input
            type="text"
            :value="calculatedDuration || ''"
            placeholder="Calculado automaticamente"
            class="form-input bg-gray-100"
            disabled
            readonly
          />
          <p class="form-help text-xs text-gray-500 mt-1">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Calculado automaticamente com base no início e fim da assistência. Arredondado para intervalos de 15 minutos.
          </p>
        </template>

        <!-- Value calculation display section -->
        <template #after-section-dateTime="{ formData: slotFormData }">
          <div
            v-if="
              slotFormData?.inicioAssistencia && slotFormData?.fimAssistencia && calculatedDuration
            "
            class="calculation-section"
          >
            <h3>Cálculo Automático <span class="vat-note">(sem IVA)</span></h3>

            <!-- Duration display -->
            <div class="duration-display">
              <div class="duration-item">
                <span class="duration-label">Duração Total:</span>
                <span class="duration-value">
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
                </span>
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
                💶 Preço: 30€/hora (09:00-18:00) | 45€/hora (outras horas) - sem IVA
              </span>
            </div>

            <!-- Pricing breakdown (always shown) -->
            <div v-if="pricingBreakdown" class="pricing-breakdown">
              <div class="pricing-table">
                <div v-if="pricingBreakdown.businessHours > 0" class="pricing-row">
                  <span class="pricing-label">Horário Comercial (09:00-18:00):</span>
                  <span class="pricing-value">
                    {{ formatHours(pricingBreakdown.businessHours) }} ×
                    {{ formatCurrency(REMOTE_ASSISTANCE_CONSTANTS.PRICE_BUSINESS_HOURS) }}/h =
                    {{ formatCurrency(pricingBreakdown.businessHoursValue) }}
                  </span>
                </div>
                <div v-if="pricingBreakdown.afterHours > 0" class="pricing-row">
                  <span class="pricing-label">Fora do Horário Comercial:</span>
                  <span class="pricing-value">
                    {{ formatHours(pricingBreakdown.afterHours) }} ×
                    {{ formatCurrency(REMOTE_ASSISTANCE_CONSTANTS.PRICE_AFTER_HOURS) }}/h =
                    {{ formatCurrency(pricingBreakdown.afterHoursValue) }}
                  </span>
                </div>
                <div class="pricing-row total">
                  <span class="pricing-label">VALOR TOTAL:</span>
                  <span class="pricing-value">{{
                    formatCurrency(pricingBreakdown.totalValue)
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Contract/Warranty notice -->
            <div
              v-if="slotFormData?.paymentMethod === 'Contrato' || slotFormData?.paymentMethod === 'Garantia'"
              class="no-charge-notice"
            >
              <svg
                class="w-5 h-5 text-green-500 inline mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span class="text-green-700 font-medium">
                {{
                  slotFormData?.paymentMethod === 'Contrato'
                    ? 'Assistência coberta por contrato'
                    : 'Assistência coberta por garantia'
                }}
                - Sem custo
              </span>
            </div>
          </div>
        </template>

        <!-- FileUploadZone for file attachments -->
        <template #updateSections>
          <div class="form-section">
            <h3 class="form-section-title text-base font-semibold text-gray-900 mb-3">Ficheiros Anexos</h3>
            <FileUploadZone
              field-name="anexosFiles"
              label="Ficheiros"
              :multiple="true"
              :accept-images="true"
              :accept-documents="true"
              :existing-files="existingAnexosFiles"
              :disabled="apiLoading.updating.value || uploading || deleting"
              @files-changed="handleAnexosFilesChanged"
            />
            <p v-if="fileError" class="text-sm text-red-600 mt-2">{{ fileError }}</p>
          </div>
        </template>

      </ContentUpdateTemplate>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Client, ContentWithRelations } from '@clever/shared';
import type { RemoteAssistance, RemoteAssistanceUpdateData, Contract } from '@clever/shared';
import {
  validateAndFormatTime,
  validateTimeSequence,
  calculateTotalHours,
  calculateRoundedTotalHours,
  calculateAssistanceValueWithBusinessHours,
  REMOTE_ASSISTANCE_CONSTANTS,
} from '@clever/shared';
import ClientSearchInput from '@/components/common/ClientSearchInput.vue';
import ErrorComponent from '@/components/common/ErrorComponent.vue';
import ContentUpdateTemplate from '@/components/common/ContentUpdateTemplate.vue';
import FileUploadZone from '@/components/common/FileUploadZone.vue';
import { remoteAssistanceFormSections } from '@/config/remote-assistance-form-sections';
import { useApi } from '@/composables/useApi';
import { useSharedFormData } from '@/composables/useSharedFormData';
import { useFileUpload } from '@/composables/useFileUpload';
import type { FileReference } from '@clever/shared';
import contractPlansConfig from '@/config/contract-plans.json';

const route = useRoute();
const router = useRouter();
const {
  fetchById,
  update,
  currentItem,
  loading: apiLoading,
  error: apiError,
} = useApi<ContentWithRelations<RemoteAssistance['data']>>('remote-assistance');

// Form data management
const { formData: currentFormData, updateFieldValue } = useSharedFormData(
  'remote-assistance-update'
);

// File upload state
const { uploadFiles, deleteFile, uploading, deleting, error: fileError } = useFileUpload();
const existingAnexosFiles = ref<FileReference[]>([]);
const pendingNewFiles = ref<File[]>([]);
const pendingRemovedKeys = ref<string[]>([]);

// File upload handler
const handleAnexosFilesChanged = (payload: { fieldName: string; newFiles: File[]; removedKeys: string[] }): void => {
  pendingNewFiles.value = payload.newFiles;
  pendingRemovedKeys.value = payload.removedKeys;
};

// State - use API composable state
const selectedClient = ref<Client | null>(null);

// Payment methods configuration
const paymentMethods = [
  { value: 'Contrato', label: 'Contrato' },
  { value: 'Faturação', label: 'Faturação' },
  { value: 'Garantia', label: 'Garantia' },
];

// Contract auto-fetch state
const contractsApiForFetch = useApi<Contract>('contracts');
const clientContracts = ref<Contract[]>([]);
const isLoadingContracts = ref(false);

const selectedContractForDisplay = computed(() => {
  const currentContractId = currentFormData.value?.contractId;
  if (!currentContractId) return clientContracts.value.length === 1 ? clientContracts.value[0] : null;
  return clientContracts.value.find(c => c.uuid === currentContractId) || null;
});

const getPlanName = (contractType: string, planId: string): string => {
  const plans = (contractPlansConfig as Record<string, { plans: { id: string; name: string }[] }>)[contractType]?.plans || [];
  const plan = plans.find(p => p.id === planId);
  return plan?.name || planId;
};

const getContractDisplayName = (contract: Contract): string => {
  const parts: string[] = [];
  if (contract.data?.hasCPAContract) {
    const cpaType = contract.data.cpaContractType === 'CPA_1500' ? 'CPA 1500' : 'CPA 2023';
    const planName = getPlanName(contract.data.cpaContractType, contract.data.planIdCPA);
    parts.push(`${cpaType} - ${planName}`);
  }
  if (contract.data?.hasSHContract) {
    const planName = getPlanName('S&H', contract.data.planIdSH);
    parts.push(`S&H - ${planName}`);
  }
  return parts.join(' | ') || 'Contrato';
};

const getContractDates = (contract: Contract): string => {
  if (contract.data?.hasCPAContract && contract.data.inicioContratoCPA) {
    const inicio = new Date(contract.data.inicioContratoCPA).toLocaleDateString('pt-PT');
    const fim = new Date(contract.data.fimContratoCPA).toLocaleDateString('pt-PT');
    return `${inicio} - ${fim}`;
  }
  if (contract.data?.hasSHContract && contract.data.inicioContratoSH) {
    const inicio = new Date(contract.data.inicioContratoSH).toLocaleDateString('pt-PT');
    const fim = new Date(contract.data.fimContratoSH).toLocaleDateString('pt-PT');
    return `${inicio} - ${fim}`;
  }
  return '';
};

const fetchClientContracts = async (clientId: string) => {
  if (!clientId) {
    clientContracts.value = [];
    return;
  }
  isLoadingContracts.value = true;
  await contractsApiForFetch.fetchList({})
    .then(() => {
      clientContracts.value = (contractsApiForFetch.items.value || []).filter(
        (c: Contract) => c.data.clientId === clientId
      );
      // Auto-select if only one contract and no contract already selected
      if (clientContracts.value.length === 1 && !currentFormData.value?.contractId) {
        updateFieldValue('contractId', clientContracts.value[0].uuid);
      }
    })
    .catch((err: unknown) => {
      console.error('Error fetching contracts:', JSON.stringify(err, null, 2));
      clientContracts.value = [];
    })
    .finally(() => {
      isLoadingContracts.value = false;
    });
};

// Computed - use currentItem from API composable
const remoteAssistance = computed(() => currentItem.value);
const loading = computed(() => apiLoading.loading.value);
const error = computed(() => apiError.value?.message || null);

// Computed
const initialFormData = computed(() => {
  if (!remoteAssistance.value) return {};

  const data = remoteAssistance.value.data;
  return {
    // Client information
    clientId: data.clientId || '',

    // Contract information
    contractId: data.contractId || '',

    // Assistance information
    tipoAssistencia: data.tipoAssistencia || '',
    // Note: tecnicoResponsavel is automatically assigned by backend based on authenticated user
    tecnicoResponsavel: '', // Will be populated by backend auto-assignment

    // Date and time information
    dataPedido: data.dataPedido || '',
    dataAssistencia: data.dataAssistencia || '',
    inicioAssistencia: data.inicioAssistencia || '',
    fimAssistencia: data.fimAssistencia || '',
    horasTotais: data.horasTotais || '',

    // Description
    motivoPedido: data.motivoPedido || '',
    relatorioAssistencia: data.relatorioAssistencia || '',
    relatorio: data.relatorio || '',

    // Values
    valorAssist: data.valorAssist || 0,

    // Payment method
    paymentMethod: data.paymentMethod || '',

    // Status
    resolvido: data.resolvido || false,

    // Attachments
    anexos: data.anexos || '',
  };
});

// Methods
const loadRemoteAssistance = async () => {
  const uuid = route.params.uuid as string;
  if (!uuid) {
    return;
  }

  await fetchById(uuid);

  if (currentItem.value) {
    // Set selected client if relation exists
    if (
      currentItem.value.relations?.client &&
      typeof currentItem.value.relations.client === 'object' &&
      'nomeEmpresa' in currentItem.value.relations.client
    ) {
      selectedClient.value = currentItem.value.relations.client as unknown as Client;
    }

    // Populate existing file attachments
    existingAnexosFiles.value = Array.isArray(currentItem.value.data?.anexosFiles)
      ? currentItem.value.data.anexosFiles
      : [];

    // Fetch contracts if payment method is Contrato
    if (currentItem.value.data?.paymentMethod === 'Contrato' && currentItem.value.data?.clientId) {
      await fetchClientContracts(currentItem.value.data.clientId);
    }
  }
};

// Time input formatting functions with 15-minute rounding
const formatTimeInput = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');

  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  }

  // Limit to 4 digits (HHMM)
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
};

const handleTimeInput = (
  event: Event,
  fieldKey: string,
  updateFieldValue: (key: string, value: any) => void
) => {
  const target = event.target as HTMLInputElement;
  const formatted = formatTimeInput(target.value);
  target.value = formatted;
  updateFieldValue(fieldKey, formatted);
};

const handleTimeBlur = (
  event: Event,
  fieldKey: string,
  updateFieldValue: (key: string, value: any) => void
) => {
  const target = event.target as HTMLInputElement;
  const value = target.value;

  if (value) {
    // Only validate time format, don't round the input values
    const timeValidation = validateAndFormatTime(value);

    if (!timeValidation.isValid) {
      // If invalid, show the validation errors but don't change the input
    } else {
      // Valid time format - keep the original user input, don't round it
      updateFieldValue(fieldKey, value);
    }
  }
};

const clearError = () => {
  // Error is managed by the API composable
};

const handleClientSelected = (client: Client | null) => {
  selectedClient.value = client;
  // Client data is now handled through relations, no need to auto-populate
};

const validateUpdateForm = (data: Record<string, any>): Record<string, string> => {
  try {
    // Transform form data to RemoteAssistanceUpdateData format for validation
    const remoteAssistanceData: RemoteAssistanceUpdateData = {
      clientId: data.clientId || '',
      tipoAssistencia: data.tipoAssistencia || '',
      // Note: tecnicoResponsavel is automatically assigned by backend based on authenticated user
      // We don't include it in the validation data as it will be populated by backend
      dataPedido: data.dataPedido || '',
      dataAssistencia: data.dataAssistencia || '',
      inicioAssistencia: data.inicioAssistencia || '',
      fimAssistencia: data.fimAssistencia || '',
      horasTotais: data.horasTotais || '',
      motivoPedido: data.motivoPedido || '',
      relatorioAssistencia: data.relatorioAssistencia || '',
      relatorio: data.relatorio || '',
      valorAssist: data.valorAssist || 0,
      paymentMethod: data.paymentMethod || '',
      resolvido: data.resolvido,
      anexos: data.anexos || '',
    };

    // Manual validation with business logic
    const errors: string[] = [];

    // Basic validation
    if (!remoteAssistanceData.clientId?.trim()) {
      errors.push('Por favor, selecione um cliente');
    }

    if (!remoteAssistanceData.tipoAssistencia) {
      errors.push('Por favor, selecione o tipo de assistência');
    } else if (
      !REMOTE_ASSISTANCE_CONSTANTS.ASSISTANCE_TYPES.includes(
        remoteAssistanceData.tipoAssistencia as any
      )
    ) {
      errors.push('Tipo de assistência inválido');
    }

    // Note: tecnicoResponsavel is automatically assigned by the backend based on authenticated user
    // No need to validate this field on the frontend

    // Data do Pedido is now required
    if (!remoteAssistanceData.dataPedido) {
      errors.push('Por favor, selecione a data do pedido');
    }

    if (!remoteAssistanceData.dataAssistencia) {
      errors.push('Por favor, selecione a data da assistência');
    }

    // Time fields are now required
    if (!remoteAssistanceData.inicioAssistencia) {
      errors.push('Por favor, informe o início da assistência');
    }

    if (!remoteAssistanceData.fimAssistencia) {
      errors.push('Por favor, informe o fim da assistência');
    }

    // Validate time inputs format
    if (remoteAssistanceData.inicioAssistencia) {
      const startTimeValidation = validateAndFormatTime(remoteAssistanceData.inicioAssistencia);
      if (!startTimeValidation.isValid) {
        errors.push(...startTimeValidation.errors.map(error => `Início da assistência: ${error}`));
      }
    }

    if (remoteAssistanceData.fimAssistencia) {
      const endTimeValidation = validateAndFormatTime(remoteAssistanceData.fimAssistencia);
      if (!endTimeValidation.isValid) {
        errors.push(...endTimeValidation.errors.map(error => `Fim da assistência: ${error}`));
      }
    }

    // Validate time sequence
    if (remoteAssistanceData.inicioAssistencia && remoteAssistanceData.fimAssistencia) {
      const sequenceErrors = validateTimeSequence(
        remoteAssistanceData.inicioAssistencia,
        remoteAssistanceData.fimAssistencia
      );
      errors.push(...sequenceErrors);
    }

    // Validate resolvido field (required)
    if (remoteAssistanceData.resolvido === undefined || remoteAssistanceData.resolvido === null) {
      errors.push('Por favor, indique se o problema foi resolvido');
    }

    // Validate relatorio field (required when resolvido is false)
    if (remoteAssistanceData.resolvido === false) {
      if (!remoteAssistanceData.relatorio?.trim()) {
        errors.push('Relatório final é obrigatório quando o problema não foi resolvido');
      }
    }

    // Validate value if provided
    if (remoteAssistanceData.valorAssist !== undefined) {
      if (
        typeof remoteAssistanceData.valorAssist !== 'number' ||
        remoteAssistanceData.valorAssist < 0
      ) {
        errors.push('Valor da assistência deve ser um número positivo');
      }
    }

    // Contract validation when payment method is Contrato
    if (data.paymentMethod === 'Contrato') {
      if (!data.contractId?.trim()) {
        errors.push('O contrato é obrigatório quando o método de pagamento é Contrato');
      }
    }

    // Convert array of error messages to field-specific errors
    const fieldErrors: Record<string, string> = {};

    errors.forEach((errorMessage: string) => {
      if (errorMessage.includes('selecione um cliente')) {
        fieldErrors.clientId = errorMessage;
      } else if (errorMessage.includes('selecione o tipo de assistência')) {
        fieldErrors.tipoAssistencia = errorMessage;
      } else if (errorMessage.includes('Tipo de assistência inválido')) {
        fieldErrors.tipoAssistencia = errorMessage;
      } else if (errorMessage.includes('selecione a data do pedido')) {
        fieldErrors.dataPedido = errorMessage;
      } else if (errorMessage.includes('selecione a data da assistência')) {
        fieldErrors.dataAssistencia = errorMessage;
      } else if (errorMessage.includes('Início da assistência:')) {
        fieldErrors.inicioAssistencia = errorMessage.replace('Início da assistência: ', '');
      } else if (errorMessage.includes('Fim da assistência:')) {
        fieldErrors.fimAssistencia = errorMessage.replace('Fim da assistência: ', '');
      } else if (errorMessage.includes('Fim da assistência deve ser posterior ao início')) {
        fieldErrors.fimAssistencia = errorMessage;
      } else if (errorMessage.includes('indique se o problema foi resolvido')) {
        fieldErrors.resolvido = errorMessage;
      } else if (errorMessage.includes('Relatório final é obrigatório')) {
        fieldErrors.relatorio = errorMessage;
      } else if (errorMessage.includes('Valor da assistência deve ser um número positivo')) {
        fieldErrors.valorAssist = errorMessage;
      } else if (errorMessage.includes('contrato é obrigatório')) {
        fieldErrors.contractId = errorMessage;
      } else {
        // Generic error
        fieldErrors.general = errorMessage;
      }
    });

    return fieldErrors;
  } catch (err) {
    console.error('Error in remote assistance update validation:', JSON.stringify(err, null, 2));
    return { general: 'Erro na validação da assistência remota' };
  }
};

const handleUpdate = async (formData: Record<string, any>) => {
  if (!remoteAssistance.value) return;

  // Reset file error before operations
  fileError.value = null;

  // Transform form data to RemoteAssistanceUpdateData format
  const updateData: RemoteAssistanceUpdateData = {
    clientId: formData.clientId || '',
    contractId: formData.paymentMethod === 'Contrato' ? formData.contractId || '' : undefined,
    tipoAssistencia: formData.tipoAssistencia || '',
    // Note: tecnicoResponsavel is automatically assigned by backend based on authenticated user
    dataPedido: formData.dataPedido || '',
    dataAssistencia: formData.dataAssistencia || '',
    inicioAssistencia: formData.inicioAssistencia || '',
    fimAssistencia: formData.fimAssistencia || '',
    horasTotais: calculatedDuration.value || '',
    motivoPedido: formData.motivoPedido || '',
    relatorioAssistencia: formData.relatorioAssistencia || '',
    relatorio: formData.relatorio || '',
    valorAssist: formData.valorAssist || 0,
    paymentMethod: formData.paymentMethod || '',
    resolvido: formData.resolvido || false,
    anexos: formData.anexos || '',
    anexosFiles: existingAnexosFiles.value,
  };

  const uuid = remoteAssistance.value.uuid;

  await update(uuid, {
    data: updateData,
  } as Partial<ContentWithRelations<RemoteAssistance['data']>>)
    .then(async (updatedRemoteAssistance) => {
      if (!updatedRemoteAssistance) {
        throw new Error('Erro ao atualizar assistência remota');
      }

      const fileErrors: string[] = [];

      // 1. Delete removed files from R2
      for (const fileKey of pendingRemovedKeys.value) {
        const shortKey = fileKey.split('/').pop() || fileKey;
        await deleteFile('remote-assistance', uuid, shortKey)
          .then((deleted) => {
            if (!deleted) {
              fileErrors.push(`Não foi possível remover: ${shortKey}`);
            }
          })
          .catch(() => {
            fileErrors.push(`Não foi possível remover: ${shortKey}`);
          });
      }

      // 2. Upload new files
      if (pendingNewFiles.value.length > 0) {
        await uploadFiles('remote-assistance', uuid, 'anexosFiles', pendingNewFiles.value)
          .then((refs) => {
            console.log('Anexos upload result:', JSON.stringify(refs, null, 2));
          })
          .catch(() => {
            if (fileError.value) {
              fileErrors.push(fileError.value);
            }
          });
        if (fileError.value && !fileErrors.includes(fileError.value)) {
          fileErrors.push(fileError.value);
        }
      }

      // 3. Show errors inline if any (AC-009, UX-005)
      if (fileErrors.length > 0) {
        fileError.value = fileErrors.join('. ');
        setTimeout(() => router.push(`/remote-assistance/${uuid}`), 2000);
        return;
      }

      router.push(`/remote-assistance/${uuid}`);
    })
    .catch((err: unknown) => {
      console.error('Error updating remote assistance:', JSON.stringify({ message: (err as Error).message }, null, 2));
      // Error is handled by the API composable
    });
};

// Computed properties for calculations
const calculatedDuration = computed(() => {
  const currentFormDataValue = currentFormData.value;
  if (!currentFormDataValue?.inicioAssistencia || !currentFormDataValue?.fimAssistencia) {
    return null;
  }

  // Use the new rounded total hours calculation for billing purposes
  return calculateRoundedTotalHours(currentFormDataValue.inicioAssistencia, currentFormDataValue.fimAssistencia);
});

const pricingBreakdown = computed(() => {
  const currentFormDataValue = currentFormData.value;
  if (!currentFormDataValue?.inicioAssistencia || !currentFormDataValue?.fimAssistencia) {
    return null;
  }

  // Always calculate pricing for display purposes (pass 'Faturação' to get actual values)
  return calculateAssistanceValueWithBusinessHours(
    currentFormDataValue.inicioAssistencia,
    currentFormDataValue.fimAssistencia,
    'Faturação'
  );
});

// Helper functions
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

// Watchers for automatic calculations
watch(
  () => [
    currentFormData.value?.inicioAssistencia,
    currentFormData.value?.fimAssistencia,
    currentFormData.value?.paymentMethod,
  ],
  ([startTime, endTime, paymentMethod]) => {
    if (startTime && endTime) {
      // Use the new business hours calculation logic
      const valueCalculation = calculateAssistanceValueWithBusinessHours(
        startTime,
        endTime,
        paymentMethod
      );

      updateFieldValue('valorAssist', valueCalculation.totalValue);

      // Update total hours field with rounded hours
      const roundedDuration = calculateRoundedTotalHours(startTime, endTime);
      updateFieldValue('horasTotais', roundedDuration);
    } else {
      // Clear value and hours if times are not set
      updateFieldValue('valorAssist', 0);
      updateFieldValue('horasTotais', '');
    }
  }
);

// Clear conditional fields when dependencies change
watch(
  () => currentFormData.value?.resolvido,
  newValue => {
    if (!newValue) {
      updateFieldValue('relatorio', '');
    }
  }
);

// Clear value when payment method changes
watch(
  () => currentFormData.value?.paymentMethod,
  (paymentMethod, oldPaymentMethod) => {
    const currentFormDataValue = currentFormData.value;

    // Clear contractId when payment method changes away from Contrato
    if (paymentMethod !== 'Contrato') {
      updateFieldValue('contractId', '');
      clientContracts.value = [];
    } else if (currentFormDataValue?.clientId) {
      fetchClientContracts(currentFormDataValue.clientId);
    }
    
    if (currentFormDataValue?.inicioAssistencia && currentFormDataValue?.fimAssistencia) {
      // Use the new business hours calculation logic
      const valueCalculation = calculateAssistanceValueWithBusinessHours(
        currentFormDataValue.inicioAssistencia,
        currentFormDataValue.fimAssistencia,
        paymentMethod
      );

      updateFieldValue('valorAssist', valueCalculation.totalValue);
    }
  }
);

// Fetch contracts when client changes and payment method is Contrato
watch(
  () => currentFormData.value?.clientId,
  (newClientId) => {
    if (currentFormData.value?.paymentMethod === 'Contrato' && newClientId) {
      updateFieldValue('contractId', '');
      fetchClientContracts(newClientId);
    } else {
      clientContracts.value = [];
    }
  }
);

// Lifecycle
onMounted(() => {
  loadRemoteAssistance();
});
</script>

<style scoped>
.remote-assistance-update-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.loading-state {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.update-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-error {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

/* Payment method styling */
.payment-method-selector {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.payment-label {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.payment-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.payment-option {
  flex: 1;
  min-width: 150px;
  padding: 0.75rem 1rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  background: white;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.payment-option input[type='radio'] {
  position: absolute;
  opacity: 0;
}

.payment-option:hover {
  border-color: #75ae93;
  background-color: rgba(117, 174, 147, 0.05);
}

.payment-option.selected {
  border-color: #75ae93;
  background-color: #75ae93;
  color: white;
  font-weight: 600;
}

.payment-option span {
  font-size: 0.9rem;
  font-weight: 500;
}

.form-help {
  color: #6b7280;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
}

/* Calculation section styling */
.calculation-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #75ae93;
}

.calculation-section h3 {
  color: #2c3e50;
  font-size: 1rem;
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.vat-note {
  font-size: 0.85rem;
  color: #666;
  font-weight: 400;
  font-style: italic;
}

/* Duration display */
.duration-display {
  margin-bottom: 1rem;
}

.duration-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.duration-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.duration-value {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
}

/* Pricing breakdown */
.pricing-breakdown {
  margin-bottom: 1rem;
}

.pricing-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pricing-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.pricing-row.total {
  background: #75ae93;
  color: white;
  font-weight: 700;
  border-color: #75ae93;
}

.pricing-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.pricing-row.total .pricing-label {
  color: white;
}

.pricing-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.pricing-row.total .pricing-value {
  color: white;
  font-size: 1.1rem;
}

/* No charge notice */
.no-charge-notice {
  padding: 1rem;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 6px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
}

/* Pricing note */
.pricing-note {
  padding: 0.75rem;
  background: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 6px;
  display: flex;
  align-items: center;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .remote-assistance-update-container {
    padding: 0.5rem;
  }

  .payment-options {
    flex-direction: column;
  }

  .payment-option {
    min-width: auto;
  }

  .calculation-section {
    padding: 0.75rem;
  }

  .calculation-section h3 {
    font-size: 0.9rem;
  }

  .pricing-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .pricing-value {
    width: 100%;
    text-align: right;
  }

  .duration-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .duration-value {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 480px) {
  .remote-assistance-update-container {
    padding: 0.25rem;
  }

  .pricing-value {
    font-size: 0.8rem;
  }

  .duration-value {
    font-size: 0.9rem;
  }
}

/* Print styles */
@media print {
  .calculation-section,
  .pricing-breakdown,
  .pricing-note,
  .no-charge-notice {
    border: 1px solid #ccc;
    background: white;
  }

  .pricing-row.total {
    background: #f0f0f0;
    color: black;
  }
}
</style>

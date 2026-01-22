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
        content-type="remote-assistance"
        :form-sections="remoteAssistanceFormSections"
        :initial-data="initialFormData"
        :custom-validator="validateUpdateForm"
        :is-saving="apiLoading.updating"
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
            Formato HH:MM. Será arredondado para intervalos de 15 minutos.
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
            Formato HH:MM. Será arredondado para intervalos de 15 minutos.
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
            Calculado automaticamente com base no início e fim da assistência.
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

            <!-- Pricing breakdown (only if not contract/warranty) -->
            <div
              v-if="!slotFormData?.contrato && !slotFormData?.garantia && pricingBreakdown"
              class="pricing-breakdown"
            >
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
              v-else-if="slotFormData?.contrato || slotFormData?.garantia"
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
                  slotFormData?.contrato
                    ? 'Assistência coberta por contrato'
                    : 'Assistência coberta por garantia'
                }}
                - Sem custo
              </span>
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
                {{ formatCurrency(REMOTE_ASSISTANCE_CONSTANTS.PRICE_BUSINESS_HOURS) }}/hora (horário
                comercial), {{ formatCurrency(REMOTE_ASSISTANCE_CONSTANTS.PRICE_AFTER_HOURS) }}/hora
                (fora do horário comercial)
              </span>
            </div>
          </div>
        </template>
      </ContentUpdateTemplate>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { RemoteAssistance, RemoteAssistanceUpdateData, Client } from '@clever/shared';
import {
  validateAndFormatTime,
  validateTimeSequence,
  calculateTotalHours,
  calculateAssistanceValue,
  REMOTE_ASSISTANCE_CONSTANTS,
} from '@clever/shared';
import ClientSearchInput from '@/components/common/ClientSearchInput.vue';
import ErrorComponent from '@/components/common/ErrorComponent.vue';
import ContentUpdateTemplate from '@/components/common/ContentUpdateTemplate.vue';
import { remoteAssistanceFormSections } from '@/config/remote-assistance-form-sections';
import { useApi } from '@/composables/useApi';
import { useSharedFormData } from '@/composables/useSharedFormData';

const route = useRoute();
const router = useRouter();
const {
  fetchById,
  update,
  currentItem,
  loading: apiLoading,
  error: apiError,
} = useApi<RemoteAssistance>('remote-assistance');

// Form data management
const { formData: currentFormData, updateFieldValue } = useSharedFormData(
  'remote-assistance-update'
);

// State - use API composable state
const selectedClient = ref<Client | null>(null);

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

    // Status
    contrato: data.contrato || false,
    garantia: data.garantia || false,
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
    console.log(
      'Remote assistance loaded for update:',
      JSON.stringify(
        {
          uuid: currentItem.value.uuid,
          type: currentItem.value.data.tipoAssistencia,
          hasClientRelation: !!currentItem.value.relations?.client,
        },
        null,
        2
      )
    );

    // Set selected client if relation exists
    if (
      currentItem.value.relations?.client &&
      typeof currentItem.value.relations.client === 'object' &&
      'nomeEmpresa' in currentItem.value.relations.client
    ) {
      selectedClient.value = {
        uuid: currentItem.value.relations.client.uuid,
        nomeEmpresa: currentItem.value.relations.client.nomeEmpresa,
        contribuinte: currentItem.value.relations.client.contribuinte || '',
        // Add other required Client fields with defaults
        contacto: '',
        email: '',
        morada: '',
        codigoPostal: '',
        localidade: '',
        telefone: '',
        telemovel: '',
        fax: '',
        website: '',
        observacoes: '',
      } as Client;
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
    // Validate and format time with 15-minute rounding
    const timeValidation = validateAndFormatTime(value);

    if (timeValidation.isValid && timeValidation.formattedTime) {
      target.value = timeValidation.formattedTime;
      updateFieldValue(fieldKey, timeValidation.formattedTime);

      // Show user if time was rounded
      if (timeValidation.formattedTime !== value) {
        console.log(`Time rounded from ${value} to ${timeValidation.formattedTime}`);
      }
    }
  }
};

const clearError = () => {
  // Error is managed by the API composable
};

const handleClientSelected = (client: Client | null) => {
  console.log('Client selected for update:', JSON.stringify(client, null, 2));
  selectedClient.value = client;
  // Client data is now handled through relations, no need to auto-populate
};

const validateUpdateForm = (data: Record<string, any>): Record<string, string> => {
  console.log('Validating remote assistance update data:', JSON.stringify(data, null, 2));

  try {
    // Transform form data to RemoteAssistanceUpdateData format for validation
    const remoteAssistanceData: RemoteAssistanceUpdateData = {
      clientId: data.clientId || '',
      tipoAssistencia: data.tipoAssistencia || '',
      // Note: tecnicoResponsavel is automatically assigned by backend based on authenticated user
      tecnicoResponsavel: '', // Will be populated by backend auto-assignment
      dataPedido: data.dataPedido || '',
      dataAssistencia: data.dataAssistencia || '',
      inicioAssistencia: data.inicioAssistencia || '',
      fimAssistencia: data.fimAssistencia || '',
      horasTotais: data.horasTotais || '',
      motivoPedido: data.motivoPedido || '',
      relatorioAssistencia: data.relatorioAssistencia || '',
      relatorio: data.relatorio || '',
      valorAssist: data.valorAssist || 0,
      contrato: data.contrato || false,
      garantia: data.garantia || false,
      resolvido: data.resolvido,
      anexos: data.anexos || '',
    };

    console.log(
      'Transformed remote assistance data for validation:',
      JSON.stringify(remoteAssistanceData, null, 2)
    );

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

    console.log('Validation errors:', errors);

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
      } else {
        // Generic error
        fieldErrors.general = errorMessage;
      }
    });

    console.log('Field errors:', JSON.stringify(fieldErrors, null, 2));
    console.log('Form validation result - has errors:', Object.keys(fieldErrors).length > 0);
    return fieldErrors;
  } catch (err) {
    console.error('Error in remote assistance update validation:', JSON.stringify(err, null, 2));
    return { general: 'Erro na validação da assistência remota' };
  }
};

const handleUpdate = async (formData: Record<string, any>) => {
  if (!remoteAssistance.value) return;

  console.log('🚀 handleUpdate called with form data:', JSON.stringify(formData, null, 2));

  try {
    // Transform form data to RemoteAssistanceUpdateData format
    const updateData: RemoteAssistanceUpdateData = {
      clientId: formData.clientId || '',
      tipoAssistencia: formData.tipoAssistencia || '',
      // Note: tecnicoResponsavel is automatically assigned by backend based on authenticated user
      tecnicoResponsavel: '', // Will be populated by backend auto-assignment
      dataPedido: formData.dataPedido || '',
      dataAssistencia: formData.dataAssistencia || '',
      inicioAssistencia: formData.inicioAssistencia || '',
      fimAssistencia: formData.fimAssistencia || '',
      horasTotais: calculatedDuration.value || '',
      motivoPedido: formData.motivoPedido || '',
      relatorioAssistencia: formData.relatorioAssistencia || '',
      relatorio: formData.relatorio || '',
      valorAssist: formData.valorAssist || 0,
      contrato: formData.contrato || false,
      garantia: formData.garantia || false,
      resolvido: formData.resolvido || false,
      anexos: formData.anexos || '',
    };

    console.log('Transformed update data:', JSON.stringify(updateData, null, 2));

    const updatedRemoteAssistance = await update(remoteAssistance.value.uuid, {
      data: updateData,
    } as Partial<RemoteAssistance>);

    if (updatedRemoteAssistance) {
      console.log(
        'Remote assistance updated successfully:',
        JSON.stringify(
          {
            uuid: updatedRemoteAssistance.uuid,
            type: updatedRemoteAssistance.data.tipoAssistencia,
          },
          null,
          2
        )
      );
      router.push(`/remote-assistance/${remoteAssistance.value.uuid}`);
    } else {
      throw new Error('Erro ao atualizar assistência remota');
    }
  } catch (err) {
    console.error('Error updating remote assistance:', JSON.stringify(err, null, 2));
    // Error is handled by the API composable
  }
};

// Computed properties for calculations
const calculatedDuration = computed(() => {
  const currentFormDataValue = currentFormData.value;
  if (!currentFormDataValue?.inicioAssistencia || !currentFormDataValue?.fimAssistencia) {
    return null;
  }

  return calculateTotalHours(
    currentFormDataValue.inicioAssistencia,
    currentFormDataValue.fimAssistencia
  );
});

const pricingBreakdown = computed(() => {
  const currentFormDataValue = currentFormData.value;
  if (!currentFormDataValue?.inicioAssistencia || !currentFormDataValue?.fimAssistencia) {
    return null;
  }

  return calculateAssistanceValue(
    currentFormDataValue.inicioAssistencia,
    currentFormDataValue.fimAssistencia,
    currentFormDataValue.contrato || false,
    currentFormDataValue.garantia || false
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
    currentFormData.value?.contrato,
    currentFormData.value?.garantia,
  ],
  ([startTime, endTime, isContract, isWarranty]) => {
    if (startTime && endTime) {
      // Calculate and update the value automatically
      const calculationResult = calculateAssistanceValue(
        startTime,
        endTime,
        isContract || false,
        isWarranty || false
      );

      updateFieldValue('valorAssist', calculationResult.totalValue);

      // Update total hours field
      const totalHours = calculateTotalHours(startTime, endTime);
      updateFieldValue('horasTotais', totalHours);

      console.log(
        'Value calculation updated:',
        JSON.stringify(
          {
            startTime,
            endTime,
            isContract,
            isWarranty,
            calculatedValue: calculationResult.totalValue,
            totalHours,
            breakdown: calculationResult,
          },
          null,
          2
        )
      );
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

// Clear value when contract/warranty status changes
watch(
  () => [currentFormData.value?.contrato, currentFormData.value?.garantia],
  ([isContract, isWarranty]) => {
    const currentFormDataValue = currentFormData.value;
    if (currentFormDataValue?.inicioAssistencia && currentFormDataValue?.fimAssistencia) {
      // Recalculate value based on new contract/warranty status
      const calculationResult = calculateAssistanceValue(
        currentFormDataValue.inicioAssistencia,
        currentFormDataValue.fimAssistencia,
        isContract || false,
        isWarranty || false
      );

      updateFieldValue('valorAssist', calculationResult.totalValue);
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

<template>
  <ContentCreateTemplate
    content-type="remote-assistance"
    create-title="Nova Assistência Remota"
    subtitle="Criar uma nova assistência remota no sistema"
    cancel-route="/remote-assistance"
    :form-sections="remoteAssistanceFormSections"
    :custom-validator="validateCreateForm"
    :is-saving="isSaving"
    :error="error"
    @create="handleCreateSuccess"
    @clear-error="clearError"
  >
      <!-- Custom field templates -->
      <template #field-clientId="{ formData, error, updateFieldValue }">
        <ClientSearchInput
          :model-value="formData?.clientId || ''"
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

          <!-- Pricing breakdown (only if payment method is Faturação) -->
          <div
            v-if="slotFormData?.paymentMethod === 'Faturação' && pricingBreakdown"
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
                <span class="pricing-value">{{ formatCurrency(pricingBreakdown.totalValue) }}</span>
              </div>
            </div>
          </div>

          <!-- Contract/Warranty notice -->
          <div
            v-else-if="slotFormData?.paymentMethod === 'Contrato' || slotFormData?.paymentMethod === 'Garantia'"
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
        </div>
      </template>

      <template #field-contractId="{ formData, error, updateFieldValue }">
        <ContractSearchInput
          :model-value="formData?.contractId || ''"
          :client-id="formData?.clientId || ''"
          :has-error="!!error"
          @update:model-value="value => updateFieldValue('contractId', value)"
          @contract-selected="handleContractSelected"
        />
        <p v-if="error" class="form-error text-red-600 text-sm mt-1">{{ error }}</p>
        <p v-if="!formData?.clientId" class="form-help text-xs text-gray-500 mt-1">
          Selecione um cliente primeiro para escolher um contrato
        </p>
      </template>
    </ContentCreateTemplate>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { RemoteAssistanceCreationData, Client } from '@clever/shared';
import {
  validateAndFormatTime,
  validateTimeSequence,
  calculateRoundedTotalHours,
  calculateAssistanceValueWithBusinessHours,
  REMOTE_ASSISTANCE_CONSTANTS,
  type Contract,
} from '@clever/shared';
import ClientSearchInput from '@/components/common/ClientSearchInput.vue';
import ContractSearchInput from '@/components/common/ContractSearchInput.vue';
import ContentCreateTemplate from '@/components/common/ContentCreateTemplate.vue';
import { remoteAssistanceFormSections } from '@/config/remote-assistance-form-sections';
import { useSharedFormData } from '@/composables/useSharedFormData';
import { useApi } from '@/composables/useApi';

const router = useRouter();

// API composable
const api = useApi('remote-assistance');

// State
const isSaving = ref(false);
const error = ref<string | null>(null);

// Clear error function
const clearError = () => {
  error.value = null;
};

// Form data management
const { formData, updateFieldValue } = useSharedFormData('remote-assistance-create');

// Selected client for additional information
const selectedClient = ref<Client | null>(null);

// Methods
const handleClientSelected = (client: Client | null) => {
  selectedClient.value = client;
  // Client data will be handled on the backend side when creating the remote assistance
};

const handleContractSelected = (contract: Contract | null) => {
  console.log('Contract selected:', JSON.stringify(contract, null, 2));
  // Contract ID is already updated via v-model
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

// Computed properties for calculations
const calculatedDuration = computed(() => {
  const currentFormData = formData.value;
  if (!currentFormData?.inicioAssistencia || !currentFormData?.fimAssistencia) {
    return null;
  }

  // Use the new rounded total hours calculation for billing purposes
  return calculateRoundedTotalHours(currentFormData.inicioAssistencia, currentFormData.fimAssistencia);
});

const pricingBreakdown = computed(() => {
  const currentFormData = formData.value;
  if (!currentFormData?.inicioAssistencia || !currentFormData?.fimAssistencia) {
    return null;
  }

  // Use the new business hours calculation logic with payment method
  return calculateAssistanceValueWithBusinessHours(
    currentFormData.inicioAssistencia,
    currentFormData.fimAssistencia,
    currentFormData.paymentMethod
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

const validateCreateForm = (data: Record<string, any>): Record<string, string> => {
  try {
    // Transform form data to RemoteAssistanceCreationData format
    const remoteAssistanceData: RemoteAssistanceCreationData = {
      clientId: data.clientId || '',
      tipoAssistencia: data.tipoAssistencia || '',
      tecnicoResponsavel: data.tecnicoResponsavel || '',
      dataPedido: data.dataPedido || '',
      dataAssistencia: data.dataAssistencia || '',
      inicioAssistencia: data.inicioAssistencia || '',
      fimAssistencia: data.fimAssistencia || '',
      horasTotais: calculatedDuration.value || '',
      motivoPedido: data.motivoPedido || '',
      relatorioAssistencia: data.relatorioAssistencia || '',
      relatorio: data.relatorio || '',
      valorAssist: data.valorAssist || 0,
      paymentMethod: data.paymentMethod || '',
      contractId: data.contractId || '',
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

    // Payment method validation
    if (!remoteAssistanceData.paymentMethod) {
      errors.push('Método de pagamento é obrigatório');
    } else if (
      remoteAssistanceData.paymentMethod !== 'Contrato' &&
      remoteAssistanceData.paymentMethod !== 'Faturação' &&
      remoteAssistanceData.paymentMethod !== 'Garantia'
    ) {
      errors.push('Método de pagamento inválido. Deve ser: Contrato, Faturação ou Garantia');
    }

    // Contract ID validation (conditional - required when payment method is Contrato)
    if (remoteAssistanceData.paymentMethod === 'Contrato') {
      if (!remoteAssistanceData.contractId || remoteAssistanceData.contractId.trim() === '') {
        errors.push('Contrato é obrigatório quando o método de pagamento é "Contrato"');
      }
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
      } else if (errorMessage.includes('Método de pagamento é obrigatório')) {
        fieldErrors.paymentMethod = errorMessage;
      } else if (errorMessage.includes('Método de pagamento inválido')) {
        fieldErrors.paymentMethod = errorMessage;
      } else if (errorMessage.includes('Contrato é obrigatório')) {
        fieldErrors.contractId = errorMessage;
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

    return fieldErrors;
  } catch (err) {
    console.error('Error in remote assistance validation:', JSON.stringify(err, null, 2));
    return { general: 'Erro na validação da assistência remota' };
  }
};

const handleCreateSuccess = async (formData: Record<string, any>) => {
  try {
    isSaving.value = true;
    clearError();

    // Transform form data to RemoteAssistanceCreationData format
    const remoteAssistanceData: RemoteAssistanceCreationData = {
      clientId: formData.clientId || '',
      tipoAssistencia: formData.tipoAssistencia || '',
      // Note: tecnicoResponsavel is automatically assigned by backend based on authenticated user
      tecnicoResponsavel: {} as any, // Will be populated by backend auto-assignment
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
      contractId: formData.contractId || '',
      resolvido: formData.resolvido || false,
      anexos: formData.anexos || '',
    };

    const response = await api.create({ data: remoteAssistanceData } as any);

    if (response) {
      // Navigate to the created remote assistance's detail page
      router.push(`/remote-assistance/${response.uuid}`);
    } else {
      throw new Error('Erro ao criar assistência remota');
    }
  } catch (err) {
    console.error('Error creating remote assistance:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao criar assistência remota';
  } finally {
    isSaving.value = false;
  }
};

// Watchers for automatic calculations
watch(
  () => [
    formData.value?.inicioAssistencia,
    formData.value?.fimAssistencia,
    formData.value?.paymentMethod,
  ],
  ([startTime, endTime, paymentMethod]) => {
    if (startTime && endTime) {
      // Use the new business hours calculation logic with payment method
      const calculationResult = calculateAssistanceValueWithBusinessHours(
        startTime,
        endTime,
        paymentMethod as 'Contrato' | 'Faturação' | 'Garantia' | ''
      );

      updateFieldValue('valorAssist', calculationResult.totalValue);

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
  () => formData.value?.resolvido,
  newValue => {
    if (newValue !== false) {
      updateFieldValue('relatorio', '');
    }
  }
);

// Clear contractId when payment method changes from Contrato to other values
watch(
  () => formData.value?.paymentMethod,
  (newValue, oldValue) => {
    if (oldValue === 'Contrato' && newValue !== 'Contrato') {
      updateFieldValue('contractId', '');
    }
  }
);
</script>

<style scoped>
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

<template>
  <div class="work-sheet-update-container">
    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <p>A carregar folha de obra...</p>
    </div>

    <!-- Error state -->
    <ErrorComponent v-if="error" :error="error" @close="clearError" />

    <!-- Content -->
    <div v-if="!loading && workSheet" class="update-content">
      <!-- Form -->
      <ContentUpdateTemplate
        :item="workSheet"
        content-type="work-sheets"
        :form-sections="workSheetsFormSections"
        :initial-data="initialFormData"
        :custom-validator="validateUpdateForm"
        :is-saving="apiLoading.updating.value"
        :error="error"
        edit-title="Atualizar Folha de Obra"
        subtitle="Editar informações da folha de obra"
        :cancel-route="`/work-sheets/${workSheet?.uuid}`"
        @update="handleUpdate"
        @clear-error="clearError"
      >
        <!-- Time input fields with automatic colon formatting -->
        <template #field-arrivalTime="{ formData, error, updateFieldValue }">
          <input
            type="text"
            :value="formData?.arrivalTime || ''"
            placeholder="10:00"
            maxlength="5"
            class="form-input"
            :class="{ 'border-red-500': !!error }"
            @input="e => handleTimeInput(e, 'arrivalTime', updateFieldValue)"
            @blur="e => handleTimeBlur(e, 'arrivalTime', updateFieldValue)"
          />
          <p v-if="error" class="form-error text-red-600 text-sm mt-1">
            {{ error }}
          </p>
        </template>

        <template #field-departureTime="{ formData, error, updateFieldValue }">
          <input
            type="text"
            :value="formData?.departureTime || ''"
            placeholder="18:00"
            maxlength="5"
            class="form-input"
            :class="{ 'border-red-500': !!error }"
            @input="e => handleTimeInput(e, 'departureTime', updateFieldValue)"
            @blur="e => handleTimeBlur(e, 'departureTime', updateFieldValue)"
          />
          <p v-if="error" class="form-error text-red-600 text-sm mt-1">
            {{ error }}
          </p>
        </template>

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

        <template #field-hasDisplacement="{ formData, updateFieldValue }">
          <div class="displacement-toggle">
            <label class="displacement-label">Deslocação</label>
            <div class="radio-group">
              <label :class="['radio-label', formData?.hasDisplacement === true ? 'selected' : '']">
                <input
                  type="radio"
                  :checked="formData?.hasDisplacement === true"
                  name="displacement"
                  @change="updateFieldValue('hasDisplacement', true)"
                />
                <span>SIM</span>
              </label>
              <label
                :class="['radio-label', formData?.hasDisplacement === false ? 'selected' : '']"
              >
                <input
                  type="radio"
                  :checked="formData?.hasDisplacement === false"
                  name="displacement"
                  @change="updateFieldValue('hasDisplacement', false)"
                />
                <span>NÃO</span>
              </label>
            </div>
          </div>
        </template>

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

        <!-- Pricing display section (only shown when hasDisplacement is true) -->
        <template #after-section-displacement="{ formData: slotFormData }">
          <div v-if="formData?.hasDisplacement === true" class="pricing-section">
            <h3>Cálculo de Preços <span class="vat-note">(sem IVA)</span></h3>
            <div class="pricing-table">
              <div class="pricing-row">
                <span class="pricing-label">Taxa Deslocação:</span>
                <span class="pricing-value"
                  >{{ getDisplacementRate() }}€ <span class="vat-indicator">sem IVA</span></span
                >
              </div>
              <div class="pricing-row">
                <span class="pricing-label">Preço KMs:</span>
                <span class="pricing-value"
                  >{{ getKmsPrice() }}€ <span class="vat-indicator">sem IVA</span></span
                >
              </div>
              <div class="pricing-row">
                <span class="pricing-label">Valor Hora:</span>
                <span class="pricing-value"
                  >{{ getHourlyRate() }}€ <span class="vat-indicator">sem IVA</span></span
                >
              </div>
              <div class="pricing-row">
                <span class="pricing-label">Preço Mão Obra:</span>
                <span class="pricing-value"
                  >{{ getLaborPrice() }}€ <span class="vat-indicator">sem IVA</span></span
                >
              </div>
              <div class="pricing-row total">
                <span class="pricing-label">PREÇO TOTAL:</span>
                <span class="pricing-value"
                  >{{ getTotalPrice() }}€ <span class="vat-indicator">sem IVA</span></span
                >
              </div>
            </div>
          </div>
        </template>

        <!-- Signature field template -->
        <template #field-clientSignature="{ formData, error, updateFieldValue }">
          <SignaturePad
            :model-value="formData?.clientSignature || ''"
            :has-error="!!error"
            @update:model-value="value => handleSignatureUpdate(value, updateFieldValue)"
          />
          <p v-if="error" class="form-error text-red-600 text-sm mt-1">
            {{ error }}
          </p>
        </template>
      </ContentUpdateTemplate>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { WorkSheet, WorkSheetUpdateData, Client, Contract } from '@clever/shared';
import { validateWorkSheetUpdate } from '@clever/shared';
import ClientSearchInput from '@/components/common/ClientSearchInput.vue';
import ContractSearchInput from '@/components/common/ContractSearchInput.vue';
import SignaturePad from '@/components/forms/SignaturePad.vue';
import ErrorComponent from '@/components/common/ErrorComponent.vue';
import ContentUpdateTemplate from '@/components/common/ContentUpdateTemplate.vue';
import { workSheetsFormSections } from '@/config/work-sheets-form-sections';
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
} = useApi<WorkSheet>('work-sheets');

// Form data management
const { formData: currentFormData, updateFieldValue } = useSharedFormData('work-sheet-update');

// State - use API composable state
const selectedClient = ref<Client | null>(null);

// Computed - use currentItem from API composable
const workSheet = computed(() => currentItem.value);
const loading = computed(() => apiLoading.loading.value);
const error = computed(() => apiError.value?.message || null);

// Payment methods configuration
const paymentMethods = [
  { value: 'PENDENTE', label: 'PENDENTE' },
  { value: 'CARTÃO MB', label: 'CARTÃO MB' },
  { value: 'DINHEIRO', label: 'DINHEIRO' },
  { value: 'TRANSFERÊNCIA BANCÁRIA', label: 'TRANSFERÊNCIA BANCÁRIA' },
  { value: 'CONTRATO', label: 'CONTRATO' },
];

// Computed
const initialFormData = computed(() => {
  if (!workSheet.value) return {};

  const data = workSheet.value.data;
  return {
    // Client information
    clientId: data.clientId || '',

    // Contract information (for payment method CONTRATO)
    contractId: data.contractId || '',

    // Request information
    requestDate: data.request?.date || '',
    assistanceDate: data.request?.assistanceDate || '',
    reason: data.request?.reason || '',

    // Time tracking
    arrivalTime: data.request?.arrivalTime || '',
    departureTime: data.request?.departureTime || '',
    totalHours: data.request?.totalHours || '',

    // Service information
    serviceType: data.otherData?.serviceType || '',
    serviceObservations: data.otherData?.serviceObservations || '',

    // Displacement
    hasDisplacement: data.displacement?.hasDisplacement || false,
    weekendHoliday: data.displacement?.weekendHoliday || false,
    oneWayKms: data.displacement?.oneWayKms || 0,
    totalKms: data.displacement?.totalKms || 0,
    paymentMethod: data.displacement?.paymentMethod || 'PENDENTE',

    // Contract information
    warranty: data.otherData?.warranty || false,
    contract: data.otherData?.contract || false,
    contractYear: data.otherData?.contractYear || new Date().getFullYear().toString(),

    // Materials and equipment
    materialUsed: data.otherData?.materialUsed || false,
    materialDetails: data.otherData?.materialDetails || '',
    equipment: data.otherData?.equipment || false,
    equipmentDetails: data.otherData?.equipmentDetails || '',

    // Service status
    totallyResolved:
      data.otherData?.totallyResolved !== undefined ? data.otherData.totallyResolved : true,
    resolutionIssues: data.otherData?.resolutionIssues || '',
    dumpReading: data.otherData?.dumpReading || false,
    backup: data.otherData?.backup || false,
    remoteAccessCheck: data.otherData?.remoteAccessCheck || false,
    anydesk: data.otherData?.anydesk || false,

    // Service report
    serviceReport: data.otherData?.serviceReport || '',
    clientSignature: data.otherData?.clientSignature || '',
  };
});

// Methods
const loadWorkSheet = async () => {
  const uuid = route.params.uuid as string;
  if (!uuid) {
    return;
  }

  await fetchById(uuid);

  if (currentItem.value) {
    // Work sheet loaded successfully
  }
};

// Time input formatting functions
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

  // Validate time format on blur
  if (value && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
    // If invalid format, try to fix common issues
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 3) {
      const hours = digits.slice(0, 2);
      const minutes = digits.slice(2, 4);
      const formatted = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      target.value = formatted;
      updateFieldValue(fieldKey, formatted);
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

const handleContractSelected = (contract: Contract | null) => {
  console.log('Contract selected:', JSON.stringify(contract, null, 2));
  // Contract ID is already updated via v-model
};

// Signature handling
const handleSignatureUpdate = (
  value: string,
  updateFieldValue: (key: string, value: any) => void
) => {
  updateFieldValue('clientSignature', value);
};

const validateUpdateForm = (data: Record<string, any>): Record<string, string> => {
  const fieldErrors: Record<string, string> = {};

  try {
    // Basic required field validation
    if (!data.clientId?.trim()) {
      fieldErrors.clientId = 'Cliente é obrigatório';
    }

    if (!data.assistanceDate?.trim()) {
      fieldErrors.assistanceDate = 'Data da assistência é obrigatória';
    }

    // Date validation
    if (data.assistanceDate) {
      const assistanceDate = new Date(data.assistanceDate);
      if (isNaN(assistanceDate.getTime())) {
        fieldErrors.assistanceDate = 'Data da assistência deve ser uma data válida';
      }
    }

    if (data.requestDate) {
      const requestDate = new Date(data.requestDate);
      if (isNaN(requestDate.getTime())) {
        fieldErrors.requestDate = 'Data do pedido deve ser uma data válida';
      }
    }

    // Time format validation
    if (data.arrivalTime && !isValidTimeFormat(data.arrivalTime)) {
      fieldErrors.arrivalTime = 'Hora de chegada deve estar no formato HH:MM';
    }

    if (data.departureTime && !isValidTimeFormat(data.departureTime)) {
      fieldErrors.departureTime = 'Hora de saída deve estar no formato HH:MM';
    }

    // Displacement validation
    if (data.hasDisplacement && typeof data.oneWayKms === 'number' && data.oneWayKms < 0) {
      fieldErrors.oneWayKms = 'Quilómetros de ida deve ser um número positivo';
    }

    // CONDITIONAL FIELD VALIDATION - Only validate when conditions are met

    // Material details only required when materialUsed is true
    if (data.materialUsed === true && !data.materialDetails?.trim()) {
      fieldErrors.materialDetails =
        'Descrição do material é obrigatória quando material utilizado está marcado';
    }

    // Equipment details only required when equipment is true
    if (data.equipment === true && !data.equipmentDetails?.trim()) {
      fieldErrors.equipmentDetails =
        'Descrição dos equipamentos é obrigatória quando equipamentos está marcado';
    }

    // Resolution issues only required when totallyResolved is false
    if (data.totallyResolved === false && !data.resolutionIssues?.trim()) {
      fieldErrors.resolutionIssues =
        'Observações sobre problemas não resolvidos são obrigatórias quando o serviço não está totalmente resolvido';
    }

    // EXPLICITLY CLEAR ERRORS FOR CONDITIONAL FIELDS THAT SHOULDN'T BE VALIDATED
    // This ensures that any previous validation errors for these fields are removed

    // Clear materialDetails error if materialUsed is false
    if (data.materialUsed !== true) {
      delete fieldErrors.materialDetails;
    }

    // Clear equipmentDetails error if equipment is false
    if (data.equipment !== true) {
      delete fieldErrors.equipmentDetails;
    }

    // Clear resolutionIssues error if totallyResolved is true
    if (data.totallyResolved !== false) {
      delete fieldErrors.resolutionIssues;
    }

    return fieldErrors;
  } catch (err) {
    console.error('Error in work sheet update validation:', JSON.stringify(err, null, 2));
    return { general: 'Erro na validação da folha de obra' };
  }
};

// Helper function to validate time format (HH:MM)
const isValidTimeFormat = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

const handleUpdate = async (formData: Record<string, any>) => {
  if (!workSheet.value) return;

  // Transform form data to API format
  const updateData = {
    clientId: formData.clientId,
    contractId: formData.contractId, // Include contractId
    request: {
      date: formData.requestDate || '',
      receivedBy: '', // Field removed from form, set to empty string
      assistanceDate: formData.assistanceDate || '',
      reason: formData.reason || '',
      arrivalTime: formData.arrivalTime || '',
      departureTime: formData.departureTime || '',
      totalHours: formData.totalHours || '',
    },
    displacement: {
      hasDisplacement: formData.hasDisplacement || false,
      weekendHoliday: formData.weekendHoliday || false,
      oneWayKms: formData.oneWayKms || 0,
      totalKms: formData.totalKms || 0,
      paymentMethod: formData.paymentMethod || 'PENDENTE',
    },
    otherData: {
      serviceType: formData.serviceType || '',
      serviceObservations: formData.serviceObservations || '',
      warranty: formData.warranty || false,
      contract: formData.contract || false,
      contractYear: formData.contractYear || new Date().getFullYear().toString(),
      materialUsed: formData.materialUsed || false,
      materialDetails: formData.materialDetails || '',
      equipment: formData.equipment || false,
      equipmentDetails: formData.equipmentDetails || '',
      totallyResolved: formData.totallyResolved !== undefined ? formData.totallyResolved : true,
      resolutionIssues: formData.resolutionIssues || '',
      dumpReading: formData.dumpReading || false,
      backup: formData.backup || false,
      remoteAccessCheck: formData.remoteAccessCheck || false,
      anydesk: formData.anydesk || false,
      serviceReport: formData.serviceReport || '',
      clientSignature: formData.clientSignature || '',
    },
  };

  const updatedWorkSheet = await update(workSheet.value.uuid, {
    data: updateData,
  } as Partial<WorkSheet>);

  if (updatedWorkSheet) {
    router.push(`/work-sheets/${workSheet.value.uuid}`);
  }
};

// Pricing calculation methods (based on legacy logic)
const getDisplacementRate = (): number => {
  const formDataValue = currentFormData.value;
  if (!formDataValue?.hasDisplacement) return 0;
  const totalKms = formDataValue?.totalKms || 0;
  return totalKms > 180 ? 50 : 35;
};

const getHourlyRate = (): number => {
  const formDataValue = currentFormData.value;
  // Always show hourly rate, even without displacement
  return formDataValue?.weekendHoliday ? 60 : 45;
};

const getKmsPrice = (): number => {
  const formDataValue = currentFormData.value;
  if (!formDataValue?.hasDisplacement) return 0;
  const pricePerKm = 0.4;
  const totalKms = formDataValue?.totalKms || 0;
  return Math.round(pricePerKm * totalKms * 100) / 100;
};

const getLaborPrice = (): number => {
  const formDataValue = currentFormData.value;
  // Calculate labor price even without displacement
  const arrivalTime = formDataValue?.arrivalTime;
  const departureTime = formDataValue?.departureTime;

  if (!arrivalTime || !departureTime) return 0;

  try {
    const [arrivalHours, arrivalMinutes] = arrivalTime.split(':').map(Number);
    const [departureHours, departureMinutes] = departureTime.split(':').map(Number);

    const arrivalTotalMinutes = arrivalHours * 60 + arrivalMinutes;
    const departureTotalMinutes = departureHours * 60 + departureMinutes;

    let diffMinutes = departureTotalMinutes - arrivalTotalMinutes;
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // Handle next day
    }

    const totalHours = diffMinutes / 60;
    const chargeableHours = totalHours < 1 ? 1 : totalHours; // Minimum 1 hour
    const hourlyRate = getHourlyRate();

    return Math.round(chargeableHours * hourlyRate * 100) / 100;
  } catch {
    return 0;
  }
};

const getTotalPrice = (): number => {
  const formDataValue = currentFormData.value;
  // Calculate total price always, including displacement costs only when applicable
  const displacementRate = formDataValue?.hasDisplacement ? getDisplacementRate() : 0;
  const kmsPrice = formDataValue?.hasDisplacement ? getKmsPrice() : 0;
  const laborPrice = getLaborPrice();

  return Math.round((displacementRate + kmsPrice + laborPrice) * 100) / 100;
};

// Watchers for automatic calculations
watch(
  () => currentFormData.value?.oneWayKms,
  newValue => {
    if (newValue !== undefined && newValue !== null && currentFormData.value?.hasDisplacement) {
      const totalKms = newValue * 2;
      updateFieldValue('totalKms', totalKms);
    }
  }
);

watch(
  () => [currentFormData.value?.arrivalTime, currentFormData.value?.departureTime],
  ([arrivalTime, departureTime]) => {
    if (arrivalTime && departureTime) {
      try {
        const arrivalMatch = arrivalTime.match(/^(\d{1,2}):(\d{1,2})$/);
        const departureMatch = departureTime.match(/^(\d{1,2}):(\d{1,2})$/);

        if (arrivalMatch && departureMatch) {
          const arrivalHours = parseInt(arrivalMatch[1]);
          const arrivalMinutes = parseInt(arrivalMatch[2]);
          const departureHours = parseInt(departureMatch[1]);
          const departureMinutes = parseInt(departureMatch[2]);

          const arrival = new Date(2000, 0, 1, arrivalHours, arrivalMinutes);
          const departure = new Date(2000, 0, 1, departureHours, departureMinutes);

          if (departure >= arrival) {
            const diff = departure.getTime() - arrival.getTime();
            const hours = Math.floor(diff / 3600000)
              .toString()
              .padStart(2, '0');
            const minutes = Math.floor((diff % 3600000) / 60000)
              .toString()
              .padStart(2, '0');
            updateFieldValue('totalHours', `${hours}:${minutes}`);
          }
        }
      } catch (error) {
        console.error('Error calculating total hours:', error);
      }
    }
  }
);

// Clear conditional fields when dependencies change
watch(
  () => currentFormData.value?.paymentMethod,
  newValue => {
    if (newValue !== 'CONTRATO') {
      updateFieldValue('warranty', false);
      updateFieldValue('contract', false);
      updateFieldValue('contractYear', new Date().getFullYear().toString());
    }
  }
);

watch(
  () => currentFormData.value?.materialUsed,
  newValue => {
    if (!newValue) {
      updateFieldValue('materialDetails', '');
    }
  }
);

watch(
  () => currentFormData.value?.equipment,
  newValue => {
    if (!newValue) {
      updateFieldValue('equipmentDetails', '');
    }
  }
);

watch(
  () => currentFormData.value?.totallyResolved,
  newValue => {
    if (newValue) {
      updateFieldValue('resolutionIssues', '');
    }
  }
);

watch(
  () => currentFormData.value?.hasDisplacement,
  newValue => {
    if (!newValue) {
      updateFieldValue('oneWayKms', 0);
      updateFieldValue('totalKms', 0);
    }
  }
);

// Lifecycle
onMounted(() => {
  loadWorkSheet();
});
</script>

<style scoped>
.work-sheet-update-container {
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

/* Displacement toggle styling */
.displacement-toggle {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.displacement-label {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.radio-group {
  display: flex;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
  width: fit-content;
  border: 1px solid #ddd;
}

.radio-label {
  padding: 8px 20px;
  border: none;
  border-radius: 0;
  margin: 0;
  position: relative;
  transition: background-color 0.2s;
  cursor: pointer;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radio-label:first-child {
  border-right: 1px solid #ddd;
}

.radio-label input[type='radio'] {
  position: absolute;
  opacity: 0;
}

.radio-label input[type='radio']:checked + span {
  color: #333;
  font-weight: 600;
}

.radio-label.selected {
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

/* Pricing section styling */
.pricing-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #75ae93;
}

.pricing-section h3 {
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

.pricing-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pricing-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e9ecef;
}

.pricing-row:last-child {
  border-bottom: none;
}

.pricing-row.total {
  background: #75ae93;
  color: white;
  margin: 0.5rem -1rem -1rem -1rem;
  padding: 1rem;
  border-radius: 0 0 8px 8px;
  font-weight: 700;
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
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
}

.pricing-row.total .pricing-value {
  color: white;
  font-size: 1.2rem;
}

.vat-indicator {
  font-size: 0.75rem;
  color: #dc3545;
  font-weight: 500;
  font-style: italic;
  margin-left: 0.25rem;
}

.pricing-row.total .vat-indicator {
  color: rgba(255, 255, 255, 0.9);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .work-sheet-update-container {
    padding: 0.5rem;
  }

  .payment-options {
    flex-direction: column;
  }

  .payment-option {
    min-width: auto;
  }

  .pricing-section {
    padding: 0.75rem;
  }

  .pricing-section h3 {
    font-size: 0.9rem;
  }

  .pricing-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .pricing-value {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .work-sheet-update-container {
    padding: 0.25rem;
  }
}
</style>

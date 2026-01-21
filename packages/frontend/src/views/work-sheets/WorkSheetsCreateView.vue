<template>
  <div class="work-sheet-create-container">
    <!-- Header -->
    <div class="create-header">
      <BackButton to="/work-sheets" variant="inline" />
      <h1>Nova Folha de Obra</h1>
    </div>

    <!-- Form -->
    <ContentCreateTemplate
      content-type="work-sheets"
      :form-sections="workSheetsFormSections"
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
            <label :class="['radio-label', formData?.hasDisplacement === false ? 'selected' : '']">
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

      <!-- Pricing display section (only shown when displacement is enabled) -->
      <template #after-section-displacement="{ formData: slotFormData }">
        <div v-if="slotFormData?.hasDisplacement" class="pricing-section">
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
    </ContentCreateTemplate>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { WorkSheetCreationData, Client } from '@clever/shared';
import { validateWorkSheetCreation } from '@clever/shared';
import BackButton from '@/components/common/BackButton.vue';
import ClientSearchInput from '@/components/common/ClientSearchInput.vue';
import ContentCreateTemplate from '@/components/common/ContentCreateTemplate.vue';
import { workSheetsFormSections } from '@/config/work-sheets-form-sections';
import { useSharedFormData } from '@/composables/useSharedFormData';
import { useApi } from '@/composables/useApi';

const router = useRouter();

// API composable
const api = useApi('work-sheets');

// State
const isSaving = ref(false);
const error = ref<string | null>(null);

// Clear error function
const clearError = () => {
  error.value = null;
};

// Form data management
const { formData, updateFieldValue } = useSharedFormData('work-sheet-create');

// Payment methods configuration
const paymentMethods = [
  { value: 'PENDENTE', label: 'PENDENTE' },
  { value: 'CARTÃO MB', label: 'CARTÃO MB' },
  { value: 'DINHEIRO', label: 'DINHEIRO' },
  { value: 'TRANSFERÊNCIA BANCÁRIA', label: 'TRANSFERÊNCIA BANCÁRIA' },
  { value: 'CONTRATO', label: 'CONTRATO' },
];

// Selected client for additional information
const selectedClient = ref<Client | null>(null);

// Methods
const handleClientSelected = (client: Client | null) => {
  console.log('Client selected:', JSON.stringify(client, null, 2));
  selectedClient.value = client;
  // Client data will be handled on the backend side when creating the work sheet
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

const validateCreateForm = (data: Record<string, any>): Record<string, string> => {
  console.log('Validating work sheet creation data:', JSON.stringify(data, null, 2));

  try {
    // Transform form data to WorkSheetCreationData format
    const workSheetData: WorkSheetCreationData = {
      clientId: data.clientId || '',
      request: {
        date: data.requestDate || '',
        receivedBy: data.receivedBy || '',
        assistanceDate: data.assistanceDate || '',
        reason: data.reason || '',
        arrivalTime: data.arrivalTime || '',
        departureTime: data.departureTime || '',
        totalHours: data.totalHours || '0:00',
      },
      displacement: {
        hasDisplacement: data.hasDisplacement || false,
        weekendHoliday: data.weekendHoliday || false,
        oneWayKms: data.oneWayKms || 0,
        totalKms: data.totalKms || 0,
        paymentMethod: data.paymentMethod || 'PENDENTE',
      },
      otherData: {
        serviceType: data.serviceType || '',
        technician: '', // Will be populated from Clerk user context on backend
        serviceObservations: data.serviceObservations || '',
        warranty: data.warranty || false,
        contract: data.contract || false,
        contractYear: data.contractYear || new Date().getFullYear().toString(),
        materialUsed: data.materialUsed || false,
        materialDetails: data.materialDetails || '',
        equipment: data.equipment || false,
        equipmentDetails: data.equipmentDetails || '',
        totallyResolved: data.totallyResolved !== undefined ? data.totallyResolved : true,
        resolutionIssues: data.resolutionIssues || '',
        dumpReading: data.dumpReading || false,
        backup: data.backup || false,
        remoteAccessCheck: data.remoteAccessCheck || false,
        anydesk: data.anydesk || false,
        serviceReport: data.serviceReport || '',
        clientSignature: data.clientSignature || '',
      },
    };

    console.log(
      'Transformed work sheet data for validation:',
      JSON.stringify(workSheetData, null, 2)
    );

    // Use the comprehensive validation from shared package
    const errors = validateWorkSheetCreation(workSheetData);
    console.log('Validation errors:', errors);

    // Convert array of error messages to field-specific errors
    const fieldErrors: Record<string, string> = {};

    errors.forEach(errorMessage => {
      if (errorMessage.includes('Cliente é obrigatório')) {
        fieldErrors.clientId = errorMessage;
      } else if (errorMessage.includes('Data da assistência é obrigatória')) {
        fieldErrors.assistanceDate = errorMessage;
      } else if (errorMessage.includes('Data da assistência deve ser uma data válida')) {
        fieldErrors.assistanceDate = errorMessage;
      } else if (errorMessage.includes('Data do pedido deve ser uma data válida')) {
        fieldErrors.requestDate = errorMessage;
      } else if (errorMessage.includes('Hora de chegada deve estar no formato HH:MM')) {
        fieldErrors.arrivalTime = errorMessage;
      } else if (errorMessage.includes('Hora de saída deve estar no formato HH:MM')) {
        fieldErrors.departureTime = errorMessage;
      } else if (errorMessage.includes('Quilómetros de ida deve ser um número positivo')) {
        fieldErrors.oneWayKms = errorMessage;
      } else if (errorMessage.includes('Método de pagamento inválido')) {
        fieldErrors.paymentMethod = errorMessage;
      } else if (errorMessage.includes('Tipo de serviço inválido')) {
        fieldErrors.serviceType = errorMessage;
      } else if (errorMessage.includes('Ano de contrato é obrigatório')) {
        fieldErrors.contractYear = errorMessage;
      } else if (errorMessage.includes('Descrição do material é obrigatória')) {
        fieldErrors.materialDetails = errorMessage;
      } else if (errorMessage.includes('Descrição dos equipamentos é obrigatória')) {
        fieldErrors.equipmentDetails = errorMessage;
      } else if (
        errorMessage.includes('Observações sobre problemas não resolvidos são obrigatórias')
      ) {
        fieldErrors.resolutionIssues = errorMessage;
      } else {
        // Generic error
        fieldErrors.general = errorMessage;
      }
    });

    console.log('Field errors:', JSON.stringify(fieldErrors, null, 2));
    console.log('Form validation result - has errors:', Object.keys(fieldErrors).length > 0);
    return fieldErrors;
  } catch (err) {
    console.error('Error in work sheet validation:', JSON.stringify(err, null, 2));
    return { general: 'Erro na validação da folha de obra' };
  }
};

const handleCreateSuccess = async (formData: Record<string, any>) => {
  console.log('🚀 handleCreateSuccess called with form data:', JSON.stringify(formData, null, 2));

  try {
    isSaving.value = true;
    clearError();

    console.log('Creating work sheet with form data:', JSON.stringify(formData, null, 2));

    // Transform form data to WorkSheetCreationData format
    const workSheetData: WorkSheetCreationData = {
      clientId: formData.clientId || '',
      request: {
        date: formData.requestDate || '',
        receivedBy: formData.receivedBy || '',
        assistanceDate: formData.assistanceDate || '',
        reason: formData.reason || '',
        arrivalTime: formData.arrivalTime || '',
        departureTime: formData.departureTime || '',
        totalHours: formData.totalHours || '0:00',
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
        technician: '', // Will be populated from Clerk user context on backend
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

    console.log('Transformed work sheet data:', JSON.stringify(workSheetData, null, 2));

    const response = await api.create({ data: workSheetData } as any);

    if (response) {
      console.log('Work sheet created successfully:', JSON.stringify(response, null, 2));
      // Navigate to the created work sheet's detail page
      router.push(`/work-sheets/${response.uuid}`);
    } else {
      throw new Error('Erro ao criar folha de obra');
    }
  } catch (err) {
    console.error('Error creating work sheet:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao criar folha de obra';
  } finally {
    isSaving.value = false;
  }
};

// Pricing calculation methods (based on legacy logic)
const getDisplacementRate = (): number => {
  const currentFormData = formData.value;
  if (!currentFormData?.hasDisplacement) return 0;
  const totalKms = currentFormData?.totalKms || 0;
  return totalKms > 180 ? 50 : 35;
};

const getHourlyRate = (): number => {
  const currentFormData = formData.value;
  if (!currentFormData?.hasDisplacement) return 0;
  return currentFormData?.weekendHoliday ? 60 : 45;
};

const getKmsPrice = (): number => {
  const currentFormData = formData.value;
  if (!currentFormData?.hasDisplacement) return 0;
  const pricePerKm = 0.4;
  const totalKms = currentFormData?.totalKms || 0;
  return Math.round(pricePerKm * totalKms * 100) / 100;
};

const getLaborPrice = (): number => {
  const currentFormData = formData.value;
  if (!currentFormData?.hasDisplacement) return 0;

  const arrivalTime = currentFormData?.arrivalTime;
  const departureTime = currentFormData?.departureTime;

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
  const currentFormData = formData.value;
  if (!currentFormData?.hasDisplacement) return 0;

  const displacementRate = getDisplacementRate();
  const kmsPrice = getKmsPrice();
  const laborPrice = getLaborPrice();

  return Math.round((displacementRate + kmsPrice + laborPrice) * 100) / 100;
};

// Watchers for automatic calculations
watch(
  () => formData.value?.oneWayKms,
  newValue => {
    if (newValue !== undefined && newValue !== null && formData.value?.hasDisplacement) {
      const totalKms = newValue * 2;
      updateFieldValue('totalKms', totalKms);
    }
  }
);

watch(
  () => [formData.value?.arrivalTime, formData.value?.departureTime],
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
  () => formData.value?.paymentMethod,
  newValue => {
    if (newValue !== 'CONTRATO') {
      updateFieldValue('warranty', false);
      updateFieldValue('contract', false);
      updateFieldValue('contractYear', new Date().getFullYear().toString());
    }
  }
);

watch(
  () => formData.value?.materialUsed,
  newValue => {
    if (!newValue) {
      updateFieldValue('materialDetails', '');
    }
  }
);

watch(
  () => formData.value?.equipment,
  newValue => {
    if (!newValue) {
      updateFieldValue('equipmentDetails', '');
    }
  }
);

watch(
  () => formData.value?.totallyResolved,
  newValue => {
    if (newValue) {
      updateFieldValue('resolutionIssues', '');
    }
  }
);

watch(
  () => formData.value?.hasDisplacement,
  newValue => {
    if (!newValue) {
      updateFieldValue('oneWayKms', 0);
      updateFieldValue('totalKms', 0);
    }
  }
);
</script>

<style scoped>
.work-sheet-create-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.create-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.create-header h1 {
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
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
  .work-sheet-create-container {
    padding: 0.5rem;
  }

  .create-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .create-header h1 {
    font-size: 1.3rem;
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
  .work-sheet-create-container {
    padding: 0.25rem;
  }

  .create-header {
    padding: 0.75rem;
  }

  .create-header h1 {
    font-size: 1.2rem;
  }
}
</style>

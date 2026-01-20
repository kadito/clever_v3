<template>
  <div class="cpa-contract-section">
    <!-- Three-column layout for CPA fields -->
    <div class="contract-config-grid">
      <div class="config-field">
        <label class="config-label required">TIPO DE CONTRATO CPA</label>
        <select 
          :model-value="formData.cpaContractType" 
          @change="(event) => handleContractTypeChange(event.target.value)"
          class="config-select"
        >
          <option value="">Selecione o tipo...</option>
          <option value="CPA">CPA - Cashlogy (2023)</option>
          <option value="CPA_1500">CPA - Cashlogy (1500)</option>
        </select>
      </div>
      
      <div class="config-field">
        <label class="config-label required">PLANO CPA</label>
        <select 
          :model-value="formData.planIdCPA" 
          @change="(event) => handlePlanSelection(event.target.value)"
          class="config-select"
          :disabled="!formData.cpaContractType"
        >
          <option value="">
            {{ formData.cpaContractType ? 'Selecione o plano...' : 'Primeiro selecione o tipo de contrato' }}
          </option>
          <option 
            v-for="planOption in availablePlanOptions" 
            :key="planOption.value" 
            :value="planOption.value"
          >
            {{ planOption.label }}
          </option>
        </select>
      </div>
      
      <div class="config-field">
        <label class="config-label required">DISTÂNCIA</label>
        <select 
          :model-value="formData.distanceCPA" 
          @change="(event) => $emit('update-field', 'distanceCPA', event.target.value)"
          class="config-select"
        >
          <option value="">Selecione a distância...</option>
          <option value="under180km">Menos de 180 km</option>
          <option value="over180km">Mais de 180 km</option>
        </select>
      </div>
    </div>
    
    <!-- Equipment Management -->
    <CPAEquipmentManager
      :equipments="cpaEquipments"
      @equipment-updated="$emit('equipment-updated', $event)"
    />
    
    <!-- POS Package Option (only for CPA_1500 PREMIUM) -->
    <div v-if="showPOSPackageOption" class="pos-package-section">
      <div class="pos-package-option">
        <label class="pos-package-label">
          <input
            type="checkbox"
            :checked="formData.hasPOSPackage"
            @change="$emit('update-field', 'hasPOSPackage', $event.target.checked)"
            class="pos-package-checkbox"
          />
          <span class="pos-package-text">
            Pack de 10h de assistência para o seu POS (+100€/ano)
          </span>
        </label>
      </div>
    </div>
    
    <!-- Contract Dates -->
    <ContractDatesSection
      :start-date="formData.inicioContratoCPA"
      :end-date="formData.fimContratoCPA"
      @update:start-date="$emit('update-field', 'inicioContratoCPA', $event)"
      @update:end-date="$emit('update-field', 'fimContratoCPA', $event)"
    />
    
    <!-- Dynamic Plan Details Display -->
    <DynamicPlanDetails
      v-if="shouldShowPlanDetails || props.isLoadingPlan"
      data-testid="dynamic-plan-details"
      :plan-details="selectedPlanDetails"
      :selected-payment="formData.modalidadePagamentoCPA"
      :distance="formData.distanceCPA"
      :is-loading="props.isLoadingPlan"
      @payment-selected="$emit('update-field', 'modalidadePagamentoCPA', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { ContractEquipment } from '@clever/shared'
import CPAEquipmentManager from './CPAEquipmentManager.vue'
import ContractDatesSection from './ContractDatesSection.vue'
import DynamicPlanDetails from './DynamicPlanDetails.vue'
import { computed, toRefs } from 'vue'
import { getPlanOptions, type ContractType } from '../../services/planSelection'

interface Props {
  formData: Record<string, any>
  cpaEquipments: ContractEquipment[]
  selectedPlanDetails: any
  isLoadingPlan?: boolean
}

interface Emits {
  (e: 'update-field', field: string, value: any): void
  (e: 'equipment-updated', equipment: any): void
  (e: 'plan-selected', planId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Use toRefs for better performance with reactive props
const { formData, selectedPlanDetails, isLoadingPlan } = toRefs(props)

// Get available plan options based on selected contract type
const availablePlanOptions = computed(() => {
  const contractType = formData.value?.cpaContractType as ContractType | ''
  
  try {
    const options = getPlanOptions(contractType)
    return options
  } catch (error) {
    console.error('Error getting plan options:', JSON.stringify(error, null, 2))
    return []
  }
})

const handleContractTypeChange = (contractType: string) => {
  
  // Clear the selected plan when contract type changes
  if (formData.value?.planIdCPA) {
    emit('update-field', 'planIdCPA', '')
  }
  
  // Update the contract type
  emit('update-field', 'cpaContractType', contractType)
}

const handlePlanSelection = (planId: string) => {
  emit('plan-selected', planId)
}

// Show POS package option only for CPA_1500 PREMIUM plan - memoized for performance
const showPOSPackageOption = computed(() => {
  return formData.value?.cpaContractType === 'CPA_1500' && 
         formData.value?.planIdCPA === 'cpa_1500_premium'
})

// Determine if plan details should be shown - show immediately after plan selection for all contract types
const shouldShowPlanDetails = computed(() => {
  
  // Show plan details if we have selected plan details and a plan is selected
  // OR if we're in test mode (selectedPlanDetails provided without planIdCPA)
  const hasPlanSelected = formData.value?.planIdCPA && formData.value.planIdCPA !== '';
  const isTestMode = !!selectedPlanDetails.value && (!formData.value?.planIdCPA || formData.value.planIdCPA === '');
  
  const shouldShow = !!selectedPlanDetails.value && (hasPlanSelected || isTestMode);
  
  return shouldShow;
})
</script>

<style scoped>
.cpa-contract-section {
  @apply space-y-6;
}

.contract-config-grid {
  @apply form-grid-consistent;
}

@media (min-width: 768px) {
  .contract-config-grid {
    @apply grid-cols-3;
  }
}

.config-field {
  @apply flex flex-col gap-2;
}

.config-label {
  @apply form-label-consistent;
}

.config-label.required::after {
  content: ' *';
  @apply text-red-500;
}

.config-select {
  @apply form-select-consistent;
}

.config-select:disabled {
  @apply bg-gray-100 text-gray-500 cursor-not-allowed;
}

.pos-package-section {
  @apply form-section-consistent my-4;
}

.pos-package-option {
  @apply flex items-start p-4;
}

.pos-package-label {
  @apply flex items-start gap-3 cursor-pointer;
}

.pos-package-checkbox {
  @apply form-checkbox-consistent mt-1;
}

.pos-package-text {
  @apply text-sm text-blue-700 font-medium leading-relaxed;
}

/* Loading state for form elements */
.config-select.loading {
  @apply form-element-loading;
}

/* Error state styling */
.config-select.error {
  @apply form-element-error;
}

/* Success state styling */
.config-select.success {
  @apply form-element-success;
}
</style>
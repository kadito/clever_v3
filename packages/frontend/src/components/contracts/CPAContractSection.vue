<template>
  <div class="cpa-contract-section">
    <!-- 1. PLANO — Plan selector -->
    <div class="plan-selector-section">
      <div class="config-field">
        <label class="config-label required">PLANO CPA</label>
        <select
          :value="formData?.planIdCPA || ''"
          class="config-select"
          @change="event => handlePlanSelection((event.target as HTMLSelectElement).value)"
        >
          <option value="">
            Selecione o plano...
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
    </div>

    <!-- 2. PLANO INFORMATION — Plan details, pricing, POS package -->
    <DynamicPlanDetails
      v-if="shouldShowPlanDetails || props.isLoadingPlan"
      data-testid="dynamic-plan-details"
      :plan-details="selectedPlanDetails"
      :selected-payment="formData?.modalidadePagamentoCPA || ''"
      :is-loading="props.isLoadingPlan"
      :has-p-o-s-package="formData?.hasPOSPackage || false"
      contract-type="CPA"
      @payment-selected="$emit('update-field', 'modalidadePagamentoCPA', $event)"
    />

    <!-- POS Package Option (only for cpa_premium plan) -->
    <div
      v-if="showPOSPackageOption"
      class="pos-package-section"
    >
      <div class="pos-package-option">
        <label class="pos-package-label">
          <input
            type="checkbox"
            :checked="formData?.hasPOSPackage || false"
            class="pos-package-checkbox"
            @change="
              $emit('update-field', 'hasPOSPackage', ($event.target as HTMLInputElement).checked)
            "
          >
          <span class="pos-package-text">
            Pack de 10h de assistência para o seu POS (+200€/ano)
          </span>
        </label>
      </div>
    </div>

    <!-- 3. EQUIPMENTS -->
    <CPAEquipmentManager
      :equipments="cpaEquipments"
      @equipment-updated="$emit('equipment-updated', $event)"
    />

    <!-- 4. MANUAL INPUTS (visible only when 2+ equipments) -->
    <BenefitFieldsGroup
      :deslocacoes-por-ano="formData?.deslocacoesPorAnoCPA ?? 0"
      :manutencoes-por-ano="formData?.manutencoesPorAnoCPA ?? 0"
      :mode="mode"
      contract-type="CPA"
      @update:deslocacoes-por-ano="$emit('update-field', 'deslocacoesPorAnoCPA', $event)"
      @update:manutencoes-por-ano="$emit('update-field', 'manutencoesPorAnoCPA', $event)"
    />

    <div
      v-if="mode === 'manual'"
      class="config-field manual-price-field"
    >
      <label class="config-label required">PREÇO DO CONTRATO (€)</label>
      <input
        type="number"
        min="0"
        step="0.01"
        :value="formData?.precoCPA || ''"
        class="config-input"
        placeholder="0.00"
        data-testid="manual-price-input"
        @input="$emit('update-field', 'precoCPA', Number(($event.target as HTMLInputElement).value))"
      >
    </div>

    <!-- 5. DATES -->
    <ContractDatesSection
      :start-date="formData?.inicioContratoCPA || ''"
      :end-date="formData?.fimContratoCPA || ''"
      @update:start-date="$emit('update-field', 'inicioContratoCPA', $event)"
      @update:end-date="$emit('update-field', 'fimContratoCPA', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { ContractEquipment, CPAPlan } from '@clever/shared';
import BenefitFieldsGroup from './BenefitFieldsGroup.vue';
import CPAEquipmentManager from './CPAEquipmentManager.vue';
import ContractDatesSection from './ContractDatesSection.vue';
import DynamicPlanDetails from './DynamicPlanDetails.vue';
import { computed, toRefs, watch } from 'vue';
import { getPlanOptions, getPlanDetails } from '../../services/planSelection';

interface Props {
  formData: Record<string, any>;
  cpaEquipments: ContractEquipment[];
  selectedPlanDetails: any;
  isLoadingPlan?: boolean;
}

interface Emits {
  (e: 'update-field', field: string, value: any): void;
  (e: 'equipment-updated', equipment: any): void;
  (e: 'plan-selected', planId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Use toRefs for better performance with reactive props
const { selectedPlanDetails, isLoadingPlan } = toRefs(props);

// 9.1 — Mode computed: 'auto' (1 equip) or 'manual' (2+ equip)
const mode = computed<'auto' | 'manual'>(() => {
  return props.cpaEquipments.length >= 2 ? 'manual' : 'auto';
});

// 9.2 & 9.3 — Equipment count watcher for mode transitions
watch(
  () => props.cpaEquipments.length,
  (newLen, oldLen) => {
    if (oldLen === 1 && newLen >= 2) {
      // Auto → Manual: clear auto-populated parameter values and price
      emit('update-field', 'deslocacoesPorAnoCPA', '');
      emit('update-field', 'manutencoesPorAnoCPA', '');
      emit('update-field', 'precoCPA', undefined);
    } else if (oldLen >= 2 && newLen === 1) {
      // Manual → Auto: restore plan base values
      const planId = props.formData?.planIdCPA;
      if (planId) {
        const plan = getPlanDetails('CPA', planId) as CPAPlan | null;
        if (plan) {
          emit('update-field', 'deslocacoesPorAnoCPA', plan.parameters.deslocacoesPorAno);
          emit('update-field', 'manutencoesPorAnoCPA', plan.parameters.manutencoesPorAno);
        }
      }
      // Clear manual price since auto mode derives price from plan
      emit('update-field', 'precoCPA', undefined);
    }
  }
);

// Get unified CPA plan options directly — no contract type dependency
const availablePlanOptions = computed(() => {
  return getPlanOptions('CPA');
});

// 9.4 & 9.5 — Plan change handler with mode awareness
const handlePlanSelection = (planId: string): void => {
  if (mode.value === 'auto' && planId) {
    // In auto mode: re-populate parameters from new plan
    const plan = getPlanDetails('CPA', planId) as CPAPlan | null;
    if (plan) {
      emit('update-field', 'deslocacoesPorAnoCPA', plan.parameters.deslocacoesPorAno);
      emit('update-field', 'manutencoesPorAnoCPA', plan.parameters.manutencoesPorAno);
    }
  }
  // In manual mode: do NOT clear manual values (schedule info updates via selectedPlanDetails prop)
  // Always emit plan-selected event
  emit('plan-selected', planId);
};

// Show POS package option for plans that include posPackage (cpa_professional, cpa_premium)
const showPOSPackageOption = computed(() => {
  return props.formData?.planIdCPA === 'cpa_professional' || props.formData?.planIdCPA === 'cpa_premium';
});

// Determine if plan details should be shown
const shouldShowPlanDetails = computed(() => {
  const hasPlanSelected = props.formData?.planIdCPA && props.formData.planIdCPA !== '';
  const isTestMode =
    !!selectedPlanDetails.value && (!props.formData?.planIdCPA || props.formData.planIdCPA === '');

  return !!selectedPlanDetails.value && (hasPlanSelected || isTestMode);
});
</script>

<style scoped>
.cpa-contract-section {
  @apply space-y-6;
}

.plan-selector-section {
  @apply grid grid-cols-1 gap-4;
}

.config-field {
  @apply flex flex-col gap-2;
}

.config-label {
  @apply form-label-consistent;
}

.config-label.required::after {
  content: none;
}

.config-select {
  @apply form-select-consistent;
}

.config-select:disabled {
  @apply bg-gray-100 text-gray-500 cursor-not-allowed;
}

.config-input {
  @apply px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm transition-colors duration-200;
}

.config-input:focus {
  @apply outline-none border-green-500 ring-2 ring-green-200;
}

.manual-price-field {
  @apply mt-4;
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

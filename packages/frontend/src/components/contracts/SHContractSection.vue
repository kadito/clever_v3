<template>
  <div class="sh-contract-section">
    <!-- Two-column layout for S&H fields -->
    <div class="contract-config-grid-sh">
      <div class="config-field">
        <label class="config-label required">PLANO S&H</label>
        <select
          :value="formData?.planIdSH || ''"
          @change="event => handlePlanSelection((event.target as HTMLSelectElement).value)"
          class="config-select"
          data-testid="plan-select"
        >
          <option value="">Selecione o plano...</option>
          <option value="sh_simple">SIMPLE</option>
          <option value="sh_brass">BRASS</option>
          <option value="sh_silver">SILVER</option>
          <option value="sh_gold">GOLD</option>
          <option value="sh_diamond">DIAMOND</option>
          <option value="sh_platinum">PLATINUM</option>
        </select>
      </div>

      <div class="config-field">
        <label class="config-label required">DISTÂNCIA</label>
        <select
          :value="formData?.distanceSH || ''"
          @change="
            event => $emit('update-field', 'distanceSH', (event.target as HTMLSelectElement).value)
          "
          class="config-select"
          data-testid="distance-select"
        >
          <option value="">Selecione a distância...</option>
          <option value="under180km">Menos de 180 km</option>
          <option value="over180km">Mais de 180 km</option>
        </select>
      </div>
    </div>

    <!-- Equipment Management -->
    <div class="equipment-section">
      <div class="equipment-header">
        <h4>EQUIPAMENTOS S&H</h4>
      </div>

      <div class="equipment-info-callout">
        <span class="info-icon">ℹ️</span>
        <span
          >Pode adicionar múltiplos equipamentos para o contrato S&H. Cada equipamento pode ter
          modelo, número de série e software específicos.</span
        >
      </div>

      <div class="equipment-list">
        <SHEquipmentCard
          v-for="(equipment, index) in shEquipments"
          :key="equipment.id"
          :equipment="equipment"
          :equipment-number="index + 1"
          @update="updateEquipment(index, $event)"
          @remove="removeEquipment(index)"
        />
      </div>

      <button type="button" class="add-equipment-btn" @click="addEquipment">
        + ADICIONAR EQUIPAMENTO
      </button>
    </div>

    <!-- Contract Dates -->
    <ContractDatesSection
      :start-date="formData?.inicioContratoSH || ''"
      :end-date="formData?.fimContratoSH || ''"
      @update:start-date="$emit('update-field', 'inicioContratoSH', $event)"
      @update:end-date="$emit('update-field', 'fimContratoSH', $event)"
    />

    <!-- Benefit Fields (editable overrides) -->
    <BenefitFieldsGroup
      :horas-assistencia="formData?.horasAssistenciaAnualSH ?? 0"
      :deslocacoes-por-ano="formData?.deslocacoesPorAnoSH ?? 0"
      :manutencoes-por-ano="formData?.manutencoesPorAnoSH ?? 0"
      :disabled="!formData?.planIdSH"
      @update:horas-assistencia="$emit('update-field', 'horasAssistenciaAnualSH', $event)"
      @update:deslocacoes-por-ano="$emit('update-field', 'deslocacoesPorAnoSH', $event)"
      @update:manutencoes-por-ano="$emit('update-field', 'manutencoesPorAnoSH', $event)"
    />

    <!-- Dynamic Plan Details Display -->
    <div v-if="props.isLoadingPlan" class="plan-loading-state">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <span class="loading-text">A carregar detalhes do plano...</span>
      </div>
    </div>

    <DynamicPlanDetails
      v-if="shouldShowPlanDetails"
      data-testid="dynamic-plan-details"
      :plan-details="selectedPlanDetails"
      :selected-payment="formData?.modalidadePagamentoSH || ''"
      :distance="formData?.distanceSH || ''"
      :equipments="shEquipmentsForPricing"
      :contract-type="'S&H'"
      @payment-selected="$emit('update-field', 'modalidadePagamentoSH', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import BenefitFieldsGroup from './BenefitFieldsGroup.vue';
import ContractDatesSection from './ContractDatesSection.vue';
import DynamicPlanDetails from './DynamicPlanDetails.vue';
import SHEquipmentCard from './SHEquipmentCard.vue';

interface SHEquipment {
  id: string;
  modelo: string;
  numeroSerie: string;
  software: string;
  observacoes: string;
}

interface Props {
  formData: Record<string, any>;
  selectedPlanDetails: any;
  isLoadingPlan?: boolean;
  shEquipments: SHEquipment[];
}

interface Emits {
  (e: 'update-field', field: string, value: any): void;
  (e: 'plan-selected', planId: string): void;
  (e: 'equipment-updated', data: { action: string; index?: number; equipment?: SHEquipment }): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handlePlanSelection = (planId: string) => {
  emit('plan-selected', planId);
};

// Equipment management functions
const addEquipment = () => {
  const newEquipment: SHEquipment = {
    id: crypto.randomUUID(),
    modelo: '',
    numeroSerie: '',
    software: '',
    observacoes: '',
  };

  emit('equipment-updated', { action: 'add', equipment: newEquipment });
};

const updateEquipment = (index: number, equipment: SHEquipment) => {
  emit('equipment-updated', { action: 'update', index, equipment });
};

const removeEquipment = (index: number) => {
  emit('equipment-updated', { action: 'remove', index });
};

// Determine if plan details should be shown - S&H always requires distance
const shouldShowPlanDetails = computed(() => {
  if (!props.selectedPlanDetails) {
    return false;
  }

  // If we don't have form data (e.g., in tests), show plan details when selectedPlanDetails is provided
  if (!props.formData?.planIdSH) {
    return true;
  }

  // S&H plans always require distance for pricing
  const shouldShow = !!(props.formData?.planIdSH && props.formData?.distanceSH);

  return shouldShow;
});

// Convert S&H equipments to the format expected by DynamicPlanDetails
// S&H equipments don't have discounts, so we set discount to 0
const shEquipmentsForPricing = computed(() => {
  return props.shEquipments.map(equipment => ({
    id: equipment.id,
    modelo: equipment.modelo,
    numeroSerie: equipment.numeroSerie,
    desconto: 0, // S&H equipments don't have discounts
    observacoes: equipment.observacoes,
  }));
});
</script>

<style scoped>
.sh-contract-section {
  @apply space-y-6;
}

.contract-config-grid-sh {
  @apply grid grid-cols-1 gap-4;
}

@media (min-width: 768px) {
  .contract-config-grid-sh {
    @apply grid-cols-2;
  }
}

.config-field {
  @apply flex flex-col gap-2;
}

.config-label {
  @apply font-semibold text-gray-700 text-sm;
}

.config-label.required::after {
  content: none;
}

.config-select {
  @apply px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm transition-colors duration-200 touch-target;
}

.config-select:focus {
  @apply outline-none border-green-500 ring-2 ring-green-200;
}

.equipment-section {
  @apply my-6;
}

.equipment-header {
  @apply flex justify-between items-center mb-4;
}

.equipment-header h4 {
  @apply text-base font-semibold text-gray-700 m-0;
}

.add-equipment-btn {
  @apply mt-4 bg-green-500 text-white border-none px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-200 touch-target w-full;
}

.add-equipment-btn:hover {
  @apply bg-green-600;
}

.equipment-info-callout {
  @apply flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4;
}

.info-icon {
  @apply text-blue-600 text-base;
}

.equipment-info-callout span:last-child {
  @apply text-sm text-blue-700 leading-relaxed;
}

.equipment-list {
  @apply space-y-4;
}

.equipment-info-section {
  @apply space-y-4;
}

.equipment-info-section h4 {
  @apply text-base font-semibold text-gray-700;
}

.equipment-fields-grid {
  @apply grid grid-cols-1 gap-4;
}

@media (min-width: 768px) {
  .equipment-fields-grid {
    @apply grid-cols-3;
  }
}

.form-field {
  @apply flex flex-col gap-2;
}

.form-label {
  @apply font-medium text-gray-700 text-sm;
}

.form-input {
  @apply px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm transition-colors duration-200 touch-target;
}

.form-input:focus {
  @apply outline-none border-green-500 ring-2 ring-green-200;
}

.plan-loading-state {
  @apply mt-6 border border-gray-200 rounded-lg p-6 bg-gray-50;
}

.loading-spinner {
  @apply flex items-center justify-center gap-3;
}

.spinner {
  @apply w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin;
}

.loading-text {
  @apply text-sm text-gray-600 font-medium;
}

/* Mobile responsiveness improvements */
@media (max-width: 640px) {
  .contract-config-grid-sh {
    @apply gap-3;
  }

  .equipment-fields-grid {
    @apply gap-3;
  }

  .config-select,
  .form-input {
    @apply py-3;
  }

  .equipment-info-callout {
    @apply p-2;
  }
}

/* Touch-friendly interactions */
@media (hover: none) {
  .add-equipment-btn:active {
    @apply bg-green-700;
  }
}
</style>

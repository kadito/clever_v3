<template>
  <div class="phase3-form">
    <!-- Software Selection (cascading dropdowns) -->
    <fieldset class="form-field">
      <legend class="form-label" :class="{ 'text-red-600': hasError('software') }">Software</legend>

      <!-- Brand dropdown -->
      <div class="dropdown-field">
        <label class="dropdown-label" for="phase3Brand">Marca</label>
        <select
          id="phase3Brand"
          class="form-select"
          :class="{ 'field-invalid': hasError('software') && !selectedBrand }"
          :disabled="disabled"
          :value="modelValue.software?.brand ?? ''"
          @change="onBrandChange(($event.target as HTMLSelectElement).value)"
        >
          <option value="" disabled>Selecione uma marca...</option>
          <option v-for="h in SOFTWARE_HIERARCHY" :key="h.brand" :value="h.brand">
            {{ h.brand }}
          </option>
        </select>
      </div>

      <!-- Sub-product dropdown (conditional) -->
      <div v-if="currentHierarchy?.subProducts" class="dropdown-field">
        <label class="dropdown-label" for="phase3SubProduct">Sub-produto</label>
        <select
          id="phase3SubProduct"
          class="form-select"
          :class="{ 'field-invalid': hasError('software') && !modelValue.software?.subProduct }"
          :disabled="disabled"
          :value="modelValue.software?.subProduct ?? ''"
          @change="onSubProductChange(($event.target as HTMLSelectElement).value)"
        >
          <option value="" disabled>Selecione um sub-produto...</option>
          <option v-for="sp in currentHierarchy.subProducts" :key="sp.name" :value="sp.name">
            {{ sp.name }}
          </option>
        </select>
      </div>

      <!-- Module dropdown (conditional — Pix sub-products) -->
      <div v-if="currentSubProduct?.modules" class="dropdown-field">
        <label class="dropdown-label" for="phase3Module">Módulo</label>
        <select
          id="phase3Module"
          class="form-select"
          :class="{ 'field-invalid': hasError('software') && !modelValue.software?.module }"
          :disabled="disabled"
          :value="modelValue.software?.module ?? ''"
          @change="onModuleChange(($event.target as HTMLSelectElement).value)"
        >
          <option value="" disabled>Selecione um módulo...</option>
          <option v-for="mod in currentSubProduct.modules" :key="mod" :value="mod">
            {{ mod }}
          </option>
        </select>
      </div>

      <!-- Tier dropdown (conditional — Zon Soft sub-products) -->
      <div v-if="currentSubProduct?.tiers" class="dropdown-field">
        <label class="dropdown-label" for="phase3Tier">Plano</label>
        <select
          id="phase3Tier"
          class="form-select"
          :class="{ 'field-invalid': hasError('software') && !modelValue.software?.tier }"
          :disabled="disabled"
          :value="modelValue.software?.tier ?? ''"
          @change="onTierChange(($event.target as HTMLSelectElement).value)"
        >
          <option value="" disabled>Selecione um plano...</option>
          <option v-for="t in currentSubProduct.tiers" :key="t" :value="t">
            {{ t }}
          </option>
        </select>
      </div>

      <!-- License type dropdown (conditional — PT CERT) -->
      <div v-if="currentHierarchy?.licenseTypes" class="dropdown-field">
        <label class="dropdown-label" for="phase3LicenseType">Tipo de Licença</label>
        <select
          id="phase3LicenseType"
          class="form-select"
          :class="{ 'field-invalid': hasError('software') && !modelValue.software?.licenseType }"
          :disabled="disabled"
          :value="modelValue.software?.licenseType ?? ''"
          @change="onLicenseTypeChange(($event.target as HTMLSelectElement).value)"
        >
          <option value="" disabled>Selecione um tipo...</option>
          <option v-for="lt in currentHierarchy.licenseTypes" :key="lt" :value="lt">
            {{ lt }}
          </option>
        </select>
      </div>

      <span v-if="hasError('software')" class="field-error">Selecione o software completo</span>
    </fieldset>

    <!-- Identificação / Referência -->
    <div class="form-field">
      <label class="form-label" for="phase3IdentificacaoReferencia">Identificação / Referência (marcação na folha)</label>
      <input
        id="phase3IdentificacaoReferencia"
        type="text"
        class="form-input"
        :value="modelValue.identificacaoReferencia"
        :disabled="disabled"
        placeholder="Identificação / Referência"
        @input="updateField('identificacaoReferencia', ($event.target as HTMLInputElement).value)"
      >
    </div>

    <!-- N.º Licença -->
    <div class="form-field">
      <label class="form-label" for="phase3NumeroLicenca">N.º Licença</label>
      <input
        id="phase3NumeroLicenca"
        type="text"
        class="form-input"
        :value="modelValue.numeroLicenca"
        :disabled="disabled"
        placeholder="Número de licença"
        @input="updateField('numeroLicenca', ($event.target as HTMLInputElement).value)"
      >
    </div>

    <!-- Verificação início programação (toggle switch) -->
    <div class="form-field">
      <div class="toggle-field">
        <span class="form-label" :class="{ 'text-red-600': hasError('verificacaoInicioProgramacao') }">Verificação início programação</span>
        <button
          type="button"
          role="switch"
          :aria-checked="modelValue.verificacaoInicioProgramacao"
          aria-label="Verificação início programação"
          class="switch"
          :class="{ 'switch--on': modelValue.verificacaoInicioProgramacao, 'ring-2 ring-red-500': hasError('verificacaoInicioProgramacao') }"
          :disabled="disabled"
          @click="updateField('verificacaoInicioProgramacao', !modelValue.verificacaoInicioProgramacao)"
        >
          <span class="switch-thumb" />
        </button>
      </div>
      <span v-if="hasError('verificacaoInicioProgramacao')" class="field-error">Deve ser ativado</span>
    </div>

    <!-- Teste final de todos os equipamentos e acessórios (toggle switch) -->
    <div class="form-field">
      <div class="toggle-field">
        <span class="form-label" :class="{ 'text-red-600': hasError('testeFinalEquipamentos') }">Teste final de todos os equipamentos e acessórios</span>
        <button
          type="button"
          role="switch"
          :aria-checked="modelValue.testeFinalEquipamentos"
          aria-label="Teste final de todos os equipamentos e acessórios"
          class="switch"
          :class="{ 'switch--on': modelValue.testeFinalEquipamentos, 'ring-2 ring-red-500': hasError('testeFinalEquipamentos') }"
          :disabled="disabled"
          @click="updateField('testeFinalEquipamentos', !modelValue.testeFinalEquipamentos)"
        >
          <span class="switch-thumb" />
        </button>
      </div>
      <span v-if="hasError('testeFinalEquipamentos')" class="field-error">Deve ser ativado</span>
    </div>

    <!-- Notas de Programação -->
    <div class="form-field">
      <label class="form-label" for="phase3NotasProgramacao">Notas de Programação</label>
      <textarea
        id="phase3NotasProgramacao"
        class="form-textarea"
        :value="modelValue.notasProgramacao"
        :disabled="disabled"
        placeholder="Notas de verificação da programação..."
        rows="4"
        @input="updateField('notasProgramacao', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Phase3ProgramacaoData, SoftwareSelection } from '@clever/shared';
import { SOFTWARE_HIERARCHY } from '@clever/shared';

interface Props {
  modelValue: Phase3ProgramacaoData;
  disabled?: boolean;
  validationErrors?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  validationErrors: () => [],
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: Phase3ProgramacaoData): void;
}>();

// ── Computed helpers ────────────────────────────────────────────────

const selectedBrand = computed(() => props.modelValue.software?.brand ?? '');

const currentHierarchy = computed(() => {
  if (!selectedBrand.value) return undefined;
  return SOFTWARE_HIERARCHY.find((h) => h.brand === selectedBrand.value);
});

const currentSubProduct = computed(() => {
  const subProductName = props.modelValue.software?.subProduct;
  if (!subProductName || !currentHierarchy.value?.subProducts) return undefined;
  return currentHierarchy.value.subProducts.find((sp) => sp.name === subProductName);
});

// ── Event handlers ──────────────────────────────────────────────────

const hasError = (field: string): boolean => props.validationErrors.includes(field);

const updateField = (field: keyof Phase3ProgramacaoData, value: string | boolean): void => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
  });
};

const updateSoftware = (selection: SoftwareSelection | null): void => {
  emit('update:modelValue', {
    ...props.modelValue,
    software: selection,
  });
};

const onBrandChange = (brand: string): void => {
  if (!brand) {
    updateSoftware(null);
    return;
  }
  // Reset all sub-fields when brand changes
  updateSoftware({ brand });
};

const onSubProductChange = (subProduct: string): void => {
  if (!props.modelValue.software) return;
  // Reset module and tier when subProduct changes
  updateSoftware({
    brand: props.modelValue.software.brand,
    subProduct,
  });
};

const onModuleChange = (module: string): void => {
  if (!props.modelValue.software) return;
  updateSoftware({
    ...props.modelValue.software,
    module,
  });
};

const onTierChange = (tier: string): void => {
  if (!props.modelValue.software) return;
  updateSoftware({
    ...props.modelValue.software,
    tier,
  });
};

const onLicenseTypeChange = (licenseType: string): void => {
  if (!props.modelValue.software) return;
  updateSoftware({
    ...props.modelValue.software,
    licenseType,
  });
};
</script>

<style scoped>
.phase3-form {
  @apply flex flex-col gap-4;
}

.form-field {
  @apply flex flex-col gap-1;
}

.form-label {
  @apply block text-sm font-medium text-gray-700;
  font-size: 16px;
}

.dropdown-field {
  @apply flex flex-col gap-1 mt-2;
}

.dropdown-label {
  @apply block text-xs font-medium text-gray-500;
  font-size: 14px;
}

.form-select {
  @apply w-full rounded-md border border-gray-300 px-3 py-2
         text-gray-700 bg-white
         focus:outline-none focus:ring-2 focus:border-transparent
         appearance-none;
  min-height: 44px;
  font-size: 16px;
  --tw-ring-color: #75AE93;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

.form-select:focus {
  --tw-ring-color: #75AE93;
}

.form-select:disabled {
  @apply bg-gray-50 cursor-not-allowed opacity-75;
}

.form-input,
.form-textarea {
  @apply w-full rounded-md border border-gray-300 px-3 py-2
         text-gray-700 placeholder-gray-400
         focus:outline-none focus:ring-2 focus:border-transparent;
  min-height: 44px;
  font-size: 16px;
  --tw-ring-color: #75AE93;
}

.form-input:focus,
.form-textarea:focus {
  --tw-ring-color: #75AE93;
}

.form-input:disabled,
.form-textarea:disabled {
  @apply bg-gray-50 cursor-not-allowed opacity-75;
}

.field-invalid {
  @apply border-red-500;
}

.field-error {
  @apply text-xs text-red-600 mt-0.5;
}

.form-textarea {
  resize: vertical;
}

/* Toggle field layout */
.toggle-field {
  @apply flex items-center justify-between;
  min-height: 44px;
}

/* Switch (same as PhaseChecklist.vue) */
.switch {
  @apply relative inline-flex flex-shrink-0 rounded-full
         transition-colors duration-200 ease-in-out cursor-pointer;
  width: 50px;
  height: 26px;
  background-color: #e5e7eb;
  -webkit-tap-highlight-color: transparent;
}

.switch:disabled {
  @apply cursor-not-allowed opacity-60;
}

.switch--on {
  background-color: rgb(117, 174, 147);
}

.switch-thumb {
  @apply absolute rounded-full bg-white
         transition-transform duration-200 ease-in-out;
  top: 50%;
  left: 3px;
  width: 20px;
  height: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.1);
  transform: translateY(-50%) translateX(0);
}

.switch--on .switch-thumb {
  transform: translateY(-50%) translateX(24px);
}

@media (max-width: 640px) {
  .switch {
    width: 48px;
    height: 28px;
  }

  .switch-thumb {
    width: 22px;
    height: 22px;
  }

  .switch--on .switch-thumb {
    transform: translateY(-50%) translateX(20px);
  }
}

.switch:focus-visible {
  @apply outline-none ring-2 ring-offset-2;
  ring-color: #75AE93;
}
</style>

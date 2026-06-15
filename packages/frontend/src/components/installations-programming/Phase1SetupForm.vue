<template>
  <div class="phase1-form">
    <!-- Client Selection -->
    <div class="form-field">
      <label class="form-label">Cliente</label>
      <ClientSearchInput
        :model-value="modelValue.clientId"
        :disabled="disabled"
        :has-error="hasError('clientId')"
        @update:model-value="updateField('clientId', $event)"
      />
      <span v-if="hasError('clientId')" class="field-error">Campo obrigatório</span>
    </div>

    <!-- Installation Type -->
    <div class="form-field">
      <label class="form-label" for="installationType">Tipo de Instalação</label>
      <select
        id="installationType"
        class="form-select"
        :class="{ 'field-invalid': hasError('installationType') }"
        :value="modelValue.installationType"
        :disabled="disabled"
        @change="updateField('installationType', ($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled>Selecionar tipo...</option>
        <option
          v-for="type in INSTALLATION_TYPES"
          :key="type"
          :value="type"
        >
          {{ type }}
        </option>
      </select>
      <span v-if="hasError('installationType')" class="field-error">Campo obrigatório</span>
    </div>

    <!-- Equipment Marca -->
    <div class="form-field">
      <label class="form-label" for="equipmentMarca">Marca</label>
      <input
        id="equipmentMarca"
        type="text"
        class="form-input"
        :class="{ 'field-invalid': hasError('equipmentMarca') }"
        :value="modelValue.equipmentMarca"
        :disabled="disabled"
        placeholder="Marca do equipamento"
        @input="updateField('equipmentMarca', ($event.target as HTMLInputElement).value)"
      >
      <span v-if="hasError('equipmentMarca')" class="field-error">Campo obrigatório</span>
    </div>

    <!-- Equipment Modelo -->
    <div class="form-field">
      <label class="form-label" for="equipmentModelo">Modelo</label>
      <input
        id="equipmentModelo"
        type="text"
        class="form-input"
        :value="modelValue.equipmentModelo"
        :disabled="disabled"
        placeholder="Modelo do equipamento"
        @input="updateField('equipmentModelo', ($event.target as HTMLInputElement).value)"
      >
    </div>

    <!-- Equipment Número de Série -->
    <div class="form-field">
      <label class="form-label" for="equipmentNumeroSerie">N.º Série</label>
      <input
        id="equipmentNumeroSerie"
        type="text"
        class="form-input"
        :value="modelValue.equipmentNumeroSerie"
        :disabled="disabled"
        placeholder="Número de série"
        @input="updateField('equipmentNumeroSerie', ($event.target as HTMLInputElement).value)"
      >
    </div>

    <!-- Equipment Fornecedor -->
    <div class="form-field">
      <label class="form-label" for="equipmentFornecedor">Fornecedor</label>
      <input
        id="equipmentFornecedor"
        type="text"
        class="form-input"
        :value="modelValue.equipmentFornecedor"
        :disabled="disabled"
        placeholder="Fornecedor do equipamento"
        @input="updateField('equipmentFornecedor', ($event.target as HTMLInputElement).value)"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { INSTALLATION_TYPES } from '@clever/shared';
import type { InstallationType } from '@clever/shared';
import ClientSearchInput from '@/components/common/ClientSearchInput.vue';

interface Phase1ModelValue {
  clientId: string;
  installationType: InstallationType;
  equipmentMarca: string;
  equipmentModelo: string;
  equipmentNumeroSerie: string;
  equipmentFornecedor: string;
}

interface Props {
  modelValue: Phase1ModelValue;
  disabled?: boolean;
  validationErrors?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  validationErrors: () => [],
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: Phase1ModelValue): void;
}>();

const hasError = (field: string): boolean => props.validationErrors.includes(field);

const updateField = (field: keyof Phase1ModelValue, value: string): void => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
  });
};
</script>

<style scoped>
.phase1-form {
  @apply flex flex-col gap-4;
}

.form-field {
  @apply flex flex-col gap-1;
}

.form-label {
  @apply block text-sm font-medium text-gray-700;
  font-size: 16px;
}

.form-select,
.form-input {
  @apply w-full rounded-md border border-gray-300 px-3 py-2
         text-gray-700 placeholder-gray-400
         focus:outline-none focus:ring-2 focus:border-transparent;
  min-height: 44px;
  font-size: 16px;
  --tw-ring-color: #75AE93;
}

.form-select:focus,
.form-input:focus {
  --tw-ring-color: #75AE93;
}

.form-select:disabled,
.form-input:disabled {
  @apply bg-gray-50 cursor-not-allowed opacity-75;
}

.field-invalid {
  @apply border-red-500;
}

.field-invalid:focus {
  --tw-ring-color: #ef4444;
}

.field-error {
  @apply text-xs text-red-600 mt-0.5;
}
</style>

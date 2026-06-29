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

    <!-- Installation Entries -->
    <div class="form-field">
      <label class="form-label">Instalações</label>

      <!-- Existing entries -->
      <div
        v-for="(entry, index) in modelValue.installationEntries"
        :key="index"
        class="entry-card"
      >
        <div class="entry-card-header">
          <span class="entry-card-title">Instalação {{ index + 1 }}</span>
          <button
            type="button"
            class="entry-remove-button"
            :disabled="disabled"
            :aria-label="`Remover instalação ${index + 1}`"
            @click="removeEntry(index)"
          >
            ✕
          </button>
        </div>

        <div class="entry-card-body">
          <!-- Tipo -->
          <div class="entry-field">
            <label class="entry-label" :for="`entry-tipo-${index}`">Tipo</label>
            <select
              :id="`entry-tipo-${index}`"
              class="form-select"
              :disabled="disabled"
              :value="entry.tipo"
              @change="updateEntryField(index, 'tipo', ($event.target as HTMLSelectElement).value)"
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
          </div>

          <!-- Marca -->
          <div class="entry-field">
            <label class="entry-label" :for="`entry-marca-${index}`">Marca</label>
            <input
              :id="`entry-marca-${index}`"
              type="text"
              class="form-input"
              :disabled="disabled"
              :value="entry.marca"
              placeholder="Marca do equipamento"
              @input="updateEntryField(index, 'marca', ($event.target as HTMLInputElement).value)"
            >
          </div>

          <!-- Modelo -->
          <div class="entry-field">
            <label class="entry-label" :for="`entry-modelo-${index}`">Modelo</label>
            <input
              :id="`entry-modelo-${index}`"
              type="text"
              class="form-input"
              :disabled="disabled"
              :value="entry.modelo"
              placeholder="Modelo do equipamento"
              @input="updateEntryField(index, 'modelo', ($event.target as HTMLInputElement).value)"
            >
          </div>

          <!-- Número de Série -->
          <div class="entry-field">
            <label class="entry-label" :for="`entry-serie-${index}`">N.º Série</label>
            <input
              :id="`entry-serie-${index}`"
              type="text"
              class="form-input"
              :disabled="disabled"
              :value="entry.numeroSerie"
              placeholder="Número de série"
              @input="updateEntryField(index, 'numeroSerie', ($event.target as HTMLInputElement).value)"
            >
          </div>

          <!-- Fornecedor -->
          <div class="entry-field">
            <label class="entry-label" :for="`entry-fornecedor-${index}`">Fornecedor</label>
            <input
              :id="`entry-fornecedor-${index}`"
              type="text"
              class="form-input"
              :disabled="disabled"
              :value="entry.fornecedor"
              placeholder="Fornecedor do equipamento"
              @input="updateEntryField(index, 'fornecedor', ($event.target as HTMLInputElement).value)"
            >
          </div>
        </div>
      </div>

      <!-- Add entry button -->
      <button
        type="button"
        class="add-entry-button"
        :disabled="disabled"
        @click="addEntry"
      >
        Adicionar
      </button>

      <span v-if="hasError('installationEntries')" class="field-error">Adicione pelo menos uma instalação</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { INSTALLATION_TYPES } from '@clever/shared';
import type { InstallationEntry, InstallationType } from '@clever/shared';
import ClientSearchInput from '@/components/common/ClientSearchInput.vue';

interface Phase1ModelValue {
  clientId: string;
  installationEntries: InstallationEntry[];
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

const addEntry = (): void => {
  const newEntry: InstallationEntry = {
    tipo: '' as InstallationType,
    marca: '',
    modelo: '',
    numeroSerie: '',
    fornecedor: '',
  };
  emit('update:modelValue', {
    ...props.modelValue,
    installationEntries: [...props.modelValue.installationEntries, newEntry],
  });
};

const removeEntry = (index: number): void => {
  const updated = props.modelValue.installationEntries.filter((_, i) => i !== index);
  emit('update:modelValue', {
    ...props.modelValue,
    installationEntries: updated,
  });
};

const updateEntryField = (index: number, field: keyof InstallationEntry, value: string): void => {
  const updated = [...props.modelValue.installationEntries];
  updated[index] = { ...updated[index], [field]: value };
  emit('update:modelValue', {
    ...props.modelValue,
    installationEntries: updated,
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

.field-error {
  @apply text-xs text-red-600 mt-0.5;
}

/* Entry cards */
.entry-card {
  @apply border border-gray-200 rounded-lg overflow-hidden mt-2;
}

.entry-card-header {
  @apply flex items-center justify-between bg-gray-50 px-4 py-2 border-b border-gray-200;
}

.entry-card-title {
  @apply text-sm font-medium text-gray-700;
}

.entry-remove-button {
  @apply flex items-center justify-center rounded-full
         text-gray-500 hover:text-red-600 hover:bg-red-50
         focus:outline-none;
  min-height: 44px;
  min-width: 44px;
  font-size: 14px;
}

.entry-remove-button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.entry-card-body {
  @apply flex flex-col gap-3 p-4;
}

.entry-field {
  @apply flex flex-col gap-1;
}

.entry-label {
  @apply text-sm text-gray-600;
}

/* Add button */
.add-entry-button {
  @apply mt-2 px-4 py-2 rounded-md text-white font-medium
         focus:outline-none focus:ring-2 focus:ring-offset-2;
  min-height: 44px;
  min-width: 44px;
  background-color: #75AE93;
  --tw-ring-color: #75AE93;
}

.add-entry-button:hover:not(:disabled) {
  background-color: #5f9a7d;
}

.add-entry-button:disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style>

<template>
  <div class="phase4-form">
    <!-- Equipment Checklist -->
    <PhaseChecklist
      :model-value="modelValue.checklist"
      :disabled="disabled"
      @update:model-value="updateChecklist"
    />

    <!-- Equipamento Adicional -->
    <div class="form-field">
      <label class="form-label">Equipamento adicional</label>
      <div class="toggle-group">
        <button
          type="button"
          class="toggle-btn"
          :class="modelValue.equipamentoAdicional === true ? 'toggle-btn-active-yes' : 'toggle-btn-inactive'"
          :disabled="disabled"
          @click="updateField('equipamentoAdicional', true)"
        >
          Sim
        </button>
        <button
          type="button"
          class="toggle-btn"
          :class="modelValue.equipamentoAdicional === false ? 'toggle-btn-active-no' : 'toggle-btn-inactive'"
          :disabled="disabled"
          @click="updateField('equipamentoAdicional', false)"
        >
          Não
        </button>
      </div>
    </div>

    <!-- Motivo (shown when equipamentoAdicional === false) -->
    <div v-if="modelValue.equipamentoAdicional === false" class="conditional-field">
      <div class="form-field">
        <label
          class="form-label"
          :class="{ 'label-error': hasError('equipamentoAdicionalMotivo') }"
          for="phase4EquipamentoAdicionalMotivo"
        >
          Porquê?
        </label>
        <textarea
          id="phase4EquipamentoAdicionalMotivo"
          class="form-textarea"
          :class="{ 'input-error': hasError('equipamentoAdicionalMotivo') }"
          :value="modelValue.equipamentoAdicionalMotivo"
          :disabled="disabled"
          placeholder="Porquê?"
          rows="3"
          @input="updateField('equipamentoAdicionalMotivo', ($event.target as HTMLTextAreaElement).value)"
        />
        <span v-if="hasError('equipamentoAdicionalMotivo')" class="error-text">
          Este campo é obrigatório
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Phase4PreparacaoData, ToggleableChecklistCategory, ToggleableCpaChecklistCategory } from '@clever/shared';
import PhaseChecklist from '@/components/installations-programming/PhaseChecklist.vue';

type ChecklistModelValue = Record<string, ToggleableChecklistCategory | ToggleableCpaChecklistCategory>;

interface Props {
  modelValue: Phase4PreparacaoData;
  disabled?: boolean;
  validationErrors?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  validationErrors: () => [],
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: Phase4PreparacaoData): void;
}>();

const hasError = (field: string): boolean => props.validationErrors.includes(field);

const updateField = (field: 'equipamentoAdicional' | 'equipamentoAdicionalMotivo', value: boolean | string): void => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
  });
};

const updateChecklist = (value: ChecklistModelValue): void => {
  emit('update:modelValue', {
    ...props.modelValue,
    checklist: value as Phase4PreparacaoData['checklist'],
  });
};
</script>

<style scoped>
.phase4-form {
  @apply flex flex-col gap-4;
}

.form-field {
  @apply flex flex-col gap-1;
}

.form-label {
  @apply block text-sm font-medium text-gray-700;
  font-size: 16px;
}

.toggle-group {
  @apply flex gap-2;
}

.toggle-btn {
  @apply flex-1 rounded-md px-4 py-2 text-sm font-medium
         transition-colors duration-150 focus:outline-none focus:ring-2;
  min-height: 44px;
  font-size: 16px;
  --tw-ring-color: #75AE93;
}

.toggle-btn:disabled {
  @apply cursor-not-allowed opacity-75;
}

.toggle-btn-active-yes {
  @apply bg-green-600 text-white;
}

.toggle-btn-active-no {
  @apply bg-red-600 text-white;
}

.toggle-btn-inactive {
  @apply bg-gray-200 text-gray-600;
}

.toggle-btn-inactive:not(:disabled):hover {
  @apply bg-gray-300;
}

.conditional-field {
  @apply pl-2 border-l-2 border-gray-300;
}

.form-textarea {
  @apply w-full rounded-md border border-gray-300 px-3 py-2
         text-gray-700 placeholder-gray-400
         focus:outline-none focus:ring-2 focus:border-transparent resize-y;
  min-height: 44px;
  font-size: 16px;
  --tw-ring-color: #75AE93;
}

.form-textarea:focus {
  --tw-ring-color: #75AE93;
}

.form-textarea:disabled {
  @apply bg-gray-50 cursor-not-allowed opacity-75;
}

.input-error {
  @apply border-red-500;
}

.label-error {
  @apply text-red-600;
}

.error-text {
  @apply text-xs text-red-600 mt-1;
}
</style>

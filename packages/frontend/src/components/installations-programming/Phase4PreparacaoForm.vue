<template>
  <div class="phase4-form">
    <!-- Material Adicional -->
    <div class="form-field">
      <label class="form-label" for="phase4MaterialAdicional">Material Adicional</label>
      <input
        id="phase4MaterialAdicional"
        type="text"
        class="form-input"
        :value="modelValue.materialAdicional"
        :disabled="disabled"
        placeholder="Material adicional necessário..."
        @input="updateMaterialAdicional(($event.target as HTMLInputElement).value)"
      >
    </div>

    <!-- Equipment Checklist -->
    <PhaseChecklist
      :model-value="modelValue.checklist"
      :disabled="disabled"
      @update:model-value="updateChecklist"
    />
  </div>
</template>

<script setup lang="ts">
import type { Phase4PreparacaoData, EquipmentChecklist } from '@clever/shared';
import PhaseChecklist from '@/components/installations-programming/PhaseChecklist.vue';

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

const updateMaterialAdicional = (value: string): void => {
  emit('update:modelValue', {
    ...props.modelValue,
    materialAdicional: value,
  });
};

const updateChecklist = (value: EquipmentChecklist): void => {
  emit('update:modelValue', {
    ...props.modelValue,
    checklist: value,
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

.form-input {
  @apply w-full rounded-md border border-gray-300 px-3 py-2
         text-gray-700 placeholder-gray-400
         focus:outline-none focus:ring-2 focus:border-transparent;
  min-height: 44px;
  font-size: 16px;
  --tw-ring-color: #75AE93;
}

.form-input:focus {
  --tw-ring-color: #75AE93;
}

.form-input:disabled {
  @apply bg-gray-50 cursor-not-allowed opacity-75;
}
</style>

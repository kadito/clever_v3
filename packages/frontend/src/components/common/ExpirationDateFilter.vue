<template>
  <select
    :value="modelValue ?? ''"
    :class="[
      'block w-full sm:w-auto border border-gray-300 rounded-lg py-3 px-4 text-base',
      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
      'min-h-[44px] appearance-none bg-white',
      modelValue ? 'text-gray-700' : 'text-gray-400',
    ]"
    @change="onChange"
  >
    <option value="" disabled hidden>Data de Expiração</option>
    <option v-for="option in options" :key="option.value" :value="option.value" class="text-gray-700">
      {{ option.label }}
    </option>
    <option v-if="modelValue" value="">Limpar filtro</option>
  </select>
</template>

<script setup lang="ts">
import type { FilterOption } from '@/composables/useExpirationFilter';

defineProps<{
  options: FilterOption[];
  modelValue: string | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
}>();

function onChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  emit('update:modelValue', value === '' ? null : value);
}
</script>

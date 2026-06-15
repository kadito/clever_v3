<template>
  <div class="phase5-form">
    <!-- Instalação Section -->
    <h3 class="section-header">Instalação</h3>

    <!-- N.º Fatura -->
    <div class="form-field">
      <label class="form-label" for="phase5NrFatura">N.º Fatura</label>
      <input
        id="phase5NrFatura"
        type="text"
        class="form-input"
        :value="modelValue.nrFatura"
        :disabled="disabled"
        placeholder="N.º Fatura"
        @input="updateField('nrFatura', ($event.target as HTMLInputElement).value)"
      >
    </div>

    <!-- N.º Guia de Transporte -->
    <div class="form-field">
      <label class="form-label" for="phase5NrGuiaTransporte">N.º Guia de Transporte</label>
      <input
        id="phase5NrGuiaTransporte"
        type="text"
        class="form-input"
        :value="modelValue.nrGuiaTransporte"
        :disabled="disabled"
        placeholder="N.º Guia de Transporte"
        @input="updateField('nrGuiaTransporte', ($event.target as HTMLInputElement).value)"
      >
    </div>

    <!-- Data Instalação -->
    <div class="form-field">
      <label class="form-label" for="phase5DataInstalacao">Data Instalação</label>
      <input
        id="phase5DataInstalacao"
        type="date"
        class="form-input"
        :class="{ 'field-invalid': hasError('dataInstalacao') }"
        :value="modelValue.dataInstalacao"
        :disabled="disabled"
        @input="updateField('dataInstalacao', ($event.target as HTMLInputElement).value)"
      >
      <span v-if="hasError('dataInstalacao')" class="field-error">Campo obrigatório</span>
    </div>

    <!-- Técnico Instalação -->
    <div class="form-field">
      <label class="form-label" for="phase5TecnicoInstalacao">Técnico Instalação</label>
      <input
        id="phase5TecnicoInstalacao"
        type="text"
        class="form-input"
        :value="modelValue.tecnicoInstalacao"
        :disabled="disabled"
        placeholder="Técnico Instalação"
        @input="updateField('tecnicoInstalacao', ($event.target as HTMLInputElement).value)"
      >
    </div>

    <!-- Hora Inicial -->
    <div class="form-field">
      <label class="form-label" for="phase5HoraInicial">Hora Inicial</label>
      <input
        id="phase5HoraInicial"
        type="time"
        class="form-input"
        :class="{ 'field-invalid': hasError('horaInicial') }"
        :value="modelValue.horaInicial"
        :disabled="disabled"
        @input="updateField('horaInicial', ($event.target as HTMLInputElement).value)"
      >
      <span v-if="hasError('horaInicial')" class="field-error">Campo obrigatório</span>
    </div>

    <!-- Hora Final -->
    <div class="form-field">
      <label class="form-label" for="phase5HoraFinal">Hora Final</label>
      <input
        id="phase5HoraFinal"
        type="time"
        class="form-input"
        :class="{ 'field-invalid': hasError('horaFinal') }"
        :value="modelValue.horaFinal"
        :disabled="disabled"
        @input="updateField('horaFinal', ($event.target as HTMLInputElement).value)"
      >
      <span v-if="hasError('horaFinal')" class="field-error">Campo obrigatório</span>
    </div>

    <!-- Formação Section -->
    <h3 class="section-header">Formação</h3>

    <!-- Data Formação -->
    <div class="form-field">
      <label class="form-label" for="phase5DataFormacao">Data Formação</label>
      <input
        id="phase5DataFormacao"
        type="date"
        class="form-input"
        :value="modelValue.dataFormacao"
        :disabled="disabled"
        @input="updateField('dataFormacao', ($event.target as HTMLInputElement).value)"
      >
    </div>

    <!-- Formação Hora Inicial -->
    <div class="form-field">
      <label class="form-label" for="phase5FormacaoHoraInicial">Hora Inicial</label>
      <input
        id="phase5FormacaoHoraInicial"
        type="time"
        class="form-input"
        :value="modelValue.formacaoHoraInicial"
        :disabled="disabled"
        @input="updateField('formacaoHoraInicial', ($event.target as HTMLInputElement).value)"
      >
    </div>

    <!-- Formação Hora Final -->
    <div class="form-field">
      <label class="form-label" for="phase5FormacaoHoraFinal">Hora Final</label>
      <input
        id="phase5FormacaoHoraFinal"
        type="time"
        class="form-input"
        :value="modelValue.formacaoHoraFinal"
        :disabled="disabled"
        @input="updateField('formacaoHoraFinal', ($event.target as HTMLInputElement).value)"
      >
    </div>

    <!-- Quem recebeu a formação -->
    <div class="form-field">
      <label class="form-label" for="phase5QuemRecebeuFormacao">Quem recebeu a formação</label>
      <input
        id="phase5QuemRecebeuFormacao"
        type="text"
        class="form-input"
        :value="modelValue.quemRecebeuFormacao"
        :disabled="disabled"
        placeholder="Quem recebeu a formação"
        @input="updateField('quemRecebeuFormacao', ($event.target as HTMLInputElement).value)"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Phase5InstalacaoData } from '@clever/shared';

interface Props {
  modelValue: Phase5InstalacaoData;
  disabled?: boolean;
  validationErrors?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  validationErrors: () => [],
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: Phase5InstalacaoData): void;
}>();

const hasError = (field: string): boolean => props.validationErrors.includes(field);

const updateField = (field: keyof Phase5InstalacaoData, value: string): void => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
  });
};
</script>

<style scoped>
.phase5-form {
  @apply flex flex-col gap-4;
}

.section-header {
  @apply text-base font-semibold text-gray-800 mt-2 mb-1;
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

.field-invalid {
  @apply border-red-500;
}

.field-error {
  @apply text-xs text-red-600 mt-0.5;
}
</style>

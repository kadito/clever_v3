<template>
  <div class="phase6-form">
    <!-- Anydesk Section -->
    <div class="form-section">
      <h3 class="section-title">Anydesk</h3>

      <!-- Anydesk Configurado Toggle -->
      <div class="form-field">
        <label class="form-label">Anydesk configurado?</label>
        <div class="toggle-group">
          <button
            type="button"
            class="toggle-btn"
            :class="modelValue.anydeskConfigurado === true ? 'toggle-btn-active-yes' : 'toggle-btn-inactive'"
            :disabled="disabled"
            @click="updateField('anydeskConfigurado', true)"
          >
            Sim
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="modelValue.anydeskConfigurado === false ? 'toggle-btn-active-no' : 'toggle-btn-inactive'"
            :disabled="disabled"
            @click="updateField('anydeskConfigurado', false)"
          >
            Não
          </button>
        </div>
      </div>

      <!-- Anydesk Código (shown when anydeskConfigurado === true) -->
      <div v-if="modelValue.anydeskConfigurado === true" class="conditional-field">
        <div class="form-field">
          <label class="form-label" for="phase6AnydeskCodigo">Código Anydesk</label>
          <input
            id="phase6AnydeskCodigo"
            type="text"
            class="form-input"
            :value="modelValue.anydeskCodigo"
            :disabled="disabled"
            placeholder="Código Anydesk"
            @input="updateField('anydeskCodigo', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>

      <!-- Anydesk Motivo (shown when anydeskConfigurado === false) -->
      <div v-if="modelValue.anydeskConfigurado === false" class="conditional-field">
        <div class="form-field">
          <label class="form-label" for="phase6AnydeskMotivo">Motivo</label>
          <input
            id="phase6AnydeskMotivo"
            type="text"
            class="form-input"
            :value="modelValue.anydeskMotivo"
            :disabled="disabled"
            placeholder="Motivo"
            @input="updateField('anydeskMotivo', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>
    </div>

    <!-- Vectron Connect Section -->
    <div class="form-section">
      <h3 class="section-title">Vectron Connect</h3>

      <!-- Vectron Connect Configurado Toggle -->
      <div class="form-field">
        <label class="form-label">Vectron Connect configurado?</label>
        <div class="toggle-group">
          <button
            type="button"
            class="toggle-btn"
            :class="modelValue.vectronConnectConfigurado === true ? 'toggle-btn-active-yes' : 'toggle-btn-inactive'"
            :disabled="disabled"
            @click="updateField('vectronConnectConfigurado', true)"
          >
            Sim
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="modelValue.vectronConnectConfigurado === false ? 'toggle-btn-active-no' : 'toggle-btn-inactive'"
            :disabled="disabled"
            @click="updateField('vectronConnectConfigurado', false)"
          >
            Não
          </button>
        </div>
      </div>

      <!-- Vectron Connect Código (shown when vectronConnectConfigurado === true) -->
      <div v-if="modelValue.vectronConnectConfigurado === true" class="conditional-field">
        <div class="form-field">
          <label class="form-label" for="phase6VectronConnectCodigo">Código Vectron Connect</label>
          <input
            id="phase6VectronConnectCodigo"
            type="text"
            class="form-input"
            :value="modelValue.vectronConnectCodigo"
            :disabled="disabled"
            placeholder="Código Vectron Connect"
            @input="updateField('vectronConnectCodigo', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>

      <!-- Vectron Connect Motivo (shown when vectronConnectConfigurado === false) -->
      <div v-if="modelValue.vectronConnectConfigurado === false" class="conditional-field">
        <div class="form-field">
          <label class="form-label" for="phase6VectronConnectMotivo">Motivo</label>
          <input
            id="phase6VectronConnectMotivo"
            type="text"
            class="form-input"
            :value="modelValue.vectronConnectMotivo"
            :disabled="disabled"
            placeholder="Motivo"
            @input="updateField('vectronConnectMotivo', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>
    </div>

    <!-- Falhas Detectadas Section -->
    <div class="form-section">
      <h3 class="section-title">Falhas detectadas</h3>

      <!-- Falhas Detectadas Toggle -->
      <div class="form-field">
        <label class="form-label" :class="{ 'label-error': hasError('falhasDetectadas') }">
          Foram detectadas falhas?
        </label>
        <div class="toggle-group">
          <button
            type="button"
            class="toggle-btn"
            :class="modelValue.falhasDetectadas === true ? 'toggle-btn-active-yes' : 'toggle-btn-inactive'"
            :disabled="disabled"
            @click="updateField('falhasDetectadas', true)"
          >
            Sim
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="modelValue.falhasDetectadas === false ? 'toggle-btn-active-no' : 'toggle-btn-inactive'"
            :disabled="disabled"
            @click="updateField('falhasDetectadas', false)"
          >
            Não
          </button>
        </div>
        <span v-if="hasError('falhasDetectadas')" class="error-text">
          Este campo é obrigatório
        </span>
      </div>

      <!-- Falhas Descrição (shown when falhasDetectadas === true) -->
      <div v-if="modelValue.falhasDetectadas === true" class="conditional-field">
        <div class="form-field">
          <label
            class="form-label"
            :class="{ 'label-error': hasError('falhasDescricao') }"
            for="phase6FalhasDescricao"
          >
            Descrição das falhas
          </label>
          <textarea
            id="phase6FalhasDescricao"
            class="form-textarea"
            :class="{ 'input-error': hasError('falhasDescricao') }"
            :value="modelValue.falhasDescricao"
            :disabled="disabled"
            placeholder="Descreva as falhas detectadas..."
            rows="4"
            @input="updateField('falhasDescricao', ($event.target as HTMLTextAreaElement).value)"
          />
          <span v-if="hasError('falhasDescricao')" class="error-text">
            A descrição das falhas é obrigatória
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Phase6TestesData } from '@clever/shared';

interface Props {
  modelValue: Phase6TestesData;
  disabled?: boolean;
  validationErrors?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  validationErrors: () => [],
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: Phase6TestesData): void;
}>();

const hasError = (field: string): boolean => props.validationErrors.includes(field);

const updateField = (field: keyof Phase6TestesData, value: string | boolean | null): void => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
  });
};
</script>

<style scoped>
.phase6-form {
  @apply flex flex-col gap-6;
}

.form-section {
  @apply flex flex-col gap-4;
}

.section-title {
  @apply text-base font-semibold text-gray-800;
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

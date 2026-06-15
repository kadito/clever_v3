<template>
  <div class="phase3-form">
    <!-- Software -->
    <div class="form-field">
      <label class="form-label" for="phase3Software">Software</label>
      <input
        id="phase3Software"
        type="text"
        class="form-input"
        :class="{ 'field-invalid': hasError('software') }"
        :value="modelValue.software"
        :disabled="disabled"
        placeholder="Software"
        @input="updateField('software', ($event.target as HTMLInputElement).value)"
      >
      <span v-if="hasError('software')" class="field-error">Campo obrigatório</span>
    </div>

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
import type { Phase3ProgramacaoData } from '@clever/shared';

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

const hasError = (field: string): boolean => props.validationErrors.includes(field);

const updateField = (field: keyof Phase3ProgramacaoData, value: string | boolean): void => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
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

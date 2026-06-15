<template>
  <div class="phase2-form">
    <!-- Equipamento do Cliente -->
    <div class="form-field">
      <label class="form-label" for="phase2EquipamentoCliente">Equipamento do Cliente</label>
      <textarea
        id="phase2EquipamentoCliente"
        class="form-textarea"
        :value="modelValue.equipamentoCliente"
        :disabled="disabled"
        placeholder="Descreva o equipamento do cliente..."
        rows="3"
        @input="updateField('equipamentoCliente', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>
    </div>

    <!-- Equipment Condition Toggle -->
    <div class="form-field">
      <label class="form-label" :class="{ 'text-red-600': hasError('equipmentConditionOk') }">Equipamento em boas condições?</label>
      <div class="toggle-group">
        <button
          type="button"
          class="toggle-btn"
          :class="[
            modelValue.equipmentConditionOk === true ? 'toggle-btn-active-yes' : 'toggle-btn-inactive',
            hasError('equipmentConditionOk') ? 'ring-2 ring-red-500' : ''
          ]"
          :disabled="disabled"
          @click="updateField('equipmentConditionOk', true)"
        >
          Sim
        </button>
        <button
          type="button"
          class="toggle-btn"
          :class="[
            modelValue.equipmentConditionOk === false ? 'toggle-btn-active-no' : 'toggle-btn-inactive',
            hasError('equipmentConditionOk') ? 'ring-2 ring-red-500' : ''
          ]"
          :disabled="disabled"
          @click="updateField('equipmentConditionOk', false)"
        >
          Não
        </button>
      </div>
      <span v-if="hasError('equipmentConditionOk')" class="field-error">Selecione uma opção</span>
    </div>

    <!-- Conditional Verification Fields (shown when equipmentConditionOk === false) -->
    <div v-if="modelValue.equipmentConditionOk === false" class="verification-fields">
      <!-- Cabo -->
      <div class="form-field">
        <div class="toggle-field">
          <span class="form-label">Cabo</span>
          <button
            type="button"
            role="switch"
            :aria-checked="modelValue.verificacaoCabo"
            aria-label="Cabo"
            class="switch"
            :class="{ 'switch--on': modelValue.verificacaoCabo }"
            :disabled="disabled"
            @click="updateField('verificacaoCabo', !modelValue.verificacaoCabo)"
          >
            <span class="switch-thumb" />
          </button>
        </div>
      </div>

      <!-- Fechadura -->
      <div class="form-field">
        <div class="toggle-field">
          <span class="form-label">Fechadura</span>
          <button
            type="button"
            role="switch"
            :aria-checked="modelValue.verificacaoFechadura"
            aria-label="Fechadura"
            class="switch"
            :class="{ 'switch--on': modelValue.verificacaoFechadura }"
            :disabled="disabled"
            @click="updateField('verificacaoFechadura', !modelValue.verificacaoFechadura)"
          >
            <span class="switch-thumb" />
          </button>
        </div>
      </div>

      <!-- Chaves -->
      <div class="form-field">
        <div class="toggle-field">
          <span class="form-label">Chaves</span>
          <button
            type="button"
            role="switch"
            :aria-checked="modelValue.verificacaoChaves"
            aria-label="Chaves"
            class="switch"
            :class="{ 'switch--on': modelValue.verificacaoChaves }"
            :disabled="disabled"
            @click="updateField('verificacaoChaves', !modelValue.verificacaoChaves)"
          >
            <span class="switch-thumb" />
          </button>
        </div>
      </div>

      <!-- Testes ao equipamento -->
      <div class="form-field">
        <div class="toggle-field">
          <span class="form-label">Testes ao equipamento</span>
          <button
            type="button"
            role="switch"
            :aria-checked="modelValue.verificacaoTestes"
            aria-label="Testes ao equipamento"
            class="switch"
            :class="{ 'switch--on': modelValue.verificacaoTestes }"
            :disabled="disabled"
            @click="updateField('verificacaoTestes', !modelValue.verificacaoTestes)"
          >
            <span class="switch-thumb" />
          </button>
        </div>
      </div>
    </div>

    <!-- Observações -->
    <div class="form-field">
      <label class="form-label" for="phase2Observacoes">Observações</label>
      <textarea
        id="phase2Observacoes"
        class="form-textarea"
        :value="modelValue.observacoes"
        :disabled="disabled"
        placeholder="Observações"
        rows="3"
        @input="updateField('observacoes', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Phase2RececaoData } from '@clever/shared';

interface Props {
  modelValue: Phase2RececaoData;
  disabled?: boolean;
  validationErrors?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  validationErrors: () => [],
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: Phase2RececaoData): void;
}>();

const hasError = (field: string): boolean => props.validationErrors.includes(field);

const updateField = (field: keyof Phase2RececaoData, value: string | boolean | null): void => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
  });
};
</script>

<style scoped>
.phase2-form {
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

.form-textarea {
  resize: vertical;
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

.field-error {
  @apply text-xs text-red-600 mt-0.5;
}

.verification-fields {
  @apply flex flex-col gap-4 pl-2 border-l-2 border-red-300;
}

/* Toggle field layout */
.toggle-field {
  @apply flex items-center justify-between;
  min-height: 44px;
}

/* Switch */
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

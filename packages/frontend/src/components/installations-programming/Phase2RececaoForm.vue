<template>
  <div class="phase2-form">
    <!-- Equipamento do Cliente -->
    <div class="form-field">
      <label class="form-label" :class="{ 'text-red-600': hasError('equipamentoClienteDescricao') }">Equipamento do Cliente</label>
      <div class="toggle-group">
        <button
          type="button"
          class="toggle-btn"
          :class="[
            modelValue.equipamentoCliente === true ? 'toggle-btn-active-yes' : 'toggle-btn-inactive',
          ]"
          :disabled="disabled"
          @click="updateField('equipamentoCliente', true)"
        >
          Sim
        </button>
        <button
          type="button"
          class="toggle-btn"
          :class="[
            modelValue.equipamentoCliente === false ? 'toggle-btn-active-no' : 'toggle-btn-inactive',
          ]"
          :disabled="disabled"
          @click="updateField('equipamentoCliente', false)"
        >
          Não
        </button>
      </div>
    </div>

    <!-- Equipamento do Cliente — Descrição (conditional: visible when SIM) -->
    <div v-if="modelValue.equipamentoCliente === true" class="form-field">
      <label class="form-label" :class="{ 'text-red-600': hasError('equipamentoClienteDescricao') }" for="phase2EquipamentoClienteDescricao">Descrição do equipamento</label>
      <textarea
        id="phase2EquipamentoClienteDescricao"
        class="form-textarea"
        :class="{ 'border-red-500': hasError('equipamentoClienteDescricao') }"
        :value="modelValue.equipamentoClienteDescricao"
        :disabled="disabled"
        placeholder="Descreva o equipamento do cliente..."
        rows="3"
        @input="updateField('equipamentoClienteDescricao', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>
      <span v-if="hasError('equipamentoClienteDescricao')" class="field-error">Descrição do equipamento é obrigatória</span>
    </div>

    <!-- Verificações — Always visible -->
    <div class="form-field">
      <span class="form-label section-label">Verificações</span>

      <div class="verification-fields">
        <!-- Cabo -->
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

        <!-- Transformador -->
        <div class="toggle-field">
          <span class="form-label">Transformador</span>
          <button
            type="button"
            role="switch"
            :aria-checked="modelValue.verificacaoTransformador"
            aria-label="Transformador"
            class="switch"
            :class="{ 'switch--on': modelValue.verificacaoTransformador }"
            :disabled="disabled"
            @click="updateField('verificacaoTransformador', !modelValue.verificacaoTransformador)"
          >
            <span class="switch-thumb" />
          </button>
        </div>

        <!-- Fechadura -->
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

        <!-- Chaves -->
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

        <!-- Testes ao equipamento -->
        <div class="toggle-field">
          <span class="form-label">Testes ao equipamento</span>
          <button
            type="button"
            role="switch"
            :aria-checked="modelValue.verificacaoTestesEquipamento"
            aria-label="Testes ao equipamento"
            class="switch"
            :class="{ 'switch--on': modelValue.verificacaoTestesEquipamento }"
            :disabled="disabled"
            @click="updateField('verificacaoTestesEquipamento', !modelValue.verificacaoTestesEquipamento)"
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

.section-label {
  @apply text-base font-semibold text-gray-800;
}

.form-textarea {
  @apply w-full rounded-md border border-gray-300 px-3 py-2
         text-gray-700 placeholder-gray-400
         focus:outline-none focus:ring-2 focus:border-transparent;
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
  @apply flex flex-col gap-3 mt-2;
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

<template>
  <div class="benefit-fields-section">
    <h4>BENEFÍCIOS DO PLANO</h4>
    <div class="benefit-fields-grid">
      <div class="config-field">
        <label class="config-label">HORAS DE ASSISTÊNCIA ANUAL</label>
        <input
          type="number"
          :value="horasAssistencia"
          :disabled="disabled"
          placeholder="0"
          class="config-input"
          :class="{ 'form-element-error': errors.horasAssistencia }"
          data-testid="horas-assistencia-input"
          @input="handleInput('horasAssistencia', $event)"
          @blur="handleBlur('horasAssistencia', $event)"
        >
        <span class="field-hint">-1 = Ilimitado</span>
        <p
          v-if="errors.horasAssistencia"
          class="form-error"
          data-testid="horas-assistencia-error"
        >
          {{ errors.horasAssistencia }}
        </p>
      </div>

      <div class="config-field">
        <label class="config-label">DESLOCAÇÕES POR ANO</label>
        <input
          type="number"
          :value="deslocacoesPorAno"
          :disabled="disabled"
          placeholder="0"
          class="config-input"
          :class="{ 'form-element-error': errors.deslocacoesPorAno }"
          data-testid="deslocacoes-input"
          @input="handleInput('deslocacoesPorAno', $event)"
          @blur="handleBlur('deslocacoesPorAno', $event)"
        >
        <span class="field-hint">-1 = Ilimitado</span>
        <p
          v-if="errors.deslocacoesPorAno"
          class="form-error"
          data-testid="deslocacoes-error"
        >
          {{ errors.deslocacoesPorAno }}
        </p>
      </div>

      <div class="config-field">
        <label class="config-label">MANUTENÇÕES POR ANO</label>
        <input
          type="number"
          :value="manutencoesPorAno"
          :disabled="disabled"
          placeholder="0"
          class="config-input"
          :class="{ 'form-element-error': errors.manutencoesPorAno }"
          data-testid="manutencoes-input"
          @input="handleInput('manutencoesPorAno', $event)"
          @blur="handleBlur('manutencoesPorAno', $event)"
        >
        <span class="field-hint">-1 = Ilimitado</span>
        <p
          v-if="errors.manutencoesPorAno"
          class="form-error"
          data-testid="manutencoes-error"
        >
          {{ errors.manutencoesPorAno }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

interface Props {
  horasAssistencia: number;
  deslocacoesPorAno: number;
  manutencoesPorAno: number;
  disabled?: boolean;
}

interface Emits {
  (e: 'update:horasAssistencia', value: number): void;
  (e: 'update:deslocacoesPorAno', value: number): void;
  (e: 'update:manutencoesPorAno', value: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<Emits>();

const errors = reactive<Record<string, string | null>>({
  horasAssistencia: null,
  deslocacoesPorAno: null,
  manutencoesPorAno: null,
});

function validateBenefitValue(value: string): string | null {
  if (value === '' || value === undefined || value === null) {
    return 'Este campo é obrigatório';
  }

  const num = Number(value);

  if (isNaN(num) || !Number.isInteger(num)) {
    return 'Introduza um valor numérico válido';
  }

  if (num < 0 && num !== -1) {
    return 'O valor deve ser 0 ou superior, ou -1 para ilimitado';
  }

  return null;
}

type FieldName = 'horasAssistencia' | 'deslocacoesPorAno' | 'manutencoesPorAno';

const emitMap: Record<FieldName, (value: number) => void> = {
  horasAssistencia: (v: number) => emit('update:horasAssistencia', v),
  deslocacoesPorAno: (v: number) => emit('update:deslocacoesPorAno', v),
  manutencoesPorAno: (v: number) => emit('update:manutencoesPorAno', v),
};

function handleInput(field: FieldName, event: Event) {
  const rawValue = (event.target as HTMLInputElement).value;
  const error = validateBenefitValue(rawValue);
  errors[field] = error;

  // Always emit so the parent formData stays in sync with the input.
  // Without this, clearing the field would show an error but Vue would
  // re-render the old prop value back into the input on the next tick.
  const numValue = rawValue === '' ? ('' as unknown as number) : Number(rawValue);
  emitMap[field](numValue);
}

function handleBlur(field: FieldName, event: Event) {
  const rawValue = (event.target as HTMLInputElement).value;
  errors[field] = validateBenefitValue(rawValue);
}
</script>

<style scoped>
.benefit-fields-section {
  @apply space-y-4;
}

.benefit-fields-section h4 {
  @apply form-section-title-consistent text-base;
}

.benefit-fields-grid {
  @apply form-grid-consistent;
}

@media (min-width: 768px) {
  .benefit-fields-grid {
    @apply grid-cols-3;
  }
}

.config-field {
  @apply flex flex-col gap-2;
}

.config-label {
  @apply form-label-consistent;
}

.config-input {
  @apply form-input-consistent;
}

.config-input:disabled {
  @apply bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200;
}

.form-error {
  @apply form-error-message;
}

.field-hint {
  @apply text-xs text-gray-400;
}
</style>

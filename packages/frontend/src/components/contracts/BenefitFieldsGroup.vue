<template>
  <div class="benefit-fields-section">
    <!-- Manual mode banner -->
    <div
      v-if="mode === 'manual'"
      class="manual-mode-banner"
      data-testid="manual-mode-banner"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4 flex-shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clip-rule="evenodd"
        />
      </svg>
      <span>Com múltiplos equipamentos, os valores devem ser especificados manualmente</span>
    </div>

    <h4>BENEFÍCIOS DO PLANO</h4>

    <div class="benefit-fields-grid">
      <!-- Horas de Assistência — only for S&H -->
      <div
        v-if="contractType === 'S&H'"
        class="config-field"
      >
        <label class="config-label">
          HORAS DE ASSISTÊNCIA ANUAL
          <span
            v-if="mode === 'manual'"
            class="required-marker"
          >*</span>
        </label>
        <input
          type="number"
          :value="horasAssistencia"
          :disabled="mode === 'auto'"
          placeholder="0"
          class="config-input benefit-transition"
          :class="fieldClasses('horasAssistencia')"
          data-testid="horas-assistencia-input"
          @input="handleInput('horasAssistencia', $event)"
          @blur="handleBlur('horasAssistencia', $event)"
        >
        <span class="field-hint">-1 = Ilimitado</span>
        <p
          v-if="fieldError('horasAssistencia')"
          class="form-error"
          data-testid="horas-assistencia-error"
        >
          {{ fieldError('horasAssistencia') }}
        </p>
      </div>

      <!-- Deslocações por Ano — shown for both CPA and S&H -->
      <div class="config-field">
        <label class="config-label">
          DESLOCAÇÕES POR ANO
          <span
            v-if="mode === 'manual'"
            class="required-marker"
          >*</span>
        </label>
        <input
          type="number"
          :value="deslocacoesPorAno"
          :disabled="mode === 'auto'"
          placeholder="0"
          class="config-input benefit-transition"
          :class="fieldClasses('deslocacoesPorAno')"
          data-testid="deslocacoes-input"
          @input="handleInput('deslocacoesPorAno', $event)"
          @blur="handleBlur('deslocacoesPorAno', $event)"
        >
        <span class="field-hint">-1 = Ilimitado</span>
        <p
          v-if="fieldError('deslocacoesPorAno')"
          class="form-error"
          data-testid="deslocacoes-error"
        >
          {{ fieldError('deslocacoesPorAno') }}
        </p>
      </div>

      <!-- Manutenções por Ano — only for CPA -->
      <div
        v-if="contractType === 'CPA'"
        class="config-field"
      >
        <label class="config-label">
          MANUTENÇÕES POR ANO
          <span
            v-if="mode === 'manual'"
            class="required-marker"
          >*</span>
        </label>
        <input
          type="number"
          :value="manutencoesPorAno"
          :disabled="mode === 'auto'"
          placeholder="0"
          class="config-input benefit-transition"
          :class="fieldClasses('manutencoesPorAno')"
          data-testid="manutencoes-input"
          @input="handleInput('manutencoesPorAno', $event)"
          @blur="handleBlur('manutencoesPorAno', $event)"
        >
        <span class="field-hint">-1 = Ilimitado</span>
        <p
          v-if="fieldError('manutencoesPorAno')"
          class="form-error"
          data-testid="manutencoes-error"
        >
          {{ fieldError('manutencoesPorAno') }}
        </p>
      </div>
    </div>

    <!-- Auto mode info text -->
    <p
      v-if="mode === 'auto'"
      class="auto-mode-info"
      data-testid="auto-mode-info"
    >
      Valores preenchidos automaticamente pelo plano selecionado
    </p>
  </div>
</template>

<script setup lang="ts">

interface Props {
  horasAssistencia?: number;
  deslocacoesPorAno: number;
  manutencoesPorAno?: number;
  mode: 'auto' | 'manual';
  contractType: 'CPA' | 'S&H';
  showErrors?: boolean;
}

interface Emits {
  (e: 'update:horasAssistencia', value: number): void;
  (e: 'update:deslocacoesPorAno', value: number): void;
  (e: 'update:manutencoesPorAno', value: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  horasAssistencia: undefined,
  manutencoesPorAno: undefined,
  showErrors: false,
});

const emit = defineEmits<Emits>();

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
  if (props.mode === 'auto') return;

  const rawValue = (event.target as HTMLInputElement).value;
  const numValue = rawValue === '' ? ('' as unknown as number) : Number(rawValue);
  emitMap[field](numValue);
}

function handleBlur(field: FieldName, _event: Event) {
  if (props.mode === 'auto') return;
  // Validation is handled via showErrors prop from parent on save attempt
}

function fieldError(field: FieldName): string | null {
  if (props.mode !== 'manual' || !props.showErrors) return null;

  // Only validate fields visible for the current contract type
  if (field === 'horasAssistencia' && props.contractType !== 'S&H') return null;
  if (field === 'manutencoesPorAno' && props.contractType !== 'CPA') return null;

  const value = field === 'horasAssistencia'
    ? props.horasAssistencia
    : field === 'deslocacoesPorAno'
      ? props.deslocacoesPorAno
      : props.manutencoesPorAno;

  if (value === undefined || value === ('' as unknown as number)) {
    return 'Este campo é obrigatório';
  }

  return validateBenefitValue(String(value));
}

function fieldClasses(field: FieldName): Record<string, boolean> {
  return {
    'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200': props.mode === 'auto',
    'form-element-error': fieldError(field) !== null,
  };
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
    @apply grid-cols-2;
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

.benefit-transition {
  transition: background-color 200ms ease, border-color 200ms ease;
}

.form-error {
  @apply form-error-message;
}

.field-hint {
  @apply text-xs text-gray-400;
}

.required-marker {
  @apply text-red-500 ml-0.5;
}

.auto-mode-info {
  @apply text-sm text-gray-500 italic mt-2;
}

.manual-mode-banner {
  @apply flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700;
}
</style>

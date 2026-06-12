<template>
  <div class="dynamic-plan-details">
    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="plan-loading-state"
    >
      <div class="loading-spinner">
        <div class="spinner" />
        <span class="loading-text">A carregar detalhes do plano...</span>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="hasError"
      class="plan-error-state"
    >
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <div class="error-text">
          <h4>Erro ao carregar plano</h4>
          <p>{{ errorMessage }}</p>
        </div>
      </div>
    </div>

    <!-- Plan Content -->
    <div v-else>
      <!-- Plan Information Card -->
      <div class="plan-info-card">
        <h3 class="plan-title">
          {{ planDetails.name }}
        </h3>

        <!-- Plan Features -->
        <div class="plan-features">
          <div class="feature-description">
            {{ planDetails.description }}
          </div>

          <div class="feature-list">
            <div
              v-if="planDetails.parameters?.manutencoesPorAno"
              class="feature-item"
            >
              <span class="feature-icon">🔧</span>
              <span class="feature-text">{{ planDetails.parameters.manutencoesPorAno }} manutenções por ano</span>
            </div>
            <div
              v-if="planDetails.parameters?.horasPorAno"
              class="feature-item"
            >
              <span class="feature-icon">⏰</span>
              <span class="feature-text">{{ planDetails.parameters.horasPorAno }} horas por ano</span>
            </div>
            <div
              v-if="planDetails.parameters?.deslocacoesPorAno"
              class="feature-item"
            >
              <span class="feature-icon">🚗</span>
              <span class="feature-text">{{
                planDetails.parameters.deslocacoesPorAno === -1
                  ? 'Deslocações ilimitadas'
                  : `${planDetails.parameters.deslocacoesPorAno} deslocações por ano`
              }}</span>
            </div>
            <div
              v-if="planDetails.weekendSupport"
              class="feature-item"
            >
              <span class="feature-icon">📅</span>
              <span class="feature-text">Suporte ao fim de semana</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Schedule Info Display (read-only) -->
      <div
        v-if="planDetails.schedule"
        class="schedule-info-section"
      >
        <h4>INTERVALOS DE TRABALHO</h4>
        <div class="schedule-details">
          <div class="schedule-item">
            <span class="schedule-label">Deslocação:</span>
            <span class="schedule-value">{{ planDetails.schedule.deslocacao }}</span>
          </div>
          <div class="schedule-item">
            <span class="schedule-label">Assistência Remota:</span>
            <span class="schedule-value">{{ planDetails.schedule.remoteSupport }}</span>
          </div>
        </div>
      </div>

      <!-- Price Breakdown (POS package only) -->
      <div
        v-if="hasPOSPackage"
        class="price-breakdown-section"
      >
        <h4>COMPOSIÇÃO DO PREÇO:</h4>
        <div class="price-breakdown">
          <div class="breakdown-item">
            <span class="breakdown-label">Plano Base:</span>
            <span class="breakdown-value">Conforme modalidade selecionada</span>
          </div>
          <div class="breakdown-item">
            <span class="breakdown-label">Pack POS (10h assistência):</span>
            <span class="breakdown-value">+{{ formatPrice(200) }}/ano</span>
          </div>
        </div>
      </div>

      <!-- Payment Options -->
      <div class="payment-selection-section">
        <h4>SELECIONE A MODALIDADE DE PAGAMENTO:</h4>

        <!-- Distance requirement notice for S&H distance-based pricing -->
        <div
          v-if="requiresDistanceForPricing && !distance"
          class="distance-notice"
        >
          <span class="notice-icon">ℹ️</span>
          <span class="notice-text">Selecione a distância para ver os preços</span>
        </div>

        <!-- Payment options grid -->
        <div
          v-else-if="paymentOptions.length > 0"
          class="payment-options-grid"
        >
          <button
            v-for="option in paymentOptions"
            :key="option.id"
            type="button"
            class="payment-option"
            :class="{ selected: selectedPayment === option.id }"
            @click="selectPayment(option.id)"
          >
            <div class="payment-period">
              {{ option.period }}
            </div>
            <div class="payment-amount">
              {{ option.amount }}
            </div>
          </button>
        </div>

        <!-- No pricing available -->
        <div
          v-else
          class="no-pricing-notice"
        >
          <span class="notice-icon">⚠️</span>
          <span class="notice-text">Preços não disponíveis para este plano</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue';

interface Props {
  planDetails: any;
  selectedPayment: string;
  distance?: string;
  isLoading?: boolean;
  errorMessage?: string;
  hasPOSPackage?: boolean;
  contractType?: string;
}

interface Emits {
  (e: 'payment-selected', paymentId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const {
  planDetails,
  selectedPayment,
  distance,
  isLoading,
  errorMessage,
  hasPOSPackage,
  contractType,
} = toRefs(props);

const selectPayment = (paymentId: string): void => {
  emit('payment-selected', paymentId);
};

// Check if there's an error state
const hasError = computed((): boolean => {
  return !!errorMessage?.value || (!planDetails.value && !isLoading?.value);
});

// CPA never requires distance (flat pricing). Only S&H requires distance.
const requiresDistanceForPricing = computed((): boolean => {
  if (!planDetails.value?.prices) return false;
  return contractType?.value === 'S&H';
});

// Memoized price formatter
const formatPrice = (() => {
  const formatter = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  });

  return (price: number): string => formatter.format(price);
})();

// Compute payment options based on contract type and plan pricing structure
const paymentOptions = computed(() => {
  if (!planDetails.value?.prices) {
    return [];
  }

  const prices = planDetails.value.prices;
  const options: Array<{ id: string; period: string; amount: string }> = [];

  try {
    // CPA: flat pricing with mensal/semestral/anual keys
    if (contractType?.value === 'CPA') {
      if (prices.mensal !== undefined) {
        options.push({
          id: 'MENSAL',
          period: 'MENSAL',
          amount: formatPrice(prices.mensal),
        });
      }
      if (prices.semestral !== undefined) {
        options.push({
          id: 'SEMESTRAL',
          period: 'SEMESTRAL',
          amount: formatPrice(prices.semestral),
        });
      }
      if (prices.anual !== undefined) {
        options.push({
          id: 'ANUAL',
          period: 'ANUAL',
          amount: formatPrice(prices.anual),
        });
      }
    }
    // S&H: distance-based pricing with mensal/anual keys only
    else if (contractType?.value === 'S&H') {
      if (!distance?.value || !prices[distance.value]) {
        return [];
      }

      const distancePrices = prices[distance.value];

      if (distancePrices.mensal !== undefined) {
        options.push({
          id: 'MENSAL',
          period: 'MENSAL',
          amount: formatPrice(distancePrices.mensal),
        });
      }
      if (distancePrices.anual !== undefined) {
        options.push({
          id: 'ANUAL',
          period: 'ANUAL',
          amount: formatPrice(distancePrices.anual),
        });
      }
    }
  } catch (error) {
    console.error('Error generating payment options:', JSON.stringify(error, null, 2));
  }

  return options;
});
</script>

<style scoped>
.dynamic-plan-details {
  @apply form-section-consistent mt-6;
}

/* Loading State */
.plan-loading-state {
  @apply form-section-body-consistent bg-gray-50 border-b border-gray-200;
}

.loading-spinner {
  @apply flex items-center justify-center gap-3;
}

.spinner {
  @apply form-loading-spinner;
}

.loading-text {
  @apply text-sm text-gray-600 font-medium;
}

/* Error State */
.plan-error-state {
  @apply form-section-body-consistent bg-red-50 border border-red-200;
}

.error-content {
  @apply flex items-start gap-3;
}

.error-icon {
  @apply text-xl text-red-500 flex-shrink-0;
}

.error-text h4 {
  @apply text-sm font-semibold text-red-700 mb-1;
}

.error-text p {
  @apply text-sm text-red-600;
}

/* Plan Content */
.plan-info-card {
  @apply form-section-header-consistent;
}

.plan-title {
  @apply form-section-title-consistent text-lg text-primary-600 mb-4;
}

.feature-description {
  @apply form-section-description-consistent mb-4 leading-relaxed;
}

.feature-list {
  @apply flex flex-col gap-2;
}

.feature-item {
  @apply flex items-center gap-2;
}

.feature-icon {
  @apply text-base text-primary-500;
}

.feature-text {
  @apply text-sm text-gray-700;
}

/* Schedule Info Section */
.schedule-info-section {
  @apply form-section-body-consistent bg-gray-50 border border-gray-200;
}

.schedule-info-section h4 {
  @apply text-sm font-semibold text-gray-700 mb-3 uppercase;
}

.schedule-details {
  @apply space-y-2;
}

.schedule-item {
  @apply flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2;
}

.schedule-label {
  @apply text-sm text-gray-600 font-medium;
}

.schedule-value {
  @apply text-sm text-gray-800;
}

/* Price Breakdown Section */
.price-breakdown-section {
  @apply form-section-body-consistent bg-blue-50 border border-blue-200;
}

.price-breakdown-section h4 {
  @apply text-sm font-semibold text-blue-700 mb-3 uppercase;
}

.price-breakdown {
  @apply space-y-2;
}

.breakdown-item {
  @apply flex justify-between items-center py-1;
}

.breakdown-label {
  @apply text-sm text-blue-700 font-medium;
}

.breakdown-value {
  @apply text-sm text-blue-800 font-semibold;
}

.payment-selection-section {
  @apply form-section-body-consistent;
}

.payment-selection-section h4 {
  @apply text-sm font-semibold text-gray-700 mb-4 uppercase;
}

/* Notice States */
.distance-notice,
.no-pricing-notice {
  @apply flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg;
  @apply animate-fade-in;
}

.notice-icon {
  @apply text-base text-blue-500;
}

.notice-text {
  @apply text-sm text-blue-700 font-medium;
}

.payment-options-grid {
  @apply form-grid-consistent;
}

@media (min-width: 640px) {
  .payment-options-grid {
    @apply grid-cols-3;
  }
}

.payment-option {
  @apply btn-outline-consistent flex-col p-4;
  @apply transition-all duration-200 ease-in-out;
}

.payment-option:hover {
  @apply border-primary-500 bg-primary-50;
}

.payment-option.selected {
  @apply btn-primary-consistent;
}

.payment-period {
  @apply text-xs font-medium uppercase mb-1;
}

.payment-amount {
  @apply text-base font-semibold;
}

/* Touch-friendly interactions */
@media (hover: none) {
  .payment-option:active {
    @apply bg-primary-100;
  }

  .payment-option.selected:active {
    @apply bg-primary-600;
  }
}

/* Mobile responsiveness improvements */
@media (max-width: 640px) {
  .plan-info-card {
    @apply p-4;
  }

  .payment-selection-section {
    @apply p-4;
  }

  .payment-option {
    @apply p-3;
  }

  .plan-title {
    @apply text-base;
  }

  .feature-description {
    @apply text-sm;
  }

  .plan-loading-state,
  .plan-error-state {
    @apply p-4;
  }

  .distance-notice,
  .no-pricing-notice {
    @apply p-3;
  }

  .schedule-info-section {
    @apply p-4;
  }
}
</style>

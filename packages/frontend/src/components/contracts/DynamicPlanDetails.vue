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
              v-if="planDetails.maintenancePerYear"
              class="feature-item"
            >
              <span class="feature-icon">🔧</span>
              <span class="feature-text">{{ planDetails.maintenancePerYear }} manutenções por ano</span>
            </div>
            <div
              v-if="planDetails.hoursPerYear"
              class="feature-item"
            >
              <span class="feature-icon">⏰</span>
              <span class="feature-text">{{ planDetails.hoursPerYear }} horas por ano</span>
            </div>
            <div
              v-if="planDetails.callouts"
              class="feature-item"
            >
              <span class="feature-icon">📞</span>
              <span class="feature-text">{{ planDetails.callouts }}</span>
            </div>
            <div
              v-if="planDetails.displacementsIncluded"
              class="feature-item"
            >
              <span class="feature-icon">🚗</span>
              <span class="feature-text">{{
                planDetails.displacementsIncluded === 'ilimitadas'
                  ? 'Deslocações ilimitadas'
                  : `${planDetails.displacementsIncluded} deslocações incluídas`
              }}</span>
            </div>
            <div
              v-if="planDetails.remoteSupport"
              class="feature-item"
            >
              <span class="feature-icon">💻</span>
              <span class="feature-text">{{ planDetails.remoteSupport }}</span>
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

      <!-- Price Breakdown (if has additional costs) -->
      <div
        v-if="hasAdditionalCosts"
        class="price-breakdown-section"
      >
        <h4>COMPOSIÇÃO DO PREÇO:</h4>
        <div class="price-breakdown">
          <div class="breakdown-item">
            <span class="breakdown-label">Plano Base:</span>
            <span class="breakdown-value">Conforme modalidade selecionada</span>
          </div>
          <div
            v-if="hasPOSPackage"
            class="breakdown-item"
          >
            <span class="breakdown-label">Pack POS (10h assistência):</span>
            <span class="breakdown-value">+{{ formatPrice(100) }}/ano</span>
          </div>
          <div
            v-if="equipments && equipments.length > 1"
            class="breakdown-item"
          >
            <span class="breakdown-label">Equipamentos adicionais:</span>
            <span class="breakdown-value">{{ equipments.length - 1 }} × preço do plano (com descontos aplicados)</span>
          </div>
        </div>
      </div>

      <!-- Payment Options -->
      <div class="payment-selection-section">
        <h4>SELECIONE A MODALIDADE DE PAGAMENTO:</h4>

        <!-- Distance requirement notice for distance-based pricing -->
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

interface ContractEquipment {
  id: string;
  modelo: string;
  numeroSerie: string;
  desconto: number; // Discount percentage (0-100)
  observacoes: string;
}

interface Props {
  planDetails: any;
  selectedPayment: string;
  distance?: string;
  isLoading?: boolean;
  errorMessage?: string;
  hasPOSPackage?: boolean;
  equipments?: ContractEquipment[];
  contractType?: string;
}

interface Emits {
  (e: 'payment-selected', paymentId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Use toRefs for better performance with reactive props
const {
  planDetails,
  selectedPayment,
  distance,
  isLoading,
  errorMessage,
  hasPOSPackage,
  equipments,
  contractType,
} = toRefs(props);

// Equipment pricing: each additional equipment costs the same as the base plan price

const selectPayment = (paymentId: string) => {
  emit('payment-selected', paymentId);
};

// Check if there's an error state
const hasError = computed(() => {
  return !!errorMessage?.value || (!planDetails.value && !isLoading?.value);
});

// Determine if this plan requires distance for pricing (CPA 2023 and S&H)
const requiresDistanceForPricing = computed(() => {
  if (!planDetails.value?.prices) return false;

  // Check if the pricing structure has distance-based pricing
  const prices = planDetails.value.prices;
  return !!(prices.under180km || prices.over180km);
});

// Check if there are additional costs to display
const hasAdditionalCosts = computed(() => {
  return hasPOSPackage?.value || (equipments?.value && equipments.value.length > 1);
});

// Calculate additional equipment costs
const calculateEquipmentCosts = (basePlanPrice: number): number => {
  if (!equipments?.value || equipments.value.length <= 1) {
    return 0;
  }

  // Skip the first equipment (included in base price), calculate for additional ones
  // Each additional equipment costs the same as the base plan price, with discount applied
  const additionalEquipments = equipments.value.slice(1);

  return additionalEquipments.reduce((total, equipment) => {
    const discountMultiplier = 1 - equipment.desconto / 100;
    return total + basePlanPrice * discountMultiplier;
  }, 0);
};

// Calculate POS package cost
const calculatePOSPackageCost = (): number => {
  return hasPOSPackage?.value ? 100 : 0;
};

// Calculate total additional costs per year
const calculateAdditionalCosts = (basePlanPrice: number): number => {
  const posPackageCost = calculatePOSPackageCost();
  const equipmentCosts = calculateEquipmentCosts(basePlanPrice);

  return posPackageCost + equipmentCosts;
};

// Memoized price formatter for better performance
const formatPrice = (() => {
  const formatter = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  });

  return (price: number): string => formatter.format(price);
})();

// Calculate savings percentage based on payment frequency (monthly is base)
// Compute payment options based on plan structure - enhanced with dynamic pricing
const paymentOptions = computed(() => {
  if (!planDetails.value?.prices) {
    return [];
  }

  const prices = planDetails.value.prices;
  const options = [];

  try {
    let basePrices: any = null;

    // Handle distance-based pricing (CPA 2023 and S&H)
    if (requiresDistanceForPricing.value && distance?.value && prices[distance.value]) {
      basePrices = prices[distance.value];
    }
    // Handle flat pricing (CPA 1500)
    else if (!requiresDistanceForPricing.value && prices.monthly !== undefined) {
      basePrices = prices;
    }

    if (basePrices) {
      // Monthly option
      if (basePrices.monthly) {
        const monthlyAdditionalCosts = calculateAdditionalCosts(basePrices.monthly);
        const totalMonthly = basePrices.monthly + monthlyAdditionalCosts;
        options.push({
          id: 'MENSAL',
          period: 'MENSAL',
          amount: formatPrice(totalMonthly),
        });
      }

      // Quarterly option
      if (basePrices.quarterly) {
        const quarterlyAdditionalCosts = calculateAdditionalCosts(basePrices.quarterly);
        const totalQuarterly = basePrices.quarterly + quarterlyAdditionalCosts;
        options.push({
          id: 'TRIMESTRAL',
          period: 'TRIMESTRAL',
          amount: formatPrice(totalQuarterly),
        });
      }

      // Semiannual option
      if (basePrices.semiannual) {
        const semiannualAdditionalCosts = calculateAdditionalCosts(basePrices.semiannual);
        const totalSemiannual = basePrices.semiannual + semiannualAdditionalCosts;
        options.push({
          id: 'SEMESTRAL',
          period: 'SEMESTRAL',
          amount: formatPrice(totalSemiannual),
        });
      }

      // Annual option
      if (basePrices.annual) {
        const additionalCostsPerYear = calculateAdditionalCosts(basePrices.annual);
        const totalAnnual = basePrices.annual + additionalCostsPerYear;
        options.push({
          id: 'ANUAL',
          period: 'ANUAL',
          amount: formatPrice(totalAnnual),
        });
      }
    }
  } catch (error) {
    console.error('Error generating payment options:', error);
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
    @apply grid-cols-4;
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

/* Loading state for payment options */
.payment-options-loading {
  @apply form-loading-overlay;
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
}
</style>

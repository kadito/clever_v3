<template>
  <div class="dynamic-plan-details">
    <!-- Loading State -->
    <div v-if="isLoading" class="plan-loading-state">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <span class="loading-text">A carregar detalhes do plano...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="plan-error-state">
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
        <h3 class="plan-title">{{ planDetails.name }}</h3>
        
        <!-- Plan Features -->
        <div class="plan-features">
          <div class="feature-description">
            {{ planDetails.description }}
          </div>
          
          <div class="feature-list">
            <div v-if="planDetails.maintenancePerYear" class="feature-item">
              <span class="feature-icon">🔧</span>
              <span class="feature-text">{{ planDetails.maintenancePerYear }} manutenções por ano</span>
            </div>
            <div v-if="planDetails.hoursPerYear" class="feature-item">
              <span class="feature-icon">⏰</span>
              <span class="feature-text">{{ planDetails.hoursPerYear }} horas por ano</span>
            </div>
            <div v-if="planDetails.callouts" class="feature-item">
              <span class="feature-icon">📞</span>
              <span class="feature-text">{{ planDetails.callouts }}</span>
            </div>
            <div v-if="planDetails.displacementsIncluded" class="feature-item">
              <span class="feature-icon">🚗</span>
              <span class="feature-text">{{ planDetails.displacementsIncluded === 'ilimitadas' ? 'Deslocações ilimitadas' : `${planDetails.displacementsIncluded} deslocações incluídas` }}</span>
            </div>
            <div v-if="planDetails.remoteSupport" class="feature-item">
              <span class="feature-icon">💻</span>
              <span class="feature-text">{{ planDetails.remoteSupport }}</span>
            </div>
            <div v-if="planDetails.weekendSupport" class="feature-item">
              <span class="feature-icon">📅</span>
              <span class="feature-text">Suporte ao fim de semana</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Payment Options -->
      <div class="payment-selection-section">
        <h4>SELECIONE A MODALIDADE DE PAGAMENTO:</h4>
        
        <!-- Distance requirement notice for distance-based pricing -->
        <div v-if="requiresDistanceForPricing && !distance" class="distance-notice">
          <span class="notice-icon">ℹ️</span>
          <span class="notice-text">Selecione a distância para ver os preços</span>
        </div>
        
        <!-- Payment options grid -->
        <div v-else-if="paymentOptions.length > 0" class="payment-options-grid">
          <button
            v-for="option in paymentOptions"
            :key="option.id"
            type="button"
            class="payment-option"
            :class="{ 'selected': selectedPayment === option.id }"
            @click="selectPayment(option.id)"
          >
            <div class="payment-period">{{ option.period }}</div>
            <div class="payment-amount">{{ option.amount }}</div>
          </button>
        </div>
        
        <!-- No pricing available -->
        <div v-else class="no-pricing-notice">
          <span class="notice-icon">⚠️</span>
          <span class="notice-text">Preços não disponíveis para este plano</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue'

interface Props {
  planDetails: any
  selectedPayment: string
  distance?: string
  isLoading?: boolean
  errorMessage?: string
}

interface Emits {
  (e: 'payment-selected', paymentId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Use toRefs for better performance with reactive props
const { planDetails, selectedPayment, distance, isLoading, errorMessage } = toRefs(props)

const selectPayment = (paymentId: string) => {
  emit('payment-selected', paymentId)
}

// Check if there's an error state
const hasError = computed(() => {
  return !!errorMessage?.value || (!planDetails.value && !isLoading?.value)
})

// Determine if this plan requires distance for pricing (CPA 2023 and S&H)
const requiresDistanceForPricing = computed(() => {
  if (!planDetails.value?.prices) return false
  
  // Check if the pricing structure has distance-based pricing
  const prices = planDetails.value.prices
  return !!(prices.under180km || prices.over180km)
})

// Memoized price formatter for better performance
const formatPrice = (() => {
  const formatter = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  });
  
  return (price: number): string => formatter.format(price);
})();

// Compute payment options based on plan structure - enhanced with better error handling
const paymentOptions = computed(() => {
  if (!planDetails.value?.prices) {
    console.log('No prices available in plan details:', JSON.stringify(planDetails.value, null, 2))
    return []
  }
  
  const prices = planDetails.value.prices
  const options = []
  
  try {
    // Handle distance-based pricing (CPA 2023 and S&H)
    if (requiresDistanceForPricing.value && distance?.value && prices[distance.value]) {
      const distancePrices = prices[distance.value]
      console.log('Using distance-based pricing for distance:', distance.value, JSON.stringify(distancePrices, null, 2))
      
      if (distancePrices.monthly) options.push({ id: 'MENSAL', period: 'MENSAL', amount: formatPrice(distancePrices.monthly) })
      if (distancePrices.quarterly) options.push({ id: 'TRIMESTRAL', period: 'TRIMESTRAL', amount: formatPrice(distancePrices.quarterly) })
      if (distancePrices.semiannual) options.push({ id: 'SEMESTRAL', period: 'SEMESTRAL', amount: formatPrice(distancePrices.semiannual) })
      if (distancePrices.annual) options.push({ id: 'ANUAL', period: 'ANUAL', amount: formatPrice(distancePrices.annual) })
    }
    // Handle flat pricing (CPA 1500)
    else if (!requiresDistanceForPricing.value && prices.monthly !== undefined) {
      console.log('Using flat pricing:', JSON.stringify(prices, null, 2))
      
      if (prices.monthly) options.push({ id: 'MENSAL', period: 'MENSAL', amount: formatPrice(prices.monthly) })
      if (prices.quarterly) options.push({ id: 'TRIMESTRAL', period: 'TRIMESTRAL', amount: formatPrice(prices.quarterly) })
      if (prices.semiannual) options.push({ id: 'SEMESTRAL', period: 'SEMESTRAL', amount: formatPrice(prices.semiannual) })
      if (prices.annual) options.push({ id: 'ANUAL', period: 'ANUAL', amount: formatPrice(prices.annual) })
    }
    
    console.log('Generated payment options:', JSON.stringify(options, null, 2))
  } catch (error) {
    console.error('Error generating payment options:', JSON.stringify(error, null, 2))
  }
  
  return options
})
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
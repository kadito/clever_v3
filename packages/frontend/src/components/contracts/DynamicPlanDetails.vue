<template>
  <div class="dynamic-plan-details">

    
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
      <div class="payment-options-grid">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue'

interface Props {
  planDetails: any
  selectedPayment: string
  distance?: string
}

interface Emits {
  (e: 'payment-selected', paymentId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Use toRefs for better performance with reactive props
const { planDetails, selectedPayment, distance } = toRefs(props)

const selectPayment = (paymentId: string) => {
  emit('payment-selected', paymentId)
}

// Memoized price formatter for better performance
const formatPrice = (() => {
  const formatter = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  });
  
  return (price: number): string => formatter.format(price);
})();

// Compute payment options based on plan structure - optimized with memoization
const paymentOptions = computed(() => {
  if (!planDetails.value?.prices) {
    return []
  }
  
  const prices = planDetails.value.prices
  const options = []
  
  // Handle distance-based pricing (CPA 2023 and S&H)
  if (distance?.value && prices[distance.value]) {
    const distancePrices = prices[distance.value]
    if (distancePrices.monthly) options.push({ id: 'MENSAL', period: 'MENSAL', amount: formatPrice(distancePrices.monthly) })
    if (distancePrices.quarterly) options.push({ id: 'TRIMESTRAL', period: 'TRIMESTRAL', amount: formatPrice(distancePrices.quarterly) })
    if (distancePrices.semiannual) options.push({ id: 'SEMESTRAL', period: 'SEMESTRAL', amount: formatPrice(distancePrices.semiannual) })
    if (distancePrices.annual) options.push({ id: 'ANUAL', period: 'ANUAL', amount: formatPrice(distancePrices.annual) })
  }
  // Handle flat pricing (CPA 1500)
  else if (prices.monthly !== undefined) {
    if (prices.monthly) options.push({ id: 'MENSAL', period: 'MENSAL', amount: formatPrice(prices.monthly) })
    if (prices.quarterly) options.push({ id: 'TRIMESTRAL', period: 'TRIMESTRAL', amount: formatPrice(prices.quarterly) })
    if (prices.semiannual) options.push({ id: 'SEMESTRAL', period: 'SEMESTRAL', amount: formatPrice(prices.semiannual) })
    if (prices.annual) options.push({ id: 'ANUAL', period: 'ANUAL', amount: formatPrice(prices.annual) })
  }
  
  return options
})
</script>

<style scoped>
.dynamic-plan-details {
  @apply mt-6 border border-gray-200 rounded-lg overflow-hidden;
}

.plan-info-card {
  @apply bg-gray-50 p-6 border-b border-gray-200;
}

.plan-title {
  @apply text-lg font-semibold text-green-600 mb-4;
}

.feature-description {
  @apply text-gray-600 mb-4 leading-relaxed;
}

.feature-list {
  @apply flex flex-col gap-2;
}

.feature-item {
  @apply flex items-center gap-2;
}

.feature-icon {
  @apply text-base text-green-500;
}

.feature-text {
  @apply text-sm text-gray-700;
}

.payment-selection-section {
  @apply p-6;
}

.payment-selection-section h4 {
  @apply text-sm font-semibold text-gray-700 mb-4 uppercase;
}

.payment-options-grid {
  @apply grid grid-cols-2 gap-3;
}

@media (min-width: 640px) {
  .payment-options-grid {
    @apply grid-cols-4;
  }
}

.payment-option {
  @apply flex flex-col items-center p-4 border border-gray-300 rounded-lg bg-white cursor-pointer transition-all duration-200 touch-target;
}

.payment-option:hover {
  @apply border-green-500 bg-green-50;
}

.payment-option.selected {
  @apply border-green-500 bg-green-500 text-white;
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
    @apply bg-green-100;
  }
  
  .payment-option.selected:active {
    @apply bg-green-600;
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
}
</style>
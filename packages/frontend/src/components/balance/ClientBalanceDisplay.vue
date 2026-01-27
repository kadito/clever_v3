<template>
  <div class="balance-display">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p class="loading-text">A carregar saldo...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="error-message">{{ error }}</p>
    </div>

    <!-- Balance Display -->
    <div v-else-if="balance" class="balance-content">
      <!-- Debt Section -->
      <div class="balance-section debt-section">
        <h3 class="section-title">Dívida Atual</h3>
        <div class="balance-value" :class="{ 'has-debt': balance.balance > 0 }">
          {{ formatCurrency(balance.balance) }}
        </div>
      </div>

      <!-- Contract Usage Section -->
      <div class="balance-section usage-section">
        <h3 class="section-title">Recursos de Contrato</h3>
        
        <div class="usage-grid">
          <!-- Maintenance Visits -->
          <div class="usage-item" :class="{ 'low-usage': isLowUsage('manutencoesPorAno') }">
            <div class="usage-label">Manutenções por Ano</div>
            <div class="usage-value">
              {{ formatUsageValue(balance.contracts.manutencoesPorAno) }}
              <span v-if="isLowUsage('manutencoesPorAno')" class="warning-icon" title="Uso baixo">⚠️</span>
            </div>
          </div>

          <!-- Displacements -->
          <div class="usage-item" :class="{ 'low-usage': isLowUsage('deslocacoesPorAno') }">
            <div class="usage-label">Deslocações por Ano</div>
            <div class="usage-value">
              {{ formatUsageValue(balance.contracts.deslocacoesPorAno) }}
              <span v-if="isLowUsage('deslocacoesPorAno')" class="warning-icon" title="Uso baixo">⚠️</span>
            </div>
          </div>

          <!-- Assistance Hours -->
          <div class="usage-item" :class="{ 'low-usage': isLowUsage('horasAssistenciaAnuais') }">
            <div class="usage-label">Horas de Assistência Anuais</div>
            <div class="usage-value">
              {{ formatUsageValue(balance.contracts.horasAssistenciaAnuais) }}
              <span v-if="isLowUsage('horasAssistenciaAnuais')" class="warning-icon" title="Uso baixo">⚠️</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Last Updated -->
      <div class="balance-footer">
        <p class="last-updated">
          Última atualização: {{ formatDate(balance.lastUpdated) }}
        </p>
      </div>
    </div>

    <!-- No Balance State -->
    <div v-else class="no-balance-state">
      <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="no-balance-message">Sem informação de saldo disponível</p>
      <p class="no-balance-hint">O saldo será criado automaticamente quando um contrato for adicionado a este cliente.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { BalanceIndex } from '@clever/shared';

interface Props {
  clientId: string;
}

const props = defineProps<Props>();

const balance = ref<BalanceIndex | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const initialBalances = ref<Record<string, number>>({});

const loadBalance = async () => {
  if (!props.clientId) {
    error.value = 'ID do cliente não fornecido';
    return;
  }

  isLoading.value = true;
  error.value = null;

  console.log('ClientBalanceDisplay: Loading balance for client:', props.clientId);

  await fetch(`/api/balance/${props.clientId}`)
    .then(async response => {
      console.log('ClientBalanceDisplay: Balance API response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          // No balance found - this is expected for new clients
          console.log('ClientBalanceDisplay: No balance found (404) - client may not have contracts yet');
          balance.value = null;
          return;
        }
        throw new Error('Erro ao carregar saldo');
      }
      return response.json();
    })
    .then(data => {
      if (data) {
        console.log('ClientBalanceDisplay: Balance data received:', JSON.stringify(data, null, 2));
        balance.value = data;
        
        // Store initial balances for low usage calculation
        if (data && !Object.keys(initialBalances.value).length) {
          initialBalances.value = {
            manutencoesPorAno: data.contracts.manutencoesPorAno,
            deslocacoesPorAno: data.contracts.deslocacoesPorAno,
            horasAssistenciaAnuais: data.contracts.horasAssistenciaAnuais,
          };
        }
      }
    })
    .catch(err => {
      console.error('ClientBalanceDisplay: Error loading balance:', JSON.stringify(err, null, 2));
      error.value = err instanceof Error ? err.message : 'Erro ao carregar saldo';
    })
    .finally(() => {
      isLoading.value = false;
    });
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
};

const formatUsageValue = (value: number): string => {
  if (value === -1) {
    return 'Ilimitado';
  }
  return value.toString();
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const isLowUsage = (field: keyof typeof initialBalances.value): boolean => {
  if (!balance.value || !initialBalances.value[field]) {
    return false;
  }

  const current = balance.value.contracts[field];
  const initial = initialBalances.value[field];

  // Unlimited values (-1) are never low
  if (current === -1 || initial === -1) {
    return false;
  }

  // Zero initial means no contract resources
  if (initial === 0) {
    return false;
  }

  // Calculate percentage remaining
  const percentageRemaining = (current / initial) * 100;
  
  return percentageRemaining < 20;
};

// Load balance on mount
onMounted(() => {
  loadBalance();
});

// Reload when clientId changes
watch(() => props.clientId, () => {
  loadBalance();
});
</script>

<style scoped>
.balance-display {
  width: 100%;
  padding: 1rem;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #e5e7eb;
  border-top-color: #75AE93;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #6b7280;
  font-size: 0.875rem;
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
}

.error-icon {
  width: 2rem;
  height: 2rem;
  color: #dc2626;
}

.error-message {
  color: #dc2626;
  font-size: 0.875rem;
  text-align: center;
}

/* Balance Content */
.balance-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.balance-section {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.75rem;
}

/* Debt Section */
.debt-section .balance-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: #10b981;
}

.debt-section .balance-value.has-debt {
  color: #dc2626;
}

/* Usage Section */
.usage-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .usage-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.usage-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: #f9fafb;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
}

.usage-item.low-usage {
  background-color: #fef3c7;
  border-color: #fbbf24;
}

.usage-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.usage-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.warning-icon {
  font-size: 1.25rem;
}

/* Footer */
.balance-footer {
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.last-updated {
  font-size: 0.75rem;
  color: #9ca3af;
  text-align: right;
}

/* No Balance State */
.no-balance-state {
  padding: 2rem;
  text-align: center;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.info-icon {
  width: 3rem;
  height: 3rem;
  color: #3b82f6;
}

.no-balance-message {
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
}

.no-balance-hint {
  color: #6b7280;
  font-size: 0.875rem;
  max-width: 400px;
}

/* Mobile Optimization */
@media (max-width: 767px) {
  .balance-display {
    padding: 0.75rem;
  }

  .balance-section {
    padding: 0.75rem;
  }

  .debt-section .balance-value {
    font-size: 1.5rem;
  }

  .usage-value {
    font-size: 1.25rem;
  }
}
</style>

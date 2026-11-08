<template>
  <div class="balance-display">
    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="loading-state"
    >
      <div class="spinner" />
      <p class="loading-text">
        A carregar saldo...
      </p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="error-state"
    >
      <svg
        class="error-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p class="error-message">
        {{ error }}
      </p>
    </div>

    <!-- Periods Display -->
    <div
      v-else-if="periods.length > 0"
      class="balance-content"
    >
      <!-- Euro debt (if any) -->
      <div
        v-if="euroDebt > 0"
        class="balance-section debt-section"
      >
        <h3 class="section-title">
          Dívida Atual
        </h3>
        <div class="balance-value has-debt">
          {{ formatCurrency(euroDebt) }}
        </div>
      </div>

      <!-- One card per active period -->
      <div
        v-for="period in periods"
        :key="period.uuid"
        class="balance-section period-section"
      >
        <div class="period-header">
          <span class="period-badge">{{ period.section }}</span>
          <span class="period-window">
            {{ formatDate(period.periodStart) }} → {{ formatDate(period.periodEnd) }}
          </span>
        </div>

        <div class="usage-grid">
          <div
            v-for="res in resourceRows(period)"
            :key="res.key"
            class="usage-item"
            :class="{ exhausted: res.exhausted }"
          >
            <div class="usage-label">
              {{ res.label }}
            </div>
            <div class="usage-value">
              {{ res.display }}
            </div>
            <div
              v-if="res.showBar"
              class="usage-bar"
            >
              <div
                class="usage-bar-fill"
                :style="{ width: res.percent + '%' }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No periods State -->
    <div
      v-else
      class="no-balance-state"
    >
      <svg
        class="info-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p class="no-balance-message">
        Sem períodos de contrato ativos
      </p>
      <p class="no-balance-hint">
        Os períodos são criados automaticamente quando um contrato é adicionado a este cliente.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { ContractPeriod } from '@clever/shared';

interface Props {
  clientId: string;
}

const props = defineProps<Props>();

const periods = ref<ContractPeriod[]>([]);
const euroDebt = ref(0);
const isLoading = ref(false);
const error = ref<string | null>(null);

interface ResourceRow {
  key: string;
  label: string;
  display: string;
  showBar: boolean;
  percent: number;
  exhausted: boolean;
}

const RESOURCE_LABELS: Record<string, string> = {
  manutencoesPorAno: 'Manutenções',
  deslocacoesPorAno: 'Deslocações',
  horasAssistenciaAnuais: 'Horas de Assistência',
};

const resourceRows = (period: ContractPeriod): ResourceRow[] => {
  return (Object.keys(RESOURCE_LABELS) as (keyof typeof RESOURCE_LABELS)[]).map((key) => {
    const remaining = period.remainingResources[key as keyof ContractPeriod['remainingResources']];
    const original = period.originalResources[key as keyof ContractPeriod['originalResources']];

    // Unlimited
    if (remaining === -1 || original === -1) {
      return { key, label: RESOURCE_LABELS[key], display: 'Ilimitado', showBar: false, percent: 0, exhausted: false };
    }

    const percent = original > 0 ? Math.max(0, Math.min(100, (remaining / original) * 100)) : 0;
    return {
      key,
      label: RESOURCE_LABELS[key],
      display: `${remaining} / ${original}`,
      showBar: original > 0,
      percent,
      exhausted: original > 0 && remaining <= 0,
    };
  });
};

const loadPeriods = async () => {
  if (!props.clientId) {
    error.value = 'ID do cliente não fornecido';
    return;
  }

  isLoading.value = true;
  error.value = null;

  console.log('ClientBalanceDisplay: Loading periods for client:', props.clientId);

  await fetch(`/api/balance/${props.clientId}/periods?status=active`)
    .then(async (response) => {
      if (!response.ok) {
        if (response.status === 404) {
          periods.value = [];
          return null;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao carregar saldo');
      }
      return response.json();
    })
    .then((data) => {
      if (data && Array.isArray(data.data)) {
        console.log('ClientBalanceDisplay: Periods received:', JSON.stringify(data.data, null, 2));
        periods.value = data.data;
      }
    })
    .catch((err) => {
      console.error('ClientBalanceDisplay: Error loading periods:', JSON.stringify(err, null, 2));
      error.value = err instanceof Error ? err.message : 'Erro ao carregar saldo';
    })
    .finally(() => {
      isLoading.value = false;
    });

  // Load euro debt total from DEBT transactions
  await loadEuroDebt();
};

const loadEuroDebt = async () => {
  await fetch(`/api/balance/${props.clientId}/transactions?type=DEBT&limit=1000`)
    .then(async (response) => {
      if (!response.ok) return null;
      return response.json();
    })
    .then((data) => {
      const list = data && Array.isArray(data.data) ? data.data : [];
      euroDebt.value = list.reduce((sum: number, t: { changes?: { balanceChange?: number } }) => {
        return sum + (t.changes?.balanceChange ?? 0);
      }, 0);
    })
    .catch((err) => {
      console.error('ClientBalanceDisplay: Error loading euro debt:', JSON.stringify(err, null, 2));
    });
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

onMounted(() => {
  loadPeriods();
});

watch(() => props.clientId, () => {
  loadPeriods();
});
</script>

<style scoped>
.balance-display {
  width: 100%;
  padding: 1rem;
}

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

.debt-section .balance-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: #10b981;
}

.debt-section .balance-value.has-debt {
  color: #dc2626;
}

.period-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.period-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: #75AE93;
  color: white;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 700;
}

.period-window {
  font-size: 0.875rem;
  color: #6b7280;
}

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

.usage-item.exhausted {
  background-color: #fef2f2;
  border-color: #fecaca;
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
}

.usage-item.exhausted .usage-value {
  color: #dc2626;
}

.usage-bar {
  height: 6px;
  background-color: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.usage-bar-fill {
  height: 100%;
  background-color: #75AE93;
  transition: width 0.3s ease;
}

.usage-item.exhausted .usage-bar-fill {
  background-color: #dc2626;
}

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

@media (max-width: 767px) {
  .balance-display {
    padding: 0.75rem;
  }

  .balance-section {
    padding: 0.75rem;
  }

  .usage-value {
    font-size: 1.25rem;
  }
}
</style>

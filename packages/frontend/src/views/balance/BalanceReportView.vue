<template>
  <div class="balance-report-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-content">
        <h1 class="view-title">
          Relatório de Saldos
        </h1>
        <p class="view-subtitle">
          Períodos de contrato ativos de todos os clientes
        </p>
      </div>

      <button
        class="export-button"
        :disabled="isLoading"
        @click="exportToCSV"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span>Exportar CSV</span>
      </button>
    </div>

    <!-- Summary Statistics -->
    <div
      v-if="summary && !isLoading"
      class="summary-section"
    >
      <div class="summary-card">
        <div class="summary-label">
          Clientes com Período Ativo
        </div>
        <div class="summary-value">
          {{ summary.totalClients }}
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-label">
          Períodos Ativos
        </div>
        <div class="summary-value">
          {{ summary.totalActivePeriods }}
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-label">
          Períodos com Recursos Esgotados
        </div>
        <div class="summary-value text-yellow-600">
          {{ summary.periodsExhausted }}
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="loading-state"
    >
      <div class="spinner" />
      <p class="loading-text">
        A carregar relatório...
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
      <button
        class="retry-button"
        @click="loadReport"
      >
        Tentar Novamente
      </button>
    </div>

    <!-- Periods Table -->
    <div
      v-else-if="periods.length > 0"
      class="table-container"
    >
      <table class="balances-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Secção</th>
            <th>Período</th>
            <th>Manutenções</th>
            <th>Deslocações</th>
            <th>Horas Assist.</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="period in periods"
            :key="period.uuid"
          >
            <td>
              <router-link
                :to="`/clients/${period.clientId}`"
                class="client-link"
              >
                {{ clientName(period.clientId) }}
              </router-link>
            </td>
            <td>
              <span class="section-badge">{{ period.section }}</span>
            </td>
            <td class="text-sm">
              {{ formatDate(period.periodStart) }} a {{ formatDate(period.periodEnd) }}
            </td>
            <td :class="resourceClass(period, 'manutencoesPorAno')">
              {{ formatResource(period, 'manutencoesPorAno') }}
            </td>
            <td :class="resourceClass(period, 'deslocacoesPorAno')">
              {{ formatResource(period, 'deslocacoesPorAno') }}
            </td>
            <td :class="resourceClass(period, 'horasAssistenciaAnuais')">
              {{ formatResource(period, 'horasAssistenciaAnuais') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="empty-state"
    >
      <p class="empty-message">
        Sem períodos de contrato ativos
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePermissions } from '@/composables/usePermissions';
import type { ContractPeriod } from '@clever/shared';

interface BalanceSummary {
  totalClients: number;
  totalActivePeriods: number;
  periodsExhausted: number;
}

type ResourceKey = keyof ContractPeriod['remainingResources'];

const { permissions } = usePermissions();

const periods = ref<ContractPeriod[]>([]);
const names = ref<Record<string, string>>({});
const summary = ref<BalanceSummary | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const clientName = (clientId: string): string => {
  const name = names.value[clientId];
  return name && name.trim() ? name : `${clientId.substring(0, 8)}...`;
};

const isAdmin = computed(() => permissions.value.canDelete);

const loadReport = async () => {
  isLoading.value = true;
  error.value = null;

  await fetch('/api/balance/report')
    .then(async response => {
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Acesso negado. Apenas administradores podem ver este relatório.');
        }
        throw new Error('Erro ao carregar relatório');
      }
      return response.json();
    })
    .then(data => {
      // Endpoint returns { success, data: { summary, periods, names } }
      const payload = data?.data ?? {};
      periods.value = payload.periods ?? [];
      names.value = payload.names ?? {};
      summary.value = payload.summary ?? null;
    })
    .catch(err => {
      console.error('Error loading report:', JSON.stringify(err, null, 2));
      error.value = err instanceof Error ? err.message : 'Erro ao carregar relatório';
    })
    .finally(() => {
      isLoading.value = false;
    });
};

const exportToCSV = async () => {
  await fetch('/api/balance/report/export?summary=true')
    .then(async response => {
      if (!response.ok) {
        throw new Error('Erro ao exportar relatório');
      }
      return response.text();
    })
    .then(csv => {
      const blob = new Blob([csv], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `balance-summary-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
    })
    .catch(err => {
      console.error('Error exporting report:', JSON.stringify(err, null, 2));
      error.value = err instanceof Error ? err.message : 'Erro ao exportar relatório';
    });
};

const formatResource = (period: ContractPeriod, key: ResourceKey): string => {
  const rem = period.remainingResources[key];
  const orig = period.originalResources[key];
  if (rem === -1 || orig === -1) return 'Ilimitado';
  return `${rem} / ${orig}`;
};

const resourceClass = (period: ContractPeriod, key: ResourceKey): string => {
  const rem = period.remainingResources[key];
  const orig = period.originalResources[key];
  // Red when an actual (non-unlimited) allowance is exhausted.
  if (orig > 0 && rem !== -1 && rem <= 0) return 'text-red-600 font-semibold';
  return '';
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

onMounted(() => {
  if (!isAdmin.value) {
    error.value = 'Acesso negado. Apenas administradores podem ver este relatório.';
    return;
  }
  loadReport();
});
</script>

<style scoped>
.balance-report-view {
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 1rem;
}

@media (min-width: 768px) {
  .balance-report-view {
    padding: 2rem;
  }
}

/* Header */
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-content {
  flex: 1;
}

.view-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.view-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
}

.export-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #75AE93;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
  transition: background-color 0.2s;
}

.export-button:hover:not(:disabled) {
  background-color: #5a8a73;
}

.export-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Summary */
.summary-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

@media (min-width: 768px) {
  .summary-section {
    grid-template-columns: repeat(3, 1fr);
  }
}

.summary-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
}

.summary-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

/* Loading/Error States */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
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

.error-icon {
  width: 3rem;
  height: 3rem;
  color: #dc2626;
}

.error-message {
  color: #dc2626;
  font-size: 1rem;
  text-align: center;
}

.retry-button {
  padding: 0.75rem 1.5rem;
  background-color: #75AE93;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
}

.retry-button:hover {
  background-color: #5a8a73;
}

/* Table */
.table-container {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow-x: auto;
}

.balances-table {
  width: 100%;
  border-collapse: collapse;
}

.balances-table thead {
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.balances-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.balances-table td {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #111827;
  border-bottom: 1px solid #e5e7eb;
}

.balances-table tbody tr:last-child td {
  border-bottom: none;
}

.client-link {
  color: #75AE93;
  text-decoration: underline;
}

.client-link:hover {
  color: #5a8a73;
}

.section-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background-color: #eef2ff;
  color: #3730a3;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Empty State */
.empty-state {
  padding: 3rem;
  text-align: center;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.empty-message {
  color: #6b7280;
  font-size: 0.875rem;
}
</style>

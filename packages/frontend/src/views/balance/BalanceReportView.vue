<template>
  <div class="balance-report-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-content">
        <h1 class="view-title">Relatório de Saldos</h1>
        <p class="view-subtitle">Visão geral dos saldos de todos os clientes</p>
      </div>
      
      <button @click="exportToCSV" class="export-button" :disabled="isLoading">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Exportar CSV</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filter-group">
        <label for="min-debt" class="filter-label">Dívida Mínima (€)</label>
        <input 
          id="min-debt"
          v-model.number="filters.minDebt" 
          type="number" 
          class="filter-input"
          placeholder="0"
          @change="loadReport"
        />
      </div>

      <div class="filter-group">
        <label for="max-debt" class="filter-label">Dívida Máxima (€)</label>
        <input 
          id="max-debt"
          v-model.number="filters.maxDebt" 
          type="number" 
          class="filter-input"
          placeholder="Sem limite"
          @change="loadReport"
        />
      </div>

      <div class="filter-group">
        <label for="low-usage" class="filter-label">Apenas Uso Baixo</label>
        <input 
          id="low-usage"
          v-model="filters.lowUsageOnly" 
          type="checkbox" 
          class="filter-checkbox"
          @change="loadReport"
        />
      </div>

      <button 
        class="clear-filters-btn" 
        @click="clearFilters"
        :disabled="!hasActiveFilters"
      >
        Limpar Filtros
      </button>
    </div>

    <!-- Summary Statistics -->
    <div v-if="summary && !isLoading" class="summary-section">
      <div class="summary-card">
        <div class="summary-label">Total de Clientes</div>
        <div class="summary-value">{{ summary.totalClients }}</div>
      </div>

      <div class="summary-card">
        <div class="summary-label">Clientes com Dívida</div>
        <div class="summary-value text-red-600">{{ summary.clientsWithDebt }}</div>
      </div>

      <div class="summary-card">
        <div class="summary-label">Dívida Total</div>
        <div class="summary-value text-red-600">{{ formatCurrency(summary.totalDebt) }}</div>
      </div>

      <div class="summary-card">
        <div class="summary-label">Dívida Média</div>
        <div class="summary-value">{{ formatCurrency(summary.averageDebt) }}</div>
      </div>

      <div class="summary-card">
        <div class="summary-label">Uso Baixo</div>
        <div class="summary-value text-yellow-600">{{ summary.clientsWithLowUsage }}</div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p class="loading-text">A carregar relatório...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="error-message">{{ error }}</p>
      <button @click="loadReport" class="retry-button">
        Tentar Novamente
      </button>
    </div>

    <!-- Balances Table -->
    <div v-else-if="balances.length > 0" class="table-container">
      <table class="balances-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Dívida</th>
            <th>Manutenções</th>
            <th>Deslocações</th>
            <th>Horas Assist.</th>
            <th>Uso Baixo</th>
            <th>Última Atualização</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="balance in balances" :key="balance.clientId">
            <td>
              <router-link :to="`/clients/${balance.clientId}`" class="client-link">
                {{ balance.clientId.substring(0, 8) }}...
              </router-link>
            </td>
            <td :class="{ 'text-red-600 font-semibold': balance.balance > 0 }">
              {{ formatCurrency(balance.balance) }}
            </td>
            <td>{{ formatUsageValue(balance.contracts.manutencoesPorAno) }}</td>
            <td>{{ formatUsageValue(balance.contracts.deslocacoesPorAno) }}</td>
            <td>{{ formatUsageValue(balance.contracts.horasAssistenciaAnuais) }}</td>
            <td>
              <span v-if="balance.hasLowUsage" class="low-usage-badge">Sim</span>
              <span v-else class="normal-usage-badge">Não</span>
            </td>
            <td class="text-sm text-gray-500">{{ formatDate(balance.lastUpdated) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <p class="empty-message">Sem dados de saldo disponíveis</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePermissions } from '@/composables/usePermissions';
import { useRouter } from 'vue-router';

interface BalanceSummary {
  totalClients: number;
  clientsWithDebt: number;
  totalDebt: number;
  averageDebt: number;
  clientsWithLowUsage: number;
}

interface ClientBalanceReport {
  clientId: string;
  balance: number;
  contracts: {
    manutencoesPorAno: number;
    deslocacoesPorAno: number;
    horasAssistenciaAnuais: number;
  };
  hasLowUsage: boolean;
  lastUpdated: string;
}

const router = useRouter();
const { permissions } = usePermissions();

const balances = ref<ClientBalanceReport[]>([]);
const summary = ref<BalanceSummary | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const filters = ref({
  minDebt: undefined as number | undefined,
  maxDebt: undefined as number | undefined,
  lowUsageOnly: false,
});

// Check if user is admin
const isAdmin = computed(() => {
  // This should check if user has admin permissions
  // For now, we'll use a simple check
  return permissions.value.canDelete; // Admin users can delete
});

const hasActiveFilters = computed(() => {
  return filters.value.minDebt !== undefined || 
         filters.value.maxDebt !== undefined || 
         filters.value.lowUsageOnly;
});

const loadReport = async () => {
  isLoading.value = true;
  error.value = null;

  const params = new URLSearchParams();
  if (filters.value.minDebt !== undefined) params.append('minDebt', filters.value.minDebt.toString());
  if (filters.value.maxDebt !== undefined) params.append('maxDebt', filters.value.maxDebt.toString());
  if (filters.value.lowUsageOnly) params.append('lowUsageThreshold', '20');

  const queryString = params.toString();
  const url = `/api/balance/report${queryString ? `?${queryString}` : ''}`;

  await fetch(url)
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
      balances.value = data.balances || [];
      summary.value = data.summary || null;
    })
    .catch(err => {
      console.error('Error loading report:', JSON.stringify(err, null, 2));
      error.value = err instanceof Error ? err.message : 'Erro ao carregar relatório';
    })
    .finally(() => {
      isLoading.value = false;
    });
};

const clearFilters = () => {
  filters.value = {
    minDebt: undefined,
    maxDebt: undefined,
    lowUsageOnly: false,
  };
  loadReport();
};

const exportToCSV = async () => {
  const params = new URLSearchParams();
  if (filters.value.minDebt !== undefined) params.append('minDebt', filters.value.minDebt.toString());
  if (filters.value.maxDebt !== undefined) params.append('maxDebt', filters.value.maxDebt.toString());
  if (filters.value.lowUsageOnly) params.append('lowUsageThreshold', '20');

  const queryString = params.toString();
  const url = `/api/balance/report/export${queryString ? `?${queryString}` : ''}`;

  await fetch(url)
    .then(async response => {
      if (!response.ok) {
        throw new Error('Erro ao exportar relatório');
      }
      return response.text();
    })
    .then(csv => {
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `balance-report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    })
    .catch(err => {
      console.error('Error exporting report:', JSON.stringify(err, null, 2));
      error.value = err instanceof Error ? err.message : 'Erro ao exportar relatório';
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
  }).format(date);
};

// Check admin access on mount
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

/* Filters */
.filters-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #ffffff;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

@media (min-width: 768px) {
  .filters-section {
    grid-template-columns: repeat(3, 1fr) auto;
  }
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.filter-input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  min-height: 44px;
}

.filter-checkbox {
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.clear-filters-btn {
  padding: 0.5rem 1rem;
  background-color: #6b7280;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
  align-self: end;
}

.clear-filters-btn:hover:not(:disabled) {
  background-color: #4b5563;
}

.clear-filters-btn:disabled {
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
    grid-template-columns: repeat(5, 1fr);
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

.low-usage-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: #fef3c7;
  color: #92400e;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.normal-usage-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: #d1fae5;
  color: #065f46;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
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

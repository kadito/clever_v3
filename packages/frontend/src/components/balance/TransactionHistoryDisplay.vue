<template>
  <div class="transaction-history">
    <!-- Filters Section -->
    <div class="filters-section">
      <div class="filter-group">
        <label
          for="type-filter"
          class="filter-label"
        >Tipo</label>
        <select 
          id="type-filter" 
          v-model="filters.type" 
          class="filter-select"
          @change="loadTransactions"
        >
          <option value="">
            Todos
          </option>
          <option value="ADD">
            Adição (ADD)
          </option>
          <option value="DEBT">
            Dívida (DEBT)
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label
          for="start-date"
          class="filter-label"
        >Data Início</label>
        <input 
          id="start-date"
          v-model="filters.startDate" 
          type="date" 
          class="filter-input"
          @change="loadTransactions"
        >
      </div>

      <div class="filter-group">
        <label
          for="end-date"
          class="filter-label"
        >Data Fim</label>
        <input 
          id="end-date"
          v-model="filters.endDate" 
          type="date" 
          class="filter-input"
          @change="loadTransactions"
        >
      </div>

      <button 
        class="clear-filters-btn" 
        :disabled="!hasActiveFilters"
        @click="clearFilters"
      >
        Limpar Filtros
      </button>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="loading-state"
    >
      <div class="spinner" />
      <p class="loading-text">
        A carregar histórico...
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

    <!-- Transactions List -->
    <div
      v-else-if="transactions.length > 0"
      class="transactions-list"
    >
      <div 
        v-for="transaction in paginatedTransactions" 
        :key="transaction.uuid"
        class="transaction-card"
        :class="`transaction-${transaction.type.toLowerCase()}`"
      >
        <!-- Transaction Header -->
        <div class="transaction-header">
          <span
            class="transaction-type"
            :class="`type-${transaction.type.toLowerCase()}`"
          >
            {{ transaction.type }}
          </span>
          <span class="transaction-date">
            {{ formatDate(transaction.timestamp) }}
          </span>
        </div>

        <!-- Transaction Source -->
        <div class="transaction-source">
          <span class="source-label">Origem:</span>
          <a 
            v-if="getSourceLink(transaction)" 
            :href="getSourceLink(transaction)" 
            class="source-link"
          >
            {{ formatSourceType(transaction.source) }}
          </a>
          <span
            v-else
            class="source-text"
          >
            {{ formatSourceType(transaction.source) }}
          </span>
        </div>

        <!-- Transaction Changes -->
        <div class="transaction-changes">
          <h4 class="changes-title">
            Alterações:
          </h4>
          
          <!-- Balance Change -->
          <div
            v-if="transaction.changes.balanceChange"
            class="change-item"
          >
            <span class="change-label">Dívida:</span>
            <span
              class="change-value"
              :class="{ 'positive': transaction.changes.balanceChange > 0 }"
            >
              {{ formatCurrencyChange(transaction.changes.balanceChange) }}
            </span>
          </div>

          <!-- Contract Usage Changes -->
          <div
            v-if="transaction.changes.contractUsageChanges"
            class="contract-changes"
          >
            <div 
              v-if="transaction.changes.contractUsageChanges.manutencoesPorAno !== undefined"
              class="change-item"
            >
              <span class="change-label">Manutenções:</span>
              <span
                class="change-value"
                :class="getChangeClass(transaction.changes.contractUsageChanges.manutencoesPorAno)"
              >
                {{ formatUsageChange(transaction.changes.contractUsageChanges.manutencoesPorAno) }}
              </span>
            </div>

            <div 
              v-if="transaction.changes.contractUsageChanges.deslocacoesPorAno !== undefined"
              class="change-item"
            >
              <span class="change-label">Deslocações:</span>
              <span
                class="change-value"
                :class="getChangeClass(transaction.changes.contractUsageChanges.deslocacoesPorAno)"
              >
                {{ formatUsageChange(transaction.changes.contractUsageChanges.deslocacoesPorAno) }}
              </span>
            </div>

            <div 
              v-if="transaction.changes.contractUsageChanges.horasAssistenciaAnuais !== undefined"
              class="change-item"
            >
              <span class="change-label">Horas Assistência:</span>
              <span
                class="change-value"
                :class="getChangeClass(transaction.changes.contractUsageChanges.horasAssistenciaAnuais)"
              >
                {{ formatUsageChange(transaction.changes.contractUsageChanges.horasAssistenciaAnuais) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Transaction Footer -->
        <div class="transaction-footer">
          <span class="created-by">Por: {{ transaction.createdBy }}</span>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="pagination"
      >
        <button 
          class="pagination-btn"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          Anterior
        </button>
        
        <span class="pagination-info">
          Página {{ currentPage }} de {{ totalPages }}
        </span>
        
        <button 
          class="pagination-btn"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          Próxima
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="empty-state"
    >
      <p class="empty-message">
        Sem transações disponíveis
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { BalanceTransaction } from '@clever/shared';

interface Props {
  clientId: string;
}

const props = defineProps<Props>();

const transactions = ref<BalanceTransaction[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const currentPage = ref(1);
const itemsPerPage = 10;

const filters = ref({
  type: '' as '' | 'ADD' | 'DEBT',
  startDate: '',
  endDate: '',
});

const loadTransactions = async () => {
  if (!props.clientId) {
    error.value = 'ID do cliente não fornecido';
    return;
  }

  isLoading.value = true;
  error.value = null;

  const params = new URLSearchParams();
  if (filters.value.type) params.append('type', filters.value.type);
  if (filters.value.startDate) params.append('startDate', filters.value.startDate);
  if (filters.value.endDate) params.append('endDate', filters.value.endDate);

  const queryString = params.toString();
  const url = `/api/balance/${props.clientId}/transactions${queryString ? `?${queryString}` : ''}`;

  await fetch(url)
    .then(async response => {
      if (!response.ok) {
        throw new Error('Erro ao carregar histórico');
      }
      return response.json();
    })
    .then(data => {
      transactions.value = data;
      currentPage.value = 1; // Reset to first page on new load
    })
    .catch(err => {
      console.error('Error loading transactions:', JSON.stringify(err, null, 2));
      error.value = err instanceof Error ? err.message : 'Erro ao carregar histórico';
    })
    .finally(() => {
      isLoading.value = false;
    });
};

const clearFilters = () => {
  filters.value = {
    type: '',
    startDate: '',
    endDate: '',
  };
  loadTransactions();
};

const hasActiveFilters = computed(() => {
  return filters.value.type !== '' || filters.value.startDate !== '' || filters.value.endDate !== '';
});

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return transactions.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(transactions.value.length / itemsPerPage);
});

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
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

const formatSourceType = (source: string): string => {
  const sourceMap: Record<string, string> = {
    'contract': 'Contrato',
    'contract-renovation': 'Renovação de Contrato',
    'work-sheet': 'Folha de Obra',
    'remote-assistance': 'Assistência Remota',
  };
  return sourceMap[source] || source;
};

const getSourceLink = (transaction: BalanceTransaction): string | null => {
  const typeMap: Record<string, string> = {
    'contract': 'contracts',
    'contract-renovation': 'contracts',
    'work-sheet': 'work-sheets',
    'remote-assistance': 'remote-assistance',
  };
  
  const contentType = typeMap[transaction.source];
  if (contentType && transaction.sourceId) {
    return `/${contentType}/${transaction.sourceId}`;
  }
  
  return null;
};

const formatCurrencyChange = (value: number): string => {
  const formatted = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(Math.abs(value));
  
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
};

const formatUsageChange = (value: number): string => {
  if (value === 0) return '0';
  return value > 0 ? `+${value}` : value.toString();
};

const getChangeClass = (value: number): string => {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return '';
};

// Load transactions on mount
onMounted(() => {
  loadTransactions();
});

// Reload when clientId changes
watch(() => props.clientId, () => {
  loadTransactions();
});
</script>

<style scoped>
.transaction-history {
  width: 100%;
  padding: 1rem;
}

/* Filters Section */
.filters-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f9fafb;
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

.filter-select,
.filter-input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  min-height: 44px;
  max-width: 100%;
  box-sizing: border-box;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: #75AE93;
  ring: 2px;
  ring-color: #75AE93;
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

/* Transactions List */
.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.transaction-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  border-left-width: 4px;
}

.transaction-card.transaction-add {
  border-left-color: #10b981;
}

.transaction-card.transaction-debt {
  border-left-color: #dc2626;
}

.transaction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.transaction-type {
  font-weight: 700;
  font-size: 0.875rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
}

.transaction-type.type-add {
  background-color: #d1fae5;
  color: #065f46;
}

.transaction-type.type-debt {
  background-color: #fee2e2;
  color: #991b1b;
}

.transaction-date {
  font-size: 0.875rem;
  color: #6b7280;
}

.transaction-source {
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}

.source-label {
  color: #6b7280;
  margin-right: 0.5rem;
}

.source-link {
  color: #75AE93;
  text-decoration: underline;
}

.source-link:hover {
  color: #5a8a73;
}

.source-text {
  color: #374151;
}

.transaction-changes {
  margin-bottom: 0.75rem;
}

.changes-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.change-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background-color: #f9fafb;
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
}

.change-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.change-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.change-value.positive {
  color: #10b981;
}

.change-value.negative {
  color: #dc2626;
}

.contract-changes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.transaction-footer {
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.created-by {
  font-size: 0.75rem;
  color: #9ca3af;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1rem;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background-color: #75AE93;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
  min-width: 100px;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #5a8a73;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #9ca3af;
}

.pagination-info {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Empty State */
.empty-state {
  padding: 2rem;
  text-align: center;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.empty-message {
  color: #6b7280;
  font-size: 0.875rem;
}

/* Mobile Optimization */
@media (max-width: 767px) {
  .transaction-history {
    padding: 0.75rem;
  }

  .transaction-card {
    padding: 0.75rem;
  }

  .transaction-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .change-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>

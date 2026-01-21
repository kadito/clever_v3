<template>
  <div class="conta-corrente-list">
    <!-- Header -->
    <div class="page-header">
      <BackButton to="/conta-corrente" variant="inline" />
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">💰</span>
          Conta Corrente
        </h1>
        <p class="page-subtitle">Lista de todos os registos de conta corrente</p>
      </div>

      <div class="header-actions">
        <router-link to="/conta-corrente/new" class="btn btn-primary">
          <span class="btn-icon">+</span>
          Novo Registo
        </router-link>
      </div>
    </div>

    <!-- Controls -->
    <div class="list-controls">
      <div class="controls-left">
        <YearSelector v-model="selectedYear" :years="availableYears" @change="handleYearChange" />

        <div class="search-container">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Pesquisar por cliente, número fatura..."
            class="search-input"
            @input="handleSearch"
          />
          <button v-if="searchQuery" @click="clearSearch" class="search-clear" type="button">
            ✕
          </button>
        </div>

        <div class="filter-container">
          <select v-model="statusFilter" @change="applyFilters" class="filter-select">
            <option value="">Todos os Estados</option>
            <option value="paid">Pagos</option>
            <option value="pending">Pendentes</option>
            <option value="overdue">Vencidos</option>
            <option value="due_today">Vencem Hoje</option>
            <option value="due_soon">Vencem em Breve</option>
          </select>
        </div>

        <div class="filter-container">
          <select v-model="typeFilter" @change="applyFilters" class="filter-select">
            <option value="">Todos os Tipos</option>
            <option value="REMOTA">Remota</option>
            <option value="PRESENCIAL">Presencial</option>
            <option value="OUTROS">Outros</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="summary-stats">
      <div class="stat-item">
        <span class="stat-label">Total:</span>
        <span class="stat-value">{{ filteredItems.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Valor Total:</span>
        <span class="stat-value currency">{{ formatCurrency(totalValue) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Pendentes:</span>
        <span class="stat-value warning">{{ pendingCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Vencidos:</span>
        <span class="stat-value danger">{{ overdueCount }}</span>
      </div>
    </div>

    <!-- Desktop Table -->
    <div class="desktop-table">
      <table class="conta-corrente-table">
        <thead>
          <tr>
            <th @click="sortBy('nomeCliente')" class="sortable">
              Cliente
              <span class="sort-indicator" :class="getSortClass('nomeCliente')">↕️</span>
            </th>
            <th @click="sortBy('tipoFatura')" class="sortable">
              Tipo
              <span class="sort-indicator" :class="getSortClass('tipoFatura')">↕️</span>
            </th>
            <th>Nº Fatura</th>
            <th @click="sortBy('valorFatura')" class="sortable">
              Valor
              <span class="sort-indicator" :class="getSortClass('valorFatura')">↕️</span>
            </th>
            <th @click="sortBy('dataFaturaGerada')" class="sortable">
              Data Gerada
              <span class="sort-indicator" :class="getSortClass('dataFaturaGerada')">↕️</span>
            </th>
            <th @click="sortBy('dataVencimentoFatura')" class="sortable">
              Vencimento
              <span class="sort-indicator" :class="getSortClass('dataVencimentoFatura')">↕️</span>
            </th>
            <th>Estado</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in paginatedItems" :key="item.id" class="table-row">
            <td class="client-cell">
              <div class="client-info">
                <div class="client-name">{{ item.nomeCliente }}</div>
                <div v-if="item.motivoObs" class="client-obs">
                  {{ truncateText(item.motivoObs, 50) }}
                </div>
              </div>
            </td>
            <td>
              <span class="type-badge" :class="item.tipoFatura.toLowerCase()">
                {{ item.tipoFatura }}
              </span>
            </td>
            <td>
              <span v-if="item.numeroFatura" class="invoice-number">{{ item.numeroFatura }}</span>
              <span v-else class="text-muted">-</span>
            </td>
            <td>
              <span v-if="item.valorFatura" class="currency">
                {{ formatCurrency(item.valorFatura) }}
              </span>
              <span v-else class="text-muted">-</span>
            </td>
            <td>
              <span v-if="item.dataFaturaGerada" class="date">
                {{ formatDate(item.dataFaturaGerada) }}
              </span>
              <span v-else class="text-muted">-</span>
            </td>
            <td>
              <span v-if="item.dataVencimentoFatura" class="date" :class="getDueDateClass(item)">
                {{ formatDate(item.dataVencimentoFatura) }}
              </span>
              <span v-else class="text-muted">-</span>
            </td>
            <td>
              <span class="status-badge" :class="getInvoiceStatus(item)">
                {{ getStatusLabel(item) }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <router-link
                  :to="`/conta-corrente/${getYearFromDate(item.dataFaturaGerada || item.dataVencimentoFatura)}/${item.id}`"
                  class="btn btn-sm btn-secondary"
                  title="Ver detalhes"
                >
                  👁️
                </router-link>
                <router-link
                  :to="`/conta-corrente/${getYearFromDate(item.dataFaturaGerada || item.dataVencimentoFatura)}/${item.id}/edit`"
                  class="btn btn-sm btn-outline"
                  title="Editar"
                >
                  ✏️
                </router-link>
                <button @click="confirmDelete(item)" class="btn btn-sm btn-danger" title="Eliminar">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards -->
    <div class="mobile-cards">
      <div v-for="item in paginatedItems" :key="item.id" class="conta-corrente-card">
        <div class="card-header">
          <div class="card-title">{{ item.nomeCliente }}</div>
          <span class="type-badge" :class="item.tipoFatura.toLowerCase()">
            {{ item.tipoFatura }}
          </span>
        </div>

        <div class="card-content">
          <div class="card-row" v-if="item.numeroFatura">
            <span class="label">Nº Fatura:</span>
            <span class="value">{{ item.numeroFatura }}</span>
          </div>

          <div class="card-row" v-if="item.valorFatura">
            <span class="label">Valor:</span>
            <span class="value currency">{{ formatCurrency(item.valorFatura) }}</span>
          </div>

          <div class="card-row" v-if="item.dataVencimentoFatura">
            <span class="label">Vencimento:</span>
            <span class="value" :class="getDueDateClass(item)">{{
              formatDate(item.dataVencimentoFatura)
            }}</span>
          </div>

          <div class="card-row">
            <span class="label">Estado:</span>
            <span class="status-badge" :class="getInvoiceStatus(item)">
              {{ getStatusLabel(item) }}
            </span>
          </div>

          <div v-if="item.motivoObs" class="card-row">
            <span class="label">Observações:</span>
            <span class="value">{{ truncateText(item.motivoObs, 100) }}</span>
          </div>
        </div>

        <div class="card-actions">
          <router-link
            :to="`/conta-corrente/${getYearFromDate(item.dataFaturaGerada || item.dataVencimentoFatura)}/${item.id}`"
            class="btn btn-sm btn-secondary"
          >
            Ver Detalhes
          </router-link>
          <router-link
            :to="`/conta-corrente/${getYearFromDate(item.dataFaturaGerada || item.dataVencimentoFatura)}/${item.id}/edit`"
            class="btn btn-sm btn-outline"
          >
            Editar
          </router-link>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button @click="currentPage = 1" :disabled="currentPage === 1" class="btn btn-sm">⏪</button>
      <button @click="currentPage--" :disabled="currentPage === 1" class="btn btn-sm">⬅️</button>

      <span class="pagination-info">
        Página {{ currentPage }} de {{ totalPages }} ({{ startIndex + 1 }}-{{ endIndex }} de
        {{ filteredItems.length }})
      </span>

      <button @click="currentPage++" :disabled="currentPage === totalPages" class="btn btn-sm">
        ➡️
      </button>
      <button
        @click="currentPage = totalPages"
        :disabled="currentPage === totalPages"
        class="btn btn-sm"
      >
        ⏩
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && filteredItems.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>Nenhum registo encontrado</h3>
      <p v-if="hasFilters">Tente ajustar os filtros ou termos de pesquisa.</p>
      <p v-else>Comece por adicionar o primeiro registo de conta corrente.</p>
      <router-link to="/conta-corrente/new" class="btn btn-primary"> Novo Registo </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>A carregar registos...</p>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="itemToDelete" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Confirmar Eliminação</h3>
        </div>
        <div class="modal-body">
          <p>Tem certeza que deseja eliminar este registo?</p>
          <div class="delete-item-info">
            <strong>{{ itemToDelete.nomeCliente }}</strong>
            <br />
            <span v-if="itemToDelete.numeroFatura">Fatura: {{ itemToDelete.numeroFatura }}</span>
            <span v-if="itemToDelete.valorFatura">
              - {{ formatCurrency(itemToDelete.valorFatura) }}</span
            >
          </div>
          <p class="warning-text">Esta ação não pode ser desfeita.</p>
        </div>
        <div class="modal-actions">
          <button @click="cancelDelete" class="btn btn-secondary">Cancelar</button>
          <button @click="deleteItem" class="btn btn-danger" :disabled="loading">
            {{ loading ? 'A eliminar...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-text">{{ error }}</span>
        <button @click="clearError" class="error-close">✕</button>
      </div>
    </div>

    <!-- Floating Action Button -->
    <button @click="navigateToCreate" class="fab">➕</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useContaCorrenteStore } from '@/stores/conta-corrente';
import YearSelector from '@/components/YearSelector.vue';
import BackButton from '@/components/BackButton.vue';

const route = useRoute();
const router = useRouter();
const store = useContaCorrenteStore();

const navigateToCreate = () => {
  router.push('/conta-corrente/new?from=list');
};

// Local state
const selectedYear = ref(new Date().getFullYear().toString());
const searchQuery = ref('');
const statusFilter = ref('');
const typeFilter = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(20);
const itemToDelete = ref(null);

// Sorting state
const sortField = ref('dataFaturaGerada');
const sortDirection = ref('desc');

// Computed properties from store
const {
  contaCorrente,
  loading,
  error,
  availableYears,
  formatDate,
  formatCurrency,
  getInvoiceStatus,
  getYearFromDate,
  isInvoiceOverdue,
  isInvoiceDueToday,
  clearError,
} = store;

// Computed properties
const filteredItems = computed(() => {
  let items = [...contaCorrente.value];

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    items = items.filter(
      item =>
        item.nomeCliente?.toLowerCase().includes(query) ||
        item.tipoFatura?.toLowerCase().includes(query) ||
        item.numeroFatura?.toString().includes(query) ||
        item.formaPagamento?.toLowerCase().includes(query) ||
        item.motivoObs?.toLowerCase().includes(query) ||
        item.numeroRemota?.toString().includes(query) ||
        item.numeroPresencial?.toString().includes(query)
    );
  }

  // Apply status filter
  if (statusFilter.value) {
    items = items.filter(item => getInvoiceStatus(item) === statusFilter.value);
  }

  // Apply type filter
  if (typeFilter.value) {
    items = items.filter(item => item.tipoFatura === typeFilter.value);
  }

  // Apply sorting
  items.sort((a, b) => {
    let aVal = a[sortField.value];
    let bVal = b[sortField.value];

    // Handle different data types
    if (sortField.value.includes('data')) {
      aVal = aVal ? new Date(aVal) : new Date(0);
      bVal = bVal ? new Date(bVal) : new Date(0);
    } else if (sortField.value === 'valorFatura') {
      aVal = parseFloat(aVal) || 0;
      bVal = parseFloat(bVal) || 0;
    } else {
      aVal = (aVal || '').toString().toLowerCase();
      bVal = (bVal || '').toString().toLowerCase();
    }

    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1;
    return 0;
  });

  return items;
});

const totalPages = computed(() => Math.ceil(filteredItems.value.length / itemsPerPage.value));
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);
const endIndex = computed(() =>
  Math.min(startIndex.value + itemsPerPage.value, filteredItems.value.length)
);

const paginatedItems = computed(() => filteredItems.value.slice(startIndex.value, endIndex.value));

const hasFilters = computed(
  () => searchQuery.value.trim() || statusFilter.value || typeFilter.value
);

const totalValue = computed(() =>
  filteredItems.value.reduce((sum, item) => {
    const value = parseFloat(item.valorFatura) || 0;
    return sum + value;
  }, 0)
);

const pendingCount = computed(
  () => filteredItems.value.filter(item => item.pago !== 'TRUE' && item.pago !== 'true').length
);

const overdueCount = computed(
  () => filteredItems.value.filter(item => isInvoiceOverdue(item)).length
);

// Methods
async function handleYearChange(year) {
  selectedYear.value = year;
  currentPage.value = 1;
  await store.fetchContaCorrenteForYear(year);
}

function handleSearch() {
  currentPage.value = 1;
}

function clearSearch() {
  searchQuery.value = '';
  currentPage.value = 1;
}

function applyFilters() {
  currentPage.value = 1;
}

function sortBy(field) {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortDirection.value = 'asc';
  }
  currentPage.value = 1;
}

function getSortClass(field) {
  if (sortField.value !== field) return '';
  return sortDirection.value === 'asc' ? 'sort-asc' : 'sort-desc';
}

function getStatusLabel(item) {
  const status = getInvoiceStatus(item);
  const labels = {
    paid: 'Pago',
    overdue: 'Vencido',
    due_today: 'Vence Hoje',
    due_soon: 'Vence em Breve',
    pending: 'Pendente',
  };
  return labels[status] || 'Desconhecido';
}

function getDueDateClass(item) {
  if (item.pago === 'TRUE' || item.pago === 'true') return '';
  if (isInvoiceOverdue(item)) return 'overdue';
  if (isInvoiceDueToday(item)) return 'due-today';
  return '';
}

function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function confirmDelete(item) {
  itemToDelete.value = item;
}

function cancelDelete() {
  itemToDelete.value = null;
}

async function deleteItem() {
  if (!itemToDelete.value) return;

  try {
    const year = getYearFromDate(
      itemToDelete.value.dataFaturaGerada || itemToDelete.value.dataVencimentoFatura
    );
    await store.deleteContaCorrente(year, itemToDelete.value.id);
    itemToDelete.value = null;
  } catch (err) {
    console.error('Error deleting item:', err);
  }
}

// Lifecycle
onMounted(async () => {
  // Check for filter parameter in route
  const filterParam = route.query.filter;
  if (filterParam) {
    statusFilter.value = filterParam;
  }

  try {
    await Promise.all([
      store.fetchAvailableYears(),
      store.fetchContaCorrenteForYear(selectedYear.value),
    ]);
  } catch (err) {
    console.error('Error loading initial data:', err);
  }
});

// Watch for pagination reset when items change
watch([searchQuery, statusFilter, typeFilter], () => {
  currentPage.value = 1;
});
</script>

<style scoped>
.conta-corrente-list {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.header-content h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.title-icon {
  font-size: 2rem;
}

.page-subtitle {
  color: var(--color-text-muted);
  margin: 0;
}

.list-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.controls-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-container {
  position: relative;
}

.search-input {
  width: 300px;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.875rem;
  background: var(--color-background);
  color: var(--color-text);
}

.search-clear {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.25rem;
}

.filter-select {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.875rem;
}

.summary-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--color-background-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  color: var(--color-text-muted);
  font-weight: 500;
}

.stat-value {
  font-weight: 600;
  color: var(--color-text);
}

.stat-value.currency {
  color: var(--color-success);
}

.stat-value.warning {
  color: var(--color-warning);
}

.stat-value.danger {
  color: var(--color-danger);
}

.desktop-table {
  display: block;
  background: var(--color-background-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.conta-corrente-table {
  width: 100%;
  border-collapse: collapse;
}

.conta-corrente-table th {
  background: var(--color-background-muted);
  padding: 1rem 0.75rem;
  text-align: left;
  font-weight: 600;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
}

.conta-corrente-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.conta-corrente-table th.sortable:hover {
  background: var(--color-background-hover);
}

.sort-indicator {
  margin-left: 0.5rem;
  opacity: 0.5;
  font-size: 0.75rem;
}

.sort-indicator.sort-asc {
  opacity: 1;
  transform: rotate(180deg);
}

.sort-indicator.sort-desc {
  opacity: 1;
}

.conta-corrente-table td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-border);
  vertical-align: top;
}

.client-cell {
  min-width: 200px;
}

.client-name {
  font-weight: 500;
  color: var(--color-text);
}

.client-obs {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
}

.type-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.type-badge.remota {
  background: var(--color-info-light);
  color: var(--color-info);
}

.type-badge.presencial {
  background: var(--color-success-light);
  color: var(--color-success);
}

.type-badge.outros {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.paid {
  background: var(--color-success-light);
  color: var(--color-success);
}

.status-badge.overdue {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.status-badge.due_today {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.status-badge.due_soon {
  background: var(--color-info-light);
  color: var(--color-info);
}

.status-badge.pending {
  background: var(--color-background-muted);
  color: var(--color-text-muted);
}

.currency {
  font-weight: 500;
  color: var(--color-success);
}

.date.overdue {
  color: var(--color-danger);
  font-weight: 500;
}

.date.due-today {
  color: var(--color-warning);
  font-weight: 500;
}

.text-muted {
  color: var(--color-text-muted);
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.mobile-cards {
  display: none;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination-info {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  background: var(--color-background);
  color: var(--color-text);
}

.btn:hover:not(:disabled) {
  background: var(--color-background-hover);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.btn-primary:hover {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.btn-secondary {
  background: var(--color-background-elevated);
  color: var(--color-text);
}

.btn-outline {
  background: transparent;
  color: var(--color-text);
}

.btn-danger {
  background: var(--color-danger);
  color: white;
  border-color: var(--color-danger);
}

.btn-danger:hover {
  background: var(--color-danger-dark);
  border-color: var(--color-danger-dark);
}

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-muted);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-muted);
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-background);
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  color: var(--color-text);
}

.modal-body {
  padding: 1rem 1.5rem;
}

.delete-item-info {
  background: var(--color-background-elevated);
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
  color: var(--color-text);
}

.warning-text {
  color: var(--color-danger);
  font-size: 0.875rem;
  margin-top: 1rem;
}

.modal-actions {
  padding: 1rem 1.5rem 1.5rem;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.error-message {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: var(--color-danger-light);
  border: 1px solid var(--color-danger);
  border-radius: 6px;
  padding: 1rem;
  max-width: 400px;
  z-index: 1000;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-text {
  flex: 1;
  color: var(--color-danger);
}

.error-close {
  background: none;
  border: none;
  color: var(--color-danger);
  cursor: pointer;
  padding: 0.25rem;
}

/* Floating Action Button */
.fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  border: none;
  font-size: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 100;
}

.fab:hover {
  transform: translateY(-5px);
  background: var(--primary-hover);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .fab {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 50px;
    height: 50px;
    font-size: 1.25rem;
  }

  .conta-corrente-list {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .list-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .controls-left {
    justify-content: space-between;
  }

  .search-input {
    width: 100%;
    min-width: 200px;
  }

  .summary-stats {
    flex-direction: column;
    gap: 1rem;
  }

  .desktop-table {
    display: none;
  }

  .mobile-cards {
    display: block;
  }

  .conta-corrente-card {
    background: var(--color-background-elevated);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .card-title {
    font-weight: 600;
    color: var(--color-text);
    flex: 1;
  }

  .card-content {
    margin-bottom: 1rem;
  }

  .card-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .card-row .label {
    color: var(--color-text-muted);
    font-size: 0.875rem;
  }

  .card-row .value {
    color: var(--color-text);
    font-weight: 500;
  }

  .card-actions {
    display: flex;
    gap: 0.5rem;
  }

  .card-actions .btn {
    flex: 1;
    justify-content: center;
  }
}
</style>

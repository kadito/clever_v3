<template>
  <div class="licencas-container">
    <div class="licencas-header">
      <BackButton to="/gestor-licencas" variant="inline" />
    </div>

    <!-- Controls -->
    <div class="list-controls">
      <div class="controls-left">
        <h2>Licenças {{ selectedYear || 'Todos' }} ({{ displayItems.length }})</h2>
      </div>

      <div class="controls-right">
        <YearSelector
          v-model="selectedYear"
          :years="availableYears"
          :show-all-option="true"
          @change="handleYearChange"
        />

        <button @click="loadData" :disabled="loading" class="btn btn-refresh">🔄 Atualizar</button>
      </div>
    </div>

    <!-- Search -->
    <div class="search-section">
      <div class="search-container">
        <input
          type="text"
          v-model="searchQuery"
          @input="handleSearch"
          placeholder="Pesquisar por cliente, software, série..."
          class="search-input"
        />
        <span class="search-icon">🔍</span>
      </div>

      <div class="month-filter-container">
        <label for="month-filter" class="month-filter-label">Filtrar por mês de validade:</label>
        <select
          id="month-filter"
          v-model="selectedMonth"
          @change="handleMonthChange"
          class="month-filter-select"
        >
          <option value="">Todos os meses</option>
          <option v-for="month in months" :key="month.value" :value="month.value">
            {{ month.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <p>A carregar licenças...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-alert">
      <p>{{ error }}</p>
      <button @click="clearError" class="close-btn">×</button>
    </div>

    <!-- Licenças List -->
    <div v-else-if="displayItems.length > 0" class="licencas-list">
      <div
        v-for="licenca in displayItems"
        :key="`${licenca.year || selectedYear}-${licenca.id}`"
        class="licenca-item"
        @click="navigateToDetail(licenca)"
      >
        <div class="licenca-main">
          <h3>{{ licenca.cliente }}</h3>
          <div class="licenca-meta">
            <span class="licenca-software">{{
              formatSoftwareNames(licenca.tipoSoftware || licenca.software?.name)
            }}</span>
            <span class="licenca-version">{{ licenca.versao || 'Sem versão' }}</span>
          </div>
          <div class="licenca-details" v-if="licenca.modalidade || licenca.numeroSerie">
            <span v-if="licenca.modalidade" class="licenca-modalidade"
              >📅 {{ licenca.modalidade }}</span
            >
            <span v-if="licenca.numeroSerie" class="licenca-serie"
              >🔐 {{ licenca.numeroSerie }}</span
            >
          </div>
          <div class="licenca-validation" v-if="getValidationDate(licenca)">
            <span class="validation-date">📆 Validade: {{ formatValidationDate(licenca) }}</span>
          </div>
          <div class="licenca-status">
            <span
              class="status-badge"
              :class="{
                expired: isLicenseExpired(licenca),
                expiring: isLicenseExpiringSoon(licenca),
                active: !isLicenseExpired(licenca) && !isLicenseExpiringSoon(licenca),
              }"
            >
              {{ getLicenseStatus(licenca) }}
            </span>
          </div>
          <div v-if="searchResults && licenca.year" class="licenca-year">
            <span>Ano: {{ licenca.year }}</span>
          </div>
        </div>
        <div class="licenca-actions">
          <button class="action-btn" @click.stop="showActions(licenca)">⋮</button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <h3>Nenhuma licença encontrada</h3>
      <p v-if="searchQuery">Não foram encontradas licenças com o termo "{{ searchQuery }}".</p>
      <p v-else-if="selectedYear">Não há licenças para o ano {{ selectedYear }}.</p>
      <p v-else>Não há licenças cadastradas no sistema.</p>
    </div>

    <!-- Search Results Info -->
    <div v-if="searchResults && (searchQuery || selectedMonth)" class="search-info">
      <p>
        {{ searchResults.count || 0 }} resultado(s) encontrado(s)
        <span v-if="searchQuery">para "{{ searchQuery }}"</span>
        <span v-if="selectedMonth"
          >no mês de {{ months.find(m => m.value === selectedMonth)?.label }}</span
        >
        {{ selectedYear ? `no ano ${selectedYear}` : 'em todos os anos' }}
      </p>
    </div>
    <!-- Actions Modal -->
    <div v-if="showActionsModal" class="actions-modal-overlay" @click="closeActions">
      <div class="actions-modal" @click.stop>
        <h3>{{ selectedLicencaForActions?.cliente }}</h3>
        <div class="modal-actions">
          <button @click="viewDetails(selectedLicencaForActions)" class="modal-btn view-btn">
            📋 Ver Detalhes
          </button>
          <button @click="editLicenca(selectedLicencaForActions)" class="modal-btn edit-btn">
            ✏️ Editar
          </button>
          <button @click="confirmDelete(selectedLicencaForActions)" class="modal-btn delete-btn">
            🗑️ Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content" @click.stop>
        <h3>Confirmar Eliminação</h3>
        <p>
          Tem a certeza que pretende eliminar a licença de
          <strong>{{ licencaToDelete?.cliente }}</strong
          >?
        </p>
        <div class="modal-actions">
          <button @click="cancelDelete" class="btn btn-secondary">Cancelar</button>
          <button @click="deleteLicencaAction" class="btn btn-danger" :disabled="loading">
            {{ loading ? 'A eliminar...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Floating Action Button -->
    <button @click="navigateToCreate" class="fab">➕</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useLicencasStore } from '@/stores/licencas.js';
import BackButton from '@/components/BackButton.vue';
import YearSelector from '@/components/YearSelector.vue';

// Router
const router = useRouter();

// Store
const licencasStore = useLicencasStore();

const navigateToCreate = () => {
  router.push('/licencas/new?from=list');
};

// Reactive references from store
const { licencas, availableYears, currentYear, loading, error } = storeToRefs(licencasStore);
const {
  fetchLicencasForYear,
  fetchAvailableYears,
  searchLicencas,
  clearError,
  setCurrentYear,
  getLicenseStatus,
  isLicenseExpired,
  isLicenseExpiringSoon,
  formatDate,
  getValidationDate,
} = licencasStore;

// Local state
const selectedYear = ref('');
const searchQuery = ref('');
const selectedMonth = ref('');
const searchResults = ref(null);
const showDeleteModal = ref(false);
const licencaToDelete = ref(null);
const showActionsModal = ref(false);
const selectedLicencaForActions = ref(null);

// Months for filter
const months = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

// Computed
const displayItems = computed(() => {
  if (searchResults.value) {
    return searchResults.value.results || [];
  }
  return licencas.value || [];
});

// Methods
const loadData = async () => {
  await fetchAvailableYears();
  await fetchLicencasForYear(selectedYear.value || null);
};

const handleYearChange = year => {
  selectedYear.value = year;
  if (!searchQuery.value) {
    setCurrentYear(year || new Date().getFullYear().toString());
    fetchLicencasForYear(year || null);
  } else {
    handleSearch();
  }
};

let searchTimeout = null;
const handleSearch = async () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(async () => {
    await performSearch();
  }, 300);
};

const handleMonthChange = async () => {
  await performSearch();
};

const performSearch = async () => {
  // If no search query and no month filter, clear results
  if (!searchQuery.value.trim() && !selectedMonth.value) {
    searchResults.value = null;
    return;
  }

  // If search query is too short and no month filter, don't search
  if (
    searchQuery.value.trim().length > 0 &&
    searchQuery.value.trim().length < 2 &&
    !selectedMonth.value
  ) {
    return;
  }

  // Build search params
  const searchParams = new URLSearchParams();
  if (searchQuery.value.trim()) {
    searchParams.append('q', searchQuery.value.trim());
  }
  if (selectedMonth.value) {
    searchParams.append('month', selectedMonth.value);
  }
  if (selectedYear.value) {
    searchParams.append('year', selectedYear.value);
  }

  try {
    const response = await fetch(`/api/licencas/search?${searchParams}`);
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }
    const data = await response.json();
    searchResults.value = data;
  } catch (err) {
    console.error('Error searching licencas:', err);
    searchResults.value = null;
  }
};

const formatValidationDate = licenca => {
  const validationDate = getValidationDate(licenca);
  if (!validationDate) return 'N/A';
  return formatDate(validationDate.toISOString());
};

const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = null;
  loadData();
};

const viewLicenca = licenca => {
  const year = licenca.year || currentYear.value;
  router.push(`/licencas/${year}/${licenca.id}`);
};

const showActions = licenca => {
  selectedLicencaForActions.value = licenca;
  showActionsModal.value = true;
};

const closeActions = () => {
  showActionsModal.value = false;
  selectedLicencaForActions.value = null;
};

const navigateToDetail = licenca => {
  const year = licenca.year || selectedYear.value || currentYear.value;
  router.push(`/licencas/${year}/${licenca.id}`);
};

const viewDetails = licenca => {
  navigateToDetail(licenca);
  closeActions();
};

const editLicenca = licenca => {
  const year = licenca.year || selectedYear.value || currentYear.value;
  router.push(`/licencas/${year}/${licenca.id}/edit?from=list`);
  closeActions();
};

const confirmDelete = licenca => {
  licencaToDelete.value = licenca;
  showDeleteModal.value = true;
  closeActions();
};

const cancelDelete = () => {
  licencaToDelete.value = null;
  showDeleteModal.value = false;
};

const deleteLicencaAction = async () => {
  if (!licencaToDelete.value) return;

  try {
    const year = licencaToDelete.value.year || currentYear.value;
    await licencasStore.deleteLicenca(year, licencaToDelete.value.id);

    // Refresh data
    if (searchResults.value) {
      handleSearch();
    } else {
      loadData();
    }

    cancelDelete();
  } catch (err) {
    console.error('Error deleting licenca:', err);
    // Error is handled by the store
  }
};

// Remove this function since it's imported from store

const getLicenseStatusText = licenca => {
  const status = getLicenseStatus(licenca);
  switch (status) {
    case 'expired':
      return 'Expirada';
    case 'expiring':
      return 'A Expirar';
    case 'active':
      return 'Ativa';
    default:
      return 'Indefinida';
  }
};

// Format software names (handle both array and string formats)
const formatSoftwareNames = software => {
  if (!software) return 'N/A';
  if (Array.isArray(software)) {
    return software.join(', ');
  }
  return software;
};

// Remove this function since it's imported from store

// Watchers
watch(searchQuery, newValue => {
  if (!newValue.trim() && !selectedMonth.value) {
    searchResults.value = null;
  }
});

// Lifecycle
onMounted(() => {
  selectedYear.value = currentYear.value;
  loadData();
});
</script>

<style scoped>
.licencas-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  background: #f5f5f5;
  min-height: 100vh;
}

.licencas-header {
  margin-bottom: 1rem;
}

.page-description {
  color: #666;
  margin: 0;
}

.list-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
}

.controls-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 300px;
}

.controls-right {
  display: flex;
  gap: 0.75rem;
}

.search-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-container {
  position: relative;
}

.month-filter-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.month-filter-label {
  font-size: 0.9rem;
  color: #666;
  white-space: nowrap;
}

.month-filter-select {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
}

.month-filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(117, 174, 147, 0.2);
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.search-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  pointer-events: none;
}

/* Licenças List Styles */
.licencas-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.licenca-item {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: start;
}

.licenca-item:hover {
  border-color: var(--primary-color);
  background: #f8fafa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.licenca-main {
  flex: 1;
}

.licenca-main h3 {
  margin: 0 0 0.75rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
}

.licenca-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.licenca-software {
  background: var(--primary-light);
  color: var(--primary-dark);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.licenca-version {
  background: #e3f2fd;
  color: #1565c0;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.licenca-details {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.licenca-modalidade,
.licenca-serie {
  font-size: 0.9rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.licenca-validation {
  margin-bottom: 0.5rem;
}

.validation-date {
  font-size: 0.9rem;
  color: #495057;
  font-weight: 500;
}

.licenca-validation {
  margin-bottom: 0.5rem;
}

.validation-date {
  font-size: 0.9rem;
  color: #495057;
  font-weight: 500;
}

.licenca-status {
  margin-bottom: 0.5rem;
}

.licenca-year {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.licenca-actions {
  display: flex;
  align-items: center;
}

.action-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  color: #666;
  transition: all 0.2s ease;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: #f5f5f5;
  color: var(--primary-color);
}

/* Actions Modal */
.actions-modal-overlay {
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
  padding: 1rem;
}

.actions-modal {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 300px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.actions-modal h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
  text-align: center;
}

.modal-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.modal-btn:last-child {
  margin-bottom: 0;
}

.view-btn {
  background: #e3f2fd;
  color: #1565c0;
}

.view-btn:hover {
  background: #bbdefb;
}

.edit-btn {
  background: #fff3cd;
  color: #856404;
}

.edit-btn:hover {
  background: #ffeaa7;
}

.delete-btn {
  background: #f8d7da;
  color: #721c24;
}

.delete-btn:hover {
  background: #f1c2c7;
}

/* Search Info */
.search-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
}

/* Error Alert */
.error-alert {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-alert p {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #721c24;
}

/* Refresh Button */
.btn-refresh {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
}

.btn-refresh:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.search-clear {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-clear:hover {
  background: #f5f5f5;
  color: #666;
}

.search-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-outline {
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.btn-outline:hover {
  background: var(--primary-color);
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-icon {
  font-size: 1.1rem;
  font-weight: bold;
}

.list-content {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e9ecef;
  border-top: 4px solid var(--primary-color);
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

.error-icon,
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

.table-container {
  overflow-x: auto;
}

.licencas-table {
  width: 100%;
  border-collapse: collapse;
}

.licencas-table th {
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e9ecef;
  white-space: nowrap;
}

.licencas-table td {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  vertical-align: top;
}

.table-row:hover {
  background: #f8fafa;
}

.client-cell {
  min-width: 200px;
}

.client-name {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.client-email {
  font-size: 0.85rem;
  color: #666;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.expiring {
  background: #fff3cd;
  color: #856404;
}

.status-badge.expired {
  background: #f8d7da;
  color: #721c24;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 1rem;
}

.btn-view:hover {
  background: #e3f2fd;
}

.btn-edit:hover {
  background: #fff3cd;
}

.btn-delete:hover {
  background: #f8d7da;
}

.mobile-cards {
  padding: 1rem;
}

.licenca-card {
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.licenca-card:hover {
  border-color: var(--primary-color);
  background: #f8fafa;
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.card-content {
  margin-bottom: 1rem;
}

.card-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.field-label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.field-value {
  color: #2c3e50;
  text-align: right;
  flex: 1;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
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
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.warning-text {
  color: #dc3545;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.desktop-table {
  display: block;
}

.mobile-only {
  display: none;
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

/* Mobile optimizations */
@media (max-width: 768px) {
  .fab {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 50px;
    height: 50px;
    font-size: 1.25rem;
  }

  .licencas-list {
    padding: 0.75rem;
  }

  .list-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .controls-left {
    flex-direction: column;
    min-width: unset;
  }

  .controls-right {
    justify-content: center;
  }

  .search-container {
    max-width: none;
  }

  .search-summary {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .desktop-table {
    display: none;
  }

  .mobile-only {
    display: block;
  }

  .empty-actions {
    flex-direction: column;
    align-items: center;
  }

  .modal-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .card-field {
    flex-direction: column;
    align-items: start;
    gap: 0.25rem;
  }

  .field-value {
    text-align: left;
  }

  .card-actions {
    flex-direction: column;
  }
}
</style>

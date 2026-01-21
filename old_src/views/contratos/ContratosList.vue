<template>
  <div class="contratos-container">
    <div class="contratos-header">
      <BackButton to="/gestor-contratos" variant="inline" />
    </div>

    <!-- Controls -->
    <div class="list-controls">
      <div class="controls-left">
        <h2>Contratos {{ selectedYear }} ({{ displayedContratos.length }})</h2>
      </div>

      <div class="controls-right">
        <!-- Year selector -->
        <YearSelector v-model="selectedYear" :years="availableYears" @change="handleYearChange" />

        <button @click="refreshData" :disabled="loading" class="btn btn-refresh">
          🔄 Atualizar
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="search-section">
      <div class="search-container">
        <input
          type="text"
          v-model="searchQuery"
          @input="handleSearch"
          placeholder="Pesquisar por nome do cliente..."
          class="search-input"
        />
        <span class="search-icon">🔍</span>
      </div>

      <div class="month-filter-container">
        <label for="month-filter" class="month-filter-label">Filtrar por mês de expiração:</label>
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
      <p>A carregar contratos...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-alert">
      <p>{{ error }}</p>
      <button @click="clearError" class="close-btn">×</button>
    </div>

    <!-- Contratos List -->
    <div v-if="!loading && displayedContratos.length > 0" class="contratos-list">
      <div
        v-for="contrato in displayedContratos"
        :key="contrato.id"
        class="contrato-item"
        @click="navigateToDetail(contrato)"
      >
        <div class="contrato-main">
          <div class="contrato-header">
            <h3>
              {{
                contrato.clienteName ||
                contrato.nomeComercial ||
                contrato.nome ||
                'Cliente não especificado'
              }}
            </h3>
            <span class="contrato-id">{{ `CT${String(contrato.id).slice(0, 8)}` }}</span>
          </div>

          <div class="contrato-info">
            <div class="info-row">
              <span class="info-label">Tipo:</span>
              <span class="info-value tipo-badge" :class="getTipoClass(contrato)">
                {{ getTipoContrato(contrato) }}
              </span>
            </div>

            <div class="info-row">
              <span class="info-label">Validade:</span>
              <div class="info-value expiration-dates">
                <div v-if="hasCPAContract(contrato)" class="expiration-date-item">
                  <span class="expiration-label">CPA:</span>
                  <span :class="getExpirationClassForDate(getCPAExpirationDate(contrato))">
                    {{ formatExpirationDate(getCPAExpirationDate(contrato)) }}
                    <span
                      v-if="getExpirationMonthForDate(getCPAExpirationDate(contrato))"
                      class="month-indicator"
                    >
                      ({{
                        getMonthName(getExpirationMonthForDate(getCPAExpirationDate(contrato)))
                      }})
                    </span>
                    <span
                      v-if="!contrato.fimContratoCPA && contrato.inicioContratoCPA"
                      class="calculated-badge"
                      title="Calculado a partir da data de início"
                    >
                      *
                    </span>
                  </span>
                </div>
                <div v-if="hasSHContract(contrato)" class="expiration-date-item">
                  <span class="expiration-label">S&H:</span>
                  <span :class="getExpirationClassForDate(getSHExpirationDate(contrato))">
                    {{ formatExpirationDate(getSHExpirationDate(contrato)) }}
                    <span
                      v-if="getExpirationMonthForDate(getSHExpirationDate(contrato))"
                      class="month-indicator"
                    >
                      ({{ getMonthName(getExpirationMonthForDate(getSHExpirationDate(contrato))) }})
                    </span>
                    <span
                      v-if="!contrato.fimContratoSH && contrato.inicioContratoSH"
                      class="calculated-badge"
                      title="Calculado a partir da data de início"
                    >
                      *
                    </span>
                  </span>
                </div>
                <div
                  v-if="!hasCPAContract(contrato) && !hasSHContract(contrato)"
                  class="expiration-date-item"
                >
                  <span class="no-date">Sem data de validade</span>
                </div>
              </div>
            </div>

            <div class="info-row" v-if="getFrequenciaPagamento(contrato)">
              <span class="info-label">Pagamento:</span>
              <span class="info-value">{{ getFrequenciaPagamento(contrato) }}</span>
            </div>
          </div>
        </div>
        <div class="contrato-actions">
          <button class="action-btn" @click.stop="showActions(contrato)">⋮</button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && displayedContratos.length === 0" class="empty-state">
      <h3>Nenhum contrato encontrado</h3>
      <p v-if="searchQuery">Não foram encontrados contratos com o termo "{{ searchQuery }}".</p>
      <p v-else>Não há contratos para o ano {{ selectedYear }}.</p>
    </div>

    <!-- Search Results Info -->
    <div v-if="searchResults && (searchQuery || selectedMonth)" class="search-info">
      <p>
        {{ searchResults.count }} resultado(s) encontrado(s)
        <span v-if="searchQuery">para "{{ searchQuery }}"</span>
        <span v-if="selectedMonth">expirando em {{ getMonthName(parseInt(selectedMonth)) }}</span>
        <span v-if="searchYear"> no ano {{ searchYear }}</span>
        <span v-else-if="!searchQuery && !selectedMonth"> em todos os anos</span>
      </p>
    </div>

    <!-- Actions Modal (like in folhas obra) -->
    <div v-if="showActionsModal" class="actions-modal-overlay" @click="closeActions">
      <div class="actions-modal" @click.stop>
        <h3>{{ selectedContratoForActions?.clienteName || 'Cliente não especificado' }}</h3>
        <div class="modal-actions">
          <button @click="viewContrato" class="modal-btn view-btn">📋 Ver Detalhes</button>
          <button @click="editContrato" class="modal-btn edit-btn">✏️ Editar</button>
          <button @click="deleteContrato" class="modal-btn delete-btn">🗑️ Eliminar</button>
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
import BackButton from '@/components/BackButton.vue';
import YearSelector from '@/components/YearSelector.vue';
import { useContratosStore } from '@/stores/contratos.js';

// Router
const router = useRouter();

// Store
const store = useContratosStore();
const { contratos, currentYear, availableYears, loading, error } = storeToRefs(store);
const {
  fetchContratosForYear,
  fetchAvailableYears,
  searchContratos,
  clearError,
  setCurrentYear,
  deleteContrato: deleteContratoFromStore,
} = store;

// Local state
const searchQuery = ref('');
const searchResults = ref(null);
const selectedYear = ref(currentYear.value);
const searchYear = ref(null);
const selectedMonth = ref('');
const showActionsModal = ref(false);
const selectedContratoForActions = ref(null);

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
const displayedContratos = computed(() => {
  if (searchResults.value && (searchQuery.value || selectedMonth.value)) {
    return searchResults.value.results || [];
  }
  return contratos.value;
});

// Methods
const handleYearChange = async () => {
  setCurrentYear(selectedYear.value);
  searchResults.value = null;
  searchQuery.value = '';
  selectedMonth.value = '';
  await fetchContratosForYear(selectedYear.value);
};

const refreshData = async () => {
  searchResults.value = null;
  searchQuery.value = '';
  selectedMonth.value = '';
  await Promise.all([fetchAvailableYears(), fetchContratosForYear(selectedYear.value)]);
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
  if (searchQuery.value.trim() || selectedMonth.value) {
    const month = selectedMonth.value ? parseInt(selectedMonth.value) : null;
    const results = await searchContratos(
      searchQuery.value.trim() || null,
      selectedYear.value,
      month
    );
    searchResults.value = results;
    searchYear.value = selectedYear.value;
  } else {
    searchResults.value = null;
    searchYear.value = null;
  }
};

// Helper functions for card display
const getTipoContrato = contrato => {
  const tipos = [];
  if (contrato.hasCPAContract || contrato.temCPA) {
    tipos.push('CPA');
  }
  if (contrato.hasSHContract || contrato.temPSO) {
    tipos.push('S&H');
  }
  return tipos.length > 0 ? tipos.join(' + ') : contrato.planoContrato || 'N/A';
};

const getTipoClass = contrato => {
  if (contrato.hasCPAContract && contrato.hasSHContract) return 'tipo-both';
  if (contrato.hasCPAContract || contrato.temCPA) return 'tipo-cpa';
  if (contrato.hasSHContract || contrato.temPSO) return 'tipo-sh';
  return 'tipo-default';
};

const hasCPAContract = contrato => {
  return (
    (contrato.hasCPAContract || contrato.temCPA) &&
    (contrato.fimContratoCPA || contrato.inicioContratoCPA)
  );
};

const hasSHContract = contrato => {
  return (
    (contrato.hasSHContract || contrato.temPSO) &&
    (contrato.fimContratoSH || contrato.inicioContratoSH)
  );
};

// Helper function to calculate expiration date from start date and payment frequency
const calculateExpirationFromStart = (startDateString, modalidadePagamento) => {
  if (!startDateString) return null;

  try {
    const startDate = new Date(startDateString);
    if (isNaN(startDate.getTime())) return null;

    const expiration = new Date(startDate);

    switch (modalidadePagamento?.toUpperCase()) {
      case 'MENSAL':
        expiration.setMonth(expiration.getMonth() + 1);
        break;
      case 'TRIMESTRAL':
        expiration.setMonth(expiration.getMonth() + 3);
        break;
      case 'ANUAL':
        expiration.setFullYear(expiration.getFullYear() + 1);
        break;
      default:
        // Default to 1 year if payment frequency is not specified
        expiration.setFullYear(expiration.getFullYear() + 1);
    }

    return expiration;
  } catch {
    return null;
  }
};

// Get expiration date for CPA contract (fimContratoCPA or calculated from inicioContratoCPA)
const getCPAExpirationDate = contrato => {
  if (contrato.fimContratoCPA) {
    return new Date(contrato.fimContratoCPA);
  } else if (contrato.inicioContratoCPA) {
    return calculateExpirationFromStart(
      contrato.inicioContratoCPA,
      contrato.modalidadePagamentoCPA
    );
  }
  return null;
};

// Get expiration date for S&H contract (fimContratoSH or calculated from inicioContratoSH)
const getSHExpirationDate = contrato => {
  if (contrato.fimContratoSH) {
    return new Date(contrato.fimContratoSH);
  } else if (contrato.inicioContratoSH) {
    return calculateExpirationFromStart(contrato.inicioContratoSH, contrato.modalidadePagamentoSH);
  }
  return null;
};

const formatExpirationDate = date => {
  if (!date || isNaN(date.getTime())) return 'Sem data';

  try {
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return 'Data inválida';
  }
};

const getExpirationMonthForDate = date => {
  if (!date || isNaN(date.getTime())) return null;
  return date.getMonth() + 1;
};

const getExpirationClassForDate = date => {
  if (!date || isNaN(date.getTime())) return '';

  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return 'expired';
  } else if (year === currentYear && month === currentMonth) {
    return 'expiring-this-month';
  } else if (year === currentYear && month === currentMonth + 1) {
    return 'expiring-next-month';
  }
  return '';
};

const getFrequenciaPagamento = contrato => {
  const frequencias = [];
  if (contrato.modalidadePagamentoCPA) {
    frequencias.push(contrato.modalidadePagamentoCPA);
  }
  if (contrato.modalidadePagamentoSH) {
    frequencias.push(contrato.modalidadePagamentoSH);
  }
  return frequencias.length > 0 ? frequencias.join(' / ') : '';
};

const getMonthName = monthNum => {
  const month = months.find(m => parseInt(m.value) === monthNum);
  return month ? month.label : '';
};

const navigateToDetail = contrato => {
  const year = contrato.year || selectedYear.value;
  router.push(`/contratos/${contrato.id}?year=${year}`);
};

const showActions = contrato => {
  selectedContratoForActions.value = contrato;
  showActionsModal.value = true;
};

const closeActions = () => {
  showActionsModal.value = false;
  selectedContratoForActions.value = null;
};

const viewContrato = () => {
  if (selectedContratoForActions.value) {
    navigateToDetail(selectedContratoForActions.value);
  }
  closeActions();
};

const editContrato = () => {
  if (selectedContratoForActions.value) {
    const year = selectedContratoForActions.value.year || selectedYear.value;
    router.push(`/contratos/${selectedContratoForActions.value.id}/edit?year=${year}`);
  }
  closeActions();
};

const deleteContrato = async () => {
  if (
    selectedContratoForActions.value &&
    confirm('Tem certeza que deseja eliminar este contrato?')
  ) {
    try {
      const year = selectedContratoForActions.value.year || selectedYear.value;
      await deleteContratoFromStore(year, selectedContratoForActions.value.id);
      closeActions();
      // Refresh data after deletion
      await refreshData();
    } catch (err) {
      console.error('Error deleting contrato:', err);
      // Error is already handled by the store
    }
  }
};

const formatDate = dateString => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('pt-PT');
};

const navigateToCreate = () => {
  router.push('/gestor-contratos/new?from=list');
};

// Lifecycle
onMounted(async () => {
  await Promise.all([fetchAvailableYears(), fetchContratosForYear(selectedYear.value)]);
});

// Watchers
watch(currentYear, newYear => {
  selectedYear.value = newYear;
});
</script>

<style scoped>
.contratos-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  background: #f5f5f5;
  min-height: 100vh;
}

.contratos-header {
  margin-bottom: 1rem;
}

.list-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-control {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.btn-refresh {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-refresh:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
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
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(117, 174, 147, 0.2);
}

.search-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 1.1rem;
}

.loading-state {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

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

.contracts-title {
  margin-bottom: 1rem;
}

.contracts-title h2 {
  color: #2c3e50;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
}

.contratos-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.contrato-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.contrato-item:last-child {
  border-bottom: none;
}

.contrato-item:hover {
  background-color: #f8f9fa;
}

.contrato-main {
  flex: 1;
}

.contrato-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.contrato-header h3 {
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
}

.contrato-id {
  font-size: 0.75rem;
  color: #888;
  background: #f0f0f0;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  white-space: nowrap;
  margin-left: 0.5rem;
}

.contrato-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.info-label {
  font-weight: 600;
  color: #666;
  min-width: 70px;
  flex-shrink: 0;
}

.info-value {
  color: #333;
  flex: 1;
}

.tipo-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.tipo-badge.tipo-cpa {
  background: #d4edda;
  color: #155724;
}

.tipo-badge.tipo-sh {
  background: #cce5ff;
  color: #004085;
}

.tipo-badge.tipo-both {
  background: linear-gradient(135deg, #d4edda 0%, #cce5ff 100%);
  color: #004085;
}

.tipo-badge.tipo-default {
  background: #f8f9fa;
  color: #6c757d;
}

.month-indicator {
  color: #666;
  font-size: 0.8rem;
  margin-left: 0.25rem;
}

.expired {
  color: #e74c3c;
  font-weight: 600;
}

.expiring-this-month {
  color: #f39c12;
  font-weight: 600;
}

.expiring-next-month {
  color: #3498db;
  font-weight: 600;
}

.expiration-dates {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.expiration-date-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.expiration-label {
  font-weight: 600;
  color: #666;
  min-width: 40px;
}

.no-date {
  color: #999;
  font-style: italic;
}

.calculated-badge {
  color: #666;
  font-size: 0.75rem;
  margin-left: 0.25rem;
  font-weight: 600;
}

.contrato-actions {
  display: flex;
  align-items: center;
}

.action-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: #e9ecef;
  color: #333;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty-state h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.empty-state p {
  margin-bottom: 1.5rem;
}

.search-info {
  background: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #1976d2;
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
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.actions-modal {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 280px;
  max-width: 90vw;
}

.actions-modal h3 {
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  text-align: center;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modal-btn {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.view-btn {
  background: var(--primary-color);
  color: white;
}

.view-btn:hover {
  background: var(--primary-hover);
}

.edit-btn {
  background: #f39c12;
  color: white;
}

.edit-btn:hover {
  background: #e67e22;
}

.delete-btn {
  background: #e74c3c;
  color: white;
}

.delete-btn:hover {
  background: #c0392b;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .contratos-container {
    padding: 0.5rem;
  }

  .list-controls {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .search-section {
    gap: 0.75rem;
  }

  .month-filter-container {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .month-filter-label {
    font-size: 0.85rem;
  }

  .contrato-item {
    padding: 0.75rem;
  }

  .contrato-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .contrato-header h3 {
    font-size: 0.9rem;
  }

  .contrato-id {
    margin-left: 0;
    align-self: flex-start;
  }

  .info-row {
    font-size: 0.8rem;
    flex-wrap: wrap;
  }

  .info-label {
    min-width: auto;
  }

  .actions-modal {
    padding: 1rem;
    min-width: 260px;
  }
}

@media (max-width: 480px) {
  .contracts-title h2 {
    font-size: 1.1rem;
  }

  .contrato-item {
    padding: 0.5rem;
  }

  .modal-btn {
    padding: 0.6rem 0.8rem;
    font-size: 0.85rem;
  }
}

/* Floating Action Button */
.fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 56px;
  height: 56px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  z-index: 1000;
}

.fab:hover {
  background: var(--primary-hover);
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .fab {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 48px;
    height: 48px;
    font-size: 1.3rem;
  }
}
</style>

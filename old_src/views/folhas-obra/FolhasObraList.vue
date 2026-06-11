<template>
  <div class="folhas-obra-container">
    <div class="folhas-obra-header">
      <BackButton
        to="/folhas-obra"
        variant="inline"
      />
    </div>

    <!-- Controls -->
    <div class="list-controls">
      <div class="controls-header">
        <h2>Folhas de Obra {{ selectedYear }} ({{ displayedFolhas.length }})</h2>
      </div>

      <div class="controls-actions">
        <!-- Year selector -->
        <div class="year-selector-container">
          <YearSelector
            v-model="selectedYear"
            :years="availableYears"
            @change="onYearChange"
          />
        </div>

        <button
          :disabled="loading"
          class="btn btn-refresh"
          @click="refreshData"
        >
          🔄 Atualizar
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="search-container">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Pesquisar por cliente, número..."
        class="search-input"
        @input="onSearchInput"
      >
      <span class="search-icon">🔍</span>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="loading-state"
    >
      <p>A carregar folhas de obra...</p>
    </div>

    <!-- Error State -->
    <div
      v-if="error"
      class="error-alert"
    >
      <p>{{ error }}</p>
      <button
        class="close-btn"
        @click="clearError"
      >
        ×
      </button>
    </div>

    <!-- Folhas de Obra List -->
    <div
      v-if="!loading && displayedFolhas.length > 0"
      class="folhas-obra-list"
    >
      <div
        v-for="folha in displayedFolhas"
        :key="`${folha.year || selectedYear}-${folha.id}`"
        class="folha-item"
        @click="viewFolhaDetail(folha)"
      >
        <div class="folha-main">
          <h3>{{ folha.clientName }}</h3>
          <div class="folha-meta">
            <span class="folha-number">{{ folha.number }}</span>
            <span class="folha-date">{{ formatDate(folha.date) }}</span>
          </div>
          <div
            v-if="folha.request?.reason || folha.otherData?.technician"
            class="folha-details"
          >
            <span
              v-if="folha.request?.reason"
              class="folha-reason"
            >{{
              folha.request.reason
            }}</span>
            <span
              v-if="folha.otherData?.technician"
              class="folha-technician"
            >👨‍🔧 {{ folha.otherData.technician }}</span>
          </div>
          <div
            v-if="isSearching && folha.year"
            class="folha-year"
          >
            <span>Ano: {{ folha.year }}</span>
          </div>
        </div>
        <div class="folha-actions">
          <button
            class="action-btn"
            @click.stop="showActions(folha)"
          >
            ⋮
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!loading && displayedFolhas.length === 0"
      class="empty-state"
    >
      <h3>Nenhuma folha de obra encontrada</h3>
      <p v-if="searchQuery">
        Não foram encontradas folhas de obra com o termo "{{ searchQuery }}".
      </p>
      <p v-else>
        Não há folhas de obra para o ano {{ selectedYear }}.
      </p>
    </div>

    <!-- Search Results Info -->
    <div
      v-if="searchResults && searchQuery"
      class="search-info"
    >
      <p>
        {{ searchResults.count }} resultado(s) encontrado(s) para "{{ searchQuery }}"
        {{ searchYear ? `no ano ${searchYear}` : 'em todos os anos' }}
      </p>
    </div>

    <!-- Actions Modal -->
    <div
      v-if="showActionsModal"
      class="actions-modal-overlay"
      @click="closeActions"
    >
      <div
        class="actions-modal"
        @click.stop
      >
        <h3>{{ selectedFolhaForActions?.clientName }}</h3>
        <div class="modal-actions">
          <button
            class="modal-btn view-btn"
            @click="viewFolha"
          >
            📋 Ver Detalhes
          </button>
          <button
            class="modal-btn edit-btn"
            @click="editFolha"
          >
            ✏️ Editar
          </button>
          <button
            class="modal-btn delete-btn"
            @click="deleteFolhaAction"
          >
            🗑️ Eliminar
          </button>
        </div>
        <button
          class="modal-btn cancel-btn"
          @click="closeActions"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import BackButton from '@/components/BackButton.vue';
import YearSelector from '@/components/YearSelector.vue';
import { useFolhasObraStore } from '@/stores/folhas-obra.js';

// Router
const router = useRouter();

// Store
const store = useFolhasObraStore();
const { folhas, currentYear, availableYears, loading, error } = storeToRefs(store);

const {
  fetchFolhasForYear,
  fetchAvailableYears,
  searchFolhas,
  clearError,
  setCurrentYear,
  getYearFromDate,
} = store;

// Local reactive state
const selectedYear = ref(currentYear.value);
const searchQuery = ref('');
const searchResults = ref([]);
const isSearching = ref(false);
const searchTimeout = ref(null);
const showActionsModal = ref(false);
const selectedFolhaForActions = ref(null);

// Computed
const displayedFolhas = computed(() => {
  return isSearching.value ? searchResults.value : folhas.value;
});

// Methods
const viewFolhaDetail = folha => {
  const year = folha.year || selectedYear.value;
  router.push(`/folhas-obra/${folha.id}?year=${year}`);
};

const formatDate = dateString => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const showActions = folha => {
  selectedFolhaForActions.value = folha;
  showActionsModal.value = true;
};

const closeActions = () => {
  showActionsModal.value = false;
  selectedFolhaForActions.value = null;
};

const viewFolha = () => {
  if (selectedFolhaForActions.value) {
    viewFolhaDetail(selectedFolhaForActions.value);
  }
  closeActions();
};

const editFolha = () => {
  if (selectedFolhaForActions.value) {
    const year = selectedFolhaForActions.value.year || selectedYear.value;
    router.push(`/folhas-obra/${selectedFolhaForActions.value.id}/edit?year=${year}`);
  }
  closeActions();
};

const deleteFolhaAction = async () => {
  if (!selectedFolhaForActions.value) return;

  const confirmed = confirm(
    `Tem a certeza que deseja eliminar a folha de obra "${selectedFolhaForActions.value.number}"?`
  );

  if (confirmed) {
    try {
      const year = selectedFolhaForActions.value.year || selectedYear.value;
      await store.deleteFolha(year, selectedFolhaForActions.value.id);
      closeActions();
    } catch (err) {
      console.error('Error deleting folha:', err);
    }
  }
};

const onYearChange = () => {
  if (searchQuery.value) {
    clearSearch();
  }
  setCurrentYear(selectedYear.value);
  fetchFolhasForYear(selectedYear.value);
};

const refreshData = () => {
  if (isSearching.value) {
    performSearch();
  } else {
    fetchFolhasForYear(selectedYear.value);
  }
};

const onSearchInput = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  if (searchQuery.value.trim()) {
    searchTimeout.value = setTimeout(() => {
      performSearch();
    }, 300); // Debounce search
  } else {
    clearSearch();
  }
};

const performSearch = async () => {
  if (!searchQuery.value.trim()) return;

  isSearching.value = true;
  try {
    const result = await searchFolhas(searchQuery.value.trim());
    searchResults.value = result.results || [];
  } catch (err) {
    console.error('Search failed:', err);
    searchResults.value = [];
  }
};

const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
  isSearching.value = false;
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
};

// Lifecycle
onMounted(async () => {
  // Fetch available years first
  await fetchAvailableYears();

  // If current year is not in available years, use the latest year
  if (
    availableYears.value.length > 0 &&
    !availableYears.value.includes(selectedYear.value.toString())
  ) {
    selectedYear.value = parseInt(availableYears.value[availableYears.value.length - 1]);
    setCurrentYear(selectedYear.value);
  }

  // Fetch folhas for selected year
  await fetchFolhasForYear(selectedYear.value);
});

// Watchers
watch(currentYear, newYear => {
  selectedYear.value = newYear;
});
</script>

<style scoped>
.folhas-obra-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  background: #f5f5f5;
  min-height: 100vh;
  position: relative;
}

.folhas-obra-header {
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
  flex-wrap: wrap;
  gap: 1rem;
}

.controls-header h2 {
  color: #2c3e50;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
}

.controls-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.year-selector-container {
  position: relative;
  flex-shrink: 0;
}

.search-container {
  position: relative;
  margin-bottom: 1rem;
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

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn.btn-refresh {
  background: var(--primary-color);
  color: white;
}

.btn.btn-refresh:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.btn.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
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

.retry-btn {
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.retry-btn:hover {
  background: #c82333;
}

.results-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.results-header {
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.results-header h2 {
  color: #2c3e50;
  margin: 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.count {
  color: #666;
  font-weight: 400;
  font-size: 1rem;
}

.folhas-obra-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.folha-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.folha-item:last-child {
  border-bottom: none;
}

.folha-item:hover {
  background-color: #f8f9fa;
}

.folha-main {
  flex: 1;
}

.folha-main h3 {
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.folha-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.folha-number {
  color: var(--primary-color);
  font-weight: 600;
}

.folha-date {
  color: #888;
}

.folha-details {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #666;
}

.folha-reason {
  font-weight: 500;
}

.folha-technician {
  color: #888;
}

.folha-year {
  color: #e67e22;
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
}

.folha-actions {
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

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .folhas-obra-container {
    padding: 0.5rem;
  }

  .list-controls {
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .controls-header h2 {
    font-size: 1.25rem;
    margin-bottom: 0.75rem;
  }

  .controls-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .year-selector-container {
    width: 100%;
    display: flex;
    justify-content: flex-start;
  }

  .btn.btn-refresh {
    width: 100%;
    justify-content: center;
  }

  .search-input {
    padding: 0.65rem 2.25rem 0.65rem 0.875rem;
    font-size: 0.85rem;
  }

  .search-icon {
    right: 0.75rem;
  }

  .folha-item {
    padding: 1rem;
  }

  .folha-main h3 {
    font-size: 0.95rem;
  }

  .folha-meta span {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .folhas-obra-container {
    padding: 0.25rem;
  }

  .list-controls {
    padding: 0.75rem;
  }

  .controls-header h2 {
    font-size: 1.1rem;
  }

  .controls-actions {
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .search-input {
    padding: 0.6rem 2rem 0.6rem 0.75rem;
    font-size: 0.8rem;
  }

  .search-icon {
    right: 0.65rem;
  }

  .folha-item {
    padding: 0.75rem;
  }

  .folha-main h3 {
    font-size: 0.9rem;
  }

  .folha-meta span {
    font-size: 0.75rem;
  }

  .btn.btn-refresh {
    padding: 0.65rem;
    font-size: 0.85rem;
  }
}
</style>

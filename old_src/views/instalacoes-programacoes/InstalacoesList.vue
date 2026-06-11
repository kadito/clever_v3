<template>
  <div class="instalacoes-list">
    <!-- Header -->
    <div class="list-header">
      <div class="header-top">
        <BackButton
          to="/instalacoes-programacoes"
          variant="inline"
        />
        <h1>Lista de Instalações</h1>
      </div>

      <!-- Controls -->
      <div class="list-controls">
        <!-- Year Selector -->
        <YearSelector
          :available-years="instalacoesStore.availableYears"
          :current-year="instalacoesStore.currentYear"
          @year-changed="handleYearChange"
        />

        <!-- Search -->
        <div class="search-container">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Pesquisar por cliente, equipamento, técnico..."
            class="search-input"
            @input="handleSearch"
          >
          <button
            v-if="searchQuery"
            class="clear-search"
            @click="clearSearch"
          >
            ✕
          </button>
        </div>

        <!-- Add Button -->
        <router-link
          :to="{ name: 'instalacao-form' }"
          class="btn btn-success"
        >
          ➕ Nova Instalação
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="instalacoesStore.loading"
      class="loading"
    >
      Carregando instalações...
    </div>

    <!-- Error State -->
    <div
      v-else-if="instalacoesStore.error"
      class="error"
    >
      Erro: {{ instalacoesStore.error }}
      <button
        class="btn btn-primary btn-sm"
        @click="retry"
      >
        Tentar novamente
      </button>
    </div>

    <!-- Search Results -->
    <div
      v-else-if="isSearching && searchResults.length > 0"
      class="search-results"
    >
      <h3>Resultados da pesquisa "{{ searchQuery }}" ({{ searchResults.length }})</h3>
      <div class="instalacoes-grid">
        <div
          v-for="instalacao in searchResults"
          :key="`search-${instalacao.id}-${instalacao.year || instalacoesStore.currentYear}`"
          class="instalacao-card"
          @click="navigateToDetail(instalacao)"
        >
          <InstallationCard
            :instalacao="instalacao"
            :show-year="!searchYear"
          />
        </div>
      </div>
    </div>

    <!-- No Search Results -->
    <div
      v-else-if="isSearching && searchResults.length === 0"
      class="no-data"
    >
      Nenhuma instalação encontrada para "{{ searchQuery }}".
    </div>

    <!-- Regular List -->
    <div
      v-else-if="instalacoesStore.instalacoes.length > 0"
      class="instalacoes-container"
    >
      <div class="list-info">
        <p>
          {{ instalacoesStore.getInstalacoesCount }} instalações em
          {{ instalacoesStore.currentYear }}
        </p>
      </div>

      <div class="instalacoes-grid">
        <div
          v-for="instalacao in instalacoesStore.instalacoes"
          :key="instalacao.id"
          class="instalacao-card"
          @click="navigateToDetail(instalacao)"
        >
          <InstallationCard :instalacao="instalacao" />
        </div>
      </div>
    </div>

    <!-- No Data -->
    <div
      v-else
      class="no-data"
    >
      <div class="no-data-content">
        <div class="no-data-icon">
          📦
        </div>
        <h3>Nenhuma instalação encontrada</h3>
        <p>Não existem instalações registadas para o ano {{ instalacoesStore.currentYear }}.</p>
        <router-link
          :to="{ name: 'instalacao-form' }"
          class="btn btn-success"
        >
          ➕ Criar primeira instalação
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useInstalacoesStore } from '@/stores/instalacoes-programacoes';
import BackButton from '@/components/BackButton.vue';
import YearSelector from '@/components/YearSelector.vue';

// Components
const InstallationCard = {
  props: {
    instalacao: Object,
    showYear: {
      type: Boolean,
      default: false,
    },
  },
  template: `
    <div class="card-content">
      <div class="card-header">
        <h3>{{ instalacao.nomeCliente }}</h3>
        <span class="status-badge" :class="getStatusClass(instalacao)">
          {{ getStatusText(instalacao) }}
        </span>
      </div>
      
      <div class="card-body">
        <div class="info-row">
          <span class="label">Encomenda:</span>
          <span class="value">{{ instalacao.numeroEncomenda || 'N/A' }}</span>
        </div>
        <div class="info-row">
          <span class="label">Data Instalação:</span>
          <span class="value">{{ formatDate(instalacao.dataInstalacao) }}</span>
        </div>
        <div v-if="instalacao.equipamento" class="info-row">
          <span class="label">Equipamento:</span>
          <span class="value">{{ instalacao.equipamento }}</span>
        </div>
        <div v-if="instalacao.programadoPor" class="info-row">
          <span class="label">Programado por:</span>
          <span class="value">{{ instalacao.programadoPor }}</span>
        </div>
        <div v-if="showYear" class="info-row">
          <span class="label">Ano:</span>
          <span class="value">{{ instalacao.year }}</span>
        </div>
      </div>
      
      <div class="card-footer">
        <div class="features">
          <span v-if="instalacao.instalacaoCameras" class="feature-tag">📹 Câmaras</span>
          <span v-if="instalacao.instalacaoPosECpa" class="feature-tag">💳 POS/CPA</span>
          <span v-if="instalacao.programado" class="feature-tag">⚙️ Programado</span>
          <span v-if="instalacao.formacao" class="feature-tag">🎓 Formação</span>
        </div>
      </div>
    </div>
  `,
  setup(props) {
    const instalacoesStore = useInstalacoesStore();

    const getStatusClass = instalacao => {
      const status = instalacoesStore.getInstallationStatus(instalacao);
      switch (status) {
        case 'completed':
          return 'status-completed';
        case 'in-progress':
          return 'status-in-progress';
        default:
          return 'status-not-started';
      }
    };

    const getStatusText = instalacao => {
      if (instalacao.dataFinalInstalacao) {
        return 'Concluída';
      } else if (instalacao.dataInstalacao) {
        return 'Em Progresso';
      }
      return 'Agendada';
    };

    const formatDate = dateString => {
      return instalacoesStore.formatDate(dateString);
    };

    return {
      getStatusClass,
      getStatusText,
      formatDate,
    };
  },
};

// Router
const router = useRouter();

// Store
const instalacoesStore = useInstalacoesStore();

// Reactive data
const searchQuery = ref('');
const searchResults = ref([]);
const isSearching = ref(false);
const searchTimeout = ref(null);

// Computed
const searchYear = computed(() => {
  return searchQuery.value ? instalacoesStore.currentYear : null;
});

// Methods
const handleYearChange = async year => {
  instalacoesStore.setCurrentYear(year);
  clearSearch();
  await loadInstalacoes();
};

const handleSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  searchTimeout.value = setTimeout(async () => {
    if (searchQuery.value.trim().length >= 2) {
      await performSearch();
    } else {
      clearSearch();
    }
  }, 300);
};

const performSearch = async () => {
  try {
    isSearching.value = true;
    const results = await instalacoesStore.searchInstalacoes(
      searchQuery.value,
      instalacoesStore.currentYear
    );
    searchResults.value = results.results || [];
  } catch (error) {
    console.error('Search error:', error);
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

const navigateToDetail = instalacao => {
  const year =
    instalacao.year ||
    instalacoesStore.getYearFromDate(instalacao.dataInstalacao || instalacao.createdAt);
  router.push({
    name: 'instalacao-detail',
    params: { year, id: instalacao.id },
  });
};

const loadInstalacoes = async () => {
  try {
    await instalacoesStore.fetchInstalacoesForYear(instalacoesStore.currentYear);
  } catch (error) {
    console.error('Error loading instalacoes:', error);
  }
};

const retry = async () => {
  instalacoesStore.clearError();
  await loadInstalacoes();
};

// Lifecycle
onMounted(async () => {
  try {
    await instalacoesStore.fetchAvailableYears();
    await loadInstalacoes();
  } catch (error) {
    console.error('Error loading instalacoes list:', error);
  }
});

// Watch for year changes
watch(
  () => instalacoesStore.currentYear,
  () => {
    clearSearch();
  }
);
</script>

<style scoped>
.instalacoes-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.list-header {
  margin-bottom: 2rem;
}

.header-top {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.header-top h1 {
  color: #2c3e50;
  margin: 0;
  font-size: 1.8rem;
}

.list-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-container {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.clear-search {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  font-size: 1rem;
  padding: 0.25rem;
}

.btn {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  white-space: nowrap;
}

.btn-success {
  background: var(--primary-color);
  color: white;
}

.btn-success:hover {
  background: var(--primary-hover);
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
}

.loading,
.error,
.no-data {
  text-align: center;
  padding: 3rem 1rem;
  color: #7f8c8d;
}

.error {
  color: #e74c3c;
}

.search-results h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.list-info {
  margin-bottom: 1rem;
  color: #7f8c8d;
}

.instalacoes-container {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.instalacoes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

.instalacao-card {
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.instalacao-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.card-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
  flex: 1;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-completed {
  background: #d4edda;
  color: #155724;
}

.status-in-progress {
  background: #fff3cd;
  color: #856404;
}

.status-not-started {
  background: #f8d7da;
  color: #721c24;
}

.card-body {
  margin-bottom: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.label {
  color: #7f8c8d;
  font-weight: 500;
}

.value {
  color: #2c3e50;
  text-align: right;
  flex: 1;
  margin-left: 1rem;
}

.card-footer {
  padding-top: 1rem;
  border-top: 1px solid #ecf0f1;
}

.features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.feature-tag {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.no-data-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.no-data-icon {
  font-size: 3rem;
  opacity: 0.5;
}

.no-data-content h3 {
  color: #2c3e50;
  margin: 0;
}

/* Mobile styles */
@media (max-width: 768px) {
  .header-top {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-top h1 {
    font-size: 1.5rem;
  }

  .list-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .search-container {
    min-width: auto;
  }

  .instalacoes-grid {
    grid-template-columns: 1fr;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .info-row {
    flex-direction: column;
    gap: 0.25rem;
  }

  .value {
    text-align: left;
    margin-left: 0;
  }
}

@media (max-width: 480px) {
  .instalacoes-list {
    padding: 0.75rem;
  }

  .instalacoes-container {
    padding: 1rem;
  }

  .instalacao-card {
    padding: 0.75rem;
  }
}
</style>

<template>
  <div class="list-container">
    <div class="list-header">
      <BackButton to="/equipamento-usado" />
      <h1>📦 Equipamentos</h1>
    </div>

    <!-- Controls -->
    <div class="controls">
      <YearSelector 
        :years="availableYears" 
        :current-year="currentYear"
        @year-changed="handleYearChange"
      />
      
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery"
          @input="handleSearch"
          placeholder="Pesquisar por tipo, marca, modelo, série..."
          class="search-input"
        >
        <div class="search-icon">🔍</div>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button 
        @click="activeFilter = 'todos'"
        :class="{ active: activeFilter === 'todos' }"
        class="filter-tab"
      >
        Todos ({{ filteredEquipamentos.length }})
      </button>
      <button 
        @click="activeFilter = 'disponivel'"
        :class="{ active: activeFilter === 'disponivel' }"
        class="filter-tab disponivel"
      >
        Disponíveis ({{ getEquipamentosByStatus.disponivel.length }})
      </button>
      <button 
        @click="activeFilter = 'emprestado'"
        :class="{ active: activeFilter === 'emprestado' }"
        class="filter-tab emprestado"
      >
        Emprestados ({{ getEquipamentosByStatus.emprestado.length }})
      </button>
      <button 
        @click="activeFilter = 'manutencao'"
        :class="{ active: activeFilter === 'manutencao' }"
        class="filter-tab manutencao"
      >
        Manutenção ({{ getEquipamentosByStatus.manutencao.length }})
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <p>A carregar equipamentos...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-alert">
      <p>{{ error }}</p>
      <button @click="clearError" class="close-btn">×</button>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && displayedEquipamentos.length === 0" class="empty-state">
      <div class="empty-icon">📦</div>
      <h3>{{ searchQuery ? 'Nenhum equipamento encontrado' : 'Nenhum equipamento registado' }}</h3>
      <p v-if="searchQuery">
        Tente ajustar os termos de pesquisa ou selecionar um ano diferente.
      </p>
      <p v-else>
        Comece por adicionar o primeiro equipamento ao sistema.
      </p>
      <router-link to="/equipamento-usado/new" class="btn btn-primary">
        ➕ Adicionar Equipamento
      </router-link>
    </div>

    <!-- Equipment Cards -->
    <div v-else class="equipment-grid">
      <div 
        v-for="equipamento in displayedEquipamentos" 
        :key="equipamento.id"
        class="equipment-card"
        @click="goToDetail(equipamento)"
      >
        <div class="card-header">
          <div class="equipment-title">
            <h3>{{ getEquipamentoSummary(equipamento) }}</h3>
            <div class="equipment-serial" v-if="equipamento.numeroSerie">
              Série: {{ equipamento.numeroSerie }}
            </div>
          </div>
          <div class="status-badge" :class="getEquipamentoStatus(equipamento).status">
            {{ getEquipamentoStatus(equipamento).label }}
          </div>
        </div>

        <div class="card-content">
          <div class="equipment-info">
            <div class="info-row" v-if="equipamento.marca">
              <span class="label">Marca:</span>
              <span class="value">{{ equipamento.marca }}</span>
            </div>
            <div class="info-row" v-if="equipamento.modelo">
              <span class="label">Modelo:</span>
              <span class="value">{{ equipamento.modelo }}</span>
            </div>
            <div class="info-row">
              <span class="label">Estado Geral:</span>
              <span class="value">{{ equipamento.estadoGeral || 'Não especificado' }}</span>
            </div>
          </div>

          <!-- Loan Information -->
          <div v-if="isEquipamentoEmprestado(equipamento)" class="loan-info">
            <div class="loan-header">📤 Emprestado</div>
            <div class="info-row">
              <span class="label">Cliente:</span>
              <span class="value">{{ equipamento.clienteEmprestimo }}</span>
            </div>
            <div class="info-row">
              <span class="label">Desde:</span>
              <span class="value">{{ formatDate(equipamento.dataEmprestimo) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Dias:</span>
              <span class="value">{{ getDaysOnLoan(equipamento) }}</span>
            </div>
          </div>

          <!-- Last Review -->
          <div class="review-info">
            <div class="info-row">
              <span class="label">Última Revisão:</span>
              <span class="value">{{ formatDate(equipamento.dataRevisao) }}</span>
            </div>
            <div class="info-row" v-if="equipamento.tecnico">
              <span class="label">Técnico:</span>
              <span class="value">{{ equipamento.tecnico }}</span>
            </div>
          </div>
        </div>

        <div class="card-actions">
          <button 
            @click.stop="goToEdit(equipamento)"
            class="btn btn-edit"
          >
            ✏️ Editar
          </button>
          <button 
            @click.stop="goToDetail(equipamento)"
            class="btn btn-detail"
          >
            👁️ Ver Detalhes
          </button>
        </div>
      </div>
    </div>

    <!-- Add Button (Floating) -->
    <router-link 
      to="/equipamento-usado/new"
      class="fab"
      title="Adicionar Equipamento"
    >
      ➕
    </router-link>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import BackButton from '@/components/BackButton.vue'
import YearSelector from '@/components/YearSelector.vue'
import { useEquipamentoUsadoStore } from '@/stores/equipamento-usado'

const router = useRouter()
const equipamentoUsadoStore = useEquipamentoUsadoStore()

// State
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const activeFilter = ref('todos')

// Store refs
const { 
  equipamentos, 
  loading, 
  error, 
  currentYear, 
  availableYears,
  getEquipamentosByStatus
} = storeToRefs(equipamentoUsadoStore)

// Store actions
const { 
  fetchEquipamentosForYear,
  fetchAvailableYears,
  setCurrentYear,
  clearError,
  searchEquipamentos,
  getEquipamentoSummary,
  getEquipamentoStatus,
  isEquipamentoEmprestado,
  formatDate,
  getDaysOnLoan,
  getYearFromDate
} = equipamentoUsadoStore

// Computed
const filteredEquipamentos = computed(() => {
  if (isSearching.value && searchResults.value.length >= 0) {
    return searchResults.value
  }
  
  const baseEquipamentos = equipamentos.value
  
  switch (activeFilter.value) {
    case 'disponivel':
      return getEquipamentosByStatus.value.disponivel
    case 'emprestado':
      return getEquipamentosByStatus.value.emprestado
    case 'manutencao':
      return getEquipamentosByStatus.value.manutencao
    default:
      return baseEquipamentos
  }
})

const displayedEquipamentos = computed(() => {
  return filteredEquipamentos.value
})

// Methods
const handleYearChange = async (year) => {
  setCurrentYear(year)
  await fetchEquipamentosForYear(year)
  
  // Clear search when changing year
  if (searchQuery.value) {
    searchQuery.value = ''
    searchResults.value = []
    isSearching.value = false
  }
}

const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    isSearching.value = false
    return
  }
  
  isSearching.value = true
  try {
    const results = await searchEquipamentos(searchQuery.value, currentYear.value)
    searchResults.value = results
  } catch (err) {
    console.error('Search error:', err)
    searchResults.value = []
  }
}

const goToDetail = (equipamento) => {
  const year = getYearFromDate(equipamento.dataRevisao)
  router.push(`/equipamento-usado/${year}/${equipamento.id}`)
}

const goToEdit = (equipamento) => {
  const year = getYearFromDate(equipamento.dataRevisao)
  router.push(`/equipamento-usado/${year}/${equipamento.id}/edit?from=list`)
}

// Watchers
watch(searchQuery, (newQuery) => {
  if (!newQuery.trim()) {
    searchResults.value = []
    isSearching.value = false
  }
})

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchAvailableYears(),
    fetchEquipamentosForYear()
  ])
})
</script>

<style scoped>
.list-container {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 80px; /* Space for FAB */
}

.list-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.list-header h1 {
  margin: 0;
  color: var(--primary-dark);
  font-size: 1.8rem;
}

.controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.filter-tab:hover {
  background: #f8f9fa;
}

.filter-tab.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.filter-tab.disponivel.active {
  background: #28a745;
  border-color: #28a745;
}

.filter-tab.emprestado.active {
  background: #fd7e14;
  border-color: #fd7e14;
}

.filter-tab.manutencao.active {
  background: #dc3545;
  border-color: #dc3545;
}

.loading-state {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.error-alert {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #721c24;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6c757d;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 1rem 0;
  color: #495057;
}

.empty-state p {
  margin-bottom: 2rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.equipment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.equipment-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.equipment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-header {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.equipment-title h3 {
  margin: 0 0 0.5rem 0;
  color: var(--primary-dark);
  font-size: 1.1rem;
}

.equipment-serial {
  color: #6c757d;
  font-size: 0.85rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.disponivel {
  background: #d4edda;
  color: #155724;
}

.status-badge.emprestado {
  background: #fff3cd;
  color: #856404;
}

.status-badge.manutencao {
  background: #f8d7da;
  color: #721c24;
}

.card-content {
  padding: 1rem;
}

.equipment-info,
.loan-info,
.review-info {
  margin-bottom: 1rem;
}

.loan-info {
  background: #fff3cd;
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 4px solid #ffc107;
}

.loan-header {
  font-weight: 500;
  color: #856404;
  margin-bottom: 0.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.info-row:last-child {
  margin-bottom: 0;
}

.label {
  color: #6c757d;
  font-weight: 500;
}

.value {
  color: #2c3e50;
  text-align: right;
  flex: 1;
  margin-left: 1rem;
}

.card-actions {
  padding: 1rem;
  border-top: 1px solid #eee;
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex: 1;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-edit {
  background: #ffc107;
  color: #212529;
}

.btn-edit:hover {
  background: #e0a800;
}

.btn-detail {
  background: #6c757d;
  color: white;
}

.btn-detail:hover {
  background: #5a6268;
}

.fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 56px;
  height: 56px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  z-index: 1000;
}

.fab:hover {
  background: var(--primary-hover);
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .list-container {
    padding: 0.5rem;
    padding-bottom: 80px;
  }
  
  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .controls {
    flex-direction: column;
  }
  
  .search-box {
    min-width: auto;
  }
  
  .equipment-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .card-actions {
    flex-direction: column;
  }
  
  .fab {
    bottom: 1rem;
    right: 1rem;
  }
}
</style>

<template>
  <div class="registo-container">
    <div class="registo-header">
      <BackButton to="/registo-diario-atividade" variant="inline" />
    </div>

    <!-- Controls -->
    <div class="list-controls">
      <div class="controls-left">
        <h2>Registos {{ selectedYear }} ({{ displayedRegistros.length }})</h2>
      </div>
      
      <div class="controls-right">
        <YearSelector 
          v-model="selectedYear" 
          :years="availableYears"
          @change="handleYearChange"
        />
        
        <button @click="fetchData" :disabled="loading" class="btn btn-refresh">
          🔄 Atualizar
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="search-container">
      <input 
        type="text" 
        v-model="searchQuery" 
        @input="handleSearch"
        placeholder="Pesquisar registos..." 
        class="search-input"
      >
      <span class="search-icon">🔍</span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <p>A carregar registos...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-alert">
      <p>{{ error }}</p>
      <button @click="clearError" class="close-btn">×</button>
    </div>

    <!-- Registos List -->
    <div v-else-if="displayedRegistros.length > 0" class="registos-list">
      <div 
        v-for="registro in displayedRegistros" 
        :key="`${registro.year || selectedYear}-${registro.id}`"
        class="registro-item"
        @click="navigateToDetail(registro)"
      >
        <div class="registro-main">
          <div class="registro-header">
            <h3>{{ registro.cliente }}</h3>
            <span 
              class="registro-type-badge" 
              :class="{ 
                'interno': registro.internoOuExterno === 'INTERNO', 
                'externo': registro.internoOuExterno === 'EXTERNO' 
              }"
            >
              {{ registro.internoOuExterno || 'N/A' }}
            </span>
          </div>
          
          <div class="registro-info-grid">
            <div class="registro-info-item">
              <span class="info-icon">📅</span>
              <span class="info-label">Data:</span>
              <span class="info-value">{{ formatDateTime(registro.dataRegistro) }}</span>
            </div>
            
            <div v-if="registro.assunto" class="registro-info-item">
              <span class="info-icon">📋</span>
              <span class="info-label">Assunto:</span>
              <span class="info-value">{{ registro.assunto }}</span>
            </div>
            
            <div v-if="registro.totalHorasCalculado || registro.totalHoras" class="registro-info-item highlight">
              <span class="info-icon">⏱️</span>
              <span class="info-label">Horas:</span>
              <span class="info-value">{{ registro.totalHorasCalculado || registro.totalHoras }}</span>
            </div>
            
            <div v-if="registro.respRegisto" class="registro-info-item">
              <span class="info-icon">👤</span>
              <span class="info-label">Responsável:</span>
              <span class="info-value">{{ registro.respRegisto }}</span>
            </div>
          </div>
          
          <div v-if="getTotalClientsForRegistro(registro) > 1" class="registro-additional-info">
            <span class="additional-badge">
              +{{ getTotalClientsForRegistro(registro) - 1 }} cliente(s) adicional(is)
            </span>
          </div>
          
          <div v-if="searchResults && registro.year" class="registro-year-badge">
            Ano: {{ registro.year }}
          </div>
        </div>
        
        <div class="registro-actions">
          <button class="action-btn" @click.stop="showActions(registro)" aria-label="Mais ações">
            <span>⋮</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <h3>Nenhum registo encontrado</h3>
      <p v-if="searchQuery">
        Não foram encontrados registos com o termo "{{ searchQuery }}".
      </p>
      <p v-else>
        Não há registos para o ano {{ selectedYear }}.
      </p>
    </div>

    <!-- Search Results Info -->
    <div v-if="searchResults && searchQuery" class="search-info">
      <p>
        {{ searchResults.count || 0 }} resultado(s) encontrado(s) para "{{ searchQuery }}"
        {{ selectedYear ? `no ano ${selectedYear}` : 'em todos os anos' }}
      </p>
    </div>




    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button 
        @click="goToPage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="pagination-btn"
      >
        ← Anterior
      </button>
      
      <div class="pagination-info">
        Página {{ currentPage }} de {{ totalPages }} 
        ({{ displayedRegistros.length }} registos)
      </div>
      
      <button 
        @click="goToPage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="pagination-btn"
      >
        Próxima →
      </button>
    </div>

    <!-- Actions Modal -->
    <div v-if="showActionsModal" class="actions-modal-overlay" @click="closeActions">
      <div class="actions-modal" @click.stop>
        <h3>{{ selectedRegistroForActions?.cliente }}</h3>
        <div class="modal-actions">
          <button @click="viewRegistro(selectedRegistroForActions)" class="modal-btn view-btn">
            📋 Ver Detalhes
          </button>
          <button @click="editRegistro(selectedRegistroForActions)" class="modal-btn edit-btn">
            ✏️ Editar
          </button>
          <button @click="confirmDelete(selectedRegistroForActions); closeActions()" class="modal-btn delete-btn">
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
          Tem a certeza que pretende eliminar o registo de 
          <strong>{{ registroToDelete?.cliente }}</strong>?
        </p>
        <p class="warning-text">
          Esta ação não pode ser desfeita.
        </p>
        <div class="modal-actions">
          <button @click="cancelDelete" class="btn btn-secondary">
            Cancelar
          </button>
          <button @click="deleteRegistroAction" class="btn btn-danger" :disabled="loading">
            {{ loading ? 'A eliminar...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useRegistoDiarioAtividadeStore } from '@/stores/registo-diario-atividade'
import BackButton from '@/components/BackButton.vue'
import YearSelector from '@/components/YearSelector.vue'

// Router
const router = useRouter()
// Store
const store = useRegistoDiarioAtividadeStore()

// Reactive references from store
const { 
  registros, availableYears, currentYear, loading, error
} = storeToRefs(store)
const {
  fetchRegistrosForYear,
  fetchAvailableYears,
  searchRegistros,
  clearError,
  setCurrentYear,
  formatDateTime,
  formatDate,
  getTotalClientsForRegistro,
  getTotalHoursForRegistro,
  deleteRegistro
} = store

// Local state
const searchQuery = ref('')
const searchResults = ref(null)
const selectedYear = ref(currentYear.value)
const sortField = ref('dataRegistro')
const sortDirection = ref('desc')
const showActionsModal = ref(false)
const selectedRegistroForActions = ref(null)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const showDeleteModal = ref(false)
const registroToDelete = ref(null)

// Computed properties for display
const displayedRegistros = computed(() => {
  if (searchResults.value) {
    return searchResults.value.results || []
  }
  return sortedRegistros.value
})

const sortedRegistros = computed(() => {
  const sorted = [...registros.value].sort((a, b) => {
    let aValue = a[sortField.value]
    let bValue = b[sortField.value]
    
    // Handle dates
    if (sortField.value === 'dataRegistro') {
      aValue = new Date(aValue)
      bValue = new Date(bValue)
    }
    
    // Handle strings
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
    }
    if (typeof bValue === 'string') {
      bValue = bValue.toLowerCase()
    }
    
    if (aValue < bValue) {
      return sortDirection.value === 'asc' ? -1 : 1
    }
    if (aValue > bValue) {
      return sortDirection.value === 'asc' ? 1 : -1
    }
    return 0
  })
  
  return sorted
})

const totalPages = computed(() => {
  return Math.ceil(displayedRegistros.value.length / itemsPerPage.value)
})

const paginatedRegistros = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return displayedRegistros.value.slice(start, end)
})

const filteredInternosCount = computed(() => 
  displayedRegistros.value.filter(r => 
    r.internoOuExterno === 'INTERNO' || 
    r.interOuExter2 === 'INTERNO' || 
    r.interOuExter3 === 'INTERNO' ||
    r.interOuExter4 === 'INTERNO' ||
    r.interOuExter5 === 'INTERNO' ||
    r.interOuExter6 === 'INTERNO'
  ).length
)

const filteredExternosCount = computed(() => 
  displayedRegistros.value.filter(r => 
    r.internoOuExterno === 'EXTERNO' || 
    r.interOuExter2 === 'EXTERNO' || 
    r.interOuExter3 === 'EXTERNO' ||
    r.interOuExter4 === 'EXTERNO' ||
    r.interOuExter5 === 'EXTERNO' ||
    r.interOuExter6 === 'EXTERNO'
  ).length
)

const filteredTotalHours = computed(() => {
  let totalMinutes = 0
  
  displayedRegistros.value.forEach(registro => {
    const hoursFields = [
      registro.totalHoras, registro.totalHoras2, registro.totalHoras3,
      registro.totalHoras4, registro.totalHoras5, registro.totalHoras6
    ]
    
    hoursFields.forEach(hours => {
      if (hours && typeof hours === 'string') {
        const timeParts = hours.split(':')
        if (timeParts.length >= 2) {
          const h = parseInt(timeParts[0]) || 0
          const m = parseInt(timeParts[1]) || 0
          totalMinutes += (h * 60) + m
        }
      }
    })
  })
  
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}:${minutes.toString().padStart(2, '0')}`
})

// Methods
const handleYearChange = async (year) => {
  selectedYear.value = year
  setCurrentYear(year)
  clearSearch()
  currentPage.value = 1
  await fetchData()
}

const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    clearSearch()
    return
  }
  
  try {
    currentPage.value = 1
    const results = await searchRegistros(
      searchQuery.value.trim(), 
      selectedYear.value
    )
    searchResults.value = results
  } catch (error) {
    console.error('Search failed:', error)
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = null
  currentPage.value = 1
}

const showActions = (registro) => {
  selectedRegistroForActions.value = registro
  showActionsModal.value = true
}

const closeActions = () => {
  showActionsModal.value = false
  selectedRegistroForActions.value = null
}

const viewRegistro = (registro) => {
  navigateToDetail(registro)
  closeActions()
}

const editRegistro = (registro) => {
  const year = registro.year || selectedYear.value
  router.push(`/registo-diario-atividade/${year}/${registro.id}/edit?from=list`)
  closeActions()
}

const navigateToDetail = (registro) => {
  const year = registro.year || selectedYear.value
  router.push(`/registo-diario-atividade/${year}/${registro.id}`)
}


const sortBy = (field) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
  currentPage.value = 1
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const confirmDelete = (registro) => {
  registroToDelete.value = registro
  showDeleteModal.value = true
}

const cancelDelete = () => {
  registroToDelete.value = null
  showDeleteModal.value = false
}

const deleteRegistroAction = async () => {
  if (!registroToDelete.value) return
  
  try {
    await deleteRegistro(selectedYear.value, registroToDelete.value.id)
    cancelDelete()
    
    // Refresh data
    await fetchData()
    
    // Go to previous page if this page becomes empty
    if (paginatedRegistros.value.length === 0 && currentPage.value > 1) {
      currentPage.value -= 1
    }
  } catch (error) {
    console.error('Delete failed:', error)
  }
}

const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const fetchData = async () => {
  try {
    await Promise.all([
      fetchRegistrosForYear(selectedYear.value),
      fetchAvailableYears()
    ])
  } catch (error) {
    console.error('Failed to fetch data:', error)
  }
}

// Watchers
watch(() => currentYear.value, (newYear) => {
  selectedYear.value = newYear
})

watch(() => displayedRegistros.value.length, () => {
  // Reset to first page if current page becomes invalid
  if (currentPage.value > totalPages.value && totalPages.value > 0) {
    currentPage.value = 1
  }
})

// Lifecycle
onMounted(async () => {
  await fetchData()
})
</script>

<style scoped>
/* Include all the CSS from ContaCorrenteList.vue with similar responsive table/mobile cards pattern */
:root {
  --color-primary: var(--primary-color);
  --color-primary-dark: var(--primary-hover);
  --color-secondary: #34495e;
  --color-background: #ffffff;
  --color-background-elevated: #f8fafa;
  --color-background-muted: #f1f5f5;
  --color-text: #2c3e50;
  --color-text-muted: #7f8c8d;
  --color-border: #e1e8ed;
  --color-success: #27ae60;
  --color-success-light: #d5f5e3;
  --color-warning: #f39c12;
  --color-warning-light: #fdf2e3;
  --color-danger: #e74c3c;
  --color-danger-light: #fadbd8;
  --color-info: #3498db;
  --color-info-light: #d6eaf8;
}

.registo-diario-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: var(--color-background);
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--color-border);
}

.page-title {
  font-size: 2rem;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.page-description {
  color: var(--color-text-muted);
  font-size: 1rem;
  margin: 0;
}

.list-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--color-background-elevated);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.controls-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.controls-right {
  display: flex;
  gap: 0.75rem;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  max-width: 400px;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.search-button, .clear-search-button {
  padding: 0.75rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s ease;
}

.search-button:hover, .clear-search-button:hover {
  background: var(--color-primary-dark);
}

.clear-search-button {
  background: var(--color-danger);
  padding: 0.75rem;
}

.registo-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  background: #f5f5f5;
  min-height: 100vh;
}

.registo-header {
  margin-bottom: 1rem;
}

/* Registros List Styles */
.registos-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.registro-item {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  border: 1px solid var(--color-border);
}

.registro-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
  border-color: var(--color-primary);
}

.registro-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.registro-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.registro-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  flex: 1;
}

.registro-type-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.registro-type-badge.interno {
  background: var(--color-info-light);
  color: var(--color-info);
}

.registro-type-badge.externo {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.registro-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.registro-info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.registro-info-item.highlight {
  font-weight: 600;
}

.registro-info-item.highlight .info-value {
  color: var(--color-primary);
  font-size: 0.95rem;
}

.info-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.info-label {
  color: var(--color-text-muted);
  font-weight: 500;
  min-width: fit-content;
}

.info-value {
  color: var(--color-text);
  font-weight: 500;
}

.registro-additional-info {
  margin-top: 0.25rem;
}

.additional-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--color-background-muted);
  color: var(--color-text-muted);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.registro-year-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--color-background-elevated);
  color: var(--color-text-muted);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  width: fit-content;
}

.registro-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.action-btn {
  background: transparent;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: 1.25rem;
  line-height: 1;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.action-btn:hover {
  background: var(--color-background-muted);
  color: var(--color-text);
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
  border-color: var(--color-primary);
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

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: var(--color-background-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  transition: transform 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.summary-label {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.table-container {
  background: var(--color-background-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 2rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--color-text-muted);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 1rem 0;
  color: var(--color-text);
}

.empty-state p {
  margin: 0;
}

.empty-state a {
  color: var(--color-primary);
  text-decoration: none;
}

.empty-state a:hover {
  text-decoration: underline;
}

.registos-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.registos-table th,
.registos-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.registos-table th {
  background: var(--color-background-muted);
  font-weight: 600;
  color: var(--color-text);
  position: sticky;
  top: 0;
  z-index: 10;
}

.registos-table th.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
}

.registos-table th.sortable:hover {
  background: var(--color-border);
}

.sort-icon {
  margin-left: 0.5rem;
  font-weight: bold;
}

.registos-table tbody tr:hover {
  background: var(--color-background-muted);
}

.activity-type {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.activity-type.interno {
  background: var(--color-info-light);
  color: var(--color-info);
}

.activity-type.externo {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.875rem;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

.btn-danger {
  background: var(--color-danger);
  color: white;
  border-color: var(--color-danger);
}

.btn-danger:hover {
  background: #c0392b;
  border-color: #c0392b;
}

.btn-small {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
}

.mobile-cards {
  display: none;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--color-background-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.pagination-btn:disabled {
  background: var(--color-text-muted);
  cursor: not-allowed;
}

.pagination-info {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

/* Modal styles */
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
  width: 100%;
  margin-bottom: 0.5rem;
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

.modal-actions .btn {
  min-width: 100px;
  background: white;
  border: 1px solid #ddd;
}

.modal-actions .btn-secondary {
  background: #6c757d !important;
  color: white !important;
  border-color: #6c757d !important;
}

.modal-actions .btn-secondary:hover {
  background: #5a6268 !important;
  border-color: #5a6268 !important;
}

.modal-actions .btn-danger {
  background: #dc3545 !important;
  color: white !important;
  border-color: #dc3545 !important;
}

.modal-actions .btn-danger:hover {
  background: #c82333 !important;
  border-color: #c82333 !important;
}

.modal-actions .btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 1000;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
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
  .registo-container {
    padding: 0.5rem;
  }
  
  .list-controls {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .controls-left {
    flex-direction: column;
    align-items: stretch;
  }
  
  .controls-left h2 {
    font-size: 1.1rem;
  }
  
  .registro-item {
    flex-direction: column;
    padding: 1rem;
  }
  
  .registro-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .registro-info-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .registro-info-item {
    flex-wrap: wrap;
  }
  
  .registro-actions {
    align-self: flex-end;
  }
  
  .search-container {
    width: 100%;
    max-width: none;
  }
  
  .pagination {
    flex-direction: column;
    gap: 1rem;
  }
  
  .actions-modal {
    padding: 1rem;
    min-width: 260px;
  }
}
</style>

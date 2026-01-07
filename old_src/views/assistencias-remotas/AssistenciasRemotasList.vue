<template>
  <div class="assistencias-container">
    <div class="assistencias-header">
      <BackButton to="/assistencias-remotas" variant="inline" />
    </div>

    <!-- Controls -->
    <div class="list-controls">
      <div class="controls-left">
        <h2>Assistências Remotas {{ currentYear || 'Todos os anos' }} ({{ displayedAssistencias.length }})</h2>
      </div>
      
      <div class="controls-right">
        <!-- Year selector -->
        <YearSelector 
          v-model="currentYear" 
          :years="availableYears"
          :show-all-option="true"
          @change="onYearChange"
        />
        
        <button @click="refreshData" :disabled="loading" class="btn btn-refresh">
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
        placeholder="Pesquisar por cliente, número, técnico..." 
        class="search-input"
      >
      <span class="search-icon">🔍</span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <p>A carregar assistências...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-alert">
      <p>{{ error }}</p>
      <button @click="clearError" class="close-btn">×</button>
    </div>

    <!-- Assistencias List -->
    <div v-if="!loading && displayedAssistencias.length > 0" class="assistencias-list">
      <div 
        v-for="assistencia in displayedAssistencias" 
        :key="assistencia.id"
        class="assistencia-item"
        @click="navigateToDetail(assistencia)"
      >
        <div class="assistencia-main">
          <div class="assistencia-header-info">
            <h3>{{ assistencia.assistNumero }}</h3>
            <span class="assistencia-tipo" :class="getTipoClass(assistencia.tipoAssistencia)">
              {{ assistencia.tipoAssistencia }}
            </span>
          </div>
          
          <div class="assistencia-client">
            <span class="cliente-name">👤 {{ assistencia.cliente }}</span>
          </div>
          
          <div class="assistencia-meta">
            <span class="assistencia-data">📅 {{ formatDate(assistencia.dataAssistencia) }}</span>
            <span class="assistencia-tecnico">👨‍💻 {{ assistencia.tecnicoResponsavel }}</span>
          </div>
          
          <div class="assistencia-details" v-if="assistencia.motivoPedido">
            <p class="motivo">{{ assistencia.motivoPedido }}</p>
          </div>
          
          <div class="assistencia-status">
            <span v-if="assistencia.contrato" class="status-badge contract">Contrato</span>
            <span v-if="assistencia.garantia" class="status-badge warranty">Garantia</span>
            <span v-if="assistencia.valorAssist > 0" class="value-badge">€{{ assistencia.valorAssist.toFixed(2) }}</span>
          </div>
        </div>
        
        <div class="assistencia-actions">
          <button class="action-btn" @click.stop="showActions(assistencia)">
            ⋮
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && displayedAssistencias.length === 0" class="empty-state">
      <h3>Nenhuma assistência encontrada</h3>
      <p v-if="searchQuery">
        Não foram encontradas assistências com o termo "{{ searchQuery }}".
      </p>
      <p v-else-if="currentYear">
        Não há assistências cadastradas para o ano {{ currentYear }}.
      </p>
      <p v-else>
        Não há assistências cadastradas no sistema.
      </p>
      <button @click="navigateToCreate" class="btn btn-primary">
        ➕ Criar Nova Assistência
      </button>
    </div>

    <!-- Search Results Info -->
    <div v-if="searchResults && searchQuery" class="search-info">
      <p>
        {{ searchResults.count }} resultado(s) encontrado(s) para "{{ searchQuery }}"
      </p>
    </div>

    <!-- Actions Modal -->
    <div v-if="showActionsModal" class="actions-modal-overlay" @click="closeActions">
      <div class="actions-modal" @click.stop>
        <h3>{{ selectedAssistenciaForActions?.assistNumero }}</h3>
        <div class="modal-actions">
          <button @click="viewAssistencia" class="modal-btn view-btn">
            📋 Ver Detalhes
          </button>
          <button @click="editAssistencia" class="modal-btn edit-btn">
            ✏️ Editar
          </button>
          <button @click="deleteAssistenciaAction" class="modal-btn delete-btn">
            🗑️ Eliminar
          </button>
        </div>
        <button @click="closeActions" class="modal-btn cancel-btn">
          Cancelar
        </button>
      </div>
    </div>

    <!-- Floating Action Button -->
    <button @click="navigateToCreate" class="fab">
      ➕
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import BackButton from '@/components/BackButton.vue'
import YearSelector from '@/components/YearSelector.vue'
import { useAssistenciasRemotasStore } from '@/stores/assistencias-remotas.js'

// Router
const router = useRouter()

// Store
const store = useAssistenciasRemotasStore()
const { assistencias, availableYears, currentYear, loading, error } = storeToRefs(store)
const { 
  fetchAssistenciasForYear, 
  fetchAvailableYears, 
  searchAssistencias, 
  deleteAssistencia, 
  setCurrentYear,
  clearError 
} = store

// Reactive state
const searchQuery = ref('')
const searchResults = ref(null)
const showActionsModal = ref(false)
const selectedAssistenciaForActions = ref(null)

// Computed
const displayedAssistencias = computed(() => {
  if (searchResults.value && searchQuery.value) {
    return searchResults.value.results || []
  }
  return assistencias.value
})

// Methods
const refreshData = async () => {
  searchQuery.value = ''
  searchResults.value = null
  
  // Refresh available years first
  await fetchAvailableYears()
  
  // If no current year set, use the latest available year or current year
  if (!currentYear.value) {
    if (availableYears.value.length > 0) {
      setCurrentYear(availableYears.value[availableYears.value.length - 1])
    } else {
      setCurrentYear(new Date().getFullYear().toString())
    }
  }
  
  // Always fetch data for the current year
  if (currentYear.value) {
    await fetchAssistenciasForYear(currentYear.value)
  }
}

const handleSearch = async () => {
  if (!searchQuery.value || searchQuery.value.trim().length < 2) {
    searchResults.value = null
    return
  }

  try {
    const results = await searchAssistencias(searchQuery.value.trim(), currentYear.value)
    searchResults.value = results
  } catch (err) {
    console.error('Search error:', err)
  }
}

const onYearChange = async () => {
  searchQuery.value = ''
  searchResults.value = null
  
  if (currentYear.value) {
    await fetchAssistenciasForYear(currentYear.value)
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'Sem data'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return 'Data inválida'
  }
}

const getTipoClass = (tipo) => {
  const typeMap = {
    'REMOTA': 'tipo-remota',
    'TELEFÓNICA': 'tipo-telefonica',
    'TELEMÓVEL': 'tipo-telemovel'
  }
  return typeMap[tipo] || 'tipo-default'
}

const navigateToDetail = (assistencia) => {
  const year = store.getYearFromDate(assistencia.dataAssistencia)
  router.push(`/assistencias-remotas/${assistencia.id}?year=${year}`)
}

const navigateToCreate = () => {
  router.push('/assistencias-remotas/new?from=list')
}

const showActions = (assistencia) => {
  selectedAssistenciaForActions.value = assistencia
  showActionsModal.value = true
}

const closeActions = () => {
  showActionsModal.value = false
  selectedAssistenciaForActions.value = null
}

const viewAssistencia = () => {
  if (selectedAssistenciaForActions.value) {
    navigateToDetail(selectedAssistenciaForActions.value)
  }
  closeActions()
}

const editAssistencia = () => {
  if (selectedAssistenciaForActions.value) {
    const year = store.getYearFromDate(selectedAssistenciaForActions.value.dataAssistencia)
    router.push(`/assistencias-remotas/${selectedAssistenciaForActions.value.id}/edit?year=${year}`)
  }
  closeActions()
}

const deleteAssistenciaAction = async () => {
  if (!selectedAssistenciaForActions.value) return
  
  const confirmed = confirm(`Tem a certeza que deseja eliminar a assistência "${selectedAssistenciaForActions.value.assistNumero}"?`)
  
  if (confirmed) {
    try {
      const year = store.getYearFromDate(selectedAssistenciaForActions.value.dataAssistencia)
      await deleteAssistencia(year, selectedAssistenciaForActions.value.id)
      closeActions()
    } catch (err) {
      console.error('Error deleting assistencia:', err)
    }
  }
}

// Lifecycle
onMounted(async () => {
  console.log('AssistenciasRemotasList mounted')
  
  // Fetch available years first
  await fetchAvailableYears()
  
  // If we have years and current year is not in available years, use the latest year
  if (availableYears.value.length > 0) {
    if (!currentYear.value || !availableYears.value.includes(currentYear.value)) {
      setCurrentYear(availableYears.value[availableYears.value.length - 1])
    }
  }
  
  // Always try to fetch data for the current year (even if no years found, try current year)
  if (currentYear.value) {
    await fetchAssistenciasForYear(currentYear.value)
  }
})

// Watch for changes in search query to reset results when empty
watch(searchQuery, (newValue) => {
  if (!newValue || newValue.trim().length === 0) {
    searchResults.value = null
  }
})
</script>

<style scoped>
.assistencias-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  position: relative;
}

.assistencias-header {
  margin-bottom: 1rem;
}

.list-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.controls-left h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.controls-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}



.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.btn-refresh {
  background: #f8f9fa;
  color: #333;
  border: 1px solid #ddd;
}

.btn-refresh:hover {
  background: #e9ecef;
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.search-container {
  position: relative;
  margin-bottom: 1.5rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 3rem 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
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
  text-align: center;
  padding: 3rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.error-alert {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #721c24;
}

.assistencias-list {
  display: grid;
  gap: 1rem;
}

.assistencia-item {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.assistencia-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.assistencia-main {
  flex: 1;
}

.assistencia-header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.assistencia-header-info h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.assistencia-tipo {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.tipo-remota {
  background: #d4edda;
  color: #155724;
}

.tipo-telefonica {
  background: #d1ecf1;
  color: #0c5460;
}

.tipo-telemovel {
  background: #ffeeba;
  color: #856404;
}

.tipo-default {
  background: #f8f9fa;
  color: #6c757d;
}

.assistencia-client {
  margin-bottom: 0.5rem;
}

.cliente-name {
  font-weight: 600;
  color: #333;
}

.assistencia-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.assistencia-meta span {
  font-size: 0.875rem;
  color: #666;
}

.assistencia-details {
  margin-bottom: 0.75rem;
}

.motivo {
  font-size: 0.9rem;
  color: #555;
  margin: 0;
  line-height: 1.4;
}

.assistencia-status {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.status-badge, .value-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.contract {
  background: #d4edda;
  color: #155724;
}

.status-badge.warranty {
  background: #cce5ff;
  color: #004085;
}

.value-badge {
  background: #fff3cd;
  color: #856404;
}

.assistencia-actions {
  flex-shrink: 0;
  margin-left: 1rem;
}

.action-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  color: #666;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f8f9fa;
  color: #333;
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty-state h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #666;
  margin-bottom: 1.5rem;
}

.search-info {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #e7f3ff;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #004085;
}

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
}

.actions-modal {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 300px;
  width: 90%;
}

.actions-modal h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  text-align: center;
  font-size: 1rem;
}

.modal-actions {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.modal-btn {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  text-align: left;
}

.view-btn {
  background: #e7f3ff;
  color: #004085;
}

.view-btn:hover {
  background: #cce5ff;
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
  background: #f1aeb5;
}

.cancel-btn {
  background: #f8f9fa;
  color: #333;
}

.cancel-btn:hover {
  background: #e9ecef;
}

.fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  z-index: 100;
}

.fab:hover {
  background: var(--primary-hover);
  transform: scale(1.1);
}

/* Mobile styles */
@media (max-width: 768px) {
  .assistencias-container {
    padding: 1rem 0.5rem;
  }
  
  .list-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .controls-right {
    justify-content: space-between;
  }
  
  .assistencia-item {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .assistencia-actions {
    margin-left: 0;
    align-self: flex-end;
  }
  
  .assistencia-header-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .assistencia-meta {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .fab {
    bottom: 1rem;
    right: 1rem;
    width: 48px;
    height: 48px;
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .assistencia-item {
    padding: 0.75rem;
  }
  
  .assistencia-header-info h3 {
    font-size: 1rem;
  }
  
  .controls-left h2 {
    font-size: 1.25rem;
  }
}
</style>
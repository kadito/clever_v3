<template>
  <div class="agendamentos-container">
    <div class="agendamentos-header">
      <BackButton to="/agendamentos" variant="inline" />
    </div>

    <!-- Controls -->
    <div class="list-controls">
      <div class="controls-left">
        <h2>Agendamentos {{ selectedYear || 'Todos' }} ({{ currentCount }})</h2>
      </div>
      
      <div class="controls-right">
        <YearSelector 
          v-model="selectedYear"
          :years="availableYears"
          :show-all-option="true"
          @change="handleYearChange"
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
        placeholder="Pesquisar agendamentos..." 
        class="search-input"
      >
      <span class="search-icon">🔍</span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Carregando agendamentos...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <p>❌ {{ error }}</p>
      <button @click="refreshData" class="btn secondary">Tentar Novamente</button>
    </div>

    <!-- Agendamentos List -->
    <div v-if="!loading && currentCount > 0" class="agendamentos-list">
      <div 
        v-for="agendamento in currentAgendamentos" 
        :key="`${agendamento.year || selectedYear}-${agendamento.id}`"
        class="agendamento-item"
        @click="viewAgendamento(agendamento)"
      >
        <div class="agendamento-main">
          <h3>{{ agendamento.nomeCliente }}</h3>
          <div class="agendamento-meta">
            <span class="agendamento-motivo">{{ agendamento.motivo }}</span>
            <span class="agendamento-date">{{ formatDate(agendamento.dataPrevistaAssistencia) || 'Sem data' }}</span>
          </div>
          <div class="agendamento-details" v-if="agendamento.tecnico || agendamento.assunto">
            <span v-if="agendamento.tecnico" class="agendamento-technician">👨‍🔧 {{ agendamento.tecnico }}</span>
            <span v-if="agendamento.assunto" class="agendamento-subject">📋 {{ agendamento.assunto }}</span>
          </div>
          <div class="agendamento-status">
            <span 
              class="status-badge"
              :class="{
                'completed': agendamento.tarefaConcluida,
                'postponed': agendamento.houveAdiamento && !agendamento.tarefaConcluida,
                'overdue': isTaskOverdue(agendamento) && !agendamento.tarefaConcluida,
                'due-today': isTaskDueToday(agendamento) && !agendamento.tarefaConcluida,
                'pending': !agendamento.tarefaConcluida && !agendamento.houveAdiamento && !isTaskOverdue(agendamento) && !isTaskDueToday(agendamento)
              }"
            >
              <span v-if="agendamento.tarefaConcluida">Concluída</span>
              <span v-else-if="agendamento.houveAdiamento">Adiada</span>
              <span v-else-if="isTaskOverdue(agendamento)">Atrasada</span>
              <span v-else-if="isTaskDueToday(agendamento)">Hoje</span>
              <span v-else>Pendente</span>
            </span>
          </div>
          <div v-if="searchResults && agendamento.year" class="agendamento-year">
            <span>Ano: {{ agendamento.year }}</span>
          </div>
        </div>
        <div class="agendamento-actions">
          <button class="action-btn" @click.stop="showActions(agendamento)">
            ⋮
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && currentCount === 0" class="empty-state">
      <h3>Nenhum agendamento encontrado</h3>
      <p v-if="searchResults">
        Nenhum agendamento encontrado com o termo "{{ searchQuery }}".
      </p>
      <p v-else-if="selectedYear">
        Não há agendamentos para o ano {{ selectedYear }}.
      </p>
      <p v-else>
        Não há agendamentos cadastrados no sistema.
      </p>
    </div>

    <!-- Search Results Info -->
    <div v-if="searchResults && searchQuery" class="search-info">
      <p>
        {{ searchResults.count || 0 }} resultado(s) encontrado(s) para "{{ searchQuery }}"
        {{ selectedYear ? `no ano ${selectedYear}` : 'em todos os anos' }}
      </p>
    </div>

    <!-- Actions Modal -->
    <div v-if="showActionsModal" class="actions-modal-overlay" @click="closeActions">
      <div class="actions-modal" @click.stop>
        <h3>{{ selectedAgendamentoForActions?.nomeCliente }}</h3>
        <div class="modal-actions">
          <button @click="viewAgendamento(selectedAgendamentoForActions)" class="modal-btn view-btn">
            📋 Ver Detalhes
          </button>
          <button @click="editAgendamento(selectedAgendamentoForActions)" class="modal-btn edit-btn">
            ✏️ Editar
          </button>
          <button @click="confirmDelete(selectedAgendamentoForActions)" class="modal-btn delete-btn">
            🗑️ Eliminar
          </button>
        </div>
        <button @click="closeActions" class="modal-btn cancel-btn">
          Cancelar
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="agendamentoToDelete" class="modal-overlay" @click="cancelDelete">
      <div class="modal" @click.stop>
        <h3>Confirmar Eliminação</h3>
        <p>Tem a certeza que pretende eliminar o agendamento de <strong>{{ agendamentoToDelete.nomeCliente }}</strong>?</p>
        <p class="warning">Esta ação não pode ser desfeita.</p>
        <div class="modal-actions">
          <button @click="cancelDelete" class="btn secondary">Cancelar</button>
          <button @click="deleteAgendamento" class="btn danger" :disabled="loading">
            {{ loading ? 'Eliminando...' : 'Eliminar' }}
          </button>
        </div>
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
import { useAgendamentosStore } from '@/stores/agendamentos.js'
import { storeToRefs } from 'pinia'
import BackButton from '@/components/BackButton.vue'
import YearSelector from '@/components/YearSelector.vue'

// Router
const router = useRouter()

// Store
const agendamentosStore = useAgendamentosStore()
const { 
  agendamentos, 
  availableYears, 
  currentYear, 
  loading, 
  error, 
  agendamentosCount, 
  hasAgendamentos 
} = storeToRefs(agendamentosStore)

const {
  fetchAgendamentosForYear,
  fetchAvailableYears,
  searchAgendamentos,
  deleteAgendamento: deleteFromStore,
  setCurrentYear,
  clearError,
  isTaskOverdue,
  isTaskDueToday
} = agendamentosStore

// Local state
const selectedYear = ref('')
const searchQuery = ref('')
const searchResults = ref(null)
const agendamentoToDelete = ref(null)
const showActionsModal = ref(false)
const selectedAgendamentoForActions = ref(null)

// Computed properties
const currentAgendamentos = computed(() => {
  return searchResults.value ? searchResults.value.results : agendamentos.value
})

const currentCount = computed(() => {
  return searchResults.value ? searchResults.value.count : agendamentosCount.value
})

// Methods
const handleYearChange = async (year) => {
  selectedYear.value = year
  searchQuery.value = ''
  searchResults.value = null
  clearError()
  
  if (year) {
    setCurrentYear(year)
    await fetchAgendamentosForYear(year)
  } else {
    // For "all years", we could fetch all or show empty state
    agendamentos.value = []
  }
}

const handleSearch = async () => {
  if (searchQuery.value.trim().length >= 2) {
    const results = await searchAgendamentos(searchQuery.value.trim(), selectedYear.value || null)
    searchResults.value = results
  } else if (searchQuery.value.trim().length === 0) {
    searchResults.value = null
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = null
}

const viewAgendamento = (agendamento) => {
  const year = agendamento.year || selectedYear.value || currentYear.value
  router.push({ 
    name: 'agendamentos-detail', 
    params: { id: agendamento.id, year } 
  })
}

const editAgendamento = (agendamento) => {
  const year = agendamento.year || selectedYear.value || currentYear.value
  router.push({ 
    name: 'agendamentos-edit', 
    params: { id: agendamento.id, year } 
  })
}

const showActions = (agendamento) => {
  selectedAgendamentoForActions.value = agendamento
  showActionsModal.value = true
}

const closeActions = () => {
  showActionsModal.value = false
  selectedAgendamentoForActions.value = null
}

const confirmDelete = (agendamento) => {
  agendamentoToDelete.value = agendamento
  closeActions()
}

const cancelDelete = () => {
  agendamentoToDelete.value = null
}

const deleteAgendamento = async () => {
  if (!agendamentoToDelete.value) return
  
  try {
    const year = agendamentoToDelete.value.year || selectedYear.value || currentYear.value
    await deleteFromStore(year, agendamentoToDelete.value.id)
    agendamentoToDelete.value = null
    
    // If we were searching, refresh search results
    if (searchResults.value) {
      await handleSearch()
    }
  } catch (error) {
    console.error('Error deleting agendamento:', error)
    // Error is already handled by the store
  }
}

const refreshData = async () => {
  clearError()
  await fetchAvailableYears()
  if (selectedYear.value) {
    await fetchAgendamentosForYear(selectedYear.value)
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('pt-PT')
  } catch {
    return dateString
  }
}

const navigateToCreate = () => {
  router.push({ name: 'agendamentos-new' })
}

// Lifecycle
onMounted(async () => {
  await fetchAvailableYears()
  
  // Set initial year to current year if available
  if (availableYears.value.includes(currentYear.value)) {
    selectedYear.value = currentYear.value
    await fetchAgendamentosForYear(currentYear.value)
  } else if (availableYears.value.length > 0) {
    // Otherwise set to most recent year
    const mostRecentYear = Math.max(...availableYears.value.map(y => parseInt(y))).toString()
    selectedYear.value = mostRecentYear
    await fetchAgendamentosForYear(mostRecentYear)
  }
})

// Watch for year changes
watch(currentYear, (newYear) => {
  if (newYear && newYear !== selectedYear.value) {
    selectedYear.value = newYear
  }
})
</script>

<style scoped>
.agendamentos-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  background: #f5f5f5;
  min-height: 100vh;
}

.agendamentos-header {
  margin-bottom: 1rem;
}

.list-header {
  text-align: center;
  margin-bottom: 2rem;
}

.list-header h1 {
  color: #2c3e50;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.list-header p {
  color: #666;
  font-size: 1.1rem;
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

.controls-left h2 {
  color: #2c3e50;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
}

.controls-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
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

.loading-container {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.error-container {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
}

.agendamentos-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.agendamento-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.agendamento-item:last-child {
  border-bottom: none;
}

.agendamento-item:hover {
  background-color: #f8f9fa;
}

.agendamento-main {
  flex: 1;
}

.agendamento-main h3 {
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.agendamento-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.agendamento-motivo {
  color: var(--primary-color);
  font-weight: 600;
}

.agendamento-date {
  color: #888;
}

.agendamento-details {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.agendamento-technician {
  font-weight: 500;
}

.agendamento-subject {
  color: #888;
}

.agendamento-status {
  margin-bottom: 0.25rem;
}

.agendamento-year {
  color: #e67e22;
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
}

.agendamento-actions {
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

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.error-container p {
  color: #dc3545;
  margin-bottom: 1rem;
}

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.table-header h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.table-header p {
  color: #666;
  margin: 0;
}

.no-agendamentos {
  text-align: center;
  padding: 3rem;
}

.empty-state h3 {
  color: #666;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #999;
  margin-bottom: 2rem;
}

.table-wrapper {
  overflow-x: auto;
}

.agendamentos-table {
  width: 100%;
  border-collapse: collapse;
}

.agendamentos-table th {
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.agendamentos-table td {
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  vertical-align: top;
}

.agendamentos-table tr:hover {
  background: #f8f9fa;
}

.agendamentos-table tr.completed {
  background: #f8fff9;
}

.agendamentos-table tr.postponed {
  background: #fffbf0;
}

.agendamentos-table tr.overdue {
  background: #fff5f5;
}

.agendamentos-table tr.due-today {
  background: #f0faff;
}

.client-cell strong {
  color: #2c3e50;
  display: block;
}

.motivo-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.status-badge.postponed {
  background: #fff3cd;
  color: #856404;
}

.status-badge.overdue {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.due-today {
  background: #d1ecf1;
  color: #0c5460;
}

.status-badge.pending {
  background: #e2e3e5;
  color: #383d41;
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

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.small {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
}

.btn.primary {
  background: var(--primary-color);
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn.secondary {
  background: #6c757d;
  color: white;
}

.btn.secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn.danger {
  background: #dc3545;
  color: white;
}

.btn.danger:hover:not(:disabled) {
  background: #c82333;
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

.cancel-btn {
  background: #6c757d;
  color: white;
  text-align: center;
  margin-top: 0.5rem;
}

.cancel-btn:hover {
  background: #5a6268;
}

/* Delete Modal */
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

.modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.modal h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.modal p {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.modal .warning {
  color: #dc3545;
  font-weight: 600;
}

.modal .modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
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
  .agendamentos-list {
    padding: 0.5rem;
  }
  
  .list-header h1 {
    font-size: 2rem;
  }
  
  .list-controls {
    /* Enhanced stacking context for mobile dropdowns */
    position: relative;
    z-index: 1;
    isolation: isolate;
  }
  
  .controls-row {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    /* Ensure proper positioning context */
    position: relative;
  }
  
  .search-container {
    min-width: auto;
    /* Enhanced positioning */
    position: relative;
    z-index: 1;
  }
  
  .table-wrapper {
    font-size: 0.8rem;
  }
  
  .agendamentos-table th,
  .agendamentos-table td {
    padding: 0.5rem;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .btn.small {
    padding: 0.5rem;
    font-size: 0.7rem;
  }
  
  .modal {
    padding: 1.5rem;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .motivo-cell {
    max-width: 150px;
  }
}

@media (max-width: 480px) {
  .list-header h1 {
    font-size: 1.75rem;
  }
  
  .list-controls {
    padding: 1rem;
  }
  
  .table-wrapper {
    font-size: 0.7rem;
  }
  
  .agendamentos-table th,
  .agendamentos-table td {
    padding: 0.375rem;
  }
  
  .motivo-cell {
    max-width: 120px;
  }
}
</style>

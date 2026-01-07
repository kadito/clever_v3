<template>
  <div class="clientes-container">
    <div class="clientes-header">
      <BackButton to="/clientes" variant="inline" />
    </div>

    <!-- Controls -->
    <div class="list-controls">
      <div class="controls-left">
        <h2>Clientes ({{ displayedClientes.length }})</h2>
      </div>
      
      <button @click="refreshData" :disabled="loading" class="btn btn-refresh">
        🔄 Atualizar
      </button>
    </div>

    <!-- Search -->
    <div class="search-container">
      <input 
        type="text" 
        v-model="searchQuery" 
        @input="handleSearch"
        placeholder="Pesquisar por nome, empresa, contribuinte..." 
        class="search-input"
      >
      <span class="search-icon">🔍</span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <p>A carregar clientes...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-alert">
      <p>{{ error }}</p>
      <button @click="clearError" class="close-btn">×</button>
    </div>

    <!-- Clientes List -->
    <div v-if="!loading && displayedClientes.length > 0" class="clientes-list">
      <div 
        v-for="cliente in displayedClientes" 
        :key="cliente.id"
        class="cliente-item"
        @click="navigateToDetail(cliente)"
      >
        <div class="cliente-main">
          <h3>{{ cliente.nomeComercial || cliente.nomeEmpresa }}</h3>
          <div class="cliente-meta">
            <span class="cliente-contribuinte">{{ cliente.contribuinte || 'Sem NIF' }}</span>
            <span class="cliente-localidade">{{ cliente.localidade || 'Sem localidade' }}</span>
          </div>
          <div class="cliente-contact" v-if="cliente.responsavel || cliente.telefoneContato">
            <span v-if="cliente.responsavel" class="cliente-responsavel">{{ cliente.responsavel }}</span>
            <span v-if="cliente.telefoneContato" class="cliente-telefone">📞 {{ cliente.telefoneContato }}</span>
          </div>
        </div>
        <div class="cliente-actions">
          <button class="action-btn" @click.stop="showActions(cliente)">
            ⋮
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && displayedClientes.length === 0" class="empty-state">
      <h3>Nenhum cliente encontrado</h3>
      <p v-if="searchQuery">
        Não foram encontrados clientes com o termo "{{ searchQuery }}".
      </p>
      <p v-else>
        Não há clientes cadastrados no sistema.
      </p>
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
        <h3>{{ selectedClienteForActions?.nomeComercial || selectedClienteForActions?.nomeEmpresa }}</h3>
        <div class="modal-actions">
          <button @click="viewCliente" class="modal-btn view-btn">
            📋 Ver Detalhes
          </button>
          <button @click="editCliente" class="modal-btn edit-btn">
            ✏️ Editar
          </button>
          <button @click="confirmDelete(selectedClienteForActions)" class="modal-btn delete-btn">
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
          Tem a certeza que pretende eliminar o cliente 
          <strong>{{ clienteToDelete?.nomeComercial || clienteToDelete?.nomeEmpresa }}</strong>?
        </p>
        <p class="warning-text">
          Esta ação não pode ser desfeita.
        </p>
        <div class="modal-actions">
          <button @click="cancelDelete" class="btn btn-secondary">
            Cancelar
          </button>
          <button @click="deleteClienteAction" class="btn btn-danger" :disabled="loading">
            {{ loading ? 'A eliminar...' : 'Eliminar' }}
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import BackButton from '@/components/BackButton.vue'
import { useClientesStore } from '@/stores/clientes.js'

// Router
const router = useRouter()

// Store
const store = useClientesStore()
const { clientes, loading, error } = storeToRefs(store)
const { 
  fetchClientes, 
  searchClientes, 
  clearError, 
  deleteCliente: deleteClienteFromStore 
} = store

// Local state
const searchQuery = ref('')
const searchResults = ref(null)
const showActionsModal = ref(false)
const selectedClienteForActions = ref(null)
const showDeleteModal = ref(false)
const clienteToDelete = ref(null)

// Computed
const displayedClientes = computed(() => {
  if (searchResults.value && searchQuery.value) {
    return searchResults.value.results || []
  }
  return clientes.value
})

// Methods
const refreshData = async () => {
  await fetchClientes()
}

let searchTimeout = null
const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(() => {
    if (searchQuery.value.trim()) {
      const results = searchClientes(searchQuery.value)
      searchResults.value = results
    } else {
      searchResults.value = null
    }
  }, 300)
}

const navigateToDetail = (cliente) => {
  router.push(`/clientes/${cliente.id}`)
}

const navigateToCreate = () => {
  router.push('/clientes/new?from=list')
}

const showActions = (cliente) => {
  selectedClienteForActions.value = cliente
  showActionsModal.value = true
}

const closeActions = () => {
  showActionsModal.value = false
  selectedClienteForActions.value = null
}

const viewCliente = () => {
  if (selectedClienteForActions.value) {
    navigateToDetail(selectedClienteForActions.value)
  }
  closeActions()
}

const editCliente = () => {
  if (selectedClienteForActions.value) {
    router.push(`/clientes/${selectedClienteForActions.value.id}/edit`)
  }
  closeActions()
}

const confirmDelete = (cliente) => {
  clienteToDelete.value = cliente
  showDeleteModal.value = true
  closeActions()
}

const cancelDelete = () => {
  clienteToDelete.value = null
  showDeleteModal.value = false
}

const deleteClienteAction = async () => {
  if (!clienteToDelete.value) return
  
  try {
    await deleteClienteFromStore(clienteToDelete.value.id)
    cancelDelete()
  } catch (err) {
    console.error('Error deleting cliente:', err)
    // Error is already handled by the store
  }
}

// Lifecycle
onMounted(async () => {
  await fetchClientes()
})
</script>

<style scoped>
.clientes-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  background: #f5f5f5;
  min-height: 100vh;
}

.clientes-header {
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

.controls-left h2 {
  color: #2c3e50;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
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

.clientes-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.cliente-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.cliente-item:last-child {
  border-bottom: none;
}

.cliente-item:hover {
  background-color: #f8f9fa;
}

.cliente-main {
  flex: 1;
}

.cliente-main h3 {
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.cliente-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.cliente-contribuinte {
  font-weight: 500;
}

.cliente-localidade {
  color: #888;
}

.cliente-contact {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #666;
}

.cliente-responsavel {
  font-weight: 500;
}

.cliente-telefone {
  color: #888;
}

.cliente-actions {
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
  .clientes-container {
    padding: 0.5rem;
  }

  .list-controls {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .controls-left h2 {
    text-align: center;
  }

  .cliente-item {
    padding: 0.75rem;
  }

  .cliente-main h3 {
    font-size: 0.9rem;
  }

  .cliente-meta {
    font-size: 0.8rem;
    flex-direction: column;
    gap: 0.25rem;
  }

  .cliente-contact {
    font-size: 0.75rem;
    flex-direction: column;
    gap: 0.25rem;
  }

  .actions-modal {
    padding: 1rem;
    min-width: 260px;
  }
}

@media (max-width: 480px) {
  .controls-left h2 {
    font-size: 1.1rem;
  }

  .cliente-item {
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

/* Delete Confirmation Modal */
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

.modal-content .modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.modal-content .modal-actions .btn {
  min-width: 100px;
  padding: 0.75rem 1.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.modal-content .modal-actions .btn-secondary {
  background: #6c757d !important;
  color: white !important;
  border-color: #6c757d !important;
}

.modal-content .modal-actions .btn-secondary:hover {
  background: #5a6268 !important;
  border-color: #5a6268 !important;
}

.modal-content .modal-actions .btn-danger {
  background: #dc3545 !important;
  color: white !important;
  border-color: #dc3545 !important;
}

.modal-content .modal-actions .btn-danger:hover {
  background: #c82333 !important;
  border-color: #c82333 !important;
}

.modal-content .modal-actions .btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .fab {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 50px;
    height: 50px;
    font-size: 1.25rem;
  }
}
</style> 
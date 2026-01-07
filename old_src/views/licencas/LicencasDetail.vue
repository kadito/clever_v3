<template>
  <div class="licenca-detail">
    <div class="page-header">
      <BackButton to="/licencas/list" variant="inline" />
      
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>A carregar licença...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <h2>Erro ao carregar licença</h2>
        <p>{{ error }}</p>
        <button @click="loadData" class="btn btn-secondary">
          Tentar Novamente
        </button>
      </div>
      
      <div v-else-if="licenca" class="header-content">
        <div class="title-section">
          <h1 class="page-title">{{ licenca.cliente }}</h1>
          <span class="status-badge" :class="getLicenseStatus(licenca)">
            {{ getLicenseStatusText(licenca) }}
          </span>
        </div>
        <p class="page-description">
          {{ formatSoftwareNames(licenca.tipoSoftware || licenca.software?.name) }} {{ licenca.versao }}
        </p>
        
        <div class="header-actions">
          <router-link 
            :to="`/licencas/${year}/${licenca.id}/edit`" 
            class="btn btn-primary"
          >
            <span class="btn-icon">✏️</span>
            Editar
          </router-link>
          <button @click="confirmDelete" class="btn btn-danger">
            <span class="btn-icon">🗑️</span>
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <div v-if="licenca && !loading" class="detail-content">
      <!-- Basic Information -->
      <div class="info-section">
        <h2 class="section-title">
          <span class="section-icon">ℹ️</span>
          INFORMAÇÕES BÁSICAS
        </h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">CLIENTE:</span>
            <span class="info-value">{{ licenca.cliente || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">TIPO DE SOFTWARE:</span>
            <span class="info-value">{{ formatSoftwareNames(licenca.tipoSoftware || licenca.software?.name) || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">VERSÃO:</span>
            <span class="info-value">{{ licenca.versao || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">NÚMERO DE SÉRIE:</span>
            <span class="info-value">{{ licenca.numeroSerie || 'N/A' }}</span>
          </div>
        </div>
      </div>

      <!-- License Period -->
      <div class="info-section">
        <h2 class="section-title">
          <span class="section-icon">📅</span>
          PERÍODO DA LICENÇA
        </h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">DATA DE INÍCIO:</span>
            <span class="info-value">{{ formatDate(licenca.dataInicio) || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">DATA DE VENCIMENTO:</span>
            <span class="info-value">{{ formatDate(licenca.dataVencimento) || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">MODALIDADE:</span>
            <span class="info-value">{{ licenca.modalidade || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">DURAÇÃO DO CONTRATO:</span>
            <span class="info-value">{{ licenca.duracaoContrato || 'N/A' }}</span>
          </div>
        </div>
      </div>

      <!-- Invoice Information -->
      <div class="info-section" v-if="licenca.invoices && licenca.invoices.length > 0">
        <h2 class="section-title">
          <span class="section-icon">💰</span>
          INFORMAÇÕES DE FATURAÇÃO
        </h2>
        <div class="invoice-list">
          <div v-for="(fatura, index) in licenca.invoices" :key="index" class="invoice-item">
            <h3 class="invoice-title">Fatura {{ index + 1 }}</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">ANO:</span>
                <span class="info-value">{{ fatura.ano || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">NÚMERO DA FATURA:</span>
                <span class="info-value">{{ fatura.numeroFatura || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">DATA DA FATURA:</span>
                <span class="info-value">{{ formatDate(fatura.dataFatura) || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">DATA DO AVISO:</span>
                <span class="info-value">{{ formatDate(fatura.dataAviso) || 'N/A' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- System Information -->
      <div class="info-section">
        <h2 class="section-title">
          <span class="section-icon">🔧</span>
          INFORMAÇÕES DO SISTEMA
        </h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">CRIADO EM:</span>
            <span class="info-value">{{ formatDateTime(licenca.createdAt) || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">ÚLTIMA ATUALIZAÇÃO:</span>
            <span class="info-value">{{ formatDateTime(licenca.updatedAt) || 'N/A' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Not Found State -->
    <div v-if="!loading && !error && !licenca" class="not-found-state">
      <h2>Licença não encontrada</h2>
      <p>A licença pode ainda não estar disponível no sistema. Tentar novamente?</p>
      <div class="retry-actions">
        <button @click="retryLoad" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'A carregar...' : 'Tentar novamente' }}
        </button>
        <BackButton to="/licencas/list" variant="full-width" />
      </div>
      <p v-if="autoRetryCountdown > 0" class="auto-retry-info">
        Tentativa automática em {{ autoRetryCountdown }}s...
      </p>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content" @click.stop>
        <h3>Confirmar Eliminação</h3>
        <p>
          Tem a certeza que pretende eliminar a licença de 
          <strong>{{ licenca?.cliente }}</strong>?
        </p>
        <p class="warning-text">
          Esta ação não pode ser desfeita.
        </p>
        <div class="modal-actions">
          <button @click="cancelDelete" class="btn btn-secondary">
            Cancelar
          </button>
          <button @click="deleteLicencaAction" class="btn btn-danger" :disabled="loading">
            {{ loading ? 'A eliminar...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useLicencasStore } from '@/stores/licencas.js'
import BackButton from '@/components/BackButton.vue'

// Router
const route = useRoute()
const router = useRouter()

// Store
const licencasStore = useLicencasStore()

// Reactive references from store
const { selectedLicenca: licenca, loading, error } = storeToRefs(licencasStore)
const { 
  fetchLicencaById, 
  deleteLicenca, 
  getLicenseStatus, 
  isLicenseExpiringSoon, 
  formatDate,
  clearError
} = licencasStore

// Route parameters
const year = ref(route.params.year)
const id = ref(route.params.id)

// Local state
const showDeleteModal = ref(false)

// Auto-retry state
const autoRetryCountdown = ref(0)
const userInteractionCancelled = ref(false)
const retryTimeoutId = ref(null)

// Computed
const hasYear2022Data = computed(() => {
  return licenca?.ano2022 || licenca?.numeroFatura2022 || licenca?.dataFatura2022 || licenca?.dataAviso2022
})

const hasYear2023Data = computed(() => {
  return licenca?.ano2023 || licenca?.numeroFatura2023 || licenca?.dataFatura2023
})

// Methods
const loadData = async () => {
  if (year.value && id.value) {
    await fetchLicencaById(year.value, id.value)
  }
}

const retryLoad = () => {
  userInteractionCancelled.value = true
  cancelAutoRetry()
  loadLicenca()
}

const startAutoRetry = () => {
  cancelAutoRetry()
  autoRetryCountdown.value = 10
  
  const updateCountdown = () => {
    if (autoRetryCountdown.value > 0 && !userInteractionCancelled.value) {
      autoRetryCountdown.value--
      retryTimeoutId.value = setTimeout(updateCountdown, 1000)
    } else if (autoRetryCountdown.value === 0 && !userInteractionCancelled.value) {
      // Auto-retry after countdown
      loadLicenca()
    }
  }
  
  retryTimeoutId.value = setTimeout(updateCountdown, 1000)
}

const cancelAutoRetry = () => {
  if (retryTimeoutId.value) {
    clearTimeout(retryTimeoutId.value)
    retryTimeoutId.value = null
  }
  autoRetryCountdown.value = 0
}

const handleUserInteraction = () => {
  userInteractionCancelled.value = true
  cancelAutoRetry()
}

const loadLicenca = async () => {
  if (!year.value || !id.value) {
    return
  }
  
  try {
    clearError()
    await fetchLicencaById(year.value, id.value)
    // If successful, cancel any pending retries
    cancelAutoRetry()
  } catch (err) {
    console.error('Error loading licenca:', err)
    // Check if it's a 404 or "not found" error
    const isNotFound = err.message?.toLowerCase().includes('not found') || 
                       error.value?.toLowerCase().includes('not found')
    
    if (isNotFound && !userInteractionCancelled.value) {
      // Start auto-retry countdown
      startAutoRetry()
    }
  }
}

// Watch for successful data load to cancel retries
watch(() => licenca.value?.id, (newId) => {
  if (newId) {
    cancelAutoRetry()
    userInteractionCancelled.value = false
  }
})

const confirmDelete = () => {
  showDeleteModal.value = true
}

const cancelDelete = () => {
  showDeleteModal.value = false
}

const deleteLicencaAction = async () => {
  try {
    await deleteLicenca(year.value, id.value)
    router.push('/licencas/list')
  } catch (err) {
    console.error('Error deleting licenca:', err)
    // Error is handled by the store
  }
}

// Remove this function since it's imported from store

const getLicenseStatusText = (licenca) => {
  const status = getLicenseStatus(licenca)
  switch (status) {
    case 'expired': return 'Expirada'
    case 'expiring': return 'A Expirar'
    case 'active': return 'Ativa'
    default: return 'Indefinida'
  }
}

// Remove this function since it's imported from store

const getDaysUntilExpiry = (licenca) => {
  if (!licenca.dataFim) return 0
  const endDate = new Date(licenca.dataFim)
  const today = new Date()
  const diffTime = endDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

// Remove this function since it's imported from store

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('pt-PT')
}

// Format software names (handle both array and string formats)
const formatSoftwareNames = (software) => {
  if (!software) return ''
  if (Array.isArray(software)) {
    return software.join(', ')
  }
  return software
}

// Lifecycle
onMounted(() => {
  // Add event listeners for user interaction
  window.addEventListener('click', handleUserInteraction)
  window.addEventListener('scroll', handleUserInteraction)
  window.addEventListener('keydown', handleUserInteraction)
  
  loadLicenca()
})

onBeforeUnmount(() => {
  cancelAutoRetry()
  window.removeEventListener('click', handleUserInteraction)
  window.removeEventListener('scroll', handleUserInteraction)
  window.removeEventListener('keydown', handleUserInteraction)
})
</script>

<style scoped>
.licenca-detail {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
}

.page-header {
  margin-bottom: 2rem;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem 1rem;
}

.not-found-state {
  background: white;
  padding: 3rem 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.not-found-state h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.not-found-state p {
  color: #666;
  margin-bottom: 2rem;
}

.retry-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.retry-actions .btn {
  min-width: 180px;
}

.retry-actions .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auto-retry-info {
  color: #666;
  font-size: 0.9rem;
  font-style: italic;
  margin-top: 1rem;
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.header-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title-section {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  color: #2c3e50;
  margin: 0;
  font-size: 2rem;
  flex: 1;
}

.page-description {
  color: #666;
  margin: 0 0 1.5rem 0;
  font-size: 1.1rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
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

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-icon {
  font-size: 1rem;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.info-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-title {
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-icon {
  font-size: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item.status-item {
  grid-column: 1 / -1;
}

.info-label {
  font-weight: 500;
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  color: #2c3e50;
  font-size: 1rem;
  word-break: break-word;
}


.status-warning {
  display: block;
  margin-top: 0.5rem;
  color: #856404;
  font-size: 0.9rem;
  font-weight: 500;
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

/* Invoice list styles */
.invoice-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.invoice-item {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
}

.invoice-title {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .licenca-detail {
    padding: 0.75rem;
  }
  
  .header-content {
    padding: 1.5rem;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .title-section {
    flex-direction: column;
    align-items: start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .info-section {
    padding: 1rem;
  }
  
  .section-title {
    font-size: 1.2rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .invoice-item {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .header-actions {
    flex-direction: column;
  }
  
  .btn {
    justify-content: center;
  }
}
</style>

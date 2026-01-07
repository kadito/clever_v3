<template>
  <div class="assistencia-detail-container">
    <div class="detail-header">
      <BackButton :to="backRoute" variant="inline" />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <p>A carregar assistência...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-alert">
      <p>{{ error }}</p>
      <button @click="clearError" class="close-btn">×</button>
    </div>

    <!-- Assistencia Details -->
    <div v-if="!loading && assistencia" class="assistencia-detail">
      <!-- Header Info -->
      <div class="detail-section header-section">
        <div class="assistencia-title">
          <h1>{{ assistencia.assistNumero }}</h1>
          <span class="assistencia-tipo" :class="getTipoClass(assistencia.tipoAssistencia)">
            {{ assistencia.tipoAssistencia }}
          </span>
        </div>
        
        <div class="assistencia-status">
          <span v-if="assistencia.contrato" class="status-badge contract">Contrato</span>
          <span v-if="assistencia.garantia" class="status-badge warranty">Garantia</span>
          <span v-if="assistencia.valorAssist > 0" class="value-badge">€{{ assistencia.valorAssist.toFixed(2) }}</span>
        </div>
      </div>

      <!-- Basic Information -->
      <div class="detail-section">
        <h2>INFORMAÇÃO BÁSICA</h2>
        <div class="detail-grid">
          <div class="detail-item">
            <label>CLIENTE</label>
            <span>{{ assistencia.cliente || 'Não especificado' }}</span>
          </div>
          
          <div class="detail-item">
            <label>TIPO DE ASSISTÊNCIA</label>
            <span>{{ assistencia.tipoAssistencia || 'N/A' }}</span>
          </div>
          
          <div class="detail-item">
            <label>TÉCNICO RESPONSÁVEL</label>
            <span>{{ assistencia.tecnicoResponsavel || 'Não especificado' }}</span>
          </div>
          
          <div class="detail-item">
            <label>QUEM ATENDEU</label>
            <span>{{ assistencia.quemAtendeu || 'Não especificado' }}</span>
          </div>
        </div>
      </div>

      <!-- Date and Time Information -->
      <div class="detail-section">
        <h2>DATAS E HORÁRIOS</h2>
        <div class="detail-grid">
          <div class="detail-item">
            <label>DATA DO PEDIDO</label>
            <span>{{ formatDateTime(assistencia.dataPedido) }}</span>
          </div>
          
          <div class="detail-item">
            <label>DATA DA ASSISTÊNCIA</label>
            <span>{{ formatDateTime(assistencia.dataAssistencia) }}</span>
          </div>
          
          <div class="detail-item">
            <label>INÍCIO DA ASSISTÊNCIA</label>
            <span>{{ formatDateTime(assistencia.inicioAssistencia) }}</span>
          </div>
          
          <div class="detail-item">
            <label>FIM DA ASSISTÊNCIA</label>
            <span>{{ formatDateTime(assistencia.fimAssistencia) }}</span>
          </div>
          
          <div class="detail-item">
            <label>HORAS TOTAL</label>
            <span>{{ computedDuration.human || 'N/A' }}</span>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div class="detail-section" v-if="assistencia.motivoPedido || assistencia.relatorioAssistencia">
        <h2>DESCRIÇÃO</h2>
        <div class="detail-grid">
          <div class="detail-item full-width" v-if="assistencia.motivoPedido">
            <label>MOTIVO DO PEDIDO</label>
            <div class="text-content">{{ assistencia.motivoPedido }}</div>
          </div>
          
          <div class="detail-item full-width" v-if="assistencia.relatorioAssistencia">
            <label>RELATÓRIO DA ASSISTÊNCIA</label>
            <div class="text-content">{{ assistencia.relatorioAssistencia }}</div>
          </div>
        </div>
      </div>


      <!-- Values Information -->
      <div class="detail-section values-section">
        <h2>VALORES</h2>
        <p class="value-note">💶 Preço: 30€/hora (09:00-18:00) | 45€/hora (outras horas) - sem IVA</p>
        <div class="detail-grid">
          <div class="detail-item value-item">
            <label>VALOR (SEM IVA)</label>
            <span class="value value-base">{{ (assistencia.valorAssist || 0).toFixed(2) }} €</span>
          </div>
        </div>
      </div>

      <!-- Status Section -->
      <div class="detail-section">
        <h2>ESTADO</h2>
        <div class="detail-grid">
          <div class="detail-item">
            <label>CONTRATO</label>
            <span>{{ assistencia.contrato ? 'SIM' : 'NÃO' }}</span>
          </div>
          
          <div class="detail-item">
            <label>GARANTIA</label>
            <span>{{ assistencia.garantia ? 'SIM' : 'NÃO' }}</span>
          </div>
          
          <div class="detail-item">
            <label>RESOLVIDO</label>
            <span>{{ assistencia.resolvido ? 'SIM' : 'NÃO' }}</span>
          </div>
          
          <div class="detail-item" v-if="assistencia.anexos">
            <label>ANEXOS</label>
            <span>{{ assistencia.anexos }}</span>
          </div>
        </div>
      </div>

      <!-- System Information -->
      <div class="detail-section system-info">
        <h2>INFORMAÇÃO DO SISTEMA</h2>
        <div class="detail-grid">
          <div class="detail-item">
            <label>CRIADO EM</label>
            <span>{{ formatDateTime(assistencia.createdAt) }}</span>
          </div>
          
          <div class="detail-item">
            <label>ATUALIZADO EM</label>
            <span>{{ formatDateTime(assistencia.updatedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="detail-actions">
        <button @click="editAssistencia" class="btn btn-primary">
          ✏️ Editar
        </button>
        <button @click="deleteAssistencia" class="btn btn-danger">
          🗑️ Eliminar
        </button>
      </div>
    </div>

    <!-- Not Found State -->
    <div v-if="!loading && !assistencia && !error" class="not-found-state">
      <h2>Assistência não encontrada</h2>
      <p>A assistência pode ainda não estar disponível no sistema. Tentar novamente?</p>
      <div class="retry-actions">
        <button @click="retryLoad" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'A carregar...' : 'Tentar novamente' }}
        </button>
        <button @click="navigateToList" class="btn btn-secondary">
          ← Voltar à Lista
        </button>
      </div>
      <p v-if="autoRetryCountdown > 0" class="auto-retry-info">
        Tentativa automática em {{ autoRetryCountdown }}s...
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import BackButton from '@/components/BackButton.vue'
import { useAssistenciasRemotasStore } from '@/stores/assistencias-remotas.js'

// Router
const route = useRoute()
const router = useRouter()

// Store
const store = useAssistenciasRemotasStore()
const { selectedAssistencia: assistencia, loading, error } = storeToRefs(store)
const { fetchAssistenciaById, deleteAssistencia: deleteAssistenciaStore, clearError } = store

// Auto-retry state
const autoRetryCountdown = ref(0)
const userInteractionCancelled = ref(false)
const retryTimeoutId = ref(null)

// Computed
const backRoute = computed(() => {
  const fromList = route.query.from === 'list'
  return fromList ? '/assistencias-remotas/list' : '/assistencias-remotas'
})

// Computed duration values
const computedDuration = computed(() => {
  const result = {
    hasData: false,
    human: '',
    minutes: 0,
    horaTotal: '',
    days: ''
  }
  
  if (!assistencia.value?.inicioAssistencia || !assistencia.value?.fimAssistencia) {
    return result
  }
  
  try {
    const start = new Date(assistencia.value.inicioAssistencia)
    const end = new Date(assistencia.value.fimAssistencia)
    
    if (end > start) {
      const diffMs = end.getTime() - start.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMinutes / 60)
      const remainingMinutes = diffMinutes % 60
      
      result.hasData = true
      result.minutes = diffMinutes
      result.horaTotal = `${diffHours}.${Math.round((remainingMinutes / 60) * 100).toString().padStart(3, '0')}`
      result.days = (diffMs / (1000 * 60 * 60 * 24)).toFixed(6)
      
      // Human readable duration
      if (diffHours > 0) {
        result.human = remainingMinutes > 0 
          ? `${diffHours}h ${remainingMinutes}m` 
          : `${diffHours}h`
      } else {
        result.human = `${diffMinutes}m`
      }
    }
  } catch (error) {
    console.warn('Error calculating duration:', error)
  }
  
  return result
})

// Computed values
const computedValues = computed(() => {
  const result = {
    totalComIva: 0,
    anoContrato: ''
  }
  
  if (!assistencia.value) return result
  
  // Calculate total with VAT (23%)
  if (assistencia.value.valorAssist > 0) {
    result.totalComIva = assistencia.value.valorAssist * 1.23
  }
  
  // Extract year from assistance date
  if (assistencia.value.dataAssistencia) {
    try {
      const date = new Date(assistencia.value.dataAssistencia)
      result.anoContrato = date.getFullYear().toString()
    } catch (error) {
      console.warn('Error extracting year:', error)
    }
  }
  
  return result
})

// Methods
const formatDateTime = (dateString) => {
  if (!dateString) return 'Não especificado'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
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

const editAssistencia = () => {
  const year = route.query.year || store.getYearFromDate(assistencia.value.dataAssistencia)
  router.push(`/assistencias-remotas/${route.params.id}/edit?year=${year}`)
}

const deleteAssistencia = async () => {
  if (!assistencia.value) return
  
  const confirmed = confirm(`Tem a certeza que deseja eliminar a assistência "${assistencia.value.assistNumero}"?`)
  
  if (confirmed) {
    try {
      const year = route.query.year || store.getYearFromDate(assistencia.value.dataAssistencia)
      await deleteAssistenciaStore(year, assistencia.value.id)
      router.push('/assistencias-remotas/list')
    } catch (err) {
      console.error('Error deleting assistencia:', err)
    }
  }
}

const navigateToList = () => {
  router.push('/assistencias-remotas/list')
}

const retryLoad = () => {
  userInteractionCancelled.value = true
  cancelAutoRetry()
  loadAssistencia()
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
      loadAssistencia()
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

const loadAssistencia = async () => {
  const year = route.query.year
  const id = route.params.id
  
  if (!year) {
    console.error('Year parameter is required')
    router.push('/assistencias-remotas/list')
    return
  }
  
  console.log('Loading assistencia:', { id, year })
  
  try {
    clearError()
    await fetchAssistenciaById(year, id)
    // If successful, cancel any pending retries
    cancelAutoRetry()
  } catch (err) {
    console.error('Error loading assistencia:', err)
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
watch(() => assistencia.value?.id, (newId) => {
  if (newId) {
    cancelAutoRetry()
    userInteractionCancelled.value = false
  }
})

// Lifecycle
onMounted(async () => {
  // Add event listeners for user interaction
  window.addEventListener('click', handleUserInteraction)
  window.addEventListener('scroll', handleUserInteraction)
  window.addEventListener('keydown', handleUserInteraction)
  
  await loadAssistencia()
})

onBeforeUnmount(() => {
  cancelAutoRetry()
  window.removeEventListener('click', handleUserInteraction)
  window.removeEventListener('scroll', handleUserInteraction)
  window.removeEventListener('keydown', handleUserInteraction)
})
</script>

<style scoped>
.assistencia-detail-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
}

.detail-header {
  margin-bottom: 1rem;
}

.loading-state {
  background: white;
  padding: 3rem 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
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

.assistencia-detail {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.detail-section {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.detail-section:last-child {
  border-bottom: none;
}

.header-section {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  color: white;
  padding: 2rem 1.5rem;
}

.assistencia-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.assistencia-title h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
}

.assistencia-tipo {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.assistencia-status {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.status-badge, .value-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.detail-section h2 {
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--primary-color);
  padding-bottom: 0.5rem;
}

.value-note {
  background: #e7f3ff;
  border-left: 4px solid #2196F3;
  padding: 0.75rem 1rem;
  margin: -0.5rem 0 1rem 0;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #1565C0;
  font-weight: 500;
}

.values-section {
  background: #f8fafb;
}

.value-item {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  transition: all 0.2s ease;
}

.value-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.value-base {
  color: var(--primary-color) !important;
  font-size: 1.5rem !important;
  font-weight: 700 !important;
}

.value-with-tax {
  color: #2196F3 !important;
  font-size: 1.5rem !important;
  font-weight: 700 !important;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item label {
  font-weight: 600;
  color: #666;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-item span {
  color: #333;
  font-size: 1rem;
  line-height: 1.4;
}

.detail-item .value {
  font-weight: 600;
  color: #2c3e50;
}

.computed-value {
  font-weight: 600;
  color: var(--primary-color);
  font-style: italic;
}

.text-content {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid var(--primary-color);
  line-height: 1.6;
  color: #333;
}

.system-info {
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.system-info h2 {
  color: #6c757d;
  font-size: 0.9rem;
}

.system-info .detail-item label {
  color: #6c757d;
  font-size: 0.8rem;
}

.system-info .detail-item span {
  color: #6c757d;
  font-size: 0.9rem;
}

.detail-actions {
  padding: 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  background: #f8f9fa;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
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

/* Mobile styles */
@media (max-width: 768px) {
  .assistencia-detail-container {
    padding: 1rem 0.5rem;
  }
  
  .detail-section {
    padding: 1rem;
  }
  
  .header-section {
    padding: 1.5rem 1rem;
  }
  
  .assistencia-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .assistencia-title h1 {
    font-size: 1.5rem;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .detail-actions {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .detail-section {
    padding: 0.75rem;
  }
  
  .header-section {
    padding: 1rem 0.75rem;
  }
  
  .assistencia-title h1 {
    font-size: 1.25rem;
  }
  
  .detail-section h2 {
    font-size: 1rem;
  }
}
</style>
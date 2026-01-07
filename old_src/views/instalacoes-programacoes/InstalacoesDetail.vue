<template>
  <div class="instalacao-detail">
    <!-- Header -->
    <div class="detail-header">
      <BackButton variant="inline" />
      <div class="header-content">
        <h1 v-if="instalacao">{{ instalacao.nomeCliente }}</h1>
        <div v-if="instalacao" class="header-meta">
          <span class="status-badge" :class="getStatusClass(instalacao)">
            {{ getStatusText(instalacao) }}
          </span>
          <span class="year-badge">{{ year }}</span>
        </div>
      </div>
      <div v-if="instalacao" class="header-actions">
        <router-link 
          :to="{ name: 'instalacao-form', params: { year, id } }" 
          class="btn btn-primary"
        >
          ✏️ Editar
        </router-link>
        <button @click="confirmDelete" class="btn btn-danger">
          🗑️ Eliminar
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="instalacoesStore.loading" class="loading">
      Carregando instalação...
    </div>

    <!-- Error State -->
    <div v-else-if="instalacoesStore.error" class="error">
      Erro: {{ instalacoesStore.error }}
      <button @click="retry" class="btn btn-primary btn-sm">Tentar novamente</button>
    </div>

    <!-- Installation Details -->
    <div v-else-if="instalacao" class="detail-content">
      <!-- Basic Information -->
      <div class="detail-section">
        <h2>INFORMAÇÕES BÁSICAS</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>NOME DO CLIENTE:</label>
            <span>{{ instalacao.nomeCliente || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <label>NÚMERO DA ENCOMENDA:</label>
            <span>{{ instalacao.numeroEncomenda || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <label>DATA DE RECEPÇÃO:</label>
            <span>{{ formatDateTime(instalacao.dataRecepcao) || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <label>TÉCNICO DA INSTALAÇÃO:</label>
            <span>{{ instalacao.tecnicoInstalacao || 'N/A' }}</span>
          </div>
        </div>
      </div>

      <!-- Installation Details -->
      <div class="detail-section">
        <h2>DETALHES DA INSTALAÇÃO</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>DATA DA INSTALAÇÃO:</label>
            <span>{{ formatDateTime(instalacao.dataInstalacao) || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <label>DATA FINAL DA INSTALAÇÃO:</label>
            <span>{{ formatDateTime(instalacao.dataFinalInstalacao) || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <label>TRANSFORMADOR:</label>
            <span>{{ instalacao.transformador ? 'SIM' : 'NÃO' }}</span>
          </div>
          <div class="info-item">
            <label>CABO DE ALIMENTAÇÃO:</label>
            <span>{{ instalacao.caboAlimentacao ? 'SIM' : 'NÃO' }}</span>
          </div>
          <div class="info-item">
            <label>INSTALAÇÃO DE CÂMERAS:</label>
            <span>{{ instalacao.instalacaoCameras ? 'SIM' : 'NÃO' }}</span>
          </div>
          <div class="info-item">
            <label>QUANTIDADE DE CÂMERAS INSTALADAS:</label>
            <span>{{ instalacao.quantidadeCamerasInstaladas || 'N/A' }}</span>
          </div>
          <div class="info-item full-width">
            <label>EQUIPAMENTOS UTILIZADOS E MODELOS:</label>
            <div class="equipment-text">
              {{ instalacao.equipamentosUtilizados || 'N/A' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Programming Section -->
      <div class="detail-section">
        <h2>PROGRAMAÇÃO</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>PROGRAMADO:</label>
            <span>{{ instalacao.programado ? 'SIM' : 'NÃO' }}</span>
          </div>
          <div class="info-item" v-if="instalacao.programado">
            <label>DATA DA PROGRAMAÇÃO:</label>
            <span>{{ formatDateTime(instalacao.dataProgramacao) || 'N/A' }}</span>
          </div>
          <div class="info-item" v-if="instalacao.programado">
            <label>FINAL DA PROGRAMAÇÃO:</label>
            <span>{{ formatDateTime(instalacao.finalProgramacao) || 'N/A' }}</span>
          </div>
          <div class="info-item" v-if="instalacao.programado">
            <label>PROGRAMADO POR:</label>
            <span>{{ instalacao.programadoPor || 'N/A' }}</span>
          </div>
          <div class="info-item" v-if="instalacao.programado">
            <label>PROGRAMADO EMPRESA:</label>
            <span>{{ instalacao.programadoEmpresa || 'N/A' }}</span>
          </div>
          <div class="info-item" v-if="instalacao.programado">
            <label>QUAL SISTEMA:</label>
            <span>{{ instalacao.qualSistema || 'N/A' }}</span>
          </div>
        </div>
      </div>

      <!-- Equipment Section -->
      <div class="detail-section" v-if="instalacao.programado">
        <h2>EQUIPAMENTO</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>EQUIPAMENTO:</label>
            <span>{{ instalacao.equipamento || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <label>MODELO EQUIPAMENTO:</label>
            <span>{{ instalacao.modeloEquipamento || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <label>NÚMERO DE SÉRIE DO EQUIPAMENTO:</label>
            <span>{{ instalacao.numeroSerieEquipamento || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <label>NÚMERO DE SÉRIE:</label>
            <span>{{ instalacao.numeroSerie || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <label>MODELO:</label>
            <span>{{ instalacao.modelo || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <label>VERSÃO DO SISTEMA:</label>
            <span>{{ instalacao.versaoSistema || 'N/A' }}</span>
          </div>
        </div>
      </div>

      <!-- Tests and Configuration Section -->
      <div class="detail-section" v-if="instalacao.programado">
        <h2>TESTES E CONFIGURAÇÃO</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>TESTOU EQUIPAMENTO:</label>
            <span>{{ instalacao.testouEquipamento ? 'SIM' : 'NÃO' }}</span>
          </div>
          <div class="info-item">
            <label>ASSISTÊNCIA REMOTA:</label>
            <span>{{ instalacao.assistenciaRemota ? 'SIM' : 'NÃO' }}</span>
          </div>
          <div class="info-item">
            <label>PREPARAÇÃO DOS PERIFÉRICOS:</label>
            <span>{{ instalacao.preparacaoPerificos ? 'SIM' : 'NÃO' }}</span>
          </div>
          <div class="info-item">
            <label>INSTALAÇÃO DE POS E CPA:</label>
            <span>{{ instalacao.instalacaoPosECpa ? 'SIM' : 'NÃO' }}</span>
          </div>
          <div class="info-item">
            <label>MOVIMENTOS A ZERO:</label>
            <span>{{ instalacao.movimentosZero ? 'SIM' : 'NÃO' }}</span>
          </div>
          <div class="info-item">
            <label>ANYDESK:</label>
            <span>{{ instalacao.anydesk || 'N/A' }}</span>
          </div>
          <div class="info-item full-width">
            <label>TESTES:</label>
            <span>{{ instalacao.testes || 'N/A' }}</span>
          </div>
        </div>
      </div>

      <!-- Training Section -->
      <div class="detail-section" v-if="instalacao.programado">
        <h2>FORMAÇÃO</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>FORMAÇÃO:</label>
            <span>{{ instalacao.formacao ? 'SIM' : 'NÃO' }}</span>
          </div>
          <div class="info-item" v-if="instalacao.formacao">
            <label>QUEM RECEBEU FORMAÇÃO:</label>
            <span>{{ instalacao.quemRecebeuFormacao || 'N/A' }}</span>
          </div>
          <div class="info-item" v-if="instalacao.formacao">
            <label>TESTE PÓS FORMAÇÃO:</label>
            <span>{{ instalacao.testePosFomacao ? 'SIM' : 'NÃO' }}</span>
          </div>
        </div>
      </div>

      <!-- Signature Section -->
      <div class="detail-section">
        <h2>ASSINATURA</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>ASSINA:</label>
            <span>{{ instalacao.assina ? 'SIM' : 'NÃO' }}</span>
          </div>
          <div class="info-item" v-if="instalacao.assina">
            <label>QUEM ASSINOU:</label>
            <span>{{ instalacao.quemAssinou || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <label>ASSINATURA (URL):</label>
            <span v-if="instalacao.assinatura">
              <a :href="instalacao.assinatura" target="_blank" class="signature-link">
                Ver Assinatura
              </a>
            </span>
            <span v-else>N/A</span>
          </div>
          <div class="info-item">
            <label>ANEXAR IMAGEM (URL):</label>
            <span v-if="instalacao.anexarImagem">
              <a :href="instalacao.anexarImagem" target="_blank" class="signature-link">
                Ver Imagem
              </a>
            </span>
            <span v-else>N/A</span>
          </div>
        </div>
      </div>

      <!-- Timestamps -->
      <div class="detail-section">
        <h2>Informações do Sistema</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>Criado em:</label>
            <span>{{ formatDateTime(instalacao.createdAt) }}</span>
          </div>
          <div class="info-item">
            <label>Última atualização:</label>
            <span>{{ formatDateTime(instalacao.updatedAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else class="no-data">
      <div class="no-data-content">
        <div class="no-data-icon">❌</div>
        <h3>Instalação não encontrada</h3>
        <p>A instalação pode ainda não estar disponível no sistema. Tentar novamente?</p>
        <div class="retry-actions">
          <button @click="retryLoad" class="btn btn-primary" :disabled="instalacoesStore.loading">
            {{ instalacoesStore.loading ? 'A carregar...' : 'Tentar novamente' }}
          </button>
          <router-link to="/instalacoes-programacoes" class="btn btn-secondary">
            Voltar à Lista
          </router-link>
        </div>
        <p v-if="autoRetryCountdown > 0" class="auto-retry-info">
          Tentativa automática em {{ autoRetryCountdown }}s...
        </p>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="cancelDelete">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Confirmar Eliminação</h3>
        </div>
        <div class="modal-body">
          <p>Tem a certeza que deseja eliminar esta instalação?</p>
          <p><strong>{{ instalacao?.nomeCliente }}</strong></p>
          <p class="warning">Esta ação não pode ser desfeita.</p>
        </div>
        <div class="modal-footer">
          <button @click="cancelDelete" class="btn btn-secondary">Cancelar</button>
          <button @click="deleteInstalacao" class="btn btn-danger" :disabled="deleting">
            {{ deleting ? 'Eliminando...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInstalacoesStore } from '@/stores/instalacoes-programacoes'
import BackButton from '@/components/BackButton.vue'

// Router
const route = useRoute()
const router = useRouter()

// Store
const instalacoesStore = useInstalacoesStore()

// Reactive data
const showDeleteModal = ref(false)
const deleting = ref(false)

// Auto-retry state
const autoRetryCountdown = ref(0)
const userInteractionCancelled = ref(false)
const retryTimeoutId = ref(null)

// Computed
const year = computed(() => route.params.year)
const id = computed(() => route.params.id)
const instalacao = computed(() => instalacoesStore.selectedInstalacao)

// Methods
const getStatusClass = (instalacao) => {
  const status = instalacoesStore.getInstallationStatus(instalacao)
  switch (status) {
    case 'completed': return 'status-completed'
    case 'in-progress': return 'status-in-progress'
    default: return 'status-not-started'
  }
}

const getStatusText = (instalacao) => {
  if (instalacao.dataFinalInstalacao) {
    return 'Concluída'
  } else if (instalacao.dataInstalacao) {
    return 'Em Progresso'
  }
  return 'Agendada'
}

const formatDateTime = (dateString) => {
  return instalacoesStore.formatDateTime(dateString)
}

const confirmDelete = () => {
  showDeleteModal.value = true
}

const cancelDelete = () => {
  showDeleteModal.value = false
}

const deleteInstalacao = async () => {
  try {
    deleting.value = true
    await instalacoesStore.deleteInstalacao(year.value, id.value)
    router.push('/instalacoes-programacoes')
  } catch (error) {
    console.error('Error deleting instalacao:', error)
    // Error is already handled by the store
  } finally {
    deleting.value = false
    showDeleteModal.value = false
  }
}

const retry = async () => {
  instalacoesStore.clearError()
  await loadInstalacao()
}

const retryLoad = () => {
  userInteractionCancelled.value = true
  cancelAutoRetry()
  loadInstalacao()
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
      loadInstalacao()
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

const loadInstalacao = async () => {
  try {
    instalacoesStore.clearError()
    await instalacoesStore.fetchInstalacaoById(year.value, id.value)
    // If successful, cancel any pending retries
    cancelAutoRetry()
  } catch (error) {
    console.error('Error loading instalacao:', error)
    // Check if it's a 404 or "not found" error
    const isNotFound = error?.message?.toLowerCase().includes('not found') || 
                       instalacoesStore.error?.toLowerCase().includes('not found')
    
    if (isNotFound && !userInteractionCancelled.value) {
      // Start auto-retry countdown
      startAutoRetry()
    }
  }
}

// Watch for successful data load to cancel retries
watch(() => instalacao.value?.id, (newId) => {
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
  
  await loadInstalacao()
})

onBeforeUnmount(() => {
  cancelAutoRetry()
  window.removeEventListener('click', handleUserInteraction)
  window.removeEventListener('scroll', handleUserInteraction)
  window.removeEventListener('keydown', handleUserInteraction)
})
</script>

<style scoped>
.instalacao-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.header-content {
  flex: 1;
  min-width: 200px;
}

.header-content h1 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.8rem;
}

.header-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
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

.year-badge {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  font-size: 0.9rem;
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

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
}

.loading, .error, .no-data {
  text-align: center;
  padding: 3rem 1rem;
  color: #7f8c8d;
}

.error {
  color: #e74c3c;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.detail-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.detail-section h2 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-size: 1.3rem;
  border-bottom: 2px solid #ecf0f1;
  padding-bottom: 0.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item label {
  font-weight: 600;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.info-item span {
  color: #2c3e50;
  font-size: 0.95rem;
}

.equipment-text {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid var(--primary-color);
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 0.85rem;
  line-height: 1.4;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.feature-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.feature-card.active {
  border-color: var(--primary-color);
  background: rgba(117, 174, 147, 0.1);
}

.feature-icon {
  font-size: 1.5rem;
  opacity: 0.7;
}

.feature-card.active .feature-icon {
  opacity: 1;
}

.feature-content h4 {
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
  font-size: 0.9rem;
}

.feature-content span {
  color: #7f8c8d;
  font-size: 0.85rem;
}

.feature-card.active .feature-content span {
  color: #2c3e50;
  font-weight: 500;
}

.status-yes {
  color: #27ae60;
  font-weight: 600;
}

.signature-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.signature-link:hover {
  text-decoration: underline;
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

.retry-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
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
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #ecf0f1;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  margin: 0 0 1rem 0;
  color: #5a6c7d;
}

.modal-body .warning {
  color: #e74c3c;
  font-weight: 500;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #ecf0f1;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* Mobile styles */
@media (max-width: 768px) {
  .detail-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-content h1 {
    font-size: 1.5rem;
  }
  
  .header-actions {
    justify-content: stretch;
  }
  
  .header-actions .btn {
    flex: 1;
    justify-content: center;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .feature-card {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .instalacao-detail {
    padding: 0.75rem;
  }
  
  .detail-section {
    padding: 1rem;
  }
  
  .modal {
    margin: 1rem;
    width: calc(100% - 2rem);
  }
}
</style>

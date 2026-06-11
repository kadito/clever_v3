<template>
  <div class="contrato-detail-container">
    <div class="detail-header">
      <BackButton
        to="/contratos/list"
        variant="inline"
      />
      <h1>Detalhes do Contrato</h1>
    </div>

    <!-- Loading state -->
    <div
      v-if="loading"
      class="loading-state"
    >
      <p>A carregar contrato...</p>
    </div>

    <!-- Error state (non-not-found errors) -->
    <div
      v-if="error && error.toLowerCase().includes('not found') === false"
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

    <!-- Not found state -->
    <div
      v-if="!loading && (!contrato || (error && error.toLowerCase().includes('not found')))"
      class="not-found-state"
    >
      <h2>Contrato não encontrado</h2>
      <p>O contrato pode ainda não estar disponível no sistema. Tentar novamente?</p>
      <div class="retry-actions">
        <button
          class="retry-btn"
          :disabled="loading"
          @click="retryLoad"
        >
          {{ loading ? 'A carregar...' : 'Tentar novamente' }}
        </button>
        <BackButton
          to="/contratos/list"
          variant="full-width"
        />
      </div>
      <p
        v-if="autoRetryCountdown > 0"
        class="auto-retry-info"
      >
        Tentativa automática em {{ autoRetryCountdown }}s...
      </p>
    </div>

    <!-- Contract Details -->
    <div
      v-if="contrato"
      class="contrato-detail"
    >
      <!-- Header with actions -->
      <div class="detail-actions">
        <h2>{{ clienteData?.nomeComercial || 'Contrato' }}</h2>
        <button
          class="btn btn-edit"
          @click="navigateToEdit"
        >
          ✏️ Editar
        </button>
      </div>

      <!-- Basic Information Section -->
      <section class="detail-section">
        <h3>INFORMAÇÃO BÁSICA</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>NOME DA EMPRESA:</label>
            <span>{{ clienteData?.nomeEmpresa || 'N/A' }}</span>
          </div>
          <div class="detail-item">
            <label>NOME COMERCIAL:</label>
            <span>{{ clienteData?.nomeComercial || 'N/A' }}</span>
          </div>
          <div class="detail-item">
            <label>CONTRIBUINTE:</label>
            <span>{{ clienteData?.contribuinte || 'N/A' }}</span>
          </div>
          <div class="detail-item">
            <label>RESPONSÁVEL:</label>
            <span>{{ clienteData?.responsavel || 'N/A' }}</span>
          </div>
        </div>
      </section>

      <!-- Contact Information Section -->
      <section class="detail-section">
        <h3>CONTACTOS</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>CONTACTO:</label>
            <span>{{ clienteData?.telefoneContato || clienteData?.telefone || 'N/A' }}</span>
          </div>
          <div class="detail-item">
            <label>E-MAIL:</label>
            <span>{{ clienteData?.email || 'N/A' }}</span>
          </div>
          <div class="detail-item full-width">
            <label>MORADA:</label>
            <span>{{ clienteData?.morada || 'N/A' }}</span>
          </div>
        </div>
      </section>

      <!-- Contract Plan Section -->
      <section class="detail-section">
        <h3>PLANOS DE CONTRATO</h3>

        <!-- CPA Contract -->
        <div
          v-if="contrato.hasCPAContract"
          class="contract-plan-subsection"
        >
          <h4 class="contract-subsection-title">
            {{
              contrato.cpaContractType === 'CPA_1500'
                ? 'CPA - Cashlogy (1500)'
                : 'CPA - Cashlogy (2023)'
            }}
          </h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>PLANO CPA:</label>
              <span class="plan-name">{{ getCPAPlanName(contrato.planIdCPA) }}</span>
            </div>
            <div
              v-if="contrato.modalidadePagamentoCPA"
              class="detail-item"
            >
              <label>MODALIDADE DE PAGAMENTO:</label>
              <span class="payment-method">{{
                formatPaymentMethod(contrato.modalidadePagamentoCPA)
              }}</span>
            </div>
            <div
              v-if="contrato.distanceCPA"
              class="detail-item"
            >
              <label>DISTÂNCIA:</label>
              <span>{{
                contrato.distanceCPA === 'under180km' ? 'Menos de 180 km' : 'Mais de 180 km'
              }}</span>
            </div>
            <div
              v-if="contrato.planoCPA"
              class="detail-item full-width"
            >
              <label>DESCRIÇÃO:</label>
              <div class="contract-plan">
                {{ contrato.planoCPA }}
              </div>
            </div>

            <!-- POS Package (only for CPA_1500 PREMIUM) -->
            <div
              v-if="
                contrato.hasPOSPackage &&
                  contrato.cpaContractType === 'CPA_1500' &&
                  contrato.planIdCPA === 'cpa_1500_premium'
              "
              class="detail-item full-width"
            >
              <label>PACK ADICIONAL:</label>
              <div class="pos-package-badge">
                <span class="package-icon">📦</span>
                <span class="package-text">Pack de 10h de assistência para POS (+100,00€/ano)</span>
              </div>
            </div>
          </div>

          <!-- CPA Equipment Info -->
          <div
            v-if="hasAnyCPAEquipment"
            class="equipment-subsection"
          >
            <h5>Equipamentos CPA</h5>

            <!-- New format: Multiple equipments -->
            <div v-if="contrato.cpaEquipments && contrato.cpaEquipments.length > 0">
              <div
                v-for="(equipment, index) in contrato.cpaEquipments"
                :key="equipment.id || index"
                class="equipment-detail-card"
              >
                <h6 class="equipment-title">
                  Equipamento {{ index + 1 }}
                </h6>
                <div class="detail-grid">
                  <div
                    v-if="equipment.modelo"
                    class="detail-item"
                  >
                    <label>MODELO:</label>
                    <span>{{ equipment.modelo }}</span>
                  </div>
                  <div
                    v-if="equipment.numeroSerie"
                    class="detail-item"
                  >
                    <label>Nº SÉRIE:</label>
                    <span>{{ equipment.numeroSerie }}</span>
                  </div>
                  <!-- Discount only shown for 2nd equipment onwards (N+1) -->
                  <div
                    v-if="index > 0 && equipment.desconto > 0"
                    class="detail-item"
                  >
                    <label>DESCONTO:</label>
                    <span class="discount-badge">{{ equipment.desconto }}%</span>
                  </div>
                  <div
                    v-if="equipment.observacoes"
                    class="detail-item full-width"
                  >
                    <label>OBSERVAÇÕES:</label>
                    <span>{{ equipment.observacoes }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Old format: Single equipment (for backward compatibility) -->
            <div
              v-else-if="contrato.modeloCPA || contrato.numeroSerieCPA"
              class="equipment-detail-card"
            >
              <h6 class="equipment-title">
                Equipamento
              </h6>
              <div class="detail-grid">
                <div
                  v-if="contrato.modeloCPA"
                  class="detail-item"
                >
                  <label>MODELO:</label>
                  <span>{{ contrato.modeloCPA }}</span>
                </div>
                <div
                  v-if="contrato.numeroSerieCPA"
                  class="detail-item"
                >
                  <label>Nº SÉRIE:</label>
                  <span>{{ contrato.numeroSerieCPA }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- CPA Contract Dates -->
          <div
            v-if="contrato.inicioContratoCPA || contrato.fimContratoCPA"
            class="equipment-subsection"
          >
            <h5>Datas do Contrato</h5>
            <div class="detail-grid">
              <div
                v-if="contrato.inicioContratoCPA"
                class="detail-item"
              >
                <label>INÍCIO DE CONTRATO:</label>
                <span>{{ formatDate(contrato.inicioContratoCPA) }}</span>
              </div>
              <div
                v-if="contrato.fimContratoCPA"
                class="detail-item"
              >
                <label>FIM DE CONTRATO:</label>
                <span>{{ formatDate(contrato.fimContratoCPA) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- S&H Contract -->
        <div
          v-if="contrato.hasSHContract"
          class="contract-plan-subsection"
        >
          <h4 class="contract-subsection-title">
            S&H - Software e Hardware
          </h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>PLANO S&H:</label>
              <span class="plan-name">{{ getSHPlanName(contrato.planIdSH) }}</span>
            </div>
            <div
              v-if="contrato.modalidadePagamentoSH"
              class="detail-item"
            >
              <label>MODALIDADE DE PAGAMENTO:</label>
              <span class="payment-method">{{
                formatPaymentMethod(contrato.modalidadePagamentoSH)
              }}</span>
            </div>
            <div
              v-if="contrato.planoSH"
              class="detail-item full-width"
            >
              <label>DESCRIÇÃO:</label>
              <div class="contract-plan">
                {{ contrato.planoSH }}
              </div>
            </div>
          </div>

          <!-- S&H Equipment Info -->
          <div
            v-if="contrato.modeloPSO || contrato.numeroSeriePSO || contrato.softwarePSO"
            class="equipment-subsection"
          >
            <h5>Informação do Equipamento</h5>
            <div class="detail-grid">
              <div
                v-if="contrato.modeloPSO"
                class="detail-item"
              >
                <label>MODELO:</label>
                <span>{{ contrato.modeloPSO }}</span>
              </div>
              <div
                v-if="contrato.numeroSeriePSO"
                class="detail-item"
              >
                <label>Nº SÉRIE:</label>
                <span>{{ contrato.numeroSeriePSO }}</span>
              </div>
              <div
                v-if="contrato.softwarePSO"
                class="detail-item"
              >
                <label>SOFTWARE:</label>
                <span>{{ contrato.softwarePSO }}</span>
              </div>
            </div>
          </div>

          <!-- S&H Contract Dates -->
          <div
            v-if="contrato.inicioContratoSH || contrato.fimContratoSH"
            class="equipment-subsection"
          >
            <h5>Datas do Contrato</h5>
            <div class="detail-grid">
              <div
                v-if="contrato.inicioContratoSH"
                class="detail-item"
              >
                <label>INÍCIO DE CONTRATO:</label>
                <span>{{ formatDate(contrato.inicioContratoSH) }}</span>
              </div>
              <div
                v-if="contrato.fimContratoSH"
                class="detail-item"
              >
                <label>FIM DE CONTRATO:</label>
                <span>{{ formatDate(contrato.fimContratoSH) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Legacy support for old contracts -->
        <div
          v-if="!contrato.hasCPAContract && !contrato.hasSHContract && contrato.planoContrato"
          class="detail-grid"
        >
          <div class="detail-item full-width">
            <label>DESCRIÇÃO DO PLANO (LEGADO):</label>
            <div class="contract-plan">
              {{ contrato.planoContrato }}
            </div>
          </div>
        </div>

        <!-- No contracts -->
        <div
          v-if="!contrato.hasCPAContract && !contrato.hasSHContract && !contrato.planoContrato"
          class="no-contracts-message"
        >
          Nenhum plano de contrato definido
        </div>
      </section>

      <!-- Service Details Section -->
      <section class="detail-section">
        <h3>DETALHES DO SERVIÇO</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>HORAS ASSISTÊNCIA ANUAL:</label>
            <span>{{ contrato.horasAssistenciaAnual || 'N/A' }}</span>
          </div>
          <div class="detail-item">
            <label>DESLOCAÇÕES POR ANO:</label>
            <span>{{ contrato.deslocacoesPorAno || 'N/A' }}</span>
          </div>
          <div class="detail-item">
            <label>MANUTENÇÕES POR ANO:</label>
            <span>{{ contrato.manutencoesPorAno || 'N/A' }}</span>
          </div>
        </div>
      </section>

      <!-- Additional Information Section -->
      <section
        v-if="contrato.metodoPagamento"
        class="detail-section"
      >
        <h3>INFORMAÇÃO ADICIONAL</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>MÉTODO DE PAGAMENTO:</label>
            <span class="payment-method">{{
              formatPaymentMethodFull(contrato.metodoPagamento)
            }}</span>
          </div>
        </div>
      </section>

      <!-- Metadata Section -->
      <section class="detail-section metadata-section">
        <h3>Informação do Sistema</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>ID:</label>
            <span>{{ contrato.id }}</span>
          </div>
          <div class="detail-item">
            <label>Criado em:</label>
            <span>{{ formatDateTime(contrato.createdAt) }}</span>
          </div>
          <div class="detail-item">
            <label>Atualizado em:</label>
            <span>{{ formatDateTime(contrato.updatedAt) }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import BackButton from '@/components/BackButton.vue';
import { useContratosStore } from '@/stores/contratos.js';
import { useClientesStore } from '@/stores/clientes.js';
import contractPlans from '@/config/contract-plans.json';

// Router
const route = useRoute();
const router = useRouter();

// Stores
const store = useContratosStore();
const { loading, error, selectedContrato, currentYear } = storeToRefs(store);
const { fetchContratoById, clearError } = store;

const clientesStore = useClientesStore();
const { fetchClienteById } = clientesStore;

// Local refs
const contrato = computed(() => selectedContrato.value);
const clienteData = ref(null);

// Auto-retry state
const autoRetryCountdown = ref(0);
const userInteractionCancelled = ref(false);
const retryTimeoutId = ref(null);

// Computed properties
const hasAdditionalInfo = computed(() => {
  return (
    contrato.value &&
    (contrato.value.planoContratoSoftHard ||
      contrato.value.modelo180 ||
      contrato.value.modeloSoftware)
  );
});

const hasAnyCPAEquipment = computed(() => {
  if (!contrato.value) return false;

  // Check new format (array of equipments)
  if (contrato.value.cpaEquipments && contrato.value.cpaEquipments.length > 0) {
    return true;
  }

  // Check old format (single equipment fields)
  return !!(contrato.value.modeloCPA || contrato.value.numeroSerieCPA);
});

// Methods
const navigateToEdit = () => {
  const year = route.query.year || currentYear.value;
  router.push(`/contratos/${contrato.value.id}/edit?year=${year}`);
};

const getCPAPlanName = planId => {
  if (!planId) return 'N/A';

  // Check which contract type this is
  const contractType = contrato.value?.cpaContractType || 'CPA';
  const plans = contractPlans[contractType]?.plans || [];
  const plan = plans.find(p => p.id === planId);
  return plan?.name || 'N/A';
};

const getSHPlanName = planId => {
  if (!planId) return 'N/A';
  const plans = contractPlans['S&H']?.plans || [];
  const plan = plans.find(p => p.id === planId);
  return plan?.name || 'N/A';
};

const formatPaymentMethod = method => {
  const methods = {
    MENSAL: 'Mensal',
    TRIMESTRAL: 'Trimestral',
    SEMESTRAL: 'Semestral',
    ANUAL: 'Anual',
  };
  return methods[method] || method;
};

const formatPaymentMethodFull = method => {
  const methods = {
    TRANSFERENCIA_BANCARIA: 'Transferência Bancária',
    DEBITO_DIRETO: 'Débito Direto',
    MULTIBANCO: 'Multibanco',
    CHEQUE: 'Cheque',
    NUMERARIO: 'Numerário',
    MB_WAY: 'MB WAY',
  };
  return methods[method] || method;
};

const formatDate = dateString => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('pt-PT');
};

const formatDateTime = dateTimeString => {
  if (!dateTimeString) return '';
  return new Date(dateTimeString).toLocaleString('pt-PT');
};

// Lifecycle
onMounted(async () => {
  // Add event listeners for user interaction after a delay
  // This prevents navigation events from cancelling the retry
  setTimeout(() => {
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('scroll', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
  }, 500);

  await loadContrato();
});

onBeforeUnmount(() => {
  cancelAutoRetry();
  window.removeEventListener('click', handleUserInteraction);
  window.removeEventListener('scroll', handleUserInteraction);
  window.removeEventListener('keydown', handleUserInteraction);
});

// Methods
const loadContrato = async () => {
  const year = route.query.year || currentYear.value;
  const id = route.params.id;

  console.log('Loading contrato detail:', { id, year });

  try {
    clearError();
    await fetchContratoById(year, id);
    // If successful, cancel any pending retries
    cancelAutoRetry();
    userInteractionCancelled.value = false;

    // Fetch client data if contrato has clienteId
    if (contrato.value && contrato.value.clienteId) {
      console.log('Fetching client data for clienteId:', contrato.value.clienteId);
      try {
        clienteData.value = await fetchClienteById(contrato.value.clienteId);
        console.log('Client data loaded:', clienteData.value);
      } catch (clientErr) {
        console.error('Error loading client data:', clientErr);
        // Continue anyway - contrato data is loaded
      }
    }
  } catch (err) {
    console.error('Error loading contrato:', err);

    // Wait a bit for error to be set in store
    await new Promise(resolve => setTimeout(resolve, 50));

    // Check if it's a 404 or "not found" error
    const errorMessage = err.message || error.value || '';
    const isNotFound = errorMessage.toLowerCase().includes('not found');

    if (isNotFound && !userInteractionCancelled.value) {
      // Only start retry if not already running
      if (autoRetryCountdown.value === 0 && !retryTimeoutId.value) {
        console.log('Not found error detected in loadContrato, starting auto-retry');
        // Start auto-retry countdown
        startAutoRetry();
      }
    }
  }
};

const retryLoad = () => {
  userInteractionCancelled.value = true;
  cancelAutoRetry();
  loadContrato();
};

const startAutoRetry = () => {
  cancelAutoRetry();
  userInteractionCancelled.value = false;
  autoRetryCountdown.value = 10;

  console.log('Starting auto-retry countdown:', autoRetryCountdown.value);

  const updateCountdown = () => {
    if (userInteractionCancelled.value) {
      console.log('Auto-retry cancelled by user interaction');
      return;
    }

    if (autoRetryCountdown.value > 0) {
      autoRetryCountdown.value--;
      console.log('Auto-retry countdown:', autoRetryCountdown.value);
      retryTimeoutId.value = setTimeout(updateCountdown, 1000);
    } else {
      // Auto-retry after countdown reaches 0
      console.log('Auto-retry countdown finished, loading contrato...');
      retryTimeoutId.value = null; // Clear the timeout ID
      loadContrato();
    }
  };

  retryTimeoutId.value = setTimeout(updateCountdown, 1000);
};

const cancelAutoRetry = () => {
  if (retryTimeoutId.value) {
    console.log('Cancelling auto-retry timeout:', retryTimeoutId.value);
    clearTimeout(retryTimeoutId.value);
    retryTimeoutId.value = null;
  }
  if (autoRetryCountdown.value > 0) {
    console.log('Resetting auto-retry countdown from', autoRetryCountdown.value, 'to 0');
  }
  autoRetryCountdown.value = 0;
};

const handleUserInteraction = () => {
  userInteractionCancelled.value = true;
  cancelAutoRetry();
};

// Watch for successful data load to cancel retries
watch(
  () => contrato.value?.id,
  newId => {
    if (newId) {
      cancelAutoRetry();
      userInteractionCancelled.value = false;
    }
  }
);

// Watch for "not found" state to start retry
watch(
  [loading, error, () => contrato.value],
  ([isLoading, err, contratoData]) => {
    // If loading finished, no contrato, and we have a route param (meaning we're expecting data)
    if (!isLoading && !contratoData && route.params.id && !userInteractionCancelled.value) {
      const errorMessage = err || '';
      const isNotFound = errorMessage.toLowerCase().includes('not found') || errorMessage === '';

      // Start retry if we have a "not found" error or if loading finished without data
      // Only start if retry isn't already running (countdown is 0 and no timeout is set)
      if (isNotFound && autoRetryCountdown.value === 0 && !retryTimeoutId.value) {
        console.log('Watch detected not found state, starting auto-retry');
        // Use setTimeout to ensure error state is fully updated
        setTimeout(() => {
          if (
            !userInteractionCancelled.value &&
            autoRetryCountdown.value === 0 &&
            !contrato.value &&
            !retryTimeoutId.value
          ) {
            startAutoRetry();
          }
        }, 100);
      }
    }
  },
  { immediate: false }
);
</script>

<style scoped>
.contrato-detail-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
  background: #f5f5f5;
  min-height: 100vh;
}

.detail-header {
  text-align: center;
  margin-bottom: 2rem;
}

.detail-header h1 {
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
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

.retry-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s ease;
  min-width: 180px;
}

.retry-btn:hover:not(:disabled) {
  background: var(--primary-hover);
}

.retry-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auto-retry-info {
  color: #666;
  font-size: 0.9rem;
  font-style: italic;
  margin-top: 1rem;
}

.contrato-detail {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.detail-actions {
  background: var(--primary-color);
  color: white;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-actions h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.btn-edit {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-edit:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.detail-section {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.detail-section:last-child {
  border-bottom: none;
}

.detail-section h3 {
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-note {
  color: #6c757d;
  font-size: 0.9rem;
  font-style: italic;
  margin: -0.5rem 0 1rem 0;
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border-left: 3px solid var(--primary-color);
  border-radius: 4px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-weight: 600;
  color: #666;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-item span {
  color: #333;
  font-size: 1rem;
  word-break: break-word;
}

.contract-plan {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid var(--primary-color);
  white-space: pre-wrap;
  font-size: 0.95rem;
  line-height: 1.5;
}

.contract-type {
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-block;
}

.plan-name {
  background: var(--primary-light);
  color: var(--primary-dark);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 700;
  display: inline-block;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.payment-method {
  background: #e3f2fd;
  color: #1565c0;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  display: inline-block;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border: 1px solid #90caf9;
}

.contract-plan-subsection {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.contract-plan-subsection:last-child {
  margin-bottom: 0;
}

.contract-subsection-title {
  color: #495057;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #dee2e6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.equipment-subsection {
  background: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
}

.equipment-subsection h5 {
  color: #6c757d;
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* Equipment detail card */
.equipment-detail-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.equipment-detail-card:last-child {
  margin-bottom: 0;
}

.equipment-title {
  color: #495057;
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #dee2e6;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.discount-badge {
  display: inline-block;
  background: #28a745;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
}

.no-contracts-message {
  text-align: center;
  color: #6c757d;
  font-style: italic;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 2px dashed #dee2e6;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-block;
}

.status.active {
  background: #d4edda;
  color: #155724;
}

.status.inactive {
  background: #f8d7da;
  color: #721c24;
}

.metadata-section {
  background: #f8f9fa;
  color: #666;
}

.metadata-section h3 {
  color: #666;
}

.metadata-section .detail-item label {
  color: #888;
}

.metadata-section .detail-item span {
  color: #666;
  font-size: 0.9rem;
}

/* Equipment sections */
.equipment-section {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.equipment-section:last-child {
  margin-bottom: 0;
}

.equipment-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Contract dates sections */
.contract-dates-section {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.contract-dates-section:last-child {
  margin-bottom: 0;
}

.contract-dates-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* POS Package Badge */
.pos-package-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #fff8e1;
  border: 2px solid #ffc107;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-top: 0.5rem;
}

.package-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.package-text {
  color: #856404;
  font-weight: 600;
  font-size: 0.95rem;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .contrato-detail-container {
    padding: 0.5rem;
  }

  .detail-actions {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .detail-actions h2 {
    font-size: 1.25rem;
  }

  .detail-section {
    padding: 1rem;
  }

  .detail-section h3 {
    font-size: 1.1rem;
  }

  .detail-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .contract-plan {
    padding: 0.75rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .detail-header h1 {
    font-size: 1.5rem;
  }

  .detail-actions h2 {
    font-size: 1.1rem;
  }

  .detail-section {
    padding: 0.75rem;
  }

  .detail-section h3 {
    font-size: 1rem;
  }
}
</style>

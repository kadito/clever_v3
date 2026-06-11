<template>
  <div class="folha-detail">
    <div class="detail-header">
      <BackButton
        to="/folhas-obra/list"
        variant="inline"
      />
      <h1>FOLHA DE OBRA</h1>
    </div>

    <!-- Loading state -->
    <div
      v-if="loading"
      class="loading-state"
    >
      <p>A carregar folha de obra...</p>
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="error-state"
    >
      <p>{{ error }}</p>
      <button
        class="retry-btn"
        @click="loadFolhaData"
      >
        Tentar novamente
      </button>
    </div>

    <!-- Content -->
    <div
      v-else-if="folhaData.id"
      class="detail-content"
    >
      <!-- Dados do Cliente Section -->
      <section class="info-section">
        <h2>DADOS DO CLIENTE</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>DESIGNAÇÃO COMERCIAL</label>
            <p>{{ folhaData.client.commercialName }}</p>
          </div>
          <div class="info-item">
            <label>DESIGNAÇÃO SOCIAL</label>
            <p>{{ folhaData.client.socialName }}</p>
          </div>
          <div class="info-item">
            <label>CONTRIBUINTE</label>
            <p>{{ folhaData.client.taxNumber }}</p>
          </div>
          <div class="info-item">
            <label>MORADA</label>
            <p>{{ folhaData.client.address }}</p>
          </div>
          <div class="info-item">
            <label>LOCALIDADE</label>
            <p>{{ folhaData.client.location }}</p>
          </div>
        </div>
      </section>

      <!-- Informação do Pedido Section -->
      <section class="info-section">
        <h2>INFORMAÇÃO DO PEDIDO</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>DATA DO PEDIDO</label>
            <p>{{ formatDate(folhaData.request.date) }}</p>
          </div>
          <div class="info-item">
            <label>RECEÇÃO DO PEDIDO</label>
            <p>{{ folhaData.request.receivedBy }}</p>
          </div>
          <div class="info-item">
            <label>DATA DA ASSISTÊNCIA</label>
            <p>{{ formatDate(folhaData.request.assistanceDate) }}</p>
          </div>
          <div class="info-item full-width">
            <label>MOTIVO DO PEDIDO</label>
            <p>{{ folhaData.request.reason }}</p>
          </div>
        </div>
      </section>

      <!-- Controle de Tempo Section -->
      <section class="info-section">
        <h2>CONTROLO DE TEMPO</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>HORA CHEGADA</label>
            <p>{{ folhaData.request.arrivalTime }}</p>
          </div>
          <div class="info-item">
            <label>HORA SAÍDA</label>
            <p>{{ folhaData.request.departureTime }}</p>
          </div>
          <div class="info-item">
            <label>TOTAL HORAS</label>
            <p>{{ folhaData.request.totalHours }}</p>
          </div>
        </div>
      </section>

      <!-- Tipo de Serviço e Técnico Section -->
      <section class="info-section">
        <h2>TIPO DE SERVIÇO E TÉCNICO</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>TIPO DE SERVIÇO</label>
            <p>{{ folhaData.otherData.serviceType }}</p>
          </div>
          <div class="info-item">
            <label>TÉCNICO RESPONSÁVEL</label>
            <p>{{ folhaData.otherData.technician }}</p>
          </div>
          <div
            v-if="folhaData.otherData.serviceObservations"
            class="info-item full-width"
          >
            <label>OBSERVAÇÕES DO SERVIÇO</label>
            <p>{{ folhaData.otherData.serviceObservations }}</p>
          </div>
        </div>
      </section>

      <!-- Deslocação Section -->
      <section class="info-section">
        <h2>DESLOCAÇÃO</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>DESLOCAÇÃO</label>
            <p>{{ folhaData.displacement.hasDisplacement ? 'SIM' : 'NÃO' }}</p>
          </div>
          <div class="info-item">
            <label>FINAL SEMANA - FERIADO</label>
            <p>{{ folhaData.displacement.weekendHoliday ? 'SIM' : 'NÃO' }}</p>
          </div>
          <div
            v-if="folhaData.displacement.hasDisplacement"
            class="info-item"
          >
            <label>KMS (IDA)</label>
            <p>{{ folhaData.displacement.oneWayKms }} km</p>
          </div>
          <div
            v-if="folhaData.displacement.hasDisplacement"
            class="info-item"
          >
            <label>TOTAL KMS (IDA E VOLTA)</label>
            <p>{{ folhaData.displacement.totalKms }} km</p>
          </div>
        </div>

        <!-- Calculated Pricing - only shown when displacement is true -->
        <div
          v-if="folhaData.displacement.hasDisplacement"
          class="pricing-section"
        >
          <h3>CÁLCULO DE PREÇOS <span class="vat-note">(sem IVA)</span></h3>
          <div class="pricing-table">
            <div class="pricing-row">
              <span class="pricing-label">Taxa Deslocação:</span>
              <span class="pricing-value">{{ getDisplacementRate() }}€ <span class="vat-indicator">sem IVA</span></span>
            </div>
            <div class="pricing-row">
              <span class="pricing-label">Preço KMs:</span>
              <span class="pricing-value">{{ getKmsPrice() }}€ <span class="vat-indicator">sem IVA</span></span>
            </div>
            <div class="pricing-row">
              <span class="pricing-label">Valor Hora:</span>
              <span class="pricing-value">{{ getHourlyRate() }}€ <span class="vat-indicator">sem IVA</span></span>
            </div>
            <div class="pricing-row">
              <span class="pricing-label">Preço Mão Obra:</span>
              <span class="pricing-value">{{ getLaborPrice() }}€ <span class="vat-indicator">sem IVA</span></span>
            </div>
            <div class="pricing-row total">
              <span class="pricing-label">PREÇO TOTAL:</span>
              <span class="pricing-value">{{ getTotalPrice() }}€ <span class="vat-indicator">sem IVA</span></span>
            </div>
          </div>
        </div>
      </section>

      <!-- Método de Pagamento Section -->
      <section class="info-section">
        <h2>MÉTODO DE PAGAMENTO</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>MÉTODO DE PAGAMENTO</label>
            <p>{{ folhaData.displacement.paymentMethod }}</p>
          </div>
        </div>
      </section>

      <!-- Garantia e Contrato Section - only shown when payment method is CONTRATO -->
      <section
        v-if="folhaData.displacement.paymentMethod === 'CONTRATO'"
        class="info-section"
      >
        <h2>GARANTIA E CONTRATO</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>GARANTIA</label>
            <p>{{ folhaData.otherData.warranty ? 'SIM' : 'NÃO' }}</p>
          </div>
          <div class="info-item">
            <label>CONTRATO</label>
            <p>{{ folhaData.otherData.contract ? 'SIM' : 'NÃO' }}</p>
          </div>
          <div
            v-if="folhaData.otherData.contract"
            class="info-item"
          >
            <label>ANO DE CONTRATO</label>
            <p>{{ folhaData.otherData.contractYear }}</p>
          </div>
        </div>
      </section>

      <!-- Material e Equipamentos Section -->
      <section class="info-section">
        <h2>MATERIAL E EQUIPAMENTOS</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>MATERIAL UTILIZADO</label>
            <p>{{ folhaData.otherData.materialUsed ? 'SIM' : 'NÃO' }}</p>
          </div>
          <div class="info-item">
            <label>EQUIPAMENTOS</label>
            <p>{{ folhaData.otherData.equipment ? 'SIM' : 'NÃO' }}</p>
          </div>
          <div
            v-if="folhaData.otherData.materialUsed && folhaData.otherData.materialDetails"
            class="info-item full-width"
          >
            <label>DESCRIÇÃO DO MATERIAL UTILIZADO</label>
            <p>{{ folhaData.otherData.materialDetails }}</p>
          </div>
          <div
            v-if="folhaData.otherData.equipment && folhaData.otherData.equipmentDetails"
            class="info-item full-width"
          >
            <label>DESCRIÇÃO DOS EQUIPAMENTOS</label>
            <p>{{ folhaData.otherData.equipmentDetails }}</p>
          </div>
        </div>
      </section>

      <!-- Estado do Serviço e Operações Técnicas Section -->
      <section class="info-section">
        <h2>ESTADO DO SERVIÇO E OPERAÇÕES TÉCNICAS</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>TOTALMENTE RESOLVIDO</label>
            <p>{{ folhaData.otherData.totallyResolved ? 'SIM' : 'NÃO' }}</p>
          </div>
          <div class="info-item">
            <label>LEITURA DE DUMP</label>
            <p>{{ folhaData.otherData.dumpReading ? 'SIM' : 'NÃO' }}</p>
          </div>
          <div class="info-item">
            <label>CÓPIA DE SEGURANÇA</label>
            <p>{{ folhaData.otherData.backup ? 'SIM' : 'NÃO' }}</p>
          </div>
          <div class="info-item">
            <label>VERIFICAÇÃO DO ACESSO REMOTO</label>
            <p>{{ folhaData.otherData.remoteAccessCheck ? 'SIM' : 'NÃO' }}</p>
          </div>
          <div class="info-item">
            <label>ANYDESK</label>
            <p>{{ folhaData.otherData.anydesk ? 'SIM' : 'NÃO' }}</p>
          </div>
          <div
            v-if="!folhaData.otherData.totallyResolved && folhaData.otherData.resolutionIssues"
            class="info-item full-width"
          >
            <label>OBSERVAÇÕES SOBRE PROBLEMAS NÃO RESOLVIDOS</label>
            <p>{{ folhaData.otherData.resolutionIssues }}</p>
          </div>
        </div>
      </section>

      <!-- Relatório de Serviço Section -->
      <section class="info-section">
        <h2>RELATÓRIO DE SERVIÇO</h2>
        <div class="info-grid">
          <div class="info-item full-width">
            <label>DESCRIÇÃO DETALHADA DO SERVIÇO</label>
            <p>{{ folhaData.otherData.serviceReport }}</p>
          </div>
        </div>
      </section>

      <!-- Assinatura Cliente Section -->
      <section
        v-if="folhaData.otherData.clientSignature"
        class="info-section"
      >
        <h2>ASSINATURA CLIENTE</h2>
        <div class="info-grid">
          <div class="info-item full-width">
            <label>ASSINATURA DO CLIENTE</label>
            <div class="signature-display">
              <img
                :src="folhaData.otherData.clientSignature"
                alt="Assinatura do Cliente"
                class="signature-image"
              >
            </div>
          </div>
        </div>
      </section>

      <!-- Signature Canvas -->
      <section class="signature-section">
        <!-- <div class="signature-canvas">
          <canvas ref="signatureCanvas" width="600" height="200"></canvas>
        </div> -->

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="action-btn primary">
            📋 FOLHA
          </button>
          <button
            class="action-btn secondary"
            @click="editFolha"
          >
            ✏️ Editar
          </button>
        </div>
      </section>
    </div>

    <!-- No data state -->
    <div
      v-else
      class="no-data-state"
    >
      <h2>Folha de obra não encontrada</h2>
      <p>O registo pode ainda não estar disponível no sistema. Tentar novamente?</p>
      <div class="retry-actions">
        <button
          class="retry-btn"
          :disabled="loading"
          @click="retryLoad"
        >
          {{ loading ? 'A carregar...' : 'Tentar novamente' }}
        </button>
        <BackButton
          to="/folhas-obra/list"
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import BackButton from '@/components/BackButton.vue';
import { useFolhasObraStore } from '@/stores/folhas-obra.js';

// Router
const route = useRoute();
const router = useRouter();

// Store
const store = useFolhasObraStore();
const { selectedFolha, loading, error } = storeToRefs(store);
const { fetchFolhaById, getYearFromDate, clearError } = store;

// Template refs
const signatureCanvas = ref(null);

// Auto-retry state
const autoRetryCountdown = ref(0);
const autoRetryTimer = ref(null);
const userInteractionCancelled = ref(false);
const retryTimeoutId = ref(null);

// Computed property to get the current folha data
const folhaData = computed(() => {
  return selectedFolha.value || {};
});

const year = computed(() => {
  return route.query.year || getYearFromDate(folhaData.value.date) || new Date().getFullYear();
});

// Methods
const loadFolhaData = async () => {
  const folhaId = route.params.id;
  const targetYear = route.query.year || new Date().getFullYear();

  console.log('Loading folha data for ID:', folhaId, 'Year:', targetYear);

  try {
    clearError();
    await fetchFolhaById(targetYear, folhaId);
    // If successful, cancel any pending retries
    cancelAutoRetry();
  } catch (err) {
    console.warn(`Folha with ID ${folhaId} not found in year ${targetYear}`);
    // Check if it's a 404 or "not found" error
    const isNotFound =
      err.message?.toLowerCase().includes('not found') ||
      error.value?.toLowerCase().includes('not found');

    if (isNotFound && !userInteractionCancelled.value) {
      // Start auto-retry countdown
      startAutoRetry();
    }
  }
};

const retryLoad = () => {
  userInteractionCancelled.value = true;
  cancelAutoRetry();
  loadFolhaData();
};

const startAutoRetry = () => {
  cancelAutoRetry();
  autoRetryCountdown.value = 10;

  const updateCountdown = () => {
    if (autoRetryCountdown.value > 0 && !userInteractionCancelled.value) {
      autoRetryCountdown.value--;
      retryTimeoutId.value = setTimeout(updateCountdown, 1000);
    } else if (autoRetryCountdown.value === 0 && !userInteractionCancelled.value) {
      // Auto-retry after countdown
      loadFolhaData();
    }
  };

  retryTimeoutId.value = setTimeout(updateCountdown, 1000);
};

const cancelAutoRetry = () => {
  if (retryTimeoutId.value) {
    clearTimeout(retryTimeoutId.value);
    retryTimeoutId.value = null;
  }
  autoRetryCountdown.value = 0;
};

const handleUserInteraction = () => {
  userInteractionCancelled.value = true;
  cancelAutoRetry();
};

// Watch for successful data load to cancel retries
watch(
  () => folhaData.value?.id,
  newId => {
    if (newId) {
      cancelAutoRetry();
      userInteractionCancelled.value = false;
    }
  }
);

const formatDate = dateString => {
  const date = new Date(dateString);
  return (
    `${date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })  } at 12:00`
  );
};

// Pricing calculation methods
const getDisplacementRate = () => {
  // Taxa de deslocação based on total km
  const totalKms = folhaData.value.displacement?.totalKms || 0;
  return totalKms > 180 ? 50 : 35;
};

const getDisplacementRateDescription = () => {
  const totalKms = folhaData.value.displacement?.totalKms || 0;
  return totalKms > 180 ? 'Mais de 180km' : 'Até 180km';
};

const getHourlyRate = () => {
  return folhaData.value.displacement?.weekendHoliday ? 60 : 45;
};

const getHourlyRateDescription = () => {
  return folhaData.value.displacement?.weekendHoliday ? 'Fim de semana/Feriado' : 'Dias úteis';
};

const getWorkDuration = () => {
  const startTime = folhaData.value.request?.timeArrivedClient;
  const endTime = folhaData.value.request?.timeExitClient;
  if (!startTime || !endTime) return 'N/A';

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startDate = new Date(0, 0, 0, startHour, startMinute);
  const endDate = new Date(0, 0, 0, endHour, endMinute);

  if (endDate < startDate) {
    endDate.setDate(endDate.getDate() + 1); // Assume next day if end time is earlier
  }

  const diffMs = endDate - startDate;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) {
    const minutes = Math.round(diffHours * 60);
    return `${minutes}min`;
  } else {
    const hours = Math.floor(diffHours);
    const minutes = Math.round((diffHours - hours) * 60);
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }
};

const getKmsPrice = () => {
  // KMs price = 0.4€ per km × total km
  const pricePerKm = 0.4;
  const totalKms = folhaData.value.displacement?.totalKms || 0;

  return Math.round(pricePerKm * totalKms * 100) / 100;
};

const getDisplacementPrice = () => {
  // Displacement price = Taxa (35€ or 50€ based on km) + (0.4€ per km × total km)
  const taxa = getDisplacementRate();
  const kmsPrice = getKmsPrice();

  return taxa + kmsPrice;
};

const getLaborPrice = () => {
  const arrivalTime = folhaData.value.request?.arrivalTime;
  const departureTime = folhaData.value.request?.departureTime;

  if (!arrivalTime || !departureTime) return 0;

  // Parse time strings (HH:MM format)
  const [arrivalHours, arrivalMinutes] = arrivalTime.split(':').map(Number);
  const [departureHours, departureMinutes] = departureTime.split(':').map(Number);

  // Convert to minutes for easier calculation
  const arrivalTotalMinutes = arrivalHours * 60 + arrivalMinutes;
  const departureTotalMinutes = departureHours * 60 + departureMinutes;

  // Calculate difference in minutes
  let diffMinutes = departureTotalMinutes - arrivalTotalMinutes;

  // Handle case where departure is next day
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60; // Add 24 hours
  }

  // Convert to hours (with decimal)
  const totalHours = diffMinutes / 60;

  // Get hourly rate
  const hourlyRate = getHourlyRate();

  // Minimum charge of 1 hour: if total < 1h, charge for 1h, otherwise charge actual hours
  const chargeableHours = totalHours < 1 ? 1 : totalHours;

  // Calculate labor price
  return Math.round(chargeableHours * hourlyRate * 100) / 100; // Round to 2 decimal places
};

const getTotalPrice = () => {
  const displacementPrice = getDisplacementPrice();
  const laborPrice = getLaborPrice();
  return Math.round((displacementPrice + laborPrice) * 100) / 100; // Round to 2 decimal places
};

const editFolha = () => {
  const currentYear = route.query.year || getYearFromDate(folhaData.value.date);
  console.log('Navigating to edit with year:', currentYear);
  router.push(`/folhas-obra/${route.params.id}/edit?year=${currentYear}`);
};

const initializeSignature = () => {
  // Initialize signature canvas with a sample signature
  const canvas = signatureCanvas.value;
  const ctx = canvas.getContext('2d');

  // Set canvas background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw sample signature (you can replace this with actual signature data)
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 100);
  ctx.bezierCurveTo(150, 50, 200, 150, 250, 100);
  ctx.bezierCurveTo(300, 80, 350, 120, 400, 100);
  ctx.stroke();
};

// Lifecycle hooks
onMounted(async () => {
  // Add event listeners for user interaction
  window.addEventListener('click', handleUserInteraction);
  window.addEventListener('scroll', handleUserInteraction);
  window.addEventListener('keydown', handleUserInteraction);

  await loadFolhaData();
  if (folhaData.value.id) {
    initializeSignature();
  }
});

onBeforeUnmount(() => {
  cancelAutoRetry();
  window.removeEventListener('click', handleUserInteraction);
  window.removeEventListener('scroll', handleUserInteraction);
  window.removeEventListener('keydown', handleUserInteraction);
});
</script>

<style scoped>
.folha-detail {
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

.loading-state,
.error-state,
.no-data-state {
  background: white;
  padding: 3rem 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.error-state {
  border-left: 4px solid #dc3545;
}

.error-state p {
  color: #dc3545;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.retry-btn {
  padding: 0.75rem 1.5rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s ease;
}

.retry-btn:hover {
  background: #c82333;
}

.no-data-state {
  text-align: center;
}

.no-data-state h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.no-data-state p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
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

.detail-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.info-section {
  padding: 2rem;
  border-bottom: 1px solid #eee;
}

.info-section:last-child {
  border-bottom: none;
}

.info-section h2 {
  color: #2c3e50;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  text-transform: uppercase;
  border-bottom: 2px solid var(--primary-color);
  padding-bottom: 0.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.info-item label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
  letter-spacing: 0.5px;
}

.info-item p {
  color: #2c3e50;
  font-size: 0.95rem;
  margin: 0;
  font-weight: 500;
  min-height: 1.2em;
}

.info-item p:empty::before {
  content: '—';
  color: #999;
  font-style: italic;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.signature-display {
  margin-top: 1rem;
  text-align: center;
}

.signature-image {
  width: 100%;
  max-height: 200px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  object-fit: contain;
}

/* Pricing section styling */
.pricing-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
}

.pricing-section h3 {
  color: #2c3e50;
  font-size: 1rem;
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.pricing-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pricing-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e9ecef;
}

.pricing-row:last-child {
  border-bottom: none;
}

.pricing-row.total {
  background: var(--primary-color);
  color: white;
  margin: 0.5rem -1rem -1rem -1rem;
  padding: 1rem;
  border-radius: 0 0 8px 8px;
  font-weight: 700;
}

.pricing-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.pricing-row.total .pricing-label {
  color: white;
}

.pricing-value {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
}

.pricing-row.total .pricing-value {
  color: white;
  font-size: 1.2rem;
}

.vat-note {
  font-size: 0.85rem;
  color: #666;
  font-weight: 400;
  font-style: italic;
}

.vat-indicator {
  font-size: 0.75rem;
  color: #dc3545;
  font-weight: 500;
  font-style: italic;
  margin-left: 0.25rem;
}

.pricing-row.total .vat-indicator {
  color: rgba(255, 255, 255, 0.9);
}

.work-description {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
}

.work-description h3 {
  color: #2c3e50;
  font-size: 1rem;
  margin: 0 0 1rem 0;
}

.work-description h4 {
  color: #2c3e50;
  font-size: 0.9rem;
  margin: 1rem 0 0.5rem 0;
}

.work-description ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.work-description li {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.work-description p {
  font-size: 0.85rem;
  color: #666;
  margin: 0.5rem 0;
}

.description-content {
  font-size: 0.85rem;
  line-height: 1.5;
}

.signature-section {
  padding: 2rem;
  text-align: center;
}

.signature-canvas {
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  margin-bottom: 2rem;
  display: inline-block;
}

.signature-canvas canvas {
  display: block;
  border-radius: 6px;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.action-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.action-btn.primary {
  background: var(--primary-color);
  color: white;
}

.action-btn.primary:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.action-btn.secondary {
  background: var(--primary-color);
  color: white;
}

.action-btn.secondary:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .folha-detail {
    padding: 0.5rem;
  }

  .detail-header {
    margin-bottom: 1.5rem;
  }

  .detail-header h1 {
    font-size: 1.5rem;
  }

  .info-section {
    padding: 1.5rem;
  }

  .info-section h2 {
    font-size: 1.1rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .work-description {
    padding: 1rem;
    margin-top: 1.5rem;
  }

  .signature-canvas canvas {
    max-width: 100%;
    height: auto;
  }

  .signature-image {
    max-height: 150px;
  }

  .action-buttons {
    flex-direction: column;
    align-items: center;
  }

  .action-btn {
    width: 100%;
    max-width: 250px;
  }
}

@media (max-width: 480px) {
  .info-section {
    padding: 1rem;
  }

  .info-section h2 {
    font-size: 1rem;
  }

  .info-item label {
    font-size: 0.7rem;
  }

  .info-item p {
    font-size: 0.9rem;
  }

  .work-description h3 {
    font-size: 0.9rem;
  }

  .work-description h4 {
    font-size: 0.85rem;
  }
}
</style>

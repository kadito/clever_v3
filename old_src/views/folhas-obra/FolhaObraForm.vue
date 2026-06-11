<template>
  <div class="folha-form-container">
    <div class="form-header">
      <BackButton
        :to="cancelRoute"
        variant="inline"
      />
      <h1>{{ isEditing ? 'Editar' : 'Nova' }} Folha de Obra</h1>
    </div>

    <!-- Loading state -->
    <div
      v-if="loading"
      class="loading-state"
    >
      <p>A processar...</p>
    </div>

    <!-- Error state -->
    <div
      v-if="error"
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

    <!-- Form -->
    <form
      v-if="!loading"
      class="folha-form"
      @submit.prevent="handleSubmit"
    >
      <!-- Client Data Section -->
      <section class="form-section">
        <h2>DADOS DO CLIENTE</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="commercialName">DESIGNAÇÃO COMERCIAL</label>
            <ClienteSearchSelect
              id="commercialName"
              v-model="form.client.commercialName"
              input-id="commercial-name-search"
              placeholder="Pesquisar cliente..."
              :disabled="clientesStore.loading"
              store-name
              @change="handleClientSelection"
            />
          </div>
        </div>
      </section>

      <!-- Request Info Section -->
      <section class="form-section">
        <h2>INFORMAÇÃO DO PEDIDO</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="requestDate">DATA DO PEDIDO</label>
            <input
              id="requestDate"
              v-model="form.request.date"
              type="datetime-local"
              class="form-control"
            >
          </div>

          <div class="form-group">
            <label for="receivedBy">RECEÇÃO DO PEDIDO</label>
            <select
              id="receivedBy"
              v-model="form.request.receivedBy"
              class="form-control"
              :disabled="equipaStore.loading"
            >
              <option value="">
                {{ equipaStore.loading ? 'A carregar colaboradores...' : '--' }}
              </option>
              <option
                v-for="collaborator in collaborators"
                :key="collaborator.id"
                :value="collaborator.name"
              >
                {{ collaborator.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="assistanceDate">DATA DA ASSISTÊNCIA</label>
            <input
              id="assistanceDate"
              v-model="form.request.assistanceDate"
              type="datetime-local"
              class="form-control"
            >
          </div>

          <div class="form-group full-width">
            <label for="reason">MOTIVO DO PEDIDO</label>
            <textarea
              id="reason"
              v-model="form.request.reason"
              class="form-control"
              rows="3"
              placeholder="Descreva o motivo do pedido..."
            />
          </div>
        </div>
      </section>

      <!-- Time Tracking Section -->
      <section class="form-section">
        <h2>CONTROLO DE TEMPO</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="arrivalTime">HORA CHEGADA</label>
            <div class="time-input-wrapper">
              <input
                id="arrivalTime"
                v-model="form.request.arrivalTime"
                type="text"
                class="form-control time-input"
                placeholder="HH:MM"
                maxlength="5"
                @input="formatTimeInput($event, 'arrivalTime')"
                @blur="calculateTotals"
              >
            </div>
          </div>

          <div class="form-group">
            <label for="departureTime">HORA SAÍDA</label>
            <div class="time-input-wrapper">
              <input
                id="departureTime"
                v-model="form.request.departureTime"
                type="text"
                class="form-control time-input"
                placeholder="HH:MM"
                maxlength="5"
                @input="formatTimeInput($event, 'departureTime')"
                @blur="calculateTotals"
              >
            </div>
          </div>

          <div class="form-group">
            <label for="totalHours">TOTAL HORAS</label>
            <input
              id="totalHours"
              v-model="form.request.totalHours"
              type="text"
              class="form-control"
              readonly
              placeholder="Calculado automaticamente"
            >
          </div>
        </div>
      </section>

      <!-- Service Type & Technician Section -->
      <section class="form-section">
        <h2>TIPO DE SERVIÇO E TÉCNICO</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="serviceType">TIPO DE SERVIÇO</label>
            <select
              id="serviceType"
              v-model="form.otherData.serviceType"
              class="form-control"
            >
              <option value="">
                --
              </option>
              <option value="ASSISTÊNCIA PRESENCIAL">
                ASSISTÊNCIA PRESENCIAL
              </option>
              <option value="MANUTENÇÃO">
                MANUTENÇÃO
              </option>
              <option value="INSTALAÇÃO">
                INSTALAÇÃO
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="technician">TÉCNICO RESPONSÁVEL</label>
            <select
              id="technician"
              v-model="form.otherData.technician"
              class="form-control"
              required
              :disabled="equipaStore.loading"
            >
              <option value="">
                {{ equipaStore.loading ? 'A carregar colaboradores...' : '--' }}
              </option>
              <option
                v-for="collaborator in collaborators"
                :key="collaborator.id"
                :value="collaborator.name"
              >
                {{ collaborator.name }}
              </option>
            </select>
          </div>
        </div>
      </section>

      <!-- Displacement Section -->
      <section class="form-section">
        <h2>DESLOCAÇÃO</h2>
        <div class="form-grid">
          <div class="form-group displacement-options">
            <label>DESLOCAÇÃO</label>
            <div class="radio-group">
              <label :class="['radio-label', form.displacement.hasDisplacement ? 'selected' : '']">
                <input
                  v-model="form.displacement.hasDisplacement"
                  type="radio"
                  :value="true"
                  name="displacement"
                >
                <span>SIM</span>
              </label>
              <label :class="['radio-label', !form.displacement.hasDisplacement ? 'selected' : '']">
                <input
                  v-model="form.displacement.hasDisplacement"
                  type="radio"
                  :value="false"
                  name="displacement"
                >
                <span>NÃO</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>FINAL SEMANA - FERIADO</label>
            <div class="toggle-switch">
              <input
                id="weekendHoliday"
                v-model="form.displacement.weekendHoliday"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="weekendHoliday"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <!-- KMS fields - shown only when displacement is true -->
          <template v-if="form.displacement.hasDisplacement">
            <div class="form-group">
              <label for="oneWayKms">KMS (IDA)</label>
              <input
                id="oneWayKms"
                v-model.number="form.displacement.oneWayKms"
                type="number"
                class="form-control"
                placeholder="Quilómetros de ida"
                min="0"
                step="1"
                @input="calculateTotalKms"
              >
            </div>

            <div class="form-group">
              <label for="totalKms">TOTAL KMS (IDA E VOLTA)</label>
              <input
                id="totalKms"
                v-model.number="form.displacement.totalKms"
                type="number"
                class="form-control"
                placeholder="Total automático"
                readonly
                disabled
              >
            </div>
          </template>
        </div>

        <!-- Calculated Pricing - only shown when displacement is true -->
        <div
          v-if="form.displacement.hasDisplacement"
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

      <!-- Payment Method Section -->
      <section class="form-section">
        <h2>MÉTODO DE PAGAMENTO</h2>
        <div class="form-grid">
          <div class="payment-options">
            <label
              :class="[
                'payment-option',
                form.displacement.paymentMethod === 'PENDENTE' ? 'selected' : '',
              ]"
            >
              <input
                v-model="form.displacement.paymentMethod"
                type="radio"
                value="PENDENTE"
                name="payment"
              >
              <span>PENDENTE</span>
            </label>
            <label
              :class="[
                'payment-option',
                form.displacement.paymentMethod === 'CARTÃO MB' ? 'selected' : '',
              ]"
            >
              <input
                v-model="form.displacement.paymentMethod"
                type="radio"
                value="CARTÃO MB"
                name="payment"
              >
              <span>CARTÃO MB</span>
            </label>
            <label
              :class="[
                'payment-option',
                form.displacement.paymentMethod === 'DINHEIRO' ? 'selected' : '',
              ]"
            >
              <input
                v-model="form.displacement.paymentMethod"
                type="radio"
                value="DINHEIRO"
                name="payment"
              >
              <span>DINHEIRO</span>
            </label>
            <label
              :class="[
                'payment-option',
                form.displacement.paymentMethod === 'TRANSFERÊNCIA BANCÁRIA' ? 'selected' : '',
              ]"
            >
              <input
                v-model="form.displacement.paymentMethod"
                type="radio"
                value="TRANSFERÊNCIA BANCÁRIA"
                name="payment"
              >
              <span>TRANSFERÊNCIA BANCÁRIA</span>
            </label>
            <label
              :class="[
                'payment-option',
                form.displacement.paymentMethod === 'CONTRATO' ? 'selected' : '',
              ]"
            >
              <input
                v-model="form.displacement.paymentMethod"
                type="radio"
                value="CONTRATO"
                name="payment"
              >
              <span>CONTRATO</span>
            </label>
          </div>
        </div>
      </section>

      <!-- Warranty & Contract Section - only shown when payment method is CONTRATO -->
      <section
        v-if="form.displacement.paymentMethod === 'CONTRATO'"
        class="form-section"
      >
        <h2>GARANTIA E CONTRATO</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>GARANTIA</label>
            <div class="toggle-switch">
              <input
                id="warranty"
                v-model="form.otherData.warranty"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="warranty"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>CONTRATO</label>
            <div class="toggle-switch">
              <input
                id="contract"
                v-model="form.otherData.contract"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="contract"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label for="contractYear">ANO DE CONTRATO</label>
            <select
              id="contractYear"
              v-model="form.otherData.contractYear"
              class="form-control"
            >
              <option value="2023">
                2023
              </option>
              <option value="2024">
                2024
              </option>
              <option value="2025">
                2025
              </option>
              <option value="2026">
                2026
              </option>
            </select>
          </div>
        </div>
      </section>

      <!-- Material & Equipment Section -->
      <section class="form-section">
        <h2>MATERIAL E EQUIPAMENTOS</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>MATERIAL UTILIZADO</label>
            <div class="toggle-switch">
              <input
                id="materialUsed"
                v-model="form.otherData.materialUsed"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="materialUsed"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>EQUIPAMENTOS</label>
            <div class="toggle-switch">
              <input
                id="equipment"
                v-model="form.otherData.equipment"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="equipment"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <!-- Material Details - shown only when material is checked -->
          <div
            v-if="form.otherData.materialUsed"
            class="form-group full-width"
          >
            <label for="materialDetails">DESCRIÇÃO DO MATERIAL UTILIZADO</label>
            <textarea
              id="materialDetails"
              v-model="form.otherData.materialDetails"
              class="form-control"
              rows="3"
              placeholder="Descreva o material utilizado..."
            />
          </div>

          <!-- Equipment Details - shown only when equipment is checked -->
          <div
            v-if="form.otherData.equipment"
            class="form-group full-width"
          >
            <label for="equipmentDetails">DESCRIÇÃO DOS EQUIPAMENTOS</label>
            <textarea
              id="equipmentDetails"
              v-model="form.otherData.equipmentDetails"
              class="form-control"
              rows="3"
              placeholder="Descreva os equipamentos utilizados..."
            />
          </div>
        </div>
      </section>

      <!-- Service Status & Technical Operations Section -->
      <section class="form-section">
        <h2>ESTADO DO SERVIÇO E OPERAÇÕES TÉCNICAS</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>TOTALMENTE RESOLVIDO</label>
            <div class="toggle-switch">
              <input
                id="totallyResolved"
                v-model="form.otherData.totallyResolved"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="totallyResolved"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>LEITURA DE DUMP</label>
            <div class="toggle-switch">
              <input
                id="dumpReading"
                v-model="form.otherData.dumpReading"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="dumpReading"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>CÓPIA DE SEGURANÇA</label>
            <div class="toggle-switch">
              <input
                id="backup"
                v-model="form.otherData.backup"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="backup"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>VERIFICAÇÃO DO ACESSO REMOTO</label>
            <div class="toggle-switch">
              <input
                id="remoteAccessCheck"
                v-model="form.otherData.remoteAccessCheck"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="remoteAccessCheck"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>ANYDESK</label>
            <div class="toggle-switch">
              <input
                id="anydesk"
                v-model="form.otherData.anydesk"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="anydesk"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <!-- Resolution Issues - shown only when NOT totally resolved -->
          <div
            v-if="!form.otherData.totallyResolved"
            class="form-group full-width"
          >
            <label for="resolutionIssues">OBSERVAÇÕES SOBRE PROBLEMAS NÃO RESOLVIDOS</label>
            <textarea
              id="resolutionIssues"
              v-model="form.otherData.resolutionIssues"
              class="form-control"
              rows="4"
              placeholder="Descreva os problemas que não foram totalmente resolvidos..."
            />
          </div>
        </div>
      </section>

      <!-- Service Report Section -->
      <section class="form-section">
        <h2>RELATÓRIO DE SERVIÇO</h2>
        <div class="form-grid">
          <div class="form-group full-width">
            <label for="serviceReport">DESCRIÇÃO DETALHADA DO SERVIÇO</label>
            <textarea
              id="serviceReport"
              v-model="form.otherData.serviceReport"
              class="form-control"
              rows="5"
              placeholder="Descrição detalhada do serviço realizado..."
            />
          </div>
        </div>
      </section>

      <!-- Client Signature Section -->
      <section class="form-section">
        <h2>ASSINATURA CLIENTE</h2>
        <div class="form-grid">
          <div class="form-group full-width">
            <label for="clientSignature">ASSINATURA DO CLIENTE</label>
            <div class="signature-preview-container">
              <div
                v-if="form.otherData.clientSignature"
                class="signature-preview-image"
              >
                <img
                  :src="form.otherData.clientSignature"
                  alt="Assinatura"
                >
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  @click="openSignatureModal"
                >
                  Editar Assinatura
                </button>
              </div>
              <div
                v-else
                class="signature-preview-empty"
              >
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  @click="openSignatureModal"
                >
                  Adicionar Assinatura
                </button>
              </div>
            </div>
            <div>
              <small class="form-text">Toque no botão acima para desenhar a assinatura. A assinatura será guardada
                automaticamente ao submeter o formulário.</small>
            </div>
          </div>
        </div>
      </section>

      <!-- Signature Modal -->
      <div
        v-if="showSignatureModal"
        class="signature-modal-overlay"
        @click.self="closeSignatureModal"
      >
        <div class="signature-modal">
          <div class="signature-modal-header">
            <h3>Assinatura do Cliente</h3>
            <button
              type="button"
              class="modal-close-btn"
              aria-label="Fechar"
              @click="closeSignatureModal"
            >
              ×
            </button>
          </div>
          <div class="signature-modal-body">
            <canvas
              id="signatureCanvas"
              ref="signatureCanvas"
              class="signature-canvas-fullscreen"
            />
          </div>
          <div class="signature-modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="clearSignature"
            >
              Limpar
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="saveAndCloseSignature"
            >
              Guardar e Fechar
            </button>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button
          type="button"
          class="btn btn-cancel"
          :disabled="loading"
          @click="navigateBack"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="loading"
        >
          <span
            v-if="loading"
            class="btn-spinner"
          />
          {{ isEditing ? 'Atualizar' : 'Criar' }} Folha de Obra
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import SignaturePad from 'signature_pad';
import BackButton from '@/components/BackButton.vue';
import ClienteSearchSelect from '@/components/ClienteSearchSelect.vue';
import { useFolhasObraStore } from '@/stores/folhas-obra.js';
import { useClientesStore } from '@/stores/clientes.js';
import { useEquipaStore } from '@/stores/equipa.js';

// Router
const router = useRouter();
const route = useRoute();

// Stores
const folhasStore = useFolhasObraStore();
const clientesStore = useClientesStore();
const equipaStore = useEquipaStore();

const { loading, error, selectedFolha } = storeToRefs(folhasStore);
const { clientes } = storeToRefs(clientesStore);
const { collaborators } = storeToRefs(equipaStore);

const { createFolha, updateFolha, fetchFolhaById, clearError, setCurrentYear } = folhasStore;

const { fetchClientes } = clientesStore;
const { fetchCollaborators } = equipaStore;

// Form state
const currentYear = ref(new Date().getFullYear().toString());
const isEditing = computed(() => !!route.params.id);
const signatureCanvas = ref(null);
const signaturePad = ref(null);
const signatureResizeHandler = ref(null);
const showSignatureModal = ref(false);

// Default form structure
const defaultForm = {
  clientName: '',
  date: new Date().toISOString().split('T')[0],
  number: '',
  client: {
    socialName: '',
    commercialName: '',
    taxNumber: '',
    address: '',
    location: '',
  },
  request: {
    reason: '',
    receivedBy: '',
    date: new Date().toISOString().split('T')[0],
    assistanceDate: new Date().toISOString().split('T')[0],
    arrivalTime: '',
    departureTime: '',
    totalHours: '',
  },
  displacement: {
    hasDisplacement: true,
    weekendHoliday: false,
    oneWayKms: 0,
    totalKms: 0,
    roundTripKm: '',
    totalCalculatedHours: '',
    displacementCost: '',
    laborCost: '',
    totalCostWithTax: '',
    clientContract: 'NÃO',
    paymentMethod: 'PENDENTE',
    totalToPay: '',
  },
  otherData: {
    serviceReport: '',
    technician: '',
    serviceType: '',
    serviceObservations: '',
    warranty: false,
    contract: false,
    contractYear: '2025',
    materialUsed: false,
    materialDetails: '',
    equipment: false,
    equipmentDetails: '',
    totallyResolved: true,
    resolutionIssues: '',
    dumpReading: false,
    backup: false,
    remoteAccessCheck: false,
    anydesk: false,
    clientSignature: '',
  },
};

// Form state
const form = reactive({ ...defaultForm });
const validationErrors = reactive({});

// Computed
const cancelRoute = computed(() => {
  // If we're coming from the module page, go back there
  const fromModule = route.query.from === 'module';

  if (isEditing.value) {
    return `/folhas-obra/${route.params.id}?year=${route.query.year || currentYear.value}`;
  }

  return fromModule ? '/folhas-obra' : '/folhas-obra/list';
});

// Methods
const loadFolhaData = async () => {
  if (isEditing.value) {
    try {
      const year = route.query.year || currentYear.value;
      const id = route.params.id;

      console.log('Loading folha data:', { year, id });

      setCurrentYear(year);
      await fetchFolhaById(year, id);

      if (selectedFolha.value) {
        console.log('Folha loaded successfully:', selectedFolha.value);
        populateFormFromSelectedFolha();
      } else {
        console.error('No folha data found');
      }
    } catch (error) {
      console.error('Error loading folha:', error);
    }
  }
};

const populateFormFromSelectedFolha = () => {
  if (!selectedFolha.value || !isEditing.value) return;

  console.log('Populating form with data:', selectedFolha.value);

  // Reset form to defaults first
  Object.assign(form, { ...defaultForm });

  // Basic data
  form.clientName = selectedFolha.value.clientName || '';
  form.date = selectedFolha.value.date || '';
  form.number = selectedFolha.value.number || '';

  // Client data
  if (selectedFolha.value.client) {
    Object.assign(form.client, selectedFolha.value.client);
  }

  // Request data
  if (selectedFolha.value.request) {
    Object.assign(form.request, selectedFolha.value.request);
  }

  // Displacement data
  if (selectedFolha.value.displacement) {
    Object.assign(form.displacement, selectedFolha.value.displacement);

    // If we have displacement data but not the hasDisplacement flag, set it
    if (!('hasDisplacement' in selectedFolha.value.displacement)) {
      form.displacement.hasDisplacement = true;
    }

    // Calculate total KMS if one-way KMS exists
    if (form.displacement.oneWayKms) {
      calculateTotalKms();
    }
  }

  // Other data
  if (selectedFolha.value.otherData) {
    Object.assign(form.otherData, selectedFolha.value.otherData);
  }

  // Format loaded times
  formatLoadedTimes();

  // Load signature if it exists
  if (form.otherData.clientSignature && signaturePad.value) {
    setTimeout(() => {
      signaturePad.value.fromDataURL(form.otherData.clientSignature);
    }, 200);
  }

  console.log('Form populated:', form);
};

const validateForm = () => {
  const errors = {};

  if (!form.client.commercialName) {
    errors.commercialName = 'Designação comercial é obrigatória';
  }

  if (!form.request.assistanceDate) {
    errors.assistanceDate = 'Data da assistência é obrigatória';
  }

  if (!form.otherData.technician) {
    errors.technician = 'Técnico é obrigatório';
  }

  Object.assign(validationErrors, errors);
  return Object.keys(errors).length === 0;
};

const formatTimeInput = (event, field) => {
  // Get the input value and remove non-digit characters
  let value = event.target.value.replace(/[^\d]/g, '');

  // Format as HH:MM
  if (value.length > 2) {
    value = `${value.slice(0, 2)  }:${  value.slice(2, 4)}`;
  }

  // Update the form field
  if (field === 'arrivalTime') {
    form.request.arrivalTime = value;
  } else if (field === 'departureTime') {
    form.request.departureTime = value;
  }

  // Update the input value
  event.target.value = value;
};

const calculateTotals = () => {
  // Calculate total hours if arrival and departure times are set
  if (form.request.arrivalTime && form.request.departureTime) {
    // Make sure we have valid time formats
    const arrivalMatch = form.request.arrivalTime.match(/^(\d{1,2}):(\d{1,2})$/);
    const departureMatch = form.request.departureTime.match(/^(\d{1,2}):(\d{1,2})$/);

    if (arrivalMatch && departureMatch) {
      const arrivalHours = parseInt(arrivalMatch[1]);
      const arrivalMinutes = parseInt(arrivalMatch[2]);
      const departureHours = parseInt(departureMatch[1]);
      const departureMinutes = parseInt(departureMatch[2]);

      const arrival = new Date(2000, 0, 1, arrivalHours, arrivalMinutes);
      const departure = new Date(2000, 0, 1, departureHours, departureMinutes);

      if (departure >= arrival) {
        const diff = departure - arrival;
        const hours = Math.floor(diff / 3600000)
          .toString()
          .padStart(2, '0');
        const minutes = Math.floor((diff % 3600000) / 60000)
          .toString()
          .padStart(2, '0');
        const seconds = Math.floor((diff % 60000) / 1000)
          .toString()
          .padStart(2, '0');
        form.request.totalHours = `${hours}:${minutes}:${seconds}`;
      }
    }
  }

  // Set client name from commercial name for API compatibility
  form.clientName = form.client.commercialName;

  // Set date from assistance date for API compatibility
  form.date = form.request.assistanceDate;
};

const calculateTotalKms = () => {
  // Calculate total KMS (one way * 2)
  const oneWay = form.displacement.oneWayKms || 0;
  form.displacement.totalKms = oneWay * 2;
};

// Pricing calculation methods
const getDisplacementRate = () => {
  // Taxa de deslocação based on total km
  const totalKms = form.displacement?.totalKms || 0;
  return totalKms > 180 ? 50 : 35;
};

const getHourlyRate = () => {
  return form.displacement?.weekendHoliday ? 60 : 45;
};

const getKmsPrice = () => {
  // KMs price = 0.4€ per km × total km
  const pricePerKm = 0.4;
  const totalKms = form.displacement?.totalKms || 0;

  return Math.round(pricePerKm * totalKms * 100) / 100;
};

const getDisplacementPrice = () => {
  // Displacement price = Taxa (35€ or 50€ based on km) + (0.4€ per km × total km)
  const taxa = getDisplacementRate();
  const kmsPrice = getKmsPrice();

  return taxa + kmsPrice;
};

const getLaborPrice = () => {
  const arrivalTime = form.request?.arrivalTime;
  const departureTime = form.request?.departureTime;

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

const handleSubmit = async () => {
  if (!validateForm()) return;

  calculateTotals();

  // Save signature automatically if it exists
  if (signaturePad.value && !signaturePad.value.isEmpty()) {
    form.otherData.clientSignature = signaturePad.value.toDataURL('image/png');
  }

  try {
    const year = new Date(form.request.assistanceDate).getFullYear();

    // Create a clean version of form data without price-related fields
    // Prices are calculated dynamically in the views, not stored in DB
    const formDataToSave = {
      ...form,
      displacement: {
        ...form.displacement,
        // Remove legacy price fields - prices are calculated dynamically
        roundTripKm: undefined,
        totalCalculatedHours: undefined,
        displacementCost: undefined,
        laborCost: undefined,
        totalCostWithTax: undefined,
        totalToPay: undefined,
        clientContract: undefined,
      },
    };

    // Clean up undefined fields
    const cleanDisplacement = Object.fromEntries(
      Object.entries(formDataToSave.displacement).filter(([_, value]) => value !== undefined)
    );
    formDataToSave.displacement = cleanDisplacement;

    if (isEditing.value) {
      await updateFolha(route.query.year || currentYear.value, route.params.id, formDataToSave);
      router.push(`/folhas-obra/${route.params.id}?year=${route.query.year || currentYear.value}`);
    } else {
      const newFolha = await createFolha(year.toString(), formDataToSave);
      router.push(`/folhas-obra/${newFolha.id}?year=${year}`);
    }
  } catch (error) {
    console.error('Error saving folha:', error);
  }
};

const initializeSignaturePad = async () => {
  await nextTick();

  if (!signatureCanvas.value) return;

  const canvas = signatureCanvas.value;

  // Handle high DPI screens
  const resizeCanvas = () => {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);

    // Redraw signature if it exists
    if (signaturePad.value && !signaturePad.value.isEmpty() && form.otherData.clientSignature) {
      signaturePad.value.clear();
      signaturePad.value.fromDataURL(form.otherData.clientSignature);
    }
  };

  // Initialize signature pad
  signaturePad.value = new SignaturePad(canvas, {
    backgroundColor: 'rgb(255, 255, 255)',
    penColor: 'rgb(0, 0, 0)',
    minWidth: 1,
    maxWidth: 3,
    throttle: 16,
    minDistance: 5,
  });

  // Initial resize
  resizeCanvas();

  // Handle window resize
  window.addEventListener('resize', resizeCanvas);

  // Load existing signature if editing
  if (form.otherData.clientSignature && signaturePad.value) {
    signaturePad.value.fromDataURL(form.otherData.clientSignature);
  }

  // Return resize handler for cleanup
  return resizeCanvas;
};

const openSignatureModal = async () => {
  showSignatureModal.value = true;
  await nextTick();

  // Wait a bit more for the DOM to fully render
  setTimeout(() => {
    if (!signatureCanvas.value) {
      console.error('Canvas element not found');
      return;
    }

    const canvas = signatureCanvas.value;

    // Handle high DPI screens
    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();

      // Only resize if rect has valid dimensions
      if (rect.width === 0 || rect.height === 0) {
        return;
      }

      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      ctx.scale(ratio, ratio);

      // Redraw signature if it exists and pad is initialized
      if (signaturePad.value && form.otherData.clientSignature) {
        const data = signaturePad.value.toData();
        signaturePad.value.clear();
        signaturePad.value.fromData(data);
      }
    };

    // Always reinitialize signature pad when opening modal to ensure it's attached to the correct canvas
    if (signaturePad.value) {
      signaturePad.value.off();
      signaturePad.value.clear();
    }

    // Initialize signature pad
    signaturePad.value = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)',
      minWidth: 1,
      maxWidth: 3,
      throttle: 16,
      minDistance: 5,
    });

    console.log('Signature pad initialized');

    // Store resize handler
    if (signatureResizeHandler.value) {
      window.removeEventListener('resize', signatureResizeHandler.value);
    }
    signatureResizeHandler.value = resizeCanvas;
    window.addEventListener('resize', resizeCanvas);

    // Initial resize
    resizeCanvas();

    // Load existing signature if it exists
    if (form.otherData.clientSignature) {
      signaturePad.value.fromDataURL(form.otherData.clientSignature);
      console.log('Loaded existing signature');
    }
  }, 300);

  // Prevent body scroll when modal is open
  document.body.style.overflow = 'hidden';
};

const closeSignatureModal = () => {
  showSignatureModal.value = false;
  document.body.style.overflow = '';

  // Clean up resize handler
  if (signatureResizeHandler.value) {
    window.removeEventListener('resize', signatureResizeHandler.value);
    signatureResizeHandler.value = null;
  }
};

const saveAndCloseSignature = () => {
  if (signaturePad.value && !signaturePad.value.isEmpty()) {
    form.otherData.clientSignature = signaturePad.value.toDataURL('image/png');
    console.log('Signature saved');
  } else {
    // Even if empty, allow closing without saving
    console.log('Closing modal without saving (empty signature)');
  }
  closeSignatureModal();
};

const clearSignature = () => {
  if (signaturePad.value) {
    signaturePad.value.clear();
    form.otherData.clientSignature = '';
    console.log('Signature cleared');
  }
};

const navigateBack = () => {
  router.push(cancelRoute.value);
};

const handleClientSelection = cliente => {
  if (cliente) {
    // Populate client fields with selected client data
    form.client.socialName = cliente.nomeEmpresa || '';
    form.client.taxNumber = cliente.contribuinte || '';
    form.client.address = cliente.morada || '';
    form.client.location = cliente.localidade || '';
  } else {
    // Clear fields if no client selected
    form.client.socialName = '';
    form.client.taxNumber = '';
    form.client.address = '';
    form.client.location = '';
  }
};

const formatLoadedTimes = () => {
  // Format arrival time if it exists but doesn't match HH:MM format
  if (form.request.arrivalTime && !form.request.arrivalTime.match(/^\d{1,2}:\d{2}$/)) {
    // Try to extract hours and minutes from any time format
    const timeMatch = form.request.arrivalTime.match(/(\d{1,2})[:.,-]?(\d{2})/);
    if (timeMatch) {
      form.request.arrivalTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    }
  }

  // Format departure time if it exists but doesn't match HH:MM format
  if (form.request.departureTime && !form.request.departureTime.match(/^\d{1,2}:\d{2}$/)) {
    // Try to extract hours and minutes from any time format
    const timeMatch = form.request.departureTime.match(/(\d{1,2})[:.,-]?(\d{2})/);
    if (timeMatch) {
      form.request.departureTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    }
  }
};

// Lifecycle
onMounted(async () => {
  console.log('FolhaObraForm mounted, isEditing:', isEditing.value);

  // Fetch clients data for the dropdown
  try {
    await fetchClientes();
    console.log('Clients loaded:', clientes.value.length);
  } catch (error) {
    console.error('Error loading clients:', error);
  }

  // Fetch collaborators data for the dropdown
  try {
    await fetchCollaborators();
    console.log('Collaborators loaded:', collaborators.value.length);
  } catch (error) {
    console.error('Error loading collaborators:', error);
  }

  // Load folha data if editing
  if (isEditing.value) {
    try {
      await loadFolhaData();
    } catch (error) {
      console.error('Error in onMounted:', error);
    }
  }

  // Don't initialize signature pad on mount - wait for modal to open
});

// Cleanup signature pad on unmount
onBeforeUnmount(() => {
  if (signatureResizeHandler.value) {
    window.removeEventListener('resize', signatureResizeHandler.value);
  }
  if (signaturePad.value) {
    signaturePad.value.off();
  }
});

// Watchers
watch(
  selectedFolha,
  (newValue, oldValue) => {
    console.log('selectedFolha watcher triggered:', {
      newValue,
      oldValue,
      isEditing: isEditing.value,
    });

    if (newValue && isEditing.value) {
      console.log('selectedFolha changed, populating form:', newValue);
      populateFormFromSelectedFolha();
    }
  },
  { immediate: true }
);

// Watch for route changes to reload data if needed
watch(
  () => route.params.id,
  async (newId, oldId) => {
    console.log('Route param id changed:', { newId, oldId });

    if (newId && newId !== oldId && isEditing.value) {
      console.log('Route changed to edit different folha, reloading data');
      await loadFolhaData();
    }
  }
);

// Watch for changes in oneWayKms to automatically calculate total
watch(
  () => form.displacement.oneWayKms,
  newValue => {
    if (newValue !== undefined && newValue !== null) {
      calculateTotalKms();
    }
  }
);

// Watch for material used checkbox to clear details when unchecked
watch(
  () => form.otherData.materialUsed,
  newValue => {
    if (!newValue) {
      form.otherData.materialDetails = '';
    }
  }
);

// Watch for equipment checkbox to clear details when unchecked
watch(
  () => form.otherData.equipment,
  newValue => {
    if (!newValue) {
      form.otherData.equipmentDetails = '';
    }
  }
);

// Watch for totally resolved checkbox to clear resolution issues when checked
watch(
  () => form.otherData.totallyResolved,
  newValue => {
    if (newValue) {
      form.otherData.resolutionIssues = '';
    }
  }
);

// Watch for payment method changes to clear contract-related fields when not CONTRATO
watch(
  () => form.displacement.paymentMethod,
  newValue => {
    if (newValue !== 'CONTRATO') {
      form.otherData.warranty = false;
      form.otherData.contract = false;
      form.otherData.contractYear = '2025';
    }
  }
);
</script>

<style scoped>
.folha-form-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
  background: #f5f5f5;
  min-height: 100vh;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-header h1 {
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
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

.folha-form {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Form section styling */
.form-section {
  background: white;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-section h2 {
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--primary-color);
  padding-bottom: 0.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  align-items: start;
}

/* Form group styling with better alignment */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 60px;
  justify-content: flex-start;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  line-height: 1.3;
}

/* For toggle switches, ensure proper vertical alignment */
.form-group .toggle-switch {
  margin-top: 0.25rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(117, 174, 147, 0.2);
}

/* Datetime-local input styling */
input[type='datetime-local'].form-control {
  min-height: 44px;
  cursor: pointer;
}

input[type='datetime-local'].form-control::-webkit-calendar-picker-indicator {
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

input[type='datetime-local'].form-control::-webkit-calendar-picker-indicator:hover {
  background-color: rgba(117, 174, 147, 0.1);
}

.form-control:disabled,
.form-control[readonly] {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
  border-color: #e9ecef;
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.form-text {
  color: #6c757d;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

/* Time input styling */
.time-input-wrapper {
  position: relative;
}

.time-input {
  font-family: monospace;
  letter-spacing: 0.1em;
}

/* Toggle switch styling */
.toggle-switch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.toggle-input {
  display: none;
}

.toggle-label {
  position: relative;
  width: 50px;
  height: 24px;
  background: #ccc;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.toggle-input:checked + .toggle-label {
  background: var(--primary-color);
}

.toggle-input:checked + .toggle-label .toggle-slider {
  transform: translateX(26px);
}

.toggle-input:focus + .toggle-label {
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.1),
    0 0 0 2px rgba(117, 174, 147, 0.3);
}

/* Specific styling for the displacement section radio buttons */
.displacement-options .radio-group {
  display: flex;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
  width: fit-content;
  border: 1px solid #ddd;
}

.displacement-options .radio-label {
  padding: 8px 20px;
  border: none;
  border-radius: 0;
  margin: 0;
  position: relative;
  transition: background-color 0.2s;
}

.displacement-options .radio-label:first-child {
  border-right: 1px solid #ddd;
}

.displacement-options .radio-label input[type='radio'] {
  position: absolute;
  opacity: 0;
}

.displacement-options .radio-label input[type='radio']:checked + span {
  color: #333;
  font-weight: 600;
}

.displacement-options .radio-label.selected {
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Payment method radio buttons */
.payment-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  grid-column: 1 / -1;
}

.payment-option {
  flex: 1;
  min-width: 150px;
  padding: 0.75rem 1rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  background: white;
}

.payment-option input[type='radio'] {
  position: absolute;
  opacity: 0;
}

.payment-option:hover {
  border-color: var(--primary-color);
  background-color: rgba(117, 174, 147, 0.05);
}

.payment-option.selected {
  border-color: var(--primary-color);
  background-color: var(--primary-color);
  color: white;
  font-weight: 600;
}

.payment-option span {
  font-size: 0.9rem;
  font-weight: 500;
}

/* Form actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-cancel:hover:not(:disabled) {
  background: #5a6268;
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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .folha-form-container {
    padding: 0.5rem;
  }

  .form-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .form-header h1 {
    font-size: 1.3rem;
  }

  .form-section {
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .form-section h2 {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .form-group {
    min-height: auto;
  }

  .form-group label {
    font-size: 0.85rem;
  }

  .form-control {
    padding: 0.65rem;
    font-size: 0.9rem;
  }

  .payment-options {
    flex-direction: column;
  }

  .payment-option {
    min-width: auto;
  }

  .form-actions {
    flex-direction: column;
    gap: 0.75rem;
  }

  .btn {
    width: 100%;
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .folha-form-container {
    padding: 0.25rem;
  }

  .form-section {
    padding: 0.75rem;
  }

  .form-section h2 {
    font-size: 0.9rem;
  }

  .form-group label {
    font-size: 0.8rem;
  }

  .form-control {
    padding: 0.6rem;
    font-size: 0.85rem;
  }

  .form-header h1 {
    font-size: 1.2rem;
  }
}

/* Signature Preview Styles */
.signature-preview-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.signature-preview-image {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.signature-preview-image img {
  width: 100%;
  max-height: 200px;
  border: 2px solid #ddd;
  border-radius: 4px;
  background: white;
  object-fit: contain;
}

.signature-preview-empty {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

/* Signature Modal Styles */
.signature-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.signature-modal {
  background: white;
  border-radius: 8px;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.signature-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.signature-modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.modal-close-btn:hover {
  background-color: #f0f0f0;
}

.signature-modal-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow: hidden;
  min-height: 0;
  position: relative;
}

.signature-canvas-fullscreen {
  width: 100%;
  height: 100%;
  border: 2px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: crosshair;
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  position: relative;
}

.signature-modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-top: 1px solid #e9ecef;
  justify-content: flex-end;
  flex-shrink: 0;
  z-index: 10;
  background: white;
}

.signature-modal-footer .btn {
  min-width: 120px;
  z-index: 11;
  position: relative;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

@media (max-width: 768px) {
  .signature-modal-overlay {
    padding: 0;
  }

  .signature-modal {
    border-radius: 0;
  }

  .signature-modal-header {
    padding: 0.75rem;
  }

  .signature-modal-header h3 {
    font-size: 1.1rem;
  }

  .signature-modal-body {
    padding: 0.5rem;
  }

  .signature-modal-footer {
    padding: 0.75rem;
    flex-direction: column;
  }

  .signature-modal-footer .btn {
    width: 100%;
  }
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

.vat-note {
  font-size: 0.85rem;
  color: #666;
  font-weight: 400;
  font-style: italic;
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

@media (max-width: 768px) {
  .pricing-section {
    padding: 0.75rem;
  }

  .pricing-section h3 {
    font-size: 0.9rem;
  }

  .pricing-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .pricing-value {
    width: 100%;
  }
}
</style>

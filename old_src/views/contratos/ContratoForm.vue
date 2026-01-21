<template>
  <div class="contrato-form-container">
    <div class="form-header">
      <BackButton :to="cancelRoute" variant="inline" />
      <h1>{{ isEditing ? 'Editar' : 'Novo' }} Contrato</h1>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <p>A processar...</p>
    </div>

    <!-- Error state -->
    <div v-if="error" class="error-alert">
      <p>{{ error }}</p>
      <button @click="clearError" class="close-btn">×</button>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="contrato-form" v-if="!loading">
      <!-- Basic Information Section -->
      <section class="form-section">
        <h2>INFORMAÇÃO BÁSICA</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="cliente">CLIENTE *</label>
            <ClienteSearchSelect
              id="cliente"
              v-model="form.selectedClienteId"
              input-id="cliente-search"
              placeholder="Pesquisar cliente..."
              :disabled="clientesStore.loading || isEditing"
              :required="true"
              @change="onClienteChange"
            />
          </div>

          <div class="form-group">
            <label for="nome">NOME *</label>
            <input
              type="text"
              id="nome"
              v-model="form.nome"
              class="form-control"
              readonly
              required
            />
          </div>

          <div class="form-group">
            <label for="nomeComercial">NOME COMERCIAL *</label>
            <input
              type="text"
              id="nomeComercial"
              v-model="form.nomeComercial"
              class="form-control"
              readonly
              required
            />
          </div>

          <div class="form-group">
            <label for="nomeSocial">NOME SOCIAL</label>
            <input
              type="text"
              id="nomeSocial"
              v-model="form.nomeSocial"
              class="form-control"
              readonly
            />
          </div>

          <div class="form-group">
            <label for="contribuinte">CONTRIBUINTE</label>
            <input
              type="text"
              id="contribuinte"
              v-model="form.contribuinte"
              class="form-control"
              readonly
            />
          </div>
        </div>
      </section>

      <!-- Contact Information Section -->
      <section class="form-section">
        <h2>CONTACTOS</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="contacto">CONTACTO</label>
            <input type="tel" id="contacto" v-model="form.contacto" class="form-control" readonly />
          </div>

          <div class="form-group">
            <label for="email">E-MAIL</label>
            <input type="email" id="email" v-model="form.email" class="form-control" readonly />
          </div>

          <div class="form-group full-width">
            <label for="morada">MORADA</label>
            <textarea
              id="morada"
              v-model="form.morada"
              class="form-control"
              rows="2"
              readonly
            ></textarea>
          </div>
        </div>
      </section>

      <!-- Contract Plan Section -->
      <section class="form-section">
        <h2>PLANOS DE CONTRATO</h2>
        <p class="section-note">
          O cliente pode ter um ou ambos os tipos de contrato (CPA e/ou S&H)
        </p>

        <!-- CPA Contract Plan -->
        <div class="contract-type-section">
          <div class="contract-type-header">
            <h3>CPA - Cashlogy</h3>
            <div class="toggle-switch">
              <input
                type="checkbox"
                id="hasCPA"
                v-model="form.hasCPAContract"
                class="toggle-input"
                @change="onCPAToggle"
              />
              <label for="hasCPA" class="toggle-label">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div v-if="form.hasCPAContract" class="contract-type-content">
            <div class="form-grid">
              <div class="form-group">
                <label for="cpaContractType">TIPO DE CONTRATO CPA *</label>
                <select
                  id="cpaContractType"
                  v-model="form.cpaContractType"
                  class="form-control"
                  :required="form.hasCPAContract"
                  @change="onCPAContractTypeChange"
                >
                  <option value="">Selecione o tipo...</option>
                  <option value="CPA">CPA - Cashlogy (2023)</option>
                  <option value="CPA_1500">CPA - Cashlogy (1500)</option>
                </select>
              </div>

              <div class="form-group" v-if="form.cpaContractType">
                <label for="planIdCPA">PLANO CPA *</label>
                <select
                  id="planIdCPA"
                  v-model="form.planIdCPA"
                  class="form-control"
                  :required="form.hasCPAContract"
                  @change="onCPAPlanChange"
                >
                  <option value="">Selecione o plano...</option>
                  <option v-for="plan in availableCPAPlans" :key="plan.id" :value="plan.id">
                    {{ plan.name }}
                  </option>
                </select>
              </div>

              <div class="form-group" v-if="form.planIdCPA && form.cpaContractType === 'CPA'">
                <label for="distanceCPA">DISTÂNCIA *</label>
                <select
                  id="distanceCPA"
                  v-model="form.distanceCPA"
                  class="form-control"
                  :required="form.hasCPAContract && form.cpaContractType === 'CPA'"
                  @change="onCPADistanceChange"
                >
                  <option value="">Selecione a distância...</option>
                  <option value="under180km">Menos de 180 km</option>
                  <option value="over180km">Mais de 180 km</option>
                </select>
              </div>
            </div>

            <!-- CPA Equipment Information -->
            <div class="equipment-info-section">
              <div class="equipment-header">
                <h5>Equipamentos CPA</h5>
                <button type="button" @click="addCPAEquipment" class="btn btn-add-equipment">
                  ➕ Adicionar Equipamento
                </button>
              </div>

              <div class="equipment-note" v-if="form.cpaEquipments.length > 0">
                <span class="note-icon">ℹ️</span>
                <span
                  >O desconto aplica-se apenas aos equipamentos adicionais (2º, 3º, etc.). O
                  primeiro equipamento não tem desconto.</span
                >
              </div>

              <!-- Equipment Cards -->
              <div
                v-for="(equipment, index) in form.cpaEquipments"
                :key="equipment.id"
                class="equipment-card"
              >
                <div class="equipment-card-header">
                  <h6>Equipamento {{ index + 1 }}</h6>
                  <button
                    type="button"
                    @click="removeCPAEquipment(index)"
                    class="btn btn-remove-equipment"
                    v-if="form.cpaEquipments.length > 1"
                  >
                    ❌
                  </button>
                </div>

                <div class="form-grid">
                  <div class="form-group">
                    <label :for="`modeloCPA-${equipment.id}`">MODELO</label>
                    <input
                      type="text"
                      :id="`modeloCPA-${equipment.id}`"
                      v-model="equipment.modelo"
                      class="form-control"
                      placeholder="Ex: GEST 15"
                    />
                  </div>

                  <div class="form-group">
                    <label :for="`numeroSerieCPA-${equipment.id}`">Nº SÉRIE</label>
                    <input
                      type="text"
                      :id="`numeroSerieCPA-${equipment.id}`"
                      v-model="equipment.numeroSerie"
                      class="form-control"
                      placeholder="Ex: 1234567"
                    />
                  </div>

                  <!-- Discount only for 2nd equipment onwards (N+1) -->
                  <div class="form-group" v-if="index > 0">
                    <label :for="`descontoCPA-${equipment.id}`">DESCONTO (%)</label>
                    <input
                      type="number"
                      :id="`descontoCPA-${equipment.id}`"
                      v-model.number="equipment.desconto"
                      class="form-control"
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>

                  <div class="form-group" :class="{ 'full-width-field': index === 0 }">
                    <label :for="`observacoesCPA-${equipment.id}`">OBSERVAÇÕES</label>
                    <textarea
                      :id="`observacoesCPA-${equipment.id}`"
                      v-model="equipment.observacoes"
                      class="form-control"
                      placeholder="Observações sobre este equipamento..."
                      rows="2"
                    ></textarea>
                  </div>
                </div>
              </div>

              <!-- Empty state -->
              <div v-if="form.cpaEquipments.length === 0" class="no-equipment-message">
                Nenhum equipamento adicionado. Clique em "Adicionar Equipamento" para começar.
              </div>
            </div>

            <!-- CPA Contract Dates -->
            <div class="equipment-info-section">
              <h5>Datas do Contrato</h5>
              <div class="form-grid">
                <div class="form-group">
                  <label for="inicioContratoCPA">INÍCIO DE CONTRATO</label>
                  <input
                    type="date"
                    id="inicioContratoCPA"
                    v-model="form.inicioContratoCPA"
                    class="form-control"
                  />
                </div>

                <div class="form-group">
                  <label for="fimContratoCPA">FIM DE CONTRATO</label>
                  <input
                    type="date"
                    id="fimContratoCPA"
                    v-model="form.fimContratoCPA"
                    class="form-control"
                  />
                </div>
              </div>
            </div>

            <!-- CPA Plan Details Display -->
            <div
              v-if="
                selectedCPAPlanDetails && (form.cpaContractType === 'CPA_1500' || form.distanceCPA)
              "
              class="plan-details-card"
            >
              <h4>{{ selectedCPAPlanDetails.name }}</h4>
              <div class="plan-description">
                {{ selectedCPAPlanDetails.description }}
              </div>

              <div class="plan-features">
                <div class="feature-item">
                  <span class="feature-icon">🔧</span>
                  <span>{{ selectedCPAPlanDetails.maintenancePerYear }} manutenções por ano</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">📞</span>
                  <span>{{ selectedCPAPlanDetails.callouts }} deslocações</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">💻</span>
                  <span>{{ selectedCPAPlanDetails.remoteSupport }}</span>
                </div>
                <div class="feature-item" v-if="selectedCPAPlanDetails.weekendSupport">
                  <span class="feature-icon">📅</span>
                  <span>Suporte ao fim de semana</span>
                </div>
                <div class="feature-item" v-if="selectedCPAPlanDetails.additionalPackage">
                  <span class="feature-icon">📦</span>
                  <span
                    >{{ selectedCPAPlanDetails.additionalPackage.description }} (+{{
                      formatPrice(selectedCPAPlanDetails.additionalPackage.price)
                    }})</span
                  >
                </div>
              </div>

              <!-- POS Assistance Package (only for CPA_1500 PREMIUM) -->
              <div
                v-if="form.cpaContractType === 'CPA_1500' && form.planIdCPA === 'cpa_1500_premium'"
                class="pos-package-section"
              >
                <div class="pos-package-header">
                  <div class="pos-package-info">
                    <span class="feature-icon">📦</span>
                    <div class="pos-package-text">
                      <strong>Pack de 10h de assistência para o seu POS</strong>
                      <span class="pos-package-price">+{{ formatPrice(100) }}/ano</span>
                    </div>
                  </div>
                  <div class="toggle-switch">
                    <input
                      type="checkbox"
                      id="hasPOSPackage"
                      v-model="form.hasPOSPackage"
                      class="toggle-input"
                    />
                    <label for="hasPOSPackage" class="toggle-label">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div class="plan-pricing">
                <h5>Selecione a Modalidade de Pagamento:</h5>
                <div class="pricing-grid">
                  <button
                    type="button"
                    class="price-item"
                    :class="{ selected: form.modalidadePagamentoCPA === 'MENSAL' }"
                    @click="selectCPAPaymentMethod('MENSAL')"
                  >
                    <span class="price-label">Mensal</span>
                    <span class="price-value">{{ formatPrice(getCPAPrice('monthly')) }}</span>
                  </button>
                  <button
                    type="button"
                    class="price-item"
                    :class="{ selected: form.modalidadePagamentoCPA === 'TRIMESTRAL' }"
                    @click="selectCPAPaymentMethod('TRIMESTRAL')"
                    v-if="getCPAPrice('quarterly')"
                  >
                    <span class="price-label">Trimestral</span>
                    <span class="price-value">{{ formatPrice(getCPAPrice('quarterly')) }}</span>
                  </button>
                  <button
                    type="button"
                    class="price-item"
                    :class="{ selected: form.modalidadePagamentoCPA === 'SEMESTRAL' }"
                    @click="selectCPAPaymentMethod('SEMESTRAL')"
                    v-if="getCPAPrice('semiannual')"
                  >
                    <span class="price-label">Semestral</span>
                    <span class="price-value">{{ formatPrice(getCPAPrice('semiannual')) }}</span>
                  </button>
                  <button
                    type="button"
                    class="price-item"
                    :class="{ selected: form.modalidadePagamentoCPA === 'ANUAL' }"
                    @click="selectCPAPaymentMethod('ANUAL')"
                  >
                    <span class="price-label">Anual</span>
                    <span class="price-value">{{ formatPrice(getCPAPrice('annual')) }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- S&H Contract Plan -->
        <div class="contract-type-section">
          <div class="contract-type-header">
            <h3>S&H - Software e Hardware</h3>
            <div class="toggle-switch">
              <input
                type="checkbox"
                id="hasSH"
                v-model="form.hasSHContract"
                class="toggle-input"
                @change="onSHToggle"
              />
              <label for="hasSH" class="toggle-label">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div v-if="form.hasSHContract" class="contract-type-content">
            <div class="form-grid">
              <div class="form-group">
                <label for="planIdSH">PLANO S&H *</label>
                <select
                  id="planIdSH"
                  v-model="form.planIdSH"
                  class="form-control"
                  :required="form.hasSHContract"
                  @change="onSHPlanChange"
                >
                  <option value="">Selecione o plano...</option>
                  <option
                    v-for="plan in contractPlans['S&H'].plans"
                    :key="plan.id"
                    :value="plan.id"
                  >
                    {{ plan.name }}
                  </option>
                </select>
              </div>

              <div class="form-group" v-if="form.planIdSH">
                <label for="distanceSH">DISTÂNCIA *</label>
                <select
                  id="distanceSH"
                  v-model="form.distanceSH"
                  class="form-control"
                  :required="form.hasSHContract"
                  @change="onSHDistanceChange"
                >
                  <option value="">Selecione a distância...</option>
                  <option value="under180km">Menos de 180 km</option>
                  <option value="over180km">Mais de 180 km</option>
                </select>
              </div>
            </div>

            <!-- S&H Equipment Information -->
            <div class="equipment-info-section">
              <h5>Informação do Equipamento</h5>
              <div class="form-grid">
                <div class="form-group">
                  <label for="modeloPSO">MODELO</label>
                  <input
                    type="text"
                    id="modeloPSO"
                    v-model="form.modeloPSO"
                    class="form-control"
                    placeholder="Ex: Dell Optiplex 7090"
                  />
                </div>

                <div class="form-group">
                  <label for="numeroSeriePSO">Nº SÉRIE</label>
                  <input
                    type="text"
                    id="numeroSeriePSO"
                    v-model="form.numeroSeriePSO"
                    class="form-control"
                    placeholder="Ex: ABC123456"
                  />
                </div>

                <div class="form-group">
                  <label for="softwarePSO">SOFTWARE</label>
                  <input
                    type="text"
                    id="softwarePSO"
                    v-model="form.softwarePSO"
                    class="form-control"
                    placeholder="Ex: Windows 11 Pro"
                  />
                </div>
              </div>
            </div>

            <!-- S&H Contract Dates -->
            <div class="equipment-info-section">
              <h5>Datas do Contrato</h5>
              <div class="form-grid">
                <div class="form-group">
                  <label for="inicioContratoSH">INÍCIO DE CONTRATO</label>
                  <input
                    type="date"
                    id="inicioContratoSH"
                    v-model="form.inicioContratoSH"
                    class="form-control"
                  />
                </div>

                <div class="form-group">
                  <label for="fimContratoSH">FIM DE CONTRATO</label>
                  <input
                    type="date"
                    id="fimContratoSH"
                    v-model="form.fimContratoSH"
                    class="form-control"
                  />
                </div>
              </div>
            </div>

            <!-- S&H Plan Details Display -->
            <div v-if="selectedSHPlanDetails && form.distanceSH" class="plan-details-card">
              <h4>{{ selectedSHPlanDetails.name }}</h4>
              <div class="plan-description">
                {{ selectedSHPlanDetails.description }}
              </div>

              <div class="plan-features">
                <div class="feature-item">
                  <span class="feature-icon">⏱️</span>
                  <span>{{ selectedSHPlanDetails.hoursPerYear }} horas por ano</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">🚗</span>
                  <span>{{
                    selectedSHPlanDetails.displacementsIncluded === 'ilimitadas'
                      ? 'Deslocações ilimitadas'
                      : `${selectedSHPlanDetails.displacementsIncluded} deslocações incluídas`
                  }}</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">💻</span>
                  <span>{{ selectedSHPlanDetails.remoteSupport }}</span>
                </div>
                <div class="feature-item" v-if="selectedSHPlanDetails.softwareUpdates">
                  <span class="feature-icon">🔄</span>
                  <span>Atualizações de software incluídas</span>
                </div>
                <div class="feature-item" v-if="selectedSHPlanDetails.prioritySupport">
                  <span class="feature-icon">⭐</span>
                  <span>Suporte prioritário</span>
                </div>
                <div class="feature-item" v-if="selectedSHPlanDetails.dedicatedManager">
                  <span class="feature-icon">👤</span>
                  <span>Gestor de conta dedicado</span>
                </div>
              </div>

              <div class="plan-pricing">
                <h5>Selecione a Modalidade de Pagamento:</h5>
                <div class="pricing-grid">
                  <button
                    type="button"
                    class="price-item"
                    :class="{ selected: form.modalidadePagamentoSH === 'MENSAL' }"
                    @click="selectSHPaymentMethod('MENSAL')"
                  >
                    <span class="price-label">Mensal</span>
                    <span class="price-value">{{ formatPrice(getSHPrice('monthly')) }}</span>
                  </button>
                  <button
                    type="button"
                    class="price-item"
                    :class="{ selected: form.modalidadePagamentoSH === 'TRIMESTRAL' }"
                    @click="selectSHPaymentMethod('TRIMESTRAL')"
                  >
                    <span class="price-label">Trimestral</span>
                    <span class="price-value">{{ formatPrice(getSHPrice('quarterly')) }}</span>
                  </button>
                  <button
                    type="button"
                    class="price-item"
                    :class="{ selected: form.modalidadePagamentoSH === 'ANUAL' }"
                    @click="selectSHPaymentMethod('ANUAL')"
                  >
                    <span class="price-label">Anual</span>
                    <span class="price-value">{{ formatPrice(getSHPrice('annual')) }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Warning if no contract type selected -->
        <div v-if="!form.hasCPAContract && !form.hasSHContract" class="warning-message">
          ⚠️ Selecione pelo menos um tipo de contrato (CPA e/ou S&H)
        </div>
      </section>

      <!-- Payment Method Section -->
      <section class="form-section">
        <h2>INFORMAÇÃO ADICIONAL</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="metodoPagamento">MÉTODO DE PAGAMENTO</label>
            <select id="metodoPagamento" v-model="form.metodoPagamento" class="form-control">
              <option value="">Selecione o método...</option>
              <option value="TRANSFERENCIA_BANCARIA">Transferência Bancária</option>
              <option value="DEBITO_DIRETO">Débito Direto</option>
              <option value="MULTIBANCO">Multibanco</option>
              <option value="CHEQUE">Cheque</option>
              <option value="NUMERARIO">Numerário</option>
              <option value="MB_WAY">MB WAY</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" @click="navigateBack" class="btn btn-secondary">Cancelar</button>
        <button type="submit" class="btn btn-primary" :disabled="!validateForm()">
          {{ isEditing ? 'Atualizar' : 'Criar' }} Contrato
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import BackButton from '@/components/BackButton.vue';
import ClienteSearchSelect from '@/components/ClienteSearchSelect.vue';
import { useContratosStore } from '@/stores/contratos.js';
import { useClientesStore } from '@/stores/clientes.js';
import contractPlans from '@/config/contract-plans.json';

// Router
const route = useRoute();
const router = useRouter();

// Store
const store = useContratosStore();
const { loading, error, selectedContrato, currentYear } = storeToRefs(store);
const { fetchContratoById, clearError } = store;

// Clients store
const clientesStore = useClientesStore();
const { clientes } = storeToRefs(clientesStore);
const { fetchClientes, fetchClienteById } = clientesStore;

// Determine if we're editing or creating
const isEditing = computed(() => !!route.params.id);

// Default form structure
const defaultForm = {
  selectedClienteId: '',
  clienteId: '', // Store the actual client ID
  clienteName: '', // Store client name for list display
  nome: '',
  nomeComercial: '',
  nomeSocial: '',
  contribuinte: '',
  contacto: '',
  email: '',
  morada: '',
  hasCPAContract: false,
  cpaContractType: '', // CPA or CPA_2023
  planIdCPA: '',
  planoCPA: '',
  distanceCPA: '',
  hasPOSPackage: false, // Optional POS assistance package for CPA_1500 PREMIUM
  hasSHContract: false,
  planIdSH: '',
  planoSH: '',
  distanceSH: '',
  planoContrato: '', // Legacy field for backward compatibility
  modalidadePagamentoCPA: '',
  modalidadePagamentoSH: '',
  temCPA: false,
  modeloCPA: '', // Legacy - kept for backward compatibility
  numeroSerieCPA: '', // Legacy - kept for backward compatibility
  cpaEquipments: [], // New: Array of CPA equipments with discounts
  temPSO: false,
  modeloPSO: '',
  numeroSeriePSO: '',
  softwarePSO: '',
  inicioContratoCPA: '',
  inicioContratoSH: '',
  fimContratoCPA: '',
  fimContratoSH: '',
  horasAssistenciaAnual: 0,
  deslocacoesPorAno: 0,
  manutencoesPorAno: 0,
  metodoPagamento: '',
};

// Form state
const form = reactive({ ...defaultForm });

// Computed properties for plan selection
const availableCPAPlans = computed(() => {
  if (!form.cpaContractType) return [];
  return contractPlans[form.cpaContractType]?.plans || [];
});

const selectedCPAPlanDetails = computed(() => {
  if (!form.planIdCPA || !form.cpaContractType) return null;
  const plans = contractPlans[form.cpaContractType]?.plans || [];
  return plans.find(plan => plan.id === form.planIdCPA);
});

const selectedSHPlanDetails = computed(() => {
  if (!form.planIdSH) return null;
  const plans = contractPlans['S&H']?.plans || [];
  return plans.find(plan => plan.id === form.planIdSH);
});

// Computed properties
const cancelRoute = computed(() => {
  if (isEditing.value) {
    return `/contratos/${route.params.id}?year=${route.query.year || currentYear.value}`;
  } else {
    return '/contratos/list';
  }
});

// Methods
const loadContratoData = async () => {
  if (isEditing.value) {
    try {
      const year = route.query.year || currentYear.value;
      const id = route.params.id;

      console.log('Loading contrato data for edit:', { id, year });

      // Clear any previous data
      selectedContrato.value = null;

      try {
        // Try the store method first
        await fetchContratoById(year, id);
        console.log('Contrato fetched via store, selectedContrato:', selectedContrato.value);
      } catch (storeError) {
        console.warn('Store method failed, trying direct API call:', storeError);

        // Fallback to direct API call
        const response = await fetch(`/api/contratos/${year}/${id}`);
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const contrato = await response.json();
        console.log('Contrato fetched via direct API:', contrato);

        // Manually set the selectedContrato
        selectedContrato.value = contrato;
      }
    } catch (err) {
      console.error('Failed to load contrato data:', err);
      router.push('/contratos/list');
    }
  }
};

// Function to populate form with selected contrato data
const populateFormFromSelectedContrato = async () => {
  if (!selectedContrato.value || !isEditing.value) return;

  console.log('Populating form with data:', selectedContrato.value);

  // Reset form to defaults first
  Object.assign(form, JSON.parse(JSON.stringify(defaultForm)));

  // Populate with selected contrato data
  Object.keys(form).forEach(key => {
    if (selectedContrato.value[key] !== undefined) {
      form[key] = selectedContrato.value[key];
    }
  });

  // Handle CPA equipment migration from old format to new format
  if (selectedContrato.value.cpaEquipments && Array.isArray(selectedContrato.value.cpaEquipments)) {
    // New format: use the array directly, ensuring first equipment has 0 discount
    form.cpaEquipments = selectedContrato.value.cpaEquipments.map((eq, index) => ({
      id: eq.id || Date.now() + Math.random(),
      modelo: eq.modelo || '',
      numeroSerie: eq.numeroSerie || '',
      desconto: index === 0 ? 0 : eq.desconto || 0, // First equipment always 0%
      observacoes: eq.observacoes || '',
    }));
  } else if (selectedContrato.value.modeloCPA || selectedContrato.value.numeroSerieCPA) {
    // Old format: migrate single equipment to array (first equipment = 0% discount)
    form.cpaEquipments = [
      {
        id: Date.now(),
        modelo: selectedContrato.value.modeloCPA || '',
        numeroSerie: selectedContrato.value.numeroSerieCPA || '',
        desconto: 0, // First equipment always 0%
        observacoes: '',
      },
    ];
  } else if (form.hasCPAContract) {
    // No equipment data but has CPA contract: initialize with one empty equipment
    form.cpaEquipments = [
      {
        id: Date.now(),
        modelo: '',
        numeroSerie: '',
        desconto: 0, // First equipment always 0%
        observacoes: '',
      },
    ];
  }

  // Set clienteId and clienteName from contrato
  if (selectedContrato.value.clienteId) {
    form.clienteId = selectedContrato.value.clienteId;
    form.clienteName = selectedContrato.value.clienteName || '';
    form.selectedClienteId = selectedContrato.value.clienteId;

    // Fetch cliente data to populate form fields
    try {
      const cliente = await fetchClienteById(selectedContrato.value.clienteId);
      if (cliente) {
        // Populate read-only display fields from client data
        form.nome = cliente.nomeComercial || cliente.nomeEmpresa || '';
        form.nomeComercial = cliente.nomeComercial || '';
        form.nomeSocial = cliente.nomeEmpresa || '';
        form.contribuinte = cliente.contribuinte || '';

        // Populate contact fields from client data (read-only)
        form.contacto = cliente.telefoneContato || cliente.telefone || '';
        form.email = cliente.email || '';
        form.morada = cliente.morada || '';
      }
    } catch (err) {
      console.error('Error fetching cliente data:', err);
      // If cliente fetch fails, use data from contrato if available
      if (selectedContrato.value.clienteName) {
        form.nome = selectedContrato.value.clienteName;
        form.nomeComercial = selectedContrato.value.clienteName;
      }
    }
  } else {
    // Fallback: Try to find the matching client by name if clienteId is missing
    if (selectedContrato.value.clienteName && clientes.value.length > 0) {
      const matchingCliente = clientes.value.find(
        c =>
          (c.nomeComercial && c.nomeComercial === selectedContrato.value.clienteName) ||
          (c.nomeEmpresa && c.nomeEmpresa === selectedContrato.value.clienteName)
      );
      if (matchingCliente) {
        form.selectedClienteId = matchingCliente.id;
        form.clienteId = matchingCliente.id;
        form.clienteName = matchingCliente.nomeComercial || matchingCliente.nomeEmpresa || '';

        // Populate form fields from matching cliente
        form.nome = matchingCliente.nomeComercial || matchingCliente.nomeEmpresa || '';
        form.nomeComercial = matchingCliente.nomeComercial || '';
        form.nomeSocial = matchingCliente.nomeEmpresa || '';
        form.contribuinte = matchingCliente.contribuinte || '';
        form.contacto = matchingCliente.telefoneContato || matchingCliente.telefone || '';
        form.email = matchingCliente.email || '';
        form.morada = matchingCliente.morada || '';
      }
    }
  }

  console.log('Form populated with data:', form);
};

// Method to handle client selection
const onClienteChange = cliente => {
  if (cliente && form.selectedClienteId) {
    // Store the client ID and name (for list display)
    form.clienteId = cliente.id;
    form.clienteName = cliente.nomeComercial || '';

    // Populate read-only display fields from client data
    form.nome = cliente.nomeComercial || '';
    form.nomeComercial = cliente.nomeComercial || '';
    form.nomeSocial = cliente.nomeEmpresa || '';
    form.contribuinte = cliente.contribuinte || '';

    // Populate contact fields from client data (read-only)
    form.contacto = cliente.telefoneContato || cliente.telefone || '';
    form.email = cliente.email || '';
    form.morada = cliente.morada || '';
  } else {
    // Clear all fields when no client is selected
    form.clienteId = '';
    form.clienteName = '';
    form.nome = '';
    form.nomeComercial = '';
    form.nomeSocial = '';
    form.contribuinte = '';
    form.contacto = '';
    form.email = '';
    form.morada = '';
  }
};

// Handle CPA contract toggle
const onCPAToggle = () => {
  if (!form.hasCPAContract) {
    form.cpaContractType = '';
    form.planIdCPA = '';
    form.planoCPA = '';
    form.distanceCPA = '';
    form.modalidadePagamentoCPA = '';
    form.manutencoesPorAno = 0;
    form.cpaEquipments = [];
  } else {
    // Initialize with one equipment if enabling CPA contract
    if (form.cpaEquipments.length === 0) {
      addCPAEquipment();
    }
  }
};

// Add CPA equipment
const addCPAEquipment = () => {
  const isFirstEquipment = form.cpaEquipments.length === 0;
  form.cpaEquipments.push({
    id: Date.now(),
    modelo: '',
    numeroSerie: '',
    desconto: isFirstEquipment ? 0 : 0, // First equipment always has 0% discount
    observacoes: '',
  });
};

// Remove CPA equipment
const removeCPAEquipment = index => {
  if (form.cpaEquipments.length > 1) {
    form.cpaEquipments.splice(index, 1);
  }
};

// Handle CPA contract type change
const onCPAContractTypeChange = () => {
  // Clear plan selection when contract type changes
  form.planIdCPA = '';
  form.planoCPA = '';
  form.distanceCPA = '';
  form.modalidadePagamentoCPA = '';
  form.manutencoesPorAno = 0;
  form.hasPOSPackage = false;
};

// Handle S&H contract toggle
const onSHToggle = () => {
  if (!form.hasSHContract) {
    form.planIdSH = '';
    form.planoSH = '';
    form.distanceSH = '';
    form.modalidadePagamentoSH = '';
    form.horasAssistenciaAnual = 0;
  }
};

// Handle CPA plan selection change
const onCPAPlanChange = () => {
  if (selectedCPAPlanDetails.value) {
    // Auto-populate fields based on selected CPA plan
    form.planoCPA = selectedCPAPlanDetails.value.description;
    form.manutencoesPorAno = selectedCPAPlanDetails.value.maintenancePerYear || 0;

    // Clear distance and payment method when changing plan
    form.distanceCPA = '';
    form.modalidadePagamentoCPA = '';

    // Clear POS package if not CPA_1500 PREMIUM
    if (form.cpaContractType !== 'CPA_1500' || form.planIdCPA !== 'cpa_1500_premium') {
      form.hasPOSPackage = false;
    }

    // Update combined field for backward compatibility
    updateCombinedPlanoContrato();
  }
};

// Handle CPA distance selection change
const onCPADistanceChange = () => {
  // Clear payment method when changing distance
  form.modalidadePagamentoCPA = '';
};

// Handle S&H plan selection change
const onSHPlanChange = () => {
  if (selectedSHPlanDetails.value) {
    // Auto-populate fields based on selected S&H plan
    form.planoSH = selectedSHPlanDetails.value.description;
    form.horasAssistenciaAnual = selectedSHPlanDetails.value.hoursPerYear || 0;

    // Calculate displacements (999 for unlimited)
    const displacements =
      selectedSHPlanDetails.value.displacementsIncluded === 'ilimitadas'
        ? 999
        : selectedSHPlanDetails.value.displacementsIncluded || 0;

    // Only set displacements if CPA doesn't have a value
    if (!form.hasCPAContract || !form.planIdCPA) {
      form.deslocacoesPorAno = displacements;
    }

    // Clear distance and payment method when changing plan
    form.distanceSH = '';
    form.modalidadePagamentoSH = '';

    // Update combined field for backward compatibility
    updateCombinedPlanoContrato();
  }
};

// Handle S&H distance selection change
const onSHDistanceChange = () => {
  // Clear payment method when changing distance
  form.modalidadePagamentoSH = '';
};

// Handle CPA payment method selection
const selectCPAPaymentMethod = method => {
  form.modalidadePagamentoCPA = method;
};

// Handle S&H payment method selection
const selectSHPaymentMethod = method => {
  form.modalidadePagamentoSH = method;
};

// Update combined planoContrato field (for backward compatibility)
const updateCombinedPlanoContrato = () => {
  const parts = [];
  if (form.hasCPAContract && form.planoCPA) {
    parts.push('=== CPA - CASHLOGY ===\n' + form.planoCPA);
  }
  if (form.hasSHContract && form.planoSH) {
    parts.push('=== S&H - SOFTWARE E HARDWARE ===\n' + form.planoSH);
  }
  form.planoContrato = parts.join('\n\n');
};

// Get CPA price based on distance or direct pricing
const getCPAPrice = period => {
  if (!selectedCPAPlanDetails.value) return 0;

  let basePrice = 0;

  // CPA_1500 has direct pricing (no distance-based)
  if (form.cpaContractType === 'CPA_1500') {
    basePrice = selectedCPAPlanDetails.value.prices?.[period] || 0;
  } else {
    // CPA (2023) has distance-based pricing
    if (!form.distanceCPA) return 0;
    basePrice = selectedCPAPlanDetails.value.prices[form.distanceCPA]?.[period] || 0;
  }

  // Add POS package cost if selected (only for CPA_1500 PREMIUM)
  if (
    form.hasPOSPackage &&
    form.cpaContractType === 'CPA_1500' &&
    form.planIdCPA === 'cpa_1500_premium'
  ) {
    const posPackageAnnualCost = 100;
    let posPackageCost = 0;

    switch (period) {
      case 'monthly':
        posPackageCost = posPackageAnnualCost / 12;
        break;
      case 'quarterly':
        posPackageCost = posPackageAnnualCost / 4;
        break;
      case 'semiannual':
        posPackageCost = posPackageAnnualCost / 2;
        break;
      case 'annual':
        posPackageCost = posPackageAnnualCost;
        break;
    }

    basePrice += posPackageCost;
  }

  return basePrice;
};

// Get S&H price based on distance
const getSHPrice = period => {
  if (!selectedSHPlanDetails.value || !form.distanceSH) return 0;
  return selectedSHPlanDetails.value.prices[form.distanceSH]?.[period] || 0;
};

// Format price for display
const formatPrice = price => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
};

const validateForm = () => {
  const hasBasicInfo = form.selectedClienteId && form.nome && form.nomeComercial;
  const hasAtLeastOneContract = form.hasCPAContract || form.hasSHContract;

  // CPA validation depends on contract type
  let cpaValid = true;
  if (form.hasCPAContract) {
    if (!form.cpaContractType || !form.planIdCPA || !form.modalidadePagamentoCPA) {
      cpaValid = false;
    }
    // Distance is only required for CPA (2023) - not CPA_1500
    if (form.cpaContractType === 'CPA' && !form.distanceCPA) {
      cpaValid = false;
    }
    // At least one equipment should be present (but fields can be empty)
    if (!form.cpaEquipments || form.cpaEquipments.length === 0) {
      cpaValid = false;
    }
  }

  const shValid =
    !form.hasSHContract || (form.planIdSH && form.distanceSH && form.modalidadePagamentoSH);

  return hasBasicInfo && hasAtLeastOneContract && cpaValid && shValid;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  try {
    const year = form.inicioContratoCPA
      ? new Date(form.inicioContratoCPA).getFullYear()
      : new Date().getFullYear();

    // Prepare contrato data - ONLY include clienteId and clienteName, not duplicate contact fields
    const contratoData = {
      clienteId: form.selectedClienteId,
      clienteName: form.clienteName,
      // Contract plan information
      hasCPAContract: form.hasCPAContract,
      cpaContractType: form.cpaContractType,
      planIdCPA: form.planIdCPA,
      planoCPA: form.planoCPA,
      distanceCPA: form.distanceCPA,
      modalidadePagamentoCPA: form.modalidadePagamentoCPA,
      cpaEquipments: form.cpaEquipments, // New: Array of equipments with discounts
      modeloCPA: form.modeloCPA, // Legacy - for backward compatibility
      numeroSerieCPA: form.numeroSerieCPA, // Legacy - for backward compatibility
      inicioContratoCPA: form.inicioContratoCPA,
      fimContratoCPA: form.fimContratoCPA,

      hasSHContract: form.hasSHContract,
      planIdSH: form.planIdSH,
      planoSH: form.planoSH,
      distanceSH: form.distanceSH,
      modalidadePagamentoSH: form.modalidadePagamentoSH,
      modeloPSO: form.modeloPSO,
      numeroSeriePSO: form.numeroSeriePSO,
      softwarePSO: form.softwarePSO,
      inicioContratoSH: form.inicioContratoSH,
      fimContratoSH: form.fimContratoSH,

      // Service details
      horasAssistenciaAnual: form.horasAssistenciaAnual,
      deslocacoesPorAno: form.deslocacoesPorAno,
      manutencoesPorAno: form.manutencoesPorAno,

      // Additional information
      metodoPagamento: form.metodoPagamento,

      // Legacy fields for backward compatibility
      planoContrato: form.planoContrato,
      temCPA: form.temCPA,
      temPSO: form.temPSO,
    };

    if (isEditing.value) {
      const id = route.params.id;
      await store.updateContrato(year, id, contratoData);
      router.push(`/contratos/${id}?year=${year}`);
    } else {
      const newContrato = await store.createContrato(year, contratoData);
      router.push(`/contratos/${newContrato.id}?year=${year}`);
    }
  } catch (err) {
    console.error('Error saving contrato:', err);
  }
};

const navigateBack = () => {
  router.push(cancelRoute.value);
};

// Lifecycle hooks
onMounted(async () => {
  console.log('ContratoForm mounted, isEditing:', isEditing.value);

  // Fetch clients for dropdown first (needed for both create and edit)
  try {
    await fetchClientes();
    console.log('Clientes loaded:', clientes.value.length);
  } catch (error) {
    console.error('Error fetching clients:', error);
  }

  if (!isEditing.value) {
    // Clear any previous data for create mode
    selectedContrato.value = null;
    console.log('Create mode: form will show empty fields');
  } else {
    // Load data for edit mode
    try {
      await loadContratoData();
      // populateFormFromSelectedContrato will be called by the watcher
    } catch (error) {
      console.error('Error in onMounted:', error);
    }
  }
});

// Watch for changes in selectedContrato to populate the form
watch(
  selectedContrato,
  async (newValue, oldValue) => {
    console.log('selectedContrato watcher triggered:', {
      newValue,
      oldValue,
      isEditing: isEditing.value,
    });

    if (newValue && isEditing.value) {
      console.log('selectedContrato changed, populating form:', newValue);
      await populateFormFromSelectedContrato();
    }
  },
  { immediate: true }
);

// Watch for equipment changes to clear dependent fields
watch(
  () => form.temCPA,
  newValue => {
    if (!newValue) {
      form.modeloCPA = '';
      form.numeroSerieCPA = '';
    }
  }
);

watch(
  () => form.temPSO,
  newValue => {
    if (!newValue) {
      form.modeloPSO = '';
      form.numeroSeriePSO = '';
      form.softwarePSO = '';
    }
  }
);

// Watch for route changes to reload data if needed
watch(
  () => route.params.id,
  async (newId, oldId) => {
    console.log('Route param id changed:', { newId, oldId });

    if (newId && newId !== oldId && isEditing.value) {
      console.log('Route changed to edit different contrato, reloading data');
      await loadContratoData();
    }
  }
);
</script>

<style scoped>
.contrato-form-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
  background: #f5f5f5;
  min-height: 100vh;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-header h1 {
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

.contrato-form {
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

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
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

.form-control:required {
  border-left: 3px solid var(--primary-color);
}

.form-control[readonly] {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.form-control[readonly]:focus {
  background-color: #f8f9fa;
  border-color: #ddd;
  box-shadow: none;
}

/* Toggle switch styles */
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

.form-actions {
  padding: 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .contrato-form-container {
    padding: 0.5rem;
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

  .form-actions {
    padding: 1.5rem 1rem;
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .equipment-info-section {
    padding: 0.75rem;
  }

  .equipment-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .btn-add-equipment {
    width: 100%;
  }

  .btn-remove-equipment {
    width: auto;
    min-width: auto;
  }

  .equipment-card {
    padding: 0.75rem;
  }

  /* Adjust toggle switch for mobile */
  .toggle-switch .toggle-label {
    width: 45px;
    height: 22px;
  }

  .toggle-switch .toggle-slider {
    width: 18px;
    height: 18px;
  }

  .toggle-switch .toggle-input:checked + .toggle-label .toggle-slider {
    transform: translateX(23px);
  }
}

@media (max-width: 480px) {
  .form-header h1 {
    font-size: 1.5rem;
  }

  .form-section {
    padding: 0.75rem;
  }

  .form-section h2 {
    font-size: 0.9rem;
  }

  .toggle-switch .toggle-label {
    width: 40px;
    height: 20px;
  }

  .toggle-switch .toggle-slider {
    width: 16px;
    height: 16px;
  }

  .toggle-switch .toggle-input:checked + .toggle-label .toggle-slider {
    transform: translateX(20px);
  }
}

/* Section note */
.section-note {
  color: #6c757d;
  font-size: 0.9rem;
  font-style: italic;
  margin: -0.5rem 0 1.5rem 0;
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border-left: 3px solid var(--primary-color);
  border-radius: 4px;
}

/* Contract Type Section */
.contract-type-section {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.contract-type-section:last-of-type {
  margin-bottom: 1rem;
}

.contract-type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #dee2e6;
}

.contract-type-header h3 {
  color: #495057;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.contract-type-content {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
}

/* Equipment info section */
.equipment-info-section {
  background: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 1rem;
  margin: 1rem 0;
}

.equipment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.equipment-header h5 {
  color: #495057;
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.equipment-info-section h5 {
  color: #495057;
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

/* Equipment card */
.equipment-card {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.equipment-card:last-of-type {
  margin-bottom: 0;
}

.equipment-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #dee2e6;
}

.equipment-card-header h6 {
  color: #495057;
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* Add/Remove equipment buttons */
.btn-add-equipment {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.btn-add-equipment:hover {
  background: var(--primary-hover);
}

.btn-remove-equipment {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.7rem;
  min-width: auto;
  width: auto;
  height: auto;
  line-height: 1;
  transition: background-color 0.2s ease;
}

.btn-remove-equipment:hover {
  background: #c82333;
}

/* No equipment message */
.no-equipment-message {
  text-align: center;
  color: #6c757d;
  font-style: italic;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 2px dashed #dee2e6;
  margin-top: 1rem;
}

/* Full width field for first equipment (when no discount field) */
.full-width-field {
  grid-column: 1 / -1;
}

/* Equipment note */
.equipment-note {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: #e7f3ff;
  color: #004085;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border-left: 4px solid #0066cc;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.note-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

/* Warning message */
.warning-message {
  background: #fff3cd;
  color: #856404;
  padding: 1rem 1.5rem;
  border-radius: 6px;
  border-left: 4px solid #ffc107;
  font-weight: 500;
  text-align: center;
}

/* Plan Details Card */
.plan-details-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border: 2px solid var(--primary-color);
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
}

.plan-details-card h4 {
  color: var(--primary-color);
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.plan-details-card h5 {
  color: #495057;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.plan-description {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid var(--primary-color);
  margin-bottom: 1.5rem;
  white-space: pre-line;
  line-height: 1.6;
  color: #495057;
  font-size: 0.95rem;
}

.plan-features {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid var(--primary-color);
}

.feature-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.feature-item span:last-child {
  color: #495057;
  font-size: 0.9rem;
  line-height: 1.4;
}

.plan-pricing {
  background: white;
  padding: 1rem;
  border-radius: 6px;
}

.plan-pricing h4 {
  color: #495057;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
}

.price-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
  border: 2px solid #dee2e6;
  transition: all 0.2s ease;
  cursor: pointer;
  width: 100%;
  text-align: center;
}

.price-item:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background: #ffffff;
}

.price-item.selected {
  border-color: var(--primary-color);
  background: var(--primary-light);
  box-shadow: 0 4px 12px rgba(117, 174, 147, 0.3);
}

.price-item.selected .price-value {
  color: var(--primary-dark);
  font-weight: 800;
}

.price-label {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 600;
  text-transform: uppercase;
}

.price-value {
  font-size: 1.25rem;
  color: var(--primary-color);
  font-weight: 700;
}

/* POS Package Section */
.pos-package-section {
  background: #fff8e1;
  border: 2px solid #ffc107;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin: 1rem 0;
}

.pos-package-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.pos-package-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.pos-package-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pos-package-text strong {
  color: #495057;
  font-size: 1rem;
  font-weight: 600;
}

.pos-package-price {
  color: #856404;
  font-size: 0.9rem;
  font-weight: 600;
}

/* Mobile adjustments for plan details */
@media (max-width: 768px) {
  .section-note {
    font-size: 0.85rem;
    padding: 0.5rem;
  }

  .contract-type-section {
    padding: 1rem;
  }

  .contract-type-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .contract-type-header h3 {
    font-size: 1rem;
  }

  .plan-details-card {
    padding: 1rem;
  }

  .plan-details-card h4 {
    font-size: 1.1rem;
  }

  .plan-details-card h5 {
    font-size: 0.9rem;
  }

  .plan-description {
    font-size: 0.9rem;
    padding: 0.75rem;
  }

  .plan-features {
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .feature-item {
    padding: 0.4rem;
    font-size: 0.85rem;
  }

  .feature-icon {
    font-size: 1rem;
  }

  .pricing-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .price-item {
    padding: 0.5rem;
  }

  .price-value {
    font-size: 1.1rem;
  }

  .warning-message {
    font-size: 0.9rem;
    padding: 0.75rem 1rem;
  }
}

@media (max-width: 480px) {
  .contract-type-section {
    padding: 0.75rem;
  }

  .contract-type-header h3 {
    font-size: 0.9rem;
  }

  .pricing-grid {
    grid-template-columns: 1fr;
  }

  .plan-details-card h4 {
    font-size: 1rem;
  }

  .section-note {
    font-size: 0.8rem;
  }
}
</style>

<template>
  <div class="cliente-detail-container">
    <!-- Header -->
    <div class="detail-header">
      <BackButton to="/clientes/list" variant="inline" />
      <div class="header-content">
        <h1>{{ cliente?.nomeComercial || cliente?.nomeEmpresa || 'Cliente' }}</h1>
        <div class="header-meta">
          <span v-if="cliente?.contribuinte" class="contribuinte">
            NIF: {{ cliente.contribuinte }}
          </span>
          <span v-if="cliente?.localidade" class="localidade">
            {{ cliente.localidade }}
          </span>
        </div>
      </div>
      <div class="header-actions">
        <button @click="navigateToEdit" class="btn btn-edit">✏️ Editar</button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <p>A carregar cliente...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-alert">
      <p>{{ error }}</p>
      <button @click="clearError" class="close-btn">×</button>
    </div>

    <!-- Client Details -->
    <div v-if="!loading && cliente" class="detail-content">
      <!-- Basic Information Section -->
      <section class="detail-section">
        <h3>INFORMAÇÃO BÁSICA</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>NOME DA EMPRESA</label>
            <span>{{ cliente.nomeEmpresa || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>NOME COMERCIAL</label>
            <span>{{ cliente.nomeComercial || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>CONTRIBUINTE</label>
            <span>{{ cliente.contribuinte || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>RESPONSÁVEL</label>
            <span>{{ cliente.responsavel || '-' }}</span>
          </div>
        </div>
      </section>

      <!-- Contact Information Section -->
      <section class="detail-section">
        <h3>CONTACTOS</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>TELEFONE</label>
            <span>
              <a v-if="cliente.telefone" :href="`tel:${cliente.telefone}`" class="contact-link">
                {{ cliente.telefone }}
              </a>
              <span v-else>-</span>
            </span>
          </div>
          <div class="detail-item">
            <label>TELEFONE DO CONTACTO</label>
            <span>
              <a
                v-if="cliente.telefoneContato"
                :href="`tel:${cliente.telefoneContato}`"
                class="contact-link"
              >
                {{ cliente.telefoneContato }}
              </a>
              <span v-else>-</span>
            </span>
          </div>
          <div class="detail-item">
            <label>E-MAIL</label>
            <span>
              <a v-if="cliente.email" :href="`mailto:${cliente.email}`" class="contact-link">
                {{ cliente.email }}
              </a>
              <span v-else>-</span>
            </span>
          </div>
          <div class="detail-item">
            <label>E-MAIL DO CONTACTO</label>
            <span>
              <a
                v-if="cliente.emailContato"
                :href="`mailto:${cliente.emailContato}`"
                class="contact-link"
              >
                {{ cliente.emailContato }}
              </a>
              <span v-else>-</span>
            </span>
          </div>
        </div>
      </section>

      <!-- Address Information Section -->
      <section class="detail-section">
        <h3>MORADA</h3>
        <div class="detail-grid">
          <div class="detail-item full-width">
            <label>MORADA</label>
            <span class="address">{{ cliente.morada || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>CÓDIGO POSTAL</label>
            <span>{{ cliente.codigoPostal || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>LOCALIDADE</label>
            <span>{{ cliente.localidade || '-' }}</span>
          </div>
        </div>
      </section>

      <!-- Financial Information Section -->
      <section class="detail-section">
        <h3>INFORMAÇÃO FINANCEIRA</h3>
        <div class="detail-grid">
          <div class="detail-item full-width">
            <label>IBAN</label>
            <span class="iban">{{ cliente.iban || '-' }}</span>
          </div>
        </div>
      </section>

      <!-- Software Section -->
      <section class="detail-section">
        <h3>SOFTWARE</h3>

        <!-- New Software Structure -->
        <div v-if="cliente.softwares && cliente.softwares.length > 0" class="software-list">
          <div
            v-for="(software, index) in cliente.softwares"
            :key="software.id"
            class="software-item"
          >
            <div class="software-item-header">
              <strong>{{ software.name }}</strong>
            </div>
            <div class="software-details">
              <!-- Vectron -->
              <template v-if="software.name === 'Vectron'">
                <div class="software-detail-item" v-if="software.model">
                  <label>Modelo:</label>
                  <span>{{ software.model }}</span>
                </div>
                <div class="software-detail-item" v-if="software.nEquipamento">
                  <label>Nº Equipamento:</label>
                  <span>{{ software.nEquipamento }}</span>
                </div>
                <div class="software-detail-item" v-if="software.versaoSoftware">
                  <label>Versão do Software:</label>
                  <span>{{ software.versaoSoftware }}</span>
                </div>
              </template>

              <!-- Pix -->
              <template v-if="software.name === 'Pix'">
                <div class="software-detail-item" v-if="software.product">
                  <label>Produto:</label>
                  <span>{{ software.product }}</span>
                </div>
                <div
                  class="software-detail-item"
                  v-if="software.modules && software.modules.length > 0"
                >
                  <label>Módulos:</label>
                  <span>{{ software.modules.join(', ') }}</span>
                </div>
                <div class="software-detail-item" v-if="software.numeroSerie">
                  <label>Número Série:</label>
                  <span>{{ software.numeroSerie }}</span>
                </div>
                <div class="software-detail-item" v-if="software.versaoSoftware">
                  <label>Versão Software:</label>
                  <span>{{ software.versaoSoftware }}</span>
                </div>
                <div class="software-detail-item" v-if="software.versaoLicenca">
                  <label>Versão Licença:</label>
                  <span>{{ software.versaoLicenca }}</span>
                </div>
              </template>

              <!-- Zon Soft -->
              <template v-if="software.name === 'Zon Soft'">
                <div class="software-detail-item" v-if="software.product">
                  <label>Produto:</label>
                  <span>{{ software.product }}</span>
                </div>
                <div class="software-detail-item" v-if="software.version">
                  <label>Versão:</label>
                  <span>{{ software.version }}</span>
                </div>
                <div class="software-detail-item" v-if="software.numeroSerie">
                  <label>Número Série:</label>
                  <span>{{ software.numeroSerie }}</span>
                </div>
                <div class="software-detail-item" v-if="software.versaoSoftware">
                  <label>Versão Software:</label>
                  <span>{{ software.versaoSoftware }}</span>
                </div>
                <div class="software-detail-item" v-if="software.versaoLicenca">
                  <label>Versão Licença:</label>
                  <span>{{ software.versaoLicenca }}</span>
                </div>
              </template>

              <!-- Pt CERT -->
              <template v-if="software.name === 'Pt CERT'">
                <div class="software-detail-item" v-if="software.licenseType">
                  <label>Tipo de Licença:</label>
                  <span>{{ software.licenseType }}</span>
                </div>
                <div class="software-detail-item" v-if="software.numeroSerie">
                  <label>Número Série:</label>
                  <span>{{ software.numeroSerie }}</span>
                </div>
                <div class="software-detail-item" v-if="software.versaoSoftware">
                  <label>Versão Software:</label>
                  <span>{{ software.versaoSoftware }}</span>
                </div>
                <div class="software-detail-item" v-if="software.versaoLicenca">
                  <label>Versão Licença:</label>
                  <span>{{ software.versaoLicenca }}</span>
                </div>
              </template>

              <!-- Dream Soft & Contas Certas -->
              <template v-if="software.name === 'Dream Soft' || software.name === 'Contas Certas'">
                <div class="software-detail-item" v-if="software.numeroSerie">
                  <label>Número Série:</label>
                  <span>{{ software.numeroSerie }}</span>
                </div>
                <div class="software-detail-item" v-if="software.versaoSoftware">
                  <label>Versão Software:</label>
                  <span>{{ software.versaoSoftware }}</span>
                </div>
                <div class="software-detail-item" v-if="software.versaoLicenca">
                  <label>Versão Licença:</label>
                  <span>{{ software.versaoLicenca }}</span>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Legacy software display (for old data) -->
        <div v-else-if="hasLegacySoftware(cliente)" class="services-grid legacy-services">
          <div class="service-item active" v-if="cliente.vectron">
            <span class="service-icon">✅</span>
            <span class="service-name">VECTRON</span>
          </div>
          <div class="service-item active" v-if="cliente.dreamSoft">
            <span class="service-icon">✅</span>
            <span class="service-name">DREAM SOFT</span>
          </div>
          <div class="service-item active" v-if="cliente.ptcert">
            <span class="service-icon">✅</span>
            <span class="service-name">PTCERT</span>
          </div>
          <div class="service-item active" v-if="cliente.pix">
            <span class="service-icon">✅</span>
            <span class="service-name">PIX</span>
          </div>
          <div class="service-item active" v-if="cliente.zsrest">
            <span class="service-icon">✅</span>
            <span class="service-name">ZSREST</span>
          </div>
          <div class="service-item active" v-if="cliente.contasCertas">
            <span class="service-icon">✅</span>
            <span class="service-name">CONTAS CERTAS</span>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="no-software-message">Nenhum software registado</div>
      </section>

      <!-- Contratos Section -->
      <section class="detail-section">
        <h3>CONTRATOS</h3>

        <div v-if="contractosLoading" class="loading-contracts">A carregar contratos...</div>

        <div v-else-if="clienteContratos && clienteContratos.length > 0" class="contratos-list">
          <div v-for="contrato in clienteContratos" :key="contrato.id" class="contrato-card">
            <div class="contrato-header">
              <div class="contrato-icon">📄</div>
              <div class="contrato-title">
                <strong>{{ contrato.nomeComercial || contrato.nome }}</strong>
                <span class="contrato-year">Ano: {{ contrato.year }}</span>
              </div>
            </div>
            <div class="contrato-details">
              <!-- CPA Contract -->
              <div v-if="contrato.hasCPAContract" class="contrato-type">
                <span class="type-badge cpa">CPA - Cashlogy</span>
                <div class="type-details">
                  <div class="detail-row" v-if="contrato.planIdCPA">
                    <span class="detail-label">Plano:</span>
                    <span class="detail-value">{{ getPlanName(contrato.planIdCPA, 'CPA') }}</span>
                  </div>
                  <div class="detail-row" v-if="contrato.distanceCPA">
                    <span class="detail-label">Distância:</span>
                    <span class="detail-value">{{ formatDistance(contrato.distanceCPA) }}</span>
                  </div>
                  <div class="detail-row" v-if="contrato.modalidadePagamentoCPA">
                    <span class="detail-label">Pagamento:</span>
                    <span class="detail-value">{{ contrato.modalidadePagamentoCPA }}</span>
                  </div>
                  <div class="detail-row" v-if="getContractPrice(contrato, 'CPA')">
                    <span class="detail-label">Preço:</span>
                    <span class="detail-value price-highlight">{{
                      formatPrice(getContractPrice(contrato, 'CPA'))
                    }}</span>
                  </div>
                  <div class="detail-row" v-if="contrato.inicioContratoCPA">
                    <span class="detail-label">Início:</span>
                    <span class="detail-value">{{ formatDate(contrato.inicioContratoCPA) }}</span>
                  </div>
                  <div class="detail-row" v-if="contrato.fimContratoCPA">
                    <span class="detail-label">Fim:</span>
                    <span class="detail-value">{{ formatDate(contrato.fimContratoCPA) }}</span>
                  </div>
                </div>
              </div>

              <!-- S&H Contract -->
              <div v-if="contrato.hasSHContract" class="contrato-type">
                <span class="type-badge sh">S&H - Software e Hardware</span>
                <div class="type-details">
                  <div class="detail-row" v-if="contrato.planIdSH">
                    <span class="detail-label">Plano:</span>
                    <span class="detail-value">{{ getPlanName(contrato.planIdSH, 'S&H') }}</span>
                  </div>
                  <div class="detail-row" v-if="contrato.distanceSH">
                    <span class="detail-label">Distância:</span>
                    <span class="detail-value">{{ formatDistance(contrato.distanceSH) }}</span>
                  </div>
                  <div class="detail-row" v-if="contrato.modalidadePagamentoSH">
                    <span class="detail-label">Pagamento:</span>
                    <span class="detail-value">{{ contrato.modalidadePagamentoSH }}</span>
                  </div>
                  <div class="detail-row" v-if="getContractPrice(contrato, 'S&H')">
                    <span class="detail-label">Preço:</span>
                    <span class="detail-value price-highlight">{{
                      formatPrice(getContractPrice(contrato, 'S&H'))
                    }}</span>
                  </div>
                  <div class="detail-row" v-if="contrato.inicioContratoSH">
                    <span class="detail-label">Início:</span>
                    <span class="detail-value">{{ formatDate(contrato.inicioContratoSH) }}</span>
                  </div>
                  <div class="detail-row" v-if="contrato.fimContratoSH">
                    <span class="detail-label">Fim:</span>
                    <span class="detail-value">{{ formatDate(contrato.fimContratoSH) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="no-contratos-message">
          <p>Nenhum contrato registado para este cliente</p>
        </div>
      </section>

      <!-- Licenças Section -->
      <section class="detail-section">
        <h3>LICENÇAS</h3>

        <div v-if="licencasLoading" class="loading-contracts">
          <p>A carregar licenças...</p>
        </div>

        <div v-else-if="clienteLicencas.length > 0" class="licencas-list">
          <div
            v-for="licenca in clienteLicencas"
            :key="`${licenca.year}-${licenca.id}`"
            class="licenca-card"
          >
            <div class="licenca-header">
              <span class="licenca-icon">🔑</span>
              <div class="licenca-title-wrapper">
                <h4 class="licenca-title">{{ licenca.tipoSoftware }}</h4>
                <span class="licenca-year">{{ licenca.year }}</span>
              </div>
            </div>

            <div class="licenca-details">
              <div class="detail-row" v-if="licenca.versao">
                <span class="detail-label">Versão:</span>
                <span class="detail-value">{{ licenca.versao }}</span>
              </div>

              <div class="detail-row" v-if="licenca.numeroSerie">
                <span class="detail-label">Número de Série:</span>
                <span class="detail-value">{{ licenca.numeroSerie }}</span>
              </div>

              <div class="detail-row" v-if="licenca.modalidade">
                <span class="detail-label">Modalidade:</span>
                <span class="detail-value">{{ licenca.modalidade }}</span>
              </div>

              <div class="detail-row" v-if="licenca.dataInicio">
                <span class="detail-label">Data Início:</span>
                <span class="detail-value">{{ formatDate(licenca.dataInicio) }}</span>
              </div>

              <div class="detail-row" v-if="licenca.dataVencimento">
                <span class="detail-label">Data Vencimento:</span>
                <span class="detail-value">{{ formatDate(licenca.dataVencimento) }}</span>
              </div>

              <div class="detail-row" v-if="licenca.duracaoContrato">
                <span class="detail-label">Duração:</span>
                <span class="detail-value">{{ licenca.duracaoContrato }} meses</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="no-licencas-message">
          <p>Nenhuma licença registada para este cliente</p>
        </div>
      </section>

      <!-- Serviços Section -->
      <section class="detail-section">
        <h3>SERVIÇOS</h3>
        <div class="services-grid">
          <div class="service-item" :class="{ active: cliente.temAnydesk }">
            <span class="service-icon">{{ cliente.temAnydesk ? '✅' : '❌' }}</span>
            <span class="service-name">TEM ANYDESK</span>
          </div>
          <div class="service-item" :class="{ active: cliente.manutencao }">
            <span class="service-icon">{{ cliente.manutencao ? '✅' : '❌' }}</span>
            <span class="service-name">MANUTENÇÃO</span>
          </div>
          <div class="service-item" :class="{ active: cliente.manutencao24 }">
            <span class="service-icon">{{ cliente.manutencao24 ? '✅' : '❌' }}</span>
            <span class="service-name">MANUTENÇÃO 24H</span>
          </div>
          <div class="service-item" :class="{ active: cliente.dumps }">
            <span class="service-icon">{{ cliente.dumps ? '✅' : '❌' }}</span>
            <span class="service-name">DUMPS</span>
          </div>
          <div class="service-item" :class="{ active: cliente.atcud }">
            <span class="service-icon">{{ cliente.atcud ? '✅' : '❌' }}</span>
            <span class="service-name">ATCUD</span>
          </div>
          <div class="service-item" :class="{ active: cliente.vectronConnect }">
            <span class="service-icon">{{ cliente.vectronConnect ? '✅' : '❌' }}</span>
            <span class="service-name">VECTRON CONNECT</span>
          </div>
        </div>

        <!-- Conditional fields for ATCUD, DUMPS, and Vectron Connect -->
        <div
          v-if="cliente.atcud || cliente.dumps || cliente.vectronConnect"
          class="conditional-details"
        >
          <!-- ATCUD conditional fields -->
          <div v-if="cliente.atcud" class="atcud-details">
            <h4>DETALHES ATCUD</h4>
            <div class="detail-grid">
              <div class="detail-item" v-if="cliente.seriesDocumentos">
                <label>SÉRIES DE DOCUMENTOS</label>
                <span>{{ cliente.seriesDocumentos }}</span>
              </div>
              <div class="detail-item" v-if="cliente.atUsername">
                <label>AT USERNAME</label>
                <span>{{ cliente.atUsername }}</span>
              </div>
              <div class="detail-item" v-if="cliente.atPassword">
                <label>AT PASSWORD</label>
                <div class="password-field">
                  <span>{{
                    showAtPassword ? cliente.atPassword : '•'.repeat(cliente.atPassword.length)
                  }}</span>
                  <button
                    type="button"
                    @click="toggleAtPassword"
                    class="password-toggle-btn"
                    :title="showAtPassword ? 'Ocultar password' : 'Mostrar password'"
                  >
                    {{ showAtPassword ? '👁️' : '👁️‍🗨️' }}
                  </button>
                </div>
              </div>
              <!-- Legacy atClient field -->
              <div class="detail-item" v-if="!cliente.atUsername && cliente.atClient">
                <label>AT CLIENT</label>
                <span>{{ cliente.atClient }}</span>
              </div>
            </div>
          </div>

          <!-- DUMPS conditional field -->
          <div v-if="cliente.dumps" class="dumps-details">
            <h4>DETALHES DUMPS</h4>
            <div class="detail-grid">
              <div class="detail-item full-width" v-if="cliente.dumpsLink">
                <label>LINK GOOGLE DRIVE</label>
                <span>
                  <a :href="cliente.dumpsLink" target="_blank" class="contact-link">
                    {{ cliente.dumpsLink }}
                  </a>
                </span>
              </div>
            </div>
          </div>

          <!-- Vectron Connect conditional field -->
          <div v-if="cliente.vectronConnect" class="vectron-connect-details">
            <h4>DETALHES VECTRON CONNECT</h4>
            <div class="detail-grid">
              <div class="detail-item full-width" v-if="cliente.vectronAddress">
                <label>VECTRON ADDRESS</label>
                <span>{{ cliente.vectronAddress }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Additional Information Section -->
      <section class="detail-section" v-if="cliente.observacoes">
        <h3>OBSERVAÇÕES</h3>
        <div class="observacoes-content">
          <p>{{ cliente.observacoes }}</p>
        </div>
      </section>

      <!-- System Information -->
      <section class="detail-section system-info">
        <h3>INFORMAÇÃO DO SISTEMA</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>CLIENTE ID</label>
            <span>{{ cliente.id }}</span>
          </div>
          <div class="detail-item">
            <label>CRIADO EM</label>
            <span>{{ formatDateTime(cliente.createdAt) || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>ATUALIZADO EM</label>
            <span>{{ formatDateTime(cliente.updatedAt) || '-' }}</span>
          </div>
        </div>
      </section>
    </div>

    <!-- Action Buttons -->
    <div v-if="!loading && cliente" class="action-buttons">
      <button @click="navigateToEdit" class="btn btn-primary">✏️ Editar Cliente</button>
      <button @click="navigateToList" class="btn btn-secondary">📋 Lista de Clientes</button>
    </div>

    <!-- Not Found State -->
    <div v-if="!loading && !error && !cliente" class="not-found-state">
      <h2>Cliente não encontrado</h2>
      <p>O cliente pode ainda não estar disponível no sistema. Tentar novamente?</p>
      <div class="retry-actions">
        <button @click="retryLoad" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'A carregar...' : 'Tentar novamente' }}
        </button>
        <BackButton to="/clientes/list" variant="full-width" />
      </div>
      <p v-if="autoRetryCountdown > 0" class="auto-retry-info">
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
import { useClientesStore } from '@/stores/clientes.js';
import { useContratosStore } from '@/stores/contratos.js';
import { useLicencasStore } from '@/stores/licencas.js';
import contractPlans from '@/config/contract-plans.json';

// Router
const route = useRoute();
const router = useRouter();

// Clientes Store
const store = useClientesStore();
const { loading, error, selectedCliente } = storeToRefs(store);
const { fetchClienteById, clearError } = store;

// Contratos Store
const contratosStore = useContratosStore();
const contractosLoading = ref(false);
const clienteContratos = ref([]);

// Licenças Store
const licencasStore = useLicencasStore();
const licencasLoading = ref(false);
const clienteLicencas = ref([]);

// Password visibility state
const showAtPassword = ref(false);

// Auto-retry state
const autoRetryCountdown = ref(0);
const userInteractionCancelled = ref(false);
const retryTimeoutId = ref(null);

// Computed
const cliente = computed(() => selectedCliente.value);

// Methods
const formatDate = dateString => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString('pt-PT');
};

const formatDateTime = dateString => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleString('pt-PT');
};

const hasLegacySoftware = cliente => {
  return (
    cliente.vectron ||
    cliente.dreamSoft ||
    cliente.ptcert ||
    cliente.pix ||
    cliente.zsrest ||
    cliente.contasCertas
  );
};

const toggleAtPassword = () => {
  showAtPassword.value = !showAtPassword.value;
};

const navigateToEdit = () => {
  router.push(`/clientes/${route.params.id}/edit`);
};

const navigateToList = () => {
  router.push('/clientes/list');
};

// Contratos-related methods
const fetchClienteContratos = async clienteId => {
  contractosLoading.value = true;
  try {
    // Get the contratos array from the cliente
    const cliente = selectedCliente.value;
    if (!cliente || !cliente.contratos || cliente.contratos.length === 0) {
      clienteContratos.value = [];
      return;
    }

    // Fetch each contrato details
    const contratosPromises = cliente.contratos.map(async contratoRef => {
      try {
        const contrato = await contratosStore.fetchContratoById(contratoRef.year, contratoRef.id);
        return {
          ...contrato,
          year: contratoRef.year,
        };
      } catch (err) {
        console.error(`Error fetching contrato ${contratoRef.id}:`, err);
        return null;
      }
    });

    const contratos = await Promise.all(contratosPromises);
    clienteContratos.value = contratos.filter(c => c !== null);
  } catch (err) {
    console.error('Error fetching cliente contratos:', err);
    clienteContratos.value = [];
  } finally {
    contractosLoading.value = false;
  }
};

const fetchClienteLicencas = async clienteNomeComercial => {
  licencasLoading.value = true;
  try {
    // Fetch all licenses
    await licencasStore.fetchLicencasForYear(null); // Fetch all years

    // Filter licenses by cliente name (nomeComercial)
    const allLicencas = licencasStore.licencas || [];
    clienteLicencas.value = allLicencas.filter(licenca => licenca.cliente === clienteNomeComercial);

    console.log('Filtered licencas for cliente:', clienteLicencas.value.length);
  } catch (err) {
    console.error('Error fetching cliente licencas:', err);
    clienteLicencas.value = [];
  } finally {
    licencasLoading.value = false;
  }
};

const getPlanName = (planId, type) => {
  const plans = contractPlans[type]?.plans || [];
  const plan = plans.find(p => p.id === planId);
  return plan?.name || planId;
};

const formatDistance = distance => {
  if (distance === 'under180km') return '< 180 km';
  if (distance === 'over180km') return '> 180 km';
  return distance;
};

const getContractPrice = (contrato, type) => {
  if (type === 'CPA') {
    const planId = contrato.planIdCPA;
    const distance = contrato.distanceCPA;
    const paymentMethod = contrato.modalidadePagamentoCPA;

    if (!planId || !distance || !paymentMethod) return null;

    const plan = contractPlans.CPA?.plans?.find(p => p.id === planId);
    if (!plan) return null;

    const period = paymentMethod === 'MENSAL' ? 'monthly' : 'annual';
    return plan.prices?.[distance]?.[period] || null;
  } else if (type === 'S&H') {
    const planId = contrato.planIdSH;
    const distance = contrato.distanceSH;
    const paymentMethod = contrato.modalidadePagamentoSH;

    if (!planId || !distance || !paymentMethod) return null;

    const plan = contractPlans['S&H']?.plans?.find(p => p.id === planId);
    if (!plan) return null;

    const period = paymentMethod === 'MENSAL' ? 'monthly' : 'annual';
    return plan.prices?.[distance]?.[period] || null;
  }

  return null;
};

const formatPrice = price => {
  if (!price) return '-';
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
};

const retryLoad = () => {
  userInteractionCancelled.value = true;
  cancelAutoRetry();
  loadCliente();
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
      loadCliente();
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

const loadCliente = async () => {
  const id = route.params.id;
  if (!id) {
    router.push('/clientes/list');
    return;
  }

  try {
    clearError();
    await fetchClienteById(id);
    // If successful, cancel any pending retries
    cancelAutoRetry();

    // Fetch contratos after cliente is loaded
    await fetchClienteContratos(id);

    // Fetch licencas after cliente is loaded
    if (selectedCliente.value?.nomeComercial) {
      await fetchClienteLicencas(selectedCliente.value.nomeComercial);
    }
  } catch (err) {
    console.error('Error loading cliente:', err);
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

// Watch for successful data load to cancel retries
watch(
  () => cliente.value?.id,
  newId => {
    if (newId) {
      cancelAutoRetry();
      userInteractionCancelled.value = false;
    }
  }
);

// Lifecycle
onMounted(async () => {
  // Add event listeners for user interaction
  window.addEventListener('click', handleUserInteraction);
  window.addEventListener('scroll', handleUserInteraction);
  window.addEventListener('keydown', handleUserInteraction);

  await loadCliente();
});

onBeforeUnmount(() => {
  cancelAutoRetry();
  window.removeEventListener('click', handleUserInteraction);
  window.removeEventListener('scroll', handleUserInteraction);
  window.removeEventListener('keydown', handleUserInteraction);
});
</script>

<style scoped>
.cliente-detail-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
  background: #f5f5f5;
  min-height: 100vh;
}

.detail-header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(117, 174, 147, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.header-content {
  flex: 1;
  text-align: center;
}

.header-content h1 {
  font-size: 2rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.header-meta {
  display: flex;
  justify-content: center;
  gap: 1rem;
  font-size: 0.9rem;
  opacity: 0.9;
}

.contribuinte,
.localidade {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-edit:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
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

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.detail-section h3 {
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--primary-color);
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
}

.detail-item span {
  color: #333;
  font-size: 0.95rem;
  word-break: break-word;
}

.contact-link {
  color: var(--primary-color);
  text-decoration: none;
  transition: color 0.2s ease;
}

.contact-link:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}

/* Conditional details styling */
.conditional-details {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
}

.conditional-details h4 {
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.atcud-details,
.dumps-details {
  margin-bottom: 1rem;
}

.atcud-details:last-child,
.dumps-details:last-child {
  margin-bottom: 0;
}

/* Password field styling */
.password-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.password-field span {
  flex: 1;
  font-family: 'Monaco', 'Consolas', monospace;
  letter-spacing: 0.5px;
}

.password-toggle-btn {
  background: var(--primary-color);
  border: none;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 28px;
}

.password-toggle-btn:hover {
  background: var(--primary-hover);
  transform: scale(1.05);
}

.password-toggle-btn:active {
  transform: scale(0.95);
}

.address {
  white-space: pre-line;
  line-height: 1.4;
}

.iban {
  font-family: 'Monaco', 'Consolas', monospace;
  letter-spacing: 0.5px;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.service-item.active {
  background: #e8f5e8;
  border-color: var(--primary-color);
}

.service-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.service-name {
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.observacoes-content {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid var(--primary-color);
}

.observacoes-content p {
  margin: 0;
  line-height: 1.5;
  color: #333;
  white-space: pre-line;
}

.system-info {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.system-info h3 {
  color: #666;
  border-bottom-color: #ccc;
}

.system-info .detail-item label {
  color: #888;
}

.system-info .detail-item span {
  color: #666;
  font-size: 0.9rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
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
  background: #5a6268;
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

/* Software List Styling */
.software-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.software-item {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 1rem;
}

.software-item-header {
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #dee2e6;
}

.software-item-header strong {
  font-size: 1rem;
  color: #495057;
}

.software-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.software-detail-item {
  display: flex;
  gap: 0.5rem;
}

.software-detail-item label {
  font-weight: 600;
  color: #495057;
  min-width: 80px;
}

.software-detail-item span {
  color: #212529;
}

.no-software-message {
  text-align: center;
  color: #6c757d;
  font-style: italic;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 2px dashed #dee2e6;
}

.legacy-services {
  margin-top: 1rem;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .cliente-detail-container {
    padding: 0.5rem;
  }

  .detail-header {
    padding: 1.5rem 1rem;
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .header-content h1 {
    font-size: 1.5rem;
  }

  .header-meta {
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-section {
    padding: 1rem;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .services-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .action-buttons {
    flex-direction: column;
    padding: 1rem;
  }

  .software-item {
    padding: 0.75rem;
  }

  .software-detail-item {
    flex-direction: column;
    gap: 0.25rem;
  }

  .software-detail-item label {
    min-width: unset;
  }

  .contratos-list {
    grid-template-columns: 1fr;
  }

  .contrato-details {
    gap: 1rem;
  }
}

/* Contratos Section Styling */
.loading-contracts {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
}

.contratos-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
}

.contrato-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 1.25rem;
}

.contrato-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #dee2e6;
}

.contrato-icon {
  font-size: 1.75rem;
  flex-shrink: 0;
}

.contrato-title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.contrato-title strong {
  font-size: 1rem;
  color: #2c3e50;
}

.contrato-year {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 500;
}

.contrato-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.contrato-type {
  background: white;
  border-radius: 6px;
  padding: 0.75rem;
  border-left: 3px solid var(--primary-color);
}

.type-badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.75rem;
}

.type-badge.cpa {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #1976d2;
}

.type-badge.sh {
  background: #f3e5f5;
  color: #7b1fa2;
  border: 1px solid #7b1fa2;
}

.type-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.detail-label {
  font-weight: 600;
  color: #495057;
  min-width: 80px;
}

.detail-value {
  color: #212529;
}

.detail-value.price-highlight {
  color: var(--primary-color);
  font-weight: 700;
  font-size: 0.95rem;
}

.no-contratos-message {
  text-align: center;
  padding: 3rem 2rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #dee2e6;
}

.no-contratos-message p {
  color: #6c757d;
  font-style: italic;
  margin: 0 0 1.5rem 0;
  font-size: 1rem;
}

/* Licenças Section */
.licencas-list {
  display: grid;
  gap: 1rem;
}

.licenca-card {
  background: linear-gradient(135deg, #fffef8 0%, #fefcf3 100%);
  border: 2px solid #f4e9c0;
  border-radius: 8px;
  padding: 1.25rem;
}

.licenca-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f4e9c0;
}

.licenca-icon {
  font-size: 1.75rem;
  flex-shrink: 0;
}

.licenca-title-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  gap: 1rem;
}

.licenca-title {
  margin: 0;
  font-size: 1.1rem;
  color: #2c3e50;
  font-weight: 600;
}

.licenca-year {
  font-size: 0.85rem;
  color: #6c757d;
  background: #fff;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  border: 1px solid #dee2e6;
  font-weight: 500;
  white-space: nowrap;
}

.licenca-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.no-licencas-message {
  text-align: center;
  padding: 3rem 2rem;
  background: #fffef8;
  border-radius: 8px;
  border: 2px dashed #f4e9c0;
}

.no-licencas-message p {
  color: #6c757d;
  font-style: italic;
  margin: 0;
  font-size: 1rem;
}

@media (max-width: 480px) {
  .detail-header {
    padding: 1rem 0.75rem;
  }

  .header-content h1 {
    font-size: 1.25rem;
  }

  .detail-section h3 {
    font-size: 1.1rem;
  }

  .services-grid {
    grid-template-columns: 1fr;
  }

  .service-item {
    padding: 0.4rem 0.6rem;
  }

  .service-name {
    font-size: 0.75rem;
  }
}
</style>

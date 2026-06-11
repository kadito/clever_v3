<template>
  <div class="cliente-form-container">
    <div class="form-header">
      <BackButton
        :to="cancelRoute"
        variant="inline"
      />
      <h1>{{ isEditing ? 'Editar' : 'Novo' }} Cliente</h1>
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
      class="cliente-form"
      @submit.prevent="handleSubmit"
    >
      <!-- Basic Information Section -->
      <section class="form-section">
        <h2>INFORMAÇÃO BÁSICA</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="nomeEmpresa">NOME DA EMPRESA *</label>
            <input
              id="nomeEmpresa"
              v-model="form.nomeEmpresa"
              type="text"
              class="form-control"
              required
            >
          </div>

          <div class="form-group">
            <label for="nomeComercial">NOME COMERCIAL *</label>
            <input
              id="nomeComercial"
              v-model="form.nomeComercial"
              type="text"
              class="form-control"
              required
            >
          </div>

          <div class="form-group">
            <label for="contribuinte">CONTRIBUINTE</label>
            <input
              id="contribuinte"
              v-model="form.contribuinte"
              type="text"
              class="form-control"
              placeholder="123456789"
            >
          </div>

          <div class="form-group">
            <label for="responsavel">RESPONSÁVEL</label>
            <input
              id="responsavel"
              v-model="form.responsavel"
              type="text"
              class="form-control"
            >
          </div>
        </div>
      </section>

      <!-- Contact Information Section -->
      <section class="form-section">
        <h2>CONTACTOS</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="telefone">TELEFONE</label>
            <input
              id="telefone"
              v-model="form.telefone"
              type="tel"
              class="form-control"
            >
          </div>

          <div class="form-group">
            <label for="telefoneContato">TELEFONE DO CONTACTO</label>
            <input
              id="telefoneContato"
              v-model="form.telefoneContato"
              type="tel"
              class="form-control"
            >
          </div>

          <div class="form-group">
            <label for="email">E-MAIL</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="form-control"
            >
          </div>

          <div class="form-group">
            <label for="emailContato">E-MAIL DO CONTACTO</label>
            <input
              id="emailContato"
              v-model="form.emailContato"
              type="email"
              class="form-control"
            >
          </div>
        </div>
      </section>

      <!-- Address Information Section -->
      <section class="form-section">
        <h2>MORADA</h2>
        <div class="form-grid">
          <div class="form-group full-width">
            <label for="morada">MORADA</label>
            <textarea
              id="morada"
              v-model="form.morada"
              class="form-control"
              rows="3"
            />
          </div>

          <div class="form-group">
            <label for="codigoPostal">CÓDIGO POSTAL</label>
            <input
              id="codigoPostal"
              v-model="form.codigoPostal"
              type="text"
              class="form-control"
              placeholder="0000-000"
            >
          </div>

          <div class="form-group">
            <label for="localidade">LOCALIDADE</label>
            <input
              id="localidade"
              v-model="form.localidade"
              type="text"
              class="form-control"
            >
          </div>
        </div>
      </section>

      <!-- Financial Information Section -->
      <section class="form-section">
        <h2>INFORMAÇÃO FINANCEIRA</h2>
        <div class="form-grid">
          <div class="form-group full-width">
            <label for="iban">IBAN</label>
            <input
              id="iban"
              v-model="form.iban"
              type="text"
              class="form-control"
              placeholder="PT50 0000 0000 0000 0000 0000 0"
            >
          </div>
        </div>
      </section>

      <!-- Software Section -->
      <section class="form-section">
        <h2>SOFTWARE</h2>

        <div class="add-software-buttons">
          <button
            type="button"
            class="btn-add-software"
            :disabled="editingSoftwareId !== null"
            @click="addSoftware"
          >
            <span class="btn-icon">➕</span>
            Adicionar Software
          </button>
        </div>

        <!-- Software Items -->
        <div
          v-for="(software, index) in form.softwares"
          :key="software.id"
          class="software-card"
          :class="{
            editing: isSoftwareEditing(software.id),
            readonly: !isSoftwareEditing(software.id),
          }"
        >
          <div class="software-header">
            <h3>{{ software.name || `Software ${index + 1}` }}</h3>
            <div class="software-actions">
              <!-- Edit mode buttons -->
              <template v-if="isSoftwareEditing(software.id)">
                <button
                  type="button"
                  class="btn-icon-action btn-save"
                  :disabled="!software.name"
                  title="Guardar"
                  @click="saveSoftware(software.id)"
                >
                  ✓
                </button>
                <button
                  type="button"
                  class="btn-icon-action btn-cancel"
                  title="Cancelar"
                  @click="cancelEditSoftware(software.id)"
                >
                  ✕
                </button>
              </template>
              <!-- View mode buttons -->
              <template v-else>
                <button
                  type="button"
                  class="btn-icon-action btn-edit"
                  title="Editar"
                  @click="editSoftware(software.id)"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  class="btn-icon-action btn-delete"
                  title="Eliminar"
                  @click="removeSoftware(index)"
                >
                  🗑️
                </button>
              </template>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label :for="`software-${software.id}`">SOFTWARE *</label>
              <select
                :id="`software-${software.id}`"
                v-model="software.name"
                class="form-control"
                :disabled="!isSoftwareEditing(software.id)"
                required
                @change="onSoftwareChange(index)"
              >
                <option value="">
                  Selecione...
                </option>
                <option value="Vectron">
                  Vectron
                </option>
                <option value="Pix">
                  Pix
                </option>
                <option value="Zon Soft">
                  Zon Soft
                </option>
                <option value="Pt CERT">
                  Pt CERT
                </option>
                <option value="Dream Soft">
                  Dream Soft
                </option>
                <option value="Contas Certas">
                  Contas Certas
                </option>
              </select>
            </div>

            <!-- Vectron Models -->
            <div
              v-if="software.name === 'Vectron'"
              class="form-group"
            >
              <label :for="`vectron-model-${software.id}`">MODELO</label>
              <select
                :id="`vectron-model-${software.id}`"
                v-model="software.model"
                class="form-control"
                :disabled="!isSoftwareEditing(software.id)"
              >
                <option value="">
                  Selecione o modelo...
                </option>
                <option value="Vectron Wide 14">
                  Vectron Wide 14"
                </option>
                <option value="Vectron Pos 7">
                  Vectron Pos 7
                </option>
                <option value="Vectron Pos PC">
                  Vectron Pos PC
                </option>
                <option value="Vectron Pos Touch K6">
                  Vectron Pos Touch K6
                </option>
                <option value="Vectron Pos Touch K5 15">
                  Vectron Pos Touch K5 15"
                </option>
                <option value="Vectron Pos Touch K5 12">
                  Vectron Pos Touch K5 12"
                </option>
                <option value="Vectron Mobil Pro III">
                  Vectron Mobil Pro III
                </option>
                <option value="Vectron Mobil Pro IV">
                  Vectron Mobil Pro IV
                </option>
              </select>
            </div>

            <!-- Pix Products -->
            <template v-if="software.name === 'Pix'">
              <div class="form-group">
                <label :for="`pix-product-${software.id}`">PRODUTO</label>
                <select
                  :id="`pix-product-${software.id}`"
                  v-model="software.product"
                  class="form-control"
                  :disabled="!isSoftwareEditing(software.id)"
                  @change="onPixProductChange(index)"
                >
                  <option value="">
                    Selecione o produto...
                  </option>
                  <option value="Pix rest">
                    Pix rest
                  </option>
                  <option value="Pix Gest">
                    Pix Gest
                  </option>
                  <option value="Pix POS">
                    Pix POS
                  </option>
                  <option value="Pix AutoVenda">
                    Pix AutoVenda
                  </option>
                  <option value="Pix Orders">
                    Pix Orders
                  </option>
                  <option value="Pix Order Posto adicional">
                    Pix Order Posto adicional
                  </option>
                  <option value="Pix Monitor Pedidos">
                    Pix Monitor Pedidos
                  </option>
                  <option value="Pix RestFest">
                    Pix RestFest
                  </option>
                </select>
              </div>

              <!-- Pix Modules (for products that have modules) -->
              <div
                v-if="pixHasModules(software.product)"
                class="form-group full-width"
              >
                <label>MÓDULOS</label>
                <div class="modules-checkboxes">
                  <label class="module-checkbox">
                    <input
                      v-model="software.modules"
                      type="checkbox"
                      value="Modulo 1"
                      :disabled="!isSoftwareEditing(software.id)"
                    >
                    Módulo 1
                  </label>
                  <label class="module-checkbox">
                    <input
                      v-model="software.modules"
                      type="checkbox"
                      value="Modulo 2"
                      :disabled="!isSoftwareEditing(software.id)"
                    >
                    Módulo 2
                  </label>
                  <label class="module-checkbox">
                    <input
                      v-model="software.modules"
                      type="checkbox"
                      value="Modulo 3"
                      :disabled="!isSoftwareEditing(software.id)"
                    >
                    Módulo 3
                  </label>
                  <label class="module-checkbox">
                    <input
                      v-model="software.modules"
                      type="checkbox"
                      value="Posto adicional"
                      :disabled="!isSoftwareEditing(software.id)"
                    >
                    Posto adicional
                  </label>
                </div>
              </div>
            </template>

            <!-- Zon Soft Products -->
            <template v-if="software.name === 'Zon Soft'">
              <div class="form-group">
                <label :for="`zonsoft-product-${software.id}`">PRODUTO</label>
                <select
                  :id="`zonsoft-product-${software.id}`"
                  v-model="software.product"
                  class="form-control"
                  :disabled="!isSoftwareEditing(software.id)"
                >
                  <option value="">
                    Selecione o produto...
                  </option>
                  <option value="ZSFACT">
                    ZSFACT
                  </option>
                  <option value="ZSGO">
                    ZSGO
                  </option>
                  <option value="ZSPOS">
                    ZSPOS
                  </option>
                  <option value="ZSPOS MOBILE (ANDRIOD)">
                    ZSPOS MOBILE (ANDRIOD)
                  </option>
                  <option value="ZSREST">
                    ZSREST
                  </option>
                </select>
              </div>

              <div
                v-if="software.product && software.product !== 'ZSFACT'"
                class="form-group"
              >
                <label :for="`zonsoft-version-${software.id}`">VERSÃO</label>
                <select
                  :id="`zonsoft-version-${software.id}`"
                  v-model="software.version"
                  class="form-control"
                  :disabled="!isSoftwareEditing(software.id)"
                >
                  <option value="">
                    Selecione a versão...
                  </option>
                  <option value="Pro">
                    Pro
                  </option>
                  <option value="Lite">
                    Lite
                  </option>
                  <option value="Basic">
                    Basic
                  </option>
                </select>
              </div>
            </template>

            <!-- Pt CERT License Type -->
            <div
              v-if="software.name === 'Pt CERT'"
              class="form-group"
            >
              <label :for="`ptcert-license-${software.id}`">TIPO DE LICENÇA</label>
              <select
                :id="`ptcert-license-${software.id}`"
                v-model="software.licenseType"
                class="form-control"
                :disabled="!isSoftwareEditing(software.id)"
              >
                <option value="">
                  Selecione o tipo...
                </option>
                <option value="Licença Definitiva">
                  Licença Definitiva
                </option>
                <option value="Licença Anual">
                  Licença Anual
                </option>
              </select>
            </div>
          </div>

          <!-- Additional Fields -->
          <div
            v-if="software.name"
            class="software-additional-fields"
          >
            <!-- Vectron Fields (only for Vectron) -->
            <template v-if="software.name === 'Vectron'">
              <div class="form-grid">
                <div class="form-group">
                  <label :for="`n-equipamento-${software.id}`">Nº EQUIPAMENTO</label>
                  <input
                    :id="`n-equipamento-${software.id}`"
                    v-model="software.nEquipamento"
                    type="text"
                    class="form-control"
                    :disabled="!isSoftwareEditing(software.id)"
                    placeholder="Nº do equipamento"
                  >
                </div>

                <div class="form-group">
                  <label :for="`versao-software-${software.id}`">VERSÃO DO SOFTWARE</label>
                  <input
                    :id="`versao-software-${software.id}`"
                    v-model="software.versaoSoftware"
                    type="text"
                    class="form-control"
                    :disabled="!isSoftwareEditing(software.id)"
                    placeholder="Ex: 1.2.3"
                  >
                </div>
              </div>
            </template>

            <!-- Common Fields (for all except Vectron) -->
            <template v-else>
              <div class="form-grid">
                <div class="form-group">
                  <label :for="`numero-serie-${software.id}`">NÚMERO SÉRIE</label>
                  <input
                    :id="`numero-serie-${software.id}`"
                    v-model="software.numeroSerie"
                    type="text"
                    class="form-control"
                    :disabled="!isSoftwareEditing(software.id)"
                    placeholder="Nº de série"
                  >
                </div>

                <div class="form-group">
                  <label :for="`versao-software-${software.id}`">VERSÃO SOFTWARE</label>
                  <input
                    :id="`versao-software-${software.id}`"
                    v-model="software.versaoSoftware"
                    type="text"
                    class="form-control"
                    :disabled="!isSoftwareEditing(software.id)"
                    placeholder="Ex: 1.2.3"
                  >
                </div>

                <div class="form-group">
                  <label :for="`versao-licenca-${software.id}`">VERSÃO LICENÇA</label>
                  <input
                    :id="`versao-licenca-${software.id}`"
                    v-model="software.versaoLicenca"
                    type="text"
                    class="form-control"
                    :disabled="!isSoftwareEditing(software.id)"
                    placeholder="Versão da licença"
                  >
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-if="form.softwares.length === 0"
          class="no-software-message"
        >
          Nenhum software adicionado
        </div>
      </section>

      <!-- Serviços Section -->
      <section class="form-section">
        <h2>SERVIÇOS</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>TEM ANYDESK</label>
            <div class="toggle-switch">
              <input
                id="temAnydesk"
                v-model="form.temAnydesk"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="temAnydesk"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>MANUTENÇÃO</label>
            <div class="toggle-switch">
              <input
                id="manutencao"
                v-model="form.manutencao"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="manutencao"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>MANUTENÇÃO 24H</label>
            <div class="toggle-switch">
              <input
                id="manutencao24"
                v-model="form.manutencao24"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="manutencao24"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>DUMPS</label>
            <div class="toggle-switch">
              <input
                id="dumps"
                v-model="form.dumps"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="dumps"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>ATCUD</label>
            <div class="toggle-switch">
              <input
                id="atcud"
                v-model="form.atcud"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="atcud"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>VECTRON CONNECT</label>
            <div class="toggle-switch">
              <input
                id="vectronConnect"
                v-model="form.vectronConnect"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="vectronConnect"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>
        </div>

        <!-- DUMPS Conditional Field -->
        <div
          v-if="form.dumps"
          class="conditional-fields"
        >
          <div class="form-group full-width">
            <label for="dumpsLink">LINK GOOGLE DRIVE</label>
            <input
              id="dumpsLink"
              v-model="form.dumpsLink"
              type="url"
              class="form-control"
              placeholder="https://drive.google.com/..."
            >
          </div>
        </div>

        <!-- ATCUD Conditional Fields -->
        <div
          v-if="form.atcud"
          class="conditional-fields"
        >
          <div class="form-grid">
            <div class="form-group">
              <label for="seriesDocumentos">SÉRIES DE DOCUMENTOS</label>
              <input
                id="seriesDocumentos"
                v-model="form.seriesDocumentos"
                type="text"
                class="form-control"
                placeholder="Ex: A, B, C"
              >
            </div>

            <div class="form-group">
              <label for="atUsername">AT USERNAME</label>
              <input
                id="atUsername"
                v-model="form.atUsername"
                type="text"
                class="form-control"
                placeholder="Username AT"
              >
            </div>

            <div class="form-group">
              <label for="atPassword">AT PASSWORD</label>
              <input
                id="atPassword"
                v-model="form.atPassword"
                type="password"
                class="form-control"
                placeholder="Password AT"
              >
            </div>
          </div>
        </div>

        <!-- Vectron Connect Conditional Field -->
        <div
          v-if="form.vectronConnect"
          class="conditional-fields"
        >
          <div class="form-group full-width">
            <label for="vectronAddress">VECTRON ADDRESS</label>
            <input
              id="vectronAddress"
              v-model="form.vectronAddress"
              type="text"
              class="form-control"
              placeholder="Ex: 192.168.1.100 ou vectron.empresa.com"
            >
          </div>
        </div>
      </section>

      <!-- Additional Information Section -->
      <section class="form-section">
        <h2>OBSERVAÇÕES</h2>
        <div class="form-group full-width">
          <label for="observacoes">OBSERVAÇÕES</label>
          <textarea
            id="observacoes"
            v-model="form.observacoes"
            class="form-control"
            rows="4"
            placeholder="Notas adicionais sobre o cliente..."
          />
        </div>
      </section>

      <!-- Form Actions -->
      <div class="form-actions">
        <button
          type="button"
          class="btn btn-secondary"
          @click="navigateBack"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="!validateForm()"
        >
          {{ isEditing ? 'Atualizar' : 'Criar' }} Cliente
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
import { useClientesStore } from '@/stores/clientes.js';

// Router
const route = useRoute();
const router = useRouter();

// Store
const store = useClientesStore();
const { loading, error, selectedCliente } = storeToRefs(store);
const { fetchClienteById, clearError } = store;

// Determine if we're editing or creating
const isEditing = computed(() => !!route.params.id);

// Default form structure
const defaultForm = {
  nomeEmpresa: '',
  nomeComercial: '',
  contribuinte: '',
  morada: '',
  codigoPostal: '',
  localidade: '',
  responsavel: '',
  telefoneContato: '',
  iban: '',
  email: '',
  emailContato: '',
  observacoes: '',
  telefone: '',
  softwares: [],
  temAnydesk: false,
  manutencao: false,
  manutencao24: false,
  atcud: false,
  dumps: false,
  seriesDocumentos: '',
  atUsername: '',
  atPassword: '',
  dumpsLink: '',
  vectronConnect: false,
  vectronAddress: '',
  // Legacy fields for backward compatibility
  vectron: false,
  dreamSoft: false,
  ptcert: false,
  pix: false,
  zsrest: false,
  contasCertas: false,
  contrato: false,
  contratoCPA: false,
  contratoSoftware: false,
  dataInicio: '',
  dataTermino: '',
  atClient: '',
};

// Form state
const form = reactive({ ...defaultForm });

// Computed properties
const cancelRoute = computed(() => {
  if (isEditing.value) {
    return `/clientes/${route.params.id}`;
  } else {
    return '/clientes/list';
  }
});

// Methods
const loadClienteData = async () => {
  try {
    const id = route.params.id;
    console.log('Loading cliente data for edit:', id);

    // Clear any previous data
    selectedCliente.value = null;

    try {
      // Try the store method first
      await fetchClienteById(id);
      console.log('Cliente fetched via store, selectedCliente:', selectedCliente.value);
    } catch (storeError) {
      console.warn('Store method failed, trying direct API call:', storeError);

      // Fallback to direct API call
      const response = await fetch(`/api/clientes/${id}`);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const cliente = await response.json();
      console.log('Cliente fetched via direct API:', cliente);

      // Manually set the selectedCliente
      selectedCliente.value = cliente;
    }
  } catch (err) {
    console.error('Failed to load cliente data:', err);
    router.push('/clientes/list');
  }
};

// Function to populate form with selected cliente data
const populateFormFromSelectedCliente = () => {
  if (!selectedCliente.value || !isEditing.value) return;

  console.log('Populating form with data:', selectedCliente.value);

  // Reset form to defaults first
  Object.assign(form, JSON.parse(JSON.stringify(defaultForm)));

  // Populate with selected cliente data
  Object.keys(form).forEach(key => {
    if (selectedCliente.value[key] !== undefined) {
      form[key] = selectedCliente.value[key];
    }
  });

  console.log('Form populated with data:', form);
};

// Software management state
const editingSoftwareId = ref(null);

// Software management functions
const addSoftware = () => {
  const newSoftware = {
    id: Date.now(),
    name: '',
    model: '',
    product: '',
    version: '',
    licenseType: '',
    modules: [],
    nEquipamento: '',
    numeroSerie: '',
    versaoSoftware: '',
    versaoLicenca: '',
    isEditing: true,
  };
  form.softwares.push(newSoftware);
  editingSoftwareId.value = newSoftware.id;
};

const removeSoftware = index => {
  const softwareId = form.softwares[index].id;
  if (editingSoftwareId.value === softwareId) {
    editingSoftwareId.value = null;
  }
  form.softwares.splice(index, 1);
};

const editSoftware = id => {
  editingSoftwareId.value = id;
  const software = form.softwares.find(s => s.id === id);
  if (software) {
    software.isEditing = true;
  }
};

const saveSoftware = id => {
  const software = form.softwares.find(s => s.id === id);
  if (software && software.name) {
    software.isEditing = false;
    editingSoftwareId.value = null;
  }
};

const cancelEditSoftware = id => {
  const index = form.softwares.findIndex(s => s.id === id);
  const software = form.softwares[index];

  // If it's a new software with no name, remove it
  if (!software.name) {
    form.softwares.splice(index, 1);
  } else {
    software.isEditing = false;
  }
  editingSoftwareId.value = null;
};

const isSoftwareEditing = id => {
  return editingSoftwareId.value === id;
};

const onSoftwareChange = index => {
  // Clear variant fields when software changes
  const software = form.softwares[index];
  software.model = '';
  software.product = '';
  software.version = '';
  software.licenseType = '';
  software.modules = [];
  software.nEquipamento = '';
  software.numeroSerie = '';
  software.versaoSoftware = '';
  software.versaoLicenca = '';
};

const onPixProductChange = index => {
  // Clear modules when product changes
  form.softwares[index].modules = [];
};

const pixHasModules = product => {
  // These Pix products have module options
  const productsWithModules = ['Pix rest', 'Pix Gest', 'Pix POS', 'Pix AutoVenda'];
  return productsWithModules.includes(product);
};

const validateForm = () => {
  return form.nomeEmpresa && form.nomeComercial;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  try {
    if (isEditing.value) {
      const id = route.params.id;
      await store.updateCliente(id, form);
      router.push(`/clientes/${id}`);
    } else {
      const newCliente = await store.createCliente(form);
      router.push(`/clientes/${newCliente.id}`);
    }
  } catch (err) {
    console.error('Error saving cliente:', err);
  }
};

const navigateBack = () => {
  router.push(cancelRoute.value);
};

// Lifecycle hooks
onMounted(async () => {
  console.log('ClienteForm mounted, isEditing:', isEditing.value);

  if (!isEditing.value) {
    // Clear any previous data for create mode
    selectedCliente.value = null;
    console.log('Create mode: form will show empty fields');
  } else {
    // Load data for edit mode
    try {
      await loadClienteData();
    } catch (error) {
      console.error('Error in onMounted:', error);
    }
  }
});

// Watch for changes in selectedCliente to populate the form
watch(
  selectedCliente,
  (newValue, oldValue) => {
    console.log('selectedCliente watcher triggered:', {
      newValue,
      oldValue,
      isEditing: isEditing.value,
    });

    if (newValue && isEditing.value) {
      console.log('selectedCliente changed, populating form:', newValue);
      populateFormFromSelectedCliente();
    }
  },
  { immediate: true }
);

// Watch for ATCUD changes to clear conditional fields
watch(
  () => form.atcud,
  newValue => {
    if (!newValue) {
      form.seriesDocumentos = '';
      form.atUsername = '';
      form.atPassword = '';
    }
  }
);

// Watch for DUMPS changes to clear conditional fields
watch(
  () => form.dumps,
  newValue => {
    if (!newValue) {
      form.dumpsLink = '';
    }
  }
);

// Watch for Vectron Connect changes to clear conditional fields
watch(
  () => form.vectronConnect,
  newValue => {
    if (!newValue) {
      form.vectronAddress = '';
    }
  }
);

// Watch for route changes to reload data if needed
watch(
  () => route.params.id,
  async (newId, oldId) => {
    console.log('Route param id changed:', { newId, oldId });

    if (newId && newId !== oldId && isEditing.value) {
      console.log('Route changed to edit different cliente, reloading data');
      await loadClienteData();
    }
  }
);
</script>

<style scoped>
.cliente-form-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
  background: #f5f5f5;
  min-height: 100vh;
}

.form-header {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-header h1 {
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  text-align: center;
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

.cliente-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-section h2 {
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--primary-color);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.toggles-grid {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.form-control {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(117, 174, 147, 0.2);
}

textarea.form-control {
  resize: vertical;
  min-height: 80px;
}

/* Toggle Switches */
.toggle-group {
  display: flex;
  align-items: center;
  margin-bottom: 0;
}

.toggle-group label {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin: 0;
  font-size: 0.8rem;
  font-weight: 500;
  gap: 0.5rem;
  text-transform: uppercase;
}

.toggle-input {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 40px;
  height: 20px;
  background-color: #ccc;
  border-radius: 10px;
  transition: background-color 0.3s ease;
  flex-shrink: 0;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: white;
  top: 2px;
  left: 2px;
  transition: transform 0.3s ease;
}

.toggle-input:checked + .toggle-slider {
  background-color: var(--primary-color);
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

/* Standard toggle switch for form sections */
.toggle-switch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.toggle-switch .toggle-input {
  display: none;
}

.toggle-switch .toggle-label {
  position: relative;
  width: 50px;
  height: 24px;
  background: #ccc;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.toggle-switch .toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.toggle-switch .toggle-input:checked + .toggle-label {
  background: var(--primary-color);
}

.toggle-switch .toggle-input:checked + .toggle-label .toggle-slider {
  transform: translateX(26px);
}

.toggle-switch .toggle-input:focus + .toggle-label {
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.1),
    0 0 0 2px rgba(117, 174, 147, 0.3);
}

/* Conditional fields styling */
.conditional-fields {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
}

.conditional-fields .form-grid {
  margin-top: 0;
}

.conditional-fields .form-group {
  margin-bottom: 0;
}

/* Software Section Styling */
.add-software-buttons {
  margin-bottom: 1.5rem;
}

.btn-add-software {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.btn-add-software .btn-icon {
  font-size: 0.9rem;
}

.btn-add-software:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-add-software:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.software-card {
  background: #fff;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  transition: all 0.2s ease;
}

.software-card.editing {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(117, 174, 147, 0.15);
}

.software-card.readonly {
  background: #f8f9fa;
}

.software-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #dee2e6;
}

.software-card.editing .software-header {
  border-bottom-color: var(--primary-color);
}

.software-header h3 {
  margin: 0;
  font-size: 1.05rem;
  color: #495057;
  font-weight: 600;
}

.software-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-icon-action {
  background: transparent;
  border: 1px solid #dee2e6;
  padding: 0.35rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  min-width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-icon-action:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-icon-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-save {
  background: #28a745;
  color: white;
  border-color: #28a745;
  font-weight: bold;
}

.btn-save:hover:not(:disabled) {
  background: #218838;
  border-color: #218838;
}

.btn-cancel {
  background: #6c757d;
  color: white;
  border-color: #6c757d;
}

.btn-cancel:hover {
  background: #5a6268;
  border-color: #545b62;
}

.btn-edit {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.btn-edit:hover {
  background: #0069d9;
  border-color: #0062cc;
}

.btn-delete {
  background: white;
  color: #dc3545;
  border-color: #dee2e6;
}

.btn-delete:hover {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
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

/* Modules checkboxes styling */
.modules-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.75rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.module-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0;
  text-transform: none;
}

.module-checkbox input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Software additional fields */
.software-additional-fields {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
}

/* Disabled/readonly form controls styling */
.software-card.readonly .form-control:disabled,
.software-card.readonly .form-control[readonly] {
  background-color: #f8f9fa;
  border-color: #e9ecef;
  color: #495057;
  cursor: default;
  opacity: 1;
}

.software-card.readonly .module-checkbox input[type='checkbox']:disabled {
  cursor: default;
  opacity: 0.7;
}

.software-card.editing .form-control {
  border-color: #ced4da;
}

.software-card.editing .form-control:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.2rem rgba(117, 174, 147, 0.25);
}

.form-actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  max-width: 200px;
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

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .cliente-form-container {
    padding: 0.5rem;
  }

  .form-header {
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .form-header h1 {
    font-size: 1.25rem;
  }

  .form-section {
    padding: 1rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .toggles-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .form-actions {
    flex-direction: column;
    padding: 1rem;
  }

  .btn {
    max-width: none;
  }

  .software-card {
    padding: 0.75rem;
  }

  .modules-checkboxes {
    flex-direction: column;
    gap: 0.5rem;
  }

  .btn-icon-action {
    min-width: 28px;
    height: 28px;
    padding: 0.25rem 0.4rem;
    font-size: 0.85rem;
  }

  .software-header {
    flex-direction: row;
    align-items: center;
  }

  .software-actions {
    gap: 0.4rem;
  }
}

@media (max-width: 480px) {
  .form-header h1 {
    font-size: 1.1rem;
  }

  .form-section h2 {
    font-size: 1rem;
  }

  .toggles-grid {
    grid-template-columns: 1fr;
  }

  .toggle-group label {
    font-size: 0.75rem;
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
</style>

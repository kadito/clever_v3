<template>
  <div class="licencas-form-container">
    <div class="form-header">
      <BackButton :to="cancelRoute" variant="inline" />
      <h1>{{ isEditing ? 'Editar' : 'Nova' }} Licença</h1>
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
    <form @submit.prevent="handleSubmit" class="licencas-form" v-if="!loading">
      <!-- Basic Information Section -->
      <section class="form-section">
        <h2>INFORMAÇÕES BÁSICAS</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="cliente">CLIENTE</label>
            <!-- Show read-only cliente name when editing -->
            <div v-if="isEditing" class="readonly-cliente-display">
              <input
                type="text"
                :value="formData.cliente"
                readonly
                class="form-control readonly-input"
                placeholder="Nome do cliente"
              />
            </div>
            <!-- Show searchable select when creating new -->
            <ClienteSearchSelect
              v-else
              id="cliente"
              v-model="formData.cliente"
              input-id="cliente-search"
              placeholder="Pesquisar cliente..."
              :disabled="clientesStore.loading"
              :required="true"
              store-name
            />
            <div v-if="clientesStore.error" class="error-message">
              Erro ao carregar clientes: {{ clientesStore.error }}
            </div>
          </div>
        </div>
      </section>

      <!-- Software Section -->
      <section class="form-section">
        <h2>SOFTWARE</h2>

        <div class="form-grid">
          <div class="form-group full-width">
            <label for="software-name">SOFTWARE *</label>
            <div class="multiselect-wrapper">
              <div
                class="multiselect-trigger"
                :class="{
                  'is-open': showSoftwareDropdown,
                  'has-selection': formData.software.name.length > 0,
                }"
                @click="toggleSoftwareDropdown"
              >
                <span v-if="formData.software.name.length === 0" class="placeholder">
                  Selecione o software...
                </span>
                <span v-else class="selected-count">
                  {{ formData.software.name.length }} selecionado(s)
                </span>
                <span class="dropdown-arrow" :class="{ 'is-open': showSoftwareDropdown }">▼</span>
              </div>

              <div v-if="showSoftwareDropdown" class="multiselect-dropdown" @click.stop>
                <div class="multiselect-options">
                  <label
                    v-for="option in softwareOptions"
                    :key="option.value"
                    class="multiselect-option"
                  >
                    <input
                      type="checkbox"
                      :value="option.value"
                      v-model="formData.software.name"
                      @change="onSoftwareChange"
                    />
                    <span>{{ option.label }}</span>
                  </label>
                </div>
              </div>
            </div>

            <div v-if="formData.software.name.length > 0" class="selected-software">
              <span class="selected-label">Selecionado:</span>
              <span class="selected-items">
                <span
                  v-for="(item, index) in formData.software.name"
                  :key="index"
                  class="software-tag"
                >
                  {{ item }}
                  <button type="button" @click="removeSoftware(item)" class="tag-remove">×</button>
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- Grouped Software-Specific Fields -->
        <div v-if="formData.software.name.length > 0" class="software-specific-fields">
          <!-- Vectron Group -->
          <div v-if="formData.software.name.includes('Vectron')" class="software-group">
            <h3 class="software-group-title">Vectron</h3>
            <div class="form-grid">
              <div class="form-group">
                <label for="vectron-model">MODELO</label>
                <select id="vectron-model" v-model="formData.software.model" class="form-control">
                  <option value="">Selecione o modelo...</option>
                  <option value="Vectron Wide 14">Vectron Wide 14"</option>
                  <option value="Vectron Pos 7">Vectron Pos 7</option>
                  <option value="Vectron Pos PC">Vectron Pos PC</option>
                  <option value="Vectron Pos Touch K6">Vectron Pos Touch K6</option>
                  <option value="Vectron Pos Touch K5 15">Vectron Pos Touch K5 15"</option>
                  <option value="Vectron Pos Touch K5 12">Vectron Pos Touch K5 12"</option>
                  <option value="Vectron Mobil Pro III">Vectron Mobil Pro III</option>
                  <option value="Vectron Mobil Pro IV">Vectron Mobil Pro IV</option>
                </select>
              </div>

              <div class="form-group">
                <label for="n-equipamento">Nº EQUIPAMENTO</label>
                <input
                  type="text"
                  id="n-equipamento"
                  v-model="formData.software.nEquipamento"
                  class="form-control"
                  placeholder="Nº do equipamento"
                />
              </div>

              <div class="form-group">
                <label for="versao-vectron">VERSÃO DO SOFTWARE</label>
                <input
                  type="text"
                  id="versao-vectron"
                  v-model="formData.versao"
                  class="form-control"
                  placeholder="Ex: 1.2.3"
                />
              </div>
            </div>
          </div>

          <!-- Pix Group -->
          <div v-if="formData.software.name.includes('Pix')" class="software-group">
            <h3 class="software-group-title">Pix</h3>
            <div class="form-grid">
              <div class="form-group">
                <label for="pix-product">PRODUTO</label>
                <select
                  id="pix-product"
                  v-model="formData.software.product"
                  class="form-control"
                  @change="onPixProductChange"
                >
                  <option value="">Selecione o produto...</option>
                  <option value="Pix rest">Pix rest</option>
                  <option value="Pix Gest">Pix Gest</option>
                  <option value="Pix POS">Pix POS</option>
                  <option value="Pix AutoVenda">Pix AutoVenda</option>
                  <option value="Pix Orders">Pix Orders</option>
                  <option value="Pix Order Posto adicional">Pix Order Posto adicional</option>
                  <option value="Pix Monitor Pedidos">Pix Monitor Pedidos</option>
                  <option value="Pix RestFest">Pix RestFest</option>
                </select>
              </div>

              <!-- Pix Modules (for products that have modules) -->
              <div class="form-group full-width" v-if="pixHasModules(formData.software.product)">
                <label>MÓDULOS</label>
                <div class="modules-checkboxes">
                  <label class="module-checkbox">
                    <input type="checkbox" value="Modulo 1" v-model="formData.software.modules" />
                    Módulo 1
                  </label>
                  <label class="module-checkbox">
                    <input type="checkbox" value="Modulo 2" v-model="formData.software.modules" />
                    Módulo 2
                  </label>
                  <label class="module-checkbox">
                    <input type="checkbox" value="Modulo 3" v-model="formData.software.modules" />
                    Módulo 3
                  </label>
                  <label class="module-checkbox">
                    <input
                      type="checkbox"
                      value="Posto adicional"
                      v-model="formData.software.modules"
                    />
                    Posto adicional
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Zon Soft Group -->
          <div v-if="formData.software.name.includes('Zon Soft')" class="software-group">
            <h3 class="software-group-title">Zon Soft</h3>
            <div class="form-grid">
              <div class="form-group">
                <label for="zonsoft-product">PRODUTO</label>
                <select
                  id="zonsoft-product"
                  v-model="formData.software.product"
                  class="form-control"
                >
                  <option value="">Selecione o produto...</option>
                  <option value="ZSFACT">ZSFACT</option>
                  <option value="ZSGO">ZSGO</option>
                  <option value="ZSPOS">ZSPOS</option>
                  <option value="ZSPOS MOBILE (ANDRIOD)">ZSPOS MOBILE (ANDRIOD)</option>
                  <option value="ZSREST">ZSREST</option>
                </select>
              </div>

              <div
                class="form-group"
                v-if="formData.software.product && formData.software.product !== 'ZSFACT'"
              >
                <label for="zonsoft-version">VERSÃO</label>
                <select
                  id="zonsoft-version"
                  v-model="formData.software.version"
                  class="form-control"
                >
                  <option value="">Selecione a versão...</option>
                  <option value="Pro">Pro</option>
                  <option value="Lite">Lite</option>
                  <option value="Basic">Basic</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Pt CERT Group -->
          <div v-if="formData.software.name.includes('Pt CERT')" class="software-group">
            <h3 class="software-group-title">Pt CERT</h3>
            <div class="form-grid">
              <div class="form-group">
                <label for="ptcert-license">TIPO DE LICENÇA</label>
                <select
                  id="ptcert-license"
                  v-model="formData.software.licenseType"
                  class="form-control"
                >
                  <option value="">Selecione o tipo...</option>
                  <option value="Licença Definitiva">Licença Definitiva</option>
                  <option value="Licença Anual">Licença Anual</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Common Fields (for other software types) -->
          <div v-if="hasOtherSoftware" class="software-group">
            <h3 class="software-group-title">Outros</h3>
            <div class="form-grid">
              <div class="form-group">
                <label for="numero-serie">NÚMERO SÉRIE</label>
                <input
                  type="text"
                  id="numero-serie"
                  v-model="formData.numeroSerie"
                  class="form-control"
                  placeholder="Nº de série"
                />
              </div>

              <div class="form-group">
                <label for="versao-software">VERSÃO SOFTWARE</label>
                <input
                  type="text"
                  id="versao-software"
                  v-model="formData.versao"
                  class="form-control"
                  placeholder="Ex: 1.2.3"
                />
              </div>

              <div class="form-group">
                <label for="versao-licenca">VERSÃO LICENÇA</label>
                <input
                  type="text"
                  id="versao-licenca"
                  v-model="formData.software.versaoLicenca"
                  class="form-control"
                  placeholder="Versão da licença"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- License Period Section -->
      <section class="form-section">
        <h2>PERÍODO DA LICENÇA</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="dataInicio">DATA DE INÍCIO</label>
            <input type="date" id="dataInicio" v-model="formData.dataInicio" class="form-control" />
          </div>

          <div class="form-group">
            <label for="dataVencimento">DATA DE VENCIMENTO</label>
            <input
              type="date"
              id="dataVencimento"
              v-model="formData.dataVencimento"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label for="modalidade">MODALIDADE</label>
            <select id="modalidade" v-model="formData.modalidade" class="form-control">
              <option value="">--</option>
              <option value="ANUAL">ANUAL</option>
              <option value="SEMESTRAL">SEMESTRAL</option>
              <option value="TRIMESTRAL">TRIMESTRAL</option>
              <option value="MENSAL">MENSAL</option>
            </select>
          </div>

          <div class="form-group">
            <label for="duracaoContrato">DURAÇÃO DO CONTRATO</label>
            <input
              type="text"
              id="duracaoContrato"
              v-model="formData.duracaoContrato"
              class="form-control"
              placeholder="Ex: 12 meses"
            />
          </div>
        </div>
      </section>

      <!-- Invoice Information Section -->
      <section class="form-section">
        <h2>INFORMAÇÕES DE FATURA</h2>

        <!-- Dynamic invoice items -->
        <div v-for="(invoice, index) in formData.invoices" :key="invoice.id" class="activity-card">
          <div class="activity-header">
            <h3>Fatura {{ index + 1 }}</h3>
            <button type="button" @click="removeInvoice(index)" class="btn btn-remove-activity">
              ❌
            </button>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label :for="`ano-${invoice.id}`">ANO</label>
              <input
                type="text"
                :id="`ano-${invoice.id}`"
                v-model="invoice.ano"
                class="form-control"
                placeholder="Ex: 2024"
              />
            </div>

            <div class="form-group">
              <label :for="`numeroFatura-${invoice.id}`">NÚMERO DA FATURA</label>
              <input
                type="text"
                :id="`numeroFatura-${invoice.id}`"
                v-model="invoice.numeroFatura"
                class="form-control"
                placeholder="Número da fatura"
              />
            </div>

            <div class="form-group">
              <label :for="`dataFatura-${invoice.id}`">DATA DA FATURA</label>
              <input
                type="date"
                :id="`dataFatura-${invoice.id}`"
                v-model="invoice.dataFatura"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label :for="`dataAviso-${invoice.id}`">DATA DE AVISO</label>
              <input
                type="date"
                :id="`dataAviso-${invoice.id}`"
                v-model="invoice.dataAviso"
                class="form-control"
              />
            </div>
          </div>
        </div>

        <!-- Clickable empty state / add button -->
        <div
          v-if="formData.invoices.length === 0"
          @click="addInvoice"
          class="clickable-add-message"
        >
          ➕ Adicionar Fatura
        </div>
      </section>

      <!-- Action buttons -->
      <div class="form-actions">
        <button type="button" @click="handleCancel" class="btn btn-cancel" :disabled="loading">
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary" :disabled="loading || !isFormValid">
          <span v-if="loading" class="btn-spinner"></span>
          {{ isEditing ? 'Atualizar' : 'Criar' }} Licença
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import BackButton from '@/components/BackButton.vue';
import ClienteSearchSelect from '@/components/ClienteSearchSelect.vue';
import { useLicencasStore } from '@/stores/licencas.js';
import { useClientesStore } from '@/stores/clientes.js';

// Router
const router = useRouter();
const route = useRoute();

// Store
const store = useLicencasStore();
const { loading, error } = storeToRefs(store);
const { createLicenca, updateLicenca, fetchLicencaById, clearError, getYearFromDate } = store;

// Clients store
const clientesStore = useClientesStore();
const { clientes } = storeToRefs(clientesStore);
const { fetchClientes } = clientesStore;

// Form state
const isEditing = ref(false);
const licencaYear = ref(null);
const licencaId = ref(null);
const showSoftwareDropdown = ref(false);

// Software options
const softwareOptions = [
  { value: 'Vectron', label: 'Vectron' },
  { value: 'Pix', label: 'Pix' },
  { value: 'Zon Soft', label: 'Zon Soft' },
  { value: 'Pt CERT', label: 'Pt CERT' },
  { value: 'Dream Soft', label: 'Dream Soft' },
  { value: 'Contas Certas', label: 'Contas Certas' },
  { value: 'Publicidade', label: 'Publicidade' },
  { value: 'Software XD', label: 'Software XD' },
  { value: 'AIR Menu', label: 'AIR Menu' },
  { value: 'Cashlogy', label: 'Cashlogy' },
];

// Form data
const formData = ref({
  cliente: '',
  versao: '',
  dataInicio: '',
  modalidade: '',
  dataVencimento: '',
  numeroSerie: '',
  duracaoContrato: '',
  invoices: [], // Array of invoice objects
  software: {
    name: [],
    model: '',
    product: '',
    version: '',
    licenseType: '',
    modules: [],
    nEquipamento: '',
    versaoLicenca: '',
  },
});

// Computed
const isFormValid = computed(() => {
  return formData.value.cliente.trim() && formData.value.software.name.length > 0;
});

// Check if there are other software types selected (not Vectron, Pix, Zon Soft, or Pt CERT)
const hasOtherSoftware = computed(() => {
  const softwareWithSpecificFields = ['Vectron', 'Pix', 'Zon Soft', 'Pt CERT'];
  return formData.value.software.name.some(name => !softwareWithSpecificFields.includes(name));
});

// Helper methods
const pixHasModules = product => {
  // These Pix products have module options
  const productsWithModules = ['Pix rest', 'Pix Gest', 'Pix POS', 'Pix AutoVenda'];
  return productsWithModules.includes(product);
};

const onSoftwareChange = () => {
  // Clear dependent fields when software changes (only if Vectron/Pix/Zon Soft are removed)
  if (!formData.value.software.name.includes('Vectron')) {
    formData.value.software.model = '';
    formData.value.software.nEquipamento = '';
  }
  if (!formData.value.software.name.includes('Pix')) {
    formData.value.software.product = '';
    formData.value.software.modules = [];
  }
  if (!formData.value.software.name.includes('Zon Soft')) {
    formData.value.software.product = '';
    formData.value.software.version = '';
  }
  if (!formData.value.software.name.includes('Pt CERT')) {
    formData.value.software.licenseType = '';
  }
};

const onPixProductChange = () => {
  // Clear modules when Pix product changes
  if (!pixHasModules(formData.value.software.product)) {
    formData.value.software.modules = [];
  }
};

const toggleSoftwareDropdown = () => {
  showSoftwareDropdown.value = !showSoftwareDropdown.value;
};

const removeSoftware = softwareName => {
  const index = formData.value.software.name.indexOf(softwareName);
  if (index > -1) {
    formData.value.software.name.splice(index, 1);
    onSoftwareChange();
  }
};

const cancelRoute = computed(() => {
  const from = route.query.from;
  if (from === 'detail' && licencaYear.value && licencaId.value) {
    return `/licencas/${licencaYear.value}/${licencaId.value}`;
  } else if (from === 'list') {
    return '/licencas/list';
  } else {
    return '/licencas';
  }
});

// Methods
const addInvoice = () => {
  formData.value.invoices.push({
    id: Date.now(),
    ano: '',
    numeroFatura: '',
    dataFatura: '',
    dataAviso: '',
  });
};

const removeInvoice = index => {
  formData.value.invoices.splice(index, 1);
};

const handleSubmit = async () => {
  if (!isFormValid.value) return;

  try {
    let year = licencaYear.value;

    // If creating new, determine year from start date or use current year
    if (!isEditing.value) {
      if (formData.value.dataInicio) {
        year = getYearFromDate(formData.value.dataInicio);
      } else {
        year = new Date().getFullYear().toString();
      }
    }

    // Prepare data with tipoSoftware as array (for backward compatibility, also store as string)
    const softwareNames = formData.value.software?.name || [];
    const payload = {
      ...formData.value,
      tipoSoftware: Array.isArray(softwareNames) ? softwareNames : [softwareNames],
      // Keep software.name as array for new format
      software: {
        ...formData.value.software,
        name: Array.isArray(softwareNames) ? softwareNames : [softwareNames],
      },
    };

    if (isEditing.value) {
      await updateLicenca(licencaYear.value, licencaId.value, payload);
      router.push(`/licencas/${licencaYear.value}/${licencaId.value}`);
    } else {
      const newLicenca = await createLicenca(year, payload);
      router.push(`/licencas/${year}/${newLicenca.id}`);
    }
  } catch (err) {
    console.error('Error saving licenca:', err);
  }
};

const handleCancel = () => {
  router.push(cancelRoute.value);
};

const loadLicencaForEditing = async () => {
  if (licencaYear.value && licencaId.value) {
    try {
      const licenca = await fetchLicencaById(licencaYear.value, licencaId.value);
      if (licenca) {
        // Convert old format (tipoSoftware) to new format (software object)
        // Handle both string (legacy) and array (new) formats
        let softwareNames = [];

        if (licenca.tipoSoftware) {
          if (Array.isArray(licenca.tipoSoftware)) {
            // Already an array
            softwareNames = licenca.tipoSoftware;
          } else {
            // Legacy string format - convert to array
            softwareNames = [licenca.tipoSoftware];
          }
        } else if (licenca.software?.name) {
          if (Array.isArray(licenca.software.name)) {
            softwareNames = licenca.software.name;
          } else {
            softwareNames = [licenca.software.name];
          }
        }

        formData.value = {
          ...licenca,
          software: {
            name: softwareNames,
            model: licenca.software?.model || licenca.model || '',
            product: licenca.software?.product || licenca.product || '',
            version: licenca.software?.version || licenca.version || '',
            licenseType: licenca.software?.licenseType || licenca.licenseType || '',
            modules: licenca.software?.modules || licenca.modules || [],
            nEquipamento: licenca.software?.nEquipamento || licenca.nEquipamento || '',
            versaoLicenca: licenca.software?.versaoLicenca || licenca.versaoLicenca || '',
          },
        };
      }
    } catch (err) {
      console.error('Error loading licenca:', err);
    }
  }
};

// Watch for software name changes to clear dependent fields
watch(
  () => formData.value.software.name,
  () => {
    onSoftwareChange();
  },
  { deep: true }
);

// Lifecycle
let handleClickOutside = null;

onMounted(async () => {
  // Close dropdown when clicking outside
  handleClickOutside = event => {
    if (!event.target.closest('.multiselect-wrapper')) {
      showSoftwareDropdown.value = false;
    }
  };
  document.addEventListener('click', handleClickOutside);

  // Fetch clients for dropdown
  try {
    await fetchClientes();
  } catch (error) {
    console.error('Error fetching clients:', error);
  }

  // Check if we're editing
  if (route.params.year && route.params.id) {
    isEditing.value = true;
    licencaYear.value = route.params.year;
    licencaId.value = route.params.id;
    await loadLicencaForEditing();
  }
});

onBeforeUnmount(() => {
  if (handleClickOutside) {
    document.removeEventListener('click', handleClickOutside);
  }
});
</script>

<style scoped>
.licencas-form-container {
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

.licencas-form {
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

.form-group label {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  line-height: 1.3;
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

.form-control.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.error-message {
  color: #dc3545;
  font-size: 0.8rem;
  margin-top: 0.25rem;
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

/* Dynamic invoice sections */
.activity-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #dee2e6;
}

.activity-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #495057;
}

.btn-remove-activity {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.15rem 0.3rem;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.7rem;
  min-width: auto;
  width: auto;
  height: auto;
  line-height: 1;
  transition: background-color 0.2s ease;
}

.btn-remove-activity:hover {
  background: #c82333;
}

.clickable-add-message {
  text-align: center;
  color: var(--primary-color, rgb(117, 174, 147));
  font-weight: 500;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 2px dashed var(--primary-color, rgb(117, 174, 147));
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.clickable-add-message:hover {
  background: var(--primary-light, rgba(117, 174, 147, 0.1));
  border-color: var(--primary-dark, rgb(77, 134, 107));
  color: var(--primary-dark, rgb(77, 134, 107));
  transform: translateY(-1px);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .licencas-form-container {
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
  .licencas-form-container {
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

  .btn-remove-activity {
    width: auto; /* Override general mobile button width */
  }

  .activity-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .activity-header h3 {
    font-size: 0.9rem;
    margin: 0;
  }
}

/* Software Section Styles */
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
  accent-color: var(--primary-color);
}

.software-additional-fields {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.multiselect-wrapper {
  position: relative;
  width: 100%;
}

.multiselect-trigger {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: border-color 0.2s ease;
  min-height: 44px;
}

.multiselect-trigger:hover {
  border-color: var(--primary-color);
}

.multiselect-trigger.is-open {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(117, 174, 147, 0.2);
}

.multiselect-trigger .placeholder {
  color: #999;
}

.multiselect-trigger .selected-count {
  color: #2c3e50;
  font-weight: 500;
}

.dropdown-arrow {
  position: absolute;
  right: 1rem;
  color: #666;
  transition: transform 0.2s ease;
  font-size: 0.75rem;
}

.dropdown-arrow.is-open {
  transform: rotate(180deg);
}

.multiselect-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.multiselect-options {
  padding: 0.5rem 0;
}

.multiselect-option {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  gap: 0.75rem;
}

.multiselect-option:hover {
  background: #f8f9fa;
}

.multiselect-option input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary-color);
  flex-shrink: 0;
}

.multiselect-option span {
  flex: 1;
  color: #2c3e50;
  font-size: 0.9rem;
}

.selected-software {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.selected-label {
  font-weight: 600;
  color: #495057;
  font-size: 0.85rem;
  display: block;
  margin-bottom: 0.5rem;
}

.selected-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.software-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: var(--primary-color);
  color: white;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.tag-remove {
  background: rgba(255, 255, 255, 0.3);
  border: none;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.tag-remove:hover {
  background: rgba(255, 255, 255, 0.5);
}

.form-hint {
  display: block;
  margin-top: 0.5rem;
  color: #6c757d;
  font-size: 0.8rem;
  font-style: italic;
}

.software-specific-fields {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.software-group {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
}

.software-group-title {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--primary-color);
}

@media (max-width: 768px) {
  .modules-checkboxes {
    flex-direction: column;
    gap: 0.5rem;
  }
}

/* Read-only cliente display when editing */
.readonly-cliente-display {
  width: 100%;
}

.readonly-input {
  background-color: #e9ecef;
  cursor: not-allowed;
  color: #495057;
  font-weight: 500;
}
</style>

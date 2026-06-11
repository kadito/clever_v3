<template>
  <ContentCreateTemplate
    content-type="licenses"
    create-title="Criar Licença"
    subtitle="Adicionar uma nova licença ao sistema"
    cancel-route="/licenses"
    :form-sections="licensesFormSections"
    :is-loading="isLoading"
    :is-saving="isSaving"
    :error="error"
    :custom-validator="validateCreateForm"
    @create="handleCreate"
    @cancel="handleCancel"
    @clear-error="clearError"
  >
    <!-- Client field custom implementation -->
    <template #field-clientId="{ formData, updateFieldValue }">
      <div class="client-field">
        <ClientSearchInput
          :model-value="formData.clientId"
          :has-error="!!fieldErrors.clientId"
          @update:model-value="value => updateFieldValue('clientId', value)"
          @client-selected="client => onClientSelected(client, updateFieldValue)"
        />
        <div
          v-if="fieldErrors.clientId"
          class="field-error"
        >
          {{ fieldErrors.clientId }}
        </div>
      </div>
    </template>
    <template #field-software="{ formData, updateFieldValue }">
      <div class="software-management">
        <!-- Initialize software object if needed -->
        <div
          v-if="!formData.software || !Array.isArray(formData.software.name)"
          style="display: none"
        >
          {{ initializeSoftware(formData) }}
        </div>

        <!-- Software Configuration Form -->
        <div class="software-form">
          <div class="form-grid">
            <!-- Software Selection (Multi-select Dropdown) -->
            <div class="form-group full-width">
              <label
                for="software-names"
                class="form-label"
              >Software *</label>
              <div class="multiselect-wrapper">
                <div
                  class="multiselect-trigger"
                  :class="{
                    'is-open': showSoftwareDropdown,
                    'has-selection': formData.software?.name?.length > 0,
                  }"
                  @click="toggleSoftwareDropdown"
                >
                  <span
                    v-if="!formData.software?.name?.length"
                    class="placeholder"
                  >
                    Selecione o software...
                  </span>
                  <span
                    v-else
                    class="selected-count"
                  >
                    {{ formData.software.name.length }} selecionado(s)
                  </span>
                  <span
                    class="dropdown-arrow"
                    :class="{ 'is-open': showSoftwareDropdown }"
                  >▼</span>
                </div>

                <div
                  v-if="showSoftwareDropdown"
                  class="multiselect-dropdown"
                  @click.stop
                >
                  <div class="multiselect-options">
                    <label
                      v-for="option in SOFTWARE_OPTIONS"
                      :key="option.value"
                      class="multiselect-option"
                    >
                      <input
                        v-model="formData.software.name"
                        type="checkbox"
                        :value="option.value"
                        @change="onSoftwareSelectionChange(formData)"
                      >
                      <span>{{ option.label }}</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Selected Software Tags -->
              <div
                v-if="formData.software?.name?.length > 0"
                class="selected-software"
              >
                <span class="selected-label">Selecionado:</span>
                <div class="selected-items">
                  <span
                    v-for="(item, index) in formData.software.name"
                    :key="index"
                    class="software-tag"
                  >
                    {{ item }}
                    <button
                      type="button"
                      class="tag-remove"
                      @click="removeSoftware(formData, item)"
                    >
                      ×
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Conditional Software-Specific Fields -->
          <div
            v-if="formData.software?.name?.length > 0"
            class="software-specific-fields"
          >
            <!-- Vectron Group -->
            <div
              v-if="formData.software.name?.includes('Vectron')"
              class="software-group"
            >
              <h3 class="software-group-title">
                Vectron
              </h3>
              <div class="form-grid">
                <div class="form-group">
                  <label
                    for="vectron-model"
                    class="form-label"
                  >Modelo</label>
                  <select
                    id="vectron-model"
                    v-model="formData.software.model"
                    class="form-select"
                  >
                    <option value="">
                      Selecione o modelo...
                    </option>
                    <option
                      v-for="model in VECTRON_MODELS"
                      :key="model"
                      :value="model"
                    >
                      {{ model }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label
                    for="n-equipamento"
                    class="form-label"
                  >Nº Equipamento</label>
                  <input
                    id="n-equipamento"
                    v-model="formData.software.nEquipamento"
                    type="text"
                    class="form-input"
                    placeholder="Nº do equipamento"
                  >
                </div>
              </div>
            </div>

            <!-- Pix Group -->
            <div
              v-if="formData.software.name?.includes('Pix')"
              class="software-group"
            >
              <h3 class="software-group-title">
                Pix
              </h3>
              <div class="form-grid">
                <div class="form-group">
                  <label
                    for="pix-product"
                    class="form-label"
                  >Produto</label>
                  <select
                    id="pix-product"
                    v-model="formData.software.product"
                    class="form-select"
                    @change="onPixProductChange(formData)"
                  >
                    <option value="">
                      Selecione o produto...
                    </option>
                    <option
                      v-for="product in PIX_PRODUCTS"
                      :key="product"
                      :value="product"
                    >
                      {{ product }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Pix Modules -->
              <div
                v-if="pixHasModules(formData.software.product)"
                class="form-group full-width mt-4"
              >
                <label class="form-label">Módulos</label>
                <div class="modules-checkboxes">
                  <label
                    v-for="module in PIX_MODULES"
                    :key="module"
                    class="module-checkbox"
                  >
                    <input
                      v-model="formData.software.modules"
                      type="checkbox"
                      :value="module"
                    >
                    {{ module }}
                  </label>
                </div>
              </div>
            </div>

            <!-- Zone Soft Group -->
            <div
              v-if="formData.software.name?.includes('Zone Soft')"
              class="software-group"
            >
              <h3 class="software-group-title">
                Zone Soft
              </h3>
              <div class="form-grid">
                <div class="form-group">
                  <label
                    for="zonsoft-product"
                    class="form-label"
                  >Produto</label>
                  <select
                    id="zonsoft-product"
                    v-model="formData.software.product"
                    class="form-select"
                  >
                    <option value="">
                      Selecione o produto...
                    </option>
                    <option
                      v-for="product in ZONSOFT_PRODUCTS"
                      :key="product"
                      :value="product"
                    >
                      {{ product }}
                    </option>
                  </select>
                </div>

                <div
                  v-if="formData.software.product && formData.software.product !== 'ZSFACT'"
                  class="form-group"
                >
                  <label
                    for="zonsoft-version"
                    class="form-label"
                  >Versão</label>
                  <select
                    id="zonsoft-version"
                    v-model="formData.software.version"
                    class="form-select"
                  >
                    <option value="">
                      Selecione a versão...
                    </option>
                    <option
                      v-for="version in ZONSOFT_VERSIONS"
                      :key="version"
                      :value="version"
                    >
                      {{ version }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Pt CERT Group -->
            <div
              v-if="formData.software.name?.includes('Pt CERT')"
              class="software-group"
            >
              <h3 class="software-group-title">
                Pt CERT
              </h3>
              <div class="form-grid">
                <div class="form-group">
                  <label
                    for="ptcert-license"
                    class="form-label"
                  >Tipo de Licença</label>
                  <select
                    id="ptcert-license"
                    v-model="formData.software.licenseType"
                    class="form-select"
                  >
                    <option value="">
                      Selecione o tipo...
                    </option>
                    <option
                      v-for="type in PTCERT_LICENSE_TYPES"
                      :key="type"
                      :value="type"
                    >
                      {{ type }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Common Fields (for all software types) -->
            <div
              v-if="formData.software.name?.length > 0"
              class="software-group"
            >
              <h3 class="software-group-title">
                Campos Comuns
              </h3>
              <div class="form-grid">
                <div class="form-group">
                  <label
                    for="numero-serie"
                    class="form-label"
                  >Número Série</label>
                  <input
                    id="numero-serie"
                    v-model="formData.software.numeroSerie"
                    type="text"
                    class="form-input"
                    placeholder="Nº de série"
                  >
                </div>
                <div class="form-group">
                  <label
                    for="versao-software"
                    class="form-label"
                  >Versão Software</label>
                  <input
                    id="versao-software"
                    v-model="formData.software.versaoSoftware"
                    type="text"
                    class="form-input"
                    placeholder="Ex: 1.2.3"
                  >
                </div>
                <div class="form-group">
                  <label
                    for="versao-licenca"
                    class="form-label"
                  >Versão Licença</label>
                  <input
                    id="versao-licenca"
                    v-model="formData.software.versaoLicenca"
                    type="text"
                    class="form-input"
                    placeholder="Versão da licença"
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Invoices field custom implementation -->
    <template #field-invoices="{ formData, updateFieldValue }">
      <div class="invoices-management">
        <!-- Add Invoice Button -->
        <div class="mb-4">
          <button
            type="button"
            class="btn-secondary inline-flex items-center"
            :disabled="editingInvoiceId !== null"
            @click="addInvoice(formData)"
          >
            <svg
              class="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Adicionar Fatura
          </button>
        </div>

        <!-- Invoice Items -->
        <div
          v-if="formData.invoices && formData.invoices.length > 0"
          class="space-y-4"
        >
          <div
            v-for="(invoice, index) in formData.invoices"
            :key="invoice.id"
            class="invoice-card"
            :class="{ editing: isInvoiceEditing(invoice.id) }"
          >
            <div class="invoice-header">
              <h3 class="invoice-title">
                {{ invoice.numeroFatura || `Fatura ${Number(index) + 1}` }}
              </h3>
              <div class="invoice-actions">
                <!-- Edit mode buttons -->
                <template v-if="isInvoiceEditing(invoice.id)">
                  <button
                    type="button"
                    class="btn-icon-action btn-save"
                    title="Guardar"
                    @click="saveInvoice(invoice.id)"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    class="btn-icon-action btn-cancel"
                    title="Cancelar"
                    @click="cancelEditInvoice(invoice.id)"
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
                    @click="editInvoice(invoice.id)"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    class="btn-icon-action btn-delete"
                    title="Eliminar"
                    @click="removeInvoice(formData, Number(index))"
                  >
                    🗑️
                  </button>
                </template>
              </div>
            </div>

            <!-- Invoice Form -->
            <div class="invoice-form">
              <div class="form-grid">
                <div class="form-group">
                  <label
                    :for="`ano-${invoice.id}`"
                    class="form-label"
                  >Ano</label>
                  <input
                    :id="`ano-${invoice.id}`"
                    v-model="invoice.ano"
                    type="text"
                    class="form-input"
                    :disabled="!isInvoiceEditing(invoice.id)"
                    placeholder="Ex: 2024"
                  >
                </div>
                <div class="form-group">
                  <label
                    :for="`numero-fatura-${invoice.id}`"
                    class="form-label"
                  >Número da Fatura</label>
                  <input
                    :id="`numero-fatura-${invoice.id}`"
                    v-model="invoice.numeroFatura"
                    type="text"
                    class="form-input"
                    :disabled="!isInvoiceEditing(invoice.id)"
                    placeholder="Número da fatura"
                  >
                </div>
                <div class="form-group">
                  <label
                    :for="`data-fatura-${invoice.id}`"
                    class="form-label"
                  >Data da Fatura</label>
                  <input
                    :id="`data-fatura-${invoice.id}`"
                    v-model="invoice.dataFatura"
                    type="date"
                    class="form-input"
                    :disabled="!isInvoiceEditing(invoice.id)"
                  >
                </div>
                <div class="form-group">
                  <label
                    :for="`data-aviso-${invoice.id}`"
                    class="form-label"
                  >Data do Aviso</label>
                  <input
                    :id="`data-aviso-${invoice.id}`"
                    v-model="invoice.dataAviso"
                    type="date"
                    class="form-input"
                    :disabled="!isInvoiceEditing(invoice.id)"
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </ContentCreateTemplate>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { onMounted, onBeforeUnmount } from 'vue';
import type { LicenseData, License, LicenseInvoice } from '@clever/shared';
import {
  validateLicenseCreation,
  SOFTWARE_OPTIONS,
  VECTRON_MODELS,
  PIX_PRODUCTS,
  PIX_MODULES,
  ZONSOFT_PRODUCTS,
  ZONSOFT_VERSIONS,
  PTCERT_LICENSE_TYPES,
} from '@clever/shared';
import ContentCreateTemplate from '@/components/common/ContentCreateTemplate.vue';
import ClientSearchInput from '@/components/common/ClientSearchInput.vue';
import { useApi } from '@/composables/useApi';
import { licensesFormSections } from '@/config/licenses-form-sections';

// Router
const router = useRouter();

// Composables
const api = useApi<License>('licenses');

// State
const isLoading = ref(false);
const isSaving = ref(false);
const editingInvoiceId = ref<number | null>(null);
const nextInvoiceId = ref(1);
const error = ref<string | null>(null);
const showSoftwareDropdown = ref(false);
const fieldErrors = ref<Record<string, string>>({});
const selectedClientData = ref<any>(null);

// Client selection handler
const onClientSelected = (client: any, updateFieldValue?: (key: string, value: any) => void) => {
  selectedClientData.value = client;

  // Clear any client-related errors
  if (fieldErrors.value.clientId) {
    delete fieldErrors.value.clientId;
  }
};
// Clear error function
const clearError = () => {
  error.value = null;
  fieldErrors.value = {};
};

// Software management functions
const initializeSoftware = (formData: any) => {
  if (!formData.software || typeof formData.software !== 'object') {
    formData.software = { name: [], modules: [] };
  }
  if (!Array.isArray(formData.software.name)) {
    formData.software.name = [];
  }
  if (!Array.isArray(formData.software.modules)) {
    formData.software.modules = [];
  }
  return '';
};

const toggleSoftwareDropdown = () => {
  showSoftwareDropdown.value = !showSoftwareDropdown.value;
};

const removeSoftware = (formData: any, softwareName: string) => {
  if (formData.software?.name) {
    const index = formData.software.name.indexOf(softwareName);
    if (index > -1) {
      formData.software.name.splice(index, 1);
      onSoftwareSelectionChange(formData);
    }
  }
};

const onSoftwareSelectionChange = (formData: any) => {
  // Initialize software object if it doesn't exist
  if (!formData.software) {
    formData.software = { name: [], modules: [] };
  }

  // Ensure name is an array
  if (!Array.isArray(formData.software.name)) {
    formData.software.name = [];
  }

  // Reset software-specific fields when selection changes
  if (!formData.software.name.includes('Vectron')) {
    formData.software.model = '';
    formData.software.nEquipamento = '';
  }

  if (!formData.software.name.includes('Pix')) {
    formData.software.product = '';
    formData.software.modules = [];
  }

  if (!formData.software.name.includes('Zone Soft')) {
    formData.software.product = '';
    formData.software.version = '';
  }

  if (!formData.software.name.includes('Pt CERT')) {
    formData.software.licenseType = '';
  }
};

const onPixProductChange = (formData: any) => {
  // Reset modules when product changes
  if (formData.software) {
    formData.software.modules = [];
  }
};

const pixHasModules = (product: string): boolean => {
  const productsWithModules = ['Pix rest', 'Pix Gest', 'Pix POS', 'Pix AutoVenda'];
  return productsWithModules.includes(product);
};

// Invoice management functions
const addInvoice = (formData: any) => {
  if (!formData.invoices) {
    formData.invoices = [];
  }

  const newInvoice: LicenseInvoice = {
    id: nextInvoiceId.value++,
    ano: '',
    numeroFatura: '',
    dataFatura: '',
    dataAviso: '',
  };

  formData.invoices.push(newInvoice);
  editingInvoiceId.value = newInvoice.id;
};

const isInvoiceEditing = (id: number): boolean => {
  return editingInvoiceId.value === Number(id);
};

const editInvoice = (id: number | string) => {
  editingInvoiceId.value = Number(id);
};

const saveInvoice = (_id: number | string) => {
  editingInvoiceId.value = null;
};

const cancelEditInvoice = (_id: number | string) => {
  editingInvoiceId.value = null;
};

const removeInvoice = (formData: any, index: number) => {
  if (formData.invoices) {
    formData.invoices.splice(Number(index), 1);
  }
};

// Validation function
const validateCreateForm = (data: Record<string, any>): Record<string, string> => {
  const errors: Record<string, string> = {};

  // CRITICAL: Check clientId first and foremost
  if (
    !data.clientId ||
    data.clientId === '' ||
    (typeof data.clientId === 'string' && data.clientId.trim() === '')
  ) {
    errors.clientId = 'Cliente é obrigatório';
  }

  try {
    // Ensure software object is properly initialized
    if (!data.software || typeof data.software !== 'object') {
      data.software = { name: [], modules: [] };
    }
    if (!Array.isArray(data.software.name)) {
      data.software.name = [];
    }
    if (!Array.isArray(data.software.modules)) {
      data.software.modules = [];
    }

    // Prepare license data for validation
    const licenseData: LicenseData = {
      clientId: data.clientId || '',
      clientName: selectedClientData.value?.data?.nomeEmpresa || '',
      versao: data.versao,
      numeroSerie: data.numeroSerie,
      dataInicio: data.dataInicio,
      dataVencimento: data.dataVencimento,
      modalidade: data.modalidade,
      duracaoContrato: data.duracaoContrato,
      software: data.software,
      invoices: data.invoices || [],
    };

    // Use shared validation
    const validationErrors = validateLicenseCreation(licenseData);

    // Convert validation errors to form errors
    validationErrors.forEach(errorMessage => {
      if (errorMessage.includes('Cliente')) {
        errors.clientId = errorMessage;
      } else if (errorMessage.includes('Versão')) {
        errors.versao = errorMessage;
      } else if (errorMessage.includes('Número de série')) {
        errors.numeroSerie = errorMessage;
      } else if (errorMessage.includes('Data de início')) {
        errors.dataInicio = errorMessage;
      } else if (errorMessage.includes('Data de vencimento')) {
        errors.dataVencimento = errorMessage;
      } else if (errorMessage.includes('Modalidade')) {
        errors.modalidade = errorMessage;
      } else if (errorMessage.includes('Software')) {
        errors.software = errorMessage;
      } else {
        errors.general = errorMessage;
      }
    });
  } catch (err) {
    console.error('Error in validation:', err);
    errors.general = 'Erro na validação dos dados';
  }

  // Store field errors for component use (but this shouldn't be the primary source)
  fieldErrors.value = errors;

  return errors;
};

// Event handlers
const handleCreate = async (formData: Record<string, any>) => {
  try {
    isSaving.value = true;
    clearError();

    // Prepare the license data
    const licenseData: LicenseData = {
      clientId: formData.clientId || '',
      clientName: selectedClientData.value?.data?.nomeEmpresa || '',
      versao: formData.versao,
      numeroSerie: formData.numeroSerie,
      dataInicio: formData.dataInicio,
      dataVencimento: formData.dataVencimento,
      modalidade: formData.modalidade,
      duracaoContrato: formData.duracaoContrato,
      software: formData.software || { name: [], modules: [] },
      invoices: formData.invoices || [],
    };

    const response = await api.create({ data: licenseData } as any);

    if (response) {
      router.push(`/licenses/${response.uuid}`);
    } else {
      throw new Error('Erro ao criar licença');
    }
  } catch (err) {
    console.error('Error creating license:', err);
    error.value = err instanceof Error ? err.message : 'Erro ao criar licença';
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = () => {
  router.push('/licenses');
};

// Click outside to close dropdown
const handleClickOutside = (event: Event) => {
  const target = event.target as Element;
  if (!target.closest('.multiselect-wrapper')) {
    showSoftwareDropdown.value = false;
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* Client field styling */
.client-field {
  @apply space-y-2;
}

.field-error {
  @apply text-sm text-red-600;
}

/* Software management styling */
.software-management {
  @apply space-y-4;
}

.software-form {
  @apply space-y-4;
}

/* Multi-select dropdown styling */
.multiselect-wrapper {
  @apply relative w-full;
}

.multiselect-trigger {
  @apply w-full px-3 py-2 border border-gray-300 rounded-touch bg-white cursor-pointer flex items-center justify-between transition-colors duration-200;
}

.multiselect-trigger:hover {
  @apply border-primary-500;
}

.multiselect-trigger.is-open {
  @apply border-primary-500 ring-2 ring-primary-200;
}

.multiselect-trigger .placeholder {
  @apply text-gray-500;
}

.multiselect-trigger .selected-count {
  @apply text-gray-900 font-medium;
}

.dropdown-arrow {
  @apply text-gray-400 transition-transform duration-200;
}

.dropdown-arrow.is-open {
  @apply transform rotate-180;
}

.multiselect-dropdown {
  @apply absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-touch shadow-lg z-50 max-h-60 overflow-y-auto;
}

.multiselect-options {
  @apply py-1;
}

.multiselect-option {
  @apply flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-150;
}

.multiselect-option input[type='checkbox'] {
  @apply mr-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500;
}

.multiselect-option span {
  @apply text-gray-900;
}

/* Selected software tags */
.selected-software {
  @apply mt-3 p-3 bg-gray-50 rounded-touch border border-gray-200;
}

.selected-label {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.selected-items {
  @apply flex flex-wrap gap-2;
}

.software-tag {
  @apply inline-flex items-center px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium;
}

.tag-remove {
  @apply ml-2 text-primary-600 hover:text-primary-800 focus:outline-none;
}

/* Software groups */
.software-specific-fields {
  @apply mt-6 space-y-6;
}

.software-group {
  @apply p-4 bg-gray-50 rounded-touch border border-gray-200;
}

.software-group-title {
  @apply text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300;
}

.modules-checkboxes {
  @apply grid grid-cols-2 sm:grid-cols-4 gap-3;
}

.module-checkbox {
  @apply flex items-center space-x-2 text-sm;
}

.module-checkbox input[type='checkbox'] {
  @apply rounded border-gray-300 text-primary-600 focus:ring-primary-500;
}

/* Invoice management styling */
.invoices-management {
  @apply space-y-4;
}

.invoice-card {
  @apply bg-white border border-gray-200 rounded-touch p-4 transition-all duration-200;
}

.invoice-card.editing {
  @apply border-primary-300 bg-primary-50;
}

.invoice-header {
  @apply flex items-center justify-between mb-4;
}

.invoice-title {
  @apply text-lg font-semibold text-gray-900;
}

.invoice-actions {
  @apply flex items-center space-x-2;
}

.btn-icon-action {
  @apply p-2 rounded-touch transition-colors duration-200 touch-target;
}

.btn-save {
  @apply bg-green-100 text-green-700 hover:bg-green-200;
}

.btn-cancel {
  @apply bg-red-100 text-red-700 hover:bg-red-200;
}

.btn-edit {
  @apply bg-blue-100 text-blue-700 hover:bg-blue-200;
}

.btn-delete {
  @apply bg-red-100 text-red-700 hover:bg-red-200;
}

.invoice-form {
  @apply space-y-4;
}

/* Form styling */
.form-section {
  @apply space-y-6;
}

.form-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-4;
}

.form-group {
  @apply space-y-2;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  @apply block text-sm font-medium text-gray-700;
}

.form-label.required::after {
  content: none;
}

.form-input,
.form-select,
.form-textarea {
  @apply block w-full rounded-touch border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500;
}

.form-input:disabled,
.form-select:disabled,
.form-textarea:disabled {
  @apply bg-gray-100 text-gray-500 cursor-not-allowed;
}

/* Mobile-first responsive adjustments */
@media (max-width: 640px) {
  .modules-checkboxes {
    @apply grid-cols-1;
  }

  .invoice-actions {
    @apply space-x-1;
  }

  .btn-icon-action {
    @apply p-1.5;
  }

  .selected-items {
    @apply flex-col;
  }

  .software-tag {
    @apply justify-between;
  }
}

/* Portuguese text optimization */
.invoice-title,
.form-label {
  @apply text-portuguese;
}

/* Touch-friendly interactions */
@media (hover: none) {
  .btn-icon-action:active {
    @apply scale-95;
  }
}
</style>

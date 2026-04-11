<template>
  <ContentUpdateTemplate
    :item="license"
    content-type="licenses"
    edit-title="Editar Licença"
    subtitle="Atualizar informações da licença"
    cancel-route="/licenses"
    :form-sections="modifiedFormSections"
    :is-loading="isLoading"
    :is-saving="isSaving"
    :error="error"
    :disabled-fields="disabledFields"
    :read-only-fields="readOnlyFields"
    :custom-validator="validateUpdateForm"
    @update="handleUpdate"
    @cancel="handleCancel"
    @clear-error="clearError"
  >
    <!-- Software field custom implementation -->
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
              <label for="software-names" class="form-label">Software *</label>
              <div class="multiselect-wrapper">
                <div
                  class="multiselect-trigger"
                  :class="{
                    'is-open': showSoftwareDropdown,
                    'has-selection': formData.software.name?.length > 0,
                  }"
                  @click="toggleSoftwareDropdown"
                >
                  <span v-if="!formData.software.name?.length" class="placeholder">
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
                      v-for="option in SOFTWARE_OPTIONS"
                      :key="option.value"
                      class="multiselect-option"
                    >
                      <input
                        type="checkbox"
                        :value="option.value"
                        v-model="formData.software.name"
                        @change="onSoftwareSelectionChange(formData)"
                      />
                      <span>{{ option.label }}</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Selected Software Tags -->
              <div v-if="formData.software.name?.length > 0" class="selected-software">
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
                      @click="removeSoftware(formData, item)"
                      class="tag-remove"
                    >
                      ×
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Conditional Software-Specific Fields -->
          <div v-if="formData.software.name?.length > 0" class="software-specific-fields">
            <!-- Vectron Group -->
            <div v-if="formData.software.name?.includes('Vectron')" class="software-group">
              <h3 class="software-group-title">Vectron</h3>
              <div class="form-grid">
                <div class="form-group">
                  <label for="vectron-model" class="form-label">Modelo</label>
                  <select id="vectron-model" v-model="formData.software.model" class="form-select">
                    <option value="">Selecione o modelo...</option>
                    <option v-for="model in VECTRON_MODELS" :key="model" :value="model">
                      {{ model }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="n-equipamento" class="form-label">Nº Equipamento</label>
                  <input
                    type="text"
                    id="n-equipamento"
                    v-model="formData.software.nEquipamento"
                    class="form-input"
                    placeholder="Nº do equipamento"
                  />
                </div>
              </div>
            </div>

            <!-- Pix Group -->
            <div v-if="formData.software.name?.includes('Pix')" class="software-group">
              <h3 class="software-group-title">Pix</h3>
              <div class="form-grid">
                <div class="form-group">
                  <label for="pix-product" class="form-label">Produto</label>
                  <select
                    id="pix-product"
                    v-model="formData.software.product"
                    class="form-select"
                    @change="onPixProductChange(formData)"
                  >
                    <option value="">Selecione o produto...</option>
                    <option v-for="product in PIX_PRODUCTS" :key="product" :value="product">
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
                  <label v-for="module in PIX_MODULES" :key="module" class="module-checkbox">
                    <input type="checkbox" :value="module" v-model="formData.software.modules" />
                    {{ module }}
                  </label>
                </div>
              </div>
            </div>

            <!-- Zone Soft Group -->
            <div v-if="formData.software.name?.includes('Zone Soft')" class="software-group">
              <h3 class="software-group-title">Zone Soft</h3>
              <div class="form-grid">
                <div class="form-group">
                  <label for="zonsoft-product" class="form-label">Produto</label>
                  <select
                    id="zonsoft-product"
                    v-model="formData.software.product"
                    class="form-select"
                  >
                    <option value="">Selecione o produto...</option>
                    <option v-for="product in ZONSOFT_PRODUCTS" :key="product" :value="product">
                      {{ product }}
                    </option>
                  </select>
                </div>

                <div
                  v-if="formData.software.product && formData.software.product !== 'ZSFACT'"
                  class="form-group"
                >
                  <label for="zonsoft-version" class="form-label">Versão</label>
                  <select
                    id="zonsoft-version"
                    v-model="formData.software.version"
                    class="form-select"
                  >
                    <option value="">Selecione a versão...</option>
                    <option v-for="version in ZONSOFT_VERSIONS" :key="version" :value="version">
                      {{ version }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Pt CERT Group -->
            <div v-if="formData.software.name?.includes('Pt CERT')" class="software-group">
              <h3 class="software-group-title">Pt CERT</h3>
              <div class="form-grid">
                <div class="form-group">
                  <label for="ptcert-license" class="form-label">Tipo de Licença</label>
                  <select
                    id="ptcert-license"
                    v-model="formData.software.licenseType"
                    class="form-select"
                  >
                    <option value="">Selecione o tipo...</option>
                    <option v-for="type in PTCERT_LICENSE_TYPES" :key="type" :value="type">
                      {{ type }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Common Fields (for all software types) -->
            <div v-if="formData.software.name?.length > 0" class="software-group">
              <h3 class="software-group-title">Campos Comuns</h3>
              <div class="form-grid">
                <div class="form-group">
                  <label for="numero-serie" class="form-label">Número Série</label>
                  <input
                    type="text"
                    id="numero-serie"
                    v-model="formData.software.numeroSerie"
                    class="form-input"
                    placeholder="Nº de série"
                  />
                </div>
                <div class="form-group">
                  <label for="versao-software" class="form-label">Versão Software</label>
                  <input
                    type="text"
                    id="versao-software"
                    v-model="formData.software.versaoSoftware"
                    class="form-input"
                    placeholder="Ex: 1.2.3"
                  />
                </div>
                <div class="form-group">
                  <label for="versao-licenca" class="form-label">Versão Licença</label>
                  <input
                    type="text"
                    id="versao-licenca"
                    v-model="formData.software.versaoLicenca"
                    class="form-input"
                    placeholder="Versão da licença"
                  />
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
            @click="addInvoice(formData)"
            class="btn-secondary inline-flex items-center"
            :disabled="editingInvoiceId !== null"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div v-if="formData.invoices && formData.invoices.length > 0" class="space-y-4">
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
                    @click="saveInvoice(invoice.id)"
                    class="btn-icon-action btn-save"
                    title="Guardar"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    @click="cancelEditInvoice(invoice.id)"
                    class="btn-icon-action btn-cancel"
                    title="Cancelar"
                  >
                    ✕
                  </button>
                </template>
                <!-- View mode buttons -->
                <template v-else>
                  <button
                    type="button"
                    @click="editInvoice(invoice.id)"
                    class="btn-icon-action btn-edit"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    @click="removeInvoice(formData, Number(index))"
                    class="btn-icon-action btn-delete"
                    title="Eliminar"
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
                  <label :for="`ano-${invoice.id}`" class="form-label">Ano</label>
                  <input
                    type="text"
                    :id="`ano-${invoice.id}`"
                    v-model="invoice.ano"
                    class="form-input"
                    :disabled="!isInvoiceEditing(invoice.id)"
                    placeholder="Ex: 2024"
                  />
                </div>
                <div class="form-group">
                  <label :for="`numero-fatura-${invoice.id}`" class="form-label"
                    >Número da Fatura</label
                  >
                  <input
                    type="text"
                    :id="`numero-fatura-${invoice.id}`"
                    v-model="invoice.numeroFatura"
                    class="form-input"
                    :disabled="!isInvoiceEditing(invoice.id)"
                    placeholder="Número da fatura"
                  />
                </div>
                <div class="form-group">
                  <label :for="`data-fatura-${invoice.id}`" class="form-label"
                    >Data da Fatura</label
                  >
                  <input
                    type="date"
                    :id="`data-fatura-${invoice.id}`"
                    v-model="invoice.dataFatura"
                    class="form-input"
                    :disabled="!isInvoiceEditing(invoice.id)"
                  />
                </div>
                <div class="form-group">
                  <label :for="`data-aviso-${invoice.id}`" class="form-label">Data do Aviso</label>
                  <input
                    type="date"
                    :id="`data-aviso-${invoice.id}`"
                    v-model="invoice.dataAviso"
                    class="form-input"
                    :disabled="!isInvoiceEditing(invoice.id)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Custom sections for license updates -->
    <template #updateSections="{ formData, errors, updateFieldValue }">
      <!-- Audit Information Section (Read-only) -->
      <div class="form-section">
        <div class="bg-white rounded-touch border border-gray-200">
          <div
            class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
          >
            <h2 class="text-lg font-semibold text-gray-900">Informação de Auditoria</h2>
            <p class="text-sm text-gray-600 mt-1">
              Informações sobre criação e modificação (apenas leitura)
            </p>
          </div>
          <div class="p-4 sm:p-6">
            <div class="audit-info-grid">
              <div class="audit-item">
                <label class="audit-label">Criado em</label>
                <div class="audit-value">{{ formatDateTime(license?.createdAt) }}</div>
              </div>
              <div class="audit-item">
                <label class="audit-label">Criado por</label>
                <div class="audit-value">{{ license?.createdBy || 'Sistema' }}</div>
              </div>
              <div class="audit-item">
                <label class="audit-label">Última atualização</label>
                <div class="audit-value">{{ formatDateTime(license?.updatedAt) }}</div>
              </div>
              <div class="audit-item">
                <label class="audit-label">Atualizado por</label>
                <div class="audit-value">{{ license?.updatedBy || 'Sistema' }}</div>
              </div>
              <div class="audit-item">
                <label class="audit-label">Versão</label>
                <div class="audit-value">{{ license?.version || 1 }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </ContentUpdateTemplate>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { License, LicenseData, LicenseInvoice } from '@clever/shared';
import {
  validateLicenseUpdate,
  SOFTWARE_OPTIONS,
  VECTRON_MODELS,
  PIX_PRODUCTS,
  PIX_MODULES,
  ZONSOFT_PRODUCTS,
  ZONSOFT_VERSIONS,
  PTCERT_LICENSE_TYPES,
} from '@clever/shared';
import ContentUpdateTemplate from '@/components/common/ContentUpdateTemplate.vue';
import ClientSearchInput from '@/components/common/ClientSearchInput.vue';
import { useApi } from '@/composables/useApi';
import { useErrorHandler } from '@/composables/useErrorHandler';
import { licensesFormSections } from '@/config/licenses-form-sections';

// Router
const route = useRoute();
const router = useRouter();

// Composables
const api = useApi<License>('licenses');
const errorHandler = useErrorHandler();

// State
const license = ref<License | null>(null);
const isLoading = ref(false);
const isSaving = ref(false);
const editingInvoiceId = ref<number | null>(null);
const nextInvoiceId = ref(1000); // Start high to avoid conflicts
const error = ref<string | null>(null);
const showSoftwareDropdown = ref(false);
const fieldErrors = ref<Record<string, string>>({});
const selectedClientData = ref<any>(null);

// Clear error function
const clearError = () => {
  error.value = null;
  fieldErrors.value = {};
};

// Client selection handler (for read-only display)
const onClientSelected = (client: any) => {
  selectedClientData.value = client;
};

// Fields that should be disabled in update mode
const disabledFields = ['uuid', 'createdAt', 'createdBy', 'version'];

// Fields that should be read-only (shown but not editable)
const readOnlyFields: string[] = [];

// Create modified form sections with readonly clientId field
const modifiedFormSections = computed(() => {
  return licensesFormSections.map(section => ({
    ...section,
    fields: section.fields.map(field => {
      if (field.key === 'clientId') {
        return {
          ...field,
          readonly: true,
        };
      }
      return field;
    }),
  }));
});

// Utility functions
const formatDateTime = (dateString?: string): string => {
  if (!dateString) return '-';

  const date = new Date(dateString);
  return date.toLocaleString('pt-PT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
const validateUpdateForm = (data: Record<string, any>): Record<string, string> => {
  const errors: Record<string, string> = {};

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

    // Prepare partial license data for validation
    const licenseData: Partial<LicenseData> = {
      clientId: data.clientId,
      clientName: selectedClientData.value?.data?.nomeEmpresa || data.clientName,
      versao: data.versao,
      numeroSerie: data.numeroSerie,
      dataInicio: data.dataInicio,
      dataVencimento: data.dataVencimento,
      modalidade: data.modalidade,
      duracaoContrato: data.duracaoContrato,
      software: data.software,
      invoices: data.invoices,
    };

    // Use shared validation for updates
    const validationErrors = validateLicenseUpdate(licenseData);

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
    errors.general = 'Erro na validação dos dados';
  }

  // Store field errors for component use
  fieldErrors.value = errors;

  return errors;
};
// Event handlers
const handleUpdate = async (formData: Record<string, any>) => {
  if (!license.value) return;

  try {
    isSaving.value = true;
    clearError();

    // Prepare the update data (only the fields that changed)
    const updateData: Partial<LicenseData> = {
      clientId: formData.clientId,
      clientName: selectedClientData.value?.data?.nomeEmpresa || formData.clientName,
      versao: formData.versao,
      numeroSerie: formData.numeroSerie,
      dataInicio: formData.dataInicio,
      dataVencimento: formData.dataVencimento,
      modalidade: formData.modalidade,
      duracaoContrato: formData.duracaoContrato,
      software: formData.software || { name: [], modules: [] },
      invoices: formData.invoices || [],
    };

    const response = await api.update(license.value.uuid, { data: updateData } as any);

    if (response) {
      router.push(`/licenses/${license.value!.uuid}`);
    } else {
      throw new Error('Erro ao atualizar licença');
    }
  } catch (err) {
    console.error('Error updating license:', err);
    error.value = err instanceof Error ? err.message : 'Erro ao atualizar licença';
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = () => {
  if (license.value) {
    router.push(`/licenses/${license.value.uuid}`);
  } else {
    router.push('/licenses');
  }
};
// Data loading
const loadLicense = async () => {
  const licenseId = route.params.uuid as string;

  if (!licenseId) {
    error.value = 'ID da licença não fornecido';
    return;
  }

  try {
    isLoading.value = true;
    clearError();

    await api.fetchById(licenseId);

    if (api.currentItem.value) {
      license.value = api.currentItem.value;

      // Ensure software object exists and has proper structure
      if (!license.value.data.software) {
        license.value.data.software = { name: [], modules: [] };
      }

      // Ensure invoices array exists and has proper IDs
      if (license.value.data.invoices) {
        license.value.data.invoices.forEach((invoice, index) => {
          if (!invoice.id) {
            invoice.id = nextInvoiceId.value++;
          } else {
            invoice.id = Number(invoice.id);
          }
        });

        // Update next ID to avoid conflicts
        const maxId = Math.max(...license.value.data.invoices.map(i => Number(i.id)));
        nextInvoiceId.value = Math.max(nextInvoiceId.value, maxId + 1);
      } else {
        license.value.data.invoices = [];
      }
    } else {
      throw new Error('Licença não encontrada');
    }
  } catch (err) {
    console.error('Error loading license:', err);
    error.value = err instanceof Error ? err.message : 'Erro ao carregar licença';
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  loadLicense();
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Click outside to close dropdown
const handleClickOutside = (event: Event) => {
  const target = event.target as Element;
  if (!target.closest('.multiselect-wrapper')) {
    showSoftwareDropdown.value = false;
  }
};
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

/* Audit information styling */
.audit-info-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-touch border border-gray-200;
}

.audit-item {
  @apply space-y-1;
}

.audit-label {
  @apply text-xs font-medium text-gray-500 uppercase tracking-wide;
}

.audit-value {
  @apply text-sm text-gray-900 font-medium;
}

/* Form styling */
.form-section {
  @apply space-y-6;
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

  .audit-info-grid {
    @apply grid-cols-1;
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
.section-title,
.form-label,
.audit-label {
  @apply text-portuguese;
}

/* Update-specific styling */
.audit-info-grid {
  @apply bg-blue-50 border-blue-200;
}

.audit-value {
  @apply text-blue-900;
}
</style>

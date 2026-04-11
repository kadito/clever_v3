<template>
  <ContentCreateTemplate
    content-type="clients"
    create-title="Criar Cliente"
    subtitle="Adicionar um novo cliente ao sistema"
    cancel-route="/clients"
    :form-sections="clientsFormSections"
    :is-loading="isLoading"
    :is-saving="isSaving"
    :error="error"
    :custom-validator="validateCreateForm"
    @create="handleCreate"
    @cancel="handleCancel"
    @clear-error="clearError"
  >
    <!-- Software field custom implementation -->
    <template #field-softwares="{ formData, updateFieldValue }">
      <div class="software-management">
        <!-- Add Software Button -->
        <div class="mb-4">
          <button
            type="button"
            @click="addSoftware(formData)"
            class="btn-secondary inline-flex items-center"
            :disabled="editingSoftwareId !== null"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Adicionar Software
          </button>
        </div>

        <!-- Software Items -->
        <div v-if="formData.softwares && formData.softwares.length > 0" class="space-y-4">
          <div
            v-for="(software, index) in formData.softwares"
            :key="software.id"
            class="software-card"
            :class="{ editing: isSoftwareEditing(software.id) }"
          >
            <div class="software-header">
              <h3 class="software-title">
                {{ software.name || `Software ${Number(index) + 1}` }}
              </h3>
              <div class="software-actions">
                <!-- Edit mode buttons -->
                <template v-if="isSoftwareEditing(software.id)">
                  <button
                    type="button"
                    @click="saveSoftware(software.id)"
                    class="btn-icon-action btn-save"
                    :disabled="!software.name"
                    title="Guardar"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    @click="cancelEditSoftware(software.id)"
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
                    @click="editSoftware(software.id)"
                    class="btn-icon-action btn-edit"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    @click="removeSoftware(formData, Number(index))"
                    class="btn-icon-action btn-delete"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </template>
              </div>
            </div>

            <!-- Software Configuration Form -->
            <div class="software-form">
              <div class="form-grid">
                <!-- Software Selection -->
                <div class="form-group">
                  <label :for="`software-${software.id}`" class="form-label required"
                    >Software</label
                  >
                  <select
                    :id="`software-${software.id}`"
                    v-model="software.name"
                    class="form-select"
                    :disabled="!isSoftwareEditing(software.id)"
                    @change="onSoftwareChange(Number(index))"
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="Vectron">Vectron</option>
                    <option value="Pix">Pix</option>
                    <option value="Zone Soft">Zone Soft</option>
                    <option value="Pt CERT">Pt CERT</option>
                    <option value="Dream Soft">Dream Soft</option>
                    <option value="Contas Certas">Contas Certas</option>
                  </select>
                </div>

                <!-- Vectron Model -->
                <div v-if="software.name === 'Vectron'" class="form-group">
                  <label :for="`vectron-model-${software.id}`" class="form-label">Modelo</label>
                  <select
                    :id="`vectron-model-${software.id}`"
                    v-model="software.model"
                    class="form-select"
                    :disabled="!isSoftwareEditing(software.id)"
                  >
                    <option value="">Selecione o modelo...</option>
                    <option value="Vectron Wide 14">Vectron Wide 14</option>
                    <option value="Vectron Pos 7">Vectron Pos 7</option>
                    <option value="Vectron Pos PC">Vectron Pos PC</option>
                    <option value="Vectron Pos Touch K6">Vectron Pos Touch K6</option>
                    <option value="Vectron Pos Touch K5 15">Vectron Pos Touch K5 15</option>
                    <option value="Vectron Pos Touch K5 12">Vectron Pos Touch K5 12</option>
                    <option value="Vectron Mobil Pro III">Vectron Mobil Pro III</option>
                    <option value="Vectron Mobil Pro IV">Vectron Mobil Pro IV</option>
                  </select>
                </div>

                <!-- Pix Product -->
                <div v-if="software.name === 'Pix'" class="form-group">
                  <label :for="`pix-product-${software.id}`" class="form-label">Produto</label>
                  <select
                    :id="`pix-product-${software.id}`"
                    v-model="software.product"
                    class="form-select"
                    :disabled="!isSoftwareEditing(software.id)"
                    @change="onPixProductChange(Number(index))"
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

                <!-- Zone Soft Product -->
                <div v-if="software.name === 'Zone Soft'" class="form-group">
                  <label :for="`zonsoft-product-${software.id}`" class="form-label">Produto</label>
                  <select
                    :id="`zonsoft-product-${software.id}`"
                    v-model="software.product"
                    class="form-select"
                    :disabled="!isSoftwareEditing(software.id)"
                  >
                    <option value="">Selecione o produto...</option>
                    <option value="ZSFACT">ZSFACT</option>
                    <option value="ZSGO">ZSGO</option>
                    <option value="ZSPOS">ZSPOS</option>
                    <option value="ZSPOS MOBILE (ANDRIOD)">ZSPOS MOBILE (ANDRIOD)</option>
                    <option value="ZSREST">ZSREST</option>
                  </select>
                </div>

                <!-- Zone Soft Version -->
                <div
                  v-if="
                    software.name === 'Zone Soft' &&
                    software.product &&
                    software.product !== 'ZSFACT'
                  "
                  class="form-group"
                >
                  <label :for="`zonsoft-version-${software.id}`" class="form-label">Versão</label>
                  <select
                    :id="`zonsoft-version-${software.id}`"
                    v-model="software.version"
                    class="form-select"
                    :disabled="!isSoftwareEditing(software.id)"
                  >
                    <option value="">Selecione a versão...</option>
                    <option value="Pro">Pro</option>
                    <option value="Lite">Lite</option>
                    <option value="Basic">Basic</option>
                  </select>
                </div>

                <!-- Pt CERT License Type -->
                <div v-if="software.name === 'Pt CERT'" class="form-group">
                  <label :for="`ptcert-license-${software.id}`" class="form-label"
                    >Tipo de Licença</label
                  >
                  <select
                    :id="`ptcert-license-${software.id}`"
                    v-model="software.licenseType"
                    class="form-select"
                    :disabled="!isSoftwareEditing(software.id)"
                  >
                    <option value="">Selecione o tipo...</option>
                    <option value="Licença Definitiva">Licença Definitiva</option>
                    <option value="Licença Anual">Licença Anual</option>
                  </select>
                </div>
              </div>

              <!-- Pix Modules -->
              <div
                v-if="software.name === 'Pix' && pixHasModules(software.product)"
                class="form-group full-width mt-4"
              >
                <label class="form-label">Módulos</label>
                <div class="modules-checkboxes">
                  <label class="module-checkbox">
                    <input
                      type="checkbox"
                      value="Modulo 1"
                      v-model="software.modules"
                      :disabled="!isSoftwareEditing(software.id)"
                    />
                    Módulo 1
                  </label>
                  <label class="module-checkbox">
                    <input
                      type="checkbox"
                      value="Modulo 2"
                      v-model="software.modules"
                      :disabled="!isSoftwareEditing(software.id)"
                    />
                    Módulo 2
                  </label>
                  <label class="module-checkbox">
                    <input
                      type="checkbox"
                      value="Modulo 3"
                      v-model="software.modules"
                      :disabled="!isSoftwareEditing(software.id)"
                    />
                    Módulo 3
                  </label>
                  <label class="module-checkbox">
                    <input
                      type="checkbox"
                      value="Posto adicional"
                      v-model="software.modules"
                      :disabled="!isSoftwareEditing(software.id)"
                    />
                    Posto adicional
                  </label>
                </div>
              </div>

              <!-- Additional Fields -->
              <div v-if="software.name" class="additional-fields mt-4">
                <div class="form-grid">
                  <!-- Vectron Fields -->
                  <template v-if="software.name === 'Vectron'">
                    <div class="form-group">
                      <label :for="`n-equipamento-${software.id}`" class="form-label"
                        >Nº Equipamento</label
                      >
                      <input
                        type="text"
                        :id="`n-equipamento-${software.id}`"
                        v-model="software.nEquipamento"
                        class="form-input"
                        :disabled="!isSoftwareEditing(software.id)"
                        placeholder="Nº do equipamento"
                      />
                    </div>
                    <div class="form-group">
                      <label :for="`versao-software-${software.id}`" class="form-label"
                        >Versão do Software</label
                      >
                      <input
                        type="text"
                        :id="`versao-software-${software.id}`"
                        v-model="software.versaoSoftware"
                        class="form-input"
                        :disabled="!isSoftwareEditing(software.id)"
                        placeholder="Ex: 1.2.3"
                      />
                    </div>
                  </template>

                  <!-- Common Fields (for all except Vectron) -->
                  <template v-else>
                    <div class="form-group">
                      <label :for="`numero-serie-${software.id}`" class="form-label"
                        >Número Série</label
                      >
                      <input
                        type="text"
                        :id="`numero-serie-${software.id}`"
                        v-model="software.numeroSerie"
                        class="form-input"
                        :disabled="!isSoftwareEditing(software.id)"
                        placeholder="Nº de série"
                      />
                    </div>
                    <div class="form-group">
                      <label :for="`versao-software-${software.id}`" class="form-label"
                        >Versão Software</label
                      >
                      <input
                        type="text"
                        :id="`versao-software-${software.id}`"
                        v-model="software.versaoSoftware"
                        class="form-input"
                        :disabled="!isSoftwareEditing(software.id)"
                        placeholder="Ex: 1.2.3"
                      />
                    </div>
                    <div class="form-group">
                      <label :for="`versao-licenca-${software.id}`" class="form-label"
                        >Versão Licença</label
                      >
                      <input
                        type="text"
                        :id="`versao-licenca-${software.id}`"
                        v-model="software.versaoLicenca"
                        class="form-input"
                        :disabled="!isSoftwareEditing(software.id)"
                        placeholder="Versão da licença"
                      />
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="empty-software-state">
          <div class="text-center py-8">
            <div class="text-4xl mb-2">💻</div>
            <p class="text-gray-500">Nenhum software adicionado</p>
          </div>
        </div>
      </div>
    </template>
  </ContentCreateTemplate>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import type { ClientData, ClientSoftware, Client } from '@clever/shared';
import { validateClientCreation } from '@clever/shared';
import ContentCreateTemplate from '@/components/common/ContentCreateTemplate.vue';
import type { FormSection } from '@/components/common/types';
import { useApi } from '@/composables/useApi';
import { clientsFormSections } from '@/config/clients-form-sections';

// Router
const router = useRouter();

// Composables
const api = useApi<Client>('clients');

// State
const isLoading = ref(false);
const isSaving = ref(false);
const editingSoftwareId = ref<number | null>(null);
const nextSoftwareId = ref(1);
const error = ref<string | null>(null);

// Clear error function
const clearError = () => {
  error.value = null;
};

// Software management functions
const addSoftware = (formData: any) => {
  if (!formData.softwares) {
    formData.softwares = [];
  }

  const newSoftware: ClientSoftware = {
    id: nextSoftwareId.value++,
    name: '' as any,
    modules: [],
  };

  formData.softwares.push(newSoftware);
  editingSoftwareId.value = newSoftware.id;
};

const isSoftwareEditing = (id: number): boolean => {
  return editingSoftwareId.value === Number(id);
};

const editSoftware = (id: number | string) => {
  editingSoftwareId.value = Number(id);
};

const saveSoftware = (_id: number | string) => {
  editingSoftwareId.value = null;
};

const cancelEditSoftware = (_id: number | string) => {
  editingSoftwareId.value = null;
};

const removeSoftware = (formData: any, index: number) => {
  if (formData.softwares) {
    formData.softwares.splice(index, 1);
  }
};

const onSoftwareChange = (_index: number) => {
  // Reset software-specific fields when software type changes
};

const onPixProductChange = (_index: number) => {
  // Reset modules when product changes
};

const pixHasModules = (product: string): boolean => {
  const productsWithModules = ['Pix rest', 'Pix Gest', 'Pix POS', 'Pix AutoVenda'];
  return productsWithModules.includes(product);
};

// Validation function
const validateCreateForm = (data: Record<string, any>): Record<string, string> => {
  const errors: Record<string, string> = {};

  try {
    // Convert selectedServices array to individual boolean fields
    const selectedServices = data.selectedServices || [];
    const serviceFlags = {
      temAnydesk: selectedServices.includes('temAnydesk'),
      manutencao: selectedServices.includes('manutencao'),
      manutencao24: selectedServices.includes('manutencao24'),
      dumps: selectedServices.includes('dumps'),
      atcud: selectedServices.includes('atcud'),
      vectronConnect: selectedServices.includes('vectronConnect'),
    };

    // Prepare client data for validation
    const clientData: ClientData = {
      nomeEmpresa: data.nomeEmpresa || '',
      nomeComercial: data.nomeComercial || '',
      contribuinte: data.contribuinte,
      responsavel: data.responsavel,
      telefone: data.telefone,
      telefoneContato: data.telefoneContato,
      email: data.email,
      emailContato: data.emailContato,
      morada: data.morada,
      codigoPostal: data.codigoPostal,
      localidade: data.localidade,
      iban: data.iban,
      softwares: data.softwares || [],
      ...serviceFlags, // Spread the service boolean flags
      dumpsLink: data.dumpsLink,
      seriesDocumentos: data.seriesDocumentos,
      atUsername: data.atUsername,
      atPassword: data.atPassword,
      vectronAddress: data.vectronAddress,
      observacoes: data.observacoes,
    };

    // Use shared validation
    const validationErrors = validateClientCreation(clientData);

    // Convert validation errors to form errors
    validationErrors.forEach((errorMessage, index) => {
      // Map error messages to field keys (simplified approach)
      if (errorMessage.includes('Nome da empresa')) {
        errors.nomeEmpresa = errorMessage;
      } else if (errorMessage.includes('Nome comercial')) {
        errors.nomeComercial = errorMessage;
      } else if (errorMessage.includes('Email inválido')) {
        errors.email = errorMessage;
      } else if (errorMessage.includes('Email de contacto')) {
        errors.emailContato = errorMessage;
      } else if (errorMessage.includes('IBAN')) {
        errors.iban = errorMessage;
      } else if (errorMessage.includes('Código postal')) {
        errors.codigoPostal = errorMessage;
      } else {
        // Generic error
        errors.general = errorMessage;
      }
    });
  } catch (err) {
    console.error('Error in validation:', err);
    errors.general = 'Erro na validação dos dados';
  }

  return errors;
};

// Event handlers
const handleCreate = async (formData: Record<string, any>) => {
  try {
    isSaving.value = true;
    clearError();

    // Convert selectedServices array to individual boolean fields
    const selectedServices = formData.selectedServices || [];
    const serviceFlags = {
      temAnydesk: selectedServices.includes('temAnydesk'),
      manutencao: selectedServices.includes('manutencao'),
      manutencao24: selectedServices.includes('manutencao24'),
      dumps: selectedServices.includes('dumps'),
      atcud: selectedServices.includes('atcud'),
      vectronConnect: selectedServices.includes('vectronConnect'),
    };

    // Prepare the client data
    const clientData: ClientData = {
      nomeEmpresa: formData.nomeEmpresa || '',
      nomeComercial: formData.nomeComercial || '',
      contribuinte: formData.contribuinte,
      responsavel: formData.responsavel,
      telefone: formData.telefone,
      telefoneContato: formData.telefoneContato,
      email: formData.email,
      emailContato: formData.emailContato,
      morada: formData.morada,
      codigoPostal: formData.codigoPostal,
      localidade: formData.localidade,
      iban: formData.iban,
      softwares: formData.softwares || [],
      ...serviceFlags, // Spread the service boolean flags
      dumpsLink: formData.dumpsLink,
      seriesDocumentos: formData.seriesDocumentos,
      atUsername: formData.atUsername,
      atPassword: formData.atPassword,
      vectronAddress: formData.vectronAddress,
      observacoes: formData.observacoes,
    };

    const response = await api.create({ data: clientData } as any);

    if (response) {
      // Navigate to the created client's detail page
      router.push(`/clients/${response.uuid}`);
    } else {
      throw new Error('Erro ao criar cliente');
    }
  } catch (err) {
    console.error('Error creating client:', err);
    error.value = err instanceof Error ? err.message : 'Erro ao criar cliente';
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = () => {
  router.push('/clients');
};
</script>

<style scoped>
/* Software management styling */
.software-management {
  @apply space-y-4;
}

.software-card {
  @apply bg-white border border-gray-200 rounded-touch p-4 transition-all duration-200;
}

.software-card.editing {
  @apply border-primary-300 bg-primary-50;
}

.software-header {
  @apply flex items-center justify-between mb-4;
}

.software-title {
  @apply text-lg font-semibold text-gray-900;
}

.software-actions {
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

.software-form {
  @apply space-y-4;
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

.additional-fields {
  @apply pt-4 border-t border-gray-200;
}

.empty-software-state {
  @apply bg-gray-50 rounded-touch border-2 border-dashed border-gray-300;
}

/* Form styling */
.form-section {
  @apply space-y-6;
}

.section-header {
  @apply space-y-2;
}

.section-title {
  @apply text-lg font-semibold text-gray-900;
}

.section-description {
  @apply text-sm text-gray-600;
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
  .software-actions {
    @apply space-x-1;
  }

  .btn-icon-action {
    @apply p-1.5;
  }

  .modules-checkboxes {
    @apply grid-cols-1;
  }
}

/* Portuguese text optimization */
.software-title,
.section-title,
.form-label {
  @apply text-portuguese;
}

/* Conditional fields styling */
.conditional-fields {
  @apply bg-blue-50 border border-blue-200 rounded-touch p-4;
}

.conditional-fields .form-grid {
  @apply mt-0;
}

.conditional-fields .form-group {
  @apply mb-0;
}

/* Touch-friendly interactions */
@media (hover: none) {
  .btn-icon-action:active {
    @apply scale-95;
  }
}
</style>

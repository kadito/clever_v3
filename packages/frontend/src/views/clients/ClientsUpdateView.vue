<template>
  <ContentUpdateTemplate
    :item="client"
    content-type="clients"
    edit-title="Editar Cliente"
    subtitle="Atualizar informações do cliente"
    cancel-route="/clients"
    :form-sections="clientsFormSections"
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
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
            :class="{ 'editing': isSoftwareEditing(software.id) }"
          >
            <div class="software-header">
              <h3 class="software-title">
                {{ software.name || `Software ${index + 1}` }}
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
                    @click="removeSoftware(formData, index)"
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
                  <label :for="`software-${software.id}`" class="form-label required">Software</label>
                  <select
                    :id="`software-${software.id}`"
                    v-model="software.name"
                    class="form-select"
                    :disabled="!isSoftwareEditing(software.id)"
                    @change="onSoftwareChange(index)"
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="Vectron">Vectron</option>
                    <option value="Pix">Pix</option>
                    <option value="Zon Soft">Zon Soft</option>
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
                    @change="onPixProductChange(index)"
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

                <!-- Zon Soft Product -->
                <div v-if="software.name === 'Zon Soft'" class="form-group">
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

                <!-- Zon Soft Version -->
                <div v-if="software.name === 'Zon Soft' && software.product && software.product !== 'ZSFACT'" class="form-group">
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
                  <label :for="`ptcert-license-${software.id}`" class="form-label">Tipo de Licença</label>
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
              <div v-if="software.name === 'Pix' && pixHasModules(software.product)" class="form-group full-width mt-4">
                <label class="form-label">Módulos</label>
                <div class="modules-checkboxes">
                  <label class="module-checkbox">
                    <input
                      type="checkbox"
                      value="Modulo 1"
                      v-model="software.modules"
                      :disabled="!isSoftwareEditing(software.id)"
                    >
                    Módulo 1
                  </label>
                  <label class="module-checkbox">
                    <input
                      type="checkbox"
                      value="Modulo 2"
                      v-model="software.modules"
                      :disabled="!isSoftwareEditing(software.id)"
                    >
                    Módulo 2
                  </label>
                  <label class="module-checkbox">
                    <input
                      type="checkbox"
                      value="Modulo 3"
                      v-model="software.modules"
                      :disabled="!isSoftwareEditing(software.id)"
                    >
                    Módulo 3
                  </label>
                  <label class="module-checkbox">
                    <input
                      type="checkbox"
                      value="Posto adicional"
                      v-model="software.modules"
                      :disabled="!isSoftwareEditing(software.id)"
                    >
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
                      <label :for="`n-equipamento-${software.id}`" class="form-label">Nº Equipamento</label>
                      <input
                        type="text"
                        :id="`n-equipamento-${software.id}`"
                        v-model="software.nEquipamento"
                        class="form-input"
                        :disabled="!isSoftwareEditing(software.id)"
                        placeholder="Nº do equipamento"
                      >
                    </div>
                    <div class="form-group">
                      <label :for="`versao-software-${software.id}`" class="form-label">Versão do Software</label>
                      <input
                        type="text"
                        :id="`versao-software-${software.id}`"
                        v-model="software.versaoSoftware"
                        class="form-input"
                        :disabled="!isSoftwareEditing(software.id)"
                        placeholder="Ex: 1.2.3"
                      >
                    </div>
                  </template>

                  <!-- Common Fields (for all except Vectron) -->
                  <template v-else>
                    <div class="form-group">
                      <label :for="`numero-serie-${software.id}`" class="form-label">Número Série</label>
                      <input
                        type="text"
                        :id="`numero-serie-${software.id}`"
                        v-model="software.numeroSerie"
                        class="form-input"
                        :disabled="!isSoftwareEditing(software.id)"
                        placeholder="Nº de série"
                      >
                    </div>
                    <div class="form-group">
                      <label :for="`versao-software-${software.id}`" class="form-label">Versão Software</label>
                      <input
                        type="text"
                        :id="`versao-software-${software.id}`"
                        v-model="software.versaoSoftware"
                        class="form-input"
                        :disabled="!isSoftwareEditing(software.id)"
                        placeholder="Ex: 1.2.3"
                      >
                    </div>
                    <div class="form-group">
                      <label :for="`versao-licenca-${software.id}`" class="form-label">Versão Licença</label>
                      <input
                        type="text"
                        :id="`versao-licenca-${software.id}`"
                        v-model="software.versaoLicenca"
                        class="form-input"
                        :disabled="!isSoftwareEditing(software.id)"
                        placeholder="Versão da licença"
                      >
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

    <!-- Custom sections for client updates -->
    <template #updateSections="{ formData, errors, updateFieldValue }">
      <!-- Audit Information Section (Read-only) -->
      <div class="form-section">
        <div class="bg-white rounded-touch border border-gray-200">
          <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
            <h2 class="text-lg font-semibold text-gray-900">Informação de Auditoria</h2>
            <p class="text-sm text-gray-600 mt-1">Informações sobre criação e modificação (apenas leitura)</p>
          </div>
          <div class="p-4 sm:p-6">
            <div class="audit-info-grid">
              <div class="audit-item">
                <label class="audit-label">Criado em</label>
                <div class="audit-value">{{ formatDateTime(client?.createdAt) }}</div>
              </div>
              <div class="audit-item">
                <label class="audit-label">Criado por</label>
                <div class="audit-value">{{ client?.createdBy || 'Sistema' }}</div>
              </div>
              <div class="audit-item">
                <label class="audit-label">Última atualização</label>
                <div class="audit-value">{{ formatDateTime(client?.updatedAt) }}</div>
              </div>
              <div class="audit-item">
                <label class="audit-label">Atualizado por</label>
                <div class="audit-value">{{ client?.updatedBy || 'Sistema' }}</div>
              </div>
              <div class="audit-item">
                <label class="audit-label">Versão</label>
                <div class="audit-value">{{ client?.version || 1 }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </ContentUpdateTemplate>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Client, ClientData, ClientSoftware } from '@clever/shared';
import { validateClientUpdate } from '@clever/shared';
import ContentUpdateTemplate from '@/components/common/ContentUpdateTemplate.vue';
import type { FormSection } from '@/components/common/types';
import { useApi } from '@/composables/useApi';
import { useErrorHandler } from '@/composables/useErrorHandler';
import { clientsFormSections } from '@/config/clients-form-sections';

// Router
const route = useRoute();
const router = useRouter();

// Composables
const api = useApi<Client>('clients');
const errorHandler = useErrorHandler();

// State
const client = ref<Client | null>(null);
const isLoading = ref(false);
const isSaving = ref(false);
const editingSoftwareId = ref<number | null>(null);
const nextSoftwareId = ref(1000); // Start high to avoid conflicts
const error = ref<string | null>(null);

// Clear error function
const clearError = () => {
  error.value = null;
};

// Fields that should be disabled in update mode
const disabledFields = ['uuid', 'createdAt', 'createdBy', 'version'];

// Fields that should be read-only (shown but not editable)
const readOnlyFields: string[] = [];



// Software management functions
const addSoftware = (formData: any) => {
  if (!formData.softwares) {
    formData.softwares = [];
  }
  
  const newSoftware: ClientSoftware = {
    id: nextSoftwareId.value++,
    name: '' as any,
    modules: []
  };
  
  formData.softwares.push(newSoftware);
  editingSoftwareId.value = newSoftware.id;
};

const isSoftwareEditing = (id: number | string): boolean => {
  return editingSoftwareId.value === Number(id);
};

const editSoftware = (id: number | string) => {
  editingSoftwareId.value = Number(id);
};

const saveSoftware = (id: number | string) => {
  editingSoftwareId.value = null;
};

const cancelEditSoftware = (id: number | string) => {
  editingSoftwareId.value = null;
};

const removeSoftware = (formData: any, index: number) => {
  if (formData.softwares) {
    formData.softwares.splice(index, 1);
  }
};

const onSoftwareChange = (index: number) => {
  // Reset software-specific fields when software type changes
};

const onPixProductChange = (index: number) => {
  // Reset modules when product changes
};

const pixHasModules = (product: string): boolean => {
  const productsWithModules = ['Pix rest', 'Pix Gest', 'Pix POS', 'Pix AutoVenda'];
  return productsWithModules.includes(product);
};

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

// Validation function
const validateUpdateForm = (data: Record<string, any>): Record<string, string> => {
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
      vectronConnect: selectedServices.includes('vectronConnect')
    };
    
    // Prepare partial client data for validation
    const clientData: Partial<ClientData> = {
      nomeEmpresa: data.nomeEmpresa,
      nomeComercial: data.nomeComercial,
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
      softwares: data.softwares,
      ...serviceFlags, // Spread the service boolean flags
      dumpsLink: data.dumpsLink,
      seriesDocumentos: data.seriesDocumentos,
      atUsername: data.atUsername,
      atPassword: data.atPassword,
      vectronAddress: data.vectronAddress,
      observacoes: data.observacoes
    };
    
    // Use shared validation for updates
    const validationErrors = validateClientUpdate(clientData);
    
    // Convert validation errors to form errors
    validationErrors.forEach((errorMessage) => {
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
    errors.general = 'Erro na validação dos dados';
  }
  
  return errors;
};

// Event handlers
const handleUpdate = async (formData: Record<string, any>) => {
  if (!client.value) return;
  
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
      vectronConnect: selectedServices.includes('vectronConnect')
    };
    
    // Prepare the update data (only the fields that changed)
    const updateData: Partial<ClientData> = {
      nomeEmpresa: formData.nomeEmpresa,
      nomeComercial: formData.nomeComercial,
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
      observacoes: formData.observacoes
    };
    
    const response = await api.update(client.value.uuid, { data: updateData } as any);
    
    if (response) {
      // Navigate to the updated client's detail page
      router.push(`/clients/${client.value!.uuid}`);
    } else {
      throw new Error('Erro ao atualizar cliente');
    }
  } catch (err) {
    console.error('Error updating client:', err);
    error.value = err instanceof Error ? err.message : 'Erro ao atualizar cliente';
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = () => {
  if (client.value) {
    router.push(`/clients/${client.value.uuid}`);
  } else {
    router.push('/clients');
  }
};

// Data loading
const loadClient = async () => {
  const clientId = route.params.uuid as string;
  
  if (!clientId) {
    error.value = 'ID do cliente não fornecido';
    return;
  }
  
  try {
    isLoading.value = true;
    clearError();
    
    await api.fetchById(clientId);
    
    if (api.currentItem.value) {
      client.value = api.currentItem.value;
      
      // Ensure softwares array exists and has proper IDs
      if (client.value.data.softwares) {
        client.value.data.softwares.forEach((software, index) => {
          if (!software.id) {
            software.id = nextSoftwareId.value++;
          } else {
            software.id = Number(software.id);
          }
          if (!software.modules) {
            software.modules = [];
          }
        });
        
        // Update next ID to avoid conflicts
        const maxId = Math.max(...client.value.data.softwares.map(s => Number(s.id)));
        nextSoftwareId.value = Math.max(nextSoftwareId.value, maxId + 1);
      } else {
        client.value.data.softwares = [];
      }
      
      // Convert individual service flags to selectedServices array for multiselect
      const selectedServices: string[] = [];
      if (client.value.data.temAnydesk) selectedServices.push('temAnydesk');
      if (client.value.data.manutencao) selectedServices.push('manutencao');
      if (client.value.data.manutencao24) selectedServices.push('manutencao24');
      if (client.value.data.dumps) selectedServices.push('dumps');
      if (client.value.data.atcud) selectedServices.push('atcud');
      if (client.value.data.vectronConnect) selectedServices.push('vectronConnect');
      
      // Add selectedServices to the client data for the form
      client.value.data.selectedServices = selectedServices;
    } else {
      throw new Error('Cliente não encontrado');
    }
  } catch (err) {
    console.error('Error loading client:', err);
    error.value = err instanceof Error ? err.message : 'Erro ao carregar cliente';
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  loadClient();
});
</script>

<style scoped>
/* Software management styling (same as create) */
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

.module-checkbox input[type="checkbox"] {
  @apply rounded border-gray-300 text-primary-600 focus:ring-primary-500;
}

.additional-fields {
  @apply pt-4 border-t border-gray-200;
}

.empty-software-state {
  @apply bg-gray-50 rounded-touch border-2 border-dashed border-gray-300;
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
  @apply text-red-500 ml-1;
  content: '*';
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
  
  .audit-info-grid {
    @apply grid-cols-1;
  }
}

/* Portuguese text optimization */
.software-title,
.section-title,
.form-label,
.audit-label {
  @apply text-portuguese;
}

/* Touch-friendly interactions */
@media (hover: none) {
  .btn-icon-action:active {
    @apply scale-95;
  }
}

/* Update-specific styling */
.audit-info-grid {
  @apply bg-blue-50 border-blue-200;
}

.audit-value {
  @apply text-blue-900;
}
</style>
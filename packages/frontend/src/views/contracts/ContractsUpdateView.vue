<template>
  <ContentFormTemplate
    :form-sections="contractsFormSections"
    :is-loading="isLoading"
    :is-saving="isSaving"
    :error="error"
    :is-editing="true"
    :initial-data="initialData"
    create-title="Editar Contrato"
    subtitle="Modificar dados do contrato existente"
    cancel-route="../"
    :validate-on-submit="true"
    :custom-validator="validateContractUpdate"
    @submit="handleUpdate"
    @cancel="handleCancel"
    @clear-error="clearError"
  >
    <!-- Custom client search field (disabled for updates) -->
    <template #field-clientId="{ formData, errors }">
      <div class="form-field">
        <label class="form-label">Cliente</label>
        <div class="client-display-readonly">
          <div v-if="selectedClient" class="client-card-readonly">
            <div class="client-header">
              <h4 class="client-name">{{ selectedClient.nomeComercial || selectedClient.nomeEmpresa }}</h4>
              <span v-if="selectedClient.contribuinte" class="client-nif">NIF: {{ selectedClient.contribuinte }}</span>
            </div>
            <div v-if="selectedClient.localidade" class="client-location">
              <svg class="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              {{ selectedClient.localidade }}
            </div>
          </div>
          <div v-else-if="contract?.relations?.client && isClientError(contract.relations.client)" class="client-error-readonly">
            <div class="flex items-center p-3 bg-red-50 border border-red-200 rounded-touch">
              <svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <p class="text-sm font-medium text-red-800">Cliente não encontrado</p>
                <p class="text-xs text-red-600">{{ getClientErrorMessage(contract.relations.client) }}</p>
              </div>
            </div>
          </div>
          <div v-else class="client-placeholder">
            <p class="text-sm text-gray-500">Cliente não especificado</p>
          </div>
        </div>
        <p class="form-help text-xs text-gray-500 mt-1">
          O cliente não pode ser alterado durante a edição do contrato.
        </p>
      </div>
    </template>

    <!-- Custom CPA equipments field -->
    <template #field-cpaEquipments="{ formData, errors, updateFieldValue }">
      <div class="form-field">
        <label class="form-label">Equipamentos CPA</label>
        <div class="equipment-manager">
          <!-- Equipment list -->
          <div v-if="cpaEquipments.length > 0" class="equipment-list">
            <div 
              v-for="(equipment, index) in cpaEquipments" 
              :key="equipment.id"
              class="equipment-item"
            >
              <div class="equipment-header">
                <span class="equipment-number">{{ index + 1 }}</span>
                <h4 class="equipment-title">{{ equipment.modelo || 'Equipamento sem modelo' }}</h4>
                <button
                  type="button"
                  @click="removeEquipment(index)"
                  class="btn-icon-danger"
                  :aria-label="'Remover equipamento ' + (index + 1)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
              
              <div v-if="editingEquipment === index" class="equipment-form">
                <div class="form-grid">
                  <div class="form-field">
                    <label class="form-label">Modelo</label>
                    <input
                      v-model="equipmentForm.modelo"
                      type="text"
                      class="form-input"
                      placeholder="Modelo do equipamento"
                    />
                  </div>
                  <div class="form-field">
                    <label class="form-label">Número de Série</label>
                    <input
                      v-model="equipmentForm.numeroSerie"
                      type="text"
                      class="form-input"
                      placeholder="Número de série"
                    />
                  </div>
                  <div class="form-field">
                    <label class="form-label">Desconto (%)</label>
                    <input
                      v-model.number="equipmentForm.desconto"
                      type="number"
                      min="0"
                      max="100"
                      class="form-input"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div class="form-field">
                  <label class="form-label">Observações</label>
                  <textarea
                    v-model="equipmentForm.observacoes"
                    class="form-textarea"
                    rows="2"
                    placeholder="Observações sobre o equipamento..."
                  ></textarea>
                </div>
                <div class="equipment-actions">
                  <button
                    type="button"
                    @click="saveEquipment(index)"
                    class="btn-primary"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    @click="cancelEditEquipment"
                    class="btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
              
              <div v-else class="equipment-display">
                <div class="equipment-details">
                  <div v-if="equipment.numeroSerie" class="equipment-detail">
                    <strong>Série:</strong> {{ equipment.numeroSerie }}
                  </div>
                  <div v-if="equipment.desconto > 0" class="equipment-detail">
                    <strong>Desconto:</strong> {{ equipment.desconto }}%
                  </div>
                  <div v-if="equipment.observacoes" class="equipment-detail">
                    <strong>Observações:</strong> {{ equipment.observacoes }}
                  </div>
                </div>
                <button
                  type="button"
                  @click="editEquipment(index)"
                  class="btn-icon-secondary"
                  :aria-label="'Editar equipamento ' + (index + 1)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Add equipment button -->
          <button
            type="button"
            @click="addEquipment"
            class="btn-secondary w-full"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Adicionar Equipamento
          </button>

          <!-- Equipment validation error -->
          <div v-if="errors.cpaEquipments" class="form-error">{{ errors.cpaEquipments }}</div>
        </div>
      </div>
    </template>
  </ContentFormTemplate>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Contract, ContractUpdateData, ContractEquipment, Client, ContentWithRelations } from '@clever/shared';
import { validateContractUpdate, sanitizeContractData } from '@clever/shared';
import ContentFormTemplate from '@/components/common/ContentFormTemplate.vue';
import { contractsFormSections } from '@/config/contracts-form-sections';
import { useApi } from '@/composables/useApi';
import { useErrorHandler } from '@/composables/useErrorHandler';
import { useSharedFormData } from '@/composables/useSharedFormData';
import { getPlanDetails, type ContractType } from '../../services/planSelection';

// Router
const route = useRoute();
const router = useRouter();

// Composables
const api = useApi<Contract>('contracts');
const errorHandler = useErrorHandler();
const { formData } = useSharedFormData('contracts-update');

// State
const contract = ref<ContentWithRelations<Contract['data']> | null>(null);
const isLoading = ref(false);
const isSaving = ref(false);
const error = ref<string | null>(null);
const selectedClient = ref<Client | null>(null);
const initialData = ref<Record<string, any>>({});

// Equipment management state
const cpaEquipments = ref<ContractEquipment[]>([]);
const editingEquipment = ref<number | null>(null);
const equipmentForm = ref<Partial<ContractEquipment>>({
  id: '',
  modelo: '',
  numeroSerie: '',
  desconto: 0,
  observacoes: ''
});

// Clear error function
const clearError = () => {
  error.value = null;
};

// Watch for CPA equipment changes and update form data
watch(
  cpaEquipments,
  (newEquipments) => {
    // Update the form data with the current equipment list
    if (formData.value) {
      formData.value.cpaEquipments = newEquipments;
    }
  },
  { deep: true }
);

// Helper functions for client relation handling
const isClientError = (clientRelation: any): boolean => {
  return clientRelation && typeof clientRelation === 'object' && 'type' in clientRelation && clientRelation.type === 'error';
};

const isResolvedClient = (clientRelation: any): boolean => {
  return clientRelation && typeof clientRelation === 'object' && 'nomeEmpresa' in clientRelation;
};

const getClientErrorMessage = (clientRelation: any): string => {
  if (clientRelation && typeof clientRelation === 'object' && 'message' in clientRelation) {
    return clientRelation.message;
  }
  return 'Erro desconhecido';
};

// Equipment management functions
const addEquipment = () => {
  const newEquipment: ContractEquipment = {
    id: crypto.randomUUID(),
    modelo: '',
    numeroSerie: '',
    desconto: cpaEquipments.value.length === 0 ? 0 : 10, // First equipment has 0% discount
    observacoes: ''
  };
  
  cpaEquipments.value.push(newEquipment);
  editEquipment(cpaEquipments.value.length - 1);
};

const editEquipment = (index: number) => {
  const equipment = cpaEquipments.value[index];
  equipmentForm.value = { ...equipment };
  editingEquipment.value = index;
};

const saveEquipment = (index: number) => {
  if (equipmentForm.value.modelo?.trim()) {
    cpaEquipments.value[index] = {
      id: equipmentForm.value.id || crypto.randomUUID(),
      modelo: equipmentForm.value.modelo?.trim() || '',
      numeroSerie: equipmentForm.value.numeroSerie?.trim() || '',
      desconto: equipmentForm.value.desconto || 0,
      observacoes: equipmentForm.value.observacoes?.trim() || ''
    };
  }
  
  cancelEditEquipment();
};

const cancelEditEquipment = () => {
  editingEquipment.value = null;
  equipmentForm.value = {
    id: '',
    modelo: '',
    numeroSerie: '',
    desconto: 0,
    observacoes: ''
  };
};

const removeEquipment = (index: number) => {
  cpaEquipments.value.splice(index, 1);
  
  // If we were editing this equipment, cancel the edit
  if (editingEquipment.value === index) {
    cancelEditEquipment();
  } else if (editingEquipment.value !== null && editingEquipment.value > index) {
    // Adjust the editing index if we removed an equipment before it
    editingEquipment.value--;
  }
};

// Contract validation function for updates - updated for display toggle system
const validateContractUpdate = (data: Record<string, any>): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  try {
    // Contract type validation - at least one must be configured
    const hasCPA = data.hasCPAContract;
    const hasSH = data.hasSHContract;
    
    if (!hasCPA && !hasSH) {
      errors.hasCPAContract = 'Por favor, mantenha pelo menos um tipo de contrato (CPA e/ou S&H)';
      errors.hasSHContract = 'Por favor, mantenha pelo menos um tipo de contrato (CPA e/ou S&H)';
    }
    
    // CPA-specific validation (if CPA is configured)
    if (hasCPA) {
      if (!data.cpaContractType) {
        errors.cpaContractType = 'Por favor, selecione o tipo de contrato CPA';
      }
      
      if (!data.planIdCPA) {
        errors.planIdCPA = 'Por favor, selecione um plano CPA';
      }
      
      // Distance is only required for CPA (2023), not CPA_1500
      if (data.cpaContractType === 'CPA' && !data.distanceCPA) {
        errors.distanceCPA = 'Por favor, selecione a distância para contratos CPA (2023)';
      }
      
      if (!data.modalidadePagamentoCPA) {
        errors.modalidadePagamentoCPA = 'Por favor, selecione a modalidade de pagamento CPA';
      }
      
      // Validate CPA equipment
      if (!cpaEquipments.value || cpaEquipments.value.length === 0) {
        errors.cpaEquipments = 'Por favor, mantenha pelo menos um equipamento CPA';
      } else {
        // Validate each equipment
        cpaEquipments.value.forEach((equipment, index) => {
          if (!equipment.modelo?.trim()) {
            errors[`cpaEquipment${index}Model`] = `Por favor, introduza o modelo do equipamento ${index + 1}`;
          }
          
          // First equipment should have 0% discount
          if (index === 0 && equipment.desconto !== 0) {
            errors[`cpaEquipment${index}Discount`] = 'O primeiro equipamento não deve ter desconto aplicado';
          }
          
          // Discount validation for additional equipment
          if (index > 0 && (typeof equipment.desconto !== 'number' || equipment.desconto < 0 || equipment.desconto > 100)) {
            errors[`cpaEquipment${index}Discount`] = `O desconto do equipamento ${index + 1} deve estar entre 0 e 100%`;
          }
        });
      }
      
      // Validate contract dates
      if (!data.inicioContratoCPA) {
        errors.inicioContratoCPA = 'Por favor, selecione a data de início do contrato CPA';
      }
      
      if (!data.fimContratoCPA) {
        errors.fimContratoCPA = 'Por favor, selecione a data de fim do contrato CPA';
      }
      
      // Date range validation
      if (data.inicioContratoCPA && data.fimContratoCPA) {
        const startDate = new Date(data.inicioContratoCPA);
        const endDate = new Date(data.fimContratoCPA);
        if (startDate >= endDate) {
          errors.fimContratoCPA = 'A data de fim deve ser posterior à data de início';
        }
      }
    }
    
    // S&H-specific validation (if S&H is configured)
    if (hasSH) {
      if (!data.planIdSH) {
        errors.planIdSH = 'Por favor, selecione um plano S&H';
      }
      
      if (!data.distanceSH) {
        errors.distanceSH = 'Por favor, selecione a distância para o contrato S&H';
      }
      
      if (!data.modalidadePagamentoSH) {
        errors.modalidadePagamentoSH = 'Por favor, selecione a modalidade de pagamento S&H';
      }
      
      // Validate contract dates
      if (!data.inicioContratoSH) {
        errors.inicioContratoSH = 'Por favor, selecione a data de início do contrato S&H';
      }
      
      if (!data.fimContratoSH) {
        errors.fimContratoSH = 'Por favor, selecione a data de fim do contrato S&H';
      }
      
      // Date range validation
      if (data.inicioContratoSH && data.fimContratoSH) {
        const startDate = new Date(data.inicioContratoSH);
        const endDate = new Date(data.fimContratoSH);
        if (startDate >= endDate) {
          errors.fimContratoSH = 'A data de fim deve ser posterior à data de início';
        }
      }
    }
    
    console.log('Contract update validation completed:', JSON.stringify({
      hasCPA,
      hasSH,
      errorCount: Object.keys(errors).length,
      errors: errors
    }, null, 2));
    
  } catch (err) {
    console.error('Contract update validation error:', JSON.stringify(err, null, 2));
    errors.general = 'Erro na validação do contrato';
  }
  
  return errors;
};

// Plan selection handlers for auto-populating service details
const handleCPAPlanSelection = async (planId: string, contractType: string) => {
  console.log('CPA Plan Selection Handler called with planId:', planId, 'contractType:', contractType);
  
  if (planId && contractType) {
    // Auto-populate service details from plan data
    const planDetails = getPlanDetails(contractType as ContractType, planId);
    console.log('Retrieved CPA plan details:', JSON.stringify(planDetails, null, 2));
    
    if (planDetails && formData.value) {
      // Set maintenance per year (CPA plans have this field)
      if (planDetails.maintenancePerYear !== undefined) {
        console.log('Setting manutencoesPorAnoCPA to:', planDetails.maintenancePerYear);
        formData.value.manutencoesPorAnoCPA = planDetails.maintenancePerYear;
      }
      
      // Set displacements per year (try to extract number from callouts if it's a number)
      if (planDetails.callouts !== undefined) {
        if (typeof planDetails.callouts === 'number') {
          console.log('Setting deslocacoesPorAnoCPA to:', planDetails.callouts);
          formData.value.deslocacoesPorAnoCPA = planDetails.callouts;
        } else if (typeof planDetails.callouts === 'string') {
          // Try to extract number from string like "1 deslocação" or "2 deslocações"
          const match = planDetails.callouts.match(/(\d+)/);
          if (match) {
            const value = parseInt(match[1]);
            console.log('Setting deslocacoesPorAnoCPA to (from string):', value);
            formData.value.deslocacoesPorAnoCPA = value;
          } else {
            // If no number found, set to 0 (unlimited or special case)
            console.log('Setting deslocacoesPorAnoCPA to 0 (no number found in string)');
            formData.value.deslocacoesPorAnoCPA = 0;
          }
        }
      }
      
      // CPA plans don't typically have hours, so set to 0
      console.log('Setting horasAssistenciaAnualCPA to 0');
      formData.value.horasAssistenciaAnualCPA = 0;
      
      console.log('Updated formData after CPA plan selection:', JSON.stringify(formData.value, null, 2));
    }
  }
};

const handleSHPlanSelection = async (planId: string) => {
  console.log('S&H Plan Selection Handler called with planId:', planId);
  
  if (planId) {
    // Auto-populate service details from plan data
    const planDetails = getPlanDetails('S&H', planId);
    console.log('Retrieved S&H plan details:', JSON.stringify(planDetails, null, 2));
    
    if (planDetails && formData.value) {
      // Set hours per year (S&H plans have this field)
      if (planDetails.hoursPerYear !== undefined) {
        console.log('Setting horasAssistenciaAnualSH to:', planDetails.hoursPerYear);
        formData.value.horasAssistenciaAnualSH = planDetails.hoursPerYear;
      }
      
      // Set displacements per year (S&H plans have displacementsIncluded)
      if (planDetails.displacementsIncluded !== undefined) {
        if (typeof planDetails.displacementsIncluded === 'number') {
          console.log('Setting deslocacoesPorAnoSH to:', planDetails.displacementsIncluded);
          formData.value.deslocacoesPorAnoSH = planDetails.displacementsIncluded;
        } else if (typeof planDetails.displacementsIncluded === 'string') {
          // Try to extract number from string
          const match = planDetails.displacementsIncluded.match(/(\d+)/);
          if (match) {
            const value = parseInt(match[1]);
            console.log('Setting deslocacoesPorAnoSH to (from string):', value);
            formData.value.deslocacoesPorAnoSH = value;
          } else {
            console.log('Setting deslocacoesPorAnoSH to 0 (no number found in string)');
            formData.value.deslocacoesPorAnoSH = 0;
          }
        }
      }
      
      // S&H plans don't typically have maintenance, so set to 0
      console.log('Setting manutencoesPorAnoSH to 0');
      formData.value.manutencoesPorAnoSH = 0;
      
      console.log('Updated formData after S&H plan selection:', JSON.stringify(formData.value, null, 2));
    }
  }
};

// Event handlers
const handleUpdate = async (data: Record<string, any>) => {
  const uuid = route.params.uuid as string;
  if (!uuid) {
    error.value = 'ID do contrato não fornecido';
    return;
  }

  try {
    isSaving.value = true;
    clearError();
    
    // Prepare the contract update data with equipment
    const contractUpdateData: Partial<ContractUpdateData> = {
      hasCPAContract: data.hasCPAContract,
      hasSHContract: data.hasSHContract,
      cpaContractType: data.cpaContractType,
      planIdCPA: data.planIdCPA,
      distanceCPA: data.distanceCPA,
      modalidadePagamentoCPA: data.modalidadePagamentoCPA,
      hasPOSPackage: data.hasPOSPackage,
      inicioContratoCPA: data.inicioContratoCPA,
      fimContratoCPA: data.fimContratoCPA,
      horasAssistenciaAnualCPA: data.horasAssistenciaAnualCPA,
      deslocacoesPorAnoCPA: data.deslocacoesPorAnoCPA,
      manutencoesPorAnoCPA: data.manutencoesPorAnoCPA,
      planIdSH: data.planIdSH,
      distanceSH: data.distanceSH,
      modalidadePagamentoSH: data.modalidadePagamentoSH,
      inicioContratoSH: data.inicioContratoSH,
      fimContratoSH: data.fimContratoSH,
      horasAssistenciaAnualSH: data.horasAssistenciaAnualSH,
      deslocacoesPorAnoSH: data.deslocacoesPorAnoSH,
      manutencoesPorAnoSH: data.manutencoesPorAnoSH,
      metodoPagamento: data.metodoPagamento,
      cpaEquipments: cpaEquipments.value,
      shEquipments: shEquipments.value
    };
    
    console.log('Updating contract with data:', JSON.stringify(contractUpdateData, null, 2));
    
    await api.update(uuid, contractUpdateData);
    
    if (api.item.value) {
      console.log('Contract updated successfully:', JSON.stringify(api.item.value, null, 2));
      router.push(`/contracts/${uuid}`);
    } else {
      throw new Error('Erro ao atualizar contrato');
    }
  } catch (err) {
    console.error('Error updating contract:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao atualizar contrato';
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = () => {
  const uuid = route.params.uuid as string;
  router.push(`/contracts/${uuid}`);
};

// Data loading
const loadContract = async () => {
  const uuid = route.params.uuid as string;
  if (!uuid) {
    error.value = 'ID do contrato não fornecido';
    return;
  }

  try {
    isLoading.value = true;
    clearError();
    
    await api.fetchById(uuid);
    
    if (api.item.value) {
      contract.value = api.item.value as ContentWithRelations<Contract['data']>;
      
      // Set up initial data for the form
      const data = contract.value.data;
      initialData.value = {
        clientId: data.clientId,
        hasCPAContract: data.hasCPAContract,
        hasSHContract: data.hasSHContract,
        cpaContractType: data.cpaContractType,
        planIdCPA: data.planIdCPA,
        distanceCPA: data.distanceCPA,
        modalidadePagamentoCPA: data.modalidadePagamentoCPA,
        hasPOSPackage: data.hasPOSPackage,
        inicioContratoCPA: data.inicioContratoCPA,
        fimContratoCPA: data.fimContratoCPA,
        horasAssistenciaAnualCPA: data.horasAssistenciaAnualCPA || 0,
        deslocacoesPorAnoCPA: data.deslocacoesPorAnoCPA || 0,
        manutencoesPorAnoCPA: data.manutencoesPorAnoCPA || 0,
        planIdSH: data.planIdSH,
        distanceSH: data.distanceSH,
        modalidadePagamentoSH: data.modalidadePagamentoSH,
        inicioContratoSH: data.inicioContratoSH,
        fimContratoSH: data.fimContratoSH,
        horasAssistenciaAnualSH: data.horasAssistenciaAnualSH || 0,
        deslocacoesPorAnoSH: data.deslocacoesPorAnoSH || 0,
        manutencoesPorAnoSH: data.manutencoesPorAnoSH || 0,
        metodoPagamento: data.metodoPagamento
      };
      
      // Set up equipment data
      if (data.cpaEquipments && data.cpaEquipments.length > 0) {
        cpaEquipments.value = [...data.cpaEquipments];
      }
      
      // Set up client data from relations
      if (contract.value.relations?.client && isResolvedClient(contract.value.relations.client)) {
        selectedClient.value = contract.value.relations.client as Client;
      }
      
    } else {
      throw new Error('Contrato não encontrado');
    }
  } catch (err) {
    console.error('Error loading contract:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao carregar contrato';
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  loadContract();
});
</script>

<style scoped>
/* Contract update-specific styling */
.client-display-readonly {
  @apply mt-2;
}

.client-card-readonly {
  @apply bg-gray-50 border border-gray-200 rounded-touch p-3;
}

.client-error-readonly {
  @apply mb-4;
}

.client-placeholder {
  @apply bg-gray-50 border border-gray-200 rounded-touch p-3;
}

.client-header {
  @apply flex items-center justify-between mb-1;
}

.client-name {
  @apply font-medium text-gray-900;
}

.client-nif {
  @apply text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded;
}

.client-location {
  @apply flex items-center text-sm text-gray-700;
}

/* Equipment manager styling */
.equipment-manager {
  @apply space-y-4;
}

.equipment-list {
  @apply space-y-3;
}

.equipment-item {
  @apply bg-gray-50 border border-gray-200 rounded-touch p-4;
}

.equipment-header {
  @apply flex items-center justify-between mb-3;
}

.equipment-number {
  @apply inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full;
}

.equipment-title {
  @apply flex-1 font-medium text-gray-900 mx-3;
}

.equipment-form {
  @apply space-y-4;
}

.equipment-actions {
  @apply flex space-x-2 pt-3 border-t border-gray-200;
}

.equipment-display {
  @apply flex items-start justify-between;
}

.equipment-details {
  @apply flex-1 space-y-1 text-sm text-gray-600;
}

.equipment-detail {
  @apply flex items-center;
}

/* Form grid for equipment form */
.form-grid {
  @apply grid grid-cols-1 gap-4;
}

@media (min-width: 640px) {
  .form-grid {
    @apply grid-cols-3;
  }
}

/* Button styling */
.btn-icon-danger {
  @apply p-2 text-red-400 hover:text-red-600 rounded-touch hover:bg-red-50 transition-colors duration-200 touch-target;
}

.btn-icon-secondary {
  @apply p-2 text-gray-400 hover:text-gray-600 rounded-touch hover:bg-gray-100 transition-colors duration-200 touch-target;
}

/* Portuguese text optimization */
.client-card-readonly,
.client-error-readonly,
.client-placeholder,
.equipment-item {
  @apply text-portuguese;
}

/* Mobile-first responsive adjustments */
@media (max-width: 640px) {
  .equipment-number {
    @apply w-5 h-5 text-xs;
  }
  
  .equipment-header {
    @apply flex-col items-start space-y-2;
  }
  
  .equipment-title {
    @apply mx-0;
  }
  
  .equipment-actions {
    @apply flex-col space-x-0 space-y-2;
  }
}

/* Touch-friendly interactions */
@media (hover: none) {
  .btn-icon-danger:active {
    @apply bg-red-100;
  }
  
  .btn-icon-secondary:active {
    @apply bg-gray-200;
  }
}
</style>
<template>
  <ContentFormTemplate
    :form-sections="modifiedFormSections"
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
    <!-- Custom client ID field (read-only for updates) -->
    <template #field-clientId="{ formData, error, updateFieldValue }">
      <ClientSearchInput
        :model-value="formData?.clientId || ''"
        :placeholder="'Cliente selecionado'"
        :disabled="false"
        :readonly="true"
        :has-error="!!error"
        :selected-client="selectedClient"
        @update:model-value="(value) => updateFieldValue('clientId', value)"
        @client-selected="handleClientSelected"
      />
      <p v-if="error" class="form-error text-red-600 text-sm mt-1">{{ error }}</p>
      <p class="form-help text-xs text-gray-500 mt-1">
        <svg class="w-4 h-4 text-gray-400 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        O cliente não pode ser alterado durante a edição do contrato.
      </p>
    </template>

    <!-- Custom contract types field with display toggle system -->
    <template #field-contractTypes="{ formData, updateFieldValue }">
      <div v-if="formData" class="contract-types-wrapper">
        <div class="contract-types-section">
          <div class="section-header">
            <h2>PLANOS DE CONTRATO</h2>
            <div class="info-note">
              <span class="info-icon">ℹ️</span>
              <span>O cliente pode ter um ou ambos os tipos de contrato (CPA e/ou S&H)</span>
            </div>
          </div>
          
          <!-- CPA Contract Type Section -->
          <div class="contract-type-section">
            <!-- CPA Display Toggle -->
            <DisplayToggleSwitch
              title="CPA - CASHLOGY"
              :is-active="showCPASection"
              @toggle="handleCPADisplayToggle"
            />
            
            <!-- CPA Configuration (appears directly below CPA toggle when enabled) -->
            <Transition name="section-slide" mode="out-in">
              <CPAContractSection
                v-if="showCPASection"
                :form-data="formData || {}"
                :cpa-equipments="cpaEquipments"
                :selected-plan-details="selectedCPAPlanDetails"
                :is-loading-plan="isLoadingCPAPlan"
                @update-field="updateFieldValue"
                @equipment-updated="handleEquipmentUpdate"
                @plan-selected="handleCPAPlanSelection"
              />
            </Transition>
          </div>
          
          <!-- S&H Contract Type Section -->
          <div class="contract-type-section">
            <!-- S&H Display Toggle -->
            <DisplayToggleSwitch
              title="S&H - SOFTWARE E HARDWARE"
              :is-active="showSHSection"
              @toggle="handleSHDisplayToggle"
            />
            
            <!-- S&H Configuration (appears directly below S&H toggle when enabled) -->
            <Transition name="section-slide" mode="out-in">
              <SHContractSection
                v-if="showSHSection"
                :form-data="formData || {}"
                :sh-equipments="shEquipments"
                :selected-plan-details="selectedSHPlanDetails"
                :is-loading-plan="isLoadingSHPlan"
                @update-field="updateFieldValue"
                @plan-selected="handleSHPlanSelection"
                @equipment-updated="handleSHEquipmentUpdate"
              />
            </Transition>
          </div>
        </div>
      </div>
    </template>

    <!-- Custom payment method field -->
    <template #field-metodoPagamento="{ formData, error, updateFieldValue }">
      <div class="form-field">
        <label class="form-label required">Método de Pagamento</label>
        <select 
          :value="formData?.metodoPagamento || ''"
          @change="(e) => updateFieldValue('metodoPagamento', (e.target as HTMLSelectElement).value)"
          class="form-select"
          :class="{ 'error': !!error }"
        >
          <option value="">Selecione o método...</option>
          <option value="TRANSFERENCIA_BANCARIA">Transferência Bancária</option>
          <option value="DEBITO_DIRETO">Débito Direto</option>
          <option value="MULTIBANCO">Multibanco</option>
          <option value="CHEQUE">Cheque</option>
          <option value="NUMERARIO">Numerário</option>
          <option value="MB_WAY">MB WAY</option>
        </select>
        <div v-if="error" class="form-error">{{ error }}</div>
        <p class="form-help text-xs text-gray-500 mt-1">
          Método de pagamento aplicável a ambos os tipos de contrato (CPA e S&H).
        </p>
      </div>
    </template>
  </ContentFormTemplate>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount, shallowRef, markRaw } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Contract, ContractUpdateData, ContractEquipment, Client, ContentWithRelations } from '@clever/shared';

interface SHEquipment {
  id: string
  modelo: string
  numeroSerie: string
  software: string
  observacoes: string
}

import { validateContractUpdate as validateContractUpdateShared, sanitizeContractData } from '@clever/shared';
import ContentFormTemplate from '@/components/common/ContentFormTemplate.vue';
import ClientSearchInput from '@/components/common/ClientSearchInput.vue';
import DisplayToggleSwitch from '@/components/contracts/DisplayToggleSwitch.vue';
import CPAContractSection from '@/components/contracts/CPAContractSection.vue';
import SHContractSection from '@/components/contracts/SHContractSection.vue';
import { contractsFormSections } from '@/config/contracts-form-sections';
import { getPlanDetails, type ContractType } from '../../services/planSelection';

// Create modified form sections with readonly clientId field
const modifiedFormSections = computed(() => {
  return contractsFormSections.map(section => ({
    ...section,
    fields: section.fields.map(field => {
      if (field.key === 'clientId') {
        return {
          ...field,
          readonly: true
        };
      }
      return field;
    })
  }));
});
import { useApi } from '@/composables/useApi';
import { useErrorHandler } from '@/composables/useErrorHandler';
import { useSharedFormData } from '@/composables/useSharedFormData';
import { usePerformanceOptimizations } from '@/composables/usePerformanceOptimizations';

// Router
const route = useRoute();
const router = useRouter();

// Composables
const api = useApi<Contract>('contracts');
const errorHandler = useErrorHandler();
const { formData, updateFieldValue: originalUpdateFieldValue } = useSharedFormData('content-form');
const { createDebounced, createCache } = usePerformanceOptimizations();

// Update field value function
const updateFieldValue = (field: string, value: any) => {
  // Call original function
  originalUpdateFieldValue(field, value);
};

// State
const contract = ref<ContentWithRelations<Contract['data']> | null>(null);
const isLoading = ref(false);
const isSaving = ref(false);
const error = ref<string | null>(null);
const selectedClient = shallowRef<Client | null>(null); // Use shallowRef for better performance
const initialData = ref<Record<string, any>>({});

// Display toggle state - both can be active simultaneously
const showCPASection = ref(false);
const showSHSection = ref(false);

// Plan loading states
const isLoadingCPAPlan = ref(false);
const isLoadingSHPlan = ref(false);

// Plan details cache for performance optimization
const planDetailsCache = createCache<string, any>();

// Equipment management state (for CPA equipment managed by CPAEquipmentManager)
const cpaEquipments = ref<ContractEquipment[]>([]);

// S&H equipment management state
const shEquipments = ref<SHEquipment[]>([]);

// Cleanup tracking
const cleanupFunctions: (() => void)[] = [];

// Plan details computed properties with memoization
const selectedCPAPlanDetails = computed(() => {
  if (!formData.value?.planIdCPA || !formData.value?.cpaContractType) {
    return null;
  }
  
  const cacheKey = `${formData.value.cpaContractType}-${formData.value.planIdCPA}`;
  
  // Check cache first for performance
  if (planDetailsCache.has(cacheKey)) {
    return planDetailsCache.get(cacheKey);
  }
  
  try {
    const contractType = formData.value.cpaContractType as ContractType;
    const planDetails = getPlanDetails(contractType, formData.value.planIdCPA);
    
    // Cache the result for future use
    if (planDetails) {
      planDetailsCache.set(cacheKey, markRaw(planDetails)); // Use markRaw to prevent deep reactivity
    }
    
    return planDetails;
  } catch (error) {
    console.error('Error getting CPA plan details:', JSON.stringify(error, null, 2));
    return null;
  }
});

const selectedSHPlanDetails = computed(() => {
  if (!formData.value?.planIdSH) {
    return null;
  }
  
  const cacheKey = `SH-${formData.value.planIdSH}`;
  
  // Check cache first for performance
  if (planDetailsCache.has(cacheKey)) {
    return planDetailsCache.get(cacheKey);
  }
  
  try {
    const planDetails = getPlanDetails('S&H', formData.value.planIdSH);
    
    if (planDetails) {
      planDetailsCache.set(cacheKey, markRaw(planDetails)); // Use markRaw to prevent deep reactivity
    }
    
    return planDetails;
  } catch (error) {
    console.error('Error getting S&H plan details:', JSON.stringify(error, null, 2));
    return null;
  }
});

// Debounced update function for better performance
const debouncedUpdateField = createDebounced((field: string, value: any) => {
  updateFieldValue(field, value);
}, 300);

// Optimized plan loading functions with proper error handling and caching
const loadCPAPlanDetails = async (planId: string, contractType: string) => {
  if (!planId || !contractType) return null;
  
  const cacheKey = `${contractType}-${planId}`;
  
  // Return cached result if available
  if (planDetailsCache.has(cacheKey)) {
    return planDetailsCache.get(cacheKey);
  }
  
  try {
    isLoadingCPAPlan.value = true;
    
    // Simulate async loading with shorter delay for better UX
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const planDetails = getPlanDetails(contractType as ContractType, planId);
    
    if (planDetails) {
      planDetailsCache.set(cacheKey, markRaw(planDetails));
    }
    
    return planDetails;
  } catch (error) {
    console.error('Error loading CPA plan details:', JSON.stringify(error, null, 2));
    return null;
  } finally {
    isLoadingCPAPlan.value = false;
  }
};

const loadSHPlanDetails = async (planId: string) => {
  if (!planId) return null;
  
  const cacheKey = `SH-${planId}`;
  
  // Return cached result if available
  if (planDetailsCache.has(cacheKey)) {
    return planDetailsCache.get(cacheKey);
  }
  
  try {
    isLoadingSHPlan.value = true;
    
    // Simulate async loading with shorter delay for better UX
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const planDetails = getPlanDetails('S&H', planId);
    
    if (planDetails) {
      planDetailsCache.set(cacheKey, markRaw(planDetails));
    }
    
    return planDetails;
  } catch (error) {
    console.error('Error loading S&H plan details:', JSON.stringify(error, null, 2));
    return null;
  } finally {
    isLoadingSHPlan.value = false;
  }
};

// Clear error function
const clearError = () => {
  error.value = null;
};

// Client selection handler (for read-only mode)
const handleClientSelected = (client: Client | null) => {
  // In update mode, client selection should not change the clientId
  // This handler is mainly for consistency with the component interface
};

// Display toggle handlers - both sections can be active simultaneously
const handleCPADisplayToggle = (active: boolean) => {
  showCPASection.value = active;
  
  if (active) {
    // Initialize CPA data if it doesn't exist
    if (!formData.value.hasCPAContract) {
      updateFieldValue('hasCPAContract', true);
      initializeCPAData();
    }
  } else {
    // When hiding CPA section, mark as not having CPA contract
    updateFieldValue('hasCPAContract', false);
    // Clear CPA-specific validation errors when section is hidden
    clearCPAValidationErrors();
  }
};

const handleSHDisplayToggle = (active: boolean) => {
  showSHSection.value = active;
  
  if (active) {
    // Initialize S&H data if it doesn't exist
    if (!formData.value.hasSHContract) {
      updateFieldValue('hasSHContract', true);
      initializeSHData();
    }
  } else {
    // When hiding S&H section, mark as not having S&H contract
    updateFieldValue('hasSHContract', false);
    // Clear S&H-specific validation errors when section is hidden
    clearSHValidationErrors();
  }
};

// Helper functions to clear validation errors when sections are hidden
const clearCPAValidationErrors = () => {
  // Clear CPA-specific errors from the error state if they exist
  const fieldsToClean = [
    'cpaContractType', 'planIdCPA', 'distanceCPA', 'modalidadePagamentoCPA',
    'inicioContratoCPA', 'fimContratoCPA', 'cpaEquipments'
  ];
  
  fieldsToClean.forEach(field => {
    if (error.value && error.value.includes(field)) {
      // This is a simple approach - in a more complex app you'd have structured error handling
    }
  });
};

const clearSHValidationErrors = () => {
  // Clear S&H-specific errors from the error state if they exist
  const fieldsToClean = [
    'planIdSH', 'distanceSH', 'modalidadePagamentoSH',
    'inicioContratoSH', 'fimContratoSH', 'shEquipments'
  ];
  
  fieldsToClean.forEach(field => {
    if (error.value && error.value.includes(field)) {
      // This is a simple approach - in a more complex app you'd have structured error handling
    }
  });
};

// Data initialization functions (preserve existing data)
const initializeCPAData = () => {
  // Initialize CPA-specific fields with default values if they don't exist
  if (!formData.value.cpaContractType) {
    updateFieldValue('cpaContractType', '')
  }
  if (!formData.value.planIdCPA) {
    updateFieldValue('planIdCPA', '')
  }
  if (!formData.value.distanceCPA) {
    updateFieldValue('distanceCPA', '')
  }
  if (!formData.value.modalidadePagamentoCPA) {
    updateFieldValue('modalidadePagamentoCPA', '')
  }
  if (!formData.value.inicioContratoCPA) {
    updateFieldValue('inicioContratoCPA', '')
  }
  if (!formData.value.fimContratoCPA) {
    updateFieldValue('fimContratoCPA', '')
  }
  if (formData.value.hasPOSPackage === undefined) {
    updateFieldValue('hasPOSPackage', false)
  }
  
  // Initialize equipment array if empty
  if (cpaEquipments.value.length === 0) {
    const newEquipment: ContractEquipment = {
      id: crypto.randomUUID(),
      modelo: '',
      numeroSerie: '',
      desconto: 0, // First equipment has 0% discount
      observacoes: ''
    };
    cpaEquipments.value.push(newEquipment);
  }
}

const initializeSHData = () => {
  // Initialize S&H-specific fields with default values if they don't exist
  if (!formData.value.planIdSH) {
    updateFieldValue('planIdSH', '')
  }
  if (!formData.value.distanceSH) {
    updateFieldValue('distanceSH', '')
  }
  if (!formData.value.modalidadePagamentoSH) {
    updateFieldValue('modalidadePagamentoSH', '')
  }
  if (!formData.value.inicioContratoSH) {
    updateFieldValue('inicioContratoSH', '')
  }
  if (!formData.value.fimContratoSH) {
    updateFieldValue('fimContratoSH', '')
  }
  
  // Initialize S&H equipment array if empty
  if (shEquipments.value.length === 0) {
    const newEquipment: SHEquipment = {
      id: crypto.randomUUID(),
      modelo: '',
      numeroSerie: '',
      software: '',
      observacoes: ''
    };
    shEquipments.value.push(newEquipment);
  }
}

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

// Watch for S&H equipment changes and update form data
watch(
  shEquipments,
  (newEquipments) => {
    // Update the form data with the current equipment list
    if (formData.value) {
      formData.value.shEquipments = newEquipments;
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

// Plan selection handlers with loading states
const handleCPAPlanSelection = async (planId: string) => {
  updateFieldValue('planIdCPA', planId);
  
  if (planId && formData.value?.cpaContractType) {
    await loadCPAPlanDetails(planId, formData.value.cpaContractType);
    
    // Auto-populate service details from plan data
    const planDetails = getPlanDetails(formData.value.cpaContractType as ContractType, planId);
    
    if (planDetails) {
      // Set maintenance per year (CPA plans have this field)
      if (planDetails.maintenancePerYear !== undefined) {
        updateFieldValue('manutencoesPorAnoCPA', planDetails.maintenancePerYear);
      }
      
      // Set displacements per year (try to extract number from callouts if it's a number)
      if (planDetails.callouts !== undefined) {
        if (typeof planDetails.callouts === 'number') {
          updateFieldValue('deslocacoesPorAnoCPA', planDetails.callouts);
        } else if (typeof planDetails.callouts === 'string') {
          // Try to extract number from string like "1 deslocação" or "2 deslocações"
          const match = planDetails.callouts.match(/(\d+)/);
          if (match) {
            const value = parseInt(match[1]);
            updateFieldValue('deslocacoesPorAnoCPA', value);
          } else {
            // If no number found, check if it's unlimited (contains "sem limite" or "unlimited")
            if (planDetails.callouts.toLowerCase().includes('sem limite') || 
                planDetails.callouts.toLowerCase().includes('unlimited')) {
              updateFieldValue('deslocacoesPorAnoCPA', -1); // -1 represents unlimited
            } else {
              updateFieldValue('deslocacoesPorAnoCPA', 0);
            }
          }
        }
      }
      
      // CPA plans don't typically have hours, so set to 0
      updateFieldValue('horasAssistenciaAnualCPA', 0);
    }
  }
};

const handleSHPlanSelection = async (planId: string) => {
  updateFieldValue('planIdSH', planId);
  
  if (planId) {
    await loadSHPlanDetails(planId);
    
    // Auto-populate service details from plan data
    const planDetails = getPlanDetails('S&H', planId);
    
    if (planDetails) {
      // Set hours per year (S&H plans have this field)
      if (planDetails.hoursPerYear !== undefined) {
        updateFieldValue('horasAssistenciaAnualSH', planDetails.hoursPerYear);
      }
      
      // Set displacements per year (S&H plans have displacementsIncluded)
      if (planDetails.displacementsIncluded !== undefined) {
        if (typeof planDetails.displacementsIncluded === 'number') {
          updateFieldValue('deslocacoesPorAnoSH', planDetails.displacementsIncluded);
        } else if (typeof planDetails.displacementsIncluded === 'string') {
          // Try to extract number from string
          const match = planDetails.displacementsIncluded.match(/(\d+)/);
          if (match) {
            const value = parseInt(match[1]);
            updateFieldValue('deslocacoesPorAnoSH', value);
          } else {
            // If no number found, check if it's unlimited (contains "sem limite" or "unlimited")
            if (planDetails.displacementsIncluded.toLowerCase().includes('sem limite') || 
                planDetails.displacementsIncluded.toLowerCase().includes('unlimited')) {
              updateFieldValue('deslocacoesPorAnoSH', -1); // -1 represents unlimited
            } else {
              updateFieldValue('deslocacoesPorAnoSH', 0);
            }
          }
        }
      }
      
      // S&H plans don't typically have maintenance, so set to 0
      updateFieldValue('manutencoesPorAnoSH', 0);
    }
  }
};

// Equipment update handler for the new system
const handleEquipmentUpdate = (data: { action: string, index?: number, equipment?: ContractEquipment }) => {
  switch (data.action) {
    case 'add':
      if (data.equipment) {
        cpaEquipments.value.push(data.equipment)
      }
      break
    case 'update':
      if (data.index !== undefined && data.equipment) {
        cpaEquipments.value[data.index] = data.equipment
      }
      break
    case 'remove':
      if (data.index !== undefined) {
        cpaEquipments.value.splice(data.index, 1)
      }
      break
  }
}

// S&H equipment update handler
const handleSHEquipmentUpdate = (data: { action: string, index?: number, equipment?: SHEquipment }) => {
  switch (data.action) {
    case 'add':
      if (data.equipment) {
        shEquipments.value.push(data.equipment)
      }
      break
    case 'update':
      if (data.index !== undefined && data.equipment) {
        shEquipments.value[data.index] = data.equipment
      }
      break
    case 'remove':
      if (data.index !== undefined) {
        shEquipments.value.splice(data.index, 1)
      }
      break
  }
}

// Watch for CPA contract type changes to reload plan details with debouncing
const stopCPAContractTypeWatcher = watch(
  () => formData.value?.cpaContractType,
  async (newContractType) => {
    if (newContractType && formData.value?.planIdCPA) {
      await loadCPAPlanDetails(formData.value.planIdCPA, newContractType);
    }
  }
);
cleanupFunctions.push(stopCPAContractTypeWatcher);

// Watch for CPA plan changes to clear POS package if not applicable
const stopCPAPlanWatcher = watch(
  [() => formData.value?.cpaContractType, () => formData.value?.planIdCPA],
  ([contractType, planId]) => {
    // Clear POS package if not CPA_1500 PREMIUM
    if (contractType !== 'CPA_1500' || planId !== 'cpa_1500_premium') {
      if (formData.value?.hasPOSPackage) {
        updateFieldValue('hasPOSPackage', false)
      }
    }
  }
);
cleanupFunctions.push(stopCPAPlanWatcher);

// Watch for CPA equipment changes and update form data immediately
const stopCPAEquipmentWatcher = watch(
  cpaEquipments,
  (newEquipments) => {
    // Update immediately without debouncing for form submission
    updateFieldValue('cpaEquipments', newEquipments);
  },
  { deep: true }
);
cleanupFunctions.push(stopCPAEquipmentWatcher);

// Watch for S&H equipment changes and update form data immediately
const stopSHEquipmentWatcher = watch(
  shEquipments,
  (newEquipments) => {
    // Update immediately without debouncing for form submission
    updateFieldValue('shEquipments', newEquipments);
  },
  { deep: true }
);
cleanupFunctions.push(stopSHEquipmentWatcher);

// Watch for form data changes to initialize equipment array
const stopCPAInitWatcher = watch(
  () => formData.value?.hasCPAContract,
  (hasCPA) => {
    if (hasCPA && cpaEquipments.value.length === 0) {
      // Initialize with one empty equipment when CPA is enabled
      const newEquipment: ContractEquipment = {
        id: crypto.randomUUID(),
        modelo: '',
        numeroSerie: '',
        desconto: 0, // First equipment has 0% discount
        observacoes: ''
      };
      cpaEquipments.value.push(newEquipment);
    }
  }
);
cleanupFunctions.push(stopCPAInitWatcher);

// Watch for S&H form data changes to initialize equipment array
const stopSHInitWatcher = watch(
  () => formData.value?.hasSHContract,
  (hasSH) => {
    if (hasSH && shEquipments.value.length === 0) {
      // Initialize with one empty equipment when S&H is enabled
      const newEquipment: SHEquipment = {
        id: crypto.randomUUID(),
        modelo: '',
        numeroSerie: '',
        software: '',
        observacoes: ''
      };
      shEquipments.value.push(newEquipment);
    }
  }
);
cleanupFunctions.push(stopSHInitWatcher);

// Watch for display section changes and persist to form data
const stopCPADisplayWatcher = watch(
  showCPASection,
  (showCPA) => {
    updateFieldValue('showCPASection', showCPA)
  }
);
cleanupFunctions.push(stopCPADisplayWatcher);

const stopSHDisplayWatcher = watch(
  showSHSection,
  (showSH) => {
    updateFieldValue('showSHSection', showSH)
  }
);
cleanupFunctions.push(stopSHDisplayWatcher);

// Watch for form data changes to restore display section state
const stopCPADisplayRestoreWatcher = watch(
  () => formData.value?.showCPASection,
  (savedShowCPA) => {
    if (savedShowCPA !== undefined && savedShowCPA !== showCPASection.value) {
      showCPASection.value = savedShowCPA
    }
  },
  { immediate: true }
);
cleanupFunctions.push(stopCPADisplayRestoreWatcher);

const stopSHDisplayRestoreWatcher = watch(
  () => formData.value?.showSHSection,
  (savedShowSH) => {
    if (savedShowSH !== undefined && savedShowSH !== showSHSection.value) {
      showSHSection.value = savedShowSH
    }
  },
  { immediate: true }
);
cleanupFunctions.push(stopSHDisplayRestoreWatcher);

// Watch for form data changes to ensure display sections match configured contracts
const stopDisplaySectionMatchWatcher = watch(
  [() => formData.value?.hasCPAContract, () => formData.value?.hasSHContract],
  ([hasCPA, hasSH]) => {
    // Auto-show sections when contracts are configured
    if (hasCPA && !showCPASection.value) {
      showCPASection.value = true
    }
    if (hasSH && !showSHSection.value) {
      showSHSection.value = true
    }
    
    // Auto-hide sections when contracts are not configured (optional)
    // For now, we'll allow users to manually control display
  },
  { immediate: true }
);
cleanupFunctions.push(stopDisplaySectionMatchWatcher);

// Component cleanup
onBeforeUnmount(() => {
  // Clear plan details cache
  planDetailsCache.clear();
  
  // Run all cleanup functions
  cleanupFunctions.forEach(cleanup => cleanup());
  cleanupFunctions.length = 0;
});

// Contract validation function for updates - updated for display toggle system
const validateContractUpdate = (data: Record<string, any>): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  try {
    // Contract type validation - at least one must be configured
    const hasCPA = data.hasCPAContract;
    const hasSH = data.hasSHContract;
    
    if (!hasCPA && !hasSH) {
      errors.contractTypes = 'Por favor, mantenha pelo menos um tipo de contrato (CPA ou S&H)';
    }
    
    // Payment method validation (required if any contract is configured)
    if ((hasCPA || hasSH) && !data.metodoPagamento) {
      errors.metodoPagamento = 'Por favor, selecione um método de pagamento';
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
      
      // Validate CPA equipment from form data
      const cpaEquipmentsData = data.cpaEquipments || cpaEquipments.value;
      if (!cpaEquipmentsData || cpaEquipmentsData.length === 0) {
        errors.cpaEquipments = 'Por favor, mantenha pelo menos um equipamento CPA';
      } else {
        // Validate each equipment
        cpaEquipmentsData.forEach((equipment: any, index: number) => {
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
      
      // Validate S&H equipment from form data
      const shEquipmentsData = data.shEquipments || shEquipments.value;
      if (!shEquipmentsData || shEquipmentsData.length === 0) {
        errors.shEquipments = 'Por favor, mantenha pelo menos um equipamento S&H';
      } else {
        // Validate each S&H equipment
        shEquipmentsData.forEach((equipment: any, index: number) => {
          if (!equipment.modelo?.trim()) {
            errors[`shEquipment${index}Model`] = `Por favor, introduza o modelo do equipamento S&H ${index + 1}`;
          }
        });
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
    
  } catch (err) {
    console.error('Contract validation error:', err);
    errors.general = 'Erro na validação do contrato';
  }
  
  return errors;
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
    
    // Use formData.value instead of data parameter to get the most up-to-date values
    // including those set by plan selection handlers
    const currentFormData = formData.value || {};
    
    // Prepare the contract update data with equipment and client ID
    const contractUpdateData: Partial<Contract['data']> = {
      // Always include the client ID (read-only field)
      clientId: contract.value?.data?.clientId || currentFormData.clientId || data.clientId,
      hasCPAContract: currentFormData.hasCPAContract || data.hasCPAContract || false,
      hasSHContract: currentFormData.hasSHContract || data.hasSHContract || false,
      cpaContractType: currentFormData.cpaContractType || data.cpaContractType || '',
      planIdCPA: currentFormData.planIdCPA || data.planIdCPA || '',
      distanceCPA: currentFormData.distanceCPA || data.distanceCPA || '',
      modalidadePagamentoCPA: currentFormData.modalidadePagamentoCPA || data.modalidadePagamentoCPA || '',
      hasPOSPackage: currentFormData.hasPOSPackage || data.hasPOSPackage || false,
      inicioContratoCPA: currentFormData.inicioContratoCPA || data.inicioContratoCPA || '',
      fimContratoCPA: currentFormData.fimContratoCPA || data.fimContratoCPA || '',
      // Use the values from formData which should have been set by plan selection handlers
      horasAssistenciaAnualCPA: currentFormData.horasAssistenciaAnualCPA ?? data.horasAssistenciaAnualCPA ?? 0,
      deslocacoesPorAnoCPA: currentFormData.deslocacoesPorAnoCPA ?? data.deslocacoesPorAnoCPA ?? 0,
      manutencoesPorAnoCPA: currentFormData.manutencoesPorAnoCPA ?? data.manutencoesPorAnoCPA ?? 0,
      planIdSH: currentFormData.planIdSH || data.planIdSH || '',
      distanceSH: currentFormData.distanceSH || data.distanceSH || '',
      modalidadePagamentoSH: currentFormData.modalidadePagamentoSH || data.modalidadePagamentoSH || '',
      inicioContratoSH: currentFormData.inicioContratoSH || data.inicioContratoSH || '',
      fimContratoSH: currentFormData.fimContratoSH || data.fimContratoSH || '',
      // Use the values from formData which should have been set by plan selection handlers
      horasAssistenciaAnualSH: currentFormData.horasAssistenciaAnualSH ?? data.horasAssistenciaAnualSH ?? 0,
      deslocacoesPorAnoSH: currentFormData.deslocacoesPorAnoSH ?? data.deslocacoesPorAnoSH ?? 0,
      manutencoesPorAnoSH: currentFormData.manutencoesPorAnoSH ?? data.manutencoesPorAnoSH ?? 0,
      metodoPagamento: currentFormData.metodoPagamento || data.metodoPagamento || '',
      // Use equipment data from form data instead of local arrays
      cpaEquipments: currentFormData.cpaEquipments || data.cpaEquipments || [],
      shEquipments: currentFormData.shEquipments || data.shEquipments || []
    };
    
    const result = await api.update(uuid, { data: contractUpdateData } as any);
    
    // Check if API returned an error
    if (api.error.value) {
      console.error('API returned error:', api.error.value);
      error.value = typeof api.error.value === 'string' 
        ? api.error.value 
        : api.error.value.message || 'Erro ao atualizar contrato';
      return;
    }
    
    if (result) {
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
    
    if (api.currentItem.value) {
      contract.value = api.currentItem.value as ContentWithRelations<Contract['data']>;
      
      // Set up initial data for the form
      const data = contract.value.data;
      const contractData = {
        clientId: data.clientId || '',
        hasCPAContract: data.hasCPAContract || false,
        hasSHContract: data.hasSHContract || false,
        cpaContractType: data.cpaContractType || '',
        planIdCPA: data.planIdCPA || '',
        distanceCPA: data.distanceCPA || '',
        modalidadePagamentoCPA: data.modalidadePagamentoCPA || '',
        hasPOSPackage: data.hasPOSPackage || false,
        inicioContratoCPA: data.inicioContratoCPA || '',
        fimContratoCPA: data.fimContratoCPA || '',
        horasAssistenciaAnualCPA: data.horasAssistenciaAnualCPA || 0,
        deslocacoesPorAnoCPA: data.deslocacoesPorAnoCPA || 0,
        manutencoesPorAnoCPA: data.manutencoesPorAnoCPA || 0,
        planIdSH: data.planIdSH || '',
        distanceSH: data.distanceSH || '',
        modalidadePagamentoSH: data.modalidadePagamentoSH || '',
        inicioContratoSH: data.inicioContratoSH || '',
        fimContratoSH: data.fimContratoSH || '',
        horasAssistenciaAnualSH: data.horasAssistenciaAnualSH || 0,
        deslocacoesPorAnoSH: data.deslocacoesPorAnoSH || 0,
        manutencoesPorAnoSH: data.manutencoesPorAnoSH || 0,
        metodoPagamento: data.metodoPagamento || ''
      };
      
      // Set initial data for the template
      initialData.value = contractData;
      
      // Clear and reinitialize form data to ensure proper reactivity
      if (formData.value) {
        Object.keys(formData.value).forEach(key => {
          delete formData.value[key];
        });
      }
      
      // Use updateFieldValue to properly set each field in the shared form data
      Object.entries(contractData).forEach(([key, value]) => {
        updateFieldValue(key, value);
      });
      
      // Set up equipment data
      if (data.cpaEquipments && data.cpaEquipments.length > 0) {
        cpaEquipments.value = [...data.cpaEquipments];
        updateFieldValue('cpaEquipments', [...data.cpaEquipments]);
      } else {
        cpaEquipments.value = [];
        updateFieldValue('cpaEquipments', []);
      }
      
      if (data.shEquipments && data.shEquipments.length > 0) {
        shEquipments.value = [...data.shEquipments];
        updateFieldValue('shEquipments', [...data.shEquipments]);
      } else {
        shEquipments.value = [];
        updateFieldValue('shEquipments', []);
      }
      
      // Set up display toggle states based on existing contract configuration
      if (data.hasCPAContract) {
        showCPASection.value = true;
        updateFieldValue('showCPASection', true);
      }
      
      if (data.hasSHContract) {
        showSHSection.value = true;
        updateFieldValue('showSHSection', true);
      }
      
      // Set up client data from relations
      if (contract.value.relations?.client && isResolvedClient(contract.value.relations.client)) {
        selectedClient.value = contract.value.relations.client as Client;
      } else if (data.clientId) {
        // If client is not in relations but we have a clientId, try to load it separately
        try {
          const clientsApi = useApi<Client>('clients');
          await clientsApi.fetchById(data.clientId);
          if (clientsApi.currentItem.value) {
            selectedClient.value = clientsApi.currentItem.value;
          }
        } catch (clientError) {
          console.error('Error loading client separately:', JSON.stringify(clientError, null, 2));
        }
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
.contract-types-wrapper {
  @apply w-full;
}

.contract-types-section {
  @apply bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200;
}

.section-header {
  @apply mb-6;
}

.section-header h2 {
  @apply text-xl font-semibold text-gray-800 mb-2;
}

.info-note {
  @apply flex items-center gap-2 text-gray-600 text-sm;
}

.info-icon {
  @apply text-blue-500;
}

.contract-type-section {
  @apply mb-6 border border-gray-200 rounded-lg overflow-hidden bg-white;
}

.contract-type-section .display-toggle-container {
  @apply mb-0;
}

.contract-type-section .toggle-item {
  @apply rounded-none border-0 border-b border-gray-200 mb-0;
}

.contract-type-section .toggle-item:last-child {
  @apply border-b-0;
}

/* Contract section content styling */
.contract-type-section .cpa-contract-section,
.contract-type-section .sh-contract-section {
  @apply p-6 bg-gray-50;
}

/* Section transition animations */
.section-slide-enter-active,
.section-slide-leave-active {
  transition: all 0.3s ease-in-out;
  transform-origin: top;
}

.section-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px) scaleY(0.95);
  max-height: 0;
  overflow: hidden;
}

.section-slide-enter-to {
  opacity: 1;
  transform: translateY(0) scaleY(1);
  max-height: 1000px;
}

.section-slide-leave-from {
  opacity: 1;
  transform: translateY(0) scaleY(1);
  max-height: 1000px;
}

.section-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px) scaleY(0.95);
  max-height: 0;
  overflow: hidden;
}

/* Reduced motion support for transitions */
@media (prefers-reduced-motion: reduce) {
  .section-slide-enter-active,
  .section-slide-leave-active {
    transition: opacity 0.2s ease;
  }
  
  .section-slide-enter-from,
  .section-slide-leave-to {
    transform: none;
    max-height: auto;
  }
}

.client-display-readonly {
  @apply mt-2;
}

.client-card-readonly {
  @apply bg-gray-50 border border-gray-200 rounded-touch p-3 relative;
}

.client-card-readonly::before {
  content: '';
  @apply absolute top-2 right-2 w-4 h-4 bg-gray-300 rounded-full;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'/%3e%3c/svg%3e");
  background-size: 12px 12px;
  background-position: center;
  background-repeat: no-repeat;
}

.client-error-readonly {
  @apply mb-4;
}

.client-placeholder {
  @apply bg-gray-50 border border-gray-200 rounded-touch p-3 text-center;
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

/* Payment method field styling */
.form-select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500;
}

.form-select.error {
  @apply border-red-500 focus:ring-red-500 focus:border-red-500;
}

.form-error {
  @apply text-red-600 text-sm mt-1;
}

/* Portuguese text optimization */
.client-card-readonly,
.client-error-readonly,
.client-placeholder {
  @apply text-portuguese;
}

/* Mobile-first responsive adjustments */
@media (max-width: 640px) {
  .client-header {
    @apply flex-col items-start space-y-2;
  }
}

/* Touch-friendly interactions */
@media (hover: none) {
  .form-select:active {
    @apply bg-gray-50;
  }
}
</style>
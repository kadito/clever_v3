<template>
  <ContentCreateTemplate
    content-type="contracts"
    create-title="Criar Contrato"
    subtitle="Adicionar um novo contrato ao sistema"
    cancel-route="/contracts"
    :form-sections="contractsFormSections"
    :is-loading="isLoading"
    :is-saving="isSaving"
    :error="error"
    :custom-validator="validateContractCreate"
    @create="handleCreate"
    @cancel="handleCancel"
    @clear-error="clearError"
  >
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
                :form-data="formData"
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
                :form-data="formData"
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
    
    <!-- Custom client ID field -->
    <template #field-clientId="{ formData, error, updateFieldValue }">
      <div class="form-field">
        <label class="form-label required">Cliente</label>
        <ClientSearchInput
          :model-value="formData?.clientId"
          placeholder="Pesquisar cliente..."
          :has-error="!!error"
          @update:model-value="updateFieldValue('clientId', $event)"
          @client-selected="handleClientSelected"
        />
        <div v-if="error" class="form-error">{{ error }}</div>
      </div>
    </template>

    <!-- Custom payment method field -->
    <template #field-metodoPagamento="{ formData, error, updateFieldValue }">
      <div class="form-field">
        <label class="form-label required">Método de Pagamento</label>
        <select 
          :value="formData?.metodoPagamento"
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
      </div>
    </template>
  </ContentCreateTemplate>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, shallowRef, markRaw } from 'vue';
import { useRouter } from 'vue-router';
import type { ContractCreationData, ContractEquipment, Client } from '@clever/shared';

interface SHEquipment {
  id: string
  modelo: string
  numeroSerie: string
  software: string
  observacoes: string
}
import { validateContractCreation, sanitizeContractData } from '@clever/shared';
import ContentCreateTemplate from '@/components/common/ContentCreateTemplate.vue';
import ClientSearchInput from '@/components/common/ClientSearchInput.vue';
import DisplayToggleSwitch from '@/components/contracts/DisplayToggleSwitch.vue';
import CPAContractSection from '@/components/contracts/CPAContractSection.vue';
import SHContractSection from '@/components/contracts/SHContractSection.vue';
import { contractsFormSections } from '@/config/contracts-form-sections';
import { getPlanDetails, type ContractType } from '../../services/planSelection'
import { useApi } from '@/composables/useApi';
import { useErrorHandler } from '@/composables/useErrorHandler';
import { useSharedFormData } from '@/composables/useSharedFormData';
import { usePerformanceOptimizations } from '@/composables/usePerformanceOptimizations';

// Router
const router = useRouter();

// Composables
const api = useApi('contracts');
const errorHandler = useErrorHandler();
const { formData, updateFieldValue: originalUpdateFieldValue } = useSharedFormData('contracts-create');
const { createDebounced, createCache } = usePerformanceOptimizations();

// Update field value function
const updateFieldValue = (field: string, value: any) => {
  // Call original function
  originalUpdateFieldValue(field, value);
};

// State
const isLoading = ref(false);
const isSaving = ref(false);
const error = ref<string | null>(null);
const selectedClient = shallowRef<Client | null>(null); // Use shallowRef for better performance

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

// Display toggle handlers - both sections can be active simultaneously
const handleCPADisplayToggle = (active: boolean) => {
  console.log('CPA toggle changed:', active);
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
  console.log('S&H toggle changed:', active);
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
      console.log(`Clearing CPA validation error for field: ${field}`);
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
      console.log(`Clearing S&H validation error for field: ${field}`);
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

// Plan selection handlers with loading states
const handleCPAPlanSelection = async (planId: string) => {
  updateFieldValue('planIdCPA', planId);
  
  if (planId && formData.value?.cpaContractType) {
    await loadCPAPlanDetails(planId, formData.value.cpaContractType);
  }
};

const handleSHPlanSelection = async (planId: string) => {
  updateFieldValue('planIdSH', planId);
  
  if (planId) {
    await loadSHPlanDetails(planId);
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

// Equipment management is now handled by CPAEquipmentManager component

// Client selection handler
const handleClientSelected = (client: Client | null) => {
  selectedClient.value = client;
  // Note: We no longer store clienteName as we're removing client information fields
  // Client data will be resolved through relations in the detail view
};

// Pricing functions - removed as they're now handled by DynamicPlanDetails component

// Payment method selection - removed as they're now handled by DynamicPlanDetails component

// Contract validation function - updated for display toggle system
const validateContractCreate = (data: Record<string, any>): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  try {
    // Client validation
    if (!data.clientId) {
      errors.clientId = 'Por favor, selecione um cliente';
    }
    
    // Contract type validation - at least one must be configured
    const hasCPA = data.hasCPAContract;
    const hasSH = data.hasSHContract;
    
    if (!hasCPA && !hasSH) {
      errors.contractTypes = 'Por favor, configure pelo menos um tipo de contrato (CPA ou S&H)';
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
        errors.cpaEquipments = 'Por favor, adicione pelo menos um equipamento CPA';
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
        errors.shEquipments = 'Por favor, adicione pelo menos um equipamento S&H';
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
const handleCreate = async (data: Record<string, any>) => {
  console.log('ContractsCreateView handleCreate called');
  console.log('Received data:', JSON.stringify(data, null, 2));
  console.log('CPA Equipments:', JSON.stringify(cpaEquipments.value, null, 2));
  console.log('S&H Equipments:', JSON.stringify(shEquipments.value, null, 2));
  
  try {
    isSaving.value = true;
    clearError();
    
    // Prepare the contract data with equipment
    const contractData: ContractCreationData = {
      clientId: data.clientId,
      hasCPAContract: data.hasCPAContract || false,
      hasSHContract: data.hasSHContract || false,
      cpaContractType: data.cpaContractType || '',
      planIdCPA: data.planIdCPA || '',
      planoCPA: data.planoCPA || '',
      distanceCPA: data.distanceCPA || '',
      modalidadePagamentoCPA: data.modalidadePagamentoCPA || '',
      hasPOSPackage: data.hasPOSPackage || false,
      inicioContratoCPA: data.inicioContratoCPA || '',
      fimContratoCPA: data.fimContratoCPA || '',
      planIdSH: data.planIdSH || '',
      planoSH: data.planoSH || '',
      distanceSH: data.distanceSH || '',
      modalidadePagamentoSH: data.modalidadePagamentoSH || '',
      inicioContratoSH: data.inicioContratoSH || '',
      fimContratoSH: data.fimContratoSH || '',
      horasAssistenciaAnual: data.horasAssistenciaAnual || 0,
      deslocacoesPorAno: data.deslocacoesPorAno || 0,
      manutencoesPorAno: data.manutencoesPorAno || 0,
      metodoPagamento: data.metodoPagamento || '',
      cpaEquipments: cpaEquipments.value,
      shEquipments: shEquipments.value
    };
    
    console.log('Prepared contract data:', JSON.stringify(contractData, null, 2));
    console.log('Calling API create...');
    
    const result = await api.create(contractData);
    
    console.log('API create completed');
    console.log('API result:', JSON.stringify(result, null, 2));
    console.log('API error:', JSON.stringify(api.error.value, null, 2));
    
    // Check if API returned an error
    if (api.error.value) {
      console.error('API returned error:', api.error.value);
      error.value = typeof api.error.value === 'string' 
        ? api.error.value 
        : api.error.value.message || 'Erro ao criar contrato';
      return;
    }
    
    if (api.currentItem?.value) {
      console.log('Navigating to contract detail:', api.currentItem.value.uuid);
      router.push(`/contracts/${api.currentItem.value.uuid}`);
    } else if (result) {
      // If api.currentItem is not set but we have a result, use that
      console.log('Using result directly:', result);
      const uuid = result.uuid || result.data?.uuid;
      if (uuid) {
        console.log('Navigating to contract detail from result:', uuid);
        router.push(`/contracts/${uuid}`);
      } else {
        throw new Error('Erro ao criar contrato - UUID não encontrado');
      }
    } else {
      throw new Error('Erro ao criar contrato');
    }
  } catch (err) {
    console.error('Error creating contract:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao criar contrato';
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = () => {
  router.push('/contracts');
};
</script>

<style scoped>
/* Contract create-specific styling */
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

.contract-sections {
  @apply space-y-6;
}

.active-contract-section {
  @apply mt-6 pt-6 border-t border-gray-200;
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
</style>
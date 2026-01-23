<template>
  <div class="contract-search-wrapper">
    <!-- Search Input with Dropdown -->
    <div class="relative">
      <input
        type="text"
        v-model="searchQuery"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        class="form-input pr-10"
        :class="{
          'bg-gray-100 cursor-not-allowed': disabled || readonly,
          'border-red-300': hasError,
        }"
        @input="onSearchInput"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeyDown"
      />

      <!-- Search Icon -->
      <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <svg
          v-if="isLoading"
          class="animate-spin h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <svg
          v-else
          class="h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <!-- Dropdown Results -->
      <div v-if="!readonly && !disabled && showDropdown" class="search-dropdown">
        <!-- Loading State -->
        <div v-if="isLoading" class="search-option loading">
          <div class="flex items-center">
            <svg class="animate-spin h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span class="text-gray-600">Pesquisando contratos...</span>
          </div>
        </div>

        <!-- No Client Selected -->
        <div v-else-if="!clientId" class="search-option instruction">
          <div class="flex items-center justify-center py-2">
            <svg
              class="h-5 w-5 text-gray-400 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span class="text-gray-500">Selecione um cliente primeiro</span>
          </div>
        </div>

        <!-- No Results -->
        <div
          v-else-if="searchQuery && searchQuery.length >= 1 && searchResults.length === 0"
          class="search-option no-results"
        >
          <div class="flex items-center justify-center py-2">
            <svg
              class="h-5 w-5 text-gray-400 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span class="text-gray-500">Nenhum contrato encontrado para este cliente</span>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="!searchQuery && searchResults.length === 0 && !isLoading"
          class="search-option instruction"
        >
          <div class="flex items-center justify-center py-2">
            <svg
              class="h-5 w-5 text-gray-400 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span class="text-gray-500">Digite para pesquisar contratos</span>
          </div>
        </div>

        <!-- Results -->
        <div
          v-else
          v-for="contract in searchResults"
          :key="contract.uuid"
          class="search-option"
          @click="selectContract(contract)"
        >
          <div class="contract-info">
            <div class="contract-name">{{ getContractDisplayName(contract) }}</div>
            <div class="contract-details">
              <span v-if="contract.relations?.client && !isRelationError(contract.relations.client)" class="detail">
                {{ contract.relations.client.nomeEmpresa }}
              </span>
              <span class="detail">{{ getContractDates(contract) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Contract Info (when readonly) -->
    <div v-if="selectedContract && (readonly || disabled)" class="selected-contract-info">
      <div class="contract-card">
        <div class="contract-header">
          <h3 class="contract-title">{{ getContractDisplayName(selectedContract) }}</h3>
        </div>
        <div class="contract-details-grid">
          <div class="detail-item">
            <span class="detail-label">Período:</span>
            <span class="detail-value">{{ getContractDates(selectedContract) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Contract Info (when not readonly/disabled - for forms) -->
    <div v-if="selectedContract && !readonly && !disabled" class="selected-contract-info">
      <div class="bg-white rounded-touch border border-gray-200 mt-4">
        <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
          <h3 class="text-lg font-semibold text-gray-900">Informação do Contrato</h3>
        </div>
        <div class="p-4 sm:p-6">
          <div class="detail-grid">
            <div class="detail-item">
              <label class="detail-label">Tipo</label>
              <div class="detail-value">{{ getContractDisplayName(selectedContract) }}</div>
            </div>
            <div class="detail-item">
              <label class="detail-label">Período</label>
              <div class="detail-value">{{ getContractDates(selectedContract) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useApi } from '@/composables/useApi';
import { isRelationError } from '@clever/shared';
import type { Contract } from '@clever/shared';
import contractPlansConfig from '@/config/contract-plans.json';

// Props
interface Props {
  modelValue?: string; // contractId
  clientId?: string; // Required to filter contracts
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  hasError?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Pesquisar contrato...',
  disabled: false,
  readonly: false,
  hasError: false,
});

// Emits
interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'contractSelected', contract: Contract | null): void;
}

const emit = defineEmits<Emits>();

// Composables
const contractsApi = useApi<Contract>('contracts');

// State
const searchQuery = ref('');
const searchResults = ref<Contract[]>([]);
const selectedContract = ref<Contract | null>(null);
const isLoading = ref(false);
const showDropdown = ref(false);
const searchTimeout = ref<number | null>(null);

// Helper functions
const getPlanName = (contractType: string, planId: string): string => {
  const plans = (contractPlansConfig as any)[contractType]?.plans || [];
  const plan = plans.find((p: any) => p.id === planId);
  return plan?.name || planId;
};

const getContractDisplayName = (contract: Contract): string => {
  const contractParts: string[] = [];
  
  if (contract.data?.hasCPAContract) {
    const cpaType = contract.data.cpaContractType === 'CPA_1500' ? 'CPA 1500' : 'CPA 2023';
    const planName = getPlanName(contract.data.cpaContractType, contract.data.planIdCPA);
    contractParts.push(`${cpaType} - ${planName}`);
  }
  
  if (contract.data?.hasSHContract) {
    const planName = getPlanName('S&H', contract.data.planIdSH);
    contractParts.push(`S&H - ${planName}`);
  }
  
  return contractParts.join(' | ') || 'Contrato';
};

const getContractDates = (contract: Contract): string => {
  if (contract.data?.hasCPAContract && contract.data.inicioContratoCPA) {
    const inicio = new Date(contract.data.inicioContratoCPA).toLocaleDateString('pt-PT');
    const fim = new Date(contract.data.fimContratoCPA).toLocaleDateString('pt-PT');
    return `${inicio} - ${fim}`;
  }
  
  if (contract.data?.hasSHContract && contract.data.inicioContratoSH) {
    const inicio = new Date(contract.data.inicioContratoSH).toLocaleDateString('pt-PT');
    const fim = new Date(contract.data.fimContratoSH).toLocaleDateString('pt-PT');
    return `${inicio} - ${fim}`;
  }
  
  return '';
};

// Methods
const searchContracts = async (query: string) => {
  // Build search parameters
  const searchParams: any = { limit: 10 };
  
  // Filter by client ID if provided
  if (props.clientId) {
    searchParams.clientId = props.clientId;
  }
  
  // Add search query if provided
  if (query && query.length >= 1) {
    searchParams.search = query;
  }
  
  await contractsApi
    .fetchList(searchParams)
    .then(() => {
      if (contractsApi.items.value) {
        // Filter contracts by clientId on frontend
        searchResults.value = contractsApi.items.value.filter(
          contract => !props.clientId || contract.data.clientId === props.clientId
        );
      } else {
        searchResults.value = [];
      }
    })
    .catch(error => {
      console.error('Error searching contracts:', JSON.stringify(error, null, 2));
      searchResults.value = [];
    })
    .finally(() => {
      isLoading.value = false;
    });
};

const onSearchInput = () => {
  if (props.readonly || props.disabled) {
    return;
  }

  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  if (!searchQuery.value || searchQuery.value.trim() === '') {
    selectedContract.value = null;
    emit('update:modelValue', '');
    emit('contractSelected', null);

    if (showDropdown.value && props.clientId) {
      isLoading.value = true;
      searchTimeout.value = setTimeout(() => {
        searchContracts('');
      }, 100);
    } else {
      searchResults.value = [];
      isLoading.value = false;
    }
    return;
  }

  isLoading.value = true;

  searchTimeout.value = setTimeout(() => {
    searchContracts(searchQuery.value);
  }, 300);
};

const onFocus = () => {
  if (!props.readonly && !props.disabled) {
    showDropdown.value = true;

    if (props.clientId) {
      isLoading.value = true;
      if (searchQuery.value && searchQuery.value.length >= 1) {
        searchContracts(searchQuery.value);
      } else {
        searchContracts('');
      }
    }
  }
};

const onBlur = () => {
  setTimeout(() => {
    showDropdown.value = false;
  }, 200);
};

const onKeyDown = (event: KeyboardEvent) => {
  if (props.readonly || props.disabled) {
    event.preventDefault();
    return false;
  }
};

const selectContract = (contract: Contract) => {
  if (props.readonly || props.disabled) {
    return;
  }

  selectedContract.value = contract;
  searchQuery.value = getContractDisplayName(contract);
  showDropdown.value = false;

  emit('update:modelValue', contract.uuid);
  emit('contractSelected', contract);
};

const loadContractById = async (contractId: string) => {
  if (!contractId) {
    selectedContract.value = null;
    searchQuery.value = '';
    return;
  }

  try {
    await contractsApi.fetchById(contractId);

    if (contractsApi.currentItem.value) {
      selectedContract.value = contractsApi.currentItem.value;
      searchQuery.value = getContractDisplayName(contractsApi.currentItem.value);
      emit('contractSelected', contractsApi.currentItem.value);
    }
  } catch (error) {
    console.error('Error loading contract:', JSON.stringify(error, null, 2));
    selectedContract.value = null;
    searchQuery.value = '';
  }
};

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  newContractId => {
    if (newContractId && newContractId !== selectedContract.value?.uuid) {
      loadContractById(newContractId);
    } else if (!newContractId) {
      selectedContract.value = null;
      if (!props.readonly) {
        searchQuery.value = '';
      }
    }
  },
  { immediate: true }
);

// Watch for readonly prop changes
watch(
  () => props.readonly,
  isReadonly => {
    if (isReadonly) {
      showDropdown.value = false;
      if (searchTimeout.value) {
        clearTimeout(searchTimeout.value);
        searchTimeout.value = null;
      }
      isLoading.value = false;
    }
  }
);

// Click outside to close dropdown
const handleClickOutside = (event: Event) => {
  const target = event.target as Element;
  if (!target.closest('.contract-search-wrapper')) {
    showDropdown.value = false;
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
});
</script>

<style scoped>
.contract-search-wrapper {
  @apply w-full;
  position: relative;
  z-index: 1;
}

.contract-search-wrapper .relative {
  z-index: 2;
}

.search-dropdown {
  @apply absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-touch shadow-xl max-h-60 overflow-y-auto;
  z-index: 99999 !important;
  box-shadow:
    0 10px 25px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.search-option {
  @apply px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0;
}

.search-option.loading,
.search-option.no-results,
.search-option.instruction {
  @apply text-gray-500 cursor-default hover:bg-transparent;
}

.contract-info {
  @apply space-y-1;
}

.contract-name {
  @apply font-medium text-gray-900;
}

.contract-details {
  @apply flex flex-wrap gap-2 text-sm text-gray-600;
}

.detail {
  @apply bg-gray-100 px-2 py-1 rounded text-xs;
}

.selected-contract-info {
  @apply mt-3;
}

.contract-card {
  @apply bg-blue-50 border border-blue-200 rounded-touch p-4;
}

.contract-header {
  @apply flex items-center justify-between mb-3;
}

.contract-title {
  @apply text-lg font-semibold text-blue-900;
}

.contract-details-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-2;
}

.detail-item {
  @apply flex flex-col space-y-1;
}

.detail-label {
  @apply text-xs font-medium text-gray-500 uppercase tracking-wide;
}

.detail-value {
  @apply text-sm text-gray-900 font-medium;
}

.detail-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-4;
}

.form-input {
  @apply block w-full rounded-touch border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500;
}

.form-input:disabled {
  @apply bg-gray-100 text-gray-500 cursor-not-allowed;
}

@media (max-width: 640px) {
  .contract-details {
    @apply flex-col gap-1;
  }

  .contract-header {
    @apply flex-col items-start space-y-2;
  }

  .contract-details-grid {
    @apply grid-cols-1;
  }
}
</style>

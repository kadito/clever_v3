<template>
  <div class="client-search-wrapper">
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
          'border-red-300': hasError 
        }"
        @input="onSearchInput"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeyDown"
      >
      
      <!-- Search Icon -->
      <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <svg v-if="isLoading" class="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </div>

      <!-- Dropdown Results - positioned relative to this input container -->
      <div 
        v-if="!readonly && !disabled && showDropdown"
        class="search-dropdown"
      >
        <!-- Loading State -->
        <div v-if="isLoading" class="search-option loading">
          <div class="flex items-center">
            <svg class="animate-spin h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-gray-600">Pesquisando clientes...</span>
          </div>
        </div>

        <!-- No Results -->
        <div v-else-if="searchQuery && searchQuery.length >= 1 && searchResults.length === 0" class="search-option no-results">
          <div class="flex items-center justify-center py-2">
            <svg class="h-5 w-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span class="text-gray-500">Nenhum cliente encontrado</span>
          </div>
        </div>

        <!-- Empty state when no query and no results -->
        <div v-else-if="!searchQuery && searchResults.length === 0 && !isLoading" class="search-option instruction">
          <div class="flex items-center justify-center py-2">
            <svg class="h-5 w-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span class="text-gray-500">Digite para pesquisar clientes</span>
          </div>
        </div>

        <!-- Results -->
        <div 
          v-else
          v-for="client in searchResults" 
          :key="client.uuid"
          class="search-option"
          @click="selectClient(client)"
        >
          <div class="client-info">
            <div class="client-name">{{ client.data.nomeEmpresa }}</div>
            <div class="client-details">
              <span v-if="client.data.nomeComercial" class="detail">{{ client.data.nomeComercial }}</span>
              <span v-if="client.data.contribuinte" class="detail">NIF: {{ client.data.contribuinte }}</span>
              <span v-if="client.data.localidade" class="detail">{{ client.data.localidade }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Client Info (when readonly) -->
    <div v-if="selectedClient && (readonly || disabled)" class="selected-client-info">
      <div class="client-card">
        <div class="client-header">
          <h3 class="client-title">{{ selectedClient.data.nomeEmpresa }}</h3>
          <span v-if="selectedClient.data.contribuinte" class="client-nif">NIF: {{ selectedClient.data.contribuinte }}</span>
        </div>
        <div class="client-details-grid">
          <div v-if="selectedClient.data.nomeComercial" class="detail-item">
            <span class="detail-label">Nome Comercial:</span>
            <span class="detail-value">{{ selectedClient.data.nomeComercial }}</span>
          </div>
          <div v-if="selectedClient.data.localidade" class="detail-item">
            <span class="detail-label">Localidade:</span>
            <span class="detail-value">{{ selectedClient.data.localidade }}</span>
          </div>
          <div v-if="selectedClient.data.telefoneContato" class="detail-item">
            <span class="detail-label">Telefone:</span>
            <span class="detail-value">{{ selectedClient.data.telefoneContato }}</span>
          </div>
          <div v-if="selectedClient.data.emailContato" class="detail-item">
            <span class="detail-label">Email:</span>
            <span class="detail-value">{{ selectedClient.data.emailContato }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Client Info (when not readonly/disabled - for forms) -->
    <div v-if="selectedClient && !readonly && !disabled" class="selected-client-info">
      <div class="bg-white rounded-touch border border-gray-200 mt-4">
        <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
          <h3 class="text-lg font-semibold text-gray-900">Informação do Cliente</h3>
        </div>
        <div class="p-4 sm:p-6">
          <div class="detail-grid">
            <div class="detail-item">
              <label class="detail-label">Nome da Empresa</label>
              <div class="detail-value">{{ selectedClient.data.nomeEmpresa || '-' }}</div>
            </div>
            <div v-if="selectedClient.data.nomeComercial" class="detail-item">
              <label class="detail-label">Nome Comercial</label>
              <div class="detail-value">{{ selectedClient.data.nomeComercial }}</div>
            </div>
            <div v-if="selectedClient.data.contribuinte" class="detail-item">
              <label class="detail-label">NIF</label>
              <div class="detail-value font-mono">{{ selectedClient.data.contribuinte }}</div>
            </div>
            <div v-if="selectedClient.data.localidade" class="detail-item">
              <label class="detail-label">Localidade</label>
              <div class="detail-value">{{ selectedClient.data.localidade }}</div>
            </div>
            <div v-if="selectedClient.data.telefoneContato" class="detail-item">
              <label class="detail-label">Telefone</label>
              <div class="detail-value">{{ selectedClient.data.telefoneContato }}</div>
            </div>
            <div v-if="selectedClient.data.emailContato" class="detail-item">
              <label class="detail-label">Email</label>
              <div class="detail-value">{{ selectedClient.data.emailContato }}</div>
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
import type { Client } from '@clever/shared';

// Props
interface Props {
  modelValue?: string; // clientId
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  hasError?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Pesquisar cliente...',
  disabled: false,
  readonly: false,
  hasError: false
});

// Emits
interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'clientSelected', client: Client | null): void;
}

const emit = defineEmits<Emits>();

// Composables
const clientsApi = useApi<Client>('clients');

// State
const searchQuery = ref('');
const searchResults = ref<Client[]>([]);
const selectedClient = ref<Client | null>(null);
const isLoading = ref(false);
const showDropdown = ref(false);
const searchTimeout = ref<number | null>(null);

// Computed properties would go here if needed

// Methods
const searchClients = async (query: string) => {
  // Always make the API call, but use search parameter only if query has 1+ characters
  // This ensures we always get results, even when deleting characters
  const searchParams = query && query.length >= 1 
    ? { search: query, limit: 10 }
    : { limit: 10 }; // No search parameter = get recent clients

  await clientsApi.fetchList(searchParams)
    .then(() => {
      if (clientsApi.items.value) {
        searchResults.value = clientsApi.items.value;
      } else {
        searchResults.value = [];
      }
    })
    .catch((error) => {
      console.error('Error searching clients:', JSON.stringify(error, null, 2));
      searchResults.value = [];
    })
    .finally(() => {
      isLoading.value = false;
    });
};

const onSearchInput = () => {
  // Prevent search input when readonly or disabled
  if (props.readonly || props.disabled) {
    return;
  }

  // Clear previous timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  // If the search query is completely empty, clear the selection but keep dropdown open if focused
  if (!searchQuery.value || searchQuery.value.trim() === '') {
    selectedClient.value = null;
    emit('update:modelValue', '');
    emit('clientSelected', null);
    
    // If dropdown is open (user is focused), show recent clients
    if (showDropdown.value) {
      isLoading.value = true;
      searchTimeout.value = setTimeout(() => {
        searchClients(''); // Empty query = recent clients
      }, 100); // Shorter delay for empty query
    } else {
      searchResults.value = [];
      isLoading.value = false;
    }
    return;
  }

  // Always show loading and trigger search for any non-empty query
  isLoading.value = true;

  // Debounce search with 300ms delay
  searchTimeout.value = setTimeout(() => {
    searchClients(searchQuery.value);
  }, 300);
};

const onFocus = () => {
  if (!props.readonly && !props.disabled) {
    showDropdown.value = true;
    
    // Always make a search request on focus to show recent clients
    // If there's an existing query with 1+ characters, search with it
    // Otherwise, search without query to get recent clients
    isLoading.value = true;
    if (searchQuery.value && searchQuery.value.length >= 1) {
      searchClients(searchQuery.value);
    } else {
      searchClients(''); // Empty query = recent clients
    }
  }
};

const onBlur = () => {
  // Delay hiding dropdown to allow for clicks
  setTimeout(() => {
    showDropdown.value = false;
  }, 200);
};

const onKeyDown = (event: KeyboardEvent) => {
  // Prevent all keyboard input when readonly or disabled
  if (props.readonly || props.disabled) {
    event.preventDefault();
    return false;
  }
};

const selectClient = (client: Client) => {
  // Prevent selection when readonly or disabled
  if (props.readonly || props.disabled) {
    return;
  }
  
  selectedClient.value = client;
  searchQuery.value = client.data.nomeEmpresa;
  showDropdown.value = false;
  
  // Emit the clientId and client object
  emit('update:modelValue', client.uuid);
  emit('clientSelected', client);
};

const loadClientById = async (clientId: string) => {
  if (!clientId) {
    selectedClient.value = null;
    searchQuery.value = '';
    return;
  }

  try {
    await clientsApi.fetchById(clientId);
    
    if (clientsApi.currentItem.value) {
      selectedClient.value = clientsApi.currentItem.value;
      searchQuery.value = clientsApi.currentItem.value.data.nomeEmpresa;
      emit('clientSelected', clientsApi.currentItem.value);
    }
  } catch (error) {
    console.error('Error loading client:', error);
    selectedClient.value = null;
    searchQuery.value = '';
  }
};

// Watch for external changes to modelValue
watch(() => props.modelValue, (newClientId) => {
  if (newClientId && newClientId !== selectedClient.value?.uuid) {
    loadClientById(newClientId);
  } else if (!newClientId) {
    selectedClient.value = null;
    // Only clear search query if not readonly (to preserve display)
    if (!props.readonly) {
      searchQuery.value = '';
    }
  }
}, { immediate: true });

// Watch for readonly prop changes to prevent input modifications
watch(() => props.readonly, (isReadonly) => {
  if (isReadonly) {
    // When switching to readonly, close dropdown and stop any pending searches
    showDropdown.value = false;
    if (searchTimeout.value) {
      clearTimeout(searchTimeout.value);
      searchTimeout.value = null;
    }
    isLoading.value = false;
  }
});

// Click outside to close dropdown
const handleClickOutside = (event: Event) => {
  const target = event.target as Element;
  if (!target.closest('.client-search-wrapper')) {
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
.client-search-wrapper {
  @apply w-full;
  /* Ensure dropdown can escape form section boundaries */
  position: relative;
  z-index: 1;
}

.client-search-wrapper .relative {
  /* Create stacking context for dropdown positioning */
  z-index: 2;
}

.search-dropdown {
  @apply absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-touch shadow-xl max-h-60 overflow-y-auto;
  z-index: 99999 !important;
  /* Ensure dropdown is visible above all other content */
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.search-option {
  @apply px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0;
}

.search-option.loading,
.search-option.no-results,
.search-option.instruction {
  @apply text-gray-500 cursor-default hover:bg-transparent;
}

.client-info {
  @apply space-y-1;
}

.client-name {
  @apply font-medium text-gray-900;
}

.client-details {
  @apply flex flex-wrap gap-2 text-sm text-gray-600;
}

.detail {
  @apply bg-gray-100 px-2 py-1 rounded text-xs;
}

/* Selected client info styling */
.selected-client-info {
  @apply mt-3;
}

.client-card {
  @apply bg-blue-50 border border-blue-200 rounded-touch p-4;
}

.client-header {
  @apply flex items-center justify-between mb-3;
}

.client-title {
  @apply text-lg font-semibold text-blue-900;
}

.client-nif {
  @apply text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded;
}

.client-details-grid {
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

/* Detail grid for form display */
.detail-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-4;
}

/* Form input styling */
.form-input {
  @apply block w-full rounded-touch border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500;
}

.form-input:disabled {
  @apply bg-gray-100 text-gray-500 cursor-not-allowed;
}

/* Mobile responsive */
@media (max-width: 640px) {
  .client-details {
    @apply flex-col gap-1;
  }
  
  .client-header {
    @apply flex-col items-start space-y-2;
  }
  
  .client-details-grid {
    @apply grid-cols-1;
  }
}
</style>
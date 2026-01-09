<template>
  <div class="client-search-wrapper">
    <!-- Search Input -->
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
    </div>

    <!-- Dropdown Results -->
    <div 
      v-if="showDropdown && (searchResults.length > 0 || isLoading || (searchQuery && searchQuery.length >= 2) || !searchQuery)"
      class="search-dropdown"
    >
      <!-- Loading State -->
      <div v-if="isLoading" class="search-option loading">
        <div class="flex items-center">
          <svg class="animate-spin h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-gray-600">Pesquisando clientes...</span>
        </div>
      </div>

      <!-- No Results -->
      <div v-else-if="searchQuery && searchQuery.length >= 2 && searchResults.length === 0" class="search-option no-results">
        <div class="flex items-center justify-center py-2">
          <svg class="h-5 w-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <span class="text-gray-500">Nenhum cliente encontrado</span>
        </div>
      </div>

      <!-- Instruction when query has 1 character -->
      <div v-else-if="searchQuery && searchQuery.length === 1" class="search-option instruction">
        <div class="flex items-center justify-center py-2">
          <svg class="h-5 w-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span class="text-gray-500">Digite pelo menos 2 caracteres para pesquisar</span>
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
  // For empty queries, fetch recent clients (limit to 10)
  // For queries with less than 2 characters, don't search
  if (query && query.length < 2) {
    searchResults.value = [];
    isLoading.value = false;
    return;
  }

  // Use search parameter only if query is provided and has 2+ characters
  const searchParams = query && query.length >= 2 
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
      console.error('Error searching clients:', error);
      searchResults.value = [];
    })
    .finally(() => {
      isLoading.value = false;
    });
};

const onSearchInput = () => {
  // Clear previous timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  // If the search query is completely empty, clear the selection
  if (!searchQuery.value || searchQuery.value.trim() === '') {
    selectedClient.value = null;
    emit('update:modelValue', '');
    emit('clientSelected', null);
    searchResults.value = [];
    isLoading.value = false;
    return;
  }

  // If query is less than 2 characters (but not empty), clear results
  if (searchQuery.value && searchQuery.value.length < 2) {
    searchResults.value = [];
    isLoading.value = false;
    return;
  }

  // Show loading immediately if we have enough characters or empty query
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
    // If there's an existing query with 2+ characters, search with it
    // Otherwise, search without query to get recent clients
    isLoading.value = true;
    if (searchQuery.value && searchQuery.value.length >= 2) {
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

const selectClient = (client: Client) => {
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
    searchQuery.value = '';
  }
}, { immediate: true });

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
  @apply relative w-full;
}

.search-dropdown {
  @apply absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-touch shadow-lg z-50 max-h-60 overflow-y-auto;
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
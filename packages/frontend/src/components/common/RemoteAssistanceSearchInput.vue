<template>
  <div class="remote-assistance-search-wrapper">
    <!-- Search Input with Dropdown -->
    <div class="relative">
      <input
        v-model="searchQuery"
        type="text"
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
      >

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
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
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

      <!-- Dropdown Results - positioned relative to this input container -->
      <div
        v-if="!readonly && !disabled && showDropdown"
        class="search-dropdown"
      >
        <!-- Loading State -->
        <div
          v-if="isLoading"
          class="search-option loading"
        >
          <div class="flex items-center">
            <svg
              class="animate-spin h-4 w-4 text-gray-400 mr-2"
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
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span class="text-gray-600">Pesquisando assistências remotas...</span>
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
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span class="text-gray-500">Nenhuma assistência remota encontrada</span>
          </div>
        </div>

        <!-- Empty state when no query and no results -->
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
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span class="text-gray-500">Digite para pesquisar assistências remotas</span>
          </div>
        </div>

        <!-- Results -->
        <div
          v-for="assistance in searchResults"
          v-else
          :key="assistance.uuid"
          class="search-option"
          @click="selectRemoteAssistance(assistance)"
        >
          <div class="assistance-info">
            <div class="assistance-header">
              <span class="assistance-date">{{ formatDate(assistance.data.dataAssistencia) }}</span>
              <span
                v-if="assistance.data.tipoAssistencia"
                class="assistance-type-badge"
              >
                {{ assistance.data.tipoAssistencia }}
              </span>
            </div>
            <div class="assistance-details">
              <span
                v-if="getClientName(assistance)"
                class="detail"
              >
                <svg
                  class="w-3 h-3 inline mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {{ getClientName(assistance) }}
              </span>
              <span
                v-if="getTechnicianName(assistance)"
                class="detail"
              >
                <svg
                  class="w-3 h-3 inline mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {{ getTechnicianName(assistance) }}
              </span>
              <span
                v-if="assistance.data.horasTotais"
                class="detail"
              >
                <svg
                  class="w-3 h-3 inline mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {{ assistance.data.horasTotais }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Remote Assistance Info (when readonly) -->
    <div
      v-if="selectedRemoteAssistance && (readonly || disabled)"
      class="selected-assistance-info"
    >
      <div class="assistance-card">
        <div class="assistance-card-header">
          <h3 class="assistance-title">
            Assistência Remota - {{ formatDate(selectedRemoteAssistance.data.dataAssistencia) }}
          </h3>
          <span
            v-if="selectedRemoteAssistance.data.tipoAssistencia"
            class="assistance-type-badge"
          >
            {{ selectedRemoteAssistance.data.tipoAssistencia }}
          </span>
        </div>
        <div class="assistance-details-grid">
          <div
            v-if="getClientName(selectedRemoteAssistance)"
            class="detail-item"
          >
            <span class="detail-label">Cliente:</span>
            <span class="detail-value">{{ getClientName(selectedRemoteAssistance) }}</span>
          </div>
          <div
            v-if="getTechnicianName(selectedRemoteAssistance)"
            class="detail-item"
          >
            <span class="detail-label">Técnico:</span>
            <span class="detail-value">{{ getTechnicianName(selectedRemoteAssistance) }}</span>
          </div>
          <div
            v-if="selectedRemoteAssistance.data.horasTotais"
            class="detail-item"
          >
            <span class="detail-label">Total Horas:</span>
            <span class="detail-value">{{ selectedRemoteAssistance.data.horasTotais }}</span>
          </div>
          <div
            v-if="selectedRemoteAssistance.data.motivoPedido"
            class="detail-item"
          >
            <span class="detail-label">Motivo:</span>
            <span class="detail-value">{{ selectedRemoteAssistance.data.motivoPedido }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Remote Assistance Info (when not readonly/disabled - for forms) -->
    <div
      v-if="selectedRemoteAssistance && !readonly && !disabled"
      class="selected-assistance-info"
    >
      <div class="bg-white rounded-touch border border-gray-200 mt-4">
        <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
          <h3 class="text-lg font-semibold text-gray-900">
            Informação da Assistência Remota
          </h3>
        </div>
        <div class="p-4 sm:p-6">
          <div class="detail-grid">
            <div class="detail-item">
              <label class="detail-label">Data da Assistência</label>
              <div class="detail-value">
                {{ formatDate(selectedRemoteAssistance.data.dataAssistencia) }}
              </div>
            </div>
            <div
              v-if="selectedRemoteAssistance.data.tipoAssistencia"
              class="detail-item"
            >
              <label class="detail-label">Tipo de Assistência</label>
              <div class="detail-value">
                {{ selectedRemoteAssistance.data.tipoAssistencia }}
              </div>
            </div>
            <div
              v-if="getClientName(selectedRemoteAssistance)"
              class="detail-item"
            >
              <label class="detail-label">Cliente</label>
              <div class="detail-value">
                {{ getClientName(selectedRemoteAssistance) }}
              </div>
            </div>
            <div
              v-if="getTechnicianName(selectedRemoteAssistance)"
              class="detail-item"
            >
              <label class="detail-label">Técnico</label>
              <div class="detail-value">
                {{ getTechnicianName(selectedRemoteAssistance) }}
              </div>
            </div>
            <div
              v-if="selectedRemoteAssistance.data.horasTotais"
              class="detail-item"
            >
              <label class="detail-label">Total Horas</label>
              <div class="detail-value">
                {{ selectedRemoteAssistance.data.horasTotais }}
              </div>
            </div>
            <div
              v-if="selectedRemoteAssistance.data.motivoPedido"
              class="detail-item"
            >
              <label class="detail-label">Motivo do Pedido</label>
              <div class="detail-value">
                {{ selectedRemoteAssistance.data.motivoPedido }}
              </div>
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
import type { RemoteAssistance } from '@clever/shared';

// Props
interface Props {
  modelValue?: string; // remoteAssistanceId
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  hasError?: boolean;
  clientId?: string; // filter results by client
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Pesquisar assistência remota...',
  disabled: false,
  readonly: false,
  hasError: false,
});

// Emits
interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'remoteAssistanceSelected', remoteAssistance: RemoteAssistance | null): void;
}

const emit = defineEmits<Emits>();

// Composables
const remoteAssistanceApi = useApi<RemoteAssistance>('remote-assistance');

// State
const searchQuery = ref('');
const searchResults = ref<RemoteAssistance[]>([]);
const selectedRemoteAssistance = ref<RemoteAssistance | null>(null);
const isLoading = ref(false);
const showDropdown = ref(false);
const searchTimeout = ref<number | null>(null);

// Methods
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

const getClientName = (assistance: RemoteAssistance): string => {
  // Try to get client name from resolved relations
  if (assistance.relations?.client && typeof assistance.relations.client === 'object' && 'nomeEmpresa' in assistance.relations.client) {
    return assistance.relations.client.nomeEmpresa as string;
  }
  return '';
};

const getTechnicianName = (assistance: RemoteAssistance): string => {
  const technician = assistance.data.tecnicoResponsavel;
  
  if (typeof technician === 'string') {
    return technician;
  }
  
  if (technician && typeof technician === 'object') {
    const { firstName, lastName } = technician;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return technician.userId || '';
  }
  
  return '';
};

const searchRemoteAssistance = async (query: string) => {
  const searchParams = {
    ...(query && query.length >= 1 ? { search: query } : {}),
    limit: 10,
    ...(props.clientId ? { clientId: props.clientId } : {}),
  };

  await remoteAssistanceApi
    .fetchList(searchParams)
    .then(() => {
      if (remoteAssistanceApi.items.value) {
        searchResults.value = remoteAssistanceApi.items.value;
      } else {
        searchResults.value = [];
      }
    })
    .catch(error => {
      console.error('Error searching remote assistance:', JSON.stringify(error, null, 2));
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
    selectedRemoteAssistance.value = null;
    emit('update:modelValue', '');
    emit('remoteAssistanceSelected', null);

    if (showDropdown.value) {
      isLoading.value = true;
      searchTimeout.value = setTimeout(() => {
        searchRemoteAssistance('');
      }, 100);
    } else {
      searchResults.value = [];
      isLoading.value = false;
    }
    return;
  }

  isLoading.value = true;

  searchTimeout.value = setTimeout(() => {
    searchRemoteAssistance(searchQuery.value);
  }, 300);
};

const onFocus = () => {
  if (!props.readonly && !props.disabled) {
    showDropdown.value = true;

    isLoading.value = true;
    if (searchQuery.value && searchQuery.value.length >= 1) {
      searchRemoteAssistance(searchQuery.value);
    } else {
      searchRemoteAssistance('');
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

const selectRemoteAssistance = (assistance: RemoteAssistance) => {
  if (props.readonly || props.disabled) {
    return;
  }

  selectedRemoteAssistance.value = assistance;
  searchQuery.value = `${formatDate(assistance.data.dataAssistencia)} - ${getClientName(assistance) || 'Cliente'}`;
  showDropdown.value = false;

  emit('update:modelValue', assistance.uuid);
  emit('remoteAssistanceSelected', assistance);
};

const loadRemoteAssistanceById = async (assistanceId: string) => {
  if (!assistanceId) {
    selectedRemoteAssistance.value = null;
    searchQuery.value = '';
    return;
  }

  try {
    await remoteAssistanceApi.fetchById(assistanceId);

    if (remoteAssistanceApi.currentItem.value) {
      selectedRemoteAssistance.value = remoteAssistanceApi.currentItem.value;
      searchQuery.value = `${formatDate(remoteAssistanceApi.currentItem.value.data.dataAssistencia)} - ${getClientName(remoteAssistanceApi.currentItem.value) || 'Cliente'}`;
      emit('remoteAssistanceSelected', remoteAssistanceApi.currentItem.value);
    }
  } catch (error) {
    console.error('Error loading remote assistance:', JSON.stringify(error, null, 2));
    selectedRemoteAssistance.value = null;
    searchQuery.value = '';
  }
};

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  newAssistanceId => {
    if (newAssistanceId && newAssistanceId !== selectedRemoteAssistance.value?.uuid) {
      loadRemoteAssistanceById(newAssistanceId);
    } else if (!newAssistanceId) {
      selectedRemoteAssistance.value = null;
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
  if (!target.closest('.remote-assistance-search-wrapper')) {
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
.remote-assistance-search-wrapper {
  @apply w-full;
  position: relative;
  z-index: 1;
}

.remote-assistance-search-wrapper .relative {
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
  min-height: 44px;
}

.search-option.loading,
.search-option.no-results,
.search-option.instruction {
  @apply text-gray-500 cursor-default hover:bg-transparent;
}

.assistance-info {
  @apply space-y-2;
}

.assistance-header {
  @apply flex items-center justify-between gap-2;
}

.assistance-date {
  @apply font-medium text-gray-900;
}

.assistance-type-badge {
  @apply text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium;
}

.assistance-details {
  @apply flex flex-wrap gap-2 text-sm text-gray-600;
}

.detail {
  @apply bg-gray-100 px-2 py-1 rounded text-xs flex items-center;
}

/* Selected remote assistance info styling */
.selected-assistance-info {
  @apply mt-3;
}

.assistance-card {
  @apply bg-purple-50 border border-purple-200 rounded-touch p-4;
}

.assistance-card-header {
  @apply flex items-center justify-between mb-3 gap-2;
}

.assistance-title {
  @apply text-lg font-semibold text-purple-900;
}

.assistance-details-grid {
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
  min-height: 44px;
  font-size: 16px; /* Prevent zoom on iOS */
}

.form-input:disabled {
  @apply bg-gray-100 text-gray-500 cursor-not-allowed;
}

/* Mobile responsive */
@media (max-width: 640px) {
  .assistance-header {
    @apply flex-col items-start;
  }

  .assistance-details {
    @apply flex-col gap-1;
  }

  .assistance-details-grid {
    @apply grid-cols-1;
  }
}
</style>

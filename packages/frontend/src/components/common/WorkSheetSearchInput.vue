<template>
  <div class="work-sheet-search-wrapper">
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

      <!-- Dropdown Results - positioned relative to this input container -->
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
            <span class="text-gray-600">Pesquisando folhas de obra...</span>
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
            <span class="text-gray-500">Nenhuma folha de obra encontrada</span>
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span class="text-gray-500">Digite para pesquisar folhas de obra</span>
          </div>
        </div>

        <!-- Results -->
        <div
          v-else
          v-for="workSheet in searchResults"
          :key="workSheet.uuid"
          class="search-option"
          @click="selectWorkSheet(workSheet)"
        >
          <div class="work-sheet-info">
            <div class="work-sheet-header">
              <span class="work-sheet-date">{{ formatDate(workSheet.data.request.assistanceDate) }}</span>
              <span v-if="workSheet.data.otherData.serviceType" class="service-type-badge">
                {{ workSheet.data.otherData.serviceType }}
              </span>
            </div>
            <div class="work-sheet-details">
              <span v-if="getClientName(workSheet)" class="detail">
                <svg class="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {{ getClientName(workSheet) }}
              </span>
              <span v-if="getTechnicianName(workSheet)" class="detail">
                <svg class="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {{ getTechnicianName(workSheet) }}
              </span>
              <span v-if="workSheet.data.request.totalHours" class="detail">
                <svg class="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ workSheet.data.request.totalHours }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Work Sheet Info (when readonly) -->
    <div v-if="selectedWorkSheet && (readonly || disabled)" class="selected-work-sheet-info">
      <div class="work-sheet-card">
        <div class="work-sheet-card-header">
          <h3 class="work-sheet-title">
            Folha de Obra - {{ formatDate(selectedWorkSheet.data.request.assistanceDate) }}
          </h3>
          <span v-if="selectedWorkSheet.data.otherData.serviceType" class="service-type-badge">
            {{ selectedWorkSheet.data.otherData.serviceType }}
          </span>
        </div>
        <div class="work-sheet-details-grid">
          <div v-if="getClientName(selectedWorkSheet)" class="detail-item">
            <span class="detail-label">Cliente:</span>
            <span class="detail-value">{{ getClientName(selectedWorkSheet) }}</span>
          </div>
          <div v-if="getTechnicianName(selectedWorkSheet)" class="detail-item">
            <span class="detail-label">Técnico:</span>
            <span class="detail-value">{{ getTechnicianName(selectedWorkSheet) }}</span>
          </div>
          <div v-if="selectedWorkSheet.data.request.totalHours" class="detail-item">
            <span class="detail-label">Total Horas:</span>
            <span class="detail-value">{{ selectedWorkSheet.data.request.totalHours }}</span>
          </div>
          <div v-if="selectedWorkSheet.data.request.reason" class="detail-item">
            <span class="detail-label">Motivo:</span>
            <span class="detail-value">{{ selectedWorkSheet.data.request.reason }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Work Sheet Info (when not readonly/disabled - for forms) -->
    <div v-if="selectedWorkSheet && !readonly && !disabled" class="selected-work-sheet-info">
      <div class="bg-white rounded-touch border border-gray-200 mt-4">
        <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
          <h3 class="text-lg font-semibold text-gray-900">Informação da Folha de Obra</h3>
        </div>
        <div class="p-4 sm:p-6">
          <div class="detail-grid">
            <div class="detail-item">
              <label class="detail-label">Data da Assistência</label>
              <div class="detail-value">{{ formatDate(selectedWorkSheet.data.request.assistanceDate) }}</div>
            </div>
            <div v-if="selectedWorkSheet.data.otherData.serviceType" class="detail-item">
              <label class="detail-label">Tipo de Serviço</label>
              <div class="detail-value">{{ selectedWorkSheet.data.otherData.serviceType }}</div>
            </div>
            <div v-if="getClientName(selectedWorkSheet)" class="detail-item">
              <label class="detail-label">Cliente</label>
              <div class="detail-value">{{ getClientName(selectedWorkSheet) }}</div>
            </div>
            <div v-if="getTechnicianName(selectedWorkSheet)" class="detail-item">
              <label class="detail-label">Técnico</label>
              <div class="detail-value">{{ getTechnicianName(selectedWorkSheet) }}</div>
            </div>
            <div v-if="selectedWorkSheet.data.request.totalHours" class="detail-item">
              <label class="detail-label">Total Horas</label>
              <div class="detail-value">{{ selectedWorkSheet.data.request.totalHours }}</div>
            </div>
            <div v-if="selectedWorkSheet.data.request.reason" class="detail-item">
              <label class="detail-label">Motivo do Pedido</label>
              <div class="detail-value">{{ selectedWorkSheet.data.request.reason }}</div>
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
import type { WorkSheet } from '@clever/shared';

// Props
interface Props {
  modelValue?: string; // workSheetId
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  hasError?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Pesquisar folha de obra...',
  disabled: false,
  readonly: false,
  hasError: false,
});

// Emits
interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'workSheetSelected', workSheet: WorkSheet | null): void;
}

const emit = defineEmits<Emits>();

// Composables
const workSheetsApi = useApi<WorkSheet>('work-sheets');

// State
const searchQuery = ref('');
const searchResults = ref<WorkSheet[]>([]);
const selectedWorkSheet = ref<WorkSheet | null>(null);
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

const getClientName = (workSheet: WorkSheet): string => {
  // Try to get client name from resolved relations
  if (workSheet.relations?.client && typeof workSheet.relations.client === 'object' && 'nomeEmpresa' in workSheet.relations.client) {
    return workSheet.relations.client.nomeEmpresa as string;
  }
  return '';
};

const getTechnicianName = (workSheet: WorkSheet): string => {
  const technician = workSheet.data.otherData.technician;
  
  if (typeof technician === 'string') {
    return technician;
  }
  
  if (technician && typeof technician === 'object') {
    const { firstName, lastName, email } = technician;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return email || '';
  }
  
  return '';
};

const searchWorkSheets = async (query: string) => {
  const searchParams = query && query.length >= 1 ? { search: query, limit: 10 } : { limit: 10 };

  await workSheetsApi
    .fetchList(searchParams)
    .then(() => {
      if (workSheetsApi.items.value) {
        searchResults.value = workSheetsApi.items.value;
      } else {
        searchResults.value = [];
      }
    })
    .catch(error => {
      console.error('Error searching work sheets:', JSON.stringify(error, null, 2));
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
    selectedWorkSheet.value = null;
    emit('update:modelValue', '');
    emit('workSheetSelected', null);

    if (showDropdown.value) {
      isLoading.value = true;
      searchTimeout.value = setTimeout(() => {
        searchWorkSheets('');
      }, 100);
    } else {
      searchResults.value = [];
      isLoading.value = false;
    }
    return;
  }

  isLoading.value = true;

  searchTimeout.value = setTimeout(() => {
    searchWorkSheets(searchQuery.value);
  }, 300);
};

const onFocus = () => {
  if (!props.readonly && !props.disabled) {
    showDropdown.value = true;

    isLoading.value = true;
    if (searchQuery.value && searchQuery.value.length >= 1) {
      searchWorkSheets(searchQuery.value);
    } else {
      searchWorkSheets('');
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

const selectWorkSheet = (workSheet: WorkSheet) => {
  if (props.readonly || props.disabled) {
    return;
  }

  selectedWorkSheet.value = workSheet;
  searchQuery.value = `${formatDate(workSheet.data.request.assistanceDate)} - ${getClientName(workSheet) || 'Cliente'}`;
  showDropdown.value = false;

  emit('update:modelValue', workSheet.uuid);
  emit('workSheetSelected', workSheet);
};

const loadWorkSheetById = async (workSheetId: string) => {
  if (!workSheetId) {
    selectedWorkSheet.value = null;
    searchQuery.value = '';
    return;
  }

  try {
    await workSheetsApi.fetchById(workSheetId);

    if (workSheetsApi.currentItem.value) {
      selectedWorkSheet.value = workSheetsApi.currentItem.value;
      searchQuery.value = `${formatDate(workSheetsApi.currentItem.value.data.request.assistanceDate)} - ${getClientName(workSheetsApi.currentItem.value) || 'Cliente'}`;
      emit('workSheetSelected', workSheetsApi.currentItem.value);
    }
  } catch (error) {
    console.error('Error loading work sheet:', JSON.stringify(error, null, 2));
    selectedWorkSheet.value = null;
    searchQuery.value = '';
  }
};

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  newWorkSheetId => {
    if (newWorkSheetId && newWorkSheetId !== selectedWorkSheet.value?.uuid) {
      loadWorkSheetById(newWorkSheetId);
    } else if (!newWorkSheetId) {
      selectedWorkSheet.value = null;
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
  if (!target.closest('.work-sheet-search-wrapper')) {
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
.work-sheet-search-wrapper {
  @apply w-full;
  position: relative;
  z-index: 1;
}

.work-sheet-search-wrapper .relative {
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

.work-sheet-info {
  @apply space-y-2;
}

.work-sheet-header {
  @apply flex items-center justify-between gap-2;
}

.work-sheet-date {
  @apply font-medium text-gray-900;
}

.service-type-badge {
  @apply text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium;
}

.work-sheet-details {
  @apply flex flex-wrap gap-2 text-sm text-gray-600;
}

.detail {
  @apply bg-gray-100 px-2 py-1 rounded text-xs flex items-center;
}

/* Selected work sheet info styling */
.selected-work-sheet-info {
  @apply mt-3;
}

.work-sheet-card {
  @apply bg-blue-50 border border-blue-200 rounded-touch p-4;
}

.work-sheet-card-header {
  @apply flex items-center justify-between mb-3 gap-2;
}

.work-sheet-title {
  @apply text-lg font-semibold text-blue-900;
}

.work-sheet-details-grid {
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
  .work-sheet-header {
    @apply flex-col items-start;
  }

  .work-sheet-details {
    @apply flex-col gap-1;
  }

  .work-sheet-details-grid {
    @apply grid-cols-1;
  }
}
</style>

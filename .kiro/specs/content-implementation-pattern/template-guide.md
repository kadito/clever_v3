# Content Implementation Template Guide

This guide provides the complete templates and patterns discovered during implementation experience, incorporating all improvements and best practices for any content type.

## Template Components

### 1. Shared Form Data Composable

**File**: `packages/frontend/src/composables/useSharedFormData.ts`

```typescript
import { ref, reactive } from 'vue';

// Global shared form data for handling component recreation issues
const globalFormData = ref<Record<string, any>>({});
const globalValidationErrors = reactive<Record<string, string>>({});

export function useSharedFormData(formKey: string) {
  const initializeFormData = (initialData: Record<string, any>, formSections: any[]) => {
    // Create a new object
    const newFormData: Record<string, any> = {};
    
    // Start with initial data
    Object.assign(newFormData, initialData);
    
    // Ensure all form fields have keys
    for (const section of formSections) {
      for (const field of section.fields) {
        if (!(field.key in newFormData)) {
          // Set default values based on field type
          switch (field.type) {
            case 'checkbox':
              newFormData[field.key] = false;
              break;
            case 'number':
              newFormData[field.key] = field.defaultValue ?? null;
              break;
            default:
              newFormData[field.key] = field.defaultValue ?? '';
          }
        }
      }
    }
    
    // Replace the global form data
    globalFormData.value = newFormData;
  };

  const updateFieldValue = (fieldKey: string, value: any) => {
    if (!globalFormData.value) {
      console.warn('Global form data not initialized');
      return;
    }
    
    globalFormData.value[fieldKey] = value;
    
    // Clear validation error for this field
    delete globalValidationErrors[fieldKey];
  };

  const getFormData = () => {
    return globalFormData.value;
  };

  const clearFormData = () => {
    globalFormData.value = {};
    Object.keys(globalValidationErrors).forEach(key => {
      delete globalValidationErrors[key];
    });
  };

  return {
    formData: globalFormData,
    validationErrors: globalValidationErrors,
    initializeFormData,
    updateFieldValue,
    getFormData,
    clearFormData
  };
}
```

### 2. Enhanced ContentDetailTemplate

**File**: `packages/frontend/src/components/common/ContentDetailTemplate.vue`

Key improvements:
- User email display in audit trail
- Proper null checking for display functions
- Mobile-first responsive design
- Simplified header without edit button (edit available in mobile action bar)
- Cleaned up Estado card without "Criado:" label

```vue
<template>
  <div class="content-detail-container min-h-screen bg-gray-50">
    <!-- Mobile-first header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="px-4 py-3 sm:px-6 sm:py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3 min-w-0 flex-1">
            <BackButton :to="backRoute" variant="inline" />
            <div class="min-w-0 flex-1">
              <h1 class="text-lg sm:text-xl font-bold text-gray-900 truncate">
                <slot name="title" :item="item">
                  {{ getTitle(item) }}
                </slot>
              </h1>
              <p v-if="getSubtitle(item)" class="text-sm text-gray-600 truncate">
                <slot name="subtitle" :item="item">
                  {{ getSubtitle(item) }}
                </slot>
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-2 ml-3">
            <slot name="headerActions" :item="item">
              <button
                v-if="showEditButton"
                @click="handleEdit"
                class="btn-primary inline-flex items-center text-sm"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Editar
              </button>
            </slot>
          </div>
        </div>
      </div>
    </header>

    <!-- Loading state -->
    <div v-if="isLoading" class="p-4 sm:p-6">
      <div class="max-w-4xl mx-auto space-y-6">
        <div v-for="i in 3" :key="i" class="bg-white rounded-touch p-6">
          <div class="loading-skeleton h-6 w-1/3 mb-4"></div>
          <div class="space-y-4">
            <div class="loading-skeleton h-10 w-full"></div>
            <div class="loading-skeleton h-10 w-full"></div>
            <div class="loading-skeleton h-20 w-full"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="p-4 sm:p-6">
      <div class="max-w-4xl mx-auto">
        <ErrorComponent :error="error" @close="clearError" />
      </div>
    </div>

    <!-- Content -->
    <main v-else-if="item" class="p-4 sm:p-6">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Custom content sections -->
        <slot name="content" :item="item" />

        <!-- Custom form sections -->
        <slot name="customSections" :item="item" />

        <!-- Audit trail section -->
        <div v-if="showAuditTrail" class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
              <h2 class="text-lg font-semibold text-gray-900">Histórico</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex items-start space-x-3">
                  <div class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm text-gray-900">
                      <strong>Criado</strong> por {{ getUserDisplayName(item.createdBy) }}
                    </p>
                    <p class="text-xs text-gray-500">{{ formatDateTime(item.createdAt) }}</p>
                  </div>
                </div>
                <div class="flex items-start space-x-3">
                  <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm text-gray-900">
                      <strong>Atualizado</strong> por {{ getUserDisplayName(item.updatedBy) }}
                    </p>
                    <p class="text-xs text-gray-500">{{ formatDateTime(item.updatedAt) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BaseContent } from '@clever/shared';
import BackButton from './BackButton.vue';
import ErrorComponent from './ErrorComponent.vue';
import { useAuth } from '@/composables/useAuth';

interface DetailSection {
  key: string;
  title: string;
  fields: Array<{
    key: string;
    label: string;
    value: any;
  }>;
}

interface Props {
  // Content data
  item: BaseContent | null;
  isLoading?: boolean;
  error?: string | null;
  
  // Navigation
  backRoute?: string;
  
  // Display configuration
  showEditButton?: boolean;
  showMetaBar?: boolean;
  showAuditTrail?: boolean;
  showMobileActions?: boolean;
  
  // Content display functions
  getTitle?: (item: BaseContent | null) => string;
  getSubtitle?: (item: BaseContent | null) => string;
  getStatus?: (item: BaseContent | null) => string;
  getSections?: (item: BaseContent) => DetailSection[];
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: null,
  backRoute: '../',
  showEditButton: true,
  showMetaBar: true,
  showAuditTrail: true,
  showMobileActions: true,
  getTitle: (item: BaseContent | null) => {
    if (!item || !item.data) return 'Item';
    return item.data.name || item.data.title || `Item #${item.uuid.slice(0, 8)}`;
  },
  getSubtitle: (item: BaseContent | null) => {
    if (!item || !item.data) return '';
    return item.data.subtitle || item.data.description || '';
  },
  getStatus: (item: BaseContent | null) => {
    if (!item || !item.data) return '';
    return item.data.status || '';
  },
  getSections: () => [],
});

const emit = defineEmits<{
  edit: [item: BaseContent | null];
  back: [];
  clearError: [];
}>();

// Auth composable
const { user } = useAuth();

// User display name function
const getUserDisplayName = (userId: string | undefined): string => {
  if (!userId) return 'Sistema';
  
  // If it's the current user, show their email
  if (user.value && user.value.userId === userId) {
    return user.value.email || user.value.userId;
  }
  
  // For other users, show the user ID for now
  // In the future, this could be enhanced with a user lookup service
  return userId;
};

// Utility functions
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Event handlers
const handleEdit = () => {
  emit('edit', props.item);
};

const handleBack = () => {
  emit('back');
};

const clearError = () => {
  emit('clearError');
};
</script>

<style scoped>
/* Mobile-first responsive design */
.content-detail-container {
  /* Account for mobile action bar */
  padding-bottom: env(safe-area-inset-bottom);
}

/* Loading skeleton animation */
.loading-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Responsive layout adjustments */
@media (min-width: 768px) {
  .content-detail-container {
    padding-bottom: 2rem;
  }
}

/* Portuguese text optimization */
.detail-value,
.audit-info {
  @apply text-portuguese;
}

/* Print styles */
@media print {
  .content-detail-container {
    background: white;
  }
  
  header {
    display: none;
  }
  
  .detail-section {
    break-inside: avoid;
    margin-bottom: 1rem;
  }
}
</style>
```

## Template Components

### 1. Shared Form Data Composable

**File**: `packages/frontend/src/composables/useSharedFormData.ts`

```typescript
import { ref, reactive } from 'vue';

// Global shared form data for handling component recreation issues
const globalFormData = ref<Record<string, any>>({});
const globalValidationErrors = reactive<Record<string, string>>({});

export function useSharedFormData(formKey: string) {
  const initializeFormData = (initialData: Record<string, any>, formSections: any[]) => {
    // Create a new object
    const newFormData: Record<string, any> = {};
    
    // Start with initial data
    Object.assign(newFormData, initialData);
    
    // Ensure all form fields have keys
    for (const section of formSections) {
      for (const field of section.fields) {
        if (!(field.key in newFormData)) {
          // Set default values based on field type
          switch (field.type) {
            case 'checkbox':
              newFormData[field.key] = false;
              break;
            case 'number':
              newFormData[field.key] = field.defaultValue ?? null;
              break;
            default:
              newFormData[field.key] = field.defaultValue ?? '';
          }
        }
      }
    }
    
    // Replace the global form data
    globalFormData.value = newFormData;
  };

  const updateFieldValue = (fieldKey: string, value: any) => {
    if (!globalFormData.value) {
      console.warn('Global form data not initialized');
      return;
    }
    
    globalFormData.value[fieldKey] = value;
    
    // Clear validation error for this field
    delete globalValidationErrors[fieldKey];
  };

  const getFormData = () => {
    return globalFormData.value;
  };

  const clearFormData = () => {
    globalFormData.value = {};
    Object.keys(globalValidationErrors).forEach(key => {
      delete globalValidationErrors[key];
    });
  };

  return {
    formData: globalFormData,
    validationErrors: globalValidationErrors,
    initializeFormData,
    updateFieldValue,
    getFormData,
    clearFormData
  };
}
```

### 2. Enhanced ContentDetailTemplate

**File**: `packages/frontend/src/components/common/ContentDetailTemplate.vue`

Key improvements:
- User email display in audit trail
- Proper null checking for display functions
- Mobile-first responsive design
- Simplified header without edit button (edit available in mobile action bar)
- Cleaned up Estado card without "Criado:" label

```vue
<template>
  <div class="content-detail-container min-h-screen bg-gray-50">
    <!-- Mobile-first header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="px-4 py-3 sm:px-6 sm:py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3 min-w-0 flex-1">
            <BackButton :to="backRoute" variant="inline" />
            <div class="min-w-0 flex-1">
              <h1 class="text-lg sm:text-xl font-bold text-gray-900 truncate">
                <slot name="title" :item="item">
                  {{ getTitle(item) }}
                </slot>
              </h1>
              <p v-if="getSubtitle(item)" class="text-sm text-gray-600 truncate">
                <slot name="subtitle" :item="item">
                  {{ getSubtitle(item) }}
                </slot>
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-2 ml-3">
            <slot name="headerActions" :item="item">
              <button
                v-if="showEditButton"
                @click="handleEdit"
                class="btn-primary inline-flex items-center text-sm"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Editar
              </button>
            </slot>
          </div>
        </div>
      </div>
    </header>

    <!-- Loading state -->
    <div v-if="isLoading" class="p-4 sm:p-6">
      <div class="max-w-4xl mx-auto space-y-6">
        <div v-for="i in 3" :key="i" class="bg-white rounded-touch p-6">
          <div class="loading-skeleton h-6 w-1/3 mb-4"></div>
          <div class="space-y-4">
            <div class="loading-skeleton h-10 w-full"></div>
            <div class="loading-skeleton h-10 w-full"></div>
            <div class="loading-skeleton h-20 w-full"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="p-4 sm:p-6">
      <div class="max-w-4xl mx-auto">
        <ErrorComponent :error="error" @close="clearError" />
      </div>
    </div>

    <!-- Content -->
    <main v-else-if="item" class="p-4 sm:p-6">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Custom content sections -->
        <slot name="content" :item="item" />

        <!-- Custom form sections -->
        <slot name="customSections" :item="item" />

        <!-- Audit trail section -->
        <div v-if="showAuditTrail" class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
              <h2 class="text-lg font-semibold text-gray-900">Histórico</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex items-start space-x-3">
                  <div class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm text-gray-900">
                      <strong>Criado</strong> por {{ getUserDisplayName(item.createdBy) }}
                    </p>
                    <p class="text-xs text-gray-500">{{ formatDateTime(item.createdAt) }}</p>
                  </div>
                </div>
                <div class="flex items-start space-x-3">
                  <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm text-gray-900">
                      <strong>Atualizado</strong> por {{ getUserDisplayName(item.updatedBy) }}
                    </p>
                    <p class="text-xs text-gray-500">{{ formatDateTime(item.updatedAt) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BaseContent } from '@clever/shared';
import BackButton from './BackButton.vue';
import ErrorComponent from './ErrorComponent.vue';
import { useAuth } from '@/composables/useAuth';

interface DetailSection {
  key: string;
  title: string;
  fields: Array<{
    key: string;
    label: string;
    value: any;
  }>;
}

interface Props {
  // Content data
  item: BaseContent | null;
  isLoading?: boolean;
  error?: string | null;
  
  // Navigation
  backRoute?: string;
  
  // Display configuration
  showEditButton?: boolean;
  showMetaBar?: boolean;
  showAuditTrail?: boolean;
  showMobileActions?: boolean;
  
  // Content display functions
  getTitle?: (item: BaseContent | null) => string;
  getSubtitle?: (item: BaseContent | null) => string;
  getStatus?: (item: BaseContent | null) => string;
  getSections?: (item: BaseContent) => DetailSection[];
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: null,
  backRoute: '../',
  showEditButton: true,
  showMetaBar: true,
  showAuditTrail: true,
  showMobileActions: true,
  getTitle: (item: BaseContent | null) => {
    if (!item || !item.data) return 'Item';
    return item.data.name || item.data.title || `Item #${item.uuid.slice(0, 8)}`;
  },
  getSubtitle: (item: BaseContent | null) => {
    if (!item || !item.data) return '';
    return item.data.subtitle || item.data.description || '';
  },
  getStatus: (item: BaseContent | null) => {
    if (!item || !item.data) return '';
    return item.data.status || '';
  },
  getSections: () => [],
});

const emit = defineEmits<{
  edit: [item: BaseContent | null];
  back: [];
  clearError: [];
}>();

// Auth composable
const { user } = useAuth();

// User display name function
const getUserDisplayName = (userId: string | undefined): string => {
  if (!userId) return 'Sistema';
  
  // If it's the current user, show their email
  if (user.value && user.value.userId === userId) {
    return user.value.email || user.value.userId;
  }
  
  // For other users, show the user ID for now
  // In the future, this could be enhanced with a user lookup service
  return userId;
};

// Utility functions
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Event handlers
const handleEdit = () => {
  emit('edit', props.item);
};

const handleBack = () => {
  emit('back');
};

const clearError = () => {
  emit('clearError');
};
</script>

<style scoped>
/* Mobile-first responsive design */
.content-detail-container {
  /* Account for mobile action bar */
  padding-bottom: env(safe-area-inset-bottom);
}

/* Loading skeleton animation */
.loading-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Responsive layout adjustments */
@media (min-width: 768px) {
  .content-detail-container {
    padding-bottom: 2rem;
  }
}

/* Portuguese text optimization */
.detail-value,
.audit-info {
  @apply text-portuguese;
}

/* Print styles */
@media print {
  .content-detail-container {
    background: white;
  }
  
  header {
    display: none;
  }
  
  .detail-section {
    break-inside: avoid;
    margin-bottom: 1rem;
  }
}
</style>
```

### 3. ContentCreateTemplate Wrapper

**File**: `packages/frontend/src/components/common/ContentCreateTemplate.vue`

```vue
<template>
  <ContentFormTemplate
    :form-sections="formSections"
    :is-loading="isLoading"
    :is-saving="isSaving"
    :error="error"
    :is-editing="false"
    :create-title="createTitle"
    :subtitle="subtitle"
    :cancel-route="cancelRoute"
    :validate-on-submit="true"
    :custom-validator="validateCreateForm"
    @submit="handleCreate"
    @cancel="handleCancel"
    @clear-error="clearError"
  >
    <!-- Custom form sections for creation-specific fields -->
    <template #customSections="{ formData, errors }">
      <slot name="createSections" :form-data="formData" :errors="errors" />
    </template>

    <!-- Custom field overrides -->
    <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
      <slot :name="name" v-bind="slotData" />
    </template>
  </ContentFormTemplate>
</template>

<script setup lang="ts">
import ContentFormTemplate from './ContentFormTemplate.vue';
import type { FormSection } from './types';

interface Props {
  // Content configuration
  contentType: string;
  createTitle?: string;
  subtitle?: string;
  cancelRoute?: string;
  
  // Form configuration
  formSections: FormSection[];
  
  // State
  isLoading?: boolean;
  isSaving?: boolean;
  error?: string | null;
  
  // Validation
  customValidator?: (data: Record<string, any>) => Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  createTitle: 'Criar Novo Item',
  subtitle: 'Adicionar um novo item ao sistema',
  cancelRoute: '../',
  isLoading: false,
  isSaving: false,
  error: null,
});

const emit = defineEmits<{
  create: [data: Record<string, any>];
  cancel: [];
  clearError: [];
}>();

// Create-specific validation that can be overridden
const validateCreateForm = (data: Record<string, any>): Record<string, string> => {
  // If custom validator is provided, use it exclusively
  if (props.customValidator) {
    return props.customValidator(data);
  }
  
  // Default create validation - all required fields must be present
  const errors: Record<string, string> = {};
  for (const section of props.formSections) {
    for (const field of section.fields) {
      if (field.required && (!data[field.key] || (typeof data[field.key] === 'string' && data[field.key].trim() === ''))) {
        errors[field.key] = `${field.label} é obrigatório`;
      }
    }
  }
  
  return errors;
};

// Event handlers
const handleCreate = (data: Record<string, any>) => {
  emit('create', data);
};

const handleCancel = () => {
  emit('cancel');
};

const clearError = () => {
  emit('clearError');
};
</script>

<style scoped>
/* Create-specific styling can be added here if needed */
</style>
```

### 4. Form Field Types

**File**: `packages/frontend/src/components/common/types.ts`

```typescript
export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'url' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date';
  required?: boolean;
  placeholder?: string;
  help?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  
  // Type-specific options
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  options?: Array<{ value: string; label: string }>;
  checkboxLabel?: string;
  defaultValue?: any;
  
  // Validation
  validator?: (value: any) => string | null;
}

export interface FormSection {
  key: string;
  title: string;
  description?: string;
  fields: FormField[];
}
```

## Content Type Implementation Template

### 1. Shared Package Structure

**Directory**: `packages/shared/src/types/{content-type}/`

```
{content-type}/
├── index.ts          # Main exports
├── types.ts          # TypeScript interfaces
└── validation.ts     # Validation functions
```

**types.ts**:
```typescript
import type { BaseContent } from '../base';

export interface {ContentType}Data {
  // Content-specific fields based on legacy analysis
  // Example fields (replace with actual content-specific fields):
  primaryField: string;
  secondaryField: string;
  optionalField?: string;
  // ... other fields based on content type requirements
}

export interface {ContentType} extends BaseContent {
  contentType: '{content-type}';
  data: {ContentType}Data;
}
```

**validation.ts**:
```typescript
import type { {ContentType}Data } from './types';

export function validate{ContentType}Creation(data: {ContentType}Data): string[] {
  const errors: string[] = [];
  
  // Required field validation
  if (!data.primaryField?.trim()) {
    errors.push('Campo principal é obrigatório');
  }
  
  if (!data.secondaryField?.trim()) {
    errors.push('Campo secundário é obrigatório');
  }
  
  // Type-specific validation
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email inválido');
  }
  
  // Additional validation rules based on content type...
  
  return errors;
}

export function validate{ContentType}Update(data: Partial<{ContentType}Data>): string[] {
  const errors: string[] = [];
  
  // Update-specific validation (may be less strict)
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email inválido');
  }
  
  return errors;
}
```

**index.ts**:
```typescript
export * from './types';
export * from './validation';
```

### 2. Backend Route Implementation

**File**: `packages/backend/src/routes/{content-type}.ts`

```typescript
import { createContentRoutes, createClientContentConfig } from './content-route-template';
import type { {ContentType} } from '@clever/shared';
import { validate{ContentType}Creation, validate{ContentType}Update } from '@clever/shared';

// Create content-specific configuration
const {contentType}Config = {
  contentType: '{content-type}',
  sortStrategy: 'date-desc', // or 'alphabetical' for clients
  validateCreate: async (data: any) => {
    const errors = validate{ContentType}Creation(data);
    if (errors.length > 0) {
      throw new Error(errors[0]);
    }
  },
  validateUpdate: async (data: any) => {
    const errors = validate{ContentType}Update(data);
    if (errors.length > 0) {
      throw new Error(errors[0]);
    }
  },
  extractSearchableText: (content: {ContentType}) => {
    const data = content.data;
    const searchableFields = [
      // Content-specific searchable fields
      data.primaryField,
      data.secondaryField,
      data.optionalField,
      // ... other searchable fields
    ].filter(Boolean);
    return searchableFields.join(' ').toLowerCase();
  },
  extractIndexFields: (content: {ContentType}) => {
    const data = content.data;
    return {
      // Content-specific index fields for fast filtering
      primaryField: data.primaryField || '',
      secondaryField: data.secondaryField || '',
      optionalField: data.optionalField || '',
      // ... other index fields
    };
  },
};

// Create and export the router
const {contentType}Router = createContentRoutes<{ContentType}>({contentType}Config);

export default {contentType}Router;
```

### 3. Frontend View Components

**Directory**: `packages/frontend/src/views/{content-type}/`

```
{content-type}/
├── {ContentType}ListView.vue    # List/search view
├── {ContentType}DetailView.vue  # Detail view
├── {ContentType}CreateView.vue  # Create form
├── {ContentType}UpdateView.vue  # Update form
└── index.ts                     # Component exports
```

**{ContentType}CreateView.vue**:
```vue
<template>
  <ContentCreateTemplate
    content-type="{content-type}"
    create-title="Criar {Portuguese Label}"
    subtitle="Adicionar um novo {portuguese label} ao sistema"
    cancel-route="/{content-type}"
    :form-sections="createFormSections"
    :is-loading="isLoading"
    :is-saving="isSaving"
    :error="error"
    :custom-validator="validateCreateForm"
    @create="handleCreate"
    @cancel="handleCancel"
    @clear-error="clearError"
  >
    <!-- Custom sections for content-specific fields -->
    <template #createSections="{ formData }">
      <!-- Content-specific form sections -->
    </template>

    <!-- Custom field implementations (e.g., dynamic configuration management) -->
    <template #field-customField="{ formData, updateFieldValue }">
      <div class="custom-field-management">
        <!-- Custom field implementation based on content type requirements -->
        <!-- Example: Dynamic software management, document attachments, etc. -->
      </div>
    </template>
  </ContentCreateTemplate>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import type { {ContentType}Data, {ContentType} } from '@clever/shared';
import { validate{ContentType}Creation } from '@clever/shared';
import ContentCreateTemplate from '@/components/common/ContentCreateTemplate.vue';
import type { FormSection } from '@/components/common/types';
import { useApi } from '@/composables/useApi';

// Router and composables
const router = useRouter();
const api = useApi<{ContentType}>('{content-type}');

// State
const isLoading = ref(false);
const isSaving = ref(false);
const error = ref<string | null>(null);

// Clear error function
const clearError = () => {
  error.value = null;
};

// Form sections configuration
const createFormSections: FormSection[] = [
  {
    key: 'basic',
    title: 'Informação Básica',
    description: 'Dados fundamentais do {portuguese label}',
    fields: [
      {
        key: 'primaryField',
        label: 'Campo Principal',
        type: 'text',
        required: true,
        placeholder: 'Valor do campo principal'
      },
      {
        key: 'secondaryField',
        label: 'Campo Secundário',
        type: 'text',
        required: true,
        placeholder: 'Valor do campo secundário'
      },
      {
        key: 'email',
        label: 'E-mail',
        type: 'email',
        placeholder: 'exemplo@dominio.com'
      },
      {
        key: 'telefone',
        label: 'Telefone',
        type: 'tel',
        placeholder: '+351 123 456 789'
      },
      // Additional fields based on content type...
    ]
  },
  // Additional sections based on content type requirements...
  {
    key: 'services',
    title: 'Serviços',
    description: 'Selecione os serviços aplicáveis',
    fields: [
      {
        key: 'selectedServices',
        label: 'Serviços Selecionados',
        type: 'multiselect',
        fullWidth: true,
        options: [
          // Content-specific service options
          { value: 'service1', label: 'Serviço 1' },
          { value: 'service2', label: 'Serviço 2' },
          { value: 'service3', label: 'Serviço 3' }
        ],
        placeholder: 'Selecione os serviços...'
      }
    ]
  },
  {
    key: 'conditionalFields',
    title: 'Configurações Adicionais',
    description: 'Configurações específicas dos serviços selecionados',
    fields: [
      {
        key: 'conditionalField1',
        label: 'Campo Condicional 1',
        type: 'text',
        placeholder: 'Valor condicional',
        conditional: {
          dependsOn: 'selectedServices',
          showWhen: (value: any) => Array.isArray(value) && value.includes('service1')
        }
      },
      {
        key: 'conditionalField2',
        label: 'Campo Condicional 2',
        type: 'url',
        fullWidth: true,
        placeholder: 'https://exemplo.com',
        conditional: {
          dependsOn: 'selectedServices',
          showWhen: (value: any) => Array.isArray(value) && value.includes('service2')
        }
      }
    ]
  },
  {
    key: 'configuration',
    title: 'Configuração',
    description: 'Configure os itens específicos do {portuguese label}',
    fields: [
      {
        key: 'configurations',
        label: 'Configurações',
        type: 'custom',
        fullWidth: true
      }
    ]
  },
  {
    key: 'observations',
    title: 'Observações',
    description: 'Notas adicionais sobre o {portuguese label}',
    fields: [
      {
        key: 'observacoes',
        label: 'Observações',
        type: 'textarea',
        rows: 4,
        fullWidth: true,
        placeholder: 'Notas adicionais sobre o {portuguese label}...'
      }
    ]
  }
];

// Validation function
const validateCreateForm = (data: Record<string, any>): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  try {
    // Convert multiselect arrays to individual boolean fields if needed
    const selectedServices = data.selectedServices || [];
    const serviceFlags = {
      // Map services to boolean flags based on content type requirements
      hasService1: selectedServices.includes('service1'),
      hasService2: selectedServices.includes('service2'),
      hasService3: selectedServices.includes('service3')
    };
    
    // Prepare content data for validation
    const contentData: {ContentType}Data = {
      primaryField: data.primaryField || '',
      secondaryField: data.secondaryField || '',
      optionalField: data.optionalField,
      // Map all form data to ContentData structure...
      ...serviceFlags
    };
    
    // Use shared validation
    const validationErrors = validate{ContentType}Creation(contentData);
    
    // Convert validation errors to form errors
    validationErrors.forEach((errorMessage) => {
      // Map error messages to field keys
      if (errorMessage.includes('Campo principal')) {
        errors.primaryField = errorMessage;
      } else if (errorMessage.includes('Email inválido')) {
        errors.email = errorMessage;
      }
      // Additional error mapping based on content type...
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
    
    // Convert multiselect arrays to individual boolean fields if needed
    const selectedServices = formData.selectedServices || [];
    const serviceFlags = {
      hasService1: selectedServices.includes('service1'),
      hasService2: selectedServices.includes('service2'),
      hasService3: selectedServices.includes('service3')
    };
    
    // Prepare the content data
    const contentData: {ContentType}Data = {
      primaryField: formData.primaryField || '',
      secondaryField: formData.secondaryField || '',
      optionalField: formData.optionalField,
      // Map all form data...
      ...serviceFlags
    };
    
    const response = await api.create({ data: contentData } as any);
    
    if (response) {
      // Navigate to the created item's detail page
      router.push(`/{content-type}/${response.uuid}`);
    } else {
      throw new Error('Erro ao criar {portuguese label}');
    }
  } catch (err) {
    console.error('Error creating {content-type}:', err);
    error.value = err instanceof Error ? err.message : 'Erro ao criar {portuguese label}';
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = () => {
  router.push('/{content-type}');
};
</script>

<style scoped>
/* Content-specific styling */
.custom-field-management {
  @apply space-y-4;
}

/* Additional styling based on content type requirements */
</style>
```

**{ContentType}DetailView.vue**:
```vue
<template>
  <ContentDetailTemplate
    :item="{contentType}"
    :is-loading="isLoading"
    :error="error"
    back-route="/{content-type}"
    :show-edit-button="true"
    :show-meta-bar="true"
    :show-audit-trail="true"
    :show-mobile-actions="true"
    :get-title="get{ContentType}Title"
    :get-subtitle="get{ContentType}Subtitle"
    :get-status="get{ContentType}Status"
    @edit="handleEdit"
    @back="handleBack"
    @clear-error="clearError"
  >
    <!-- Custom content sections -->
    <template #content="{ item }">
      <div v-if="item && item.data" class="space-y-6">
        <!-- Basic Information Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
              <h2 class="text-lg font-semibold text-gray-900">Informação Básica</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-grid">
                <div class="detail-item">
                  <label class="detail-label">Campo Principal</label>
                  <div class="detail-value">{{ item.data.primaryField || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Campo Secundário</label>
                  <div class="detail-value">{{ item.data.secondaryField || '-' }}</div>
                </div>
                <!-- Additional fields based on content type... -->
              </div>
            </div>
          </div>
        </div>
        
        <!-- Additional sections based on content type requirements... -->
        
        <!-- Services Section (if applicable) -->
        <div v-if="hasServices(item.data)" class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
              <h2 class="text-lg font-semibold text-gray-900">Serviços</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="services-grid">
                <!-- Display services based on content type -->
              </div>
            </div>
          </div>
        </div>

        <!-- Configuration Section (if applicable) -->
        <div v-if="hasConfigurations(item.data)" class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
              <h2 class="text-lg font-semibold text-gray-900">Configuração</h2>
            </div>
            <div class="p-4 sm:p-6">
              <!-- Display configurations based on content type -->
            </div>
          </div>
        </div>

        <!-- Observations Section -->
        <div v-if="item.data.observacoes" class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
              <h2 class="text-lg font-semibold text-gray-900">Observações</h2>
            </div>
            <div class="p-4 sm:p-6">
              <p class="text-gray-900 whitespace-pre-wrap">{{ item.data.observacoes }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </ContentDetailTemplate>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { {ContentType}, BaseContent } from '@clever/shared';
import ContentDetailTemplate from '@/components/common/ContentDetailTemplate.vue';
import { useApi } from '@/composables/useApi';

// Router
const route = useRoute();
const router = useRouter();

// Composables
const api = useApi<{ContentType}>('{content-type}');

// State
const {contentType} = ref<{ContentType} | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Clear error function
const clearError = () => {
  error.value = null;
};

// Display functions for ContentDetailTemplate
const get{ContentType}Title = (item: BaseContent | null): string => {
  if (!item || !item.data) return '{Portuguese Label}';
  const content = item as {ContentType};
  return content.data.primaryField || content.data.secondaryField || '{Portuguese Label}';
};

const get{ContentType}Subtitle = (item: BaseContent | null): string => {
  if (!item || !item.data) return '';
  const content = item as {ContentType};
  const parts = [];
  
  if (content.data.optionalField) {
    parts.push(content.data.optionalField);
  }
  
  // Additional subtitle parts based on content type...
  
  return parts.join(' • ');
};

const get{ContentType}Status = (item: BaseContent | null): string => {
  if (!item || !item.data) return '{Portuguese Label}';
  const content = item as {ContentType};
  
  // Content-specific status logic
  return '{Portuguese Label} Ativo';
};

// Helper functions
const hasServices = (data: any): boolean => {
  // Check if content has services based on content type requirements
  return data.hasService1 || data.hasService2 || data.hasService3;
};

const hasConfigurations = (data: any): boolean => {
  // Check if content has configurations based on content type requirements
  return data.configurations && Array.isArray(data.configurations) && data.configurations.length > 0;
};

// Event handlers
const handleEdit = (item: BaseContent | null) => {
  if (!item) return;
  const content = item as {ContentType};
  router.push(`/{content-type}/${content.uuid}/editar`);
};

const handleBack = () => {
  router.push('/{content-type}');
};

// Data loading
const load{ContentType} = async () => {
  const contentId = route.params.uuid as string;
  
  if (!contentId) {
    error.value = 'ID do {portuguese label} não fornecido';
    return;
  }
  
  try {
    isLoading.value = true;
    clearError();
    
    await api.fetchById(contentId);
    
    if (api.currentItem.value) {
      {contentType}.value = api.currentItem.value;
    } else {
      throw new Error('{Portuguese Label} não encontrado');
    }
  } catch (err) {
    console.error('Error loading {content-type}:', err);
    error.value = err instanceof Error ? err.message : 'Erro ao carregar {portuguese label}';
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  load{ContentType}();
});
</script>

<style scoped>
/* Content-specific styling */
.detail-grid {
  @apply grid grid-cols-1 gap-4;
}

@media (min-width: 640px) {
  .detail-grid {
    @apply grid-cols-2;
  }
}

@media (min-width: 1024px) {
  .detail-grid {
    @apply grid-cols-3;
  }
}

.detail-item {
  @apply space-y-1;
}

.detail-item.col-span-full {
  grid-column: 1 / -1;
}

.detail-label {
  @apply text-xs font-medium text-gray-500 uppercase tracking-wide;
}

.detail-value {
  @apply text-sm text-gray-900 break-words;
}

.services-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4;
}
</style>
```

## Implementation Checklist

For each new content type, follow this checklist:

### Phase 1: Analysis
- [ ] Analyze legacy Detail view component (`old_src/views/{content-type}/{ContentType}Detail.vue`)
- [ ] Analyze legacy Form view component (`old_src/views/{content-type}/{ContentType}Form.vue`)
- [ ] Extract data structure and field definitions
- [ ] Identify validation rules and business logic
- [ ] Document Portuguese labels and terminology

### Phase 2: Shared Package
- [ ] Create `types.ts` with content-specific interfaces extending BaseContent
- [ ] Create `validation.ts` with validation functions using Portuguese messages
- [ ] Create `index.ts` with exports
- [ ] Add content type to shared package exports

### Phase 3: Backend
- [ ] Create route file using content route template (`packages/backend/src/routes/{content-type}.ts`)
- [ ] Configure content-specific sorting strategy (alphabetical for clients, date-desc for others)
- [ ] Implement validation integration with shared validation functions
- [ ] Configure searchable fields and index fields for efficient filtering
- [ ] Add route to main router

### Phase 4: Frontend Configuration
- [ ] Create form sections configuration file (`packages/frontend/src/config/{content-type}-form-sections.ts`)
- [ ] Define all form sections with proper field types and validation
- [ ] Implement multiselect dropdowns where appropriate
- [ ] Configure conditional fields with dependency tracking
- [ ] Set up dynamic configuration management if needed

### Phase 5: Frontend Components
- [ ] Create ListView component with content-specific display functions
- [ ] Create DetailView component with proper display functions and section ordering
- [ ] Create CreateView component with form sections and custom field implementations
- [ ] Create UpdateView component (if different from create) with pre-population logic
- [ ] Add routes to Vue Router with proper navigation
- [ ] Add navigation tiles to dashboard

### Phase 6: Testing & Validation
- [ ] Test complete CRUD workflow (Create, Read, Update, Delete)
- [ ] Verify mobile responsiveness across all breakpoints (320px+)
- [ ] Test form validation with Portuguese messages
- [ ] Test audit trail display with user emails
- [ ] Verify search and filtering functionality
- [ ] Test error handling and loading states
- [ ] Test multiselect dropdowns and conditional fields
- [ ] Test dynamic configuration management (if applicable)
- [ ] Verify shared form data persistence across component recreation

## Best Practices Summary

1. **Form Data Management**: Always use `useSharedFormData` composable to handle Vue component recreation issues
2. **Validation**: Use shared validation functions with Portuguese messages and proper field mapping
3. **Null Safety**: Add proper null checking in all display functions to prevent runtime errors
4. **Mobile-First**: Design for 320px+ width with touch-friendly targets (minimum 44px)
5. **Portuguese UI**: All labels in Portuguese, code in English with proper terminology mapping
6. **Audit Trail**: Display user emails instead of user IDs using `useAuth()` composable
7. **Error Handling**: Provide clear Portuguese error messages with field-specific feedback
8. **Loading States**: Show loading skeletons for better UX during data fetching
9. **Responsive Design**: Use CSS Grid with proper breakpoints (sm: 768px, md: 1024px, lg: 1280px)
10. **TypeScript**: Maintain strict mode compliance throughout all implementations
11. **Multiselect Dropdowns**: Replace individual checkboxes with touch-friendly multiselect interfaces
12. **Conditional Fields**: Implement dynamic field visibility based on form selections with proper dependency tracking
13. **Section Ordering**: Follow standard ordering (Basic → Contact → Address → Financial → Services → Configuration → Observations)
14. **Dynamic Configuration**: Support add/remove/edit functionality for complex configuration items
15. **JSON Configuration**: Maintain all form sections in JSON configuration files for better maintainability

## Generic Placeholder Reference

When implementing any content type, replace these placeholders:

- `{content-type}` → kebab-case content type (e.g., `clients`, `contracts`, `work-sheets`)
- `{ContentType}` → PascalCase content type (e.g., `Client`, `Contract`, `WorkSheet`)
- `{contentType}` → camelCase content type (e.g., `client`, `contract`, `workSheet`)
- `{portuguese-label}` → Portuguese label lowercase (e.g., `cliente`, `contrato`, `folha de obra`)
- `{Portuguese Label}` → Portuguese label title case (e.g., `Cliente`, `Contrato`, `Folha de Obra`)

## Content Type Mapping Reference

| Code Name           | Portuguese Label            | Frequency      | Description            |
| ------------------- | --------------------------- | -------------- | ---------------------- |
| `clients`           | Clientes                    | Low (~1/month) | Customer records       |
| `contracts`         | Contratos                   | Low (~1/month) | Contract documents     |
| `licenses`          | Licenças                    | Low (~1/month) | License management     |
| `work-sheets`       | Folhas de Obra              | High (~10/day) | Work timesheets        |
| `daily-records`     | Registo Diário de Atividade | High (~10/day) | Daily activity logs    |
| `remote-assistance` | Assistências Remotas        | High (~10/day) | Remote support records |
| `reminders`         | Lembretes                   | Medium         | Reminder system        |
| `pending`           | Pendentes                   | Medium         | Pending tasks          |
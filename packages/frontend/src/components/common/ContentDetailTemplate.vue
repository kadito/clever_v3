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
              <!-- Edit button - visible on desktop, hidden on mobile -->
              <button
                v-if="showEditButton"
                @click="handleEdit"
                class="hidden sm:inline-flex btn-secondary text-sm"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div class="space-y-3">
            <div class="loading-skeleton h-4 w-full"></div>
            <div class="loading-skeleton h-4 w-3/4"></div>
            <div class="loading-skeleton h-4 w-1/2"></div>
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
    <main v-else-if="item" class="p-4 sm:p-6 pb-20">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Status/Meta bar -->
        <div v-if="showMetaBar" class="bg-white rounded-touch p-4 border border-gray-200">
          <div class="flex flex-wrap items-center gap-4 text-sm">
            <slot name="metaBar" :item="item">
              <div v-if="getStatus(item)" class="flex items-center">
                <span class="text-gray-500 mr-2">Estado:</span>
                <span class="badge badge-primary">{{ getStatus(item) }}</span>
              </div>
              <div v-if="item.updatedAt !== item.createdAt" class="flex items-center">
                <span class="text-gray-500 mr-2">Atualizado:</span>
                <span class="text-gray-900">{{ formatDate(item.updatedAt) }}</span>
              </div>
            </slot>
          </div>
        </div>

        <!-- Main content sections -->
        <div class="space-y-6">
          <slot name="content" :item="item">
            <!-- Default sections based on item data -->
            <div v-for="section in defaultSections" :key="section.key" class="detail-section">
              <div class="bg-white rounded-touch border border-gray-200">
                <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
                  <h2 class="text-lg font-semibold text-gray-900">{{ section.title }}</h2>
                </div>
                <div class="p-4 sm:p-6">
                  <div class="detail-grid">
                    <div v-for="field in section.fields" :key="field.key" class="detail-item">
                      <label class="detail-label">{{ field.label }}</label>
                      <div class="detail-value">
                        <slot :name="`field-${field.key}`" :item="item" :value="field.value">
                          {{ field.value || '-' }}
                        </slot>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </slot>
        </div>

        <!-- Custom sections slot -->
        <slot name="customSections" :item="item" />

        <!-- Audit trail section -->
        <div v-if="showAuditTrail" class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
              <h2 class="text-lg font-semibold text-gray-900">Histórico</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="space-y-4">
                <div class="flex items-start space-x-3">
                  <div class="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div class="flex-1">
                    <p class="text-sm text-gray-900">
                      <strong>Criado</strong> por {{ getUserDisplayName(item.createdBy) }}
                    </p>
                    <p class="text-xs text-gray-500">{{ formatDateTime(item.createdAt) }}</p>
                  </div>
                </div>
                <div v-if="item.updatedAt !== item.createdAt" class="flex items-start space-x-3">
                  <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div class="flex-1">
                    <p class="text-sm text-gray-900">
                      <strong>Atualizado</strong> por {{ getUserDisplayName(item.updatedBy) }}
                    </p>
                    <p class="text-xs text-gray-500">{{ formatDateTime(item.updatedAt) }}</p>
                  </div>
                </div>
                <div v-if="item.isDeleted" class="flex items-start space-x-3">
                  <div class="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div class="flex-1">
                    <p class="text-sm text-gray-900">
                      <strong>Eliminado</strong> por {{ item.deletedBy || 'Sistema' }}
                    </p>
                    <p class="text-xs text-gray-500">{{ formatDateTime(item.deletedAt) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Not found state -->
    <div v-else class="p-4 sm:p-6">
      <div class="max-w-4xl mx-auto">
        <div class="empty-state">
          <div class="text-6xl mb-4">❓</div>
          <h3 class="empty-title">Item não encontrado</h3>
          <p class="empty-message">O item solicitado não existe ou foi removido.</p>
          <button @click="handleBack" class="btn-primary mt-4">
            Voltar à lista
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile action bar -->
    <div v-if="item && showMobileActions" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 sm:hidden">
      <div class="flex space-x-3">
        <slot name="mobileActions" :item="item">
          <button
            v-if="showEditButton"
            @click="handleEdit"
            class="btn-primary flex-1 justify-center"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  getTitle?: (item: BaseContent) => string;
  getSubtitle?: (item: BaseContent) => string;
  getStatus?: (item: BaseContent) => string;
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
  getTitle: (item: BaseContent) => item.data.name || item.data.title || `Item #${item.uuid.slice(0, 8)}`,
  getSubtitle: (item: BaseContent) => item.data.subtitle || item.data.description || '',
  getStatus: (item: BaseContent) => item.data.status || '',
  getSections: () => [],
});

const emit = defineEmits<{
  edit: [item: BaseContent];
  back: [];
  clearError: [];
}>();

// Computed properties
const defaultSections = computed((): DetailSection[] => {
  if (!props.item || props.getSections) {
    return props.getSections?.(props.item!) || [];
  }

  // Generate default sections from item data
  const sections: DetailSection[] = [];
  const data = props.item.data;
  
  if (data && typeof data === 'object') {
    // Group fields into logical sections
    const basicFields: Array<{ key: string; label: string; value: any }> = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        basicFields.push({
          key,
          label: formatFieldLabel(key),
          value: formatFieldValue(value),
        });
      }
    });
    
    if (basicFields.length > 0) {
      sections.push({
        key: 'basic',
        title: 'Informação Básica',
        fields: basicFields,
      });
    }
  }
  
  return sections;
});

// Utility functions
const formatFieldLabel = (key: string): string => {
  // Convert camelCase to readable Portuguese labels
  const labelMap: Record<string, string> = {
    name: 'Nome',
    title: 'Título',
    description: 'Descrição',
    email: 'Email',
    phone: 'Telefone',
    address: 'Morada',
    status: 'Estado',
    createdAt: 'Criado em',
    updatedAt: 'Atualizado em',
  };
  
  return labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
};

const formatFieldValue = (value: any): string => {
  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('pt-PT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Event handlers
const handleEdit = () => {
  if (props.item) {
    emit('edit', props.item);
  }
};

const handleBack = () => {
  emit('back');
};

const clearError = () => {
  emit('clearError');
};

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
</script>

<style scoped>
/* Mobile-first responsive design */
.content-detail-container {
  /* Account for mobile action bar */
  padding-bottom: env(safe-area-inset-bottom);
}

/* Section styling */
.detail-section {
  @apply space-y-4;
}

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

.detail-label {
  @apply text-xs font-medium text-gray-500 uppercase tracking-wide;
}

.detail-value {
  @apply text-sm text-gray-900 break-words;
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
    padding-bottom: 0;
  }
}

/* Sticky header on mobile */
@media (max-width: 767px) {
  header {
    position: sticky;
    top: 0;
    z-index: 10;
  }
}

/* Portuguese text optimization */
.detail-value {
  @apply text-portuguese;
}

/* Accessibility improvements */
.detail-section:focus-within {
  @apply ring-2 ring-primary-500 ring-offset-2 rounded-touch;
}

/* Print styles */
@media print {
  .content-detail-container {
    background: white;
  }
  
  header,
  .mobile-actions {
    display: none;
  }
  
  .detail-section {
    break-inside: avoid;
    margin-bottom: 1rem;
  }
}
</style>
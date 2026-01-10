<template>
  <div v-if="shouldShowRelation" class="relation-info-section">
    <div 
      class="relation-info-card"
      :class="{
        'relation-info-card--error': isError,
        'relation-info-card--missing': isMissing
      }"
    >
      <!-- Header -->
      <div class="relation-info-header">
        <div class="relation-info-icon">
          <component :is="relationIcon" class="w-5 h-5" />
        </div>
        <h3 class="relation-info-title">
          {{ relationDisplayName }}
        </h3>
        <div v-if="isError" class="relation-info-status">
          <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      </div>

      <!-- Content -->
      <div class="relation-info-content">
        <!-- Error state -->
        <div v-if="isError" class="relation-error-content">
          <p class="relation-error-message">
            {{ errorMessage }}
          </p>
          <p v-if="relationData.code" class="relation-error-code">
            Código: {{ relationData.code }}
          </p>
        </div>

        <!-- Missing state -->
        <div v-else-if="isMissing" class="relation-missing-content">
          <p class="relation-missing-message">
            {{ relationDisplayName }} não encontrado
          </p>
        </div>

        <!-- Success state with relation data -->
        <div v-else class="relation-data-content">
          <div class="relation-data-grid">
            <div 
              v-for="field in displayFields" 
              :key="field.key"
              class="relation-data-item"
            >
              <label class="relation-data-label">
                {{ field.label }}
              </label>
              <div class="relation-data-value">
                {{ getFieldValue(field.key) || '—' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer with relation ID for debugging (only in development) -->
      <div v-if="showDebugInfo && relationId" class="relation-info-footer">
        <p class="relation-debug-info">
          ID: {{ relationId }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RelationResult, RelationError, ResolvedRelation } from '@clever/shared';

interface Props {
  /** The relation data (resolved relation or error) */
  relationData: RelationResult | null | undefined;
  /** The relation type (e.g., 'client', 'contract') */
  relationType: string;
  /** The original relation ID for debugging */
  relationId?: string;
  /** Whether to show debug information (relation ID) */
  showDebugInfo?: boolean;
  /** Custom display name for the relation */
  customDisplayName?: string;
  /** Custom fields to display (overrides default fields) */
  customFields?: Array<{ key: string; label: string }>;
}

const props = withDefaults(defineProps<Props>(), {
  showDebugInfo: false,
});

// Relation type configurations
const RELATION_CONFIGS = {
  client: {
    displayName: 'Informação do Cliente',
    icon: 'UserIcon',
    fields: [
      { key: 'nomeEmpresa', label: 'Nome da Empresa' },
      { key: 'nomeComercial', label: 'Nome Comercial' },
      { key: 'contribuinte', label: 'NIF' },
      { key: 'localidade', label: 'Localidade' },
      { key: 'telefoneContato', label: 'Telefone' },
      { key: 'emailContato', label: 'Email' }
    ]
  },
  contract: {
    displayName: 'Informação do Contrato',
    icon: 'DocumentIcon',
    fields: [
      { key: 'numeroContrato', label: 'Número do Contrato' },
      { key: 'dataInicio', label: 'Data de Início' },
      { key: 'dataFim', label: 'Data de Fim' },
      { key: 'valor', label: 'Valor' }
    ]
  }
} as const;

// Computed properties
const shouldShowRelation = computed(() => {
  return props.relationData !== undefined;
});

const isError = computed(() => {
  return props.relationData && 
         typeof props.relationData === 'object' && 
         'type' in props.relationData && 
         props.relationData.type === 'error';
});

const isMissing = computed(() => {
  return props.relationData === null;
});

const relationConfig = computed(() => {
  return RELATION_CONFIGS[props.relationType as keyof typeof RELATION_CONFIGS];
});

const relationDisplayName = computed(() => {
  return props.customDisplayName || 
         relationConfig.value?.displayName || 
         `Informação de ${props.relationType}`;
});

const displayFields = computed(() => {
  return props.customFields || 
         relationConfig.value?.fields || 
         [];
});

const relationIcon = computed(() => {
  // Return the appropriate icon component name
  return relationConfig.value?.icon || 'DocumentIcon';
});

const errorMessage = computed(() => {
  if (!isError.value) return '';
  
  const errorData = props.relationData as RelationError;
  
  // Map error codes to Portuguese messages
  const errorMessages: Record<number, string> = {
    404: 'Conteúdo não encontrado',
    500: 'Erro interno do servidor',
  };
  
  return errorMessages[errorData.code] || errorData.message || 'Erro desconhecido';
});

// Helper functions
const getFieldValue = (fieldKey: string): string => {
  if (!props.relationData || isError.value || isMissing.value) {
    return '';
  }
  
  const resolvedData = props.relationData as ResolvedRelation;
  const value = resolvedData[fieldKey];
  
  if (value === null || value === undefined) {
    return '';
  }
  
  // Format dates if the field looks like a date
  if (fieldKey.toLowerCase().includes('data') && typeof value === 'string') {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-PT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    } catch {
      // Fall through to return original value
    }
  }
  
  return String(value);
};

// Icon components (inline SVG for simplicity)
const UserIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  `
};

const DocumentIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  `
};
</script>

<style scoped>
.relation-info-section {
  @apply mb-6;
}

.relation-info-card {
  @apply bg-white rounded-touch border border-gray-200 overflow-hidden transition-all duration-200;
}

.relation-info-card--error {
  @apply border-red-200 bg-red-50;
}

.relation-info-card--missing {
  @apply border-yellow-200 bg-yellow-50;
}

.relation-info-header {
  @apply flex items-center px-4 py-3 border-b border-gray-200 bg-gray-50;
}

.relation-info-card--error .relation-info-header {
  @apply border-red-200 bg-red-100;
}

.relation-info-card--missing .relation-info-header {
  @apply border-yellow-200 bg-yellow-100;
}

.relation-info-icon {
  @apply flex-shrink-0 mr-3 text-gray-600;
}

.relation-info-card--error .relation-info-icon {
  @apply text-red-600;
}

.relation-info-card--missing .relation-info-icon {
  @apply text-yellow-600;
}

.relation-info-title {
  @apply flex-1 text-lg font-semibold text-gray-900;
}

.relation-info-card--error .relation-info-title {
  @apply text-red-900;
}

.relation-info-card--missing .relation-info-title {
  @apply text-yellow-900;
}

.relation-info-status {
  @apply flex-shrink-0;
}

.relation-info-content {
  @apply p-4;
}

.relation-error-content {
  @apply text-center;
}

.relation-error-message {
  @apply text-red-800 font-medium mb-1;
}

.relation-error-code {
  @apply text-red-600 text-sm;
}

.relation-missing-content {
  @apply text-center;
}

.relation-missing-message {
  @apply text-yellow-800 font-medium;
}

.relation-data-content {
  /* No additional styles needed */
}

.relation-data-grid {
  @apply grid grid-cols-1 gap-4;
}

.relation-data-item {
  @apply flex flex-col;
}

.relation-data-label {
  @apply text-sm font-medium text-gray-700 mb-1;
}

.relation-data-value {
  @apply text-base text-gray-900 break-words;
}

.relation-info-footer {
  @apply px-4 py-2 border-t border-gray-200 bg-gray-50;
}

.relation-debug-info {
  @apply text-xs text-gray-500 font-mono;
}

/* Mobile-specific adjustments */
@media (max-width: 639px) {
  .relation-info-header {
    @apply px-3 py-2;
  }
  
  .relation-info-title {
    @apply text-base;
  }
  
  .relation-info-content {
    @apply p-3;
  }
  
  .relation-data-grid {
    @apply gap-3;
  }
  
  .relation-data-label {
    @apply text-xs;
  }
  
  .relation-data-value {
    @apply text-sm;
  }
}

/* Tablet and desktop - 2 columns for better space usage */
@media (min-width: 640px) {
  .relation-data-grid {
    @apply grid-cols-2 gap-x-6 gap-y-4;
  }
}

/* Large screens - 3 columns for more fields */
@media (min-width: 1024px) {
  .relation-data-grid {
    @apply grid-cols-3;
  }
}

/* Touch feedback for mobile */
@media (hover: none) and (pointer: coarse) {
  .relation-info-card {
    @apply active:bg-gray-50;
  }
  
  .relation-info-card--error {
    @apply active:bg-red-100;
  }
  
  .relation-info-card--missing {
    @apply active:bg-yellow-100;
  }
}

/* Accessibility improvements */
.relation-info-card:focus-within {
  @apply outline-none ring-2 ring-primary-500 ring-offset-2;
}

/* Loading state */
.relation-info-card.loading {
  @apply opacity-50 pointer-events-none;
}

.relation-info-card.loading .relation-data-value {
  @apply animate-pulse bg-gray-200 text-transparent rounded h-5;
}

/* Print styles */
@media print {
  .relation-info-card {
    @apply border border-gray-400 break-inside-avoid;
  }
  
  .relation-info-header {
    @apply bg-gray-100;
  }
  
  .relation-debug-info {
    @apply hidden;
  }
}
</style>
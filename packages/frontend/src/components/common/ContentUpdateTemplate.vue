<template>
  <ContentFormTemplate
    :form-sections="formSections"
    :initial-data="initialData"
    :is-loading="isLoading"
    :is-saving="isSaving"
    :error="error"
    :is-editing="true"
    :edit-title="editTitle"
    :subtitle="subtitle"
    :cancel-route="cancelRoute"
    :validate-on-submit="true"
    :custom-validator="validateUpdateForm"
    @submit="handleUpdate"
    @cancel="handleCancel"
    @clear-error="clearError"
  >
    <!-- Custom form sections for update-specific fields -->
    <template #customSections="{ formData, errors, updateFieldValue }">
      <slot name="updateSections" :form-data="formData" :errors="errors" :update-field-value="updateFieldValue" />
    </template>

    <!-- Custom field overrides -->
    <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
      <slot :name="name" v-bind="slotData" />
    </template>
  </ContentFormTemplate>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ContentFormTemplate from './ContentFormTemplate.vue';
import type { FormSection } from './types';
import type { BaseContent } from '@clever/shared';

interface Props {
  // Content data
  item: BaseContent | null;
  initialData?: Record<string, any>;
  
  // Content configuration
  contentType: string;
  editTitle?: string;
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
  
  // Field behavior
  disabledFields?: string[];
  readOnlyFields?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  editTitle: 'Editar Item',
  subtitle: 'Atualizar informações do item',
  cancelRoute: '../',
  isLoading: false,
  isSaving: false,
  error: null,
  disabledFields: () => [],
  readOnlyFields: () => [],
});

const emit = defineEmits<{
  update: [data: Record<string, any>];
  cancel: [];
  clearError: [];
}>();

// Computed form sections with disabled/readonly fields applied
const formSections = computed(() => {
  return props.formSections.map(section => ({
    ...section,
    fields: section.fields.map(field => ({
      ...field,
      disabled: field.disabled || props.disabledFields.includes(field.key),
      readonly: field.readonly || props.readOnlyFields.includes(field.key),
    }))
  }));
});

// Initial data from the item
const initialData = computed(() => {
  if (props.initialData) {
    return props.initialData;
  }
  
  if (props.item) {
    return {
      ...props.item.data,
      // Include some BaseContent fields that might be useful for forms
      uuid: props.item.uuid,
      createdAt: props.item.createdAt,
      updatedAt: props.item.updatedAt,
      version: props.item.version,
    };
  }
  
  return {};
});

// Update-specific validation that can be overridden
const validateUpdateForm = (data: Record<string, any>): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  // Default update validation - more lenient than create
  // Only validate required fields that are not disabled/readonly AND are visible based on conditional logic
  for (const section of formSections.value) {
    for (const field of section.fields) {
      if (field.required && !field.disabled && !field.readonly) {
        // Check if field should be visible based on conditional logic
        let shouldValidate = true;
        if (field.conditional) {
          const dependentValue = data[field.conditional.dependsOn];
          shouldValidate = field.conditional.showWhen(dependentValue);
        }
        
        // Only validate if field should be visible
        if (shouldValidate) {
          if (!data[field.key] || (typeof data[field.key] === 'string' && data[field.key].trim() === '')) {
            errors[field.key] = `${field.label} é obrigatório`;
          }
        }
      }
    }
  }
  
  // Apply custom validation if provided - this should override default validation
  if (props.customValidator) {
    const customErrors = props.customValidator(data);
    
    // Custom validator has complete control - clear default errors and use custom ones
    Object.keys(errors).forEach(key => {
      delete errors[key];
    });
    Object.assign(errors, customErrors);
  }
  
  return errors;
};

// Event handlers
const handleUpdate = (data: Record<string, any>) => {
  // Filter out readonly fields and BaseContent fields from the update data
  const updateData = { ...data };
  
  // Remove BaseContent fields that shouldn't be updated
  delete updateData.uuid;
  delete updateData.createdAt;
  delete updateData.updatedAt;
  delete updateData.version;
  delete updateData.createdBy;
  delete updateData.updatedBy;
  delete updateData.isDeleted;
  delete updateData.deletedAt;
  delete updateData.deletedBy;
  
  // Remove readonly fields
  props.readOnlyFields.forEach(fieldKey => {
    delete updateData[fieldKey];
  });
  
  emit('update', updateData);
};

const handleCancel = () => {
  emit('cancel');
};

const clearError = () => {
  emit('clearError');
};
</script>

<style scoped>
/* Update-specific styling can be added here if needed */

/* Visual indication for disabled/readonly fields */
:deep(.form-input[disabled]),
:deep(.form-textarea[disabled]),
:deep(.form-select[disabled]) {
  @apply bg-gray-100 text-gray-500 cursor-not-allowed;
}

:deep(.form-input[readonly]),
:deep(.form-textarea[readonly]) {
  @apply bg-gray-50 border-gray-200;
}

/* Styling for audit trail information */
.audit-info {
  @apply text-xs text-gray-500 mt-1;
}
</style>
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
    <template #customSections="{ formData, errors, updateFieldValue }">
      <slot name="createSections" :form-data="formData" :errors="errors" :update-field-value="updateFieldValue" />
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
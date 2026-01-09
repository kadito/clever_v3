<template>
  <div class="content-form-container min-h-screen bg-gray-50">
    <!-- Mobile-first header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="px-4 py-3 sm:px-6 sm:py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3 min-w-0 flex-1">
            <BackButton :to="cancelRoute" variant="inline" />
            <div class="min-w-0 flex-1">
              <h1 class="text-lg sm:text-xl font-bold text-gray-900">
                {{ isEditing ? editTitle : createTitle }}
              </h1>
              <p v-if="subtitle" class="text-sm text-gray-600">
                {{ subtitle }}
              </p>
            </div>
          </div>

          <!-- Desktop save button -->
          <div class="hidden sm:flex items-center space-x-2">
            <button
              type="button"
              @click="handleCancel"
              class="btn-secondary text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="content-form"
              :disabled="!isFormValidSimple || isSaving"
              class="btn-primary text-sm"
            >
              <svg
                v-if="isSaving"
                class="w-4 h-4 mr-2 animate-spin"
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
              {{ isSaving ? 'A guardar...' : (isEditing ? 'Atualizar' : 'Criar') }}
            </button>
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

    <!-- Form content -->
    <main v-else class="p-4 sm:p-6 pb-24">
      <div class="max-w-4xl mx-auto">
        <form
          id="content-form"
          @submit.prevent="handleSubmit"
          class="space-y-6"
          novalidate
        >
          <!-- Form sections -->
          <div class="space-y-6">
            <slot name="form" :form-data="formData" :errors="validationErrors">
              <!-- Default form sections -->
              <div v-for="section in formSections" :key="section.key" class="form-section">
                <div class="bg-white rounded-touch border border-gray-200">
                  <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
                    <h2 class="text-lg font-semibold text-gray-900">{{ section.title }}</h2>
                    <p v-if="section.description" class="text-sm text-gray-600 mt-1">
                      {{ section.description }}
                    </p>
                  </div>
                  <div class="p-4 sm:p-6">
                    <div class="form-grid">
                      <div
                        v-for="field in getVisibleFields(section.fields, formData)"
                        :key="field.key"
                        :class="field.fullWidth ? 'col-span-full' : ''"
                        class="form-group"
                      >
                        <!-- Field label -->
                        <label
                          :for="field.key"
                          class="form-label"
                          :class="{ 'required': field.required }"
                        >
                          {{ field.label }}
                          <span v-if="field.required" class="text-red-500 ml-1">*</span>
                        </label>

                        <!-- Field input based on type -->
                        <div class="relative">
                          <!-- Text input -->
                          <input
                            v-if="field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'url' || field.type === 'password'"
                            :id="field.key"
                            :value="formData[field.key]"
                            :type="field.type"
                            :placeholder="field.placeholder"
                            :required="field.required"
                            :disabled="field.disabled"
                            :maxlength="field.maxLength"
                            class="form-input"
                            :class="{ 'border-red-500': validationErrors[field.key] }"
                            @blur="validateField(field.key)"
                            @input="(e) => updateFieldValue(field.key, (e.target as HTMLInputElement).value)"
                          />

                          <!-- Number input -->
                          <input
                            v-else-if="field.type === 'number'"
                            :id="field.key"
                            :value="formData[field.key]"
                            type="number"
                            :placeholder="field.placeholder"
                            :required="field.required"
                            :disabled="field.disabled"
                            :min="field.min"
                            :max="field.max"
                            :step="field.step"
                            class="form-input"
                            :class="{ 'border-red-500': validationErrors[field.key] }"
                            @blur="validateField(field.key)"
                            @input="(e) => updateFieldValue(field.key, Number((e.target as HTMLInputElement).value))"
                          />

                          <!-- Textarea -->
                          <textarea
                            v-else-if="field.type === 'textarea'"
                            :id="field.key"
                            :value="formData[field.key]"
                            :placeholder="field.placeholder"
                            :required="field.required"
                            :disabled="field.disabled"
                            :rows="field.rows || 3"
                            :maxlength="field.maxLength"
                            class="form-textarea"
                            :class="{ 'border-red-500': validationErrors[field.key] }"
                            @blur="validateField(field.key)"
                            @input="(e) => updateFieldValue(field.key, (e.target as HTMLTextAreaElement).value)"
                          />

                          <!-- Select -->
                          <select
                            v-else-if="field.type === 'select'"
                            :id="field.key"
                            :value="formData[field.key]"
                            :required="field.required"
                            :disabled="field.disabled"
                            class="form-select"
                            :class="{ 'border-red-500': validationErrors[field.key] }"
                            @blur="validateField(field.key)"
                            @change="(e) => updateFieldValue(field.key, (e.target as HTMLSelectElement).value)"
                          >
                            <option value="" disabled>{{ field.placeholder || 'Selecionar...' }}</option>
                            <option
                              v-for="option in field.options"
                              :key="option.value"
                              :value="option.value"
                            >
                              {{ option.label }}
                            </option>
                          </select>

                          <!-- Multi-select -->
                          <div v-else-if="field.type === 'multiselect'" class="multiselect-container">
                            <div
                              class="multiselect-input"
                              :class="{ 'border-red-500': validationErrors[field.key] }"
                              @click="toggleMultiselect(field.key)"
                            >
                              <div v-if="getSelectedOptions(field, formData[field.key]).length === 0" class="multiselect-placeholder">
                                {{ field.placeholder || 'Selecionar...' }}
                              </div>
                              <div v-else class="multiselect-selected">
                                <span
                                  v-for="option in getSelectedOptions(field, formData[field.key])"
                                  :key="option.value"
                                  class="multiselect-tag"
                                >
                                  {{ option.label }}
                                  <button
                                    type="button"
                                    @click.stop="removeSelectedOption(field.key, option.value)"
                                    class="multiselect-tag-remove"
                                  >
                                    ×
                                  </button>
                                </span>
                              </div>
                              <svg class="multiselect-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                              </svg>
                            </div>
                            
                            <div
                              v-if="openMultiselects[field.key]"
                              class="multiselect-dropdown"
                              @click.stop
                            >
                              <div
                                v-for="option in field.options"
                                :key="option.value"
                                class="multiselect-option"
                                :class="{ 'selected': isOptionSelected(field.key, option.value) }"
                                @click="toggleOption(field.key, option.value)"
                              >
                                <input
                                  type="checkbox"
                                  :checked="isOptionSelected(field.key, option.value)"
                                  class="multiselect-checkbox"
                                  readonly
                                >
                                <span>{{ option.label }}</span>
                              </div>
                            </div>
                          </div>

                          <!-- Checkbox -->
                          <div v-else-if="field.type === 'checkbox'" class="flex items-center">
                            <input
                              :id="field.key"
                              :checked="formData[field.key]"
                              type="checkbox"
                              :disabled="field.disabled"
                              class="form-checkbox"
                              @change="(e) => updateFieldValue(field.key, (e.target as HTMLInputElement).checked)"
                            />
                            <label :for="field.key" class="ml-2 text-sm text-gray-700">
                              {{ field.checkboxLabel || field.label }}
                            </label>
                          </div>

                          <!-- Date input -->
                          <input
                            v-else-if="field.type === 'date'"
                            :id="field.key"
                            :value="formData[field.key]"
                            type="date"
                            :required="field.required"
                            :disabled="field.disabled"
                            :min="field.min"
                            :max="field.max"
                            class="form-input"
                            :class="{ 'border-red-500': validationErrors[field.key] }"
                            @blur="validateField(field.key)"
                            @change="(e) => updateFieldValue(field.key, (e.target as HTMLInputElement).value)"
                          />

                          <!-- Custom field slot -->
                          <div v-else-if="field.type === 'custom' && field.key === 'clientId'">
                            <ClientSearchInput
                              :model-value="formData[field.key]"
                              :placeholder="field.placeholder"
                              :disabled="field.disabled"
                              :has-error="!!validationErrors[field.key]"
                              @update:model-value="(value) => updateFieldValue(field.key, value)"
                              @client-selected="(client) => handleClientSelected(client)"
                            />
                          </div>

                          <!-- Generic custom field slot -->
                          <slot
                            v-else
                            :name="`field-${field.key}`"
                            :field="field"
                            :value="formData[field.key]"
                            :error="validationErrors[field.key]"
                            :update-value="(value: any) => updateFieldValue(field.key, value)"
                            :clear-error="() => clearFieldError(field.key)"
                            :form-data="formData"
                            :update-field-value="updateFieldValue"
                          />
                        </div>

                        <!-- Field help text -->
                        <p v-if="field.help" class="form-help">
                          {{ field.help }}
                        </p>

                        <!-- Field error -->
                        <p v-if="validationErrors[field.key]" class="form-error">
                          {{ validationErrors[field.key] }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </slot>
          </div>

          <!-- Custom form sections -->
          <slot name="customSections" :form-data="formData" :errors="validationErrors" :update-field-value="updateFieldValue" />

          <!-- Invisible overlay to close multiselect dropdowns when clicking outside -->
          <div
            v-if="hasOpenMultiselects"
            class="multiselect-overlay"
            @click="closeAllMultiselects"
          ></div>
        </form>
      </div>
    </main>

    <!-- Mobile action bar -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 sm:hidden">
      <div class="flex space-x-3">
        <button
          type="button"
          @click="handleCancel"
          class="btn-secondary flex-1 justify-center"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="content-form"
          :disabled="!isFormValidSimple || isSaving"
          class="btn-primary flex-1 justify-center"
        >
          <svg
            v-if="isSaving"
            class="w-4 h-4 mr-2 animate-spin"
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
          {{ isSaving ? 'A guardar...' : (isEditing ? 'Atualizar' : 'Criar') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { BaseContent, Client } from '@clever/shared';
import BackButton from './BackButton.vue';
import ErrorComponent from './ErrorComponent.vue';
import ClientSearchInput from './ClientSearchInput.vue';
import type { FormField, FormSection } from './types';
import { useSharedFormData } from '@/composables/useSharedFormData';

interface Props {
  // Form state
  initialData?: Record<string, any>;
  isLoading?: boolean;
  isSaving?: boolean;
  error?: string | null;
  
  // Form configuration
  isEditing?: boolean;
  createTitle?: string;
  editTitle?: string;
  subtitle?: string;
  cancelRoute?: string;
  
  // Form structure
  formSections?: FormSection[];
  
  // Validation
  validateOnSubmit?: boolean;
  customValidator?: (data: Record<string, any>) => Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  initialData: () => ({}),
  isLoading: false,
  isSaving: false,
  error: null,
  isEditing: false,
  createTitle: 'Criar Novo Item',
  editTitle: 'Editar Item',
  subtitle: '',
  cancelRoute: '../',
  formSections: () => [],
  validateOnSubmit: true,
});

const emit = defineEmits<{
  submit: [data: Record<string, any>];
  cancel: [];
  clearError: [];
  clientSelected: [client: Client | null];
}>();

// Form state - use shared form data to handle component recreation
const formKey = 'content-form'; // Could be made dynamic if needed
const { 
  formData, 
  validationErrors, 
  initializeFormData: initSharedFormData, 
  updateFieldValue: updateSharedFieldValue,
  getFormData
} = useSharedFormData(formKey);

// Initialize form data with all field keys first
const initializeFormData = () => {
  initSharedFormData(props.initialData, props.formSections);
};

// Initialize form data when component mounts
initializeFormData();

// Computed property for form validity (after formData is initialized)
const isFormValidSimple = computed(() => {
  // Ensure formData is available
  if (!formData.value) {
    return false;
  }
  
  const currentFormData = formData.value;
  
  // Check validation errors first
  if (Object.keys(validationErrors).length > 0) {
    return false;
  }
  
  // Check required fields
  for (const section of props.formSections) {
    for (const field of section.fields) {
      if (field.required) {
        const value = currentFormData[field.key];
        const isEmpty = !value || (typeof value === 'string' && value.trim() === '');
        
        if (isEmpty) {
          return false;
        }
      }
    }
  }
  
  return true;
});

// Watch for changes in form validity
watch(
  () => isFormValidSimple.value,
  (newValue, oldValue) => {
    // Form validity changed - button state will update automatically
  }
);

const hasValidated = ref(false);

// Watch for form data changes
watch(
  () => formData.value,
  (newFormData) => {
    // Form validity is now handled by the computed property
  },
  { deep: true, immediate: true }
);

// Watch for initial data changes
watch(
  () => props.initialData,
  (newData) => {
    Object.assign(formData.value, newData);
  },
  { deep: true }
);

// Watch for form sections changes (in case they're loaded dynamically)
watch(
  () => props.formSections,
  (_, oldSections) => {
    // Only reinitialize if this is the first time sections are loaded
    if (!oldSections || oldSections.length === 0) {
      initializeFormData();
    }
  },
  { deep: true }
);

// Validation functions
const validateField = (fieldKey: string) => {
  const field = findField(fieldKey);
  if (!field) return;
  
  const currentFormData = getFormData();
  const value = currentFormData[fieldKey];
  
  // Clear existing error
  delete validationErrors[fieldKey];
  
  // Required validation
  if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    validationErrors[fieldKey] = `${field.label} é obrigatório`;
    return;
  }
  
  // Type-specific validation
  if (value) {
    switch (field.type) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          validationErrors[fieldKey] = 'Email inválido';
        }
        break;
      case 'tel':
        if (!/^[\d\s\-\+\(\)]+$/.test(value)) {
          validationErrors[fieldKey] = 'Número de telefone inválido';
        }
        break;
      case 'url':
        try {
          new URL(value);
        } catch {
          validationErrors[fieldKey] = 'URL inválida';
        }
        break;
      case 'number':
        if (field.min !== undefined && value < field.min) {
          validationErrors[fieldKey] = `Valor mínimo é ${field.min}`;
        }
        if (field.max !== undefined && value > field.max) {
          validationErrors[fieldKey] = `Valor máximo é ${field.max}`;
        }
        break;
    }
  }
  
  // Custom validation
  if (field.validator && value) {
    const customError = field.validator(value);
    if (customError) {
      validationErrors[fieldKey] = customError;
    }
  }
};

const validateForm = () => {
  hasValidated.value = true;
  
  // Clear all errors
  Object.keys(validationErrors).forEach(key => {
    delete validationErrors[key];
  });
  
  // Validate all fields
  for (const section of props.formSections) {
    for (const field of section.fields) {
      validateField(field.key);
    }
  }
  
  // Custom form validation
  if (props.customValidator) {
    const currentFormData = getFormData();
    const customErrors = props.customValidator(currentFormData);
    Object.assign(validationErrors, customErrors);
  }
  
  const hasErrors = Object.keys(validationErrors).length > 0;
  
  return !hasErrors;
};

const findField = (fieldKey: string): FormField | undefined => {
  for (const section of props.formSections) {
    const field = section.fields.find(f => f.key === fieldKey);
    if (field) return field;
  }
  return undefined;
};

// Event handlers
const handleSubmit = () => {
  const currentFormData = getFormData();
  
  if (props.validateOnSubmit) {
    const isValid = validateForm();
    if (!isValid) {
      return;
    }
  }
  
  emit('submit', { ...currentFormData });
};

const handleCancel = () => {
  emit('cancel');
};

const clearError = () => {
  emit('clearError');
};

const handleClientSelected = (client: Client | null) => {
  // Emit the client selection event for parent components to handle
  emit('clientSelected', client);
};

const clearFieldError = (fieldKey: string) => {
  delete validationErrors[fieldKey];
};

const updateFieldValue = (fieldKey: string, value: any) => {
  updateSharedFieldValue(fieldKey, value);
  // Form validity is now handled by the computed property automatically
};

// Multiselect state and methods
const openMultiselects = ref<Record<string, boolean>>({});

const toggleMultiselect = (fieldKey: string) => {
  openMultiselects.value[fieldKey] = !openMultiselects.value[fieldKey];
};

const closeMultiselect = (fieldKey: string) => {
  openMultiselects.value[fieldKey] = false;
};

const closeAllMultiselects = () => {
  Object.keys(openMultiselects.value).forEach(key => {
    openMultiselects.value[key] = false;
  });
};

const hasOpenMultiselects = computed(() => {
  return Object.values(openMultiselects.value).some(isOpen => isOpen);
});

const getVisibleFields = (fields: FormField[], formData: Record<string, any>): FormField[] => {
  return fields.filter(field => {
    if (!field.conditional) return true;
    
    const dependentValue = formData[field.conditional.dependsOn];
    return field.conditional.showWhen(dependentValue);
  });
};

const isOptionSelected = (fieldKey: string, optionValue: string): boolean => {
  const selectedValues = formData.value[fieldKey] || [];
  return Array.isArray(selectedValues) && selectedValues.includes(optionValue);
};

const toggleOption = (fieldKey: string, optionValue: string) => {
  const currentValues = formData.value[fieldKey] || [];
  const newValues = Array.isArray(currentValues) ? [...currentValues] : [];
  
  const index = newValues.indexOf(optionValue);
  if (index > -1) {
    newValues.splice(index, 1);
  } else {
    newValues.push(optionValue);
  }
  
  updateFieldValue(fieldKey, newValues);
  
  // Update individual service flags for backward compatibility
  if (fieldKey === 'selectedServices') {
    const serviceFlags = {
      temAnydesk: newValues.includes('temAnydesk'),
      manutencao: newValues.includes('manutencao'),
      manutencao24: newValues.includes('manutencao24'),
      dumps: newValues.includes('dumps'),
      atcud: newValues.includes('atcud'),
      vectronConnect: newValues.includes('vectronConnect')
    };
    
    Object.entries(serviceFlags).forEach(([key, value]) => {
      updateFieldValue(key, value);
    });
  }
};

const removeSelectedOption = (fieldKey: string, optionValue: string) => {
  const currentValues = formData.value[fieldKey] || [];
  const newValues = Array.isArray(currentValues) ? currentValues.filter(v => v !== optionValue) : [];
  updateFieldValue(fieldKey, newValues);
  
  // Update individual service flags for backward compatibility
  if (fieldKey === 'selectedServices') {
    const serviceFlags = {
      temAnydesk: newValues.includes('temAnydesk'),
      manutencao: newValues.includes('manutencao'),
      manutencao24: newValues.includes('manutencao24'),
      dumps: newValues.includes('dumps'),
      atcud: newValues.includes('atcud'),
      vectronConnect: newValues.includes('vectronConnect')
    };
    
    Object.entries(serviceFlags).forEach(([key, value]) => {
      updateFieldValue(key, value);
    });
  }
};

const getSelectedOptions = (field: FormField, selectedValues: any) => {
  if (!field.options || !Array.isArray(selectedValues)) return [];
  return field.options.filter(option => selectedValues.includes(option.value));
};
</script>

<style scoped>
/* Mobile-first responsive design */
.content-form-container {
  /* Account for mobile action bar */
  padding-bottom: env(safe-area-inset-bottom);
}

/* Form section styling */
.form-section {
  @apply space-y-4;
}

.form-grid {
  @apply grid grid-cols-1 gap-4;
}

@media (min-width: 640px) {
  .form-grid {
    @apply grid-cols-2;
  }
}

/* Required field indicator */
.form-label.required {
  @apply relative;
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

/* Form input focus states */
.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  @apply ring-2 ring-primary-500 border-primary-500;
}

/* Error state styling */
.form-input.border-red-500:focus,
.form-textarea.border-red-500:focus,
.form-select.border-red-500:focus {
  --tw-ring-color: rgb(239 68 68);
  border-color: rgb(239 68 68);
}

/* Responsive layout adjustments */
@media (min-width: 768px) {
  .content-form-container {
    padding-bottom: 2rem;
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
.form-input,
.form-textarea,
.form-select {
  @apply text-portuguese;
}

/* Accessibility improvements */
.form-group:focus-within {
  @apply ring-2 ring-primary-500 ring-offset-2 rounded-touch;
}

/* Mobile input optimization */
@media (max-width: 767px) {
  .form-input,
  .form-textarea,
  .form-select {
    font-size: 16px; /* Prevent zoom on iOS */
  }
}

/* Touch-friendly form controls */
.form-input,
.form-textarea,
.form-select {
  @apply min-h-touch;
}

.form-checkbox {
  @apply w-5 h-5; /* Larger touch target */
}

/* Form validation animations */
.form-error {
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Print styles */
@media print {
  .content-form-container {
    background: white;
  }
  
  header,
  .mobile-actions {
    display: none;
  }
  
  .form-section {
    break-inside: avoid;
    margin-bottom: 1rem;
  }
}

/* Multiselect component styling */
.multiselect-container {
  @apply relative;
}

.multiselect-input {
  @apply block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm cursor-pointer bg-white min-h-touch;
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500;
  @apply transition-colors duration-200;
}

.multiselect-input:hover {
  @apply border-gray-400;
}

.multiselect-placeholder {
  @apply text-gray-500;
}

.multiselect-selected {
  @apply flex flex-wrap gap-1;
}

.multiselect-tag {
  @apply inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded;
  @apply max-w-full;
}

.multiselect-tag-remove {
  @apply ml-1 text-primary-600 hover:text-primary-800 font-bold text-sm leading-none;
  @apply w-4 h-4 flex items-center justify-center rounded-full hover:bg-primary-200;
  @apply transition-colors duration-150;
}

.multiselect-arrow {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none;
}

.multiselect-dropdown {
  @apply absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto;
}

.multiselect-option {
  @apply flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors duration-150;
  @apply min-h-touch;
}

.multiselect-option.selected {
  @apply bg-primary-50 text-primary-900;
}

.multiselect-checkbox {
  @apply mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500;
  @apply w-4 h-4;
}

.multiselect-overlay {
  @apply fixed inset-0 z-40;
}

/* Mobile optimizations for multiselect */
@media (max-width: 767px) {
  .multiselect-tag {
    @apply text-xs px-1.5 py-0.5;
  }
  
  .multiselect-dropdown {
    @apply max-h-48;
  }
  
  .multiselect-option {
    @apply py-3;
  }
}
</style>
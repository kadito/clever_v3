<template>
  <form @submit.prevent="handleSubmit" class="content-form">
    <!-- Form header -->
    <div class="content-form__header">
      <h2 class="text-xl font-semibold text-gray-900 mb-2">
        {{ isEditMode ? 'Editar' : 'Criar' }} {{ contentTypeDisplayName }}
      </h2>
      <p class="text-gray-600 text-sm">
        {{ isEditMode ? 'Modifique os campos necessários' : 'Preencha os campos obrigatórios' }}
      </p>
    </div>
    
    <!-- Dynamic form fields -->
    <div class="content-form__fields">
      <slot name="fields">
        <!-- Default fields for demonstration -->
        <div class="form-group">
          <label class="form-label" for="name">
            Nome *
          </label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            class="form-input"
            :class="{ 'border-red-500': errors.name }"
            placeholder="Digite o nome"
            required
          />
          <p v-if="errors.name" class="form-error">
            {{ errors.name }}
          </p>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="description">
            Descrição
          </label>
          <textarea
            id="description"
            v-model="formData.description"
            class="form-input"
            :class="{ 'border-red-500': errors.description }"
            rows="3"
            placeholder="Digite uma descrição (opcional)"
          ></textarea>
          <p v-if="errors.description" class="form-error">
            {{ errors.description }}
          </p>
        </div>
      </slot>
    </div>
    
    <!-- Form actions -->
    <div class="content-form__actions">
      <div class="flex flex-col sm:flex-row gap-3 sm:justify-end">
        <button
          type="button"
          @click="handleCancel"
          class="btn-outline w-full sm:w-auto order-2 sm:order-1"
          :disabled="isSubmitting"
        >
          Cancelar
        </button>
        
        <button
          type="submit"
          class="btn-primary w-full sm:w-auto order-1 sm:order-2"
          :disabled="isSubmitting || !isFormValid"
        >
          <svg 
            v-if="isSubmitting" 
            class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isSubmitting ? 'Guardando...' : (isEditMode ? 'Guardar Alterações' : 'Criar') }}
        </button>
      </div>
    </div>
    
    <!-- Form validation summary -->
    <div v-if="hasErrors" class="content-form__errors">
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex">
          <svg class="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 class="text-sm font-medium text-red-800 mb-1">
              Existem erros no formulário
            </h3>
            <ul class="text-sm text-red-700 list-disc list-inside">
              <li v-for="(error, field) in errors" :key="field">
                {{ error }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'

interface Props {
  contentType?: string
  initialData?: Record<string, any>
  isEditMode?: boolean
  isSubmitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  contentType: '',
  initialData: () => ({}),
  isEditMode: false,
  isSubmitting: false
})

const emit = defineEmits<{
  submit: [data: Record<string, any>]
  cancel: []
}>()

// Form data - reactive to allow for dynamic fields
const formData = reactive({
  name: props.initialData.name || '',
  description: props.initialData.description || '',
  ...props.initialData
})

// Form validation errors
const errors = ref<Record<string, string>>({})

const contentTypeDisplayName = computed(() => {
  const displayNames: Record<string, string> = {
    'clientes': 'Cliente',
    'contratos': 'Contrato',
    'licencas': 'Licença',
    'folhas-obra': 'Folha de Obra',
    'registo-diario': 'Registo Diário',
    'assistencias-remotas': 'Assistência Remota',
    'agendamentos': 'Agendamento',
    'equipa': 'Membro da Equipa'
  }
  
  return displayNames[props.contentType] || 'Item'
})

const hasErrors = computed(() => {
  return Object.keys(errors.value).length > 0
})

const isFormValid = computed(() => {
  // Basic validation - can be extended
  return formData.name && formData.name.trim().length > 0 && !hasErrors.value
})

const validateForm = (): boolean => {
  errors.value = {}
  
  // Name validation
  if (!formData.name || formData.name.trim().length === 0) {
    errors.value.name = 'Nome é obrigatório'
  } else if (formData.name.trim().length < 2) {
    errors.value.name = 'Nome deve ter pelo menos 2 caracteres'
  }
  
  // Description validation (optional but if provided, should have minimum length)
  if (formData.description && formData.description.trim().length > 0 && formData.description.trim().length < 5) {
    errors.value.description = 'Descrição deve ter pelo menos 5 caracteres'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (validateForm()) {
    // Clean up form data
    const cleanData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key,
        typeof value === 'string' ? value.trim() : value
      ])
    )
    
    emit('submit', cleanData)
  }
}

const handleCancel = () => {
  emit('cancel')
}

// Expose validation method for parent components
defineExpose({
  validateForm,
  formData,
  errors
})
</script>

<style scoped>
.content-form {
  @apply max-w-2xl mx-auto;
}

.content-form__header {
  @apply mb-6 pb-4 border-b border-gray-200;
}

.content-form__fields {
  @apply space-y-6 mb-8;
}

.content-form__actions {
  @apply pt-6 border-t border-gray-200 mb-6;
}

.content-form__errors {
  @apply mb-6;
}

/* Form styling */
.form-group {
  @apply mb-4;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.form-input {
  @apply block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200;
  /* Prevent zoom on iOS */
  font-size: 16px;
}

@media (min-width: 768px) {
  .form-input {
    font-size: 14px;
    @apply py-2;
  }
}

.form-input:invalid {
  @apply border-red-500;
}

.form-error {
  @apply mt-1 text-sm text-red-600;
}

/* Button styling */
.btn {
  @apply inline-flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg border border-transparent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-touch;
}

.btn-primary {
  @apply btn bg-primary text-white hover:bg-primary-600 focus:ring-primary-500;
}

.btn-outline {
  @apply btn border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500;
}

.btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Mobile-specific adjustments */
@media (max-width: 639px) {
  .content-form {
    @apply mx-0;
  }
  
  .content-form__actions .flex {
    @apply space-y-3 space-x-0;
  }
  
  .btn {
    @apply w-full justify-center py-4;
  }
}

/* Touch-friendly improvements */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* Loading state */
.content-form.loading {
  @apply opacity-50 pointer-events-none;
}

/* Accessibility improvements */
.form-input:focus {
  box-shadow: 0 0 0 3px rgba(117, 174, 147, 0.1);
}

/* Animation for error messages */
.form-error {
  animation: slideDown 0.3s ease-out;
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
</style>
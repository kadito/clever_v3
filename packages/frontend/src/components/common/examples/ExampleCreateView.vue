<template>
  <ContentCreateTemplate
    content-type="examples"
    create-title="Criar Exemplo"
    subtitle="Adicionar um novo exemplo ao sistema"
    cancel-route="/examples"
    :form-sections="createFormSections"
    :is-loading="isLoading"
    :is-saving="isSaving"
    :error="error"
    :custom-validator="validateExample"
    @create="handleCreate"
    @cancel="handleCancel"
    @clear-error="clearError"
  >
    <!-- Custom sections for creation -->
    <template #createSections="{ formData, errors }">
      <div class="bg-blue-50 rounded-touch p-4 border border-blue-200">
        <h3 class="text-sm font-medium text-blue-800 mb-2">Informação de Criação</h3>
        <p class="text-xs text-blue-600">
          Este exemplo será criado com todos os campos obrigatórios.
        </p>
      </div>
    </template>
  </ContentCreateTemplate>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import ContentCreateTemplate from '../ContentCreateTemplate.vue';
import type { FormSection } from '../types';

const router = useRouter();

// State
const isLoading = ref(false);
const isSaving = ref(false);
const error = ref<string | null>(null);

// Form configuration for creation
const createFormSections = computed((): FormSection[] => [
  {
    key: 'basic',
    title: 'Informação Básica',
    description: 'Campos obrigatórios para criar um exemplo',
    fields: [
      {
        key: 'name',
        label: 'Nome',
        type: 'text',
        placeholder: 'Digite o nome do exemplo',
        required: true,
        help: 'Nome único para identificar o exemplo',
      },
      {
        key: 'email',
        label: 'Email',
        type: 'email',
        placeholder: 'exemplo@empresa.com',
        required: true,
      },
      {
        key: 'phone',
        label: 'Telefone',
        type: 'tel',
        placeholder: '+351 912 345 678',
        required: false,
      },
    ],
  },
  {
    key: 'details',
    title: 'Detalhes',
    fields: [
      {
        key: 'description',
        label: 'Descrição',
        type: 'textarea',
        placeholder: 'Descreva o exemplo...',
        rows: 4,
        required: true,
        fullWidth: true,
      },
      {
        key: 'category',
        label: 'Categoria',
        type: 'select',
        required: true,
        options: [
          { value: 'type1', label: 'Tipo 1' },
          { value: 'type2', label: 'Tipo 2' },
          { value: 'type3', label: 'Tipo 3' },
        ],
      },
      {
        key: 'active',
        label: 'Ativo',
        type: 'checkbox',
        checkboxLabel: 'Marcar como ativo',
        required: false,
      },
    ],
  },
]);

// Custom validation for creation
const validateExample = (data: Record<string, any>): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  // Custom business rules for creation
  if (data.name && data.name.length < 3) {
    errors.name = 'Nome deve ter pelo menos 3 caracteres';
  }
  
  if (data.email && !data.email.includes('@')) {
    errors.email = 'Email deve conter @';
  }
  
  if (data.phone && data.phone.length > 0 && data.phone.length < 9) {
    errors.phone = 'Telefone deve ter pelo menos 9 dígitos';
  }
  
  return errors;
};

// Event handlers
const handleCreate = async (data: Record<string, any>) => {
  try {
    isSaving.value = true;
    error.value = null;
    
    // Simulate API call

    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Navigate back to list
    router.push('/examples');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao criar exemplo';
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = () => {
  router.push('/examples');
};

const clearError = () => {
  error.value = null;
};
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
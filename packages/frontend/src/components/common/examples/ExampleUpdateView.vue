<template>
  <ContentUpdateTemplate
    :item="item"
    content-type="examples"
    edit-title="Editar Exemplo"
    subtitle="Atualizar informações do exemplo"
    cancel-route="/examples"
    :form-sections="updateFormSections"
    :is-loading="isLoading"
    :is-saving="isSaving"
    :error="error"
    :disabled-fields="disabledFields"
    :read-only-fields="readOnlyFields"
    :custom-validator="validateExampleUpdate"
    @update="handleUpdate"
    @cancel="handleCancel"
    @clear-error="clearError"
  >
    <!-- Custom sections for updates -->
    <template #updateSections="{ formData, errors }">
      <div class="bg-amber-50 rounded-touch p-4 border border-amber-200">
        <h3 class="text-sm font-medium text-amber-800 mb-2">
          Informação de Atualização
        </h3>
        <div class="text-xs text-amber-600 space-y-1">
          <p><strong>Criado:</strong> {{ formatDate(item?.createdAt) }}</p>
          <p><strong>Última atualização:</strong> {{ formatDate(item?.updatedAt) }}</p>
          <p><strong>Versão:</strong> {{ item?.version }}</p>
        </div>
      </div>
    </template>
  </ContentUpdateTemplate>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import ContentUpdateTemplate from '../ContentUpdateTemplate.vue';
import type { FormSection } from '../types';
import type { BaseContent } from '@clever/shared';

const router = useRouter();
const route = useRoute();

// Props
interface Props {
  item: BaseContent | null;
}

const props = defineProps<Props>();

// State
const isLoading = ref(false);
const isSaving = ref(false);
const error = ref<string | null>(null);

// Fields that should be disabled during update
const disabledFields = ref(['createdAt', 'uuid']);

// Fields that should be read-only during update
const readOnlyFields = ref(['email']); // Example: email can't be changed after creation

// Form configuration for updates (similar to create but with different behavior)
const updateFormSections = computed((): FormSection[] => [
  {
    key: 'basic',
    title: 'Informação Básica',
    description: 'Campos editáveis do exemplo',
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
        help: 'Email não pode ser alterado após criação',
        // This will be marked as readonly by the template
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
  {
    key: 'audit',
    title: 'Informação do Sistema',
    description: 'Campos gerados automaticamente pelo sistema',
    fields: [
      {
        key: 'uuid',
        label: 'ID Único',
        type: 'text',
        disabled: true,
        help: 'Identificador único gerado automaticamente',
      },
      {
        key: 'createdAt',
        label: 'Data de Criação',
        type: 'text',
        disabled: true,
        help: 'Data e hora de criação do registro',
      },
    ],
  },
]);

// Custom validation for updates (more lenient than creation)
const validateExampleUpdate = (data: Record<string, any>): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Custom business rules for updates
  if (data.name && data.name.length < 3) {
    errors.name = 'Nome deve ter pelo menos 3 caracteres';
  }

  // Phone validation is more lenient on updates - allow empty
  if (data.phone && data.phone.length > 0 && data.phone.length < 9) {
    errors.phone = 'Telefone deve ter pelo menos 9 dígitos';
  }

  // Don't validate email since it's readonly

  return errors;
};

// Utility functions
const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';

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
const handleUpdate = async (data: Record<string, any>) => {
  try {
    isSaving.value = true;
    error.value = null;

    // Simulate API call

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Navigate back to detail view
    router.push(`/examples/${props.item?.uuid}`);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao atualizar exemplo';
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = () => {
  // Navigate back to detail view
  if (props.item?.uuid) {
    router.push(`/examples/${props.item.uuid}`);
  } else {
    router.push('/examples');
  }
};

const clearError = () => {
  error.value = null;
};
</script>

<style scoped>
/* Component-specific styles if needed */
</style>

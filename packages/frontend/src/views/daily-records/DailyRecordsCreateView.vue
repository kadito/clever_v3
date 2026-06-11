<template>
  <ContentFormTemplate
    :form-sections="[]"
    :is-saving="isSaving"
    :error="error"
    :is-editing="false"
    create-title="Novo Registo Diário"
    subtitle="Criar um novo registo de atividade diária no sistema"
    cancel-route="/daily-records"
    :validate-on-submit="false"
    @submit="handleSubmit"
    @cancel="handleCancel"
    @clear-error="clearError"
  >
    <!-- Custom form content -->
    <template #customSections="{ formData: templateFormData, errors, updateFieldValue: templateUpdateFieldValue }">
      <div class="pb-48 sm:pb-6">
        <!-- Date Section -->
        <div class="form-section">
          <h2 class="section-title">
            Informação Geral
          </h2>
          <p class="section-description">
            Data do registo de atividade diária
          </p>

          <div class="form-field">
            <label class="form-label">
              Data do Registo *
            </label>
            <input
              :value="templateFormData?.dataRegistro || formData.dataRegistro"
              type="date"
              class="form-input"
              :class="{ 'border-red-500': validationErrors.dataRegistro }"
              required
              @input="e => {
                const value = (e.target as HTMLInputElement).value;
                formData.dataRegistro = value;
                templateUpdateFieldValue('dataRegistro', value);
              }"
            >
            <p
              v-if="validationErrors.dataRegistro"
              class="form-error"
            >
              {{ validationErrors.dataRegistro }}
            </p>
            <p class="form-help">
              Data em que as atividades foram realizadas
            </p>
          </div>
        </div>

        <!-- Activities Section -->
        <div class="form-section">
          <div class="section-header">
            <div>
              <h2 class="section-title">
                Atividades
              </h2>
              <p class="section-description">
                Adicione e gerencie as atividades realizadas durante o dia
              </p>
            </div>
          </div>

          <!-- Activities List -->
          <div
            v-if="!formData.atividades || formData.atividades.length === 0"
            class="empty-activities"
          >
            <svg
              class="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p class="empty-text">
              Nenhuma atividade adicionada
            </p>
            <p class="empty-subtext">
              Clique em "Adicionar Atividade" para começar
            </p>
          </div>

          <div
            v-else
            class="activities-list"
          >
            <ActivityCard
              v-for="(activity, index) in formData.atividades"
              :key="index"
              :activity="activity"
              :is-edit-mode="true"
              @activity-updated="handleActivityUpdate(index, $event, templateUpdateFieldValue)"
              @activity-removed="removeActivity(index, templateUpdateFieldValue)"
            />
          </div>

          <!-- Add Activity Button -->
          <button
            type="button"
            class="add-activity-button-bottom"
            :disabled="isSaving"
            @click="addActivity(templateUpdateFieldValue)"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Adicionar Atividade</span>
          </button>

          <p
            v-if="validationErrors.activities"
            class="form-error mt-4"
          >
            {{ validationErrors.activities }}
          </p>
        </div>

        <!-- Summary Section -->
        <div
          v-if="formData.atividades && formData.atividades.length > 0"
          class="summary-section mb-32"
        >
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">Atividades</span>
              <span class="summary-value">{{ formData.atividades.length }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Total Horas</span>
              <span class="summary-value">{{ totalHours }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </ContentFormTemplate>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { Activity, DailyRecordCreationData } from '@clever/shared';
import { validateDailyRecordCreation, minutesToTime } from '@clever/shared';
import ContentFormTemplate from '@/components/common/ContentFormTemplate.vue';
import ActivityCard from '@/components/daily-records/ActivityCard.vue';
import { useApi } from '@/composables/useApi';

const router = useRouter();

// API composable
const api = useApi('daily-records');

// State
const isSaving = ref(false);
const error = ref<string | null>(null);

// Form data - include activities in the form data object
const formData = reactive<{ dataRegistro: string; atividades: Activity[] }>({
  dataRegistro: new Date().toISOString().split('T')[0], // Default to today
  atividades: [], // Activities stored in form data
});

// Computed property for activities (for easier access)
const activities = computed({
  get: () => formData.atividades,
  set: (value: Activity[]) => {
    formData.atividades = value;
  }
});

// Validation errors
const validationErrors = reactive<Record<string, string>>({});

// Clear error function
const clearError = () => {
  error.value = null;
};

// Computed properties
const totalHours = computed(() => {
  if (formData.atividades.length === 0) return '00:00';

  let totalMinutes = 0;

  formData.atividades.forEach(activity => {
    if (activity.totalHoras) {
      const [hours, minutes] = activity.totalHoras.split(':').map(Number);
      totalMinutes += hours * 60 + minutes;
    }
  });

  return minutesToTime(totalMinutes);
});

// Activity management methods
const addActivity = (updateFieldValue: (key: string, value: any) => void) => {
  const newActivity: Activity = {
    tipoAtividade: 'Interno',
    assunto: '',
    horaInicio: '',
    horaFim: '',
    tempoPausa: 0,
    totalHoras: '00:00',
    descricao: '',
    tipoLigacao: 'Nenhuma',
  };

  formData.atividades.push(newActivity);
  // Sync with template form data
  updateFieldValue('atividades', [...formData.atividades]);
  console.log('Activity added. Total activities:', formData.atividades.length);
  console.log('Activities array:', JSON.stringify(formData.atividades, null, 2));
};

const handleActivityUpdate = (index: number, updatedActivity: Activity, updateFieldValue: (key: string, value: any) => void) => {
  console.log(`Activity ${index} updated:`, JSON.stringify(updatedActivity, null, 2));
  formData.atividades[index] = updatedActivity;
  // Sync with template form data
  updateFieldValue('atividades', [...formData.atividades]);
  console.log('All activities after update:', JSON.stringify(formData.atividades, null, 2));
};

const removeActivity = (index: number, updateFieldValue: (key: string, value: any) => void) => {
  formData.atividades.splice(index, 1);
  // Sync with template form data
  updateFieldValue('atividades', [...formData.atividades]);
};

// Validation
const validateForm = (): boolean => {
  // Clear previous errors
  Object.keys(validationErrors).forEach(key => {
    delete validationErrors[key];
  });

  // Transform form data to DailyRecordCreationData format for validation
  const dailyRecordData = {
    dataRegistro: formData.dataRegistro,
    atividades: activities.value,
  };

  console.log('Validating daily record data:', JSON.stringify(dailyRecordData, null, 2));

  // Use the comprehensive validation from shared package
  const errors = validateDailyRecordCreation(dailyRecordData);
  console.log('Validation errors:', errors);

  // Convert array of error messages to field-specific errors
  errors.forEach(errorMessage => {
    if (errorMessage.includes('Data do registo é obrigatória')) {
      validationErrors.dataRegistro = errorMessage;
    } else if (errorMessage.includes('Data do registo deve ser uma data válida')) {
      validationErrors.dataRegistro = errorMessage;
    } else if (errorMessage.includes('Pelo menos uma atividade é obrigatória')) {
      validationErrors.activities = errorMessage;
    } else if (errorMessage.startsWith('Atividade')) {
      // Activity-specific errors - show in general activities error
      if (!validationErrors.activities) {
        validationErrors.activities = errorMessage;
      } else {
        validationErrors.activities += `\n${  errorMessage}`;
      }
    } else {
      // Generic error
      validationErrors.general = errorMessage;
    }
  });

  console.log('Field errors:', JSON.stringify(validationErrors, null, 2));
  console.log('Form validation result - has errors:', Object.keys(validationErrors).length > 0);

  return Object.keys(validationErrors).length === 0;
};

// Form submission
const handleSubmit = async (submittedData?: Record<string, any>) => {
  console.log('🚀 handleSubmit called');
  console.log('Submitted data from template:', JSON.stringify(submittedData, null, 2));
  console.log('Local form data:', JSON.stringify(formData, null, 2));
  
  // Merge submitted data with local formData to ensure we have all fields
  const dataToSubmit = {
    ...formData,
    ...submittedData,
  };
  console.log('Data to submit:', JSON.stringify(dataToSubmit, null, 2));
  console.log('Activities count:', dataToSubmit.atividades?.length || 0);

  // Update local formData with merged data to ensure validation uses correct data
  Object.assign(formData, dataToSubmit);

  // Validate form
  if (!validateForm()) {
    console.log('Validation failed, not submitting');
    error.value = 'Por favor, corrija os erros no formulário';
    return;
  }

  try {
    isSaving.value = true;
    clearError();

    // Transform form data to DailyRecordCreationData format
    const dailyRecordData: DailyRecordCreationData = {
      dataRegistro: dataToSubmit.dataRegistro,
      atividades: dataToSubmit.atividades || [],
    };

    console.log('Creating daily record with data:', JSON.stringify(dailyRecordData, null, 2));

    const response = await api.create({ data: dailyRecordData } as any);

    if (api.error.value) {
      console.error('Create operation failed with API error:', JSON.stringify(api.error.value, null, 2));
      error.value = typeof api.error.value === 'string'
        ? api.error.value
        : api.error.value.message || 'Erro ao criar registo diário';
      return;
    }

    if (response) {
      console.log('Daily record created successfully:', JSON.stringify(response, null, 2));
      // Navigate to the new daily record's detail page
      router.push(`/daily-records/${response.uuid}`);
    } else {
      throw new Error('Erro ao criar registo diário');
    }
  } catch (err) {
    console.error('Error creating daily record:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao criar registo diário';
  } finally {
    isSaving.value = false;
  }
};

// Cancel handler
const handleCancel = () => {
  router.push('/daily-records');
};
</script>

<style scoped>
/* Form Section */
.form-section {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6;
}

.section-header {
  @apply flex items-start justify-between gap-4 mb-6;
}

.section-title {
  @apply text-lg font-semibold text-gray-900 mb-1;
}

.section-description {
  @apply text-sm text-gray-600;
}

/* Form Fields */
.form-field {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700;
}

.form-input {
  @apply block w-full rounded-touch border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500;
  min-height: 44px;
  font-size: 16px; /* Prevent zoom on iOS */
}

.form-error {
  @apply text-red-600 text-sm mt-1;
}

.form-help {
  @apply text-xs text-gray-500 mt-1;
}

/* Add Activity Button */
.add-activity-button-bottom {
  @apply w-full flex items-center justify-center gap-2 px-4 py-3 mt-4 bg-primary-600 text-white rounded-touch hover:bg-primary-700 transition-colors font-medium;
  min-height: 44px;
}

.add-activity-button-bottom:disabled {
  @apply bg-gray-300 cursor-not-allowed;
}

/* Empty State */
.empty-activities {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

.empty-text {
  @apply text-gray-700 font-medium mt-4;
}

.empty-subtext {
  @apply text-gray-500 text-sm mt-1;
}

/* Activities List */
.activities-list {
  @apply space-y-4;
}

/* Summary Section */
.summary-section {
  @apply bg-primary-50 rounded-lg border border-primary-200 p-4;
}

.summary-grid {
  @apply grid grid-cols-2 gap-4;
}

.summary-item {
  @apply flex flex-col items-center text-center;
}

.summary-label {
  @apply text-sm text-primary-700 font-medium mb-1;
}

.summary-value {
  @apply text-3xl font-bold text-primary-900;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .form-section {
    @apply p-4;
  }

  .section-header {
    @apply flex-col items-start;
  }

  .summary-grid {
    @apply grid-cols-2;
  }
}
</style>

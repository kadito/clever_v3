<template>
  <div v-if="isLoadingRecord" class="loading-container">
    <div class="loading-spinner">
      <svg
        class="animate-spin w-8 h-8 text-primary-600"
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
      <p class="loading-text">A carregar registo diário...</p>
    </div>
  </div>

  <ContentFormTemplate
    v-else-if="formData"
    :form-sections="[]"
    :is-saving="isSaving"
    :error="error"
    :is-editing="true"
    edit-title="Editar Registo Diário"
    subtitle="Atualizar informações do registo de atividade diária"
    :cancel-route="`/daily-records/${dailyRecordUuid}`"
    :validate-on-submit="false"
    @submit="handleSubmit"
    @cancel="handleCancel"
    @clear-error="clearError"
  >
    <!-- Custom form content -->
    <template #customSections="{ formData: templateFormData, errors, updateFieldValue: templateUpdateFieldValue }">
      <div class="pb-32 sm:pb-6">
      <!-- Date Section -->
      <div class="form-section">
        <h2 class="section-title">Informação Geral</h2>
        <p class="section-description">Data do registo de atividade diária</p>

        <div class="form-field">
          <label class="form-label">
            Data do Registo *
          </label>
          <input
            v-model="formData.dataRegistro"
            type="date"
            class="form-input"
            :class="{ 'border-red-500': validationErrors.dataRegistro }"
            required
          />
          <p v-if="validationErrors.dataRegistro" class="form-error">
            {{ validationErrors.dataRegistro }}
          </p>
          <p class="form-help">Data em que as atividades foram realizadas</p>
        </div>
      </div>

      <!-- Activities Section -->
      <div class="form-section">
        <div class="section-header">
          <div>
            <h2 class="section-title">Atividades</h2>
            <p class="section-description">
              Adicione e gerencie as atividades realizadas durante o dia
            </p>
          </div>
        </div>

        <!-- Activities List -->
        <div v-if="activities.length === 0" class="empty-activities">
          <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p class="empty-text">Nenhuma atividade adicionada</p>
          <p class="empty-subtext">Clique em "Adicionar Atividade" para começar</p>
        </div>

        <div v-else class="activities-list">
          <ActivityCard
            v-for="(activity, index) in activities"
            :key="index"
            :activity="activity"
            :is-edit-mode="true"
            @activity-updated="handleActivityUpdate(index, $event)"
            @activity-removed="removeActivity(index)"
          />
        </div>

        <!-- Add Activity Button -->
        <button
          type="button"
          class="add-activity-button-bottom"
          @click="addActivity"
          :disabled="isSaving"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Adicionar Atividade</span>
        </button>

        <p v-if="validationErrors.activities" class="form-error mt-4">
          {{ validationErrors.activities }}
        </p>
      </div>

      <!-- Summary Section -->
      <div v-if="activities.length > 0" class="summary-section mb-32">
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Atividades</span>
            <span class="summary-value">{{ activities.length }}</span>
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
import { ref, computed, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { Activity, DailyRecordUpdateData, DailyRecord, ContentWithRelations } from '@clever/shared';
import { validateDailyRecordCreation, minutesToTime } from '@clever/shared';
import ContentFormTemplate from '@/components/common/ContentFormTemplate.vue';
import ActivityCard from '@/components/daily-records/ActivityCard.vue';
import { useApi } from '@/composables/useApi';

const router = useRouter();
const route = useRoute();

// API composable
const api = useApi<DailyRecord>('daily-records');

// State
const isLoadingRecord = ref(true);
const isSaving = ref(false);
const error = ref<string | null>(null);
const dailyRecordUuid = ref<string>('');

// Form data
const formData = reactive<{ dataRegistro: string }>({
  dataRegistro: '',
});

// Activities array
const activities = ref<Activity[]>([]);

// Validation errors
const validationErrors = reactive<Record<string, string>>({});

// Clear error function
const clearError = () => {
  error.value = null;
};

// Computed properties
const totalHours = computed(() => {
  if (activities.value.length === 0) return '00:00';

  let totalMinutes = 0;

  activities.value.forEach(activity => {
    if (activity.totalHoras) {
      const [hours, minutes] = activity.totalHoras.split(':').map(Number);
      totalMinutes += hours * 60 + minutes;
    }
  });

  return minutesToTime(totalMinutes);
});

// Activity management methods
const addActivity = () => {
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

  activities.value.push(newActivity);
};

const handleActivityUpdate = (index: number, updatedActivity: Activity) => {
  activities.value[index] = updatedActivity;
};

const removeActivity = (index: number) => {
  activities.value.splice(index, 1);
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

  console.log('Validating daily record update data:', JSON.stringify(dailyRecordData, null, 2));

  // Use the same comprehensive validation as creation
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
        validationErrors.activities += '\n' + errorMessage;
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

// Load existing daily record
const loadDailyRecord = async () => {
  const uuid = route.params.uuid as string;
  if (!uuid) {
    error.value = 'UUID do registo diário não fornecido';
    isLoadingRecord.value = false;
    return;
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    console.error('Invalid UUID format:', uuid);
    error.value = 'UUID inválido';
    isLoadingRecord.value = false;
    return;
  }

  dailyRecordUuid.value = uuid;

  try {
    console.log('Loading daily record for editing:', uuid);
    await api.fetchById(uuid);

    if (api.error.value) {
      console.error('Error loading daily record:', JSON.stringify(api.error.value, null, 2));
      error.value = typeof api.error.value === 'string' 
        ? api.error.value 
        : api.error.value.message || 'Erro ao carregar registo diário';
      isLoadingRecord.value = false;
      return;
    }

    if (api.currentItem.value) {
      const dailyRecord = api.currentItem.value as ContentWithRelations<DailyRecord['data']>;
      
      console.log('Daily record loaded successfully:', JSON.stringify(dailyRecord, null, 2));

      // Pre-populate form data
      formData.dataRegistro = dailyRecord.data.dataRegistro;
      
      // Pre-populate activities (deep copy to avoid reference issues)
      activities.value = JSON.parse(JSON.stringify(dailyRecord.data.atividades || []));

      console.log('Form pre-populated with:', JSON.stringify({
        dataRegistro: formData.dataRegistro,
        activitiesCount: activities.value.length,
      }, null, 2));
    } else {
      error.value = 'Registo diário não encontrado';
    }
  } catch (err) {
    console.error('Error loading daily record:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao carregar registo diário';
  } finally {
    isLoadingRecord.value = false;
  }
};

// Form submission
const handleSubmit = async () => {
  console.log('🚀 handleSubmit called for update');

  // Validate form
  if (!validateForm()) {
    console.log('Validation failed, not submitting');
    error.value = 'Por favor, corrija os erros no formulário';
    return;
  }

  try {
    isSaving.value = true;
    clearError();

    // Transform form data to DailyRecordUpdateData format
    const dailyRecordData: DailyRecordUpdateData = {
      dataRegistro: formData.dataRegistro,
      atividades: activities.value,
    };

    console.log('Updating daily record with data:', JSON.stringify(dailyRecordData, null, 2));

    const response = await api.update(dailyRecordUuid.value, { data: dailyRecordData } as any);

    if (api.error.value) {
      console.error('Update operation failed with API error:', JSON.stringify(api.error.value, null, 2));
      error.value = typeof api.error.value === 'string'
        ? api.error.value
        : api.error.value.message || 'Erro ao atualizar registo diário';
      return;
    }

    if (response) {
      console.log('Daily record updated successfully:', JSON.stringify(response, null, 2));
      // Navigate to the updated daily record's detail page
      router.push(`/daily-records/${dailyRecordUuid.value}`);
    } else {
      throw new Error('Erro ao atualizar registo diário');
    }
  } catch (err) {
    console.error('Error updating daily record:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao atualizar registo diário';
  } finally {
    isSaving.value = false;
  }
};

// Cancel handler
const handleCancel = () => {
  if (dailyRecordUuid.value) {
    router.push(`/daily-records/${dailyRecordUuid.value}`);
  } else {
    router.push('/daily-records');
  }
};

// Lifecycle
onMounted(() => {
  loadDailyRecord();
});
</script>

<style scoped>
/* Loading State */
.loading-container {
  @apply flex items-center justify-center min-h-screen;
}

.loading-spinner {
  @apply flex flex-col items-center gap-4;
}

.loading-text {
  @apply text-gray-600 font-medium;
}

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

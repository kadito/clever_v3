<template>
  <ContentDetailTemplate
    :item="dailyRecord"
    :is-loading="isLoading"
    :error="error"
    back-route="/daily-records"
    :show-edit-button="true"
    :show-delete-button="permissions.canDelete"
    :show-meta-bar="true"
    :show-audit-trail="permissions.canViewAuditTrail"
    :show-mobile-actions="true"
    :get-title="getDailyRecordTitle"
    :get-subtitle="getDailyRecordSubtitle"
    :get-status="getDailyRecordStatus"
    delete-button-text="Eliminar"
    confirm-delete-title="Confirmar Eliminação"
    confirm-delete-message="Tem a certeza que pretende eliminar este registo diário?"
    @edit="handleEdit"
    @delete="handleDelete"
    @back="handleBack"
    @clear-error="clearError"
  >
    <!-- Custom content sections -->
    <template #content="{ item }">
      <div v-if="item && item.data" class="space-y-6">
        <!-- Date Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Data do Registo</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-grid">
                <div class="detail-item">
                  <label class="detail-label">Data</label>
                  <div class="detail-value">{{ formatDate(item.data.dataRegistro) }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Total de Atividades</label>
                  <div class="detail-value">{{ item.data.atividades?.length || 0 }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Total de Horas</label>
                  <div class="detail-value">{{ calculateTotalHours(item.data.atividades) }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Técnico Responsável</label>
                  <div class="detail-value">{{ getTechnicianDisplayName(item.data.technician) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Activities Section -->
        <div
          v-for="(activity, index) in item.data.atividades"
          :key="index"
          class="detail-section"
        >
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 rounded-t-touch"
              :class="{
                'bg-blue-50': activity.tipoAtividade === 'Interno',
                'bg-green-50': activity.tipoAtividade === 'Externo',
              }"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <span class="activity-number">{{ index + 1 }}</span>
                  <h2 class="text-lg font-semibold text-gray-900">
                    {{ activity.assunto }}
                  </h2>
                  <span
                    class="activity-type-badge"
                    :class="{
                      'badge-blue': activity.tipoAtividade === 'Interno',
                      'badge-green': activity.tipoAtividade === 'Externo',
                    }"
                  >
                    {{ activity.tipoAtividade }}
                  </span>
                </div>
              </div>
            </div>
            <div class="p-4 sm:p-6">
              <!-- Time Information -->
              <div class="detail-grid mb-6">
                <div class="detail-item">
                  <label class="detail-label">Hora Início</label>
                  <div class="detail-value">{{ activity.horaInicio }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Hora Fim</label>
                  <div class="detail-value">{{ activity.horaFim }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Tempo de Pausa</label>
                  <div class="detail-value">{{ activity.tempoPausa }} minutos</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Total de Horas</label>
                  <div class="detail-value font-semibold text-primary-600">
                    {{ activity.totalHoras }}
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div v-if="activity.descricao" class="mb-6">
                <label class="detail-label">Descrição</label>
                <div class="detail-value whitespace-pre-line">{{ activity.descricao }}</div>
              </div>

              <!-- Link Information -->
              <div class="mb-6">
                <label class="detail-label">Tipo de Ligação</label>
                <div class="detail-value">
                  <span
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    :class="{
                      'bg-gray-100 text-gray-800': activity.tipoLigacao === 'Nenhuma',
                      'bg-purple-100 text-purple-800': activity.tipoLigacao === 'Folha de Obra',
                      'bg-orange-100 text-orange-800':
                        activity.tipoLigacao === 'Assistência Remota',
                    }"
                  >
                    {{ activity.tipoLigacao }}
                  </span>
                </div>
              </div>

              <!-- Work Sheet Relation -->
              <div
                v-if="activity.tipoLigacao === 'Folha de Obra' && activity.workSheetId"
                class="relation-section"
              >
                <RelationInfoDisplay
                  :relation-data="getActivityRelation(index, 'workSheet')"
                  relation-type="work-sheet"
                  :relation-id="activity.workSheetId"
                  custom-display-name="Folha de Obra Associada"
                  :custom-fields="[
                    { key: 'tipoServico', label: 'Tipo de Serviço' },
                    { key: 'dataAssistencia', label: 'Data da Assistência' },
                    { key: 'clientName', label: 'Cliente' },
                    { key: 'totalHoras', label: 'Total de Horas' },
                  ]"
                />
              </div>

              <!-- Remote Assistance Relation -->
              <div
                v-if="
                  activity.tipoLigacao === 'Assistência Remota' && activity.remoteAssistanceId
                "
                class="relation-section"
              >
                <RelationInfoDisplay
                  :relation-data="getActivityRelation(index, 'remoteAssistance')"
                  relation-type="remote-assistance"
                  :relation-id="activity.remoteAssistanceId"
                  custom-display-name="Assistência Remota Associada"
                  :custom-fields="[
                    { key: 'tipoAssistencia', label: 'Tipo de Assistência' },
                    { key: 'dataAssistencia', label: 'Data da Assistência' },
                    { key: 'clientName', label: 'Cliente' },
                    { key: 'duracao', label: 'Duração' },
                  ]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </ContentDetailTemplate>

  <!-- Delete Confirmation Dialog -->
  <ConfirmationDialog
    :is-open="showDeleteConfirm"
    :title="confirmDeleteTitle"
    :message="confirmDeleteMessage"
    :is-loading="isDeleting"
    confirm-text="Confirmar"
    cancel-text="Cancelar"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
    @close="cancelDelete"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { DailyRecord, BaseContent, ContentWithRelations, Activity, TechnicianUser } from '@clever/shared';
import ContentDetailTemplate from '@/components/common/ContentDetailTemplate.vue';
import ConfirmationDialog from '@/components/common/ConfirmationDialog.vue';
import RelationInfoDisplay from '@/components/common/RelationInfoDisplay.vue';
import { useApi } from '@/composables/useApi';
import { usePermissions } from '@/composables/usePermissions';

// Router
const route = useRoute();
const router = useRouter();

// Composables
const api = useApi<DailyRecord>('daily-records');
const { permissions } = usePermissions();

// State
const dailyRecord = ref<ContentWithRelations<DailyRecord['data']> | null>(null);
const isLoading = computed(() => api.loading.loading.value);
const error = computed(() => api.error.value?.message || null);

// Delete state
const isDeleting = ref(false);
const showDeleteConfirm = ref(false);
const confirmDeleteTitle = ref('Confirmar Eliminação');
const confirmDeleteMessage = ref('');

// Clear error function
const clearError = () => {
  api.clearError();
};

// Display functions for ContentDetailTemplate
const getDailyRecordTitle = (item: BaseContent | null): string => {
  if (!item || !item.data) return 'Registo Diário';
  const record = item as ContentWithRelations<DailyRecord['data']>;
  return `Registo Diário - ${formatDate(record.data.dataRegistro)}`;
};

const getDailyRecordSubtitle = (item: BaseContent | null): string => {
  if (!item || !item.data) return '';
  const record = item as ContentWithRelations<DailyRecord['data']>;
  const activityCount = record.data.atividades?.length || 0;
  const totalHours = calculateTotalHours(record.data.atividades);
  return `${activityCount} ${activityCount === 1 ? 'atividade' : 'atividades'} • ${totalHours} horas`;
};

const getDailyRecordStatus = (item: BaseContent | null): string => {
  if (!item || !item.data) return 'Carregando...';
  const record = item as ContentWithRelations<DailyRecord['data']>;
  const activityCount = record.data.atividades?.length || 0;
  return activityCount > 0 ? 'Completo' : 'Sem Atividades';
};

// Helper functions
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Data inválida';
  }
};

const calculateTotalHours = (activities: Activity[] | undefined): string => {
  if (!activities || activities.length === 0) return '00:00';

  let totalMinutes = 0;

  activities.forEach(activity => {
    if (activity.totalHoras) {
      const [hours, minutes] = activity.totalHoras.split(':').map(Number);
      totalMinutes += hours * 60 + minutes;
    }
  });

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const getActivityRelation = (activityIndex: number, relationType: string) => {
  if (!dailyRecord.value?.relations) return null;

  // Relations for activities are stored with keys like "activity_0_workSheet", "activity_1_remoteAssistance"
  const relationKey = `activity_${activityIndex}_${relationType}`;
  return dailyRecord.value.relations[relationKey] || null;
};

// Helper function to extract technician display name from TechnicianUser object
const getTechnicianDisplayName = (technician: TechnicianUser | string | undefined): string => {
  if (!technician) return '-';
  
  // Handle TechnicianUser object structure
  if (typeof technician === 'object' && technician.firstName && technician.lastName) {
    return `${technician.firstName} ${technician.lastName}`;
  }
  
  // Handle TechnicianUser object with only one name
  if (typeof technician === 'object') {
    if (technician.firstName) return technician.firstName;
    if (technician.lastName) return technician.lastName;
    // Fallback to userId if no names available
    if (technician.userId) return `User ${technician.userId.slice(-8)}`;
  }
  
  // Handle legacy string format (backward compatibility)
  if (typeof technician === 'string') {
    return technician;
  }
  
  return '-';
};

// Event handlers
const handleEdit = (item: BaseContent | null) => {
  if (!item) return;
  const record = item as ContentWithRelations<DailyRecord['data']>;
  router.push(`/daily-records/${record.uuid}/editar`);
};

const handleBack = () => {
  router.push('/daily-records');
};

// Delete functionality
const getDeleteConfirmationMessage = (): string => {
  if (!dailyRecord.value) return 'Tem a certeza que pretende eliminar este registo diário?';

  const date = formatDate(dailyRecord.value.data.dataRegistro);
  const activityCount = dailyRecord.value.data.atividades?.length || 0;

  return `Tem a certeza que pretende eliminar o registo diário de "${date}" com ${activityCount} ${activityCount === 1 ? 'atividade' : 'atividades'}? Esta ação não pode ser desfeita.`;
};

const handleDelete = () => {
  if (!dailyRecord.value) return;

  confirmDeleteMessage.value = getDeleteConfirmationMessage();
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  if (!dailyRecord.value) return;

  try {
    isDeleting.value = true;

    console.log(
      'Attempting to delete daily record:',
      JSON.stringify(
        {
          uuid: dailyRecord.value.uuid,
          date: dailyRecord.value.data.dataRegistro,
          activityCount: dailyRecord.value.data.atividades?.length || 0,
        },
        null,
        2
      )
    );

    const success = await api.remove(dailyRecord.value.uuid);

    // Check if API returned an error
    if (api.error.value) {
      console.error('API returned error:', JSON.stringify(api.error.value, null, 2));
      showDeleteConfirm.value = false;
      return;
    }

    if (success) {
      console.log('Daily record deleted successfully, navigating to /daily-records');
      // Navigate to daily records list after successful deletion
      router.push('/daily-records');
    } else {
      console.error('Delete operation failed - useApi returned false');
      showDeleteConfirm.value = false;
    }
  } catch (err) {
    console.error('Delete operation error:', JSON.stringify(err, null, 2));
    showDeleteConfirm.value = false;
  } finally {
    isDeleting.value = false;
  }
};

const cancelDelete = () => {
  showDeleteConfirm.value = false;
};

// Data loading
const loadDailyRecord = async () => {
  const uuid = route.params.uuid as string;
  if (!uuid) {
    return;
  }

  // Validate UUID format to prevent trying to fetch invalid UUIDs like "create"
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    console.error('Invalid UUID format:', uuid);
    router.push('/daily-records');
    return;
  }

  await api.fetchById(uuid);

  if (api.currentItem.value) {
    dailyRecord.value = api.currentItem.value as ContentWithRelations<DailyRecord['data']>;
  }
};

// Lifecycle
onMounted(() => {
  loadDailyRecord();
});
</script>

<style scoped>
/* Daily record specific styling */
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
    @apply grid-cols-4;
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

/* Activity card styling */
.activity-number {
  @apply inline-flex items-center justify-center w-8 h-8 bg-white text-gray-800 text-sm font-bold rounded-full border-2 border-gray-300;
}

.activity-type-badge {
  @apply px-2 py-1 rounded-full text-xs font-medium;
}

.badge-blue {
  @apply bg-blue-100 text-blue-800;
}

.badge-green {
  @apply bg-green-100 text-green-800;
}

/* Relation section spacing */
.relation-section {
  @apply mt-4;
}

/* Portuguese text optimization */
.detail-value {
  @apply text-portuguese;
}

/* Mobile-first responsive adjustments */
@media (max-width: 640px) {
  .activity-number {
    @apply w-8 h-8 text-sm;
  }

  .activity-type-badge {
    @apply px-2 py-1 text-xs;
  }
}

/* Print styles */
@media print {
  .detail-section {
    break-inside: avoid;
    margin-bottom: 1rem;
  }

  .activity-number {
    border: 2px solid #ccc;
    background: white;
  }
}
</style>

<template>
  <ContentListTemplate
    :items="displayedDailyRecords"
    :is-loading="isLoading"
    :error="error"
    display-name="Registo Diário de Atividade"
    back-route="/"
    :search-query="searchQuery"
    search-placeholder="Pesquisar registos diários..."
    :show-create-button="true"
    create-button-text="Criar Registo Diário"
    empty-icon="📅"
    empty-title="Nenhum registo diário encontrado"
    :empty-message="hasActiveFilters ? 'Não foram encontrados registos para os filtros selecionados' : 'Não há registos diários cadastrados no sistema.'"
    empty-search-message="Não foram encontrados registos diários com o termo pesquisado."
    :get-item-title="getDailyRecordTitle"
    :get-item-subtitle="getDailyRecordSubtitle"
    :get-item-meta1="getDailyRecordMeta1"
    :get-item-meta2="getDailyRecordMeta2"
    :current-page="api.pagination.value.page"
    :total-pages="api.pagination.value.totalPages"
    :total-count="api.pagination.value.total"
    :items-per-page="itemsPerPage"
    :show-pagination="api.pagination.value.total > 0"
    @search="handleSearch"
    @clear-search="handleClearSearch"
    @item-click="handleDailyRecordClick"
    @create="handleCreate"
    @edit="handleEdit"
    @page-change="handlePageChange"
    @items-per-page-change="handleItemsPerPageChange"
    @clear-error="clearError"
  >
    <!-- Custom daily record icon -->
    <template #itemIcon="{ item }">
      <div class="daily-record-icon">
        <div
          class="icon-circle"
          :class="getDailyRecordIconClass(item)"
        >
          {{ getDailyRecordInitials(item) }}
        </div>
      </div>
    </template>

    <!-- Custom daily record meta information -->
    <template #itemMeta="{ item }">
      <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <!-- Collaborator badge -->
        <span class="collaborator-badge">
          <svg
            class="w-3 h-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          {{ (item as ContentWithRelations<DailyRecord['data']>).data.technician ? (item as ContentWithRelations<DailyRecord['data']>).data.technician!.firstName + ' ' + (item as ContentWithRelations<DailyRecord['data']>).data.technician!.lastName : 'Não atribuído' }}
        </span>

        <!-- Date badge -->
        <span class="date-badge">
          <svg
            class="w-3 h-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {{ formatDate(item.data.dataRegistro) }}
        </span>

        <!-- Activity count badge -->
        <span class="activity-count-badge">
          <svg
            class="w-3 h-3 mr-1"
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
          {{ getActivityCount(item) }} {{ getActivityCount(item) === 1 ? 'atividade' : 'atividades' }}
        </span>

        <!-- Total hours badge -->
        <span class="total-hours-badge">
          <svg
            class="w-3 h-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {{ getTotalHours(item) }}
        </span>

        <!-- Activity type breakdown -->
        <div
          v-if="getActivityTypeBreakdown(item)"
          class="flex flex-wrap gap-1"
        >
          <span
            v-if="getActivityTypeBreakdown(item).interno > 0"
            class="activity-type-badge bg-blue-100 text-blue-800"
          >
            <svg
              class="w-3 h-3 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            {{ getActivityTypeBreakdown(item).interno }} Interno{{ getActivityTypeBreakdown(item).interno > 1 ? 's' : '' }}
          </span>
          <span
            v-if="getActivityTypeBreakdown(item).externo > 0"
            class="activity-type-badge bg-green-100 text-green-800"
          >
            <svg
              class="w-3 h-3 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {{ getActivityTypeBreakdown(item).externo }} Externo{{ getActivityTypeBreakdown(item).externo > 1 ? 's' : '' }}
          </span>
        </div>

        <!-- Linked content indicators -->
        <div
          v-if="hasLinkedContent(item)"
          class="flex flex-wrap gap-1"
        >
          <span
            v-if="hasWorkSheetLinks(item)"
            class="linked-content-badge bg-purple-100 text-purple-800"
          >
            <svg
              class="w-3 h-3 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Folhas de Obra
          </span>
          <span
            v-if="hasRemoteAssistanceLinks(item)"
            class="linked-content-badge bg-indigo-100 text-indigo-800"
          >
            <svg
              class="w-3 h-3 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Assistências Remotas
          </span>
        </div>
      </div>
    </template>
    <!-- Filters slot -->
    <template #filters>
      <DailyRecordsFilters
        :collaborators="collaborators"
        :selected-collaborator="selectedCollaborator"
        :selected-date="selectedDate"
        :is-loading-collaborators="isLoadingCollaborators"
        @update:selected-collaborator="selectedCollaborator = $event"
        @update:selected-date="selectedDate = $event"
      />
    </template>
  </ContentListTemplate>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { DailyRecord, BaseContent, ContentWithRelations, Activity } from '@clever/shared';
import ContentListTemplate from '@/components/common/ContentListTemplate.vue';
import DailyRecordsFilters from '@/components/daily-records/DailyRecordsFilters.vue';
import { useApi } from '@/composables/useApi';
import { useDailyRecordsFilters } from '@/composables/useDailyRecordsFilters';
import { useErrorHandler } from '@/composables/useErrorHandler';

// Router
const router = useRouter();

// Composables
const api = useApi<DailyRecord>('daily-records');
const errorHandler = useErrorHandler();
const {
  selectedCollaborator,
  selectedDate,
  collaborators,
  isLoadingCollaborators,
  hasActiveFilters,
  filterParams,
  fetchCollaborators,
} = useDailyRecordsFilters();

// State
const dailyRecords = ref<ContentWithRelations<DailyRecord['data']>[]>([]);
const isLoading = ref(false);
const searchQuery = ref('');
const error = ref<string | null>(null);
const hasFetched = ref(false);
const itemsPerPage = ref(10);

// Clear error function
const clearError = () => {
  error.value = null;
};

// Computed properties
const displayedDailyRecords = computed(() => {
  if (!searchQuery.value) {
    return dailyRecords.value;
  }

  const query = searchQuery.value.toLowerCase();
  return dailyRecords.value.filter(record => {
    const data = record.data;

    // Search in date
    if (formatDate(data.dataRegistro).toLowerCase().includes(query)) {
      return true;
    }

    // Search in activities
    return data.atividades.some(activity => {
      return (
        activity.tipoAtividade.toLowerCase().includes(query) ||
        activity.assunto.toLowerCase().includes(query) ||
        activity.descricao?.toLowerCase().includes(query) ||
        (activity.tipoLigacao !== 'Nenhuma' && activity.tipoLigacao.toLowerCase().includes(query))
      );
    });
  });
});

// Display functions for ContentListTemplate
const getDailyRecordTitle = (item: BaseContent): string => {
  const record = item as ContentWithRelations<DailyRecord['data']>;
  return formatDate(record.data.dataRegistro);
};

const getDailyRecordSubtitle = (item: BaseContent): string => {
  const record = item as ContentWithRelations<DailyRecord['data']>;
  const parts = [];

  // Get first activity subject as preview
  if (record.data.atividades.length > 0) {
    const firstActivity = record.data.atividades[0];
    const subject =
      firstActivity.assunto.length > 50
        ? `${firstActivity.assunto.substring(0, 50)}...`
        : firstActivity.assunto;
    parts.push(subject);
  }

  // Add activity count if more than one
  if (record.data.atividades.length > 1) {
    parts.push(`+${record.data.atividades.length - 1} mais`);
  }

  return parts.join(' • ');
};

const getDailyRecordMeta1 = (item: BaseContent): string => {
  const record = item as ContentWithRelations<DailyRecord['data']>;
  const count = getActivityCount(record);
  return `${count} ${count === 1 ? 'atividade' : 'atividades'}`;
};

const getDailyRecordMeta2 = (item: BaseContent): string => {
  const record = item as ContentWithRelations<DailyRecord['data']>;
  return getTotalHours(record);
};

// Helper functions for custom template slots
const getDailyRecordInitials = (item: BaseContent): string => {
  const record = item as ContentWithRelations<DailyRecord['data']>;
  
  // Use day of month as initials
  const date = new Date(record.data.dataRegistro);
  const day = date.getDate();
  return day.toString();
};

const getDailyRecordIconClass = (item: BaseContent): string => {
  const record = item as ContentWithRelations<DailyRecord['data']>;
  
  // Color based on activity types
  const breakdown = getActivityTypeBreakdown(record);
  
  if (breakdown.interno > 0 && breakdown.externo > 0) {
    return 'bg-gradient-to-br from-blue-500 to-green-500 text-white'; // Mixed
  } else if (breakdown.interno > 0) {
    return 'bg-blue-500 text-white'; // Internal only
  } else if (breakdown.externo > 0) {
    return 'bg-green-500 text-white'; // External only
  }
  
  return 'bg-gray-500 text-white'; // Default
};

const getActivityCount = (item: BaseContent): number => {
  const record = item as ContentWithRelations<DailyRecord['data']>;
  return record.data.atividades.length;
};

const getTotalHours = (item: BaseContent): string => {
  const record = item as ContentWithRelations<DailyRecord['data']>;
  
  // Sum all activity hours
  let totalMinutes = 0;
  
  record.data.atividades.forEach(activity => {
    if (activity.totalHoras) {
      const [hours, minutes] = activity.totalHoras.split(':').map(Number);
      totalMinutes += hours * 60 + minutes;
    }
  });
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const getActivityTypeBreakdown = (item: BaseContent): { interno: number; externo: number } => {
  const record = item as ContentWithRelations<DailyRecord['data']>;
  
  const breakdown = {
    interno: 0,
    externo: 0,
  };
  
  record.data.atividades.forEach(activity => {
    if (activity.tipoAtividade === 'Interno') {
      breakdown.interno++;
    } else if (activity.tipoAtividade === 'Externo') {
      breakdown.externo++;
    }
  });
  
  return breakdown;
};

const hasLinkedContent = (item: BaseContent): boolean => {
  const record = item as ContentWithRelations<DailyRecord['data']>;
  return record.data.atividades.some(
    activity => activity.workSheetId || activity.remoteAssistanceId
  );
};

const hasWorkSheetLinks = (item: BaseContent): boolean => {
  const record = item as ContentWithRelations<DailyRecord['data']>;
  return record.data.atividades.some(activity => activity.workSheetId);
};

const hasRemoteAssistanceLinks = (item: BaseContent): boolean => {
  const record = item as ContentWithRelations<DailyRecord['data']>;
  return record.data.atividades.some(activity => activity.remoteAssistanceId);
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-PT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Event handlers
const handleSearch = (query: string) => {
  searchQuery.value = query;
};

const handleClearSearch = () => {
  searchQuery.value = '';
};

const handleDailyRecordClick = (item: BaseContent) => {
  const record = item as ContentWithRelations<DailyRecord['data']>;
  router.push(`/daily-records/${record.uuid}`);
};

const handleCreate = () => {
  router.push('/daily-records/criar');
};

const handleEdit = (item: BaseContent) => {
  const record = item as ContentWithRelations<DailyRecord['data']>;
  router.push(`/daily-records/${record.uuid}/editar`);
};

// Page change handler
const handlePageChange = async (page: number) => {
  isLoading.value = true;
  await api.fetchList({ page, limit: itemsPerPage.value, ...filterParams.value }).then(() => {
    if (api.items.value) {
      dailyRecords.value = (api.items.value as ContentWithRelations<DailyRecord['data']>[]).sort(
        (a, b) => {
          const dateA = new Date(a.data.dataRegistro);
          const dateB = new Date(b.data.dataRegistro);
          const dateDiff = dateB.getTime() - dateA.getTime();
          if (dateDiff !== 0) return dateDiff;
          const createdA = new Date(a.createdAt);
          const createdB = new Date(b.createdAt);
          return createdB.getTime() - createdA.getTime();
        }
      );
    }
  }).catch((err) => {
    console.error('Error changing page:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao carregar registos diários';
  }).finally(() => {
    isLoading.value = false;
  });
};

// Items per page change handler
const handleItemsPerPageChange = async (limit: number) => {
  itemsPerPage.value = limit;
  isLoading.value = true;
  await api.fetchList({ page: 1, limit, ...filterParams.value }).then(() => {
    if (api.items.value) {
      dailyRecords.value = (api.items.value as ContentWithRelations<DailyRecord['data']>[]).sort(
        (a, b) => {
          const dateA = new Date(a.data.dataRegistro);
          const dateB = new Date(b.data.dataRegistro);
          const dateDiff = dateB.getTime() - dateA.getTime();
          if (dateDiff !== 0) return dateDiff;
          const createdA = new Date(a.createdAt);
          const createdB = new Date(b.createdAt);
          return createdB.getTime() - createdA.getTime();
        }
      );
    }
  }).catch((err) => {
    console.error('Error changing items per page:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao carregar registos diários';
  }).finally(() => {
    isLoading.value = false;
  });
};

// Data loading
const loadDailyRecords = async () => {
  try {
    isLoading.value = true;
    clearError();

    console.log('Loading daily records...');
    await api.fetchList({ limit: itemsPerPage.value, ...filterParams.value });

    if (api.items.value) {
      // Sort daily records by date descending (newest first) - as per requirements 12.5
      dailyRecords.value = (api.items.value as ContentWithRelations<DailyRecord['data']>[]).sort(
        (a, b) => {
          // Primary sort: record date (most recent first)
          const dateA = new Date(a.data.dataRegistro);
          const dateB = new Date(b.data.dataRegistro);
          const dateDiff = dateB.getTime() - dateA.getTime();

          if (dateDiff !== 0) return dateDiff;

          // Secondary sort: creation date (most recent first)
          const createdA = new Date(a.createdAt);
          const createdB = new Date(b.createdAt);
          return createdB.getTime() - createdA.getTime();
        }
      );
      console.log(`Loaded ${dailyRecords.value.length} daily records`);
    } else {
      throw new Error('Erro ao carregar registos diários');
    }
  } catch (err) {
    console.error('Error loading daily records:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao carregar registos diários';
  } finally {
    isLoading.value = false;
  }
};

// Watch filter changes — reset page to 1 and re-fetch
watch([selectedCollaborator, selectedDate], async () => {
  isLoading.value = true;
  await api.fetchList({ page: 1, limit: itemsPerPage.value, ...filterParams.value }).then(() => {
    if (api.items.value) {
      dailyRecords.value = (api.items.value as ContentWithRelations<DailyRecord['data']>[]).sort(
        (a, b) => {
          const dateA = new Date(a.data.dataRegistro);
          const dateB = new Date(b.data.dataRegistro);
          const dateDiff = dateB.getTime() - dateA.getTime();
          if (dateDiff !== 0) return dateDiff;
          const createdA = new Date(a.createdAt);
          const createdB = new Date(b.createdAt);
          return createdB.getTime() - createdA.getTime();
        }
      );
    }
  }).catch((err) => {
    console.error('Error applying filters:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao carregar registos diários';
  }).finally(() => {
    isLoading.value = false;
  });
});

// Lifecycle
onMounted(() => {
  console.log('DailyRecordsListView mounted');
  loadDailyRecords();
  fetchCollaborators();
});
</script>

<style scoped>
/* Daily record-specific styling */
.daily-record-icon {
  @apply flex-shrink-0;
}

.icon-circle {
  @apply w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold;
}

.collaborator-badge {
  @apply px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium flex items-center;
}

.date-badge {
  @apply px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium flex items-center;
}

.activity-count-badge {
  @apply px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium flex items-center;
}

.total-hours-badge {
  @apply px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center;
}

.activity-type-badge {
  @apply px-2 py-1 rounded text-xs font-medium flex items-center;
}

.linked-content-badge {
  @apply px-2 py-1 rounded text-xs font-medium flex items-center;
}

/* Mobile-first responsive adjustments */
@media (max-width: 640px) {
  .icon-circle {
    @apply w-8 h-8 text-xs;
  }

  .date-badge,
  .collaborator-badge,
  .activity-count-badge,
  .total-hours-badge,
  .activity-type-badge,
  .linked-content-badge {
    @apply px-1.5 py-0.5 text-xs;
  }
}

/* Portuguese text optimization */
.daily-record-icon,
.collaborator-badge,
.date-badge,
.activity-count-badge,
.total-hours-badge,
.activity-type-badge,
.linked-content-badge {
  @apply text-portuguese;
}

/* Touch-friendly interactions */
@media (hover: none) {
  .collaborator-badge:active,
  .date-badge:active,
  .activity-count-badge:active,
  .total-hours-badge:active,
  .activity-type-badge:active,
  .linked-content-badge:active {
    @apply bg-opacity-80;
  }
}

/* Badge icon styling */
.collaborator-badge svg,
.date-badge svg,
.activity-count-badge svg,
.total-hours-badge svg,
.activity-type-badge svg,
.linked-content-badge svg {
  @apply flex-shrink-0;
}

/* Responsive badge layout */
@media (max-width: 640px) {
  .collaborator-badge svg,
  .date-badge svg,
  .activity-count-badge svg,
  .total-hours-badge svg,
  .activity-type-badge svg,
  .linked-content-badge svg {
    @apply w-2.5 h-2.5;
  }
}
</style>

<template>
  <ContentListTemplate
    :items="displayedWorkSheets"
    :is-loading="isLoading"
    :error="error"
    display-name="Folhas de Obra"
    back-route="/"
    :search-query="searchQuery"
    search-placeholder="Pesquisar folhas de obra..."
    :show-create-button="true"
    create-button-text="Criar Folha de Obra"
    empty-icon="📝"
    empty-title="Nenhuma folha de obra encontrada"
    empty-message="Não há folhas de obra cadastradas no sistema."
    empty-search-message="Não foram encontradas folhas de obra com o termo pesquisado."
    :get-item-title="getWorkSheetTitle"
    :get-item-subtitle="getWorkSheetSubtitle"
    :get-item-meta1="getWorkSheetMeta1"
    :get-item-meta2="getWorkSheetMeta2"
    @search="handleSearch"
    @clear-search="handleClearSearch"
    @item-click="handleWorkSheetClick"
    @create="handleCreate"
    @edit="handleEdit"
    @clear-error="clearError"
  >
    <!-- Custom work sheet icon -->
    <template #itemIcon="{ item }">
      <div class="work-sheet-icon">
        <div class="icon-circle" :class="getWorkSheetIconClass(item)">
          {{ getWorkSheetInitials(item) }}
        </div>
      </div>
    </template>

    <!-- Custom work sheet meta information -->
    <template #itemMeta="{ item }">
      <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <!-- Work sheet status -->
        <span class="work-sheet-status-badge" :class="getWorkSheetStatusClass(item)">
          {{ getWorkSheetStatusText(item) }}
        </span>

        <!-- Assistance date -->
        <span v-if="item.data.request?.assistanceDate" class="flex items-center before:content-['•'] before:mx-1">
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          {{ formatDate(item.data.request.assistanceDate) }}
        </span>

        <!-- Displacement indicator -->
        <span v-if="item.data.displacement?.hasDisplacement" class="displacement-badge">
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Deslocação
        </span>

        <!-- Service type -->
        <span v-if="item.data.otherData?.serviceType" class="flex items-center before:content-['•'] before:mx-1">
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ item.data.otherData.serviceType }}
        </span>

        <!-- Total hours -->
        <span v-if="item.data.request?.totalHours" class="flex items-center before:content-['•'] before:mx-1">
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ item.data.request.totalHours }}h
        </span>

        <!-- Payment method -->
        <span v-if="item.data.displacement?.paymentMethod" class="flex items-center before:content-['•'] before:mx-1">
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          {{ item.data.displacement.paymentMethod }}
        </span>
      </div>
    </template>
  </ContentListTemplate>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { WorkSheet, BaseContent, ContentWithRelations } from '@clever/shared';
import ContentListTemplate from '@/components/common/ContentListTemplate.vue';
import { useApi } from '@/composables/useApi';
import { useErrorHandler } from '@/composables/useErrorHandler';

// Router
const router = useRouter();

// Composables
const api = useApi<WorkSheet>('work-sheets');
const errorHandler = useErrorHandler();

// State
const workSheets = ref<ContentWithRelations<WorkSheet['data']>[]>([]);
const isLoading = ref(false);
const searchQuery = ref('');
const error = ref<string | null>(null);

// Clear error function
const clearError = () => {
  error.value = null;
};

// Computed properties
const displayedWorkSheets = computed(() => {
  if (!searchQuery.value) {
    return workSheets.value;
  }
  
  const query = searchQuery.value.toLowerCase();
  return workSheets.value.filter(workSheet => {
    const data = workSheet.data;
    return (
      data.otherData?.technician?.toLowerCase().includes(query) ||
      data.otherData?.serviceType?.toLowerCase().includes(query) ||
      data.request?.reason?.toLowerCase().includes(query) ||
      data.displacement?.paymentMethod?.toLowerCase().includes(query)
    );
  });;
});

// Display functions for ContentListTemplate
const getWorkSheetTitle = (item: BaseContent): string => {
  const workSheet = item as ContentWithRelations<WorkSheet['data']>;
  
  // Try to get client name from resolved relations first
  if (workSheet.relations?.client) {
    const clientRelation = workSheet.relations.client;
    
    // Check if it's a resolved relation with client data
    if (clientRelation && typeof clientRelation === 'object' && 'nomeEmpresa' in clientRelation) {
      return clientRelation.nomeComercial || clientRelation.nomeEmpresa || 'Cliente sem nome';
    }
    
    // Check if it's an error
    if (clientRelation && typeof clientRelation === 'object' && 'type' in clientRelation && clientRelation.type === 'error') {
      return 'Cliente não encontrado';
    }
  }
  
  // Fallback to default
  return 'Folha de obra sem cliente';
};

const getWorkSheetSubtitle = (item: BaseContent): string => {
  const workSheet = item as ContentWithRelations<WorkSheet['data']>;
  const parts = [];
  
  if (workSheet.data.otherData?.serviceType) {
    parts.push(workSheet.data.otherData.serviceType);
  }
  
  if (workSheet.data.otherData?.technician) {
    parts.push(workSheet.data.otherData.technician);
  }
  
  return parts.join(' • ');
};

const getWorkSheetMeta1 = (item: BaseContent): string => {
  const workSheet = item as ContentWithRelations<WorkSheet['data']>;
  if (workSheet.data.otherData?.totallyResolved) {
    return 'Resolvido';
  }
  return 'Pendente';
};

const getWorkSheetMeta2 = (item: BaseContent): string => {
  const workSheet = item as ContentWithRelations<WorkSheet['data']>;
  if (workSheet.data.request?.totalHours) {
    return `${workSheet.data.request.totalHours}h`;
  }
  return '';
};

// Helper functions for custom template slots
const getWorkSheetInitials = (item: BaseContent): string => {
  const workSheet = item as ContentWithRelations<WorkSheet['data']>;
  
  // Try to get client name from resolved relations first
  let name = 'F';
  if (workSheet.relations?.client) {
    const clientRelation = workSheet.relations.client;
    if (clientRelation && typeof clientRelation === 'object' && 'nomeEmpresa' in clientRelation) {
      name = clientRelation.nomeComercial || clientRelation.nomeEmpresa || 'F';
    }
  }
  
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

const getWorkSheetIconClass = (item: BaseContent): string => {
  const workSheet = item as ContentWithRelations<WorkSheet['data']>;
  
  // Check if there's a client relation error
  if (workSheet.relations?.client && typeof workSheet.relations.client === 'object' && 'type' in workSheet.relations.client && workSheet.relations.client.type === 'error') {
    return 'bg-red-500 text-white'; // Error state
  }
  
  if (workSheet.data.otherData?.totallyResolved) {
    return 'bg-green-500 text-white'; // Resolved
  } else if (workSheet.data.displacement?.hasDisplacement) {
    return 'bg-blue-500 text-white'; // Has displacement
  }
  return 'bg-orange-500 text-white'; // Pending
};

const getWorkSheetStatusClass = (item: BaseContent): string => {
  const workSheet = item as ContentWithRelations<WorkSheet['data']>;
  
  // Check if there's a client relation error
  if (workSheet.relations?.client && typeof workSheet.relations.client === 'object' && 'type' in workSheet.relations.client && workSheet.relations.client.type === 'error') {
    return 'bg-red-100 text-red-800'; // Error state
  }
  
  if (workSheet.data.otherData?.totallyResolved) {
    return 'bg-green-100 text-green-800';
  }
  return 'bg-orange-100 text-orange-800';
};

const getWorkSheetStatusText = (item: BaseContent): string => {
  const workSheet = item as ContentWithRelations<WorkSheet['data']>;
  
  // Check if there's a client relation error
  if (workSheet.relations?.client && typeof workSheet.relations.client === 'object' && 'type' in workSheet.relations.client && workSheet.relations.client.type === 'error') {
    return 'Erro Cliente'; // Error state
  }
  
  if (workSheet.data.otherData?.totallyResolved) {
    return 'Resolvido';
  }
  return 'Pendente';
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-PT');
};

// Event handlers
const handleSearch = (query: string) => {
  searchQuery.value = query;
};

const handleClearSearch = () => {
  searchQuery.value = '';
};

const handleWorkSheetClick = (item: BaseContent) => {
  const workSheet = item as ContentWithRelations<WorkSheet['data']>;
  router.push(`/work-sheets/${workSheet.uuid}`);
};

const handleCreate = () => {
  router.push('/work-sheets/criar');
};

const handleEdit = (item: BaseContent) => {
  const workSheet = item as ContentWithRelations<WorkSheet['data']>;
  router.push(`/work-sheets/${workSheet.uuid}/editar`);
};

// Data loading
const loadWorkSheets = async () => {
  try {
    isLoading.value = true;
    clearError();
    
    console.log('Loading work sheets...');
    await api.fetchList();
    
    if (api.items.value) {
      // Sort work sheets by creation date (most recent first)
      workSheets.value = (api.items.value as ContentWithRelations<WorkSheet['data']>[]).sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      console.log(`Loaded ${workSheets.value.length} work sheets`);
    } else {
      throw new Error('Erro ao carregar folhas de obra');
    }
  } catch (err) {
    console.error('Error loading work sheets:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao carregar folhas de obra';
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  console.log('WorkSheetsListView mounted');
  loadWorkSheets();
});
</script>

<style scoped>
/* Work sheet-specific styling */
.work-sheet-icon {
  @apply flex-shrink-0;
}

.icon-circle {
  @apply w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold;
}

.work-sheet-status-badge {
  @apply px-2 py-1 rounded-full text-xs font-medium;
}

.displacement-badge {
  @apply px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium flex items-center;
}

/* Mobile-first responsive adjustments */
@media (max-width: 640px) {
  .icon-circle {
    @apply w-8 h-8 text-xs;
  }
  
  .work-sheet-status-badge,
  .displacement-badge {
    @apply px-1.5 py-0.5 text-xs;
  }
}

/* Portuguese text optimization */
.work-sheet-icon,
.work-sheet-status-badge,
.displacement-badge {
  @apply text-portuguese;
}

/* Touch-friendly interactions */
@media (hover: none) {
  .work-sheet-status-badge:active,
  .displacement-badge:active {
    @apply bg-opacity-80;
  }
}
</style>
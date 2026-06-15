<template>
  <ContentListTemplate
    :items="displayedInstallations"
    :is-loading="isLoading"
    :error="error"
    display-name="Instalações e Programações"
    back-route="/"
    :search-query="searchQuery"
    search-placeholder="Pesquisar instalações..."
    :show-create-button="true"
    create-button-text="Nova Instalação"
    empty-icon="🔧"
    empty-title="Nenhuma instalação encontrada"
    empty-message="Não há instalações cadastradas no sistema."
    empty-search-message="Não foram encontradas instalações com o termo pesquisado."
    :get-item-title="getItemTitle"
    :get-item-subtitle="getItemSubtitle"
    :get-item-meta1="getItemMeta1"
    :get-item-meta2="getItemMeta2"
    :current-page="api.pagination.value.page"
    :total-pages="api.pagination.value.totalPages"
    :total-count="api.pagination.value.total"
    :items-per-page="itemsPerPage"
    :show-pagination="api.pagination.value.total > 0"
    @search="handleSearch"
    @clear-search="handleClearSearch"
    @item-click="handleItemClick"
    @create="handleCreate"
    @edit="handleEdit"
    @page-change="handlePageChange"
    @items-per-page-change="handleItemsPerPageChange"
    @clear-error="clearError"
  >
    <!-- Custom icon -->
    <template #itemIcon="{ item }">
      <div class="flex-shrink-0">
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
          :class="getIconClass(item)"
        >
          {{ getInitials(item) }}
        </div>
      </div>
    </template>

    <!-- Custom meta information -->
    <template #itemMeta="{ item }">
      <div class="flex flex-col gap-2">
        <!-- Row 1: Installation type badge + Status text -->
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <!-- Installation type badge -->
          <span
            v-if="getInstallationType(item)"
            class="px-2 py-0.5 rounded text-xs font-medium"
            :class="getInstallationTypeBadgeClass(item)"
          >
            {{ getInstallationType(item) }}
          </span>

          <!-- Status text -->
          <span
            class="px-2 py-0.5 rounded text-xs font-medium"
            :class="getStatusClass(item)"
          >
            {{ getStatusText(item) }}
          </span>
        </div>

        <!-- Row 2: 7 progress dots -->
        <div class="flex items-center gap-1">
          <span
            v-for="phase in 7"
            :key="phase"
            class="w-2.5 h-2.5 rounded-full border"
            :class="getPhaseDotClass(item, phase)"
            :title="`Fase ${phase}`"
          />
        </div>

        <!-- Row 3: Technician + date -->
        <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <!-- Technician -->
          <span
            v-if="getTechnicianName(item)"
            class="flex items-center"
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            {{ getTechnicianName(item) }}
          </span>

          <!-- Created date -->
          <span class="flex items-center before:content-['•'] before:mx-1">
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
            {{ formatDate(item.createdAt) }}
          </span>
        </div>
      </div>
    </template>
  </ContentListTemplate>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type {
  InstallationsProgramming,
  BaseContent,
  ContentWithRelations,
  TechnicianUser,
  InstallationSevenPhasesData,
  PhaseStatus,
} from '@clever/shared';
import { adaptLegacyData } from '@clever/shared';
import ContentListTemplate from '@/components/common/ContentListTemplate.vue';
import { useApi } from '@/composables/useApi';

// Router
const router = useRouter();

// Composables
const api = useApi<InstallationsProgramming>('installations-programming');

// State
const installations = ref<ContentWithRelations<InstallationsProgramming['data']>[]>([]);
const isLoading = ref(false);
const searchQuery = ref('');
const error = ref<string | null>(null);
const itemsPerPage = ref(10);

// Clear error
const clearError = () => {
  error.value = null;
};

// Helper: get adapted data for an item (handles legacy format)
const getAdaptedData = (item: BaseContent): InstallationSevenPhasesData => {
  const installation = item as ContentWithRelations<InstallationsProgramming['data']>;
  return adaptLegacyData(installation.data);
};

// Computed
const displayedInstallations = computed(() => {
  if (!searchQuery.value) {
    return installations.value;
  }

  const query = searchQuery.value.toLowerCase();
  return installations.value.filter(item => {
    // Search in client name (from relations)
    if (item.relations?.client) {
      const clientRelation = item.relations.client;
      if (clientRelation && typeof clientRelation === 'object' && 'nomeEmpresa' in clientRelation) {
        const clientName = (
          clientRelation.nomeComercial ||
          clientRelation.nomeEmpresa ||
          ''
        ).toLowerCase();
        if (clientName.includes(query)) return true;
      }
    }

    // Search in technician name
    const techName = getTechnicianDisplayName(item.data.technician);
    if (techName.toLowerCase().includes(query)) return true;

    // Search in installation type
    const adapted = adaptLegacyData(item.data);
    if (adapted.installationType && adapted.installationType.toLowerCase().includes(query)) {
      return true;
    }

    return false;
  });
});

// Helper: get technician display name from TechnicianUser object
const getTechnicianDisplayName = (technician: TechnicianUser | string | undefined): string => {
  if (!technician) return '';

  if (typeof technician === 'object' && technician.firstName && technician.lastName) {
    return `${technician.firstName} ${technician.lastName}`;
  }

  if (typeof technician === 'object') {
    if (technician.firstName) return technician.firstName;
    if (technician.lastName) return technician.lastName;
    if (technician.userId) return `User ${technician.userId.slice(-8)}`;
  }

  if (typeof technician === 'string') {
    return technician;
  }

  return '';
};

// Helper: get client name from resolved relations
const getClientName = (item: ContentWithRelations<InstallationsProgramming['data']>): string => {
  if (item.relations?.client) {
    const clientRelation = item.relations.client;

    if (clientRelation && typeof clientRelation === 'object' && 'nomeEmpresa' in clientRelation) {
      return clientRelation.nomeComercial || clientRelation.nomeEmpresa || 'Cliente sem nome';
    }

    if (
      clientRelation &&
      typeof clientRelation === 'object' &&
      'type' in clientRelation &&
      clientRelation.type === 'error'
    ) {
      return 'Cliente não encontrado';
    }
  }

  return 'Sem cliente associado';
};

// Display functions for ContentListTemplate
const getItemTitle = (item: BaseContent): string => {
  const installation = item as ContentWithRelations<InstallationsProgramming['data']>;
  return getClientName(installation);
};

const getItemSubtitle = (item: BaseContent): string => {
  const adapted = getAdaptedData(item);
  const techName = getTechnicianDisplayName(adapted.technician);
  const status = adapted.status === 'complete' ? 'Completa' : `Em curso — Fase ${adapted.currentPhase}`;

  const parts: string[] = [];
  if (techName) parts.push(techName);
  parts.push(status);

  return parts.join(' • ');
};

const getItemMeta1 = (item: BaseContent): string => {
  const adapted = getAdaptedData(item);
  return adapted.status === 'complete' ? 'Completa' : `Fase ${adapted.currentPhase}/7`;
};

const getItemMeta2 = (item: BaseContent): string => {
  const adapted = getAdaptedData(item);
  return getTechnicianDisplayName(adapted.technician);
};

// ── New display helpers for 7-phase progress ────────────────────────

const getInstallationType = (item: BaseContent): string => {
  const adapted = getAdaptedData(item);
  return adapted.installationType || '';
};

const getInstallationTypeBadgeClass = (item: BaseContent): string => {
  const adapted = getAdaptedData(item);
  const type = adapted.installationType;

  switch (type) {
    case 'POS':
      return 'bg-blue-100 text-blue-800';
    case 'CPA':
      return 'bg-purple-100 text-purple-800';
    case 'balanças':
      return 'bg-amber-100 text-amber-800';
    case 'CCTV':
      return 'bg-red-100 text-red-800';
    case 'Alarmes':
      return 'bg-orange-100 text-orange-800';
    case 'Botões de chamada e relógios':
      return 'bg-teal-100 text-teal-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (item: BaseContent): string => {
  const adapted = getAdaptedData(item);
  if (adapted.status === 'complete') {
    return 'Completa';
  }
  return `Em curso — Fase ${adapted.currentPhase}`;
};

const getStatusClass = (item: BaseContent): string => {
  const adapted = getAdaptedData(item);
  if (adapted.status === 'complete') {
    return 'bg-emerald-100 text-emerald-800';
  }
  return 'bg-yellow-100 text-yellow-800';
};

const getPhaseDotClass = (item: BaseContent, phase: number): string => {
  const adapted = getAdaptedData(item);
  const phaseStatuses: PhaseStatus[] = adapted.phaseStatuses || [];
  const status = phaseStatuses[phase - 1];

  if (status === 'completed') {
    return 'bg-emerald-500 border-emerald-500';
  }
  if (status === 'in_progress' || status === 'unlocked') {
    return 'bg-yellow-400 border-yellow-400';
  }
  // not_started or undefined
  return 'bg-gray-200 border-gray-300';
};

// Helper functions for custom template slots
const getTechnicianName = (item: BaseContent): string => {
  const adapted = getAdaptedData(item);
  return getTechnicianDisplayName(adapted.technician);
};

const getInitials = (item: BaseContent): string => {
  const installation = item as ContentWithRelations<InstallationsProgramming['data']>;
  let name = 'IP';

  if (installation.relations?.client) {
    const clientRelation = installation.relations.client;
    if (clientRelation && typeof clientRelation === 'object' && 'nomeEmpresa' in clientRelation) {
      name = clientRelation.nomeComercial || clientRelation.nomeEmpresa || 'IP';
    }
  }

  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

const getIconClass = (item: BaseContent): string => {
  const installation = item as ContentWithRelations<InstallationsProgramming['data']>;

  // Error state
  if (
    installation.relations?.client &&
    typeof installation.relations.client === 'object' &&
    'type' in installation.relations.client &&
    installation.relations.client.type === 'error'
  ) {
    return 'bg-red-500 text-white';
  }

  const adapted = getAdaptedData(item);

  // Completed
  if (adapted.status === 'complete') {
    return 'bg-[#75AE93] text-white';
  }

  // In progress — determine by how far along
  const completedCount = adapted.phaseStatuses?.filter((s: PhaseStatus) => s === 'completed').length ?? 0;
  if (completedCount > 0) {
    return 'bg-yellow-500 text-white';
  }

  return 'bg-gray-500 text-white';
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Event handlers
const handleSearch = (query: string) => {
  searchQuery.value = query;
};

const handleClearSearch = () => {
  searchQuery.value = '';
};

const handleItemClick = (item: BaseContent) => {
  router.push(`/installations-programming/${item.uuid}`);
};

const handleCreate = () => {
  router.push('/installations-programming/criar');
};

const handleEdit = (item: BaseContent) => {
  router.push(`/installations-programming/${item.uuid}/editar`);
};

// Pagination handlers
const handlePageChange = async (page: number) => {
  isLoading.value = true;
  await api.fetchList({ page, limit: itemsPerPage.value }).then(() => {
    if (api.items.value) {
      installations.value = (
        api.items.value as ContentWithRelations<InstallationsProgramming['data']>[]
      ).sort((a, b) => {
        const createdA = new Date(a.createdAt);
        const createdB = new Date(b.createdAt);
        return createdB.getTime() - createdA.getTime();
      });
    }
  }).catch((err) => {
    console.error('Error changing page:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao carregar instalações';
  }).finally(() => {
    isLoading.value = false;
  });
};

const handleItemsPerPageChange = async (limit: number) => {
  itemsPerPage.value = limit;
  isLoading.value = true;
  await api.fetchList({ page: 1, limit }).then(() => {
    if (api.items.value) {
      installations.value = (
        api.items.value as ContentWithRelations<InstallationsProgramming['data']>[]
      ).sort((a, b) => {
        const createdA = new Date(a.createdAt);
        const createdB = new Date(b.createdAt);
        return createdB.getTime() - createdA.getTime();
      });
    }
  }).catch((err) => {
    console.error('Error changing items per page:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao carregar instalações';
  }).finally(() => {
    isLoading.value = false;
  });
};

// Data loading
const loadInstallations = async () => {
  isLoading.value = true;
  clearError();

  await api.fetchList({ limit: itemsPerPage.value }).then(() => {
    if (api.items.value) {
      installations.value = (
        api.items.value as ContentWithRelations<InstallationsProgramming['data']>[]
      ).sort((a, b) => {
        const createdA = new Date(a.createdAt);
        const createdB = new Date(b.createdAt);
        return createdB.getTime() - createdA.getTime();
      });
    } else {
      throw new Error('Erro ao carregar instalações');
    }
  }).catch((err) => {
    console.error('Error loading installations:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao carregar instalações';
  }).finally(() => {
    isLoading.value = false;
  });
};

// Lifecycle
onMounted(() => {
  loadInstallations();
});
</script>

<style scoped>
/* Mobile-first responsive adjustments */
@media (max-width: 640px) {
  .progress-badge {
    @apply px-1.5 py-0.5 text-xs;
  }
}
</style>

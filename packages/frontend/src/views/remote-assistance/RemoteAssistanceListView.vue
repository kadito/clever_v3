<template>
  <ContentListTemplate
    :items="displayedRemoteAssistance"
    :is-loading="isLoading"
    :error="error"
    display-name="Assistências Remotas"
    back-route="/"
    :search-query="searchQuery"
    search-placeholder="Pesquisar assistências remotas..."
    :show-create-button="true"
    create-button-text="Criar Assistência Remota"
    empty-icon="🖥️"
    empty-title="Nenhuma assistência remota encontrada"
    empty-message="Não há assistências remotas cadastradas no sistema."
    empty-search-message="Não foram encontradas assistências remotas com o termo pesquisado."
    :get-item-title="getRemoteAssistanceTitle"
    :get-item-subtitle="getRemoteAssistanceSubtitle"
    :get-item-meta1="getRemoteAssistanceMeta1"
    :get-item-meta2="getRemoteAssistanceMeta2"
    @search="handleSearch"
    @clear-search="handleClearSearch"
    @item-click="handleRemoteAssistanceClick"
    @create="handleCreate"
    @edit="handleEdit"
    @clear-error="clearError"
  >
    <!-- Custom remote assistance icon -->
    <template #itemIcon="{ item }">
      <div class="remote-assistance-icon">
        <div class="icon-circle" :class="getRemoteAssistanceIconClass(item)">
          {{ getRemoteAssistanceInitials(item) }}
        </div>
      </div>
    </template>

    <!-- Custom remote assistance meta information -->
    <template #itemMeta="{ item }">
      <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <!-- Assistance number -->
        <span class="assistance-number-badge">
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
            />
          </svg>
          {{ getAssistanceNumber(item) }}
        </span>

        <!-- Assistance type -->
        <span class="assistance-type-badge" :class="getAssistanceTypeClass(item)">
          {{ getAssistanceTypeDisplay(item) }}
        </span>

        <!-- Status badges -->
        <div class="flex flex-wrap gap-1">
          <span v-if="item.data.contrato" class="status-badge bg-blue-100 text-blue-800">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Contrato
          </span>
          <span v-if="item.data.garantia" class="status-badge bg-green-100 text-green-800">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            Garantia
          </span>
          <span v-if="item.data.resolvido" class="status-badge bg-emerald-100 text-emerald-800">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Resolvido
          </span>
        </div>

        <!-- Assistance date -->
        <span
          v-if="item.data.dataAssistencia"
          class="flex items-center before:content-['•'] before:mx-1"
        >
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {{ formatDate(item.data.dataAssistencia) }}
        </span>

        <!-- Duration -->
        <span
          v-if="getAssistanceDuration(item)"
          class="flex items-center before:content-['•'] before:mx-1"
        >
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {{ getAssistanceDuration(item) }}
        </span>

        <!-- Value display -->
        <span
          v-if="getAssistanceValueDisplay(item)"
          class="value-badge"
          :class="getValueBadgeClass(item)"
        >
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
            />
          </svg>
          {{ getAssistanceValueDisplay(item) }}
        </span>

        <!-- Technician -->
        <span
          v-if="item.data.tecnicoResponsavel"
          class="flex items-center before:content-['•'] before:mx-1"
        >
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          {{ item.data.tecnicoResponsavel }}
        </span>
      </div>
    </template>
  </ContentListTemplate>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { RemoteAssistance, BaseContent, ContentWithRelations } from '@clever/shared';
import {
  getRemoteAssistanceSummary,
  hasBillableValue,
  calculateTotalHours,
  formatDateForDisplay,
  formatTimeForDisplay,
  getYearFromAssistanceDate,
  generateAssistanceNumber,
} from '@clever/shared';
import ContentListTemplate from '@/components/common/ContentListTemplate.vue';
import { useApi } from '@/composables/useApi';
import { useErrorHandler } from '@/composables/useErrorHandler';

// Router
const router = useRouter();

// Composables
const api = useApi<RemoteAssistance>('remote-assistance');
const errorHandler = useErrorHandler();

// State
const remoteAssistance = ref<ContentWithRelations<RemoteAssistance['data']>[]>([]);
const isLoading = ref(false);
const searchQuery = ref('');
const error = ref<string | null>(null);

// Clear error function
const clearError = () => {
  error.value = null;
};

// Computed properties
const displayedRemoteAssistance = computed(() => {
  if (!searchQuery.value) {
    return remoteAssistance.value;
  }

  const query = searchQuery.value.toLowerCase();
  return remoteAssistance.value.filter(assistance => {
    const data = assistance.data;

    // Search in client name (from relations)
    if (assistance.relations?.client) {
      const clientRelation = assistance.relations.client;
      if (clientRelation && typeof clientRelation === 'object' && 'nomeEmpresa' in clientRelation) {
        const clientName = (
          clientRelation.nomeComercial ||
          clientRelation.nomeEmpresa ||
          ''
        ).toLowerCase();
        if (clientName.includes(query)) return true;
      }
    }

    // Search in assistance data
    return (
      data.tipoAssistencia?.toLowerCase().includes(query) ||
      data.tecnicoResponsavel?.toLowerCase().includes(query) ||
      data.quemAtendeu?.toLowerCase().includes(query) ||
      data.motivoPedido?.toLowerCase().includes(query) ||
      data.relatorioAssistencia?.toLowerCase().includes(query) ||
      data.relatorio?.toLowerCase().includes(query) ||
      getAssistanceNumber(assistance).toLowerCase().includes(query) ||
      (data.contrato && 'contrato'.includes(query)) ||
      (data.garantia && 'garantia'.includes(query)) ||
      (data.resolvido && 'resolvido'.includes(query)) ||
      (hasBillableValue(data) && ('faturável'.includes(query) || 'pago'.includes(query))) ||
      (!hasBillableValue(data) && ('gratuito'.includes(query) || 'sem custo'.includes(query)))
    );
  });
});

// Display functions for ContentListTemplate
const getRemoteAssistanceTitle = (item: BaseContent): string => {
  const assistance = item as ContentWithRelations<RemoteAssistance['data']>;

  // Try to get client name from resolved relations first
  if (assistance.relations?.client) {
    const clientRelation = assistance.relations.client;

    // Check if it's a resolved relation with client data
    if (clientRelation && typeof clientRelation === 'object' && 'nomeEmpresa' in clientRelation) {
      return clientRelation.nomeComercial || clientRelation.nomeEmpresa || 'Cliente sem nome';
    }

    // Check if it's an error
    if (
      clientRelation &&
      typeof clientRelation === 'object' &&
      'type' in clientRelation &&
      clientRelation.type === 'error'
    ) {
      return 'Cliente não encontrado';
    }
  }

  // Fallback to assistance number or default
  return getAssistanceNumber(assistance) || 'Assistência remota sem cliente';
};

const getRemoteAssistanceSubtitle = (item: BaseContent): string => {
  const assistance = item as ContentWithRelations<RemoteAssistance['data']>;
  const parts = [];

  // Assistance type
  if (assistance.data.tipoAssistencia) {
    parts.push(getAssistanceTypeDisplay(assistance));
  }

  // Main reason/description
  if (assistance.data.motivoPedido) {
    const reason =
      assistance.data.motivoPedido.length > 50
        ? assistance.data.motivoPedido.substring(0, 50) + '...'
        : assistance.data.motivoPedido;
    parts.push(reason);
  }

  return parts.join(' • ');
};

const getRemoteAssistanceMeta1 = (item: BaseContent): string => {
  const assistance = item as ContentWithRelations<RemoteAssistance['data']>;

  // Check if there's a client relation error
  if (
    assistance.relations?.client &&
    typeof assistance.relations.client === 'object' &&
    'type' in assistance.relations.client &&
    assistance.relations.client.type === 'error'
  ) {
    return 'Erro Cliente';
  }

  // Show resolution status
  if (assistance.data.resolvido) {
    return 'Resolvido';
  } else if (assistance.data.contrato) {
    return 'Contrato';
  } else if (assistance.data.garantia) {
    return 'Garantia';
  }

  return 'Pendente';
};

const getRemoteAssistanceMeta2 = (item: BaseContent): string => {
  const assistance = item as ContentWithRelations<RemoteAssistance['data']>;

  // Show value if billable
  if (hasBillableValue(assistance.data)) {
    return `€${assistance.data.valorAssist.toFixed(2)}`;
  }

  // Show duration if available
  const duration = getAssistanceDuration(assistance);
  if (duration) {
    return duration;
  }

  // Show technician
  if (assistance.data.tecnicoResponsavel) {
    return assistance.data.tecnicoResponsavel;
  }

  return '';
};

// Helper functions for custom template slots
const getRemoteAssistanceInitials = (item: BaseContent): string => {
  const assistance = item as ContentWithRelations<RemoteAssistance['data']>;

  // Try to get client name from resolved relations first
  let name = 'RA';
  if (assistance.relations?.client) {
    const clientRelation = assistance.relations.client;
    if (clientRelation && typeof clientRelation === 'object' && 'nomeEmpresa' in clientRelation) {
      name = clientRelation.nomeComercial || clientRelation.nomeEmpresa || 'RA';
    }
  }

  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

const getRemoteAssistanceIconClass = (item: BaseContent): string => {
  const assistance = item as ContentWithRelations<RemoteAssistance['data']>;

  // Check if there's a client relation error
  if (
    assistance.relations?.client &&
    typeof assistance.relations.client === 'object' &&
    'type' in assistance.relations.client &&
    assistance.relations.client.type === 'error'
  ) {
    return 'bg-red-500 text-white'; // Error state
  }

  // Color based on status
  if (assistance.data.resolvido) {
    return 'bg-emerald-500 text-white'; // Resolved
  } else if (assistance.data.contrato) {
    return 'bg-blue-500 text-white'; // Contract
  } else if (assistance.data.garantia) {
    return 'bg-green-500 text-white'; // Warranty
  } else if (hasBillableValue(assistance.data)) {
    return 'bg-orange-500 text-white'; // Billable
  }

  return 'bg-gray-500 text-white'; // Default/Pending
};

const getAssistanceNumber = (item: BaseContent): string => {
  const assistance = item as ContentWithRelations<RemoteAssistance['data']>;

  if (assistance.data.dataAssistencia) {
    const year = getYearFromAssistanceDate(assistance.data.dataAssistencia);
    // For display purposes, use a simple sequential number based on creation order
    // In a real implementation, this would be stored in the data or calculated properly
    const sequentialNumber = 1; // Placeholder - would be calculated during creation
    return generateAssistanceNumber(year, sequentialNumber);
  }

  return `RA-${new Date().getFullYear()}-0001`;
};

const getAssistanceTypeDisplay = (item: BaseContent): string => {
  const assistance = item as ContentWithRelations<RemoteAssistance['data']>;

  const typeMap: Record<string, string> = {
    REMOTA: 'Remota',
    TELEFÓNICA: 'Telefónica',
    TELEMÓVEL: 'Telemóvel',
  };

  return typeMap[assistance.data.tipoAssistencia] || assistance.data.tipoAssistencia || 'N/A';
};

const getAssistanceTypeClass = (item: BaseContent): string => {
  const assistance = item as ContentWithRelations<RemoteAssistance['data']>;

  const typeClassMap: Record<string, string> = {
    REMOTA: 'bg-purple-100 text-purple-800',
    TELEFÓNICA: 'bg-indigo-100 text-indigo-800',
    TELEMÓVEL: 'bg-cyan-100 text-cyan-800',
  };

  return typeClassMap[assistance.data.tipoAssistencia] || 'bg-gray-100 text-gray-800';
};

const getAssistanceDuration = (item: BaseContent): string => {
  const assistance = item as ContentWithRelations<RemoteAssistance['data']>;

  if (assistance.data.inicioAssistencia && assistance.data.fimAssistencia) {
    const duration = calculateTotalHours(
      assistance.data.inicioAssistencia,
      assistance.data.fimAssistencia
    );
    return duration || '';
  }

  return '';
};

const getAssistanceValueDisplay = (item: BaseContent): string => {
  const assistance = item as ContentWithRelations<RemoteAssistance['data']>;

  if (assistance.data.contrato || assistance.data.garantia) {
    return 'Gratuito';
  }

  if (assistance.data.valorAssist && assistance.data.valorAssist > 0) {
    return `€${assistance.data.valorAssist.toFixed(2)}`;
  }

  return '';
};

const getValueBadgeClass = (item: BaseContent): string => {
  const assistance = item as ContentWithRelations<RemoteAssistance['data']>;

  if (assistance.data.contrato || assistance.data.garantia) {
    return 'bg-green-100 text-green-800'; // Free/covered
  }

  if (hasBillableValue(assistance.data)) {
    return 'bg-yellow-100 text-yellow-800'; // Billable
  }

  return 'bg-gray-100 text-gray-800'; // Default
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  return formatDateForDisplay(dateString);
};

// Event handlers
const handleSearch = (query: string) => {
  searchQuery.value = query;
};

const handleClearSearch = () => {
  searchQuery.value = '';
};

const handleRemoteAssistanceClick = (item: BaseContent) => {
  const assistance = item as ContentWithRelations<RemoteAssistance['data']>;
  router.push(`/remote-assistance/${assistance.uuid}`);
};

const handleCreate = () => {
  router.push('/remote-assistance/criar');
};

const handleEdit = (item: BaseContent) => {
  const assistance = item as ContentWithRelations<RemoteAssistance['data']>;
  router.push(`/remote-assistance/${assistance.uuid}/editar`);
};

// Data loading
const loadRemoteAssistance = async () => {
  try {
    isLoading.value = true;
    clearError();

    console.log('Loading remote assistance...');
    await api.fetchList();

    if (api.items.value) {
      // Sort remote assistance by assistance date (most recent first) - as per requirements 8.6
      remoteAssistance.value = (
        api.items.value as ContentWithRelations<RemoteAssistance['data']>[]
      ).sort((a, b) => {
        // Primary sort: assistance date (most recent first)
        const dateA = new Date(a.data.dataAssistencia || a.createdAt);
        const dateB = new Date(b.data.dataAssistencia || b.createdAt);
        const dateDiff = dateB.getTime() - dateA.getTime();

        if (dateDiff !== 0) return dateDiff;

        // Secondary sort: creation date (most recent first)
        const createdA = new Date(a.createdAt);
        const createdB = new Date(b.createdAt);
        return createdB.getTime() - createdA.getTime();
      });

      console.log(`Loaded ${remoteAssistance.value.length} remote assistance records`);
    } else {
      throw new Error('Erro ao carregar assistências remotas');
    }
  } catch (err) {
    console.error('Error loading remote assistance:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao carregar assistências remotas';
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  console.log('RemoteAssistanceListView mounted');
  loadRemoteAssistance();
});
</script>

<style scoped>
/* Remote assistance-specific styling */
.remote-assistance-icon {
  @apply flex-shrink-0;
}

.icon-circle {
  @apply w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold;
}

.assistance-number-badge {
  @apply px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium flex items-center;
}

.assistance-type-badge {
  @apply px-2 py-1 rounded text-xs font-medium;
}

.status-badge {
  @apply px-2 py-1 rounded text-xs font-medium flex items-center;
}

.value-badge {
  @apply px-2 py-1 rounded text-xs font-medium flex items-center;
}

/* Mobile-first responsive adjustments */
@media (max-width: 640px) {
  .icon-circle {
    @apply w-8 h-8 text-xs;
  }

  .assistance-number-badge,
  .assistance-type-badge,
  .status-badge,
  .value-badge {
    @apply px-1.5 py-0.5 text-xs;
  }
}

/* Portuguese text optimization */
.remote-assistance-icon,
.assistance-number-badge,
.assistance-type-badge,
.status-badge,
.value-badge {
  @apply text-portuguese;
}

/* Touch-friendly interactions */
@media (hover: none) {
  .assistance-number-badge:active,
  .assistance-type-badge:active,
  .status-badge:active,
  .value-badge:active {
    @apply bg-opacity-80;
  }
}

/* Status-specific styling */
.status-badge svg {
  @apply flex-shrink-0;
}

/* Value badge specific styling */
.value-badge svg {
  @apply flex-shrink-0;
}

/* Responsive badge layout */
@media (max-width: 640px) {
  .status-badge svg,
  .value-badge svg {
    @apply w-2.5 h-2.5;
  }
}
</style>

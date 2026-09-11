<template>
  <ContentListTemplate
    :items="displayedLicenses"
    :is-loading="isLoading"
    :error="error"
    display-name="Licenças"
    back-route="/"
    :search-query="searchQuery"
    search-placeholder="Pesquisar licenças..."
    :show-create-button="true"
    create-button-text="Criar Licença"
    empty-icon="🔑"
    empty-title="Nenhuma licença encontrada"
    empty-message="Não há licenças cadastradas no sistema."
    empty-search-message="Não foram encontradas licenças com o termo pesquisado."
    :get-item-title="getLicenseTitle"
    :get-item-subtitle="getLicenseSubtitle"
    :get-item-meta1="getLicenseMeta1"
    :get-item-meta2="getLicenseMeta2"
    :current-page="api.pagination.value.page"
    :total-pages="api.pagination.value.totalPages"
    :total-count="api.pagination.value.total"
    :items-per-page="itemsPerPage"
    :show-pagination="api.pagination.value.total > 0"
    @search="handleSearch"
    @clear-search="handleClearSearch"
    @item-click="handleLicenseClick"
    @create="handleCreate"
    @edit="handleEdit"
    @page-change="handlePageChange"
    @items-per-page-change="handleItemsPerPageChange"
    @clear-error="clearError"
  >
    <!-- Expiration date filter -->
    <template #filters>
      <ExpirationDateFilter
        v-model="selectedMonth"
        :options="filterOptions"
      />
    </template>

    <!-- Custom license icon -->
    <template #itemIcon="{ item }">
      <div class="license-icon">
        <div
          class="icon-circle"
          :class="getLicenseIconClass(item)"
        >
          {{ getLicenseInitials(item) }}
        </div>
      </div>
    </template>

    <!-- Custom license meta information -->
    <template #itemMeta="{ item }">
      <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <!-- License status -->
        <span
          class="license-status-badge"
          :class="getLicenseStatusClass(item)"
        >
          {{ getLicenseStatusText(item) }}
        </span>

        <!-- Expiration date -->
        <span
          v-if="item.data.dataVencimento"
          class="flex items-center before:content-['•'] before:mx-1"
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {{ formatDate(item.data.dataVencimento) }}
        </span>

        <!-- Software summary -->
        <div
          v-if="item.data.software && item.data.software.name && item.data.software.name.length > 0"
          class="flex flex-wrap gap-1 mt-1"
        >
          <span
            v-for="software in item.data.software.name.slice(0, 3)"
            :key="software"
            class="software-badge"
          >
            {{ software }}
          </span>
          <span
            v-if="item.data.software.name.length > 3"
            class="text-gray-400"
          >
            +{{ item.data.software.name.length - 3 }} mais
          </span>
        </div>

        <!-- License modality -->
        <span
          v-if="item.data.modalidade"
          class="flex items-center before:content-['•'] before:mx-1"
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {{ item.data.modalidade }}
        </span>

        <!-- Invoice count -->
        <span
          v-if="item.data.invoices && item.data.invoices.length > 0"
          class="flex items-center before:content-['•'] before:mx-1"
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
          {{ item.data.invoices.length }} fatura{{ item.data.invoices.length > 1 ? 's' : '' }}
        </span>
      </div>
    </template>
  </ContentListTemplate>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { License, BaseContent, ContentWithRelations } from '@clever/shared';
import { calculateLicenseStatus } from '@clever/shared';
import ContentListTemplate from '@/components/common/ContentListTemplate.vue';
import ExpirationDateFilter from '@/components/common/ExpirationDateFilter.vue';
import { useApi } from '@/composables/useApi';
import { useErrorHandler } from '@/composables/useErrorHandler';
import { useExpirationFilter } from '@/composables/useExpirationFilter';

// Router
const router = useRouter();

// Composables
const api = useApi<License>('licenses');
const errorHandler = useErrorHandler();
const { filterOptions, selectedMonth, clearFilter, filterParams, filterItems } = useExpirationFilter();

// State
const isLoading = ref(false);
const searchQuery = ref('');
const error = ref<string | null>(null);
const itemsPerPage = ref(10);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

// Clear error function
const clearError = () => {
  error.value = null;
};

// Computed properties
const displayedLicenses = computed(() => {
  // Backend handles search filtering - apply client-side expiration filter only
  return filterItems(api.items.value as unknown as import('@clever/shared').BaseContent[]) as ContentWithRelations<License['data']>[];
});

// Display functions for ContentListTemplate
const getLicenseTitle = (item: BaseContent): string => {
  const license = item as ContentWithRelations<License['data']>;

  // Try to get client name from resolved relations first
  if (license.relations?.client) {
    const clientRelation = license.relations.client;

    // Check if it's a resolved relation with client data
    if (clientRelation && typeof clientRelation === 'object' && 'nomeEmpresa' in clientRelation) {
      return clientRelation.nomeEmpresa || 'Cliente sem nome';
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

  // Fallback to stored client name or default
  return license.data.clientName || 'Licença sem cliente';
};

const getLicenseSubtitle = (item: BaseContent): string => {
  const license = item as ContentWithRelations<License['data']>;
  const parts = [];

  if (license.data.software?.name && license.data.software.name.length > 0) {
    parts.push(license.data.software.name.join(', '));
  }

  if (license.data.versao) {
    parts.push(`v${license.data.versao}`);
  }

  return parts.join(' • ');
};

const getLicenseMeta1 = (item: BaseContent): string => {
  const license = item as ContentWithRelations<License['data']>;
  if (license.data.dataVencimento) {
    const status = calculateLicenseStatus(license.data.dataVencimento);
    const statusText = {
      active: 'Ativa',
      expiring: 'A Expirar',
      expired: 'Expirada',
    }[status];
    return statusText;
  }
  return 'Indefinida';
};

const getLicenseMeta2 = (item: BaseContent): string => {
  const license = item as ContentWithRelations<License['data']>;
  const softwareCount = license.data.software?.name?.length || 0;
  if (softwareCount > 0) {
    return `${softwareCount} software${softwareCount > 1 ? 's' : ''}`;
  }
  return '';
};

// Helper functions for custom template slots
const getLicenseInitials = (item: BaseContent): string => {
  const license = item as ContentWithRelations<License['data']>;

  // Try to get client name from resolved relations first
  let name = 'L';
  if (license.relations?.client) {
    const clientRelation = license.relations.client;
    if (clientRelation && typeof clientRelation === 'object' && 'nomeEmpresa' in clientRelation) {
      name = clientRelation.nomeEmpresa || 'L';
    }
  } else if (license.data.clientName) {
    name = license.data.clientName;
  }

  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

const getLicenseIconClass = (item: BaseContent): string => {
  const license = item as ContentWithRelations<License['data']>;

  // Check if there's a client relation error
  if (
    license.relations?.client &&
    typeof license.relations.client === 'object' &&
    'type' in license.relations.client &&
    license.relations.client.type === 'error'
  ) {
    return 'bg-red-500 text-white'; // Error state
  }

  if (license.data.dataVencimento) {
    const status = calculateLicenseStatus(license.data.dataVencimento);
    switch (status) {
      case 'expired':
        return 'bg-red-500 text-white';
      case 'expiring':
        return 'bg-orange-500 text-white';
      case 'active':
        return 'bg-green-500 text-white';
    }
  }
  return 'bg-gray-500 text-white';
};

const getLicenseStatusClass = (item: BaseContent): string => {
  const license = item as ContentWithRelations<License['data']>;

  // Check if there's a client relation error
  if (
    license.relations?.client &&
    typeof license.relations.client === 'object' &&
    'type' in license.relations.client &&
    license.relations.client.type === 'error'
  ) {
    return 'bg-red-100 text-red-800'; // Error state
  }

  if (license.data.dataVencimento) {
    const status = calculateLicenseStatus(license.data.dataVencimento);
    switch (status) {
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'expiring':
        return 'bg-orange-100 text-orange-800';
      case 'active':
        return 'bg-green-100 text-green-800';
    }
  }
  return 'bg-gray-100 text-gray-800';
};

const getLicenseStatusText = (item: BaseContent): string => {
  const license = item as ContentWithRelations<License['data']>;

  // Check if there's a client relation error
  if (
    license.relations?.client &&
    typeof license.relations.client === 'object' &&
    'type' in license.relations.client &&
    license.relations.client.type === 'error'
  ) {
    return 'Erro Cliente'; // Error state
  }

  if (license.data.dataVencimento) {
    const status = calculateLicenseStatus(license.data.dataVencimento);
    switch (status) {
      case 'expired':
        return 'Expirada';
      case 'expiring':
        return 'A Expirar';
      case 'active':
        return 'Ativa';
    }
  }
  return 'Indefinida';
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-PT');
};

// Event handlers
const handleSearch = (query: string) => {
  searchQuery.value = query;
  
  // Clear existing timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  // Debounce search API call (300ms)
  searchTimeout = setTimeout(async () => {
    isLoading.value = true;
    clearError();

    if (query.trim()) {
      await api.search(query, { limit: itemsPerPage.value, ...filterParams.value })
        .catch((err) => {
          console.error('Search error:', JSON.stringify(err, null, 2));
          error.value = err instanceof Error ? err.message : 'Erro ao pesquisar licenças';
        })
        .finally(() => {
          isLoading.value = false;
        });
    } else {
      // Empty search - load all items
      await loadLicenses();
    }
  }, 300);
};

const handleClearSearch = () => {
  searchQuery.value = '';
  
  // Clear timeout if pending
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  // Reload all items
  loadLicenses();
};

const handleLicenseClick = (item: BaseContent) => {
  const license = item as ContentWithRelations<License['data']>;
  router.push(`/licenses/${license.uuid}`);
};

const handleCreate = () => {
  router.push('/licenses/criar');
};

const handleEdit = (item: BaseContent) => {
  const license = item as ContentWithRelations<License['data']>;
  router.push(`/licenses/${license.uuid}/editar`);
};

// Page change handler
const handlePageChange = async (page: number) => {
  isLoading.value = true;
  
  const searchParams = searchQuery.value 
    ? { page, limit: itemsPerPage.value, search: searchQuery.value, ...filterParams.value }
    : { page, limit: itemsPerPage.value, ...filterParams.value };

  await api.fetchList(searchParams)
    .catch((err) => {
      console.error('Error changing page:', JSON.stringify(err, null, 2));
      error.value = err instanceof Error ? err.message : 'Erro ao carregar licenças';
    })
    .finally(() => {
      isLoading.value = false;
    });
};

// Items per page change handler
const handleItemsPerPageChange = async (limit: number) => {
  itemsPerPage.value = limit;
  isLoading.value = true;
  
  const searchParams = searchQuery.value 
    ? { page: 1, limit, search: searchQuery.value, ...filterParams.value }
    : { page: 1, limit, ...filterParams.value };

  await api.fetchList(searchParams)
    .catch((err) => {
      console.error('Error changing items per page:', JSON.stringify(err, null, 2));
      error.value = err instanceof Error ? err.message : 'Erro ao carregar licenças';
    })
    .finally(() => {
      isLoading.value = false;
    });
};

// Data loading
const loadLicenses = async () => {
  try {
    isLoading.value = true;
    clearError();

    await api.fetchList({ limit: itemsPerPage.value, ...filterParams.value });
  } catch (err) {
    console.error('Error loading licenses:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao carregar licenças';
  } finally {
    isLoading.value = false;
  }
};

// Watch filter changes — reset page to 1 and re-fetch
watch(selectedMonth, async () => {
  isLoading.value = true;
  await api.fetchList({ page: 1, limit: itemsPerPage.value, ...filterParams.value }).then(() => {
    if (api.items.value) {
      licenses.value = (api.items.value as ContentWithRelations<License['data']>[]).sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    }
  }).catch((err) => {
    console.error('Error applying filters:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao carregar licenças';
  }).finally(() => {
    isLoading.value = false;
  });
});

// Lifecycle
onMounted(() => {
  loadLicenses();
});
</script>

<style scoped>
/* License-specific styling */
.license-icon {
  @apply flex-shrink-0;
}

.icon-circle {
  @apply w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold;
}

.license-status-badge {
  @apply px-2 py-1 rounded-full text-xs font-medium;
}

.software-badge {
  @apply px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium;
}

/* Mobile-first responsive adjustments */
@media (max-width: 640px) {
  .icon-circle {
    @apply w-8 h-8 text-xs;
  }

  .license-status-badge,
  .software-badge {
    @apply px-1.5 py-0.5 text-xs;
  }
}

/* Portuguese text optimization */
.license-icon,
.license-status-badge,
.software-badge {
  @apply text-portuguese;
}

/* Touch-friendly interactions */
@media (hover: none) {
  .license-status-badge:active,
  .software-badge:active {
    @apply bg-opacity-80;
  }
}
</style>

<template>
  <ContentListTemplate
    :items="displayedContracts"
    :is-loading="isLoading"
    :error="error"
    display-name="Contratos"
    back-route="/"
    :search-query="searchQuery"
    search-placeholder="Pesquisar contratos..."
    :show-create-button="true"
    create-button-text="Criar Contrato"
    empty-icon="📋"
    empty-title="Nenhum contrato encontrado"
    empty-message="Não há contratos cadastrados no sistema."
    empty-search-message="Não foram encontrados contratos com o termo pesquisado."
    :get-item-title="getContractTitle"
    :get-item-subtitle="getContractSubtitle"
    :get-item-meta1="getContractMeta1"
    :get-item-meta2="getContractMeta2"
    @search="handleSearch"
    @clear-search="handleClearSearch"
    @item-click="handleContractClick"
    @create="handleCreate"
    @edit="handleEdit"
    :current-page="api.pagination.value.page"
    :total-pages="api.pagination.value.totalPages"
    :total-count="api.pagination.value.total"
    :items-per-page="itemsPerPage"
    :show-pagination="api.pagination.value.total > 0"
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

    <!-- Custom contract icon -->
    <template #itemIcon="{ item }">
      <div class="contract-icon">
        <div class="icon-circle" :class="getContractIconClass(item)">
          {{ getContractInitials(item) }}
        </div>
      </div>
    </template>

    <!-- Custom contract meta information -->
    <template #itemMeta="{ item }">
      <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <!-- Contract types -->
        <div class="flex flex-wrap gap-1">
          <span
            v-if="item.data.hasCPAContract"
            class="contract-type-badge bg-blue-100 text-blue-800"
          >
            {{ item.data.cpaContractType || 'CPA' }}
          </span>
          <span
            v-if="item.data.hasSHContract"
            class="contract-type-badge bg-green-100 text-green-800"
          >
            S&H
          </span>
        </div>

        <!-- Contract status -->
        <span class="contract-status-badge" :class="getContractStatusClass(item)">
          {{ getContractStatusText(item) }}
        </span>

        <!-- Contract dates -->
        <span
          v-if="getContractDateRange(item)"
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
          {{ getContractDateRange(item) }}
        </span>

        <!-- Equipment count -->
        <span
          v-if="getEquipmentCount(item) > 0"
          class="flex items-center before:content-['•'] before:mx-1"
        >
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          {{ getEquipmentCount(item) }} equipamento{{ getEquipmentCount(item) > 1 ? 's' : '' }}
        </span>

        <!-- Payment methods -->
        <div v-if="getPaymentMethods(item).length > 0" class="flex flex-wrap gap-1 mt-1">
          <span v-for="method in getPaymentMethods(item)" :key="method" class="payment-badge">
            {{ formatPaymentMethod(method) }}
          </span>
        </div>

        <!-- Plan names -->
        <div v-if="getPlanNames(item).length > 0" class="flex flex-wrap gap-1 mt-1">
          <span v-for="plan in getPlanNames(item)" :key="plan" class="plan-badge">
            {{ plan }}
          </span>
        </div>
      </div>
    </template>
  </ContentListTemplate>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { Contract, BaseContent, ContentWithRelations } from '@clever/shared';
import { hasActiveContract, getContractSummary } from '@clever/shared';
import ContentListTemplate from '@/components/common/ContentListTemplate.vue';
import ExpirationDateFilter from '@/components/common/ExpirationDateFilter.vue';
import { useApi } from '@/composables/useApi';
import { useErrorHandler } from '@/composables/useErrorHandler';
import { useExpirationFilter } from '@/composables/useExpirationFilter';

// Router
const router = useRouter();

// Composables
const api = useApi<Contract>('contracts');
const errorHandler = useErrorHandler();
const { filterOptions, selectedMonth, clearFilter, filterParams } = useExpirationFilter();

// State
const contracts = ref<ContentWithRelations<Contract['data']>[]>([]);
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
const displayedContracts = computed(() => {
  return contracts.value;
});

// Display functions for ContentListTemplate
const getContractTitle = (item: BaseContent): string => {
  const contract = item as ContentWithRelations<Contract['data']>;

  // Try to get client name from resolved relations first
  if (contract.relations?.client) {
    const clientRelation = contract.relations.client;

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

  // Fallback to default if no client data available
  return 'Contrato sem cliente';
};

const getContractSubtitle = (item: BaseContent): string => {
  const contract = item as ContentWithRelations<Contract['data']>;
  const summary = getContractSummary(contract.data);
  const parts = [];

  if (summary.contractTypes.length > 0) {
    parts.push(summary.contractTypes.join(' + '));
  }

  if (summary.planNames.length > 0) {
    parts.push(summary.planNames.join(', '));
  }

  return parts.join(' • ');
};

const getContractMeta1 = (item: BaseContent): string => {
  const contract = item as ContentWithRelations<Contract['data']>;
  const isActive = hasActiveContract(contract.data);
  return isActive ? 'Ativo' : 'Inativo';
};

const getContractMeta2 = (item: BaseContent): string => {
  const contract = item as ContentWithRelations<Contract['data']>;
  const equipmentCount = getEquipmentCount(item);
  if (equipmentCount > 0) {
    return `${equipmentCount} equipamento${equipmentCount > 1 ? 's' : ''}`;
  }
  return '';
};

// Helper functions for custom template slots
const getContractInitials = (item: BaseContent): string => {
  const contract = item as ContentWithRelations<Contract['data']>;

  // Try to get client name from resolved relations first
  let name = 'C';
  if (contract.relations?.client) {
    const clientRelation = contract.relations.client;
    if (clientRelation && typeof clientRelation === 'object' && 'nomeEmpresa' in clientRelation) {
      name = clientRelation.nomeComercial || clientRelation.nomeEmpresa || 'C';
    }
  } else if (contract.data.clienteName) {
    name = contract.data.clienteName;
  }

  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

const getContractIconClass = (item: BaseContent): string => {
  const contract = item as ContentWithRelations<Contract['data']>;

  // Check if there's a client relation error
  if (
    contract.relations?.client &&
    typeof contract.relations.client === 'object' &&
    'type' in contract.relations.client &&
    contract.relations.client.type === 'error'
  ) {
    return 'bg-red-500 text-white'; // Error state
  }

  const isActive = hasActiveContract(contract.data);
  if (isActive) {
    // Active contract - use contract type colors
    if (contract.data.hasCPAContract && contract.data.hasSHContract) {
      return 'bg-purple-500 text-white'; // Both contracts
    } else if (contract.data.hasCPAContract) {
      return 'bg-blue-500 text-white'; // CPA only
    } else if (contract.data.hasSHContract) {
      return 'bg-green-500 text-white'; // S&H only
    }
  }

  return 'bg-gray-500 text-white'; // Inactive
};

const getContractStatusClass = (item: BaseContent): string => {
  const contract = item as ContentWithRelations<Contract['data']>;

  // Check if there's a client relation error
  if (
    contract.relations?.client &&
    typeof contract.relations.client === 'object' &&
    'type' in contract.relations.client &&
    contract.relations.client.type === 'error'
  ) {
    return 'bg-red-100 text-red-800'; // Error state
  }

  const isActive = hasActiveContract(contract.data);
  return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
};

const getContractStatusText = (item: BaseContent): string => {
  const contract = item as ContentWithRelations<Contract['data']>;

  // Check if there's a client relation error
  if (
    contract.relations?.client &&
    typeof contract.relations.client === 'object' &&
    'type' in contract.relations.client &&
    contract.relations.client.type === 'error'
  ) {
    return 'Erro Cliente'; // Error state
  }

  const isActive = hasActiveContract(contract.data);
  return isActive ? 'Ativo' : 'Inativo';
};

const getContractDateRange = (item: BaseContent): string => {
  const contract = item as ContentWithRelations<Contract['data']>;
  const summary = getContractSummary(contract.data);

  if (summary.startDate && summary.endDate) {
    const startDate = new Date(summary.startDate);
    const endDate = new Date(summary.endDate);
    return `${startDate.toLocaleDateString('pt-PT')} - ${endDate.toLocaleDateString('pt-PT')}`;
  } else if (summary.startDate) {
    const startDate = new Date(summary.startDate);
    return `Desde ${startDate.toLocaleDateString('pt-PT')}`;
  }

  return '';
};

const getEquipmentCount = (item: BaseContent): number => {
  const contract = item as ContentWithRelations<Contract['data']>;
  let count = 0;

  // Count CPA equipments (new format)
  if (contract.data.cpaEquipments && contract.data.cpaEquipments.length > 0) {
    count += contract.data.cpaEquipments.length;
  }

  // Count legacy equipment fields
  if (contract.data.modeloCPA || contract.data.numeroSerieCPA) {
    count += 1;
  }

  if (contract.data.modeloPSO || contract.data.numeroSeriePSO) {
    count += 1;
  }

  return count;
};

const getPaymentMethods = (item: BaseContent): string[] => {
  const contract = item as ContentWithRelations<Contract['data']>;
  const summary = getContractSummary(contract.data);
  return summary.paymentMethods;
};

const getPlanNames = (item: BaseContent): string[] => {
  const contract = item as ContentWithRelations<Contract['data']>;
  const summary = getContractSummary(contract.data);
  return summary.planNames;
};

const formatPaymentMethod = (method: string): string => {
  const methodMap: Record<string, string> = {
    TRANSFERENCIA_BANCARIA: 'Transferência',
    DEBITO_DIRETO: 'Débito Direto',
    MULTIBANCO: 'Multibanco',
    CHEQUE: 'Cheque',
    NUMERARIO: 'Numerário',
    MB_WAY: 'MB WAY',
    MENSAL: 'Mensal',
    TRIMESTRAL: 'Trimestral',
    SEMESTRAL: 'Semestral',
    ANUAL: 'Anual',
  };

  return methodMap[method] || method;
};

// Event handlers
const handleSearch = (query: string) => {
  searchQuery.value = query;
};

const handleClearSearch = () => {
  searchQuery.value = '';
};

const handleContractClick = (item: BaseContent) => {
  const contract = item as ContentWithRelations<Contract['data']>;
  router.push(`/contracts/${contract.uuid}`);
};

const handleCreate = () => {
  router.push('/contracts/criar');
};

const handleEdit = (item: BaseContent) => {
  const contract = item as ContentWithRelations<Contract['data']>;
  router.push(`/contracts/${contract.uuid}/editar`);
};

// Page change handler
const handlePageChange = async (page: number) => {
  isLoading.value = true;
  await api.fetchList({ page, limit: itemsPerPage.value, ...filterParams.value }).then(() => {
    if (api.items.value) {
      contracts.value = (api.items.value as ContentWithRelations<Contract['data']>[]).sort(
        (a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        }
      );
    }
  }).catch((err) => {
    console.error('Error changing page:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao carregar contratos';
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
      contracts.value = (api.items.value as ContentWithRelations<Contract['data']>[]).sort(
        (a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        }
      );
    }
  }).catch((err) => {
    console.error('Error changing items per page:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao carregar contratos';
  }).finally(() => {
    isLoading.value = false;
  });
};

// Data loading
const loadContracts = async () => {
  try {
    isLoading.value = true;
    clearError();

    await api.fetchList({ limit: itemsPerPage.value, ...filterParams.value });

    if (api.items.value) {
      // Sort contracts by creation date (most recent first) - as per requirements 8.6
      contracts.value = (api.items.value as ContentWithRelations<Contract['data']>[]).sort(
        (a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        }
      );
    } else {
      throw new Error('Erro ao carregar contratos');
    }
  } catch (err) {
    console.error('Error loading contracts:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao carregar contratos';
  } finally {
    isLoading.value = false;
  }
};

// Watch filter changes — reset page to 1 and re-fetch
watch(selectedMonth, async () => {
  isLoading.value = true;
  await api.fetchList({ page: 1, limit: itemsPerPage.value, ...filterParams.value }).then(() => {
    if (api.items.value) {
      contracts.value = (api.items.value as ContentWithRelations<Contract['data']>[]).sort(
        (a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        }
      );
    }
  }).catch((err) => {
    console.error('Error applying filters:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao carregar contratos';
  }).finally(() => {
    isLoading.value = false;
  });
});

// Lifecycle
onMounted(() => {
  loadContracts();
});
</script>

<style scoped>
/* Contract-specific styling */
.contract-icon {
  @apply flex-shrink-0;
}

.icon-circle {
  @apply w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold;
}

.contract-type-badge {
  @apply px-2 py-1 rounded-full text-xs font-medium;
}

.contract-status-badge {
  @apply px-2 py-1 rounded-full text-xs font-medium;
}

.payment-badge {
  @apply px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium;
}

.plan-badge {
  @apply px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium;
}

/* Mobile-first responsive adjustments */
@media (max-width: 640px) {
  .icon-circle {
    @apply w-8 h-8 text-xs;
  }

  .contract-type-badge,
  .contract-status-badge,
  .payment-badge,
  .plan-badge {
    @apply px-1.5 py-0.5 text-xs;
  }
}

/* Portuguese text optimization */
.contract-icon,
.contract-type-badge,
.contract-status-badge,
.payment-badge,
.plan-badge {
  @apply text-portuguese;
}

/* Touch-friendly interactions */
@media (hover: none) {
  .contract-type-badge:active,
  .contract-status-badge:active,
  .payment-badge:active,
  .plan-badge:active {
    @apply bg-opacity-80;
  }
}
</style>

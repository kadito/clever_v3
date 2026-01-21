<template>
  <ContentListTemplate
    :items="displayedClients"
    :is-loading="isLoading"
    :error="error"
    display-name="Clientes"
    back-route="/"
    :search-query="searchQuery"
    search-placeholder="Pesquisar clientes..."
    :show-create-button="true"
    create-button-text="Criar Cliente"
    empty-icon="👥"
    empty-title="Nenhum cliente encontrado"
    empty-message="Não há clientes cadastrados no sistema."
    empty-search-message="Não foram encontrados clientes com o termo pesquisado."
    :get-item-title="getClientTitle"
    :get-item-subtitle="getClientSubtitle"
    :get-item-meta1="getClientMeta1"
    :get-item-meta2="getClientMeta2"
    @search="handleSearch"
    @clear-search="handleClearSearch"
    @item-click="handleClientClick"
    @create="handleCreate"
    @edit="handleEdit"
    @clear-error="clearError"
  >
    <!-- Custom client icon -->
    <template #itemIcon="{ item }">
      <div class="client-icon">
        <div class="icon-circle" :class="getClientIconClass(item)">
          {{ getClientInitials(item) }}
        </div>
      </div>
    </template>

    <!-- Custom client meta information -->
    <template #itemMeta="{ item }">
      <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <!-- Location -->
        <span v-if="item.data.localidade" class="flex items-center">
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {{ item.data.localidade }}
        </span>

        <!-- Contact phone -->
        <span
          v-if="item.data.telefoneContato"
          class="flex items-center before:content-['•'] before:mx-1"
        >
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
          {{ item.data.telefoneContato }}
        </span>

        <!-- Service badges -->
        <div class="flex flex-wrap gap-1 mt-1">
          <span v-if="item.data.temAnydesk" class="service-badge bg-blue-100 text-blue-800">
            AnyDesk
          </span>
          <span v-if="item.data.manutencao" class="service-badge bg-green-100 text-green-800">
            Manutenção
          </span>
          <span v-if="item.data.manutencao24" class="service-badge bg-orange-100 text-orange-800">
            24h
          </span>
          <span v-if="item.data.atcud" class="service-badge bg-purple-100 text-purple-800">
            ATCUD
          </span>
          <span v-if="item.data.vectronConnect" class="service-badge bg-indigo-100 text-indigo-800">
            Vectron
          </span>
        </div>

        <!-- Software summary -->
        <div
          v-if="item.data.softwares && item.data.softwares.length > 0"
          class="flex flex-wrap gap-1 mt-1"
        >
          <span
            v-for="software in item.data.softwares.slice(0, 3)"
            :key="software.id"
            class="software-badge"
          >
            {{ software.name }}
          </span>
          <span v-if="item.data.softwares.length > 3" class="text-gray-400">
            +{{ item.data.softwares.length - 3 }} mais
          </span>
        </div>
      </div>
    </template>
  </ContentListTemplate>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { Client, BaseContent } from '@clever/shared';
import ContentListTemplate from '@/components/common/ContentListTemplate.vue';
import { useApi } from '@/composables/useApi';
import { useErrorHandler } from '@/composables/useErrorHandler';

// Router
const router = useRouter();

// Composables
const api = useApi<Client>('clients');
const errorHandler = useErrorHandler();

// State
const clients = ref<Client[]>([]);
const isLoading = ref(false);
const searchQuery = ref('');
const error = ref<string | null>(null);

// Clear error function
const clearError = () => {
  error.value = null;
};

// Computed properties
const displayedClients = computed(() => {
  if (!searchQuery.value) {
    return clients.value;
  }

  const query = searchQuery.value.toLowerCase();
  return clients.value.filter(client => {
    const data = client.data;
    return (
      data.nomeEmpresa?.toLowerCase().includes(query) ||
      data.nomeComercial?.toLowerCase().includes(query) ||
      data.contribuinte?.toLowerCase().includes(query) ||
      data.responsavel?.toLowerCase().includes(query) ||
      data.localidade?.toLowerCase().includes(query) ||
      data.telefoneContato?.toLowerCase().includes(query) ||
      data.email?.toLowerCase().includes(query) ||
      data.emailContato?.toLowerCase().includes(query) ||
      data.softwares?.some(s => s.name.toLowerCase().includes(query))
    );
  });
});

// Display functions for ContentListTemplate
const getClientTitle = (item: BaseContent): string => {
  const client = item as Client;
  return client.data.nomeComercial || client.data.nomeEmpresa || 'Cliente sem nome';
};

const getClientSubtitle = (item: BaseContent): string => {
  const client = item as Client;
  const parts = [];

  if (client.data.contribuinte) {
    parts.push(`NIF: ${client.data.contribuinte}`);
  }

  if (client.data.responsavel) {
    parts.push(client.data.responsavel);
  }

  return parts.join(' • ');
};

const getClientMeta1 = (item: BaseContent): string => {
  const client = item as Client;
  return client.data.localidade || '';
};

const getClientMeta2 = (item: BaseContent): string => {
  const client = item as Client;
  const softwareCount = client.data.softwares?.length || 0;
  if (softwareCount > 0) {
    return `${softwareCount} software${softwareCount > 1 ? 's' : ''}`;
  }
  return '';
};

// Helper functions for custom template slots
const getClientInitials = (item: BaseContent): string => {
  const client = item as Client;
  const name = client.data.nomeComercial || client.data.nomeEmpresa || 'C';
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

const getClientIconClass = (item: BaseContent): string => {
  const client = item as Client;
  // Color based on service flags
  if (client.data.manutencao24) return 'bg-orange-500 text-white';
  if (client.data.manutencao) return 'bg-green-500 text-white';
  if (client.data.temAnydesk) return 'bg-blue-500 text-white';
  return 'bg-gray-500 text-white';
};

// Event handlers
const handleSearch = (query: string) => {
  searchQuery.value = query;
};

const handleClearSearch = () => {
  searchQuery.value = '';
};

const handleClientClick = (item: BaseContent) => {
  const client = item as Client;
  router.push(`/clients/${client.uuid}`);
};

const handleCreate = () => {
  router.push('/clients/criar');
};

const handleEdit = (item: BaseContent) => {
  const client = item as Client;
  router.push(`/clients/${client.uuid}/editar`);
};

// Data loading
const loadClients = async () => {
  try {
    isLoading.value = true;
    clearError();

    await api.fetchList();

    if (api.items.value) {
      // Sort clients alphabetically by commercial name or company name
      clients.value = api.items.value.sort((a, b) => {
        const nameA = (a.data.nomeComercial || a.data.nomeEmpresa || '').toLowerCase();
        const nameB = (b.data.nomeComercial || b.data.nomeEmpresa || '').toLowerCase();
        return nameA.localeCompare(nameB, 'pt-PT');
      });
    } else {
      throw new Error('Erro ao carregar clientes');
    }
  } catch (err) {
    console.error('Error loading clients:', err);
    error.value = err instanceof Error ? err.message : 'Erro ao carregar clientes';
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  loadClients();
});
</script>

<style scoped>
/* Client-specific styling */
.client-icon {
  @apply flex-shrink-0;
}

.icon-circle {
  @apply w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold;
}

.service-badge {
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

  .service-badge,
  .software-badge {
    @apply px-1.5 py-0.5 text-xs;
  }
}

/* Portuguese text optimization */
.client-icon,
.service-badge,
.software-badge {
  @apply text-portuguese;
}

/* Touch-friendly interactions */
@media (hover: none) {
  .service-badge:active,
  .software-badge:active {
    @apply bg-opacity-80;
  }
}
</style>

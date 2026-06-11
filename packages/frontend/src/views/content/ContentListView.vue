<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Page header -->
      <header class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {{ displayName }}
            </h1>
            <p class="text-gray-600">
              Gerir {{ displayName.toLowerCase() }} do sistema
            </p>
          </div>

          <!-- Create button -->
          <router-link
            :to="{ name: `${contentType}-create` }"
            class="btn-primary inline-flex items-center"
          >
            <svg
              class="w-5 h-5 mr-2"
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
            Criar {{ displayName.slice(0, -1) }}
          </router-link>
        </div>
      </header>

      <!-- Search and filters -->
      <div class="mb-6">
        <SearchBar
          v-model="searchQuery"
          :placeholder="`Pesquisar ${displayName.toLowerCase()}...`"
          :filters="filters"
          @search="handleSearch"
          @filter="handleFilter"
        />
      </div>

      <!-- Content list -->
      <div class="space-y-4">
        <!-- Loading state -->
        <div
          v-if="isLoading"
          class="space-y-4"
        >
          <div
            v-for="i in 3"
            :key="i"
            class="animate-pulse"
          >
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <div class="flex items-start space-x-3">
                <div class="w-10 h-10 bg-gray-200 rounded-lg" />
                <div class="flex-1 space-y-2">
                  <div class="h-4 bg-gray-200 rounded w-3/4" />
                  <div class="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="displayItems.length === 0"
          class="text-center py-12"
        >
          <div class="text-6xl mb-4">
            {{ contentIcon }}
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            {{
              searchQuery
                ? 'Nenhum resultado encontrado'
                : `Nenhum ${displayName.toLowerCase().slice(0, -1)} encontrado`
            }}
          </h3>
          <p class="text-gray-600 mb-6">
            {{
              searchQuery
                ? `Tente ajustar os termos de pesquisa ou filtros.`
                : `Comece por criar o primeiro ${displayName.toLowerCase().slice(0, -1)}.`
            }}
          </p>
          <router-link
            v-if="!searchQuery"
            :to="{ name: `${contentType}-create` }"
            class="btn-primary inline-flex items-center"
          >
            <svg
              class="w-5 h-5 mr-2"
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
            Criar {{ displayName.slice(0, -1) }}
          </router-link>
        </div>

        <!-- Error state -->
        <div
          v-else-if="error"
          class="text-center py-12"
        >
          <div class="text-6xl mb-4">
            ⚠️
          </div>
          <h3 class="text-lg font-medium text-red-900 mb-2">
            Erro ao carregar dados
          </h3>
          <p class="text-red-600 mb-6">
            {{ error }}
          </p>
          <button
            class="btn-primary inline-flex items-center"
            @click="refresh"
          >
            <svg
              class="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Tentar novamente
          </button>
        </div>

        <!-- Content items -->
        <div
          v-else
          class="space-y-3"
        >
          <ContentCard
            v-for="item in displayItems"
            :key="item.id"
            :title="item.title"
            :subtitle="item.subtitle"
            :description="item.description"
            :content-type="contentType"
            :created-at="item.createdAt"
            :updated-at="item.updatedAt"
            :status="item.status"
            :show-metadata="true"
            @click="navigateToDetail(item.id)"
          >
            <template #actions>
              <div class="flex items-center space-x-2">
                <button
                  class="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors duration-200 touch-target"
                  :aria-label="`Editar ${displayName.slice(0, -1)}`"
                  @click.stop="navigateToEdit(item.id)"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200 touch-target"
                  :aria-label="`Ver detalhes de ${displayName.slice(0, -1)}`"
                  @click.stop="navigateToDetail(item.id)"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </template>
          </ContentCard>
        </div>

        <!-- Pagination -->
        <div
          v-if="totalItems > 0"
          class="pt-6"
        >
          <div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <!-- Page navigation (shown first on mobile for quick access) -->
            <div
              v-if="totalPages > 1"
              class="flex items-center gap-1 order-1 sm:order-2"
            >
              <button
                :disabled="currentPage === 1"
                class="flex items-center justify-center w-11 h-11 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
                aria-label="Página anterior"
                @click="previousPage"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <span class="px-4 py-2 text-sm font-medium text-gray-700 select-none">
                {{ currentPage }} / {{ totalPages }}
              </span>

              <button
                :disabled="currentPage === totalPages"
                class="flex items-center justify-center w-11 h-11 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
                aria-label="Próxima página"
                @click="nextPage"
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            <!-- Results count + per page selector -->
            <div class="flex items-center gap-3 order-2 sm:order-1">
              <span class="text-sm text-gray-500">
                {{ startItem }}–{{ endItem }} de {{ totalItems }}
              </span>

              <span class="text-gray-300">|</span>

              <select
                :value="itemsPerPage"
                class="text-sm border border-gray-300 rounded-lg px-3 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
                style="min-height: 44px"
                aria-label="Resultados por página"
                @change="handleItemsPerPageChange(Number(($event.target as HTMLSelectElement).value))"
              >
                <option :value="10">
                  10 / pág
                </option>
                <option :value="20">
                  20 / pág
                </option>
                <option :value="50">
                  50 / pág
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { BaseContent, ContentType } from '@clever/shared';
import { getContentTypeDisplayName, getContentTypeIcon } from '../../router';
import { useContent } from '../../composables/useContent';
import SearchBar from '../../components/common/SearchBar.vue';
import ContentCard from '../../components/common/ContentCard.vue';

const route = useRoute();
const router = useRouter();

// Computed properties
const contentType = computed(() => route.meta.contentType as ContentType);
const displayName = computed(() => getContentTypeDisplayName(contentType.value));
const contentIcon = computed(() => getContentTypeIcon(contentType.value));

// Use content composable for API integration
const {
  items,
  isLoading,
  error,
  searchQuery,
  currentPage,
  totalItems,
  filteredItems,
  paginatedItems,
  totalPages,
  search,
  goToPage,
  refresh,
} = useContent<BaseContent>({
  contentType: contentType.value,
  autoLoad: true,
});

// Transform items for display
const displayItems = computed(() => {
  return paginatedItems.value.map(item => ({
    id: item.uuid,
    title:
      item.data.name ||
      item.data.title ||
      `${displayName.value.slice(0, -1)} #${item.uuid.slice(0, 8)}`,
    subtitle: item.data.subtitle || item.data.description || '',
    description: item.data.description || '',
    status: item.data.status || 'active',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
});

const filters = computed(() => [
  { key: 'active', label: 'Ativo', active: false, count: 0 },
  { key: 'pending', label: 'Pendente', active: false, count: 0 },
  { key: 'inactive', label: 'Inativo', active: false, count: 0 },
]);

const startItem = computed(() => {
  if (totalItems.value === 0) return 0;
  return (currentPage.value - 1) * itemsPerPage.value + 1;
});

const endItem = computed(() => {
  const end = currentPage.value * itemsPerPage.value;
  return Math.min(end, totalItems.value);
});

// Methods
const handleSearch = (query: string) => {
  search(query);
};

const handleFilter = (updatedFilters: any[]) => {
  // Filter logic will be implemented when needed
};

const handleItemsPerPageChange = (limit: number) => {
  itemsPerPage.value = limit;
  currentPage.value = 1;
  refresh();
};

const navigateToDetail = (id: string) => {
  router.push({ name: `${contentType.value}-detail`, params: { id } });
};

const navigateToEdit = (id: string) => {
  router.push({ name: `${contentType.value}-edit`, params: { id } });
};

const previousPage = () => {
  if (currentPage.value > 1) {
    goToPage(currentPage.value - 1);
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    goToPage(currentPage.value + 1);
  }
};

// Watch for route changes to reload data
watch(
  () => route.meta.contentType,
  () => {
    refresh();
  }
);
</script>

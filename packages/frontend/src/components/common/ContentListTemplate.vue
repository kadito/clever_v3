<template>
  <div class="content-list-container p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto">
      <!-- Mobile-first header -->
      <header class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center space-x-3">
            <BackButton :to="backRoute" variant="inline" />
            <div>
              <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
                {{ displayName }}
                <span
                  v-if="!isLoading && totalCount !== null"
                  class="text-lg text-gray-500 font-normal"
                >
                  ({{ totalCount }})
                </span>
              </h1>
            </div>
          </div>

          <!-- Create button - desktop -->
          <button
            v-if="showCreateButton"
            @click="handleCreate"
            class="btn-primary hidden sm:inline-flex items-center"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            {{ createButtonText }}
          </button>
        </div>
      </header>

      <!-- Mobile-optimized search -->
      <div class="mb-6">
        <SearchBar
          :model-value="localSearchQuery"
          @update:model-value="localSearchQuery = $event"
          :placeholder="searchPlaceholder"
          :debounce-ms="300"
          @search="handleSearch"
          @clear="handleClearSearch"
        />
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="space-y-3">
        <div v-for="i in 5" :key="i" class="loading-skeleton h-20 rounded-touch"></div>
      </div>

      <!-- Error state -->
      <ErrorComponent v-else-if="error" :error="error" @close="clearError" />

      <!-- Empty state -->
      <div v-else-if="displayedItems.length === 0" class="empty-state">
        <div class="text-6xl mb-4">{{ emptyIcon }}</div>
        <h3 class="empty-title">
          {{ searchQuery ? 'Nenhum resultado encontrado' : emptyTitle }}
        </h3>
        <p class="empty-message">
          {{ searchQuery ? emptySearchMessage : emptyMessage }}
        </p>
        <button
          v-if="!searchQuery && showCreateButton"
          @click="handleCreate"
          class="btn-primary inline-flex items-center"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          {{ createButtonText }}
        </button>
      </div>

      <!-- Content list -->
      <div v-else class="content-list">
        <div
          v-for="item in displayedItems"
          :key="item.uuid"
          class="content-list-item"
          @click="handleItemClick(item)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <!-- Main content -->
              <div class="flex items-start space-x-3">
                <!-- Icon/Avatar slot -->
                <div v-if="$slots.itemIcon" class="flex-shrink-0 mt-1">
                  <slot name="itemIcon" :item="item" />
                </div>

                <div class="flex-1 min-w-0">
                  <!-- Title -->
                  <h3 class="text-base font-semibold text-gray-900 truncate">
                    <slot name="itemTitle" :item="item">
                      {{ getItemTitle(item) }}
                    </slot>
                  </h3>

                  <!-- Subtitle -->
                  <p v-if="getItemSubtitle(item)" class="text-sm text-gray-600 truncate mt-1">
                    <slot name="itemSubtitle" :item="item">
                      {{ getItemSubtitle(item) }}
                    </slot>
                  </p>

                  <!-- Meta information -->
                  <div class="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                    <slot name="itemMeta" :item="item">
                      <span v-if="getItemMeta1(item)">{{ getItemMeta1(item) }}</span>
                      <span v-if="getItemMeta2(item)" class="before:content-['•'] before:mx-1">
                        {{ getItemMeta2(item) }}
                      </span>
                    </slot>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center space-x-1 ml-3">
              <slot name="itemActions" :item="item">
                <button
                  @click.stop="handleEdit(item)"
                  class="p-2 text-gray-400 hover:text-primary-600 rounded-touch hover:bg-primary-50 transition-colors duration-200 touch-target"
                  :aria-label="`Editar ${displayName.slice(0, -1).toLowerCase()}`"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  @click.stop="handleItemClick(item)"
                  class="p-2 text-gray-400 hover:text-gray-600 rounded-touch hover:bg-gray-100 transition-colors duration-200 touch-target"
                  :aria-label="`Ver detalhes de ${displayName.slice(0, -1).toLowerCase()}`"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </slot>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination (if needed) -->
      <div
        v-if="showPagination && totalPages > 1"
        class="flex items-center justify-between pt-6 border-t border-gray-200 mt-6"
      >
        <div class="text-sm text-gray-700">
          Mostrando {{ startItem }} a {{ endItem }} de {{ totalCount }} resultados
        </div>

        <div class="flex items-center space-x-2">
          <button
            @click="handlePreviousPage"
            :disabled="currentPage === 1"
            class="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-touch hover:bg-gray-100 transition-colors duration-200 touch-target"
            aria-label="Página anterior"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <span class="px-3 py-1 text-sm font-medium text-gray-700">
            {{ currentPage }} de {{ totalPages }}
          </span>

          <button
            @click="handleNextPage"
            :disabled="currentPage === totalPages"
            class="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-touch hover:bg-gray-100 transition-colors duration-200 touch-target"
            aria-label="Próxima página"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile FAB -->
    <button
      v-if="showCreateButton"
      @click="handleCreate"
      class="fab sm:hidden"
      :aria-label="createButtonText"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { BaseContent } from '@clever/shared';
import BackButton from './BackButton.vue';
import SearchBar from './SearchBar.vue';
import ErrorComponent from './ErrorComponent.vue';

interface Props {
  // Content data
  items: BaseContent[];
  isLoading?: boolean;
  error?: string | null;

  // Display configuration
  displayName: string;
  description?: string;
  backRoute?: string;

  // Search configuration
  searchQuery?: string;
  searchPlaceholder?: string;

  // Pagination
  currentPage?: number;
  totalPages?: number;
  totalCount?: number | null;
  showPagination?: boolean;

  // Create button
  showCreateButton?: boolean;
  createButtonText?: string;

  // Empty state
  emptyIcon?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  emptySearchMessage?: string;

  // Item display functions
  getItemTitle?: (item: BaseContent) => string;
  getItemSubtitle?: (item: BaseContent) => string;
  getItemMeta1?: (item: BaseContent) => string;
  getItemMeta2?: (item: BaseContent) => string;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: null,
  backRoute: '/',
  searchQuery: '',
  searchPlaceholder: 'Pesquisar...',
  currentPage: 1,
  totalPages: 1,
  totalCount: null,
  showPagination: false,
  showCreateButton: true,
  createButtonText: 'Criar Novo',
  emptyIcon: '📄',
  emptyTitle: 'Nenhum item encontrado',
  emptyMessage: 'Não há itens cadastrados no sistema.',
  emptySearchMessage: 'Tente ajustar os termos de pesquisa.',
  getItemTitle: (item: BaseContent) =>
    item.data.name || item.data.title || `Item #${item.uuid.slice(0, 8)}`,
  getItemSubtitle: (item: BaseContent) => item.data.subtitle || item.data.description || '',
  getItemMeta1: (item: BaseContent) => {
    const date = new Date(item.createdAt);
    return date.toLocaleDateString('pt-PT');
  },
  getItemMeta2: (item: BaseContent) => item.data.status || '',
});

const emit = defineEmits<{
  // Search events
  search: [query: string];
  clearSearch: [];

  // Navigation events
  itemClick: [item: BaseContent];
  create: [];
  edit: [item: BaseContent];

  // Pagination events
  pageChange: [page: number];

  // Error handling
  clearError: [];
}>();

// Local search query for debouncing
const localSearchQuery = ref(props.searchQuery);

// Computed properties
const displayedItems = computed(() => props.items);

const startItem = computed(() => {
  if (!props.totalCount || props.totalCount === 0) return 0;
  return (props.currentPage - 1) * 10 + 1;
});

const endItem = computed(() => {
  if (!props.totalCount) return 0;
  const end = props.currentPage * 10;
  return Math.min(end, props.totalCount);
});

// Watch for external search query changes
watch(
  () => props.searchQuery,
  newValue => {
    localSearchQuery.value = newValue;
  }
);

// Event handlers
const handleSearch = (query: string) => {
  emit('search', query);
};

const handleClearSearch = () => {
  localSearchQuery.value = '';
  emit('clearSearch');
};

const handleItemClick = (item: BaseContent) => {
  emit('itemClick', item);
};

const handleCreate = () => {
  emit('create');
};

const handleEdit = (item: BaseContent) => {
  emit('edit', item);
};

const handlePreviousPage = () => {
  if (props.currentPage > 1) {
    emit('pageChange', props.currentPage - 1);
  }
};

const handleNextPage = () => {
  if (props.currentPage < props.totalPages) {
    emit('pageChange', props.currentPage + 1);
  }
};

const clearError = () => {
  emit('clearError');
};
</script>

<style scoped>
/* Mobile-first responsive design */
.content-list-container {
  /* Ensure proper spacing on mobile */
  padding-bottom: 80px; /* Account for FAB */
}

.content-list-item {
  @apply bg-white rounded-touch border border-gray-200 p-4 transition-all duration-200 cursor-pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.content-list-item:hover {
  @apply transform -translate-y-0.5 border-primary-200;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.content-list-item:active {
  @apply transform scale-95;
}

/* Touch-friendly interactions */
@media (hover: none) {
  .content-list-item:hover {
    @apply transform-none border-gray-200;
  }

  .content-list-item:active {
    @apply bg-gray-50;
  }
}

/* Loading skeleton animation */
.loading-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Responsive adjustments */
@media (min-width: 768px) {
  .content-list-container {
    padding-bottom: 2rem;
  }

  .content-list {
    @apply grid grid-cols-1 gap-4;
  }
}

@media (min-width: 1024px) {
  .content-list {
    @apply grid-cols-2 gap-6;
  }
}

/* Accessibility improvements */
.content-list-item:focus {
  @apply outline-none ring-2 ring-primary-500 ring-offset-2;
}

/* Portuguese text optimization */
.content-list-item {
  @apply text-portuguese;
}
</style>

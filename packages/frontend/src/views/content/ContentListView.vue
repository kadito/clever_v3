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
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
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
        <div v-if="isLoading" class="space-y-4">
          <div v-for="i in 3" :key="i" class="animate-pulse">
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <div class="flex items-start space-x-3">
                <div class="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Empty state -->
        <div v-else-if="filteredItems.length === 0" class="text-center py-12">
          <div class="text-6xl mb-4">{{ contentIcon }}</div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            {{ searchQuery ? 'Nenhum resultado encontrado' : `Nenhum ${displayName.toLowerCase().slice(0, -1)} encontrado` }}
          </h3>
          <p class="text-gray-600 mb-6">
            {{ searchQuery 
              ? `Tente ajustar os termos de pesquisa ou filtros.`
              : `Comece por criar o primeiro ${displayName.toLowerCase().slice(0, -1)}.`
            }}
          </p>
          <router-link
            v-if="!searchQuery"
            :to="{ name: `${contentType}-create` }"
            class="btn-primary inline-flex items-center"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Criar {{ displayName.slice(0, -1) }}
          </router-link>
        </div>
        
        <!-- Content items -->
        <div v-else class="space-y-3">
          <ContentCard
            v-for="item in paginatedItems"
            :key="item.id"
            :title="item.title || item.name || `${displayName.slice(0, -1)} #${item.id}`"
            :subtitle="item.subtitle || item.description"
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
                  @click.stop="navigateToEdit(item.id)"
                  class="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors duration-200 touch-target"
                  :aria-label="`Editar ${displayName.slice(0, -1)}`"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click.stop="navigateToDetail(item.id)"
                  class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200 touch-target"
                  :aria-label="`Ver detalhes de ${displayName.slice(0, -1)}`"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </template>
          </ContentCard>
        </div>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between pt-6">
          <div class="text-sm text-gray-700">
            Mostrando {{ startItem }} a {{ endItem }} de {{ totalItems }} resultados
          </div>
          
          <div class="flex items-center space-x-2">
            <button
              @click="previousPage"
              :disabled="currentPage === 1"
              class="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 transition-colors duration-200 touch-target"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <span class="px-3 py-1 text-sm font-medium text-gray-700">
              {{ currentPage }} de {{ totalPages }}
            </span>
            
            <button
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 transition-colors duration-200 touch-target"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getContentTypeDisplayName, getContentTypeIcon } from '../../router'
import SearchBar from '../../components/common/SearchBar.vue'
import ContentCard from '../../components/common/ContentCard.vue'

const route = useRoute()
const router = useRouter()

// Reactive data
const isLoading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Mock data for demonstration - will be replaced with API calls
const mockItems = ref([
  {
    id: '1',
    title: `${getContentTypeDisplayName(route.meta.contentType as string).slice(0, -1)} de Exemplo 1`,
    subtitle: 'Subtítulo de exemplo',
    description: 'Esta é uma descrição de exemplo para demonstrar o layout.',
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: `${getContentTypeDisplayName(route.meta.contentType as string).slice(0, -1)} de Exemplo 2`,
    subtitle: 'Outro subtítulo',
    description: 'Outra descrição de exemplo com mais texto para testar o layout.',
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
])

// Computed properties
const contentType = computed(() => route.meta.contentType as string)
const displayName = computed(() => getContentTypeDisplayName(contentType.value))
const contentIcon = computed(() => getContentTypeIcon(contentType.value))

const filters = computed(() => [
  { key: 'active', label: 'Ativo', active: false, count: 1 },
  { key: 'pending', label: 'Pendente', active: false, count: 1 },
  { key: 'inactive', label: 'Inativo', active: false, count: 0 }
])

const filteredItems = computed(() => {
  let items = mockItems.value
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.subtitle?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    )
  }
  
  // Apply status filters (when implemented)
  // const activeFilters = filters.value.filter(f => f.active)
  // if (activeFilters.length > 0) {
  //   items = items.filter(item => activeFilters.some(f => item.status === f.key))
  // }
  
  return items
})

const totalItems = computed(() => filteredItems.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredItems.value.slice(start, end)
})

const startItem = computed(() => {
  if (totalItems.value === 0) return 0
  return (currentPage.value - 1) * itemsPerPage.value + 1
})

const endItem = computed(() => {
  const end = currentPage.value * itemsPerPage.value
  return Math.min(end, totalItems.value)
})

// Methods
const handleSearch = (query: string) => {
  searchQuery.value = query
  currentPage.value = 1 // Reset to first page on search
}

const handleFilter = (updatedFilters: any[]) => {
  // Update filters and reset pagination
  currentPage.value = 1
  // Filter logic will be implemented when API is connected
}

const navigateToDetail = (id: string) => {
  router.push({ name: `${contentType.value}-detail`, params: { id } })
}

const navigateToEdit = (id: string) => {
  router.push({ name: `${contentType.value}-edit`, params: { id } })
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const loadData = async () => {
  isLoading.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    // API call will be implemented in subsequent tasks
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    isLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>
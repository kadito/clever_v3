<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="max-w-4xl mx-auto">
      <!-- Page header -->
      <header class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div class="flex-1">
            <!-- Breadcrumb -->
            <nav class="mb-3">
              <ol class="flex items-center space-x-2 text-sm text-gray-500">
                <li>
                  <router-link 
                    :to="{ name: `${contentType}-list` }"
                    class="hover:text-primary-600 transition-colors duration-200"
                  >
                    {{ displayName }}
                  </router-link>
                </li>
                <li>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </li>
                <li class="text-gray-900 font-medium">
                  Detalhes
                </li>
              </ol>
            </nav>
            
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {{ itemTitle }}
            </h1>
            <p class="text-gray-600">
              ID: {{ route.params.id }}
            </p>
          </div>
          
          <!-- Action buttons -->
          <div class="flex flex-col sm:flex-row gap-3">
            <router-link 
              :to="{ name: `${contentType}-edit`, params: { id: route.params.id } }"
              class="btn-primary inline-flex items-center justify-center"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </router-link>
            
            <router-link 
              :to="{ name: `${contentType}-list` }"
              class="btn-outline inline-flex items-center justify-center"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar à Lista
            </router-link>
          </div>
        </div>
      </header>
      
      <!-- Loading state -->
      <div v-if="isLoading" class="animate-pulse space-y-6">
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <div class="space-y-4">
            <div class="h-4 bg-gray-200 rounded w-1/4"></div>
            <div class="h-6 bg-gray-200 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <div class="space-y-3">
            <div class="h-4 bg-gray-200 rounded w-full"></div>
            <div class="h-4 bg-gray-200 rounded w-5/6"></div>
            <div class="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
      
      <!-- Content -->
      <div v-else class="space-y-6">
        <!-- Main information card -->
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <div class="flex items-start space-x-4">
            <!-- Icon -->
            <div class="flex-shrink-0">
              <div class="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                <span class="text-primary-600 text-2xl">{{ contentIcon }}</span>
              </div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 min-w-0">
              <h2 class="text-xl font-semibold text-gray-900 mb-2">
                {{ itemData.title || itemData.name || `${displayName.slice(0, -1)} #${route.params.id}` }}
              </h2>
              
              <p v-if="itemData.description" class="text-gray-600 mb-4">
                {{ itemData.description }}
              </p>
              
              <!-- Status badge -->
              <div v-if="itemData.status" class="inline-flex items-center">
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatusClasses(itemData.status)"
                >
                  <span 
                    class="w-1.5 h-1.5 rounded-full mr-1.5"
                    :class="getStatusDotClasses(itemData.status)"
                  ></span>
                  {{ getStatusLabel(itemData.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Details sections -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Basic information -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              Informações Básicas
            </h3>
            
            <dl class="space-y-3">
              <div v-for="(value, key) in basicInfo" :key="key" class="flex justify-between">
                <dt class="text-sm font-medium text-gray-500">{{ key }}:</dt>
                <dd class="text-sm text-gray-900">{{ value || '-' }}</dd>
              </div>
            </dl>
          </div>
          
          <!-- Metadata -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              Metadados
            </h3>
            
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-sm font-medium text-gray-500">Criado em:</dt>
                <dd class="text-sm text-gray-900">{{ formatDate(itemData.createdAt) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm font-medium text-gray-500">Atualizado em:</dt>
                <dd class="text-sm text-gray-900">{{ formatDate(itemData.updatedAt) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm font-medium text-gray-500">Criado por:</dt>
                <dd class="text-sm text-gray-900">{{ itemData.createdBy || 'Sistema' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm font-medium text-gray-500">Versão:</dt>
                <dd class="text-sm text-gray-900">{{ itemData.version || '1' }}</dd>
              </div>
            </dl>
          </div>
        </div>
        
        <!-- Additional content sections -->
        <div v-if="itemData.additionalData" class="bg-white rounded-lg border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Dados Adicionais
          </h3>
          
          <div class="prose prose-sm max-w-none">
            <pre class="bg-gray-50 rounded-lg p-4 text-xs overflow-x-auto">{{ JSON.stringify(itemData.additionalData, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getContentTypeDisplayName, getContentTypeIcon } from '../../router'

const route = useRoute()

// Reactive data
const isLoading = ref(false)

// Mock data for demonstration - will be replaced with API calls
const itemData = ref({
  id: route.params.id,
  title: `${getContentTypeDisplayName(route.meta.contentType as string).slice(0, -1)} de Exemplo`,
  name: `${getContentTypeDisplayName(route.meta.contentType as string).slice(0, -1)} #${route.params.id}`,
  description: 'Esta é uma descrição de exemplo para demonstrar como os detalhes são apresentados no sistema.',
  status: 'active' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'Utilizador de Exemplo',
  version: 1,
  additionalData: {
    campo1: 'Valor de exemplo 1',
    campo2: 'Valor de exemplo 2',
    campo3: 42,
    campo4: true
  }
})

// Computed properties
const contentType = computed(() => route.meta.contentType as string)
const displayName = computed(() => getContentTypeDisplayName(contentType.value))
const contentIcon = computed(() => getContentTypeIcon(contentType.value))

const itemTitle = computed(() => {
  return itemData.value.title || itemData.value.name || `${displayName.value.slice(0, -1)} #${route.params.id}`
})

const basicInfo = computed(() => {
  const info: Record<string, any> = {}
  
  // Extract basic fields (excluding metadata and system fields)
  const excludeFields = ['id', 'createdAt', 'updatedAt', 'createdBy', 'version', 'additionalData', 'status']
  
  Object.entries(itemData.value).forEach(([key, value]) => {
    if (!excludeFields.includes(key) && value !== null && value !== undefined) {
      // Format field names
      const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
      info[formattedKey] = value
    }
  })
  
  return info
})

// Methods
const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: 'Ativo',
    inactive: 'Inativo',
    pending: 'Pendente',
    error: 'Erro'
  }
  
  return labels[status] || status
}

const getStatusClasses = (status: string): string => {
  const classes: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  }
  
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const getStatusDotClasses = (status: string): string => {
  const classes: Record<string, string> = {
    active: 'bg-green-400',
    inactive: 'bg-gray-400',
    pending: 'bg-yellow-400',
    error: 'bg-red-400'
  }
  
  return classes[status] || 'bg-gray-400'
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
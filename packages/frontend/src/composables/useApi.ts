import { ref, computed, type Ref } from 'vue'
import { apiService, mobileApiService, isMobileConnection, type ApiError, type SearchParams } from '../services/api'
import type { ApiResponse, ListResponse, BaseContent, ContentType } from '@clever/shared'

// Loading states interface
interface LoadingStates {
  loading: Ref<boolean>
  creating: Ref<boolean>
  updating: Ref<boolean>
  deleting: Ref<boolean>
}

// API composable return type
interface UseApiReturn<T extends BaseContent> {
  // Data
  items: Ref<T[]>
  currentItem: Ref<T | null>
  error: Ref<ApiError | null>
  
  // Loading states
  loading: LoadingStates
  
  // Pagination
  pagination: Ref<{
    page: number
    limit: number
    total: number
    totalPages: number
  }>
  
  // Methods
  fetchList: (params?: SearchParams) => Promise<void>
  fetchById: (id: string) => Promise<void>
  create: (data: Partial<T>) => Promise<T | null>
  update: (id: string, data: Partial<T>) => Promise<T | null>
  remove: (id: string) => Promise<boolean>
  search: (query: string, params?: Omit<SearchParams, 'search'>) => Promise<void>
  clearError: () => void
  refresh: () => Promise<void>
  
  // Computed
  hasError: Ref<boolean>
  isEmpty: Ref<boolean>
  isNetworkError: Ref<boolean>
  isRetryableError: Ref<boolean>
}

/**
 * Composable for API operations with mobile-optimized error handling
 */
export function useApi<T extends BaseContent>(contentType: ContentType): UseApiReturn<T> {
  // Choose API service based on connection
  const service = isMobileConnection() ? mobileApiService : apiService
  
  // Reactive state
  const items = ref<T[]>([]) as Ref<T[]>
  const currentItem = ref<T | null>(null) as Ref<T | null>
  const error = ref<ApiError | null>(null)
  
  // Loading states
  const loading = {
    loading: ref(false),
    creating: ref(false),
    updating: ref(false),
    deleting: ref(false)
  }
  
  // Pagination state
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  
  // Last search parameters for refresh functionality
  const lastSearchParams = ref<SearchParams>({})
  
  // Computed properties
  const hasError = computed(() => error.value !== null)
  const isEmpty = computed(() => items.value.length === 0 && !loading.loading.value)
  const isNetworkError = computed(() => error.value?.isNetworkError === true)
  const isRetryableError = computed(() => error.value?.isRetryable === true)
  
  // Error handling utility
  const handleError = (err: any) => {
    console.error(`API Error for ${contentType}:`, err)
    error.value = err as ApiError
  }
  
  const clearError = () => {
    error.value = null
  }
  
  // API Methods
  
  /**
   * Fetch list of items with search and pagination
   */
  const fetchList = async (params: SearchParams = {}) => {
    loading.loading.value = true
    clearError()
    lastSearchParams.value = params
    
    try {
      const response = await service.getContentList<T>(contentType, params)
      
      if (response.success && response.data) {
        items.value = response.data
        
        if (response.pagination) {
          pagination.value = {
            page: response.pagination.page,
            limit: response.pagination.limit,
            total: response.pagination.total,
            totalPages: Math.ceil(response.pagination.total / response.pagination.limit)
          }
        }
      } else {
        throw new Error(response.error || 'Failed to fetch items')
      }
    } catch (err) {
      handleError(err)
      items.value = []
    } finally {
      loading.loading.value = false
    }
  }
  
  /**
   * Fetch single item by ID
   */
  const fetchById = async (id: string) => {
    loading.loading.value = true
    clearError()
    
    try {
      const response = await service.getContentById<T>(contentType, id)
      
      if (response.success && response.data) {
        currentItem.value = response.data
      } else {
        throw new Error(response.error || 'Failed to fetch item')
      }
    } catch (err) {
      handleError(err)
      currentItem.value = null
    } finally {
      loading.loading.value = false
    }
  }
  
  /**
   * Create new item
   */
  const create = async (data: Partial<T>): Promise<T | null> => {
    loading.creating.value = true
    clearError()
    
    try {
      const response = await service.createContent<T>(contentType, data)
      
      if (response.success && response.data) {
        // Add to local items list if we have one
        if (items.value.length > 0) {
          items.value.unshift(response.data)
        }
        
        return response.data
      } else {
        throw new Error(response.error || 'Failed to create item')
      }
    } catch (err) {
      handleError(err)
      return null
    } finally {
      loading.creating.value = false
    }
  }
  
  /**
   * Update existing item
   */
  const update = async (id: string, data: Partial<T>): Promise<T | null> => {
    loading.updating.value = true
    clearError()
    
    try {
      const response = await service.updateContent<T>(contentType, id, data)
      
      if (response.success && response.data) {
        // Update in local items list
        const index = items.value.findIndex(item => item.uuid === id)
        if (index !== -1) {
          items.value[index] = response.data
        }
        
        // Update current item if it matches
        if (currentItem.value?.uuid === id) {
          currentItem.value = response.data
        }
        
        return response.data
      } else {
        throw new Error(response.error || 'Failed to update item')
      }
    } catch (err) {
      handleError(err)
      return null
    } finally {
      loading.updating.value = false
    }
  }
  
  /**
   * Delete item (soft delete)
   */
  const remove = async (id: string): Promise<boolean> => {
    loading.deleting.value = true
    clearError()
    
    try {
      const response = await service.deleteContent(contentType, id)
      
      if (response.success) {
        // Remove from local items list
        const index = items.value.findIndex(item => item.uuid === id)
        if (index !== -1) {
          items.value.splice(index, 1)
        }
        
        // Clear current item if it matches
        if (currentItem.value?.uuid === id) {
          currentItem.value = null
        }
        
        // Update pagination total
        if (pagination.value.total > 0) {
          pagination.value.total--
          pagination.value.totalPages = Math.ceil(pagination.value.total / pagination.value.limit)
        }
        
        return true
      } else {
        throw new Error(response.error || 'Failed to delete item')
      }
    } catch (err) {
      handleError(err)
      return false
    } finally {
      loading.deleting.value = false
    }
  }
  
  /**
   * Search items
   */
  const search = async (query: string, params: Omit<SearchParams, 'search'> = {}) => {
    const searchParams = { ...params, search: query }
    await fetchList(searchParams)
  }
  
  /**
   * Refresh current data
   */
  const refresh = async () => {
    if (currentItem.value) {
      await fetchById(currentItem.value.uuid)
    } else {
      await fetchList(lastSearchParams.value)
    }
  }
  
  return {
    // Data
    items,
    currentItem,
    error,
    
    // Loading states
    loading,
    
    // Pagination
    pagination,
    
    // Methods
    fetchList,
    fetchById,
    create,
    update,
    remove,
    search,
    clearError,
    refresh,
    
    // Computed
    hasError,
    isEmpty,
    isNetworkError,
    isRetryableError
  }
}

/**
 * Composable for global API status and health checks
 */
export function useApiStatus() {
  const isOnline = ref(navigator.onLine)
  const apiHealthy = ref(true)
  const lastHealthCheck = ref<Date | null>(null)
  
  // Listen for online/offline events
  const updateOnlineStatus = () => {
    isOnline.value = navigator.onLine
  }
  
  if (typeof window !== 'undefined') {
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
  }
  
  // Health check method
  const checkApiHealth = async (): Promise<boolean> => {
    try {
      const healthy = await apiService.healthCheck()
      apiHealthy.value = healthy
      lastHealthCheck.value = new Date()
      return healthy
    } catch {
      apiHealthy.value = false
      lastHealthCheck.value = new Date()
      return false
    }
  }
  
  // Computed properties
  const canMakeRequests = computed(() => isOnline.value && apiHealthy.value)
  const connectionStatus = computed(() => {
    if (!isOnline.value) return 'offline'
    if (!apiHealthy.value) return 'api-error'
    return 'online'
  })
  
  return {
    isOnline,
    apiHealthy,
    lastHealthCheck,
    canMakeRequests,
    connectionStatus,
    checkApiHealth
  }
}

// Export types
export type { LoadingStates, UseApiReturn }
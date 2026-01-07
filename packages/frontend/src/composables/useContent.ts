import { ref, computed, type Ref, type ComputedRef } from 'vue';
import type { BaseContent, ContentType, ApiResponse, ListResponse } from '@clever/shared';
import { apiService } from '../services/api';

export interface UseContentOptions {
  contentType: ContentType;
  autoLoad?: boolean;
}

export function useContent<T extends BaseContent>(options: UseContentOptions): any {
  const { contentType, autoLoad = true } = options;

  // Reactive state
  const items = ref<T[]>([]);
  const currentItem = ref<T | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const searchQuery = ref('');
  const currentPage = ref(1);
  const itemsPerPage = ref(10);
  const totalItems = ref(0);

  // Computed properties
  const filteredItems = computed(() => {
    if (!searchQuery.value) return items.value;
    
    const query = searchQuery.value.toLowerCase();
    return items.value.filter(item => {
      const searchableText = JSON.stringify(item.data).toLowerCase();
      return searchableText.includes(query);
    });
  });

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return filteredItems.value.slice(start, end);
  });

  const totalPages = computed(() => 
    Math.ceil(filteredItems.value.length / itemsPerPage.value)
  );

  // Methods
  const loadItems = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await apiService.getContentList<T>(contentType, {
        page: currentPage.value,
        limit: itemsPerPage.value,
        search: searchQuery.value || undefined,
      });

      if (response.success && response.data) {
        items.value = response.data;
        totalItems.value = response.pagination?.total || response.data.length;
      } else {
        throw new Error(response.error || 'Failed to load items');
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error loading items:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const loadItem = async (id: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await apiService.getContentById<T>(contentType, id);

      if (response.success && response.data) {
        currentItem.value = response.data;
      } else {
        throw new Error(response.error || 'Failed to load item');
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error loading item:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const createItem = async (data: Partial<T>) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await apiService.createContent<T>(contentType, data);

      if (response.success && response.data) {
        (items.value as T[]).unshift(response.data);
        totalItems.value++;
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create item');
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error creating item:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateItem = async (id: string, data: Partial<T>) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await apiService.updateContent<T>(contentType, id, data);

      if (response.success && response.data) {
        const index = items.value.findIndex(item => item.uuid === id);
        if (index !== -1) {
          items.value[index] = { ...items.value[index], ...response.data };
        }
        if (currentItem.value?.uuid === id) {
          currentItem.value = { ...currentItem.value, ...response.data };
        }
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update item');
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error updating item:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteItem = async (id: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await apiService.deleteContent(contentType, id);

      if (response.success) {
        items.value = items.value.filter(item => item.uuid !== id);
        totalItems.value--;
        if (currentItem.value?.uuid === id) {
          currentItem.value = null;
        }
      } else {
        throw new Error(response.error || 'Failed to delete item');
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error deleting item:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const search = (query: string) => {
    searchQuery.value = query;
    currentPage.value = 1;
    if (autoLoad) {
      loadItems();
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page;
      if (autoLoad) {
        loadItems();
      }
    }
  };

  const refresh = () => {
    loadItems();
  };

  // Auto-load on mount if enabled
  if (autoLoad) {
    loadItems();
  }

  return {
    // State
    items,
    currentItem,
    isLoading,
    error,
    searchQuery,
    currentPage,
    itemsPerPage,
    totalItems,

    // Computed
    filteredItems,
    paginatedItems,
    totalPages,

    // Methods
    loadItems,
    loadItem,
    createItem,
    updateItem,
    deleteItem,
    search,
    goToPage,
    refresh,
  };
}
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useMainStore = defineStore('main', () => {
  // State
  const items = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const user = ref({
    name: 'Guest',
    isAuthenticated: false,
  });

  // Getters
  const itemCount = computed(() => items.value.length);
  const hasItems = computed(() => items.value.length > 0);

  // Actions
  async function fetchItems() {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      const result = await response.json();
      items.value = result.data;
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching items:', err);
    } finally {
      loading.value = false;
    }
  }

  async function addItem(item) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      // In a real app, you'd probably refetch or get the new item from the response
      items.value.push({
        id: Date.now(),
        ...item,
      });
    } catch (err) {
      error.value = err.message;
      console.error('Error adding item:', err);
    } finally {
      loading.value = false;
    }
  }

  function clearError() {
    error.value = null;
  }

  function setUser(userData) {
    user.value = { ...userData, isAuthenticated: true };
  }

  function logout() {
    user.value = { name: 'Guest', isAuthenticated: false };
  }

  return {
    // State
    items,
    loading,
    error,
    user,
    // Getters
    itemCount,
    hasItems,
    // Actions
    fetchItems,
    addItem,
    clearError,
    setUser,
    logout,
  };
});

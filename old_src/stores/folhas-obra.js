import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';

export const useFolhasObraStore = defineStore('folhas-obra', () => {
  // State
  const folhas = ref([]);
  const currentYear = ref(new Date().getFullYear());
  const availableYears = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const selectedFolha = ref(null);

  // Getters
  const folhasCount = computed(() => folhas.value.length);
  const hasFolhas = computed(() => folhas.value.length > 0);
  const currentYearString = computed(() => currentYear.value.toString());

  // API Base URL
  const API_BASE = '/api/folhas-obra';

  // Actions
  async function fetchFolhasForYear(year = null) {
    const targetYear = year || currentYear.value;
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_BASE}/${targetYear}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch folhas for year ${targetYear}`);
      }
      const result = await response.json();
      folhas.value = result.data || [];
      currentYear.value = targetYear;
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching folhas:', err);
      folhas.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchAvailableYears() {
    try {
      const response = await fetch(`${API_BASE}/years`);
      if (!response.ok) {
        throw new Error('Failed to fetch available years');
      }
      const result = await response.json();
      availableYears.value = result.years || [];
    } catch (err) {
      console.error('Error fetching years:', err);
      availableYears.value = [];
    }
  }

  async function fetchFolhaById(year, id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_BASE}/${year}/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Folha de obra not found');
        }
        throw new Error('Failed to fetch folha de obra');
      }
      const folha = await response.json();
      selectedFolha.value = folha;
      return folha;
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching folha:', err);
      selectedFolha.value = null;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createFolha(year, folhaData) {
    loading.value = true;
    error.value = null;

    try {
      // Generate UUID for the new folha
      const folhaWithId = {
        ...folhaData,
        id: uuidv4(),
      };

      const response = await fetch(`${API_BASE}/${year}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(folhaWithId),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create folha de obra');
      }

      const newFolha = await response.json();

      // Add to local state if it's for the current year
      if (year === currentYear.value) {
        folhas.value.push(newFolha);
      }

      return newFolha;
    } catch (err) {
      error.value = err.message;
      console.error('Error creating folha:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateFolha(year, id, folhaData) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_BASE}/${year}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(folhaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update folha de obra');
      }

      const updatedFolha = await response.json();

      // Update local state if it's for the current year
      if (year === currentYear.value) {
        const index = folhas.value.findIndex(f => f.id === id);
        if (index !== -1) {
          folhas.value[index] = updatedFolha;
        }
      }

      // Update selected folha if it's the one being edited
      if (selectedFolha.value && selectedFolha.value.id === id) {
        selectedFolha.value = updatedFolha;
      }

      return updatedFolha;
    } catch (err) {
      error.value = err.message;
      console.error('Error updating folha:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteFolha(year, id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_BASE}/${year}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete folha de obra');
      }

      // Remove from local state if it's for the current year
      if (year === currentYear.value) {
        const index = folhas.value.findIndex(f => f.id === id);
        if (index !== -1) {
          folhas.value.splice(index, 1);
        }
      }

      // Clear selected folha if it's the one being deleted
      if (selectedFolha.value && selectedFolha.value.id === id) {
        selectedFolha.value = null;
      }

      const result = await response.json();
      return result;
    } catch (err) {
      error.value = err.message;
      console.error('Error deleting folha:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function searchFolhas(query, year = null) {
    loading.value = true;
    error.value = null;

    try {
      const searchParams = new URLSearchParams({ q: query });
      if (year) {
        searchParams.append('year', year);
      }

      const response = await fetch(`${API_BASE}/search?${searchParams}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      error.value = err.message;
      console.error('Error searching folhas:', err);
      return { results: [], count: 0 };
    } finally {
      loading.value = false;
    }
  }

  function clearError() {
    error.value = null;
  }

  function setCurrentYear(year) {
    currentYear.value = year;
  }

  function clearSelectedFolha() {
    selectedFolha.value = null;
  }

  // Helper function to get year from date string
  function getYearFromDate(dateString) {
    return new Date(dateString).getFullYear();
  }

  return {
    // State
    folhas,
    currentYear,
    availableYears,
    loading,
    error,
    selectedFolha,

    // Getters
    folhasCount,
    hasFolhas,
    currentYearString,

    // Actions
    fetchFolhasForYear,
    fetchAvailableYears,
    fetchFolhaById,
    createFolha,
    updateFolha,
    deleteFolha,
    searchFolhas,
    clearError,
    setCurrentYear,
    clearSelectedFolha,
    getYearFromDate,
  };
});
